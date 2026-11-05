(function(root){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={station:0,ore:1,crystals:2,oxygen:3,fuel:4,parts:5};
function art(id){if(id==='warpFuel')return '<span class="og-warp-cell-art" aria-hidden="true"></span>';const g=root.OrbitEngine.materials?.[id],hue=g?.hue||0;if(g?.bio!==undefined)return `<span class="og-trade-art og-bio-art" style="--art-x:${g.bio%2*100}%;--art-y:${Math.floor(g.bio/2)*50}%" aria-hidden="true"></span>`;id=g?.art||id;return `<span class="og-trade-art" style="filter:hue-rotate(${hue}deg);--art-x:${(icons[id]%2)*100}%;--art-y:${Math.floor(icons[id]/2)*50}%" aria-hidden="true"></span>`;}
const purposeByAction={stock:'storage',modules:'modules',fabricator:'modules','components-menu':'components','stock-components':'components',maintenance:'maintenance',workshop:'workshop','campaign-relics':'relics',market:'market'};
const purposeCells={modules:0,components:1,maintenance:2,storage:3,workshop:4,relics:5,market:6,alloy:7,prism:8,circuit:9,seal:10,'field-core':11,battery:12,research:13,currency:14};
function coin(kind='gold'){return `<span class="og-lume-art" data-lume="${kind}" style="--lume-x:${({gold:0,buy:50,sell:100})[kind]||0}%" aria-hidden="true"></span>`;}
function symbol(id){
 if(id==='currency')return coin();

 const cell=purposeCells[id];if(cell===undefined)return art(id);
 return `<span class="og-purpose-art" data-purpose="${id}" style="--purpose-x:${cell%3*50}%;--purpose-y:${Math.floor(cell/3)*25}%" aria-hidden="true"></span>`;
}
function quantityLabel(g){return g.resell?g.owned+' unidades':g.owned+' / '+g.cap;}
const tile=(action,title,sub,id,attrs='')=>`<button class="og-trade-tile" data-action="${action}" ${attrs}>${purposeByAction[action]?symbol(purposeByAction[action]):art(id)}<strong>${esc(title)}</strong><small>${esc(sub)}</small></button>`;
function marketCard(g){
 return `<button class="og-market-card" data-action="market-item" data-resource="${g.id}" aria-label="${esc(g.name)}, comprar por ${g.buy} Lumes${g.resell?', vender por '+g.sell:''}"><span class="og-market-display">${art(g.id)}</span><strong>${esc(g.name)}</strong><span class="og-market-prices"><span><small>COMPRAR</small><b>${g.buy}<em> L</em></b></span><span><small>${g.resell?'VENDER':'RESERVA'}</small><b>${g.resell?g.sell:'—'}<em>${g.resell?' L':''}</em></b></span></span><small class="og-market-stock">Estação ${g.stock} · Nave ${g.owned}</small></button>`;
}
function tradeMode(side,g,v){
 const buy=side==='buy',available=buy||g.resell;
 return `<button class="og-trade-mode" data-trade-side="${side}" aria-pressed="${v.side===side}" ${available?'':'disabled'}><span class="og-trade-mode-art" aria-hidden="true">${coin(side)}</span><strong>${buy?'Compra':'Venda'}</strong><small>${available?(buy?g.buy:g.sell)+' L/un.':'Sem revenda'}</small></button>`;
}
function pairs(items){let out='';for(let i=0;i<items.length;i+=2)out+=`<div class="og-trade-grid">${items.slice(i,i+2).join('')}</div>`;return out;}
function render(state,sheet,v){
 const E=root.OrbitEngine,m=E.market(state),balance=`<div class="og-trade-balance"><span>${esc(m.systemName)}</span><strong>${coin()}${state.resources.credits} Lumes</strong></div>`;
 if(sheet==='station')return {singleCard:true,title:m.name,header:balance,html:(root.OrbitCampaignUI?.station(state)||'')+'<div class="og-station-destinations">'+[tile('market','Mercado','Comprar e vender','crystals'),tile('contracts','Encomendas','Entregas únicas','parts'),tile('stock','Meu estoque','Carga e reservas','parts'),tile('xeno-tools','Captura','Ferramentas únicas','parts'),root.OrbitCivilizationsUI?.entry(state)||'',tile('fleet','Hangar','Minhas naves','parts')].join('')+'</div>'+(root.OrbitFleetUI?.stationRow(state)||''),footer:`<p class="og-note">Retorno: ${E.preview(state,'stationLeave').cost?.fuel??'—'} combustível · 2 O₂</p><button class="og-button" data-action="stationLeave" ${E.preview(state,'stationLeave').allowed?'':'disabled'}>Desatracar · retornar à órbita</button>`};
 if(sheet==='stock'){
  const groups=[['Reservas','fuel'],['Minerais','ore'],['Líquidos','salmoura'],['Gases','oxygen'],['Flora','lumenfern'],['Fauna','mossfox']];
  const groupOf=g=>E.materials[g.id]?.category||(['ore','crystals'].includes(g.id)?'Minerais':'Reservas');
  const items=v.stockGroup?m.rows.filter(g=>groupOf(g)===v.stockGroup):[];
  const heading=`<p class="og-storage-capacity">Carga ${E.storageView(state).used}/${E.storageView(state).capacity} vol. · Módulos ${state.inventory.length}/${E.stats(state).cargoCapacity}</p>`;
  const cards=v.stockGroup?items.map(g=>tile('market-item',g.name,quantityLabel(g)+' a bordo',g.id,`data-resource="${g.id}"`)).join(''):groups.map(([name,id])=>`<button class="og-trade-tile" data-stock-group="${name}">${art(id)}<strong>${name}</strong><small>${m.rows.filter(g=>groupOf(g)===name).reduce((sum,g)=>sum+g.owned,0)} un.</small></button>`).join('')+tile('modules','Módulos',state.inventory.length+' guardados','parts')+tile('stock-components','Componentes',Object.values(state.components||{}).reduce((a,b)=>a+b,0)+' peças','parts')+tile('campaign-relics','Relíquias','Coro do Limiar','parts');
  return {singleCard:true,title:v.stockGroup||'Estoque da nave',header:heading,html:`<div class="og-stock-board">${cards||'<p>Nenhum material desta categoria descoberto.</p>'}</div>`};
 }

 if(sheet==='market'){
 const groups=[['Reservas','fuel'],['Minerais','ore'],['Líquidos','salmoura'],['Gases','oxygen'],['Flora','lumenfern'],['Fauna','mossfox']],groupOf=g=>E.materials[g.id]?.category||(['ore','crystals'].includes(g.id)?'Minerais':'Reservas');
 const rows=m.rows.filter(g=>groupOf(g)===(v.marketGroup||'Reservas'));
 return {singleCard:true,title:'Mercado regional',header:balance,html:`<div class="og-market-categories">${groups.map(([name,id])=>`<button data-market-group="${name}" aria-pressed="${(v.marketGroup||'Reservas')===name}">${art(id)}<small>${name}</small></button>`).join('')}</div><div class="og-market-products">${rows.map(marketCard).join('')||'<p>Sem produtos descobertos nesta categoria.</p>'}</div><p class="og-note">Reposição em até ${Math.ceil(m.refreshSeconds/60)} min · valores em Lumes</p>`};
 }

 const g=m.rows.find(g=>g.id===v.resource)||m.rows[0],q=E.tradeQuote(state,{resource:g.id,quantity:v.quantity,side:v.side});
 if(v.origin==='stock')return {singleCard:true,cardKind:'resource',title:g.name,html:`<article class="og-stock-detail">${art(g.id)}<h3>${esc(g.name)}</h3><strong>${g.owned}${g.resell?'':' <small>/ '+g.cap+'</small>'}</strong><p>Unidades a bordo</p>${g.resell?'':`<span class="og-stock-meter"><i style="width:${Math.min(100,g.owned/g.cap*100)}%"></i></span>`}<p>${g.resell?'Cada unidade ocupa 1 de volume no depósito.':'Reserva operacional da nave.'}</p><p>Depósito: ${E.storageView(state).used}/${E.storageView(state).capacity} volume</p>${g.resell&&g.owned?`<button class="og-panel-figure" data-action="discard-review" data-kind="resource" data-id="${g.id}">${symbol('storage')}<small class="og-control-caption">Liberar espaço</small></button>`:''}</article>`};
 return {singleCard:true,cardKind:'trade',title:g.name,header:balance,html:`<div class="og-product-identity"><button class="og-object-arrow" data-resource-step="-1" aria-label="Recurso anterior">${root.OrbitJourney.cosmicArrow()}<small>Anterior</small></button>${art(g.id)}<div><strong>${g.label}</strong><small>Estação ${g.stock} · Nave ${quantityLabel(g)}</small></div><button class="og-object-arrow" data-resource-step="1" aria-label="Próximo recurso">${root.OrbitJourney.cosmicArrow(true)}<small>Próximo</small></button></div><div class="og-trade-modes" role="group" aria-label="Operação de mercado">${tradeMode('buy',g,v)}${tradeMode('sell',g,v)}</div><div class="og-trade-quantity"><button data-trade-step="-1" aria-label="Diminuir quantidade">−</button><strong>${v.quantity} un.</strong><button data-trade-step="1" aria-label="Aumentar quantidade">+</button>${[1,5,10].map(n=>`<button data-trade-quantity="${n}" aria-pressed="${v.quantity===n}" aria-label="Selecionar ${n} unidades"><strong>${n}</strong><small>un.</small></button>`).join('')}</div><p class="og-note">${g.resell?`Compra local: até ${g.demandRemaining} un. · caixa ${m.buyingBudget} Lumes`:'Reserva operacional · sem revenda'}</p><p class="og-note">${q.allowed?`Total: ${q.total} Lumes · cotação progressiva por unidade.`:esc(q.reason)}</p>`,footer:`<button class="og-button primary" data-action="trade-confirm" data-total="${q.total||0}" data-trade-direction="${v.side}" ${q.allowed?'':'disabled'}>${v.side==='buy'?'Confirmar compra':'Confirmar venda'} · ${v.quantity} · ${q.total||0} Lumes</button>`};
}
root.OrbitCommerce={render,art,symbol,coin,purposeByAction,pairs,tile};
})(window);
