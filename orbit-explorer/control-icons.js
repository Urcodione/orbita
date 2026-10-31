/* One visual identity per operation; object artwork remains on item cards. */
(function(root){
'use strict';
const flight=['evacuate','base','return','scan','beacon','extract','rover','dock','launch','land','route','warp','wait','decode','rescue','overdrive'];
const utility=['catalog','mission','help','intro','audio','settings','restart','saves','checkpoint','export','import','restore','fabricate','craft','recycle','delivery'];
const actions={
 'confirm-field-action':'risk','expedition-abort-menu':'evacuate',expeditionAbort:'evacuate',
 'expedition-return':'return','expedition-return-menu':'return',expeditionReturn:'return',
 scan:'scan',expeditionScan:'scan','planet-info':'scan',expeditionBeacon:'beacon',
 expeditionExtract:'extract',explore:'rover',sites:'rover','resume-expedition':'rover',
 stationDock:'dock',stationLeave:'undock',launch:'launch',dock:'land',
 travel:'route','route-info':'route','campaign-route':'route','warp-menu':'warp',warp:'warp',
 expeditionWait:'wait',expeditionInteract:'decode',expeditionTune:'decode',campaignClaim:'decode',
 rescue:'rescue','rescue-menu':'rescue',expeditionOverdrive:'overdrive','overdrive-menu':'overdrive',
 catalog:'catalog',campaign:'mission',journey:'mission','campaign-relics':'relics',
 help:'help','campaign-intro':'intro','campaign-ending':'intro',sound:'audio',settings:'audio',
 'reset-menu':'restart','confirm-reset':'restart',saves:'saves','save-checkpoint':'checkpoint',
 'save-export':'export','save-import':'import','save-restore':'restore','save-accept':'restore',
 fabricator:'fabricate',fabricate:'fabricate',campaignCraft:'fabricate','components-menu':'craft',craftComponent:'craft',
 'salvage-review':'recycle',salvage:'recycle',expeditionSalvage:'recycle',contractDeliver:'delivery',contracts:'delivery',
 stock:'storage','expedition-cargo':'storage','stock-components':'components',modules:'modules',workshop:'workshop',maintenance:'maintenance',
 expeditionCollect:'collect',expeditionRecover:'research',claimBeacon:'research',
 'compare-module':'install',equip:'install',environment:'protection','site-details':'protection',
 'discard-review':'discard',discardCargo:'discard',market:'market',station:'station',
 'campaign-gate':'wormhole',campaignCross:'wormhole',campaignReturnHome:'home',campaignBuyRelic:'buy-relic'
};
const purpose={storage:'storage',components:'components',modules:'modules',workshop:'workshop',maintenance:'maintenance',relics:'relics',market:'market',research:'research'};
for(const [asset,key]of [['flightControls','flight'],['utilityControls','utility']])document.getElementById('orbit-game').style.setProperty('--og-controls-'+key,'url("'+root.OrbitIllustrations[asset]+'")');
function atlas(key,table,asset){const i=table.indexOf(key);return `<span class="og-semantic-art" data-icon="${key}" style="--icon-sheet:var(--og-controls-${asset});--icon-x:${i%4/3*100}%;--icon-y:${Math.floor(i/4)/3*100}%" aria-hidden="true"></span>`;}
function art(key){
 if(flight.includes(key))return atlas(key,flight,'flight');if(utility.includes(key))return atlas(key,utility,'utility');
 if(purpose[key])return `<span class="og-semantic-object" data-icon="${key}" aria-hidden="true">${root.OrbitCommerce.symbol(purpose[key])}</span>`;
 const raw=key==='collect'?root.OrbitArt.icon('arm'):key==='install'?root.OrbitArt.icon('engine'):key==='protection'?root.OrbitArt.icon('shield'):key==='station'?root.OrbitCommerce.art('station'):key==='buy-relic'?root.OrbitCommerce.coin('buy'):null;
 if(raw)return `<span class="og-semantic-object" data-icon="${key}" aria-hidden="true">${raw}${key==='install'?'<i class="og-install-socket"></i>':''}</span>`;
 if(key==='risk')return `<span class="og-semantic-object" data-icon="risk">${art('route')}<i class="og-direction-mark">!</i></span>`;
 if(key==='worlds')return '<span class="og-semantic-object" data-icon="worlds"><span class="og-action-world"></span></span>';
 if(key==='undock'||key==='home')return `<span class="og-semantic-object" data-icon="${key}" aria-hidden="true">${art(key==='undock'?'dock':'return')}<i class="og-direction-mark">${key==='undock'?'↗':'⌂'}</i></span>`;
 if(key==='wormhole')return `<span class="og-semantic-object is-dimensional" data-icon="wormhole">${root.OrbitArt.icon('warp','',{mission:true})}</span>`;
 if(key==='discard')return `<span class="og-semantic-object" data-icon="discard">${root.OrbitCommerce.symbol('storage')}<i class="og-direction-mark">−</i></span>`;
 return '';
}
function resolve(action,button){return button?.dataset.iconIntent||actions[action]||null;}
function forAction(action,button){const key=resolve(action,button);return key?art(key):'';}
function apply(container){
 for(const b of container.querySelectorAll('button[data-action]')){
  const key=resolve(b.dataset.action,b);if(!key)continue;
  const holder=b.querySelector('.og-control-symbol,.og-rescue-art');
  if(holder){holder.innerHTML=art(key);b.dataset.iconKey=key;continue;}
  if(b.matches('.og-menu-tile,.og-trade-tile')){const prev=b.querySelector('.og-action-art,.og-painted-module,.og-trade-art,.og-purpose-art,.og-action-world,.og-action-ship,.og-semantic-art,.og-semantic-object');if(prev)prev.outerHTML=art(key);b.dataset.iconKey=key;}
 }
}
root.OrbitControlIcons={actions,flight,utility,art,resolve,forAction,apply};
})(window);
