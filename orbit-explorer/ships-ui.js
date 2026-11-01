(function(root){
'use strict';
// Merchant and hangar panels for the ready-made ships (logic in ships.js).
const E=root.OrbitEngine;if(!E?.fleetView)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('pt-BR');
// Closed-hull painting of a ship: the Andorinha keeps its original key, the fleet uses hull-<id>.
function src(id){const art=root.OrbitIllustrations||{};return id!=='andorinha'&&art['hull-'+id]?art['hull-'+id]:art.ship||'';}
const picture=(id,cls='')=>{const url=src(id);return url?`<img class="og-fleet-art ${cls}" src="${url}" alt="" decoding="async">`:'<span class="og-fleet-art is-empty" aria-hidden="true"></span>';};
const traits=ship=>`<ul class="og-fleet-traits">${ship.plus.map(t=>`<li class="is-plus">${esc(t)}</li>`).join('')}${ship.minus.map(t=>`<li class="is-minus">${esc(t)}</li>`).join('')}</ul>`;
const reason=preview=>preview.allowed?'':`<p class="og-fleet-reason">${esc(preview.reason)}</p>`;

function trader(s){
 const v=E.fleetView(s),o=v.offer;
 if(!o)return {title:'Viajante',html:'<p class="og-fleet-empty">Não há nave à venda agora. O viajante aparece de vez em quando nos entrepostos, cada vez com uma nave diferente.</p><button class="og-button" data-action="fleet">Abrir hangar</button>'};
 const current=v.ships.find(x=>x.active);
 return {title:'Viajante',singleCard:true,
  html:`<div class="og-fleet-hero">${picture(o.id,'is-large')}<div><small>${esc(o.rarityLabel)} · ${esc(o.peopleName)}</small><strong>${esc(o.name)}</strong><span>${esc(o.role)}</span></div></div>`+
   `<p class="og-fleet-lore">${esc(o.lore)}</p>${traits(o)}`+
   `<p class="og-note">Você pilota a ${esc(current.name)}. A nave comprada fica no hangar, e a troca é feita atracado em qualquer entreposto. Módulos, runas, pintura e rastro vão junto.</p>`,
  footer:`<button class="og-button ${o.preview.allowed?'primary':''}" data-action="fleetBuy" data-ship="${esc(o.id)}" ${o.preview.allowed?'':'disabled'}>Comprar por ${fmt(o.price)} Lumes</button>${reason(o.preview)}`};
}
function hangar(s){
 const v=E.fleetView(s);
 const cards=v.ships.map(x=>`<article class="og-fleet-card ${x.active?'is-active':''}">${picture(x.id)}<div class="og-fleet-body"><small>${esc(x.rarityLabel)} · ${esc(x.role)}</small><strong>${esc(x.name)}</strong>${traits(x)}`+
  (x.active?'<span class="og-fleet-badge">Em uso</span>':v.docked?`<button class="og-button ${x.preview.allowed?'primary':''}" data-action="fleetSwitch" data-ship="${esc(x.id)}" ${x.preview.allowed?'':'disabled'}>Pilotar esta nave</button>${reason(x.preview)}`:'')+`</div></article>`).join('');
 const note=v.docked?'Escolha a nave que vai pilotar. Módulos, runas, pintura e rastro passam para ela.':'A troca de nave é feita atracado num entreposto.';
 return {title:'Hangar',html:`<p class="og-fleet-count"><strong>${v.ships.length} de ${v.total}</strong> naves · ${esc(note)}</p><div class="og-fleet-list">${cards}</div>`+
  (v.ships.length<v.total?'<p class="og-fleet-empty">Outras naves aparecem com o viajante, de vez em quando, nos entrepostos.</p>':'')};
}
function sheet(name,s){if(name==='fleet-trader')return trader(s);if(name==='fleet')return hangar(s);return null;}
// Row under the station destinations: the merchant (when present) and the hangar.
function stationRow(s){
 if(s.guide?.active)return '';const v=E.fleetView(s),o=v.offer;
 return `<div class="og-fleet-row">`+(o?`<button class="og-fleet-merchant" data-action="fleet-trader">${picture(o.id,'is-thumb')}<span><small>Viajante no entreposto</small><strong>${esc(o.name)} à venda</strong><small>${esc(o.role)} · ${fmt(o.price)} Lumes</small></span></button>`:'')+
  `<button class="og-link og-fleet-hangar" data-action="fleet">Hangar · ${v.ships.length} ${v.ships.length===1?'nave':'naves'}</button></div>`;
}
// Small ship pictures in buttons and cards follow the active ship.
let shown='';
function apply(s){const id=s?.fleet?.active||'andorinha';if(id===shown)return;shown=id;const url=src(id);const game=root.document?.getElementById('orbit-game');if(game&&url)game.style.setProperty('--og-ship-art','url("'+url+'")');}
root.OrbitFleetUI={sheet,stationRow,apply,picture};
})(window);
