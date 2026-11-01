(function(root){
'use strict';
// Star shipyard panel: blueprint grid over the ship's silhouette, hangar, faction shop and share code.
const E=root.OrbitEngine;if(!E?.yardView)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Provisional shaded vector art per part, in the ship palette (ivory ceramic, copper, teal glass).
const G='<defs><linearGradient id="yp-i" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff8ea"/><stop offset=".6" stop-color="#e2d0b4"/><stop offset="1" stop-color="#94816a"/></linearGradient><linearGradient id="yp-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd09a"/><stop offset=".5" stop-color="#c8763d"/><stop offset="1" stop-color="#6e3519"/></linearGradient><linearGradient id="yp-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff7f2"/><stop offset=".55" stop-color="#2ba7a8"/><stop offset="1" stop-color="#0d4a55"/></linearGradient><radialGradient id="yp-g"><stop offset="0" stop-color="#fff2c2"/><stop offset=".5" stop-color="#ffb04f"/><stop offset="1" stop-color="#a5300f"/></radialGradient></defs>';
const SHAPES={
 'tanque-externo':'<rect x="20" y="6" width="24" height="52" rx="12" fill="url(#yp-i)" stroke="#7d5a3a"/><rect x="18" y="16" width="28" height="4" rx="2" fill="url(#yp-c)"/><rect x="18" y="44" width="28" height="4" rx="2" fill="url(#yp-c)"/><rect x="28" y="24" width="8" height="14" rx="3" fill="url(#yp-t)"/>',
 'reservatorio-o2':'<circle cx="32" cy="32" r="20" fill="url(#yp-i)" stroke="#7d5a3a"/><circle cx="32" cy="32" r="9" fill="url(#yp-t)"/><text x="32" y="36" font-size="9" text-anchor="middle" fill="#063" font-family="sans-serif">O₂</text><rect x="12" y="30" width="40" height="4" fill="url(#yp-c)" opacity=".8"/>',
 'placas-casco':'<path d="M12 14 L52 14 L48 50 L32 58 L16 50 Z" fill="url(#yp-i)" stroke="#7d5a3a"/><path d="M20 22 H44 M20 32 H44 M22 42 H42" stroke="#b39874" stroke-width="2"/><circle cx="16" cy="16" r="2" fill="url(#yp-c)"/><circle cx="48" cy="16" r="2" fill="url(#yp-c)"/>',
 'vela-solar':'<rect x="4" y="18" width="24" height="28" rx="2" fill="#1b4d8c" stroke="url(#yp-c)" stroke-width="2"/><rect x="36" y="18" width="24" height="28" rx="2" fill="#1b4d8c" stroke="url(#yp-c)" stroke-width="2"/><path d="M4 27 H28 M4 37 H28 M16 18 V46 M36 27 H60 M36 37 H60 M48 18 V46" stroke="#5fb8ff" stroke-width="1"/><rect x="28" y="29" width="8" height="6" fill="url(#yp-i)"/>',
 'quilha':'<path d="M32 4 L44 56 L32 50 L20 56 Z" fill="url(#yp-i)" stroke="#7d5a3a"/><path d="M32 10 V48" stroke="url(#yp-c)" stroke-width="3"/><circle cx="32" cy="22" r="3" fill="url(#yp-t)"/>',
 'nacela':'<rect x="20" y="6" width="24" height="40" rx="12" fill="url(#yp-c)" stroke="#6e3519"/><path d="M18 44 H46 L42 58 H22 Z" fill="#1f3940" stroke="#0d2a30"/><ellipse cx="32" cy="58" rx="9" ry="3" fill="url(#yp-g)"/><rect x="26" y="14" width="12" height="10" rx="4" fill="url(#yp-t)"/>',
 'baia-drones':'<rect x="6" y="10" width="52" height="44" rx="8" fill="url(#yp-i)" stroke="#7d5a3a"/><rect x="12" y="18" width="40" height="22" rx="4" fill="#0d2a30"/><circle cx="24" cy="29" r="6" fill="url(#yp-t)"/><circle cx="40" cy="29" r="6" fill="url(#yp-t)"/><path d="M14 48 H50" stroke="url(#yp-c)" stroke-width="3"/>',
 'reator-compacto':'<rect x="14" y="10" width="36" height="44" rx="10" fill="url(#yp-i)" stroke="#7d5a3a"/><circle cx="32" cy="32" r="11" fill="url(#yp-g)"/><circle cx="32" cy="32" r="16" fill="none" stroke="url(#yp-c)" stroke-width="3"/>',
 'antena-longa':'<path d="M32 58 V20" stroke="url(#yp-c)" stroke-width="4"/><path d="M14 22 Q32 6 50 22" fill="url(#yp-i)" stroke="#7d5a3a"/><circle cx="32" cy="12" r="4" fill="url(#yp-t)"/><path d="M22 58 H42" stroke="url(#yp-c)" stroke-width="5"/>',
 'matriz-sensores':'<rect x="4" y="20" width="56" height="24" rx="6" fill="url(#yp-i)" stroke="#7d5a3a"/><circle cx="16" cy="32" r="6" fill="url(#yp-t)"/><circle cx="32" cy="32" r="6" fill="url(#yp-t)"/><circle cx="48" cy="32" r="6" fill="url(#yp-t)"/>',
 'defletor':'<path d="M4 40 Q32 8 60 40" fill="none" stroke="url(#yp-t)" stroke-width="7"/><path d="M4 40 Q32 8 60 40" fill="none" stroke="#e9fffb" stroke-width="1.5"/><rect x="24" y="38" width="16" height="14" rx="3" fill="url(#yp-c)"/>',
 'conteiner-orbital':'<rect x="6" y="8" width="52" height="48" rx="4" fill="url(#yp-c)" stroke="#6e3519"/><path d="M6 20 H58 M6 44 H58" stroke="#ffd09a" stroke-width="2"/><rect x="18" y="26" width="28" height="12" rx="2" fill="url(#yp-i)"/>'
};
const PART_ORDER=()=>E.yardCatalog.PARTS.map(p=>p.id);
const svg=(id,w=1,h=1)=>root.OrbitIllustrations?.yardParts?`<span class="og-yard-art" style="background-position:${PART_ORDER().indexOf(id)%4/3*100}% ${Math.floor(PART_ORDER().indexOf(id)/4)/2*100}%" aria-hidden="true"></span>`:vector(id);
const vector=(id,w=1,h=1)=>`<svg viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${G}${SHAPES[id]||''}</svg>`;
let selected=null;
function select(id){selected=selected===id?null:id;}
function meter(label,value,max,warn){return `<div class="og-yard-meter ${warn?'is-warning':''}"><span>${label}</span><strong>${value} / ${max}</strong><progress value="${Math.min(value,max)}" max="${max}"></progress></div>`;}
const EFFECT_LABELS={maxFuel:['Tanque',''],maxOxygen:['Oxigênio',''],maxHull:['Casco',''],fuelEfficiency:['Voo','%'],warpEfficiency:['Dobra','%'],oxygenEfficiency:['Ar','%'],scanRadius:['Scanner',' setor'],scanBonus:['Pesquisa','%'],collectionBonus:['Coleta','%'],expeditionCapacity:['Carga exp.',''],expeditionIntegrity:['Integridade',''],cargoCapacity:['Armazém','']};
const fmt=(k,v)=>{const [label,unit]=EFFECT_LABELS[k]||[k,''];const n=unit==='%'?Math.round(v*100):v;return `${label} ${n>0?'+':'−'}${Math.abs(n)}${unit}`;};
function sheet(name,s){
 if(name!=='yard')return null;
 const v=E.yardView(s),owner=new Map();v.layout.forEach(item=>item.cells.forEach(c=>owner.set(c,item)));
 const placeable=selected?new Set(v.allowed.filter(c=>E.preview(s,'yardPlace',{partId:selected,cell:c}).allowed)):new Set();
 const cells=v.allowed.map(c=>owner.has(c)?'':`<button class="og-yard-cell ${placeable.has(c)?'is-target':''}" style="grid-column:${c%v.cols+1};grid-row:${Math.floor(c/v.cols)+1}" data-yard-cell="${c}" ${selected&&!placeable.has(c)?'disabled':''} aria-label="Encaixe ${c%v.cols+1}, ${Math.floor(c/v.cols)+1}${placeable.has(c)?': montar aqui':''}"></button>`).join('');
 const parts=v.layout.map(item=>`<button class="og-yard-part" style="grid-column:${item.c%v.cols+1}/span ${item.part.w};grid-row:${Math.floor(item.c/v.cols)+1}/span ${item.part.h}" data-yard-cell="${item.c}" aria-label="${esc(item.part.name)}: remover">${svg(item.p)}</button>`).join('');
 const hangar=v.parts.filter(p=>p.owned).map(p=>`<button class="og-yard-stock ${selected===p.id?'is-selected':''}" data-yard-part="${esc(p.id)}" ${p.placed>=p.owned?'disabled':''}>${svg(p.id)}<span><strong>${esc(p.name)}</strong><small>${p.w}×${p.h} · massa ${p.mass} · ${p.energy>0?'usa '+p.energy:p.energy<0?'gera '+(-p.energy):'sem'} energia · ${p.owned-p.placed}/${p.owned} livre</small><small>${esc(p.text)}</small></span></button>`).join('')||'<p class="og-yard-empty">Hangar vazio. Compre peças nos entrepostos: cada galáxia tem uma facção com peças próprias.</p>';
 const shop=v.faction?`<h3 class="og-yard-heading">${esc(v.faction)} · à venda aqui</h3><div class="og-yard-shop">${v.parts.filter(p=>p.forSale).map(p=>`<article class="og-yard-offer">${svg(p.id)}<span><strong>${esc(p.name)}</strong><small>${p.w}×${p.h} · massa ${p.mass} · ${p.energy>0?'usa '+p.energy:p.energy<0?'gera '+(-p.energy):'sem'} energia</small><small>${esc(p.text)}${p.owned?' · '+p.owned+' no hangar':''}</small></span><button class="og-button small ${p.buy.allowed?'primary':''}" data-action="yardBuy" data-yard-buy="${esc(p.id)}" ${p.buy.allowed?'':'disabled'} title="${esc(p.buy.reason||'')}">${p.price} Lumes</button></article>`).join('')}</div>`:`<p class="og-yard-note">Atraque em um entreposto para comprar peças. Facções: ${v.factions.map(esc).join(' · ')}.</p>`;
 const effects=Object.entries(v.effects).filter(([,n])=>n);
 return {title:'Estaleiro estelar',html:
  `<div class="og-yard"><div class="og-yard-blueprint" style="--cols:${v.cols};--rows:${v.rows}"><span class="og-yard-ship" aria-hidden="true"></span>${cells}${parts}</div><div class="og-yard-side">${meter('Massa',v.mass,v.frameMass,v.mass>v.lightMass)}${meter('Energia',v.energyDraw,v.energySupply,v.energyDraw===v.energySupply&&v.energyDraw>0)}${v.penalty?`<p class="og-yard-note">Nave pesada: −${Math.round(v.penalty*100)}% de voo.</p>`:''}<div class="og-yard-effects">${effects.map(([k,n])=>`<span class="${n>0?'is-up':'is-down'}">${esc(fmt(k,n))}</span>`).join('')||'<span>Casco sem peças</span>'}</div></div></div>`+
  `<p class="og-yard-hint">${selected?'Toque num encaixe destacado para montar. Toque de novo na peça para cancelar.':'Escolha uma peça do hangar. Toque numa peça montada para removê-la.'}</p>`+
  `<h3 class="og-yard-heading">Hangar</h3><div class="og-yard-hangar">${hangar}</div>`+shop+
  `<h3 class="og-yard-heading">Compartilhar modelo</h3><div class="og-yard-share"><code>${esc(v.code)}</code><button class="og-button small" data-action="yard-copy" data-yard-code="${esc(v.code)}">Copiar código</button></div><div class="og-yard-share"><input id="og-yard-code" placeholder="Cole um código ORB1-…" autocomplete="off" aria-label="Código de nave"><button class="og-button small" data-action="yardApply">Aplicar</button></div>`+
  (v.layout.length?'<button class="og-link" data-action="yardClear">Remover todas as peças</button>':'')};
}
// Painted parts atlas (assets/yard-parts.webp, 4 columns × 3 rows in PARTS order) when present, else the vectors.
const images={};
function partImage(id){if(images[id])return images[id];const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(vector(id).replace('<svg ','<svg width="256" height="256" '));return images[id]=im;}
const BOX={x0:.18,x1:.82,y0:.06,y1:.86};
function drawOnHull(c,layout,w,h){
 const {COLS,ROWS,PARTS}=E.yardCatalog,cw=(BOX.x1-BOX.x0)*w/COLS,ch=(BOX.y1-BOX.y0)*h/ROWS,atlas=root.OrbitIllustrations?.yardParts&&root.OrbitArt?.ready('yardParts')?root.OrbitArt.images.yardParts:null;
 for(const item of layout){const part=PARTS.find(p=>p.id===item.p);if(!part)continue;
  const x=-w/2+BOX.x0*w+(item.c%COLS)*cw,y=-h/2+BOX.y0*h+Math.floor(item.c/COLS)*ch,dw=part.w*cw,dh=part.h*ch,size=Math.min(dw,dh)*1.05,cx=x+dw/2,cy=y+dh/2;
  if(atlas){const i=PARTS.indexOf(part),sw=atlas.width/4,sh=atlas.height/3;c.drawImage(atlas,(i%4)*sw,Math.floor(i/4)*sh,sw,sh,cx-size/2,cy-size/2,size,size);}
  else{const im=partImage(part.id);if(im.complete&&im.naturalWidth)c.drawImage(im,cx-size/2,cy-size/2,size,size);}
 }
}
const game=root.document?.getElementById('orbit-game');if(game&&root.OrbitIllustrations?.yardParts)game.style.setProperty('--og-yard-parts-art','url("'+root.OrbitIllustrations.yardParts+'")');
root.OrbitYardUI={sheet,select,svg,selected:()=>selected,drawOnHull,partImage};
})(window);
