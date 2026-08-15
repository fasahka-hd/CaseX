(function(){
'use strict';
const NOTIFICATION_ICON='/chunks/notificationIcon.svg';
const EXTRA_CSS=`
/* FINAL UI POLISH */
.actions .profile-trigger{width:58px!important;height:58px!important;min-width:58px!important;min-height:58px!important;border-radius:2px!important;overflow:hidden!important;transform:none!important;transition:filter .18s ease,box-shadow .18s ease!important}
.actions .profile-trigger:hover{transform:none!important;filter:brightness(1.08)!important;box-shadow:0 0 0 1px rgba(255,255,255,.12),0 6px 20px rgba(0,0,0,.25)!important}
.actions .profile-trigger img{width:58px!important;height:58px!important;min-width:58px!important;min-height:58px!important;object-fit:cover!important;border-radius:2px!important}
.actions .notification-trigger{width:58px!important;height:58px!important;min-width:58px!important;min-height:58px!important;transform:none!important}
.actions .notification-trigger img{width:31px!important;height:31px!important}
/* never show the online/status marker inside the profile control */
.actions .profile-trigger .online-dot,.actions .profile-trigger [class*="online"],.actions .profile-trigger [class*="status"],.actions .profile-trigger [aria-label*="online" i],.actions .profile-trigger [aria-label*="онлайн" i]{display:none!important;visibility:hidden!important}
/* compact profile history */
.profile-modal,.profile-dialog,.profile-window{animation:profileIn .22s ease-out both!important}
.profile-upgrades,.profile-upgrades-grid,.profile-history-upgrades{grid-template-columns:repeat(2,minmax(0,430px))!important;justify-content:center!important;align-items:start!important;gap:12px!important;max-width:880px!important}
.profile-upgrade,.profile-upgrade-card,.profile-history-upgrade{width:100%!important;max-width:430px!important;transform:translateZ(0)!important;transition:transform .2s ease,filter .2s ease,box-shadow .2s ease!important}
.profile-upgrade:hover,.profile-upgrade-card:hover,.profile-history-upgrade:hover{transform:translateY(-3px)!important;filter:brightness(1.06)!important;box-shadow:0 12px 30px rgba(0,0,0,.3)!important}
.profile-upgrade-items,.profile-upgrade-card-items,.profile-history-upgrade-items{grid-template-columns:minmax(0,1fr) 30px minmax(0,1fr)!important;padding:10px!important;gap:6px!important}
.profile-upgrade-item,.profile-upgrade-card-item,.profile-history-upgrade-item{height:142px!important}
.profile-upgrade-item img,.profile-upgrade-card-item img,.profile-history-upgrade-item img{transition:transform .25s ease,filter .25s ease!important}
.profile-upgrade:hover .profile-upgrade-item img,.profile-upgrade-card:hover .profile-upgrade-card-item img,.profile-history-upgrade:hover .profile-history-upgrade-item img{transform:scale(1.05)!important;filter:drop-shadow(0 8px 12px rgba(0,0,0,.5))!important}
.profile-upgrade-footer,.profile-upgrade-card-footer,.profile-history-upgrade-footer{font-size:13px!important;letter-spacing:.01em!important}
/* wheel: chance fill starts from the bottom and remains aligned with the pointer */
.wheel{background:conic-gradient(from 180deg,#DA6A27 0 var(--wheel-chance,30%),#343434 var(--wheel-chance,30%) 100%)!important;transition:transform 2.15s cubic-bezier(.12,.78,.16,1)!important}
.wheel:before{inset:24px!important;background:radial-gradient(circle,#3a3a3a 0%,#171717 78%)!important}
.wheel.spin{animation:none!important}
.pointer{filter:drop-shadow(0 0 7px rgba(218,106,39,.7))!important}
.wheelcenter strong{font-variant-numeric:tabular-nums!important;text-shadow:0 0 18px rgba(218,106,39,.18)!important}
.upgrade{transition:transform .18s ease,filter .18s ease,box-shadow .18s ease!important}
.upgrade:not(:disabled):hover{transform:translateY(-2px)!important;filter:brightness(1.08)!important;box-shadow:0 8px 28px rgba(68,201,135,.2)!important}
.upgrade:not(:disabled):active{transform:translateY(0)!important}
.toast{z-index:2147483647!important;animation:toastIn .22s cubic-bezier(.2,.8,.2,1) both!important}
@keyframes profileIn{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}
@keyframes toastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@media(max-width:800px){.actions .profile-trigger,.actions .profile-trigger img{width:50px!important;height:50px!important;min-width:50px!important;min-height:50px!important}.actions .notification-trigger{width:50px!important;height:50px!important;min-width:50px!important;min-height:50px!important}.actions .notification-trigger img{width:28px!important;height:28px!important}.profile-upgrades,.profile-upgrades-grid,.profile-history-upgrades{grid-template-columns:1fr!important;max-width:100%!important}.profile-upgrade,.profile-upgrade-card,.profile-history-upgrade{max-width:100%!important}.profile-upgrade-item,.profile-upgrade-card-item,.profile-history-upgrade-item{height:118px!important}}
`;
function injectCss(){if(document.getElementById('final-ui-polish'))return;const s=document.createElement('style');s.id='final-ui-polish';s.textContent=EXTRA_CSS;document.head.appendChild(s)}
function closeNotifications(){document.querySelector('[data-notifications-overlay]')?.remove()}
function notificationModal(){return `<div class="notifications-overlay" data-notifications-overlay><div class="notifications-panel fixed-notifications" role="dialog" aria-modal="true" aria-label="Уведомления"><div class="notifications-head"><span>Уведомления</span><div class="notifications-count">0</div></div><div class="notifications-list"><div class="notifications-empty">Уведомлений пока нет</div></div><div class="notifications-foot"><button type="button" onclick="window.closeNotifications()"><img src="/chunks/arrowDownIcon.svg" alt=""></button></div></div></div>`}
function openNotifications(){closeNotifications();document.querySelector('[data-profile-menu]')?.remove();document.body.insertAdjacentHTML('beforeend',notificationModal());const overlay=document.querySelector('[data-notifications-overlay]');overlay?.addEventListener('click',e=>{if(e.target===overlay)closeNotifications()})}
window.closeNotifications=closeNotifications;window.openNotifications=openNotifications;
function removeOnlineMarker(profile){profile.querySelectorAll('*').forEach(el=>{const c=String(el.className||'').toLowerCase();const a=String(el.getAttribute?.('aria-label')||'').toLowerCase();if(/online|status|онлайн/.test(c)||/online|онлайн/.test(a))el.remove()})}
function patchHeader(){const actions=document.querySelector('.actions');if(!actions)return;const profile=actions.querySelector('.profile-trigger');if(!profile)return;profile.classList.add('square-avatar');removeOnlineMarker(profile);profile.querySelectorAll('img').forEach(img=>{img.style.width='100%';img.style.height='100%';img.style.objectFit='cover'});let btn=actions.querySelector('.notification-trigger');if(!btn){btn=document.createElement('button');btn.type='button';btn.className='notification-trigger';btn.setAttribute('aria-label','Уведомления');btn.innerHTML=`<img src="${NOTIFICATION_ICON}" alt="">`;actions.insertBefore(btn,profile)}if(!btn.dataset.bound){btn.dataset.bound='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openNotifications()})}}
function patchWheel(){const wheel=document.querySelector('.wheel');if(!wheel)return;const value=document.querySelector('.wheelcenter strong')?.textContent||'';const n=parseFloat(value.replace(',','.').replace(/[^0-9.]/g,''));if(Number.isFinite(n)){const chance=Math.max(1,Math.min(100,n));wheel.style.setProperty('--wheel-chance',chance+'%')}if(wheel.dataset.finalSpinBound)return;wheel.dataset.finalSpinBound='1';const button=document.querySelector('.upgrade');if(button){button.addEventListener('click',()=>{if(button.disabled)return;const angle=1440+Math.floor(Math.random()*720);wheel.style.setProperty('--angle',angle+'deg');wheel.classList.remove('spin');void wheel.offsetWidth;wheel.classList.add('spin')},{capture:true})}}
function patch(){injectCss();patchHeader();patchWheel()}
new MutationObserver(patch).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNotifications()});requestAnimationFrame(patch)
})();