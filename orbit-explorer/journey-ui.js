(function(root){
'use strict';
for(const [key,name]of [['ship','ship'],['worlds','world']])document.getElementById('orbit-game').style.setProperty('--og-'+name+'-art','url("'+root.OrbitIllustrations[key]+'")');
const E=root.OrbitEngine,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={book:'M12 5C8 2 3 3 3 3v17s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Zm0 0v17',help:'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4M12 18v1M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',play:'m8 4 12 8-12 8Z',sound:'m3 9 5 0 5-5v16l-5-5H3Zm13-2q6 5 0 10',restart:'M4 10a8 8 0 1 1 1 8M4 3v7h7',back:'M20 12H4m7-7-7 7 7 7',scan:'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 12l8-8M12 11v2',dock:'M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4',launch:'M12 20V4m-5 5 5-5 5 5M4 18v3h16v-3',workshop:'m14 5 5 5M4 20l7-7M14 3a6 6 0 0 0-7 8l-4 5a3 3 0 0 0 5 5l5-5a6 6 0 0 0 8-7l-5 3-4-4Z',cargo:'m3 7 9-4 9 4v12l-9 3-9-3ZM3 7l9 4 9-4M12 11v11',route:'M5 19 10 5l4 14 5-14M3 19h4M17 5h4',ship:'M8 17V9l4-6 4 6v8ZM8 12l-4 7h4m8-7 4 7h-4M10 20v2m4-2v2',hull:'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z',oxygen:'M9 3h6M12 3v3M8 6h8v15H8ZM8 11h8',fuel:'M4 21V4h9v17M4 10h9M2 21h13M13 11h3v6c0 3 4 3 4 0V8l-3-3M18 6v4h2',reserve:'M9 2h6v3h4v17H5V5h4ZM13 8l-4 6h5l-3 5',return:'M8 4 3 9l5 5M3 9h10a7 7 0 0 1 0 14',free:'M5 12l4 4L19 6'};
function glyph(key){return `<svg class="og-gauge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="${paths[key]||paths.reserve}"/></svg>`;}
function rack(v){return `<span class="og-journey-rack" aria-label="${v.completed} de 8 tecnologias construídas">${Array.from({length:8},(_,i)=>`<i class="${i<v.completed?'is-done':i===v.completed?'is-current':''}"></i>`).join('')}</span>`;}
function tracker(s){if(s.guide?.active||!s.campaign?.introSeen)return '';const lead=E.campaignLead(s);return `<button class="og-journey-track" data-action="journey" aria-label="Objetivo: ${esc(lead.title)}. ${esc(lead.progress)}. ${lead.completed} de 8 tecnologias."><span><b>${lead.completed===8?'CORO COMPLETO':'SALVAR ÍRIS'}</b>${rack(lead)}<small>${lead.completed}/8</small></span><strong>${esc(lead.title)} <i aria-hidden="true">›</i></strong><small class="og-journey-local">${esc(lead.progress)}</small></button>`;}
function costs(s,cost){const names={fuel:'Combustível',oxygen:'Oxigênio',hull:'Casco'};return `<div class="og-departure-costs">${Object.entries(cost).filter(([,n])=>n>0).map(([key,n])=>`<span data-cost-resource="${key}" class="${s.resources[key]<(key==='hull'?n+1:n)?'is-short':''}">${glyph(key)}<b>−${n}</b><small>${names[key]}<br>${s.resources[key]} a bordo</small></span>`).join('')}</div>`;}
function debrief(s,event){if(!event)return '';return `<article class="og-story-receipt ${event.advanced?'is-progress':''}" role="status"><small>${event.advanced?'✦ SINAL CONFIRMADO':'CARGA EXTRAÍDA · SINAL PENDENTE'}</small><h3>${esc(event.title)}</h3><p>${esc(event.message)}</p>${event.consequence?`<p class="og-consequence"><b>O que mudou</b> · ${esc(event.consequence)}</p>`:''}${event.advanced?`<div><span>Núcleos <b>${Math.min(event.sites,event.required)}/${event.required}</b></span><span>Mundos <b>${Math.min(event.worlds,event.worldsRequired)}/${event.worldsRequired}</b></span><span>Sistemas <b>${Math.min(event.systems,event.systemsRequired)}/${event.systemsRequired}</b></span></div>`:''}</article>`;}
function sheet(s){const lead=E.campaignLead(s),v=E.campaignView(s),a=v.active,r=E.campaignRecipes.find(r=>r.id===a?.recipeId);return {singleCard:true,title:'Seu próximo passo',header:`<button class="og-journey-banner" data-action="campaign" aria-label="Ver a história do Coro do Limiar"><span><b>SALVAR ÍRIS · ${lead.completed}/8</b>${rack(lead)}</span><small>${v.finished?'Aurora reencontrada. Nosso lar voltou a respirar.':'Oito tecnologias para alcançar Aurora e restaurar a vida em casa.'}</small></button>`,html:`<article class="og-journey-next">${r?root.OrbitArt.icon(r.type,'',r):''}<div><small>AGORA · ${esc(lead.progress)}</small><h3>${esc(lead.title)}</h3><p>${esc(lead.detail)}</p>${r?`<b>Desbloqueia: ${esc(r.name)}</b>`:''}</div></article>${a?`<div class="og-journey-checklist"><span>${Math.min(a.sitesDone,a.sitesRequired)}/${a.sitesRequired} núcleos</span><span>${Math.min(a.worldsDone,a.worldsRequired)}/${a.worldsRequired} mundos</span><span>${Math.min(a.systemsDone,a.systemsRequired)}/${a.systemsRequired} sistemas</span><span>${a.itemOwned?'✓':'◇'} descoberta única</span></div>`:''}`,footer:`<button class="og-button primary" data-action="${lead.action}">${esc(lead.label)}</button>`};}

function controlArt(action,key){
 const semantic=root.OrbitControlIcons?.forAction(action);if(semantic)return semantic;
 if(root.OrbitCommerce.purposeByAction[action])return root.OrbitCommerce.symbol(root.OrbitCommerce.purposeByAction[action]);
 if(action==='customize')return '<svg class="og-paint-tool" viewBox="0 0 72 72" aria-hidden="true"><defs><linearGradient id="paintMetal" x2="1" y2=".3"><stop stop-color="#405768"/><stop offset=".45" stop-color="#d3e3df"/><stop offset="1" stop-color="#536e7b"/></linearGradient></defs><ellipse cx="31" cy="64" rx="24" ry="5" fill="#0008"/><path d="M10 25 15 59Q31 69 48 59L53 25Z" fill="url(#paintMetal)" stroke="#243b48" stroke-width="2"/><path d="M14 34 17 56Q32 63 46 56L49 34Z" fill="#e98d48"/><ellipse cx="31" cy="25" rx="22" ry="9" fill="#d8e7df"/><ellipse cx="31" cy="25" rx="18" ry="6" fill="#6cc6c1"/><path d="M16 24v-8Q31-2 46 16v8" fill="none" stroke="#a2bdc5" stroke-width="3"/><path d="m46 44 14-36q4-5 6 0L55 47Z" fill="#c37d44" stroke="#432c29" stroke-width="2"/><path d="m44 43 12 4-3 9-12-4Z" fill="#d3d9d0"/><path d="m41 51 12 4-4 12-12-4Z" fill="#74d2cc"/><path d="M20 33v12q4 6 7 0V34" fill="#6cc6c1"/></svg>';

 const module={scan:'scanner',expeditionScan:'scanner',environment:'shield',workshop:'arm',modules:'cargo',stock:'cargo','expedition-cargo':'cargo',expeditionCollect:'arm',expeditionExtract:'cargo',expeditionInteract:'scanner',help:'survival',sound:'scanner','warp-menu':'warp',campaign:'warp'}[action];
 if(action==='station')return root.OrbitCommerce.art('station');
 if(action==='workshop')return root.OrbitCommerce.art('parts');
 if(module)return root.OrbitArt.icon(module,'og-action-art',action==='campaign'?{mission:true}:null);
 if(action==='catalog'||action==='sites'||key==='dock')return '<span class="og-action-world" aria-hidden="true"></span>';
 if(['route','launch','ship','return','restart','play'].includes(key))return '<span class="og-action-ship" aria-hidden="true"></span>';
 return root.OrbitArt.icon('scanner','og-action-art');
}
function cosmicArrow(forward=false){
 return `<svg class="og-cosmic-arrow" viewBox="0 0 24 24" aria-hidden="true"><g transform="${forward?'translate(24 0) scale(-1 1)':''}"><path d="m13 5-7 7 7 7" fill="none" stroke="#b6ced9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 12h12" fill="none" stroke="#789daa" stroke-width="1.6" stroke-linecap="round"/></g></svg>`;
}
function arrowControls(container){
 container.querySelectorAll('button[data-action="module-slide"],button[data-sheet-page]').forEach(button=>{
  const forward=Number(button.dataset.step||button.dataset.sheetPage)>0;
  button.classList.add('og-cosmic-control');
  button.innerHTML=cosmicArrow(forward)+'<small class="og-control-caption">'+(forward?'Próximo':'Anterior')+'</small>';
 });
}
function backControls(container){
 arrowControls(container);
 container.querySelectorAll('.og-place-exit,.og-ship-back,.og-lab-back,.og-catalog-back,button[data-action="nav-back"],button[data-action="ship-back"],button[data-action="close-sheet"]').forEach(button=>{
  if(button.classList.contains('og-menu-resume'))return;
  const cancel=button.textContent.trim().startsWith('Cancelar');
  if(button.dataset.action==='close-sheet'&&!/^(Voltar|Retornar|Continuar)/.test(button.textContent.trim()))return;
  const destination=button.getAttribute('aria-label')||button.textContent.trim().replace(/^‹\s*/,'');
  button.setAttribute('aria-label',destination.startsWith('Voltar')?destination:'Voltar: '+destination);
  button.title=button.getAttribute('aria-label');button.classList.add('og-back-control');
  // Panel arrows name the place they return to (Menu, Oficina, Receita...), as ROTAS.md describes; generic
  // "Voltar"/"Continuar" buttons and cancels keep their verb.
  const place=destination.replace(/^Voltar:\s*/,'');
  const named=!cancel&&button.dataset.action!=='close-sheet'&&place&&!/^(Voltar|Retornar|Continuar)/.test(place);
  button.innerHTML=cosmicArrow()+'<small class="og-control-caption'+(named?' og-place-caption':'')+'">'+esc(cancel?'Cancelar':named?place:'Voltar')+'</small>';
 });
}
function panelFigures(container){
 container.querySelectorAll('button[data-catalog-planet]').forEach(b=>{if(!b.querySelector('[data-icon=route]')){const label=b.textContent.trim();b.classList.add('og-panel-figure');b.innerHTML=root.OrbitControlIcons.art('route')+'<small class="og-control-caption">'+esc(label)+'</small>';}});
 const entries={
  'confirm-field-action':['survival',null],
  sound:['scanner',null],'save-checkpoint':['cargo','Guardar ponto'],'save-export':['cargo','Exportar'],'save-import':['cargo','Importar'],'save-restore':['scanner','Recuperação'],'save-accept':['cargo','Substituir'],
  'campaign-route':['warp','Localizar sinal'],campaignClaim:['scanner','Decifrar'],campaignCross:['warp','Atravessar'],campaignReturnHome:['warp','Retornar a Íris'],contractDeliver:['cargo','Entregar'],
  market:['crystals','Mercado'],stock:['cargo','Minha carga'],'discard-review':['cargo','Liberar espaço'],discardCargo:['cargo','Descartar'],equip:['arm','Instalar'], 'compare-module':['arm','Encaixar'], 'salvage-review':['parts','Reciclar'],salvage:['parts','Desmontar'],
  fabricate:['parts','Montar módulo'],craftComponent:['parts',null],refine:['warpFuel','Refinar'],
  expeditionBeacon:['scanner','Ativar baliza'],expeditionWait:['shield','Aguardar'],stationDock:['warp','Viajar e atracar'],stationLeave:['engine','Desatracar'],warp:['warp','Iniciar dobra'],explore:['survival','Pilotar'], 'site-details':['shield','Requisitos'],
  expeditionRecover:['scanner','Recuperar'],expeditionSalvage:['parts','Recuperar peças'],
  expeditionAbort:['survival','Evacuar'],expeditionOverdrive:['engine','Descarga'],
  'overdrive-menu':['engine','Energia de emergência'],'trade-confirm':['cargo',null],
  campaignBuyRelic:['warp','Comprar relíquia'],'campaign-gate':['warp','Limiar'],
  'campaign-ending':['warp','Continuar'], 'confirm-reset':['warp','Começar do zero']
 };
 container.querySelectorAll('button[data-action]').forEach(button=>{
  const config=entries[button.dataset.action];
  if(!config||button.classList.contains('og-component-slot')||button.classList.contains('og-descent-entry')||button.classList.contains('og-trade-tile')||button.querySelector('.og-painted-module,.og-trade-art,.og-cosmic-arrow'))return;
  const full=button.getAttribute('aria-label')||button.textContent.trim(),cost=button.querySelector('.og-cost')?.outerHTML||'';
  const label=button.dataset.caption||config[1]||button.textContent.trim();
  button.setAttribute('aria-label',full);button.title=full;button.classList.add('og-panel-figure');if(container.id==='og-context')button.classList.add('og-figure-control');
  const art=root.OrbitControlIcons?.forAction(button.dataset.action,button)||(button.dataset.action==='trade-confirm'?root.OrbitCommerce.coin(button.dataset.tradeDirection||'buy'):root.OrbitCommerce.purposeByAction[button.dataset.action]?root.OrbitCommerce.symbol(root.OrbitCommerce.purposeByAction[button.dataset.action]):['parts','crystals','warpFuel'].includes(config[0])?root.OrbitCommerce.art(config[0]):root.OrbitArt.icon(config[0]));
  button.innerHTML='<span class="og-control-symbol" aria-hidden="true">'+art+'</span><small class="og-control-caption">'+esc(label)+'</small>'+cost;
 });
}
function controls(container){
 backControls(container);
 panelFigures(container);
 const symbols={expeditionCollect:'cargo',expeditionExtract:'cargo',expeditionInteract:'scan',expeditionReturn:'return',claimBeacon:'scan','module-info':'ship','ship-back':'return',customize:'ship',station:'cargo','expedition-abort-menu':'launch','expedition-return':'return',scan:'scan',expeditionScan:'scan',dock:'dock',launch:'launch',sites:'route',environment:'hull','route-info':'route','planet-info':'scan',workshop:'workshop',modules:'cargo','open-interior':'ship','expedition-cargo':'cargo','warp-menu':'route',travel:'route'};
 container.querySelectorAll('button.og-button[data-action],button.og-link[data-action],button.og-button[data-tab],button.og-link[data-tab],button.og-button[data-map-level],button.og-link[data-map-level]').forEach(button=>{
  if(button.classList.contains('og-descent-entry'))return;
 const key=symbols[button.dataset.action]||(button.dataset.mapLevel?(button.dataset.mapLevel==='system'?'dock':'route'):({galaxy:'route',explore:'dock',expedition:'route',ship:'ship'}[button.dataset.tab]));
  if(!key||button.querySelector('svg,.og-painted-module,.og-control-symbol'))return;
  const label=button.getAttribute('aria-label')||button.textContent.trim();
  button.setAttribute('aria-label',label);button.title=label;
  if(container.id==='og-context'){
   button.classList.add('og-figure-control');
   const captions={scan:'Analisar',expeditionScan:'Scanner',dock:/submer/i.test(label)?'Submergir':/sonda/i.test(label)?'Sondar':'Ancorar',launch:'Decolar',sites:'Explorar',environment:'Proteção','route-info':/Viajar/.test(label)?'Viajar':'Rota','planet-info':'Análise',workshop:'Oficina',modules:'Peças','open-interior':'Abrir nave','module-info':'Módulo',customize:'Pintura',station:'Estação','warp-menu':'Viajar',travel:'Viajar',expeditionCollect:'Coletar',expeditionExtract:'Extrair',expeditionInteract:'Circuito',expeditionReturn:'Retornar','expedition-return':/Ponto de extração/.test(label)?'Base':'Retornar','expedition-cargo':'Carga','expedition-abort-menu':'Evacuar',claimBeacon:'Reconstruir'};
   const caption=button.dataset.caption||captions[button.dataset.action]||({system:'Mundos',galaxy:'Sistemas',universe:'Dobra'}[button.dataset.mapLevel])||({galaxy:'Mapa',explore:'Explorar',ship:'Nave',expedition:'Retomar'}[button.dataset.tab])||label;
   const cost=button.querySelector('.og-cost')?.outerHTML||'';
   button.innerHTML='<span class="og-control-symbol" aria-hidden="true">'+(button.dataset.mapLevel?root.OrbitControlIcons.art(button.dataset.mapLevel==='system'?'worlds':button.dataset.mapLevel==='universe'?'warp':'route'):button.dataset.tab&&button.dataset.tab!=='ship'?root.OrbitControlIcons.art(({galaxy:'route',explore:'worlds',expedition:'rover'})[button.dataset.tab]||'route'):controlArt(button.dataset.action,key))+'</span><small class="og-control-caption">'+esc(caption)+'</small>'+cost;
  }else {
   const cost=button.querySelector('.og-cost')?.outerHTML||'';
   const caption=button.textContent.replace(button.querySelector('.og-cost')?.textContent||'','').trim();
   button.classList.add('og-panel-figure');
   button.innerHTML='<span class="og-control-symbol" aria-hidden="true">'+(button.dataset.mapLevel?root.OrbitControlIcons.art(button.dataset.mapLevel==='system'?'worlds':button.dataset.mapLevel==='universe'?'warp':'route'):button.dataset.tab&&button.dataset.tab!=='ship'?root.OrbitControlIcons.art(({galaxy:'route',explore:'worlds',expedition:'rover'})[button.dataset.tab]||'route'):controlArt(button.dataset.action,key))+'</span><small class="og-control-caption">'+esc(caption)+'</small>'+cost;
  }
 });
 root.OrbitControlIcons?.apply(container);
 if(container.id==='og-context'){
  const buttons=[...container.querySelectorAll('.og-figure-control,.og-back-control')];
  if(buttons.length){const dock=document.createElement('div');dock.className='og-action-dock';dock.style.setProperty('--actions',root.document.getElementById('orbit-game').dataset.fieldActive==='true'?buttons.length:Math.min(buttons.length,buttons.length>4?3:4));buttons.forEach(b=>dock.append(b));container.querySelectorAll('.og-context-links,.og-field-actions').forEach(group=>{if(!group.children.length)group.remove();});container.append(dock);}
 }
}
function menu(sound,saveNote){
 const entries=[['campaign','scan','Missão'],['campaign-intro','play','Introdução'],['stock','cargo','Estoque'],['workshop','workshop','Oficina'],['catalog','book','Catálogo'],['help','help','Ajuda'],['settings','sound','Som e efeitos'],['saves','cargo','Partida segura'],['reset-menu','restart','Nova jornada']];
 const rows=[];for(let i=0;i<entries.length;i+=3)rows.push('<div class="og-menu-row">'+entries.slice(i,i+3).map(([action,icon,label])=>`<button class="og-menu-tile" data-action="${action}" aria-label="${label}">${controlArt(action,icon)}<small>${label}</small></button>`).join('')+'</div>');
 return {title:'Pausa entre as estrelas',html:rows.join('')+`<p class="og-save-note">${esc(saveNote)}</p>`,footer:'<button class="og-menu-resume" data-action="close-sheet">'+glyph('play')+'<small>Continuar</small></button>'};
}
root.OrbitJourney={cosmicArrow,glyph,tracker,costs,debrief,sheet,controls,backControls,menu};
})(window);

window.OrbitHelp={topic:0,render(){const topics=[
 ['Primeiro pouso','scanner','Analise o planeta em órbita. Confira a proteção, escolha um ponto e desça. Você vê os custos antes de confirmar.'],
 ['Pilotar e coletar','arm','Toque nos setores vizinhos. Observe a energia restante e o custo do retorno. O scanner revela caminhos; balizas, tempestades e coleta intensiva exigem decisões.'],
 ['Núcleo e extração','cargo','Alinhe os rotores do circuito. Girar um também gira o próximo. Recupere o núcleo e volte ao ponto de partida: só a extração confirma a carga e o progresso.'],
 ['Equipamentos','shield','Abra a nave e toque num módulo. Compare atributos antes de instalar. Cada ambiente exige proteções próprias. Favorite peças úteis para evitar reciclá-las.'],
 ['Oficina e reservas','life','Fabrique componentes e módulos na oficina. Na manutenção, confira os ingredientes e o saldo antes de repor reservas. Componentes também ocupam o depósito.'],
 ['Rumo a Aurora','warp','Siga a missão do Coro do Limiar. Cada capítulo revela uma descoberta única e uma receita. Reúna oito tecnologias para atravessar o Olho de Íris e restaurar a vida em casa.'],
 ['Mapa e comércio','engine','Sistema mostra planetas; Galáxia mostra sistemas e o entreposto. Viaje e atraque na estação para negociar. Outras galáxias só revelam seus mundos após a dobra.']];const i=Math.min(this.topic,topics.length-1),[title,type,body]=topics[i];return {singleCard:true,title:'Guia de bordo',html:`<label class="og-atlas-picker">Assunto<select data-help-topic>${topics.map((t,n)=>`<option value="${n}" ${n===i?'selected':''}>${t[0]}</option>`).join('')}</select></label><article class="og-atlas-detail">${window.OrbitArt.icon(type)}<h3>${title}</h3><p>${body}</p></article>`};}};
