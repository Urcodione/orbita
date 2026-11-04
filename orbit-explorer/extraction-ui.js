(function(root){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
root.OrbitExtractionUI={render(state,reward={}){
 const E=root.OrbitEngine,C=root.OrbitCommerce,m=reward.module;
 const names={ore:'Minério',crystals:'Cristais',credits:'Lumes',data:'Pesquisa',fuel:'Combustível',oxygen:'Oxigênio'};
 const items=Object.entries(reward).filter(([k,v])=>typeof v==='number'&&v>0&&(names[k]||E.materials[k]));
 const figure=k=>k==='credits'?C.coin():k==='data'?C.symbol('research'):C.art(k);
 const module=m?`<article class="og-delivery-special" style="--delivery-color:${E.rarities[m.rarity]?.color||'#b5c9d1'}">${root.OrbitArt.icon(m.type,'',m)}<div><small>MÓDULO · ${esc(E.rarities[m.rarity]?.name||'Recuperado')}</small><strong>${esc(m.name)}</strong><span>Guardado no estoque de módulos</span></div></article>`:'';
 const unique=reward.storyItem?`<article class="og-delivery-special is-unique">${root.OrbitCampaignUI.icon(reward.storyItem)}<div><small>DESCOBERTA ÚNICA</small><strong>${esc(reward.storyItem.name)}</strong><span>Preservada · item de missão</span></div></article>`:'';
 const fragment=reward.fragment?`<article class="og-delivery-item is-signal">${root.OrbitControlIcons.art('beacon')}<b>${E.beaconView(state).count}/3</b><span>Farol · ${esc(({origin:'Origem',ember:'Brasa',tide:'Maré'})[reward.fragment])}</span></article>`:'';
 const note=reward.story?.consequence||reward.campaignProgress||'';
 // When the extraction moves the campaign, its story beat (Aurora's first signal, transmissions, a preserved relic) is shown too.
 // The stamp carries the extraction's meaning: the mission milestone it reached and the story beat it unlocked, when
 // there is one; otherwise the plain confirmation. One block, so the receipt still fits a small phone without scrolling.
 const story=reward.story?.advanced&&reward.story.message?reward.story:null,marco=reward.marco;
 const stamp=story||marco?`<div class="og-delivery-stamp is-story">${root.OrbitControlIcons.art('extract')}<div>${marco?`<small class="og-delivery-marco">Marco da missão ${marco.count}/5 · ${esc(marco.label)}</small>`:''}<strong>${esc(story?story.title:'Extração concluída')}</strong>${story?`<p>${esc(story.message)}</p>`:'<small>Itens já guardados na nave</small>'}</div></div>`:`<div class="og-delivery-stamp">${root.OrbitControlIcons.art('extract')}<div><strong>Extração concluída</strong><small>Itens já guardados na nave</small></div></div>`;
 return {singleCard:true,title:'Carga entregue',html:`<section class="og-delivery ${items.length+(fragment?1:0)>6?'is-full':''}" aria-label="Resultado da extração">${stamp}${module}${unique}<div class="og-delivery-grid" style="--delivery-count:${items.length+(fragment?1:0)}">${items.map(([k,v],i)=>`<article class="og-delivery-item" style="--arrival:${i}" aria-label="${esc(E.materials[k]?.name||names[k])}: mais ${v}">${figure(k)}<b>+${v}</b><span>${esc(E.materials[k]?.name||names[k])}</span></article>`).join('')}${fragment}</div>${!items.length&&!m&&!unique&&!fragment?'<p class="og-delivery-empty">Veículo recolhido com segurança. Nenhuma carga nesta saída.</p>':''}${note?`<p class="og-delivery-progress">${esc(note)}</p>`:''}</section>`,footer:`<button class="og-delivery-done" data-action="close-sheet" data-icon-intent="base" aria-label="Concluir entrega e voltar ao planeta"><span class="og-control-symbol">${root.OrbitControlIcons.art('base')}</span><small class="og-control-caption">Concluir</small></button>`};
}};
})(window);
