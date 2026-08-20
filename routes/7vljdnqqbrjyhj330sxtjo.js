'use strict';
const crypto = require('crypto');
const _K1 = 49900;
const _K2 = 150000;
const _N = 4;
const _M = 2;
const _T = 7 * 24 * 60 * 60 * 1000;
const _G = [
  { x: 5000,   y: 60 },
  { x: 20000,  y: 24 },
  { x: 50000,  y: 10 },
  { x: 100000, y: 4  },
  { x: 150000, y: 2  }
];
function schema(db){
  db.exec(`CREATE TABLE IF NOT EXISTS cx_weekly(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL UNIQUE,total_dep INTEGER NOT NULL DEFAULT 0,pool TEXT NOT NULL DEFAULT '[]',expires INTEGER NOT NULL DEFAULT 0,claimed TEXT NOT NULL DEFAULT '[]',created INTEGER NOT NULL,updated INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS cx_deposits(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,cents INTEGER NOT NULL,src TEXT NOT NULL DEFAULT 'pay',created INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS cx_dep_uid ON cx_deposits(user_id,id DESC);`);
}
function _W(list){
  const t=list.reduce((s,e)=>s+e.y,0);let p=(crypto.randomInt(0,1000000)+Math.random())/1000000*t;
  for(const e of list){p-=e.y;if(p<0)return e;}return list[list.length-1];
}
function _V(CAT){
  const out=[];
  const pool = CAT.filter(c => c && Number(c.priceCents) > 0 && Number(c.priceCents) <= _K2);
  for(let i=0;i<_N;i++){
    const tier=_W(_G.map(z=>({...z})));
    const idx=_G.findIndex(g=>g.x===tier.x);
    const lo=idx===0?100:_G[idx-1].x+1;
    let cs=pool.filter(c=>Number(c.priceCents)>=lo&&Number(c.priceCents)<=tier.x);
    if(!cs.length) cs=pool;
    out.push(cs[crypto.randomInt(0,cs.length)]);
  }
  return out.map(c=>({catalogId:c.catalogId,name:c.name,icon:c.icon,priceCents:c.priceCents,rarity:c.rarity,rarityColor:c.rarityColor,rarityRank:c.rarityRank,weapon:c.weapon,skin:c.skin,wear:c.wear||''}));
}
function _P(db,uid,CAT){
  let r=db.prepare('SELECT * FROM cx_weekly WHERE user_id=?').get(uid);
  const now=Date.now();
  if(!r){
    const tot=Number((db.prepare('SELECT COALESCE(SUM(cents),0) AS t FROM cx_deposits WHERE user_id=?').get(uid)||{}).t||0);
    const unlocked=tot>=_K1;
    const pool=unlocked?_V(CAT):[];
    const exp=unlocked?now+_T:0;
    const info=db.prepare('INSERT INTO cx_weekly(user_id,total_dep,pool,expires,claimed,created,updated) VALUES(?,?,?,?,?,?,?)').run(uid,tot,JSON.stringify(pool),exp,'[]',now,now);
    r=db.prepare('SELECT * FROM cx_weekly WHERE id=?').get(info.lastInsertRowid);
  }
  let pool=[];try{pool=JSON.parse(r.pool||'[]');}catch(e){pool=[];}
  let claimed=[];try{claimed=JSON.parse(r.claimed||'[]');}catch(e){claimed=[];}
  const tot=Number(r.total_dep||0);
  let unlocked=tot>=_K1;
  const expired=unlocked&&r.expires&&now>Number(r.expires);
  if(unlocked&&(!pool.length||expired)){
    pool=_V(CAT);claimed=[];
    const exp=now+_T;
    db.prepare('UPDATE cx_weekly SET pool=?,expires=?,claimed=?,updated=? WHERE id=?').run(JSON.stringify(pool),exp,'[]',now,r.id);
    r=db.prepare('SELECT * FROM cx_weekly WHERE id=?').get(r.id);
  }
  return {unlocked,tot,expires:unlocked?Number(r.expires):null,pool,claimed,left:unlocked?Math.max(0,_M-claimed.length):0};
}
function _R(db,uid,cents,src){
  if(cents<=0)return;
  const now=Date.now();
  db.prepare('INSERT INTO cx_deposits(user_id,cents,src,created) VALUES(?,?,?,?)').run(uid,cents,src||'pay',now);
  const tot=Number((db.prepare('SELECT COALESCE(SUM(cents),0) AS t FROM cx_deposits WHERE user_id=?').get(uid)||{}).t||0);
  const ex=db.prepare('SELECT id FROM cx_weekly WHERE user_id=?').get(uid);
  if(ex) db.prepare('UPDATE cx_weekly SET total_dep=?,updated=? WHERE user_id=?').run(tot,now,uid);
}
module.exports=function(ctx){
  const {app,db,CATALOG,currentUser,withSteamIcon,insertInventoryItem,addLiveDrop,recordTransaction}=ctx;
  schema(db);
  app.get('/api/cx-weekly',(req,res)=>{
    const a=currentUser(req);if(!a)return res.status(401).json({error:'auth'});
    const p=_P(db,a.id,CATALOG);
    res.json({
      unlocked:p.unlocked,total:p.tot,thresh:_K1,expires:p.expires,
      pool:p.pool.map(x=>({...withSteamIcon(x),claimed:p.claimed.indexOf(x.catalogId)!==-1})),
      claimed:p.claimed,left:p.left,pickN:_M
    });
  });
  app.post('/api/cx-weekly/claim/:cid',(req,res)=>{
    const a=currentUser(req);if(!a)return res.status(401).json({error:'auth'});
    const cid=String(req.params.cid||'');
    const p=_P(db,a.id,CATALOG);
    if(!p.unlocked)return res.status(403).json({error:'locked'});
    if(!p.left)return res.status(400).json({error:'limit'});
    const it=p.pool.filter(x=>x.catalogId===cid)[0];
    if(!it)return res.status(404).json({error:'not found'});
    if(p.claimed.indexOf(cid)!==-1)return res.status(400).json({error:'claimed'});
    const claimed=p.claimed.concat([cid]);
    const now=Date.now();
    const iid=insertInventoryItem(a.id,it,'weekly',now);
    db.prepare('UPDATE cx_weekly SET claimed=?,updated=? WHERE user_id=?').run(JSON.stringify(claimed),now,a.id);
    const bal=db.prepare('SELECT balance_cents AS b FROM users WHERE id=?').get(a.id).b;
    const drop=addLiveDrop(a.id,a.name,it,'reward',now);
    res.json({ok:true,item:Object.assign({},withSteamIcon(it),{assetid:String(iid)}),balanceCents:bal,drop,claimed,left:Math.max(0,_M-claimed.length)});
  });
  app.post('/api/cx-sell-all',(req,res)=>{
    const a=currentUser(req);if(!a)return res.status(401).json({error:'auth'});
    const now=Date.now();
    try{
      const r=db.transaction(()=>{
        const items=db.prepare("SELECT id,price_cents,item_name FROM site_inventory WHERE user_id=? AND status='active'").all(a.id);
        if(!items.length)throw new Error('empty');
        let total=0;
        for(const it of items){
          db.prepare("UPDATE site_inventory SET status='sold',updated_at=? WHERE id=?").run(now,it.id);
          db.prepare('INSERT INTO inventory_sales(user_id,inventory_item_id,amount_cents,created_at) VALUES(?,?,?,?)').run(a.id,it.id,it.price_cents,now);
          total+=Number(it.price_cents||0);
        }
        db.prepare('UPDATE users SET balance_cents=balance_cents+?,updated_at=? WHERE id=?').run(total,now,a.id);
        const bal=db.prepare('SELECT balance_cents AS b FROM users WHERE id=?').get(a.id).b;
        db.prepare('INSERT INTO transactions(user_id,kind,amount_cents,balance_after,note,created_at) VALUES(?,?,?,?,?,?)').run(a.id,'sell_all',total,bal,'Sold all: '+items.length,now);
        return{count:items.length,totalCents:total,balanceCents:bal};
      })();
      res.json({ok:true,count:r.count,totalCents:r.totalCents,balanceCents:r.balanceCents});
    }catch(e){res.status(400).json({error:e.message});}
  });
  app.post('/api/cx-deposit',(req,res)=>{
    const a=currentUser(req);if(!a)return res.status(401).json({error:'auth'});
    const amt=Math.round(Number((req.body&&req.body.amountCents)||0));
    if(!Number.isSafeInteger(amt)||amt<5000)return res.status(400).json({error:'min 50 RUB'});
    const now=Date.now();
    const next=Number(a.balance_cents)+amt;
    db.prepare('UPDATE users SET balance_cents=?,updated_at=? WHERE id=?').run(next,now,a.id);
    _R(db,a.id,amt,'pay');
    recordTransaction(a.id,'deposit',amt,next,'Deposit',now);
    res.json({ok:true,amountCents:amt,balanceCents:next});
  });
  return {regDep:_R};
};
