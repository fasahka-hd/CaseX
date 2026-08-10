const S={page:'upgrade',me:null,items:[],inventory:[],drops:[],from:null,to:null,chance:0,spinning:false,online:0,chat:false,tab:'inventory'};
const $=s=>document.querySelector(s);
const money=c=>c==null?'—':(c/100).toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₽';
const rarityByName=n=>n.includes('Knife')||n.includes('Karambit')?'#f5c95c':'#74ffca';

function toast(t){const r=$('#toast-root');r.innerHTML=`<div class="toast">${esc(t)}</div>`;setTimeout(()=>r.innerHTML='',2800)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function img(src){return src?`<img src="${esc(src)}" loading="lazy" onerror="this.style.display='none'">`:''}
function art(it){return `<div class="art" style="--rarity:${rarityByName(it.marketName||it.name)}">${img(it.icon)}</div>`}

async function api(url,opt){const r=await fetch(url,opt);const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||`HTTP ${r.status}`);return j}

async function boot(){
  try{
    const [cfg,me,drops,online]=await Promise.all([api('/api/config'),api('/api/me'),api('/api/live-drops'),api('/api/online')]);
    S.brand=cfg.brand;S.telegram=cfg.telegram;S.me=me;S.drops=drops;S.online=online.online;
    if(me.authenticated){const inv=await api('/api/inventory');S.inventory=inv.items||[]}
    render();events();
  }catch(e){console.error(e);render();toast('Ошибка загрузки данных')}
}
function events(){
  const es=new EventSource('/api/events');
  es.addEventListener('ready',e=>{try{S.online=JSON.parse(e.data).online;render()}catch{}});
  es.addEventListener('drop',e=>{const d=JSON.parse(e.data);S.drops.unshift(d);S.drops=S.drops.slice(0,30);if(S.page==='upgrade')render()});
}

function steamIcon(){return `<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-9.78 8h4.16a6 6 0 1 1-.02 4H2.2A10 10 0 1 0 12 2Zm-3.4 9.15a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Zm5.4-4.05a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"/></svg>`}
function tgIcon(){return `<svg class="tgsvg" viewBox="0 0 24 24"><path d="M21.6 4.2 18.4 19c-.24 1.04-.85 1.3-1.72.81l-4.76-3.5-2.3 2.22c-.25.25-.46.46-.94.46l.34-4.86 8.85-8c.39-.34-.09-.53-.61-.19L6.31 12.7 1.64 11.24c-1.02-.32-1.04-1.02.21-1.49L20.1 2.66c.86-.32 1.61.19 1.5 1.54Z"/></svg>`}

function header(){
  const bal=S.me?.authenticated?money(S.me.user.balanceCents):'0,00 ₽';
  return `<header class="top"><div class="brand">${esc(S.brand||'КЕЙСЕР')}</div>
  <nav class="nav">
  <button class="${S.page==='inventory'?'active':''}" onclick="go('inventory')">ИНВЕНТАРЬ</button>
  <button class="${S.page==='upgrade'?'active':''}" onclick="go('upgrade')">АПГРЕЙДЫ</button>
  <button class="${S.page==='rewards'?'active':''}" onclick="go('rewards')">НАГРАДЫ</button>
  <button class="${S.page==='steal'?'active':''}" onclick="go('steal')">STEAL A SKIN</button></nav>
  <div class="actions"><a class="telegram" href="${esc(S.telegram)}" target="_blank" rel="noopener">${tgIcon()}<span>TELEGRAM</span></a><div class="balance">Баланс <b>${bal}</b></div>
  ${S.me?.authenticated?`<button class="steam" onclick="logout()">${S.me.user.avatar?img(S.me.user.avatar):''}<span>ВЫЙТИ</span></button>`:`<button class="steam" onclick="login()">${steamIcon()}<span>ВОЙТИ ЧЕРЕЗ STEAM</span></button>`}</div></header>`
}
function sidebar(){
  const list=S.tab==='drops'?S.drops.slice(0,12).map(d=>`<div class="side-item"><div class="art">${img(d.itemIcon)}</div><div><div class="item-name">${esc(d.itemName)}</div><div class="item-skin">${esc(d.userName)}</div></div></div>`).join(''):
    S.inventory.slice(0,18).map(i=>`<div class="side-item">${art(i)}<div><div class="item-name">${esc(i.name)}</div><div class="item-skin">${esc(i.marketName)}</div></div></div>`).join('');
  return `<aside class="sidebar"><div class="side-head"><div class="site-online"><span>НА САЙТЕ</span><b>${S.online}</b></div><div class="side-tabs"><button class="${S.tab==='inventory'?'active':''}" onclick="sideTab('inventory')">▦</button><button class="${S.tab==='drops'?'active':''}" onclick="sideTab('drops')">🔥</button></div></div><div class="side-list">${list||`<div style="padding:25px;color:#66736e;font-size:10px">Нет данных</div>`}</div></aside>`
}
function selected(it){if(!it)return `<div class="selected empty">Выбранные предметы появятся здесь</div>`;return `<div class="selected">${art(it)}<div class="selected-info"><strong>${esc(it.name)}</strong><span>${esc(it.marketName||'')}</span><b>${money(it.priceCents)}</b></div></div>`}
function pick(it,side){return `<button class="pick-card" onclick="choose('${esc(it.assetid||it.id||'')}','${side}')"><span class="price">${money(it.priceCents)}</span>${art(it)}<strong>${esc(it.name)}</strong><small>${esc(it.marketName||'')}</small></button>`}

function upgradePage(){
  const inv=S.inventory;const targets=[]; // no fake target catalog: only real inventory items are displayed
  const all=inv.filter(x=>x!==S.from);
  const t=all.filter(x=>(x.priceCents||0)>(S.from?.priceCents||0));
  return `<div class="notice"><span>🔥 Здесь отображаются только реальные события и данные сайта</span><b>${S.drops.length?'Лента обновляется в реальном времени':'Лента пока пуста'}</b></div>
  <section class="upgrid">
  <div class="panel"><div class="title">ВЫБЕРИТЕ <b>&nbsp;ПРЕДМЕТ И/ИЛИ БАЛАНС ДЛЯ ИСПОЛЬЗОВАНИЯ</b></div>${selected(S.from)}<div class="pick">${inv.map(i=>pick(i,'from')).join('')}</div></div>
  <div class="wheelbox"><div class="wheelhead"><span>ШАНС АПГРЕЙДА</span><b>${S.from&&S.to?S.chance+'%':'—'}</b></div>
  <div class="wheel"><i class="pointer"></i><div class="wheelcenter"><strong>${S.from&&S.to?S.chance+'%':'—'}</strong><span>${S.from&&S.to?'вероятность успеха':'выберите предметы'}</span></div></div>
  <button class="upgrade" ${!S.from||!S.to||S.spinning?'disabled':''} onclick="upgrade()">${S.spinning?'АПГРЕЙД...':'АПГРЕЙД'}</button><div class="under">${S.from&&S.to?money(S.from.priceCents)+' → '+money(S.to.priceCents):'Выберите предмет слева и цель справа'}</div></div>
  <div class="panel"><div class="title">ВЫБЕРИТЕ <b>&nbsp;ПРЕДМЕТ ДЛЯ АПГРЕЙДА</b></div>${selected(S.to)}<div class="pick">${t.map(i=>pick(i,'to')).join('')}</div></div></section>
  <section class="lower"><div class="panel"><div class="title">▣ &nbsp;<b>МОИ ПРЕДМЕТЫ</b></div><div class="grid">${inv.slice(0,8).map(i=>`<button class="card" onclick="choose('${esc(i.assetid)}','from')">${art(i)}<strong>${esc(i.name)}</strong><small>${esc(i.marketName)}</small></button>`).join('')}</div></div>
  <div class="panel"><div class="title">⌃ &nbsp;<b>ВЫБРАТЬ ПРЕДМЕТ</b><div class="toolbar"><input placeholder="От"><input placeholder="До"></div></div><div class="grid">${t.slice(0,8).map(i=>`<button class="card" onclick="choose('${esc(i.assetid)}','to')">${art(i)}<strong>${esc(i.name)}</strong><small>${esc(i.marketName)}</small></button>`).join('')}</div></div></section>
  <section class="panel feed"><div class="title">🔥 &nbsp;<b>ПОСЛЕДНИЕ УДАЧИ</b><span style="margin-left:auto">${S.drops.length?'LIVE':'Пока событий нет'}</span></div><div class="feedgrid">${S.drops.length?S.drops.map(d=>`<div class="drop">${img(d.itemIcon)}<strong>${esc(d.userName)}</strong><small>${esc(d.itemName)}</small><b>${money(d.priceCents)}</b></div>`).join(''):`<div class="empty" style="grid-column:1/-1;padding:30px"><h2>Пока никто ничего не выиграл</h2><p>Здесь будут реальные события после первого результата.</p></div>`}</div></section>`
}
function inventoryPage(){
 if(!S.me?.authenticated)return loginRequired('ИНВЕНТАРЬ','После входа сюда загрузится настоящий инвентарь CS2 через Steam.');
 if(!S.inventory.length)return `<h1 class="page-title">Инвентарь</h1><p class="sub">Данные получены из Steam</p><div class="panel empty"><h2>У вас нет предметов</h2><p>Откройте кейс</p><button class="cta" onclick="go('cases')">ОТКРЫТЬ КЕЙС</button></div>`;
 return `<h1 class="page-title">Инвентарь</h1><p class="sub">Реальные предметы из Steam</p><div class="panel" style="margin-top:16px"><div class="grid">${S.inventory.map(i=>`<div class="card">${art(i)}<strong>${esc(i.name)}</strong><small>${esc(i.marketName)}</small></div>`).join('')}</div></div>`
}
function loginRequired(title,text){return `<div class="login-box"><h1>${esc(title)}</h1><p class="sub">${esc(text)}</p><button class="steam" style="margin:20px auto 0" onclick="login()">${steamIcon()}<span>ВОЙТИ ЧЕРЕЗ STEAM</span></button></div>`}
function casesPage(){
 if(!S.me?.authenticated)return loginRequired('КЕЙСЫ','Войдите в аккаунт, чтобы увидеть доступные кейсы.');
 return `<h1 class="page-title">Кейсы</h1><p class="sub">Список кейсов должен приходить из production backend. Никаких фейковых кейсов в UI нет.</p><div class="panel empty"><h2>Кейсы ещё не настроены</h2><p>Здесь появятся только реальные кейсы после подключения каталога.</p></div>`
}
function rewardsPage(){return `<h1 class="page-title">Награды</h1><p class="sub">Бонусные условия можно подключить к реальной платёжной системе.</p><div class="rewards"><div class="reward"><h3>Потрать 1 000 ₽</h3><p>Акция после подключения финансового backend.</p><b>+500 ₽</b></div><div class="reward"><h3>Пополнение от 1 000 ₽</h3><p>Дополнительный процент за пополнение.</p><b>+10%</b></div><div class="reward"><h3>Большие суммы</h3><p>Условия согласовываются с финансовым отделом.</p><b>до +20%</b></div></div>`}
function stealPage(){return `<h1 class="page-title">STEAL A SKIN</h1><p class="sub">События создаются только реальным игровым backend. Фейковые предметы здесь не генерируются.</p><div class="steal"><div class="stealhero"><h2>STEAL A SKIN</h2><div class="empty"><h2>Нет активного события</h2><p>Когда production backend создаст событие с реальным предметом, оно появится здесь.</p></div></div><div class="stealside"><h3>Правила</h3><div class="rule"><b>15 секунд</b>Событие доступно в реальном времени.</div><div class="rule"><b>Комиссия</b>Размер задаётся сервером.</div><div class="rule"><b>PvP</b>Результат определяет сервер, а не клиент.</div></div></div>`}

function render(){
 document.querySelector('#app').innerHTML=header()+`<div class="layout">${sidebar()}<main class="main"><div class="page">${S.page==='inventory'?inventoryPage():S.page==='cases'?casesPage():S.page==='rewards'?rewardsPage():S.page==='steal'?stealPage():upgradePage()}</div></main></div><div class="support"><a href="${esc(S.telegram)}" target="_blank" rel="noopener">${tgIcon()}</a><button onclick="openChat()">ПОДДЕРЖКА</button></div>${S.chat?chatModal():''}`
}
function chatModal(){return `<div class="modal" onclick="if(event.target===this)closeChat()"><div class="chat"><div class="chathead"><b>Поддержка</b><button onclick="closeChat()">✕</button></div><div class="chatbody" id="chatbody">Загрузка…</div><form class="chatform" onsubmit="sendMsg(event)"><input id="chatinput" maxlength="2000" placeholder="Напишите сообщение…"><button>ОТПРАВИТЬ</button></form></div></div>`}
async function openChat(){if(!S.me?.authenticated){toast('Для обращения в поддержку войдите через Steam');return}S.chat=true;render();const rows=await api('/api/support/messages');$('#chatbody').innerHTML=rows.map(x=>`<div class="msg">${esc(x.message)}</div>`).join('')||'<div class="sub">Напишите первое сообщение.</div>'}
function closeChat(){S.chat=false;render()}
async function sendMsg(e){e.preventDefault();const input=$('#chatinput');const text=input.value.trim();if(!text)return;try{const m=await api('/api/support/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text})});const body=$('#chatbody');body.innerHTML+=`<div class="msg">${esc(m.message)}</div>`;input.value='';body.scrollTop=body.scrollHeight}catch(err){toast(err.message)}}
function login(){location.href='/auth/steam'}
async function logout(){await api('/auth/logout',{method:'POST'});location.reload()}
function go(p){S.page=p;render()}
function sideTab(t){S.tab=t;render()}
function choose(id,side){const it=S.inventory.find(x=>String(x.assetid)===String(id));if(!it)return;if(side==='from')S.from=it;else S.to=it;if(S.from&&S.to){S.chance=Number(Math.max(1,Math.min(95,(S.from.priceCents||0)/(S.to.priceCents||1)*97)).toFixed(2))}else S.chance=0;render()}
async function upgrade(){toast('Механика апгрейда будет подключена к реальному server-authoritative backend после настройки экономики и трейдов.');}
boot();
