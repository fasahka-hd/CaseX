(function(){
'use strict';
const ICON='/chunks/notificationIcon.svg';
function closeN(){document.querySelector('[data-nfix]')?.remove();}
function openN(){closeN();const el=document.createElement('div');el.dataset.nfix='1';el.className='nfix-overlay';el.innerHTML='<div class="nfix-panel"><div class="nfix-head"><span>Уведомления</span><b>0</b></div><div class="nfix-list">Уведомлений пока нет</div><button class="nfix-close" type="button">⌄</button></div>';el.addEventListener('click',e=>{if(e.target===el)closeN();});el.querySelector('.nfix-close').onclick=closeN;document.body.appendChild(el);}
function headerFix(){const a=document.querySelector('.actions');if(!a)return;const p=a.querySelector('.profile-trigger');if(p){p.querySelectorAll('i').forEach(x=>x.remove());p.style.position='relative';p.style.zIndex='2';p.onclick=function(e){e.preventDefault();e.stopPropagation();closeN();if(window.go)window.go('profile');};}
let n=a.querySelector('.notification-trigger');if(!n){n=document.createElement('button');n.className='notification-trigger';n.type='button';n.innerHTML='<img src="'+ICON+'" alt="Уведомления">';n.onclick=function(e){e.preventDefault();e.stopPropagation();openN();};p?a.insertBefore(n,p):a.appendChild(n);}
a.querySelectorAll('.profile-trigger i').forEach(x=>x.remove());}
function wheelFix(){const w=document.querySelector('.wheel');if(!w)return;const chance=Math.max(0,Math.min(100,parseFloat(getComputedStyle(w).getPropertyValue('--chance'))||0));w.style.setProperty('--chance-deg',(chance*3.6)+'deg');w.style.setProperty('--chance-half-deg',(chance*1.8)+'deg');const o=document.querySelector('.pointer-orbit');if(o){o.style.bottom='-34px';o.style.top='auto';}}
function upgradeFix(){document.querySelectorAll('.profile-upgrade-card').forEach(card=>{if(card.dataset.fixed)return;card.dataset.fixed='1';const copy=card.querySelector('.upg-copy');const oldArt=card.querySelector('.art');if(!copy||!oldArt)return;const row=document.createElement('div');row.className='upgrade-duo';const from=card.__fromIcon||null;});}
function patch(){headerFix();wheelFix();upgradeFix();}
new MutationObserver(patch).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeN();});requestAnimationFrame(patch);
})();