(function () {
  'use strict';
  const root=document.getElementById('orbit-game');
  if(!root||!window.OrbitEngine||!window.OrbitScene)return;
  if(window.orbitApp?.destroy)window.orbitApp.destroy();
  const audioModule=window.OrbitAudio;
  const E=window.OrbitEngine,$=id=>root.querySelector('#'+id),storageKey='orbita-explorador-v1';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Math.round(Number(v)||0),power=v=>Number(v).toFixed(2).replace('.',',');
  const biomes={forest:'Floresta viva',volcanic:'Mundo vulcânico',ice:'Mundo glacial',desert:'Deserto mineral',ocean:'Oceano global',crystal:'Mundo cristalino',gas:'Gigante gasoso',toxic:'Mundo corrosivo',magma:'Oceano de magma',rogue:'Mundo errante'};
  const starNames={yellow:'Estrela amarela','red-dwarf':'Anã vermelha','blue-giant':'Gigante azul',pulsar:'Pulsar',binary:'Estrelas binárias'};
  const capNames={heat:'Calor',cold:'Frio',radiation:'Radiação',pressure:'Pressão',toxicity:'Filtragem',gas:'Sonda atmosférica',liquid:'Submersão'};
  const codes={engine:'EN',warp:'DB',life:'O₂',shield:'RD',scanner:'SC',arm:'BC',cargo:'AR',survival:'SV'};
  const labels={engine:'Motor de impulso',warp:'Núcleo de dobra',life:'Suporte de vida',shield:'Blindagem ambiental',scanner:'Scanner orbital',arm:'Braço coletor',cargo:'Armazém',survival:'Sobrevivência'};
  const shortLabels={engine:'Motor',warp:'Dobra',life:'Oxigênio',shield:'Escudo',scanner:'Scanner',arm:'Coletor',cargo:'Depósito',survival:'Kit de resgate'};
  const cargoLabels={ore:'Minério',crystals:'Cristais',oxygen:'Oxigênio'};
  const fittings={engine:'O sino do motor se conecta à linha de combustível na base do foguete.',warp:'A bobina toroidal desliza sobre o núcleo e trava no barramento de energia.',life:'Cilindros de oxigênio conectados ao circuito de ar pressurizado.',shield:'Um emissor com aletas distribui proteção pela estrutura do casco.',scanner:'A antena se encaixa no suporte superior, junto à cabine.',arm:'Uma articulação conecta a garra à lateral da nave.',cargo:'Caixas para minérios e cristais, com tanques para gases nas laterais.',survival:'Um estojo removível com suprimentos para expedições na superfície.'};
  const paints=[['#f0a270','Laranja solar'],['#71bdc4','Azul aurora'],['#c9b1df','Lilás nebulosa'],['#9bb68c','Verde musgo'],['#e7d8b5','Areia lunar'],['#f4b8cc','Rosa pétala'],['#b4dfcc','Menta'],['#b9cafa','Céu de algodão'],['#f4e5a5','Baunilha']];
  const costNames={...Object.fromEntries(Object.entries(E.materials||{}).map(([id,g])=>[id,g.name])),fuel:'comb.',oxygen:'O₂',hull:'casco',warpFuel:'células',ore:'minério',crystals:'cristais',credits:'Lumes',data:'pesquisa',reserve:'energia',integrity:'integridade'};
  const terrainNames={beacon:'Baliza de triangulação',base:'Ponto de extração',core:'Sinal antigo',ore:'Veio mineral',data:'Arquivo de pesquisa',crystal:'Cristais',hazard:'Travessia perigosa (energia e integridade)',wall:'Obstáculo',empty:'Terreno livre',unknown:'Setor desconhecido'};
  const directions=['Cima','Direita','Baixo','Esquerda'],arrows=['↑','→','↓','←'];
  let moduleOrigin='inventory',cardPage=0;
  let discardChoice=null;
  let commerceView={resource:'ore',quantity:1,side:'buy'};
  let campaignPage='mission';
  let state=E.create(),tab='explore',selected=state.location.planetId,sheet=null,inventoryTab='inventory';
  let shipDetail={mode:'exterior',selectedModule:null,expanded:false},cargoResource='ore';
  let mapLevel='system',selectedSystem=null,selectedDestination=null,environmentSite=null;
  let pendingImport=null;
  let reward=null,sheetNotice='',sound=window.OrbitAudio.prefs.sound,saveNote='O progresso será salvo automaticamente.',focusBeforeSheet=null,toastTimer,effectTimer;
  let fieldNotice='Toque em um setor vizinho para mover. O sinal antigo está ao norte.';
  let systemType='engine',selectedCandidateId='',salvageModuleId=null;
  let sheetPage=0,pendingFieldAction=null;
  const history={past:[],future:[]};
  let restoringNavigation=false;
  let lab={page:'home',type:null,recipeId:null,componentId:null,returnRecipeId:null,history:[]};
  let catalogView={page:'systems',systemId:null};
  const roles={engine:'Converte combustível em alcance entre mundos.',warp:'Dobra o espaço e reduz o custo para alcançar outras galáxias.',life:'Mantém o ar respirável e sustenta o tempo de exploração.',shield:'Protege a nave e o veículo. Cada blindagem resiste a perigos diferentes.',scanner:'Revela o terreno oculto e transforma sinais em pesquisa.',arm:'Extrai recursos; uma garra eficiente coleta mais gastando menos energia.',cargo:'Guarda módulos a bordo e define quanto o veículo pode trazer de volta.',survival:'Sustenta a expedição longe da nave e reduz riscos nas travessias.'};
  const scene=new window.OrbitScene($('og-canvas'),{onSelectModule:type=>{if(canvasAllowed())navigate(()=>focusModule(type));},onOpenShip:()=>{if(canvasAllowed())navigate(()=>showShip('interior'));},onHotspots:positionHotspots,onModulePose:applyModulePose,onCargoSelect:key=>{if(canvasAllowed())navigate(()=>openCargo(key));}});
  const fieldScene=window.OrbitExpeditionScene?new window.OrbitExpeditionScene($('og-field-canvas'),{onSelectCell:(x,y)=>act('expeditionMove',{x,y})}):null;
  const here=()=>E.currentPlanet(state),target=()=>state.galaxy.planets.find(p=>p.id===selected)||here();
  const rarity=m=>E.rarities[m.rarity];
  function applySnapshot(snapshot){
    const s=snapshot&&(snapshot.privateContent||snapshot);if(!s)return false;
    const restored=E.restore(s.state);if(!restored)return false;
    state=restored;tab=['ship','explore','galaxy','expedition'].includes(s.tab)?s.tab:s.tab==='log'?'expedition':'explore';if(state.expedition)tab='expedition';selected=state.galaxy.planets.some(p=>p.id===s.selected)?s.selected:state.location.planetId;
    const d=s.shipDetail;shipDetail=d&&['exterior','interior','module'].includes(d.mode)?{mode:d.mode,selectedModule:labels[d.selectedModule]?d.selectedModule:null,expanded:!!d.expanded}:{mode:'exterior',selectedModule:null,expanded:false};
    mapLevel=['system','galaxy','universe'].includes(s.mapLevel)?s.mapLevel:'system';selectedSystem=s.selectedSystem||null;selectedDestination=s.selectedDestination||null;
    if(shipDetail.mode==='module'&&!shipDetail.selectedModule)shipDetail.mode='interior';return true;
  }
  let tutorialCleanup=null;
  let loaded=false;
  if(window.openai?.widgetState)loaded=applySnapshot(window.openai.widgetState);
  let recovered=false;if(!loaded){const stored=window.OrbitSaves.read();if(stored){loaded=applySnapshot(stored.value);recovered=stored.recovered;}}
  if(loaded)saveNote=recovered?'Partida principal inválida. Ponto de recuperação restaurado.':'Sua expedição foi restaurada.';
  // Module suggestions run full planet assessments for every stored module of a type (~1 ms each). The ship screen asks
  // for them on every render, so they are reused until something they depend on changes.
  let suggestionKey='',suggestionCache=new Map();
  function suggestionsFor(type){const key=JSON.stringify([state.galaxy.id,state.galaxyIndex,selected,state.location,state.equipped,state.inventory.map(m=>m.id),state.resources,state.campaign?.worldOverride]);if(key!==suggestionKey){suggestionKey=key;suggestionCache=new Map();}if(!suggestionCache.has(type))suggestionCache.set(type,E.suggestions(state,type,selected));return suggestionCache.get(type);}
  // During the guided training, taps on the ship canvas count only when the guide is highlighting the canvas itself.
  function canvasAllowed(){return !state.guide?.active||!!$('og-canvas')?.classList.contains('og-guide-target');}
  let saveTimer=0,saveCount=0,sheetBatch=0,sheetDirty=false,sheetAfter=[];
  function save(){
    clearTimeout(saveTimer);saveTimer=0;saveCount++;
    const privateContent={state:E.snapshot?E.snapshot(state):state,tab,selected,shipDetail,mapLevel,selectedSystem,selectedDestination};let local=false;
    local=window.OrbitSaves.write(privateContent);if(local)saveNote=window.OrbitAndroid?'Progresso salvo neste celular.':'Progresso salvo neste navegador.';else toast('Não foi possível salvar. Exporte sua partida pelo menu Partida segura.',true);
    if(typeof window.openai?.setWidgetState==='function'){
      try{const promise=window.openai.setWidgetState({modelContent:{game:'Órbita mobile',ship:state.ship.name,galaxy:state.galaxy.name,planet:here().name,mission:state.mission.stage},privateContent});promise?.catch(()=>{if(!local)saveNote='Expedição em andamento nesta sessão.';});saveNote='Progresso salvo nesta conversa.';}catch(_){if(!local)saveNote='Expedição em andamento nesta sessão.';}
    }else if(!local)saveNote='Expedição em andamento nesta sessão.';
  }
  function captureView(){return JSON.parse(JSON.stringify({tab,selected,sheet,sheetPage,inventoryTab,shipDetail,cargoResource,systemType,selectedCandidateId,salvageModuleId,mapLevel,selectedSystem,selectedDestination,environmentSite,lab,catalogView,commerceView}));}
  const inModuleDetails=()=>sheet==='system-module'&&tab==='ship'&&shipDetail.mode==='module';
  const placeParents={};let fabricatedParent='fabricator',maintenanceAction='refuel';
  function parentPlace(){
    if(sheet==='catalog'&&(catalogView.materialId||catalogView.page==='system'||catalogView.page?.startsWith('materials-')))return {label:catalogView.materialId?'Coleção':catalogView.page==='system'?'Sistemas':'Coleções',action:'catalog-parent'};
    if(sheet==='stock'&&commerceView.stockGroup)return {label:'Estoque',action:'stock'};
    if(sheet==='fabricated')return {label:fabricatedParent==='campaign'?'Missão':'Receita',action:fabricatedParent};
    if(['stored-module','system-module'].includes(sheet)&&['reward','fabricated'].includes(moduleOrigin))return {label:moduleOrigin==='reward'?'Carga recuperada':'Peça fabricada',action:moduleOrigin};
    if(['stored-module','system-module'].includes(sheet)&&moduleOrigin==='workshop')return {label:'Receita',action:'fabricator'};
    if(placeParents[sheet])return placeParents[sheet];
    if(sheet==='environment'&&environmentSite)return {label:'Locais do planeta',action:'sites'};
    if(['stored-module','system-module'].includes(sheet)&&moduleOrigin==='ship')return {label:'Nave aberta',action:'ship-overview'};
    if(sheet==='system-module'&&moduleOrigin==='inventory'&&!selectedCandidateId)return {label:'Módulos',action:'modules'};
    if(sheet==='fabricator'){const prev=lab.history?.at(-1);return {label:lab.page==='component'?(prev?.page==='component'?'Peça principal':lab.returnRecipeId?'Receita':prev?.page==='components'?'Componentes':'Bancada'):lab.page==='recipe'?'Categoria':lab.page==='type'?'Categorias':'Oficina',action:'lab-parent'};}
    const places={fleet:['Nave aberta','ship-overview'],'fleet-trader':['Estação','station'],xeno:['Menu','menu'],'xeno-specimen':['Laboratório','xeno'],'xeno-rune':['Laboratório','xeno'],'xeno-tools':['Estação','station'],'station-route':['Mapa','world'],settings:['Menu','menu'],saves:['Menu','menu'],'save-review':['Partida segura','saves'],contracts:['Estação','station'],'overdrive-menu':['Retorno à nave','expedition-return-menu'],'stock-components':['Estoque','stock'],station:['Mapa','world'],market:['Estação','station'],'market-item':['Mercado','market'],stock:['Nave','world'],modules:['Estoque','stock'],'stored-module':['Módulos','modules'],'salvage-review':['Cartão','stored-module'],workshop:['Nave','world'],maintenance:['Oficina','workshop'],fabricated:['Módulos','modules'],'system-module':[selectedCandidateId?'Cartão':'Nave aberta',selectedCandidateId?'stored-module':'ship-overview'],'cargo-content':['Estoque','stock']};
    const [label,action]=places[sheet]||['Jogo','world'];return {label,action};
  }
  function updateHistoryButtons(){}
  function navigate(fn){const before=saveCount;fn();if(saveCount===before)saveSoon();}
  // Pure navigation (tabs, selections, panels) only changes the remembered view, so its save is coalesced; game actions
  // still save synchronously. A pending view save is flushed when the page is hidden or unloaded.
  function saveSoon(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveTimer=0;save();},400);}
  function flushSave(){if(saveTimer)save();}
  function onHidden(){if(document.hidden)flushSave();}
  function stepNavigation(){
    if(sheet==='stock'&&commerceView.stockGroup){commerceView.stockGroup=null;sheetNotice='';renderSheet();return;}
    if(sheet==='catalog'&&parentPlace().action==='catalog-parent'){if(catalogView.materialId)delete catalogView.materialId;else catalogView={page:catalogView.page==='system'?'systems':'materials'};sheetNotice='';renderSheet();return;}
    const parent=parentPlace();
    if(parent.action==='world'){const destination=['station','station-route'].includes(sheet)?'galaxy':['stock','workshop'].includes(sheet)?'ship':tab;dismissSheet();tab=destination;render();save();return;}
    if(parent.action==='ship-overview'){shipOverview();return;}
    if(parent.action==='lab-parent'){
      if(lab.page==='component'){window.OrbitWorkshop.handle({dataset:{labBack:'previous'}},lab);sheetPage=0;renderSheet();save();return;}
      if(lab.page==='recipe'){lab={page:'type',type:lab.type,history:[{page:'home'}]};renderSheet();return;}
      if(lab.page==='type'){lab={page:'home',history:[]};sheetPage=0;renderSheet();return;}
      openSheet('workshop');return;
    }
    if(sheet==='salvage-review'&&parent.action==='stored-module'&&salvageModuleId)selectedCandidateId=salvageModuleId;
    openSheet(parent.action);
  }
  function fitStage(){
    const stage=$('og-stage'),field=$('og-field');
    if(!field.hidden){const heading=$('og-heading').getBoundingClientRect(),context=$('og-context').getBoundingClientRect(),bounds=stage.getBoundingClientRect();const top=Math.ceil(heading.bottom-bounds.top+8);const size=Math.max(120,Math.min(390,stage.clientWidth-24,Math.floor(context.top-bounds.top-top-(state.expedition&&E.fieldWeather(state)?.rigorous?52:34))));field.style.top=top+'px';field.style.width=size+'px';}
    root.dataset.compact=String(root.clientHeight<680);
    if(tab==='galaxy'){const context=$('og-context').getBoundingClientRect(),bounds=stage.getBoundingClientRect();$('og-map').style.bottom=Math.ceil(bounds.bottom-context.top+20)+'px';$('og-map').style.top=Math.ceil($('og-map-levels').getBoundingClientRect().bottom-bounds.top+22)+'px';}
    if(tab==='ship'&&shipDetail.mode!=='module'){
      const bounds=stage.getBoundingClientRect(),heading=$('og-heading').getBoundingClientRect(),context=$('og-context').getBoundingClientRect(),label=$('og-module-hotspots').querySelector('button');
      scene.update({inspectionLayout:shipDetail.mode==='exterior'?{top:45,bottom:stage.clientHeight-25,labelWidth:44,labelHeight:44}:{top:heading.bottom-bounds.top+6,bottom:context.top-bounds.top-8,labelWidth:label?.offsetWidth||88,labelHeight:44}});
    }
  }
  const preview=(action,payload)=>E.preview(state,action,payload||{});
  const assessment=(planet=here(),siteId)=>E.assess?E.assess(state,planet.id,siteId):{allowed:true,level:'safe',label:'Acessível',requirements:[],missing:[],cost:E.explorationCost(state),operation:'surface'};
  const systemAssessment=id=>E.assessSystem?E.assessSystem(state,id):{allowed:true,level:'safe',label:'Rota aberta',requirements:[],missing:[]};
  const systems=()=>state.galaxy.systems||[{id:'legacy',name:state.galaxy.name,kind:'yellow',starColor:'#ffd6a1',planetIds:state.galaxy.planets.map(p=>p.id)}];
  const currentSystem=()=>systems().find(s=>s.planetIds.includes(state.location.planetId))||systems()[0];
  const mapSystem=()=>systems().find(s=>s.id===selectedSystem)||currentSystem();
  const destinations=()=>E.destinations?E.destinations(state):[];
  const destination=()=>destinations().find(d=>d.id===selectedDestination)||destinations()[0];
  const riskBadge=a=>`<span class="og-risk ${a.level}">${esc(a.label)}</span>`;
  function capValue(key,value){if(key==='gas'||key==='liquid')return value?'Instalado':'Ausente';return (key==='cold'?'−':'')+num(value)+({heat:' °C',cold:' °C',radiation:' rad',pressure:' atm',toxicity:'%'}[key]||'');}
  function moduleCaps(m){const caps=E.moduleCapabilities?.(m)||{};return Object.entries(caps).filter(([,v])=>v).map(([k,v])=>`${capNames[k]||k}: ${capValue(k,v)}`).join(' · ');}
  const costText=cost=>Object.entries(cost||{}).filter(([key,v])=>v>0&&costNames[key]).map(([key,v])=>`${num(v)} ${costNames[key]}`).join(' · ');
  function operationNotice(siteId,compact=false){
    const op=E.siteOperation(state,siteId);if(!op.enabled)return '';
    let text=op.stabilized?'Estabilizador ativo · reação contida':op.active?`${op.label} ativa · deslocamentos fora da base custam +1 energia`:op.triggered?`${op.label} em ${op.remaining} ações neste local`:`Retirar a tecnologia inicia ${op.label.toLowerCase()} em 6 ações. Depois, cada deslocamento fora da base custa +1 energia.`;
    if(compact)text=op.stabilized?'Reação contida; clima natural preservado.':op.active?op.label+' · +1 E por passo':op.triggered?op.label+' em '+op.remaining+' ações locais':'Reconhecimento salvo · o clima continua entre saídas.';
    const prep=preview('stabilizeSite',{siteId});
    return `<aside class="og-operation-note ${compact?'is-compact':''} ${op.active?'is-danger':''}" role="status"><strong>${op.stabilized?'Local estabilizado':op.triggered?'O local mudou':'Planeje a retirada'}</strong><p>${esc(text)}</p><small>${op.visits?op.visits+' saída(s) · ':''}Sair não reinicia o clima nem a reação; evacuar sem levar a tecnologia acalma o local.</small>${!op.stabilized&&op.visits?`<button class="og-operation-stabilize" data-action="stabilizeSite" data-site="${esc(siteId)}" ${prep.allowed?'':'disabled'} aria-label="Instalar estabilizador: 8 minério e 2 cristais"><span aria-hidden="true">${window.OrbitArt.icon('shield')}</span><span><b>Estabilizar local</b><small>Custo: 8 minério · 2 cristais</small><small>Estoque: ${state.resources.ore} · ${state.resources.crystals}</small></span></button>${!prep.allowed?`<small>${esc(prep.reason)}</small>`:''}`:''}</aside>`;
  }
  function button(action,label,options={}){
    const p=preview(action,options.payload);const price=options.cost?costText(p.cost):'';
    return `${action==='expeditionRecover'?operationNotice(state.expedition?.siteId):''}<button class="og-button ${options.primary?'primary':''} ${options.small?'small':''}" data-action="${action}" ${options.attrs||''} ${p.allowed?'':'disabled'} aria-label="${esc(label+(!p.allowed?'. '+p.reason:''))}">${esc(label)}${price?`<span class="og-cost">${price}</span>`:''}</button>`;
  }
  function descentControl(site){
    const check=preview('explore',{siteId:site.id}),a=assessment(here(),site.id),names={fuel:'Combustível',oxygen:'Oxigênio',hull:'Casco'};
    const shortages=Object.entries(a.cost).filter(([key,n])=>state.resources[key]<n).map(([key,n])=>`<span>${window.OrbitJourney.glyph(key)}<strong>${names[key]||key}</strong><b>${state.resources[key]} / ${n}</b><small>Faltam ${n-state.resources[key]}</small></span>`);
    const note=check.allowed?'Reservas e equipamentos conferidos':shortages.length?'Abasteça antes de descer':check.reason||'Confira a proteção ambiental';
    return `<div class="og-descent-launch ${check.allowed?'is-ready':'is-blocked'}"><div id="og-descent-blocker" role="status"><strong>${esc(note)}</strong>${shortages.length?`<div class="og-descent-shortages">${shortages.join('')}</div>`:''}</div>${button('explore','Descer e explorar',{payload:{siteId:site.id},attrs:`data-site="${esc(site.id)}" data-caption="Descer" aria-describedby="og-descent-blocker"`})}</div>`;
  }
  const fact=(label,value)=>`<div class="og-fact"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  function resource(key,label,value,max,color){return `<button class="og-resource ${value/max<.25?'is-low':''}" style="--instrument:${color}" data-action="status" aria-label="${label}: ${num(value)} de ${num(max)}. Ver recursos.">${window.OrbitJourney.glyph(key)}<span class="og-resource-name">${label}</span><strong>${num(value)}</strong><span class="og-meter"><i style="--fill:${Math.max(0,Math.min(100,value/max*100))}%;--bar:${value/max<.25?'var(--og-red)':color}"></i></span></button>`;}

  function missionDots(){return `<div class="og-mission-dots" aria-label="${Math.min(5,state.mission.stage+1)} de 5 etapas da primeira expedição">${[0,1,2,3,4].map(i=>`<i class="${i<state.mission.stage?'complete':i===state.mission.stage?'current':''}"></i>`).join('')}</div>`;}
  function render(){
    if(!state.galaxy.planets.some(p=>p.id===selected))selected=state.location.planetId;
    if(!systems().some(s=>s.id===selectedSystem))selectedSystem=currentSystem().id;
    if(catalogView.page==='system'&&!systems().some(s=>s.id===catalogView.systemId))catalogView={page:'systems',systemId:null};
    if(tab==='galaxy'&&mapLevel==='system'&&!mapSystem().planetIds.includes(selected))selected=mapSystem().planetIds[0];
    root.dataset.view=tab;root.dataset.shipMode=tab==='ship'?shipDetail.mode:'exterior';root.dataset.fieldActive=String(tab==='expedition'&&!!state.expedition);const p=tab==='galaxy'?target():here(),s=E.stats(state),r=state.resources;
    $('og-galaxy-label').textContent=state.galaxy.name;
    const ex=tab==='expedition'?E.expeditionView?.(state):null;
    if(window.OrbitCampaignUI)root.querySelector('.og-tabs [data-tab="expedition"]').innerHTML='<span aria-hidden="true">◆</span>'+(state.expedition?'Expedição':'Missão');
    $('og-resources').innerHTML=ex?`<div id="og-field-energy" class="og-field-energy ${ex.returnBlocked?'is-danger':ex.returnMargin<=3?'is-warning':''}" aria-label="Reserva da expedição"><div><span>${window.OrbitJourney.glyph('reserve')}ENERGIA</span><strong>${ex.reserve}<small> / ${ex.maxReserve}</small></strong></div><div><span>${window.OrbitJourney.glyph('return')}VOLTA</span><strong>${ex.returnReserve??'—'}</strong></div><div><span>${window.OrbitJourney.glyph('free')}LIVRE</span><strong>${ex.returnMargin??'—'}</strong></div></div>`:resource('hull','Casco',r.hull,s.maxHull,'var(--og-green)')+resource('oxygen','Oxigênio',r.oxygen,s.maxOxygen,'var(--og-blue)')+resource('fuel','Combustível',r.fuel,s.maxFuel,'var(--og-orange)');
    root.querySelectorAll('.og-tabs button').forEach(b=>{b.classList.toggle('is-active',b.dataset.tab===tab);b.setAttribute('aria-pressed',String(b.dataset.tab===tab));});
    window.OrbitFleetUI?.apply(state);
    scene.update({planet:p,shipModel:state.fleet?.active||'andorinha',shipColor:state.ship.color,shipTrail:state.ship.trail||'blue',modules:state.equipped,resources:state.resources,shipDetail:tab==='ship'?shipDetail:{mode:'exterior',selectedModule:null,expanded:false},mode:state.location.mode,view:tab==='ship'?'ship':tab==='galaxy'?'galaxy':'explore',viewport:'mobile',navigation:tab==='galaxy'?navigationData():null});
    $('og-map').hidden=tab!=='galaxy';$('og-field').hidden=!ex;$('og-beacon').hidden=tab!=='expedition'||!!ex;$('og-context').hidden=false;$('og-heading').hidden=false;root.querySelector('.og-camera-control').hidden=tab==='galaxy'||tab==='expedition';
    fieldScene?.update({planet:here(),view:ex});
    $('og-map-levels').hidden=tab!=='galaxy';$('og-map-levels').querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mapLevel===mapLevel));b.classList.toggle('is-active',b.dataset.mapLevel===mapLevel);});
    $('og-ship-back').hidden=tab!=='ship';$('og-module-hotspots').hidden=tab!=='ship'||shipDetail.mode!=='interior';
    $('og-canvas').setAttribute('aria-label',tab==='ship'&&shipDetail.mode!=='exterior'?'Interior do foguete com oito módulos. Selecione um compartimento para examinar seu encaixe.':'Foguete e planeta. Toque na nave para abrir o casco. Arraste para girar.');
    if(tab==='explore')renderExplore();else if(tab==='ship')renderShip();else if(tab==='galaxy')renderMap();else renderExpedition(ex);
    renderShipStats();
    window.OrbitXenoUI?.header(root,state);
    window.OrbitJourney.controls($('og-context'));
    fitStage();if(sheet)renderSheet();updateHistoryButtons();syncExperience();
  }
  function syncExperience(){
    const light=window.OrbitAudio.prefs.light;scene.light=light;scene.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // A full-screen story clip hides the stage just like a sheet does: stop drawing the scene behind it.
    scene.setPaused(!!sheet||tab==='expedition'||!!root.querySelector('.og-story-clip'));if(fieldScene)fieldScene.reduced=light||window.matchMedia('(prefers-reduced-motion: reduce)').matches;fieldScene?.setPaused?.(!!sheet||tab!=='expedition');
    window.OrbitAudio.update(state,tab,sheet);
  }
  function renderExplore(){
    const p=here(),docked=state.location.mode==='docked',remaining=p.sites.filter(s=>!E.siteStatus(state,s.id).exhausted).length,a=assessment(p);
    const operation=p.medium==='gas'?'Sonda na atmosfera':p.medium==='liquid'?'Operação submersa':'Ancorada na superfície';
    const signal=window.OrbitXenoUI?.planetSignal(state,p.id)||'';
    $('og-heading').innerHTML=`<div class="og-eyebrow">${esc(biomes[p.biome]||p.biomeName)}</div><h1>${esc(p.name)}</h1><p class="og-live">${docked?operation:'Em órbita · '+esc(currentSystem().name)}</p>`;
    let content='';
    if(state.location.stationId){$('og-heading').innerHTML='<div class="og-eyebrow">Nave atracada</div><h1>Entreposto</h1><p>'+esc(currentSystem().name)+'</p>';content='<div class="og-station-portrait">'+window.OrbitCommerce.art('station')+'</div><button class="og-button" data-action="station">Acessar estação</button>'+button('stationLeave','Desatracar',{cost:true});}
    else if(state.expedition)content=`<span class="og-risk risky">Veículo em campo</span><h2>Sua expedição espera.</h2><p>A carga ainda precisa voltar ao ponto de extração.</p><button class="og-button primary" data-tab="expedition">Retomar o controle</button>`;
    else if(!p.scanned)content=`<h2>Leia os sinais deste mundo.</h2><p>Uma análise revela os locais e as exigências da expedição.</p>${button('scan','Analisar planeta',{primary:true})}<span class="og-subtle">Scanner orbital · ${costText(preview('scan').cost)}</span>`;
    else if(!a.allowed)content=`${riskBadge(a)}<h2>A nave precisa de preparo.</h2><p>${esc(a.missing.slice(0,2).map(r=>r.label).join(' · '))}</p>${window.OrbitFleetUI?.planetHint(state,p.id)||''}<button class="og-button primary" data-action="environment">Ver equipamentos necessários</button><div class="og-context-links">${docked?'<button class="og-link" data-action="launch">Retornar à órbita</button>':'<button class="og-link" data-tab="galaxy">Buscar outra rota</button>'}</div>`;
    else if(!docked)content=`${riskBadge(a)}<h2>Escolha sua expedição.</h2><p>${remaining} pontos disponíveis · confira proteção e reservas antes de descer.</p><button class="og-button primary" data-action="sites">Escolher ponto e descer</button>`;

    else if(remaining)content=`${riskBadge(a)}<h2>${p.medium==='gas'?'Sinais entre as tempestades.':p.medium==='liquid'?'Abaixo da superfície.':'A escotilha está aberta.'}</h2><p>${remaining} pontos com descobertas restantes · ${p.sites.filter(x=>x.explored).length}/${p.sites.length} tecnologias extraídas</p><button class="og-button primary" data-action="sites">Iniciar uma expedição</button><div class="og-context-links"><button class="og-link" data-action="environment">Ver condições</button><button class="og-link" data-action="launch">Voltar à órbita ↑</button></div>`;
    else content=`<h2>Fronteira catalogada.</h2><p>Os locais foram explorados. Há outros sistemas para descobrir.</p>${button('launch','Voltar às estrelas',{primary:true})}<button class="og-link" data-action="planet-info">Ver análise do planeta</button>`;
    $('og-heading').insertAdjacentHTML('beforeend',window.OrbitJourney.tracker(state));
    $('og-context').innerHTML=(state.location.stationId||state.expedition?'':signal)+content;
  }
  function renderShip(){
    const d=shipDetail,m=state.equipped[d.selectedModule];
    $('og-ship-back').removeAttribute('aria-label');
    $('og-ship-back').innerHTML=`‹ <span>${d.mode==='module'?'Nave aberta':d.mode==='interior'?'Fechar casco':'Voltar à órbita'}</span>`;
    window.OrbitJourney.backControls($('og-stage'));
    if(d.mode==='module'&&m){
      const compatible=state.inventory.filter(item=>item.type===m.type).length,details=E.moduleDetails(state,m),recommendation=suggestionsFor(m.type).find(item=>item.kind==='upgrade'||item.kind==='tradeoff'&&item.score>0);
      $('og-heading').innerHTML=`<div class="og-eyebrow">${esc(state.ship.name)} / Interior</div><h1>${shortLabels[m.type]}</h1><p>${d.expanded?'Arraste a peça de volta ao encaixe':m.type==='cargo'?'Toque na carga ou arraste o módulo':'Toque no módulo para ver seu cartão'}</p>`;
      const cargo=m.type==='cargo'?`<div class="og-cargo-contents" aria-label="Conteúdo do depósito">${Object.entries(cargoLabels).map(([key,label])=>`<button data-cargo="${key}" aria-label="Examinar ${label.toLowerCase()}: ${num(state.resources[key]||0)} unidades"><strong>${num(state.resources[key]||0)}</strong><span>${label}</span></button>`).join('')}</div>`:`<p>${esc(details.specialty)} · ${esc(details.metrics.slice(0,2).map(item=>item.label+': '+metricFormat(item.value,item.unit,item.key)).join(' · '))}</p>`;
      $('og-context').innerHTML=`<button class="og-button primary" data-action="module-info">Abrir cartão do módulo</button><button class="og-link" data-action="ship-back">Nave aberta</button>`;
    }else if(d.mode==='interior'){
      $('og-heading').innerHTML=`<div class="og-eyebrow">${esc(state.ship.name)} / Casco aberto</div><h1>Por dentro.</h1><p>Toque no desenho de um módulo</p>`;
      $('og-context').innerHTML=`<button class="og-button primary" data-action="modules" aria-label="Abrir armazém: ${state.inventory.length} módulos guardados">Peças · ${state.inventory.length}</button><button class="og-link" data-action="workshop">Oficina de bordo</button><button class="og-link" data-action="fleet">Hangar</button><button class="og-link" data-action="customize">Pintura</button>`;
      const container=$('og-module-hotspots');
      if(!container.children.length)container.innerHTML=Object.keys(labels).map(type=>`<button class="og-module-hotspot" data-module-focus="${type}" aria-label="Examinar ${labels[type]}" style="visibility:hidden"></button>`).join('');
      positionHotspots(scene.getHotspots?.()||[]);
    }else{
      $('og-heading').innerHTML='';$('og-heading').hidden=true;
      $('og-context').innerHTML='';$('og-context').hidden=true;
      root.querySelector('.og-camera-control').hidden=true;
    }
  }
  // Ship attributes: a translucent read-out on the ship screen, and an animated list of what changed after an install,
  // so equipping a module visibly says what it gave and what it cost.
  const statColumns=[[['maxFuel','Combustível'],['maxOxygen','Oxigênio'],['maxHull','Casco'],['fuelEfficiency','Voo'],['warpEfficiency','Dobra'],['expeditionReserve','Energia'],['expeditionIntegrity','Integridade'],['expeditionCapacity','Carga'],['cargoCapacity','Armazém']],
    [['scanRadius','Scanner'],['collectionBonus','Coleta'],['heat','Calor'],['cold','Frio'],['radiation','Radiação'],['pressure','Pressão'],['toxicity','Tóxicos'],['gas','Gás'],['liquid','Submerso']]];
  let statHighlight={},statHighlightUntil=0;
  function metricValueText(m){if(typeof m.value==='boolean')return m.value?'sim':'não';if(m.unit==='×')return '×'+String(m.value).replace('.',',');if(m.unit==='%')return m.value+'%';return String(m.value).replace('.',',')+(['°C','rad','atm'].includes(m.unit)?' '+m.unit:'');}
  function metricDelta(before,after){
    if(typeof after.value==='boolean')return {text:after.value?'ativada':'desativada',good:after.value};
    const diff=Math.round((after.value-before.value)*100)/100;if(!diff)return null;
    const good=after.higherIsBetter?diff>0:diff<0,sign=diff>0?'+':'−';
    if(after.unit==='×'){const pct=before.value?Math.round((after.value/before.value-1)*100):0;return {text:sign+Math.abs(pct||diff*100).toString().replace('.',',')+'%',good};}
    if(after.unit==='%')return {text:sign+Math.abs(diff)+'%',good};
    const unit=Math.abs(diff)===1?({setores:'setor','espaços':'espaço'}[after.unit]||after.unit):after.unit;
    return {text:sign+String(Math.abs(diff)).replace('.',',')+' '+unit,good};
  }
  function renderShipStats(){
    const panel=$('og-ship-stats');if(!panel)return;
    const show=tab==='ship'&&shipDetail.mode==='exterior'&&!state.expedition&&E.shipMetrics;panel.hidden=!show;if(!show)return;
    const metrics=Object.fromEntries(E.shipMetrics(state).map(m=>[m.key,m])),fresh=Date.now()<statHighlightUntil;
    panel.innerHTML=statColumns.map(column=>`<dl>${column.map(([key,label])=>{const m=metrics[key];if(!m)return '';const mark=fresh&&statHighlight[key];return `<div class="${mark?(mark==='good'?'is-up':'is-down'):''}"><dt>${label}</dt><dd>${esc(metricValueText(m))}</dd></div>`;}).join('')}</dl>`).join('');
  }
  let deltaTimer=0;
  function showShipDelta(before,after){
    const old=Object.fromEntries(before.map(m=>[m.key,m])),changes=after.map(m=>({m,d:old[m.key]&&(typeof m.value==='boolean'?(m.value!==old[m.key].value?metricDelta(old[m.key],m):null):metricDelta(old[m.key],m))})).filter(x=>x.d);
    statHighlight=Object.fromEntries(changes.map(({m,d})=>[m.key,d.good?'good':'bad']));statHighlightUntil=Date.now()+6000;
    const el=$('og-delta');clearTimeout(deltaTimer);
    if(!changes.length){el.hidden=true;return;}
    el.innerHTML=`<strong>Nave atualizada</strong><ul>${changes.slice(0,8).map(({m,d},i)=>`<li class="${d.good?'is-up':'is-down'}" style="--i:${i}"><span>${esc(m.label)}</span><b>${esc(d.text)}</b></li>`).join('')}</ul>${changes.length>8?`<small>+${changes.length-8} mudanças no cartão do módulo</small>`:''}`;
    el.hidden=false;el.classList.remove('is-leaving');void el.offsetWidth;el.classList.add('is-entering');
    setTimeout(renderShipStats,6100);
    deltaTimer=setTimeout(()=>{el.classList.add('is-leaving');deltaTimer=setTimeout(()=>{el.hidden=true;el.classList.remove('is-leaving','is-entering');},400);},4200);
  }
  function positionHotspots(points){
    const container=$('og-module-hotspots');if(!container||container.hidden)return;
    for(const b of container.children){
      const point=points.find(p=>p.type===b.dataset.moduleFocus);
      b.style.visibility=!point||point.visible===false?'hidden':'visible';
      if(!point)continue;
      b.style.left=(point.anchorX??point.x)+'px';b.style.top=(point.anchorY??point.y)+'px';b.style.width=(point.width||44)+'px';b.style.height=(point.height||44)+'px';b.dataset.side=point.side<0?'left':'right';
    }
  }
  function showShip(mode,type=null){if(sheet)closeSheet();if(mode==='interior')scene.resetCamera();tab='ship';shipDetail={mode,selectedModule:type,expanded:false};render();save();$('og-ship-back').focus({preventScroll:true});}
  function shipOverview(){scene.resetCamera();selectedCandidateId='';showShip('interior');}
  function focusModule(type){
    if(!labels[type])return;
    moduleOrigin=sheet==='fabricator'?'workshop':sheet==='modules'?'inventory':'ship';
    if(moduleOrigin==='ship')showShip('module',type);
    openSystem(type,'');
  }
  function openSystem(type,id){
    if(!labels[type])return;
    systemType=type;
    const list=E.suggestions(state,type,selected);
    selectedCandidateId=id||'';
    openSheet('system-module');
  }
  function metricFormat(value,unit,key){
    if(typeof value==='boolean')return value?'Sim':'Não';
    const rounded=Math.round(Number(value)*100)/100;
    return (key==='cold'&&rounded?'−':'')+String(rounded).replace('.',',')+(unit?' '+unit:'');
  }
  function favoriteButton(m){if(m.mission)return '<span class="og-quest-protected" aria-label="Módulo único protegido permanentemente">✦</span>';return `<button class="og-favorite" data-action="favoriteModule" data-module="${esc(m.id)}" aria-pressed="${!!m.favorite}" aria-label="${m.favorite?'Desproteger':'Proteger'} ${esc(m.name)}">${m.favorite?'★':'☆'}</button>`;}
  function moduleOperations(type){
    const s=E.stats(state),r=state.resources;
    if(type==='engine')return service('refuel','Combustível',r.fuel+' / '+s.maxFuel);
    if(type==='warp')return service('refine','Células de dobra',r.warpFuel+' / '+s.maxWarpFuel)+'<button class="og-link" data-map-level="universe">Planejar salto entre galáxias →</button>';
    if(type==='life')return service('refillOxygen','Oxigênio',r.oxygen+' / '+s.maxOxygen);
    if(type==='shield')return service('repair','Casco',r.hull+' / '+s.maxHull);
    if(type==='scanner')return '';
    if(type==='cargo')return `<div class="og-cargo-contents">${Object.entries(cargoLabels).map(([key,label])=>`<button data-cargo="${key}"><strong>${num(r[key])}</strong><span>${label}</span></button>`).join('')}</div>`;
    return '';
  }
  function systemSheet(){
    const m=state.equipped[systemType],details=E.moduleDetails(state,m),suggestions=E.suggestions(state,systemType,selected);
    const candidate=state.inventory.find(item=>item.id===selectedCandidateId&&item.type===systemType);
    const compare=candidate?E.compareModule(state,candidate.id,selected):null;
    const installed=`<div class="og-system-installed ${compare?'is-compact':''}" style="--rarity:${rarity(m).color}">${window.OrbitArt.icon(m.type,"og-module-code",m)}<div><small>INSTALADO · ${esc(details.specialty)}</small><h3>${esc(m.name)}</h3><span class="og-rarity">${esc(rarity(m).name)}</span></div></div>`;
    const chooser=suggestions.length?`<label class="og-field-label" for="og-module-choice">Comparar com peça do armazém · ${suggestions.length}</label><select id="og-module-choice"><option value="">Manter instalado · ver funções</option>${suggestions.map(item=>{const part=state.inventory.find(x=>x.id===item.moduleId);return `<option value="${esc(part.id)}" ${candidate?.id===part.id?'selected':''}>${esc(part.name)}${item.kind==='upgrade'?' · melhoria':item.kind==='tradeoff'?' · especialista':''}</option>`;}).join('')}</select>`:'<p class="og-system-empty">Sem outra peça deste tipo. Recupere núcleos ou fabrique uma especialidade.</p>';
    if(!compare)return {title:labels[systemType],html:moduleCard(m,true)+`<div class="og-system-operations">${moduleOperations(systemType)}</div>`};
    let content='';
    if(compare){
      const candidateDetails=E.moduleDetails(state,candidate);
      content=`<div class="og-comparison" data-comparison="${compare.kind}"><div class="og-candidate-heading"><div><small>${esc(compare.label)}</small><h3>${esc(candidate.name)}</h3></div>${favoriteButton(candidate)}</div><div class="og-card-art">${window.OrbitArt.icon(candidate.type,'og-module-code',candidate)}</div><p>${esc(candidateDetails.specialty)}</p><div class="og-card-metrics">${compare.rows.filter(row=>row.better!=='neutral').map(row=>`<div data-metric="${esc(row.key)}" class="is-${row.better}"><small>${esc(row.label)}</small><strong>${esc(metricFormat(row.before,row.unit,row.key))} → ${esc(metricFormat(row.after,row.unit,row.key))}</strong></div>`).join('')}</div>${compare.opens.length?`<p class="og-world-change is-up">Abre ${compare.opens.length} mundo(s): ${esc(compare.opens.slice(0,2).map(p=>p.name).join(', '))}.</p>`:''}${compare.closes.length?`<p class="og-world-change is-down">Perde acesso a ${compare.closes.length} mundo(s): ${esc(compare.closes.slice(0,2).map(p=>p.name).join(', '))}.</p>`:''}${compare.resourceLoss.length?`<p class="og-system-warning">A capacidade menor descarta ${esc(compare.resourceLoss.map(item=>num(item.amount)+' '+costNames[item.key]).join(', '))}.</p>`:''}<p class="og-note">Peça atual preservada no armazém.</p>${!compare.allowed?`<p class="og-system-warning">${esc(compare.reason)}</p>`:''}</div>`;
    }else content=`<div class="og-system-metrics">${details.metrics.map(item=>fact(item.label,metricFormat(item.value,item.unit,item.key))).join('')}</div><div class="og-system-operations">${moduleOperations(systemType)}</div>${favoriteButton(m)}`;
    return {singleCard:true,title:'Trocar '+labels[systemType].toLowerCase(),header:`${installed}`,footer:compare?`<div class="og-system-confirm">${button('equip','Confirmar troca',{primary:true,payload:{moduleId:candidate.id},attrs:`data-module="${esc(candidate.id)}"`})}<button class="og-button secondary" data-action="nav-back">Cancelar</button></div>`:'',html:`${compare?'':`<p>${esc(roles[systemType])}</p>`}${content}`};
  }
  function salvageSheet(){
    const m=state.inventory.find(item=>item.id===salvageModuleId),info=E.salvageInfo(state,salvageModuleId);
    if(!m||!info)return {title:'Peça desmontada',html:'<button class="og-button primary" data-action="modules">Voltar ao armazém</button>'};
    const details=E.moduleDetails(state,m);
    return {title:'Desmontar esta peça?',html:`<div class="og-candidate-heading"><div><h3>${esc(m.name)}</h3><small>${esc(details.specialty)}</small></div>${favoriteButton(m)}</div><div class="og-card-art">${window.OrbitArt.icon(m.type,'og-module-code',m)}</div>${info.uniqueBenefits.length?`<div class="og-system-warning"><strong>Sua única peça com este alcance</strong><ul>${info.uniqueBenefits.map(text=>`<li>${esc(text)}</li>`).join('')}</ul></div>`:'<p>Confira a especialidade antes de abrir mão desta peça. Outra rota pode precisar dela.</p>'}<div class="og-facts">${fact('Minério recuperado',info.ore)}${fact('Lumes recuperados',info.credits)}</div>${info.favorite?'<p class="og-system-warning">Peça protegida. Remova a proteção para permitir a desmontagem.</p>':'<p class="og-note">A peça será consumida. Esta operação não pode ser desfeita.</p>'}`,footer:`<div class="og-salvage-actions">${button('salvage','Desmontar e recuperar materiais',{payload:{moduleId:m.id},attrs:`data-module="${esc(m.id)}"`})}<button class="og-button primary" data-action="nav-back">Cancelar · manter a peça</button></div>`};
  }
  function applyModulePose(pose){
    if(tab!=='ship'||shipDetail.mode!=='module'||shipDetail.selectedModule!==pose.type)return;
    shipDetail.expanded=!!pose.expanded;render();save();
    $('og-inspection-status').textContent=pose.expanded?'Peça afastada. Encaixe exposto.':'Peça reencaixada.';
  }
  function openCargo(resource){if(!cargoLabels[resource])return;cargoResource=resource;placeParents['cargo-content']=sheet==='system-module'?{label:'Depósito',action:'system-module'}:{label:'Nave aberta',action:'ship-overview'};openSheet('cargo-content');}
  function shipBack(){
    if(shipDetail.mode==='module')shipOverview();
    else if(shipDetail.mode==='interior')showShip('exterior');
    else{tab='explore';render();save();root.querySelector('[data-tab="explore"]').focus({preventScroll:true});}
  }
  function navigationData(){
    const sy=mapSystem(),level=mapLevel;
    let nodes=[];
    if(level==='system'){
      const planets=sy.planetIds.map(id=>state.galaxy.planets.find(p=>p.id===id)).filter(Boolean);
      nodes=planets.map((planet,i)=>{const angle=-Math.PI/2+i*Math.PI*2/planets.length,orbit=[29,43,35,46,39,32][i%6];return {id:planet.id,x:50+Math.cos(angle)*orbit,y:50+Math.sin(angle)*orbit,size:planet.medium==='gas'?23:planet.medium==='liquid'?19:14+Math.min(4,planet.size*3),planet,name:planet.name,color:planet.color,kind:planet.biome,selected:planet.id===selected,current:planet.id===state.location.planetId,blocked:!assessment(planet).allowed||!systemAssessment(sy.id).allowed};});
    }else if(level==='galaxy'){
      const positions=[[23,18],[78,35],[26,78],[78,83]];
      nodes=systems().map((sys,i)=>({id:sys.id,x:positions[i%4][0],y:positions[i%4][1],size:sys.kind==='blue-giant'?23:sys.kind==='pulsar'?14:19,name:sys.name,color:sys.starColor,kind:sys.kind,selected:sys.id===selectedSystem,current:sys.id===currentSystem().id,blocked:!systemAssessment(sys.id).allowed}));
    }else{
      const d=destination(),positions=[[25,19],[77,47],[29,83]];
      nodes=destinations().map((item,i)=>({id:item.id,x:positions[i%3][0],y:positions[i%3][1],size:27,name:item.name,color:['#97cae5','#e5b9a1','#ada4e1'][i%3],kind:item.kind,selected:item.id===d?.id,current:false,blocked:state.resources.warpFuel<item.warpCost}));
    }
    const wormhole=E.campaignView?.(state)?.wormhole;
    return {level,wormhole:level==='system'&&wormhole?.visible&&wormhole.systemId===sy.id?wormhole:null,galaxy:{kind:state.galaxy.kind},star:{name:sy.name,kind:sy.kind,color:sy.starColor},nodes,selectedId:level==='system'?selected:level==='galaxy'?selectedSystem:destination()?.id,currentId:level==='system'?state.location.planetId:currentSystem().id};
  }
  function systemArrival(sy){
    const worlds=state.galaxy.planets.filter(p=>p.systemId===sy.id);
    return worlds.find(p=>p.id===selected)||worlds.slice().sort((a,b)=>E.travelCost(state,a.id)-E.travelCost(state,b.id))[0];
  }
  function renderMap(){
    const p=target(),sy=mapSystem(),nav=navigationData(),local=p.id===state.location.planetId;
    let content='';
    if(mapLevel==='system'){
      const trip=preview('travel',{planetId:p.id}),a=assessment(p),route=systemAssessment(sy.id);
      const record=E.discoveryCatalog(state).current.systems.find(s=>s.id===sy.id);
      $('og-heading').innerHTML=`<div class="og-eyebrow">${esc(state.galaxy.name)} · Carta do sistema</div><h1>${esc(sy.name)}</h1><p>${sy.planetIds.length} mundos · ${record.discovered} descobertos · ${record.percent}% explorado</p>`;
      content=`${riskBadge(route.allowed?a:route)}<h2>${esc(p.name)}</h2><p>${esc(biomes[p.biome]||p.biomeName)} · ${local?'Local atual':costText(trip.cost)||E.travelCost(state,p.id)+' comb.'}</p>${local?'<button class="og-button primary" data-tab="explore">Explorar este mundo</button>':'<button class="og-button primary" data-action="route-info">Viajar · revisar chegada</button>'}<button class="og-link" data-action="environment">Ambiente e equipamentos ↗</button>`;
    }else if(mapLevel==='galaxy'){
      const isHere=sy.id===currentSystem().id;
      $('og-heading').innerHTML=`<div class="og-eyebrow">Galáxia atual · ${state.galaxy.planets.length} mundos</div><h1>${esc(state.galaxy.name)}</h1><p>${systems().length} sistemas · ${E.discoveryCatalog(state).current.percent}% explorado</p>`;
      content=`<h2>${esc(sy.name)}</h2><p>${isHere?'Você está neste sistema':'Escolha um mundo para traçar a rota'} · ${sy.planetIds.length} mundos</p><button class="og-button" data-map-level="system">Ver mundos do sistema</button>`;
    }else{
      const d=destination(),jump=d?preview('warp',{destinationId:d.id}):null;
      $('og-heading').innerHTML=`<div class="og-eyebrow">Fronteira de dobra</div><h1>Rotas de dobra.</h1><p>${state.resources.warpFuel} células a bordo · escolha seu destino</p>`;
      content=d?`<span class="og-route-label">${({verdant:'Nebulosa',forge:'Buraco negro',abyss:'Fenda luminosa'})[d.kind]||'Fenda luminosa'} · ${d.warpCost} células</span><h2>${esc(d.name)}</h2><p class="og-travel-budget">Dobra ${d.warpCost} / ${state.resources.warpFuel} células · O₂ 5 / ${num(state.resources.oxygen)}</p>${!jump.allowed?`<p class="og-route-blocked">${esc(jump.reason)}</p>`:'<p>Rota disponível · mundos revelados na chegada.</p>'}<button class="og-button primary" data-action="warp-menu">Viajar · revisar salto</button>`:'';
    }
    $('og-map').innerHTML=nav.nodes.map(n=>`<button class="og-nav-node ${n.selected?'is-selected':''} ${n.blocked?'is-blocked':''}" ${mapLevel==='system'?`data-select="${esc(n.id)}"`:mapLevel==='galaxy'?`data-system="${esc(n.id)}"`:`data-destination="${esc(n.id)}"`} style="left:${n.x}%;top:${n.y}%" aria-label="${esc(n.name)}${n.current?', localização atual':''}${n.blocked?', exige preparo':''}" aria-pressed="${n.selected}"><span class="og-nav-hit" aria-hidden="true">${n.blocked?'<i>!</i>':''}</span><span class="og-nav-caption">${n.current?'AQUI':mapLevel!=='system'?esc(n.name):''}</span></button>`).join('');
    if(mapLevel==='galaxy')$('og-map').insertAdjacentHTML('beforeend',`<button class="og-station-node" data-action="station" aria-label="Traçar rota ao entreposto do sistema atual"><span class="og-nav-hit" aria-hidden="true"></span><span class="og-nav-caption">Entreposto local</span></button>`);
    if(nav.wormhole)$('og-map').insertAdjacentHTML('beforeend','<button class="og-wormhole-node" data-action="campaign-gate" aria-label="Examinar o buraco de minhoca Olho de Íris"><span>Olho de Íris</span></button>');
    $('og-context').innerHTML=content;
  }
  function renderExpedition(ex){
    const p=here();
    if(!ex){
      const story=window.OrbitCampaignUI?.dashboard(state);if(story){$('og-heading').innerHTML=story.heading;$('og-beacon').innerHTML=story.visual;$('og-context').innerHTML=story.context;return;}
      const beacon=E.beaconView?.(state)||{fragments:[],count:0,ready:false,claimed:false,rewardName:'Núcleo Horizonte'};
      $('og-heading').innerHTML=`<div class="og-eyebrow">Uma descoberta que muda a nave</div><h1>Farol Horizonte.</h1><p>${beacon.claimed?'Núcleo recuperado · continue desbravando':beacon.count+' de 3 frequências recuperadas'}</p>`;
      $('og-beacon').innerHTML=`<div class="og-beacon-core ${beacon.ready||beacon.claimed?'is-complete':''}" aria-hidden="true"><i></i><i></i><i></i><b>◆</b></div><div class="og-fragments">${beacon.fragments.map(f=>`<div class="og-fragment ${f.collected?'is-collected':''}"><span aria-hidden="true">${f.collected?'✓':'◇'}</span><div><strong>${esc(f.name)}</strong><small>${esc(f.description)}</small></div></div>`).join('')}</div>`;
      let next=button('scan','Analisar este planeta',{primary:true});
      if(p.scanned)next=p.sites.every(site=>site.explored)?'<button class="og-button primary" data-tab="galaxy">Buscar outra fronteira</button>':state.location.mode==='docked'?'<button class="og-button primary" data-action="sites">Escolher uma expedição</button>':assessment(p).allowed?button('dock',p.medium==='gas'?'Lançar sonda':p.medium==='liquid'?'Iniciar submersão':'Ancorar para explorar',{primary:true}):'<button class="og-button primary" data-tab="galaxy">Procurar uma rota acessível</button>';
      $('og-context').innerHTML=beacon.ready&&!beacon.claimed?`<h2>As três frequências se encontraram.</h2><p>${esc(beacon.rewardName)} · uma peça exclusiva para sua nave.</p>${button('claimBeacon','Reconstruir núcleo de dobra',{primary:true})}${!preview('claimBeacon').allowed?`<p>${esc(preview('claimBeacon').reason)}</p>`:''}`:`<h2>${beacon.claimed?'Qual será a próxima fronteira?':'Siga os sinais antigos.'}</h2><p>${beacon.claimed?'Cada expedição traz novos caminhos, recursos e peças.':'Recupere núcleos em três ambientes para reconstruir uma dobra exclusiva.'}</p>${next}`;
      return;
    }
    const on=ex.cells.find(c=>c.current)||ex.cells.find(c=>c.x===ex.position.x&&c.y===ex.position.y);
    const vehicle=p.medium==='gas'?'Sonda atmosférica':p.medium==='liquid'?'Explorador submersível':'Veículo de superfície';
    $('og-heading').innerHTML=`<div class="og-eyebrow">${esc(p.name)} · ${vehicle}</div><h1>${esc(ex.siteName)}</h1><p>${ex.beacons&&!ex.coreSecured?'Balizas '+ex.beacons.done+'/2 · triangule a tecnologia':ex.coreSecured?'Retorno de coleta · recupere os depósitos restantes':ex.coreRecovered?'Núcleo a bordo · volte à extração':'Sinal antigo ao norte · encontre uma rota'}</p>`;
    $('og-field-cells').style.setProperty('--grid-size',ex.width);
    $('og-field-cells').innerHTML=ex.cells.map(c=>`<button data-expedition-x="${c.x}" data-expedition-y="${c.y}" data-kind="${esc(c.collected?'empty':c.kind)}" class="og-field-cell ${c.current?'is-current':''}" ${c.specimen?'data-specimen="'+esc(c.specimen)+'"':''} ${!c.visible&&!c.moveAllowed?'disabled':''} ${!c.moveAllowed&&c.visible?`data-field-hint="${esc(c.kind==='wall'?'Obstáculo do terreno: não pode ser coletado. Contorne pela trilha.':c.current&&['ore','crystal','data'].includes(c.kind)&&!c.collected?'Você está sobre o depósito. Use Coletar abaixo do mapa.':c.current?'Posição atual do veículo.':c.adjacent?c.reason:'Aproxime-se pelos quadros vizinhos da trilha.') }"`:''} aria-label="${esc((terrainNames[c.kind]||'Terreno')+', coluna '+(c.x+1)+', linha '+(c.y+1)+(c.current?', posição atual':c.moveAllowed?', mover: '+costText(c.moveCost):c.reason?', '+c.reason:''))}"><span class="og-sr-only">${c.current?'Você está aqui':terrainNames[c.kind]||'Terreno'}${c.specimen?', exemplar único':''}</span>${c.specimen?window.OrbitXenoUI?.cellArt(c.specimen)||'':''}</button>`).join('');
    const warning=ex.returnRisk;
    $('og-field-caption').classList.toggle('is-warning',warning);
    root.dataset.fieldWeather=ex.weather?.active?'storm':ex.weather?.warning?'warning':'calm';
    $('og-field-caption').innerHTML=`<span>Integridade ${ex.integrity}/${ex.maxIntegrity}</span><span>Carga ${ex.load}/${ex.capacity}</span>${ex.weather?.rigorous?`<span class="og-weather-status">${esc(ex.weather.label)} · ${ex.weather.active?'ATIVA':ex.weather.warning?'chegando':'calmaria'} · ${ex.weather.persistent?'persistente':ex.weather.remaining+' ações'}</span>`:''}`;
    let action='';
    if(ex.specimen?.here)action=button('xenoCapture','Capturar '+ex.specimen.name,{primary:true,cost:true});
    else if(on?.kind==='beacon'&&preview('expeditionBeacon').allowed)action=button('expeditionBeacon','Ativar baliza',{primary:true,cost:true});
    else if(ex.atBase&&ex.turns>0)action=button('expeditionExtract','Extrair carga',{primary:true});
    else if(on?.kind==='core'&&!ex.coreRecovered)action=button('expeditionInteract','Abrir circuito do núcleo',{primary:true});
    else if(['ore','data','crystal'].includes(on?.kind)&&!on.collected)action=button('expeditionCollect','Recolher '+({ore:'minério',data:'pesquisa',crystal:'cristais'}[on.kind])+(!ex.coreSecured&&!ex.coreRecovered&&ex.load+4>ex.capacity?' · o núcleo não caberá depois':''),{primary:true,cost:true})+(!state.guide?.active?button('expeditionCollect','Extração intensiva: +50% de material, +3 energia e −1 integridade',{payload:{intensive:true},attrs:'data-intensive="true" data-caption="Intensiva +50%"',cost:true}):'');
    const contextAction=ex.atBase&&ex.turns>0?'expeditionExtract':on?.kind==='core'&&!ex.coreRecovered?'expeditionInteract':['ore','data','crystal'].includes(on?.kind)&&!on.collected?'expeditionCollect':null;
    const contextPreview=contextAction?preview(contextAction):null;
    const operation=E.siteOperation(state);
    const notice=operation.active?operation.label+' ativa: +1 energia por deslocamento. Sair não a remove.':operation.triggered&&!operation.stabilized?operation.label+' em '+operation.remaining+' ações. Planeje a extração.':ex.atBase?(ex.turns?'Na nave: extraia para guardar a carga.':'Siga as trilhas. Fissuras e correntes gastam energia e integridade.'):ex.returnBlocked?(ex.reserve===0?'Sem energia. Evacuar perde a carga.':'A energia não cobre a volta. Evacuar perde a carga.'):warning?'Reserva de volta em uso. Retorne com sua carga.':contextPreview&&!contextPreview.allowed?contextPreview.reason:ex.weather?.rigorous?'Tempestade: perigos custam +1 energia. A reserva de volta já prevê esse custo.':'Âmbar: custo de atravessar (E energia · INT integridade).';
    const returnControl=`<button class="og-button ${warning?'primary':''}" data-action="expedition-return" data-icon-intent="${ex.atBase?'base':'return'}">${ex.atBase?'Ponto de extração':'Voltar à nave'}<span class="og-cost">${ex.returnReserve??'—'} energia</span></button>`;
    $('og-context').innerHTML=`<p class="og-field-message" role="status" aria-live="polite">${esc(notice)}</p><div class="og-field-actions">${action||returnControl}${button('expeditionScan','Scanner',{cost:true})}</div><div class="og-context-links">${action&&!ex.atBase?'<button class="og-link og-return-link" data-action="expedition-return">⌂ Voltar à nave</button>':''}<button class="og-link" data-action="expedition-cargo">Carga ${ex.load}/${ex.capacity} ↗</button>${ex.weather?.rigorous?button('expeditionWait','Aguardar',{small:true,cost:true}):''}<button class="og-link" data-action="expedition-abort-menu">Evacuar</button></div>`;

  }
  function protectionChecks(a){return `<div class="og-protection-checks">${a.requirements.map(r=>`<div class="${r.met?'is-met':'is-missing'}"><b>${r.met?'✓':'!'}</b><span>${esc(r.label)}<small>${esc(capValue(r.key,r.available))} / ${esc(capValue(r.key,r.required))}</small></span></div>`).join('')}</div>`;}
  function requirementsHtml(a){
    return `<div class="og-requirements">${a.requirements.map(r=>`<div class="og-requirement ${r.met?'is-met':'is-missing'}"><div><strong>${esc(r.label)}</strong><small>${esc(labels[r.moduleType]||'Proteção da nave')}</small></div><div><b>${r.met?'PRONTO':'FALTA'}</b><span>${esc(capValue(r.key,r.available))}</span><small>Exige ${esc(capValue(r.key,r.required))}</small></div></div>`).join('')}</div>`;
  }
  function sheetBody(){
    const xeno=window.OrbitXenoUI?.sheet(sheet,state);if(xeno)return xeno;
    const fleet=window.OrbitFleetUI?.sheet(sheet,state);if(fleet)return fleet;
    const extra=window.OrbitVoyageUI.sheet(sheet,state,pendingImport);if(extra)return extra;
    const p=here(),r=state.resources,s=E.stats(state);
    if(sheet==='discard-review'){const d=discardChoice,owned=d.kind==='component'?state.components[d.id]:state.resources[d.id],amount=Math.min(10,owned),name=E.componentRecipes.find(p=>p.id===d.id)?.name||E.materials?.[d.id]?.name||costNames[d.id];return {title:'Liberar espaço',html:`<p>Descartar ${amount} × ${esc(name)}? A carga será perdida sem pagamento.</p><p>Você possui ${owned}. Restarão ${owned-amount}.</p>`,footer:button('discardCargo','Confirmar descarte',{payload:{...d,amount},attrs:`data-kind="${d.kind}" data-id="${d.id}" data-amount="${amount}"`})};}
    if(sheet==='journey')return window.OrbitJourney.sheet(state);
    if(sheet==='campaign')return window.OrbitCampaignUI.render(state,campaignPage);
    if(sheet==='station-route'){
      const route=preview('stationDock'),returnCost=Math.max(3,Math.ceil(8/s.fuelEfficiency));
      return {title:'Entreposto '+currentSystem().name,singleCard:true,html:`<div class="og-station-portrait">${window.OrbitCommerce.art('station')}<strong>Destino orbital · ${esc(currentSystem().name)}</strong></div><div class="og-facts">${fact('Ida',returnCost+' combustível · 2 O₂')}${fact('Retorno',returnCost+' combustível · 2 O₂')}${fact('Combustível a bordo',r.fuel)}${fact('Oxigênio a bordo',r.oxygen)}</div><p class="og-note">Mercado e encomendas disponíveis apenas após atracar. Desatracar retorna à órbita de ${esc(p.name)}.</p>${!route.allowed?`<p class="og-note">${esc(route.reason)}</p>`:''}`,footer:state.location.stationId?button('stationLeave','Desatracar para navegar',{cost:true}):state.location.mode==='docked'?button('launch','Decolar do planeta'):button('stationDock','Viajar e atracar')};
    }
    if(['station','market','market-item','stock'].includes(sheet))return window.OrbitCommerce.render(state,sheet,commerceView);
    if(sheet==='stock-components')return {title:'Componentes guardados',singleCard:true,html:`<div class="og-component-stock">${E.componentRecipes.map(part=>`<button class="og-component-slot" data-action="discard-review" data-kind="component" data-id="${part.id}" ${state.components[part.id]?'':'disabled'} aria-label="${esc(part.name)}: ${state.components[part.id]||0} unidades. Gerenciar espaço">${window.OrbitWorkshop.icon(part.id)}<strong>${esc(part.name)}</strong><b>${state.components[part.id]||0}</b><small>${(state.components[part.id]||0)*E.componentVolume(part.id)} vol. · ${E.componentVolume(part.id)} por un.</small></button>`).join('')}</div><p class="og-note">Toque em uma peça para liberar espaço.</p>`};

    if(sheet==='stored-module'){const m=state.inventory.find(m=>m.id===selectedCandidateId);return {title:m?.name||'Módulo',html:m?moduleCard(m):'<p>Esta peça não está mais no estoque.</p>',footer:''};}
    if(sheet==='maintenance'){
      const services=[['refuel','Combustível','fuel',r.fuel+'/'+s.maxFuel],['refillOxygen','Oxigênio','oxygen',r.oxygen+'/'+s.maxOxygen],['repair','Casco','shield',r.hull+'/'+s.maxHull],['refine','Dobra','warpFuel',r.warpFuel+'/'+s.maxWarpFuel]];
      const active=services.find(x=>x[0]===maintenanceAction)||services[0];
      return {title:'Manutenção',singleCard:true,html:`<div class="og-maintenance-tabs" role="group" aria-label="Serviços de bordo">${services.map(([action,label,icon,amount])=>`<button data-maintenance="${action}" aria-pressed="${action===active[0]}"><span>${icon==='shield'?window.OrbitArt.icon(icon):window.OrbitCommerce.art(icon)}</span><strong>${label}</strong><small>${amount}</small></button>`).join('')}</div>${service(active[0],active[1],active[3])}`};
    }
    if(sheet==='catalog')return window.OrbitDiscoveryCatalog.render(state,catalogView);
    if(sheet==='expedition-risk-confirm'){
      const pending=pendingFieldAction,safety=pending&&E.expeditionSafety(state,pending.action,pending.payload),ex=E.expeditionView(state);
      if(!safety||!ex)return {title:'Retome a exploração',html:'<p>Selecione uma ação no terreno.</p>'};
      return {title:safety.stranded?'Esta ação impede o retorno.':'Você está usando a reserva de volta.',html:`<p class="og-system-warning">${esc(safety.reason)}</p><div class="og-facts">${fact('Energia agora',ex.reserve)}${fact('Custo desta ação',safety.costReserve)}${fact('Energia depois',safety.afterReserve)}${fact('Necessária para voltar',safety.returnReserve??'Rota não conhecida')}${fact('Folga depois',safety.returnMargin??'—')}</div><p>${safety.stranded?'Sem energia para voltar, será preciso evacuar e perder a carga desta saída.':'Ainda dá para voltar, mas haverá pouca energia para desvios. A carga só fica salva ao extrair na nave.'}</p>`,footer:`<div class="og-risk-actions"><button class="og-button primary" data-action="nav-back">Cancelar ação</button><button class="og-button secondary" data-action="confirm-field-action">${safety.stranded?'Assumir risco e continuar':'Continuar mesmo assim'}</button></div>`};
    }
    if(sheet==='expedition-return-menu'){
      const ex=E.expeditionView(state),route=E.expeditionReturnRoute(state);
      if(!ex||!route)return {title:'Veículo na nave',html:'<p>Escolha uma nova expedição.</p>'};
      return {title:route.atBase?'Carga pronta para extrair':'Voltar à nave com a carga',html:`<p>O veículo seguirá a melhor rota conhecida. A carga será preservada; ao chegar, confirme a extração.</p><div class="og-facts">${fact('Energia disponível',ex.reserve)}${fact('Custo da volta',route.reserve??'Sem rota conhecida')}${fact('Energia ao chegar',route.afterReserve??'—')}${fact('Integridade consumida',route.integrity??'—')}${fact('Carga a bordo',ex.load+' / '+ex.capacity)}</div><button class="og-button secondary" data-action="overdrive-menu">Descarga de emergência · energia por casco</button>${route.canReturn?'':`<p class="og-system-warning">${esc(route.reason)} ${ex.reserve===0?'Sem energia, evacuar perde a carga desta saída.':''}</p>`}`,footer:`${route.atBase?button('expeditionExtract','Extrair carga com segurança',{primary:true}):button('expeditionReturn','Voltar à nave',{primary:true,cost:true})}<button class="og-link" data-action="nav-back">Continuar no terreno</button>`};
    }
    if(sheet==='overdrive-menu'){
      const q=preview('expeditionOverdrive');
      return {title:'Descarga de emergência',html:`<div class="og-encounter-art">${window.OrbitControlIcons.art('overdrive')}</div><h3>+${q.energy||0} energia · −12 casco</h3><p>A nave envia uma descarga ao veículo. O calor danifica o casco; extrair ou evacuar não desfaz esse desgaste. Uma descarga por saída.</p><p>Casco atual: ${state.resources.hull}. Após a descarga: ${Math.max(0,state.resources.hull-12)}.</p><p class="og-note">Não repara o veículo nem garante energia suficiente para voltar.</p>`,footer:button('expeditionOverdrive','Confirmar descarga',{primary:true})+(!q.allowed?`<p class="og-note">${esc(q.reason)}</p>`:'')};
    }
    if(sheet==='expedition-puzzle'){
      const task=window.OrbitVoyageUI.task(state,button);if(task)return task;
      const encounter=E.encounterView?.(state);
      if(encounter)return {title:encounter.title,header:`<div class="og-encounter-header">${window.OrbitCampaignUI.icon(encounter.item)}<div><b>${esc(encounter.item.name)}</b><small>${encounter.step}/${encounter.total} operações estabilizadas</small></div></div>`,html:`<p class="og-encounter-clue">${esc(encounter.clue)}</p>${encounter.options.map(o=>button('expeditionEncounter',o.label,{attrs:`data-index="${o.index}"`,payload:{index:o.index}})).join('')}<p class="og-note">Operação correta: sem custo. Erro: −2 energia e −1 integridade. A descoberta só é sua após extrair.</p>`,footer:encounter.done?button('expeditionRecover','Preservar descoberta',{primary:true,cost:true}):''};
      const ex=E.expeditionView(state),puzzle=ex?.puzzle;
      if(!puzzle)return {title:'Circuito recuperado',html:'<p>A peça já está na carga. Volte ao ponto de extração.</p><button class="og-button primary" data-action="close-sheet">Continuar expedição</button>'};
      return {title:'O núcleo ainda responde.',html:`<p>Alinhe os três rotores com as setas do alvo. Girar um rotor também gira o próximo, inclusive do terceiro para o primeiro.</p><div class="og-circuit-label"><span>ALVO</span><span>${puzzle.matched?'CIRCUITO ALINHADO':'RESTAURE A CONEXÃO'}</span></div><div class="og-circuit ${puzzle.matched?'is-matched':''}">${puzzle.dials.map((value,i)=>`<div class="og-rotor-cell"><span class="og-rotor-target" aria-label="Alvo ${i+1}: ${directions[puzzle.target[i]]}">${arrows[puzzle.target[i]]}</span><button class="og-rotor" data-action="expeditionTune" data-index="${i}" aria-label="Girar rotor ${i+1}. Atual ${directions[value]}, alvo ${directions[puzzle.target[i]]}"><i style="--turn:${value*90}deg" aria-hidden="true">↑</i></button><small>Rotor ${i+1}</small></div>`).join('')}</div><p class="og-note">Girar é gratuito. Recuperar alinhado usa ${puzzle.cost} de energia; uma tentativa errada gasta 2. Reserve energia para voltar.</p>${button('expeditionRecover','Recuperar núcleo',{primary:true,cost:true})}${!preview('expeditionRecover').allowed?`<p class="og-note">${esc(preview('expeditionRecover').reason)}</p>`:''}<button class="og-link" data-action="close-sheet">Voltar ao terreno</button>`};
    }
    if(sheet==='expedition-cargo'){
      const ex=E.expeditionView(state);
      if(!ex)return {title:'Carga entregue',html:'<p>Os recursos extraídos já estão na nave.</p><button class="og-button primary" data-action="close-sheet">Continuar</button>'};
      const m=ex.pending.module;
      return {title:'Ainda precisa voltar.',html:`<p>Esta carga está no veículo. Leve-a ao ponto de extração para guardá-la na nave. Se ficar sem energia fora da base, a evacuação será sua saída e a carga ficará para trás.</p><div class="og-facts">${fact('Energia',ex.reserve+' / '+ex.maxReserve)}${fact('Volta à extração',ex.returnReserve+' energia')}${fact('Integridade do veículo',ex.integrity+' / '+ex.maxIntegrity)}${fact('Carga ocupada',ex.load+' / '+ex.capacity)}${Object.entries(ex.pending).filter(([k,v])=>['ore','crystals','credits','data'].includes(k)&&v>0).map(([k,v])=>fact(costNames[k],v)).join('')}</div>${m?`<article class="og-module" style="--rarity:${rarity(m).color}"><h3>${esc(m.name)}</h3><span class="og-rarity">${rarity(m).name} · ${power(m.power)}×</span><p>${esc(m.description)}</p>${button('expeditionSalvage','Reciclar peça em minério')}</article>`:''}${ex.pending.fragment?'<p class="og-capability">Frequência antiga recuperada. Extraia para registrá-la no Farol Horizonte.</p>':''}<button class="og-button primary" data-action="close-sheet">Voltar ao terreno</button>`};
    }
    if(sheet==='expedition-abort-menu'){
      const ex=E.expeditionView(state),pending=ex?.pending||{},items=Object.entries(pending).filter(([k,v])=>typeof v==='number'&&v>0&&costNames[k]);
      return {singleCard:true,title:'Evacuação de emergência',html:`<article class="og-evacuation-card">${window.OrbitControlIcons.art('evacuate')}<h3>Recolher o veículo sem a carga?</h3><p>O que está na nave fica preservado. A carga desta saída será perdida.</p><div class="og-evacuation-loss"><strong>${ex?.load||0} unidades na expedição</strong><small>${items.map(([k,v])=>num(v)+' '+esc(costNames[k])).join(' · ')||'Nenhum recurso coletado'}${pending.module?' · '+esc(pending.module.name):''}${pending.storyItem?' · '+esc(pending.storyItem.name):''}${ex?.coreRecovered?' · núcleo ainda não extraído':''}</small></div></article>`,footer:`<div class="og-decision-actions"><button class="og-button og-panel-figure" data-action="close-sheet" data-icon-intent="rover"><span class="og-control-symbol">${window.OrbitControlIcons.art('rover')}</span><small class="og-control-caption">Ficar no terreno</small></button><button class="og-button og-panel-figure is-danger" data-action="expeditionAbort" data-caption="Evacuar sem carga"><span class="og-control-symbol">${window.OrbitControlIcons.art('evacuate')}</span><small class="og-control-caption">Evacuar sem carga</small></button></div>`};
    }
    if(sheet==='expedition-failed')return {title:'Veículo evacuado.',html:`<p>${esc(fieldNotice)}</p><p>A carga desta saída ficou para trás. Seus equipamentos instalados estão preservados.</p><button class="og-button primary" data-action="close-sheet">Planejar a próxima saída</button>`};
    if(sheet==='environment'){
      const planet=tab==='galaxy'?target():p,a=assessment(planet,environmentSite),site=planet.sites.find(x=>x.id===environmentSite);
      return {title:site?.name||planet.name,html:`${riskBadge(a)}<p>${esc(a.operationLabel||'Exploração de superfície')} · ${esc(biomes[planet.biome]||planet.biomeName)}</p><div class="og-environment-facts">${fact('Temperatura',planet.temperature+' °C')}${fact('Pressão',(planet.pressure??1)+' atm')}${fact('Radiação',planet.radiation+' rad')}${fact('Tempestades',(planet.weather??0)+' / 100')}</div>${requirementsHtml(a)}<p class="og-note">${a.allowed?'Proteções mínimas atendidas. Cada local ainda consome combustível e oxigênio e pode desgastar o casco.':'A expedição fica bloqueada enquanto faltar uma proteção. A análise orbital continua disponível.'}</p>${a.cost?`<p class="og-note">Consumo previsto: ${esc(costText(a.cost)||'sem custo adicional')}</p>`:''}`};
    }
    if(sheet==='route-info'){
      const sy=mapSystem(),a=systemAssessment(sy.id),arrival=mapLevel==='galaxy'?systemArrival(sy):target(),trip=preview('travel',{planetId:arrival.id});
      const oxygen=arrival.systemId===currentSystem().id?3:6,surface=assessment(arrival),plan=E.voyagePlan(state,arrival.id);
      return {title:'Órbita de '+arrival.name,singleCard:true,html:`<div class="og-route-preflight"><p>Chegada à órbita · exploração de superfície é outra operação.</p><div class="og-route-reserves">${[['fuel','Combustível',plan.fuel,state.resources.fuel,plan.afterFuel],['oxygen','Oxigênio',plan.oxygen,state.resources.oxygen,plan.afterOxygen]].map(([id,label,cost,stock,after])=>`<div>${window.OrbitJourney.glyph(id)}<strong>${label}</strong><b>${stock} → ${after}</b><small>Viagem: −${cost}</small></div>`).join('')}</div><div class="og-voyage-summary"><span>Depósito livre <b>${plan.space.free} un.</b></span><span>Volta estimada <b>${plan.returnFuelEstimate} combustível · ${plan.returnOxygenEstimate} O₂</b></span></div><small>${plan.afterFuel<plan.returnFuelEstimate||plan.afterOxygen<plan.returnOxygenEstimate?'⚠ Sem reserva para uma volta equivalente.':'Reserva cobre uma volta equivalente.'} Estimativa sem exploração ou troca de módulos.</small><strong>Superfície · ${surface.allowed?'proteções atendidas':'preparo necessário'}</strong><div class="og-preflight-missing">${surface.missing.map(r=>`<span>${esc(r.label)}<b>${r.available}/${r.required} ${esc(r.unit)}</b></span>`).join('')||'<span>Equipamento mínimo disponível</span>'}</div>${!trip.allowed?`<p class="og-system-warning">${esc(trip.reason)}</p>`:''}</div>`,footer:state.location.stationId?button('stationLeave','Desatracar para navegar',{cost:true}):state.location.mode==='docked'?button('launch','Retornar à órbita',{primary:true}):button('travel','Viajar para a órbita',{primary:true,payload:{planetId:arrival.id},attrs:`data-planet="${esc(arrival.id)}"`})};
    }
    if(sheet==='system-module')return systemSheet();
    if(sheet==='salvage-review')return salvageSheet();
    if(sheet==='fabricator')return window.OrbitWorkshop.render(state,lab);
    if(sheet==='fabricated'){
      const m=reward?.module;
      return {title:'Módulo pronto',html:m?`<div class="og-reward" style="--rarity:${rarity(m).color}">${window.OrbitArt.icon(m.type,"og-module-code",m)}<h3>${esc(m.name)}</h3><p>${esc(m.description)}</p><span class="og-rarity">${esc(rarity(m).name)} · ${power(m.power)}×</span></div>${reward?.cosmeticHonors?.length?`<p class="og-unlock-benefit">✦ Estilo conquistado: ${esc(reward.cosmeticHonors.join(', '))}. Já disponível no estúdio.</p>`:''}<p>Confirme a troca para ativar seus benefícios. O módulo anterior volta ao armazém.</p><button class="og-button primary" data-action="compare-module" data-module="${esc(m.id)}">Comparar e instalar</button><button class="og-link" data-action="close-sheet">Guardar para depois</button>`:'<button class="og-button primary" data-action="close-sheet">Continuar</button>'};
    }
    if(sheet==='cargo-content'){
      const names={ore:'Caixa de minério',crystals:'Cristais de dobra',oxygen:'Tanque de oxigênio'};
      const descriptions={ore:'Material recuperado nas expedições. A oficina usa minério para reparar o casco e produzir combustível.',crystals:'Cristais recuperados nos planetas. Condense 24 minérios e 3 cristais para produzir uma célula de dobra.',oxygen:'Suporte de vida: 1 Samambaia-lume produz até 12 de oxigênio no biorreator. Colete em florestas ou compre no entreposto. Em planeta respirável, a captação é gratuita.'};
      const actions=cargoResource==='ore'?service('refuel','Combustível',r.fuel+'/'+s.maxFuel)+service('repair','Casco',r.hull+'/'+s.maxHull):cargoResource==='crystals'?service('refine','Células de dobra',r.warpFuel+'/'+s.maxWarpFuel):service('refillOxygen','Oxigênio',r.oxygen+'/'+s.maxOxygen);
      return {title:names[cargoResource],html:`<div class="og-cargo-amount"><strong>${num(r[cargoResource])}</strong><span>${cargoResource==='oxygen'?'de '+num(s.maxOxygen)+' unidades de ar':'unidades armazenadas'}</span></div><p>${descriptions[cargoResource]}</p><div>${actions}</div><button class="og-button secondary" data-action="nav-back">Voltar ao depósito</button>`};
    }
    if(sheet==='planet-info'){
      const a=assessment(p),docked=state.location.mode==='docked';
      return {title:p.name,singleCard:true,html:`<div class="og-descent-summary"><p>${esc(biomes[p.biome]||p.biomeName)} · ${docked?'Ancorado':'Em órbita'}</p><div class="og-descent-facts">${fact('Temperatura',p.scanned?p.temperature+' °C':'—')}${fact('Radiação',p.scanned?p.radiation+' rad':'—')}${fact('Pressão',p.scanned?p.pressure+' atm':'—')}${fact('Atmosfera',p.scanned?p.atmosphere:'—')}</div>${p.scanned?protectionChecks(a):'<p>Use o scanner para conhecer este mundo.</p>'}<p class="og-descent-note">${p.scanned?p.sites.filter(x=>!E.siteStatus(state,x.id).exhausted).length+' pontos ainda não explorados. Confira o custo de cada saída antes de confirmar.':'A análise revela os locais e suas condições.'}</p></div>`,footer:p.scanned?'<button class="og-button og-descent-entry" data-action="sites" aria-label="Descer: escolher ponto"><span class="og-action-world" aria-hidden="true"></span><small>Descer</small></button>':button('scan','Analisar planeta',{primary:true})};
    }
    if(sheet==='sites'){
      const site=p.sites.find(x=>x.id===environmentSite)||p.sites.find(x=>!E.siteStatus(state,x.id).exhausted)||p.sites[0];
      if(!site)return {title:'Nenhum ponto encontrado',html:'<p>Analise este planeta primeiro.</p>'};
      const status=E.siteStatus(state,site.id),a=assessment(p,site.id),docked=state.location.mode==='docked',check=preview('explore',{siteId:site.id});
      return {title:'Pontos de exploração',singleCard:true,html:`<div class="og-descent-summary"><div class="og-site-choices" role="group" aria-label="Escolher ponto">${p.sites.map((x,i)=>`<button data-pick-site="${esc(x.id)}" aria-pressed="${x.id===site.id}"><span class="og-action-world" aria-hidden="true"></span><strong>${esc(x.name)}</strong><small>${E.siteStatus(state,x.id).percent}% · ${E.siteStatus(state,x.id).exhausted?'Esgotado':x.explored?'Coleta':'Sinal'}</small></button>`).join('')}</div><h3>${esc(site.name)}</h3>${E.siteOperation(state,site.id).visits?operationNotice(site.id,true):''}${site.environment?`<p class="og-descent-note">${esc(site.environment.biomeName)} · ${site.environment.temperature} °C · ${site.environment.pressure} atm</p>`:''}${protectionChecks(a)}<p class="og-descent-note">${status.coreSecured?'Tecnologia já extraída':'Tecnologia pendente'} · ${status.remaining}/4 depósitos restantes.</p><p class="og-descent-note">Bateria ${state.guide?.active?(state.guide.v===2&&state.guide.region>0?24:48):s.expeditionReserve} · saída: ${esc(costText(a.cost)||'sem custo')}<br>Após descer: ${Math.max(0,r.fuel-a.cost.fuel)} combustível · ${Math.max(0,r.oxygen-a.cost.oxygen)} O₂</p>${status.exhausted?'<p class="og-descent-note">Local esgotado. Selecione outro.</p>':''}</div>`,footer:status.exhausted?'':descentControl(site)};
    }
    if(sheet==='modules'){
      const parts=inventoryTab==='equipped'?Object.values(state.equipped):state.inventory;
      return {title:'Módulos · '+state.inventory.length+'/'+E.stats(state).cargoCapacity,header:`<div class="og-storage-select" role="group" aria-label="Local dos módulos"><button data-inventory="inventory" aria-pressed="${inventoryTab==='inventory'}"><span class="og-storage-object">${window.OrbitArt.icon('cargo')}<b>${state.inventory.length}</b></span><small>Guardados</small></button><button data-inventory="equipped" aria-pressed="${inventoryTab==='equipped'}"><span class="og-storage-object"><span class="og-action-ship" aria-hidden="true"></span><b>8</b></span><small>Instalados</small></button></div>`,html:window.OrbitCommerce.pairs(parts.map(m=>`<button class="og-trade-tile og-module-tile" style="--rarity:${rarity(m).color}" ${inventoryTab==='equipped'?`data-module-focus="${m.type}"`:`data-action="stored-module" data-module="${esc(m.id)}"`}>${window.OrbitArt.icon(m.type,'og-module-code',m)}<strong>${esc(m.name)}</strong><small>${esc(rarity(m).name)} · ${power(m.power)}×</small></button>`))||'<p>Recupere ou fabrique módulos para preencher seu estoque.</p>'};
    }
    if(sheet==='workshop')return {title:'Oficina de bordo',html:window.OrbitCommerce.pairs([window.OrbitCommerce.tile('fabricator','Construir módulos','Escolher categoria','parts'),window.OrbitCommerce.tile('components-menu','Componentes','Fabricar peças de receita','crystals'),window.OrbitCommerce.tile('maintenance','Manutenção','Reparar e abastecer','fuel'),window.OrbitCommerce.tile('stock','Meu estoque','Ver materiais disponíveis','ore')]),footer:`<div class="og-rescue-access">${rescueControl('rescue-menu','Resgate')}<small>${preview('rescue').allowed?'Socorro de emergência disponível': 'Sem emergência · nave operacional'}</small></div>`};
    if(sheet==='customize'){
      const palette=(items)=>`<div class="og-paints">${items.map(([color,name])=>`<button class="og-paint" data-action="paint" data-color="${color}" style="--paint:${color}" aria-label="${name}" aria-pressed="${state.ship.color===color}"><span>${({"Laranja solar":"Laranja","Azul aurora":"Azul","Lilás nebulosa":"Lilás","Verde musgo":"Musgo","Areia lunar":"Areia","Rosa pétala":"Rosa","Céu de algodão":"Céu"})[name]||name}</span></button>`).join('')}</div>`;
      return {title:'Estúdio da '+(E.fleetCatalog?.SHIPS.find(x=>x.id===state.fleet?.active)?.name||'Andorinha'),singleCard:true,html:`<div class="og-custom-studio"><form class="og-name-form" id="og-name-form"><input id="og-name" value="${esc(state.ship.name)}" maxlength="24" autocomplete="off" aria-label="Nome da nave"><button class="og-button small" type="submit">Salvar nome</button></form><div class="og-studio-top"><div class="og-studio-preview"><canvas id="og-custom-preview" aria-label="Prévia animada da pintura e do rastro selecionados"></canvas><small>Prévia ao vivo</small></div><div class="og-studio-colors"><span class="og-field-label">Pastéis</span>${palette(paints)}<span class="og-field-label">Premium · neon metálico</span>${palette([['#a34dff','Ultravioleta'],['#31ffbb','Boreal'],['#ff4795','Nova rosa']])}</div></div><span class="og-field-label">Rastros</span><div class="og-trail-picker">${[['blue','Azul','#70d8ff'],['orange','Laranja','#ffae64'],['cosmic','Cósmico','#b46aff'],['aurora','Boreal','#5fffc5'],['solar','Nova','#ff68b0']].map(([id,name,color],i)=>`<button data-action="trail" data-trail="${id}" aria-label="Rastro ${name}" aria-pressed="${(state.ship.trail||'blue')===id}" style="--trail:${color}"><i aria-hidden="true"></i><span>${name}</span><small>${i<2?'Livre':'Especial'}</small></button>`).join('')}</div><p class="og-studio-note">${E.cosmeticHonors(state).filter(h=>h.earned).length}/3 estilos conquistados na campanha. Todos livres para testar.</p></div>`};
    }
    if(sheet==='status')return {title:'Tudo sob controle',html:`<div class="og-facts">${fact('Casco',r.hull+' / '+s.maxHull)}${fact('Oxigênio',r.oxygen+' / '+s.maxOxygen)}${fact('Combustível',r.fuel+' / '+s.maxFuel)}${fact('Células de dobra',r.warpFuel+' / '+s.maxWarpFuel)}${fact('Módulos no armazém',s.cargoUsed+' / '+s.cargoCapacity)+fact('Volume ocupado',E.storageView(state).used+' / '+E.storageView(state).capacity)}</div><p>Os recursos são consumidos por ação. Nada se perde enquanto você planeja.</p><button class="og-button primary" data-action="workshop">Abrir oficina</button>`};
    if(sheet==='warp-menu'){
      const dest=destination(),payload=dest?{destinationId:dest.id}:{},jump=preview('warp',payload);
      return {singleCard:true,title:dest?.name||'Além desta galáxia',html:`<article class="og-atlas-detail">${window.OrbitArt.icon('warp')}<p>${esc(dest?.description||'Novos sistemas aguardam sua expedição.')}</p><div class="og-facts">${fact('Células necessárias',dest?.warpCost||E.warpCost(state))}${fact('Células a bordo',r.warpFuel)}${fact('Oxigênio necessário',5)}${fact('Oxigênio a bordo',num(r.oxygen))}</div><p>Sistemas e planetas serão revelados na chegada.</p>${!jump.allowed?`<p class="og-note">${esc(jump.reason)}</p>`:''}</article>`,footer:button('warp','Iniciar salto de dobra',{primary:true,payload,attrs:dest?`data-warp-destination="${esc(dest.id)}"`:'',cost:false})};
    }
    if(sheet==='reward')return window.OrbitExtractionUI.render(state,reward||{});
    if(sheet==='rescue-menu')return {title:'Voltar em segurança',html:`<p>O resgate devolve a nave à órbita segura com combustível, oxigênio e casco parcialmente recuperados. Seus módulos são preservados.</p><div class="og-facts">${fact('Minério',num(state.resources.ore)+' → '+num(Math.floor(state.resources.ore*.8)))}${fact('Lumes',num(state.resources.credits)+' → '+num(Math.floor(state.resources.credits*.9)))}${fact('Cristais',num(state.resources.crystals)+' → '+num(Math.max(0,state.resources.crystals-1)))}</div><p>Também funciona se você estiver sem recursos.</p>${rescueControl('rescue','Confirmar resgate')}<button class="og-link" data-action="workshop">Voltar à oficina</button>`};
    if(sheet==='help')return window.OrbitHelp.render();
    if(sheet==='reset-menu')return {title:'Uma nova expedição?',html:`<p>Isso substitui seu progresso atual por uma nova nave e novos mundos.</p><button class="og-button primary" data-action="confirm-reset">Começar do zero</button><button class="og-link" data-action="close-sheet">Manter minha expedição</button>`};
    return window.OrbitJourney.menu(sound,saveNote);
  }
  function moduleCard(m,installed=false){
    const details=E.moduleDetails(state,m);if(m.type==='cargo')details.metrics.push({label:'Volume do depósito',value:E.stats({...state,equipped:{...state.equipped,cargo:m}}).cargoCapacity*25,unit:'',key:'storageVolume'});const cards=[state.equipped[m.type],...state.inventory.filter(item=>item.type===m.type)],index=cards.findIndex(item=>item.id===m.id);
    return `<article class="og-item-card ${m.mission?'is-cosmic':''}" style="--rarity:${rarity(m).color}"><div class="og-card-crest"><span>${esc(rarity(m).name)} · ${power(m.power)}×</span><span class="og-install-tag">${installed?'Instalado':'No estoque'}</span>${favoriteButton(m)}</div><div class="og-card-carousel"><button data-action="module-slide" data-module="${esc(m.id)}" data-type="${m.type}" data-step="-1" aria-label="Módulo anterior" ${index<=0?'disabled':''}>‹</button><div class="og-card-art">${window.OrbitArt.icon(m.type,'og-module-code',m)}</div><button data-action="module-slide" data-module="${esc(m.id)}" data-type="${m.type}" data-step="1" aria-label="Próximo módulo" ${index>=cards.length-1?'disabled':''}>›</button></div><h3>${esc(m.name)}</h3><p class="og-card-specialty">${esc(details.specialty)} · ${index+1}/${cards.length}</p><div class="og-card-metrics">${details.metrics.map(item=>`<div><small>${esc(item.label)}</small><strong>${esc(metricFormat(item.value,item.unit,item.key))}</strong></div>`).join('')}</div>${m.mission?'<span class="og-cosmic-tag">✦ Tecnologia do Coro · 12,5% dimensional</span>':''}${installed?'':`<div class="og-card-tools">${m.mission?'<span class="og-quest-protected">✦ Peça única protegida</span>':`<button data-action="salvage-review" data-module="${esc(m.id)}" aria-label="Revisar desmontagem de ${esc(m.name)}"><span aria-hidden="true">♻</span><small>Reciclar</small></button>`}<button data-action="compare-module" data-module="${esc(m.id)}" aria-label="Comparar e instalar ${esc(m.name)}"><span aria-hidden="true">⇄</span><small>Encaixar</small></button></div>`}${window.OrbitXenoUI?.moduleRune(state,m)||''}</article>`;
  }
  function rescueControl(action,label){
    const p=preview('rescue');
    return `<button class="og-button og-rescue-control" data-action="${action}" aria-label="${esc(label+(p.allowed?'':'. '+p.reason))}" ${p.allowed?'':'disabled'}><span class="og-rescue-art" aria-hidden="true">${window.OrbitArt.icon('survival')}<span class="og-rescue-beacon"></span></span><small class="og-control-caption">${label}</small></button>`;
  }
  function service(action,name,amount){
    const p=preview(action),cost=Object.entries(p.cost||{}),payment=cost.find(([key])=>key==='ore'||key==='credits')?.[0],resource=({refuel:'fuel',repair:'hull',refillOxygen:'oxygen',refine:'warpFuel'})[action];
    const label=action==='refine'?'Refinar':action==='repair'?'Reparar':'Repor';
    const art=action==='repair'?window.OrbitCommerce.symbol('maintenance'):window.OrbitCommerce.art(({refuel:'fuel',refillOxygen:'oxygen',refine:'warpFuel'})[action]);
    const control=button(action,label,{small:true,attrs:payment?`data-payment="${payment}"`:'',payload:payment?{payment}:{}})
      .replace('og-button ','og-button og-service-action ')
      .replace(`>${esc(label)}</button>`,`><span class="og-service-art" aria-hidden="true">${art}</span><span class="og-control-caption">${label}</span></button>`);
    const balances=cost.map(([key,value])=>`<div class="og-service-budget"><span>${esc(costNames[key]||key)}</span><strong>${num(state.resources[key]||0)} <small>/ ${num(value)}</small> ${(state.resources[key]||0)<value?'· faltam '+num(value-(state.resources[key]||0)):'→ '+num((state.resources[key]||0)-value)}</strong><small>Estoque / custo · saldo</small></div>`).join('');
    return `<div class="og-service og-service-preview"><div><h3>${name} <span>${amount}</span></h3>${p.allowed?`<p>+${p.amount||0} · após: ${num(state.resources[resource]+(p.amount||0))}</p>`:`<p>${esc(p.reason)}</p>`}</div>${action==='refillOxygen'?'<p class="og-note">Biorreator: 1 Samambaia-lume → até 12 O₂. Em atmosfera respirável, captação gratuita.</p>':action==='refuel'?'<p class="og-note">Refino: 1 minério → até 4 combustível; até 3 minérios por operação.</p>':action==='refine'?'<p class="og-note">1 célula: 24 minérios + 3 cristais.</p>':''}${balances||(!cost.length&&p.allowed?'<p>Reposição gratuita · nenhum material consumido</p>':'')}${control}</div>`;
  }
  function roomForSheet(){
    if(['workshop','fabricator','maintenance','fabricated'].includes(sheet))return 0;
    if(['stock','stock-components','modules','cargo-content','salvage-review','market','market-item','station','reward'].includes(sheet))return 3;
    if(['system-module','stored-module'].includes(sheet)){
      const type=sheet==='stored-module'?state.inventory.find(m=>m.id===selectedCandidateId)?.type:systemType;
      return ({engine:1,warp:4,scanner:2,cargo:3,arm:0,shield:4,life:5,survival:5})[type]??2;
    }
    return 2;
  }
  // One tap used to rebuild the open panel 2-3 times (act → render → renderSheet, then openSheet → renderSheet), each with
  // its own pagination layout passes. Inside an input handler the rebuild is deferred and done once when the handler ends.
  function renderSheet(){if(sheetBatch){sheetDirty=true;return;}renderSheetNow();}
  function afterSheet(fn){if(sheetBatch)sheetAfter.push(fn);else fn();}
  function batchSheet(fn){sheetBatch++;try{return fn();}finally{if(--sheetBatch===0){const after=sheetAfter;sheetAfter=[];if(sheetDirty){sheetDirty=false;if(sheet)renderSheetNow();}after.forEach(f=>f());}}}
  function renderSheetNow(){
    const info=sheetBody(),backdrop=$('og-sheet-backdrop'),active=document.activeElement,hadFocus=backdrop.contains(active);
    if(sheet==='expedition-puzzle'){
      const fragment=document.createElement('div');fragment.innerHTML=info.html+(info.footer||'');const recover=fragment.querySelector('[data-action="expeditionRecover"]');
      if(recover){const notice=fragment.querySelector('.og-operation-note');const controls=(notice?.outerHTML||'')+recover.outerHTML;notice?.remove();recover.remove();fragment.querySelectorAll('[data-action="close-sheet"]').forEach(n=>n.remove());info.html=fragment.innerHTML;info.footer='<div class="og-recovery-footer">'+controls+'</div>';info.singleCard=true;}
    }

    const focusKey=active?.id?{id:active.id}:active?.dataset?{...active.dataset}:null;
    // Re-rendering the same panel (a swatch tap, a resize when the keyboard opens) must not discard text the player is typing.
    const drafts=backdrop.querySelector('.og-sheet')?.dataset.sheet===sheet?[...backdrop.querySelectorAll('input[id]:not([type]),input[id][type=text],textarea[id]')].filter(el=>el.value!==el.defaultValue).map(el=>({id:el.id,value:el.value,start:el.selectionStart,end:el.selectionEnd})):[];
    backdrop.hidden=false;
    backdrop.innerHTML=`<section class="og-sheet ${info.singleCard?'og-single-card':''}" data-sheet="${esc(sheet)}" data-card-kind="${info.cardKind||'module'}" data-room="${roomForSheet()}" role="dialog" aria-modal="true" aria-labelledby="og-sheet-title"><div class="og-room-heading"><nav class="og-panel-navigation" aria-label="Navegação do painel"><button data-action="nav-back" class="og-place-exit">‹ ${esc(parentPlace().label)}</button><button class="og-sheet-close" data-action="close-sheet" aria-label="${inModuleDetails()?'Fechar detalhes e voltar à nave aberta':'Fechar painel e ver o jogo'}">×</button></nav><div class="og-sheet-header"><h2 id="og-sheet-title">${esc(info.title)}</h2></div></div>${info.header?`<div class="og-sheet-fixed">${info.header}</div>`:''}<div class="og-sheet-content">${sheetNotice?`<p class="og-note" role="status">${esc(sheetNotice)}</p>`:''}${info.html}</div><nav class="og-page-controls" aria-label="Páginas deste painel"><button data-sheet-page="-1" aria-label="Página anterior">‹ Anterior</button><span class="og-page-status" aria-live="polite"></span><button data-sheet-page="1" aria-label="Próxima página">Próxima ›</button></nav>${info.footer?`<div class="og-sheet-footer">${info.footer}</div>`:''}</section>`;
    window.OrbitJourney.controls(backdrop);
    if(sheet==='catalog')window.OrbitDiscoveryCatalog.paint(backdrop,state);
    Array.from(root.children).forEach(el=>{if(el!==backdrop)el.inert=true;});
    const content=backdrop.querySelector('.og-sheet-content'),pages=backdrop.querySelector('.og-page-controls'),requested=sheetPage;pages.hidden=true;if(info.singleCard){content.dataset.pages='1';sheetPage=0;pages.hidden=true;}else{
      // Content that already overflows will need page controls: show them first and paginate once (not twice).
      if(content.scrollHeight>content.clientHeight+1)pages.hidden=false;
      const markup=pages.hidden?content.innerHTML:'';sheetPage=window.OrbitPanelPager.mount(content,pages,requested);
      if(pages.hidden&&Number(content.dataset.pages)>1){pages.hidden=false;content.innerHTML=markup;sheetPage=window.OrbitPanelPager.mount(content,pages,requested);}
    }
    for(const d of drafts){const el=backdrop.querySelector('#'+CSS.escape(d.id));if(el){el.value=d.value;if(el.id===focusKey?.id)try{el.setSelectionRange(d.start,d.end);}catch{}}}
    if(sheet==='customize')window.OrbitArt.previewCustomization($('og-custom-preview'),state);
    updateHistoryButtons();syncExperience();
    if(hadFocus){const candidates=[...backdrop.querySelectorAll('button,input,select')].filter(el=>el.getClientRects().length);const previous=focusKey&&candidates.find(el=>focusKey.id?el.id===focusKey.id:Object.keys(focusKey).length&&Object.entries(focusKey).every(([key,value])=>el.dataset[key]===value));(previous&&!previous.disabled?previous:backdrop.querySelector('button:not(:disabled)'))?.focus({preventScroll:true});}
  }
  function openSheet(name){
    if(['station','market','contracts'].includes(name)&&!state.location.stationId)name='station-route';
    const source=sheet,labels={fleet:'Hangar','fleet-trader':'Viajante',journey:'Objetivo',stock:'Estoque',station:'Estação',workshop:'Oficina',menu:'Menu',status:'Condição da nave',market:'Mercado',modules:'Módulos',fabricator:'Receita',journey:'Objetivo','planet-info':'Análise do planeta',sites:'Pontos de exploração'};
    const entrances={fleet:['station','fleet-trader'],'fleet-trader':['station'],campaign:['journey','stock','menu'],'reset-menu':['menu'],stock:['station','workshop','menu'],workshop:['station','menu','status'],modules:['stock','workshop','station','menu','fabricator'],market:['station'], 'market-item':['stock','market'],catalog:['menu'],help:['menu'],environment:['planet-info','sites'],sites:['planet-info'],'rescue-menu':['workshop'],customize:['menu']};
    if(name==='planet-info')delete placeParents['planet-info'];
    if(name==='modules'&&!source&&tab==='ship')placeParents.modules={label:shipDetail.mode==='interior'?'Nave aberta':'Nave',action:shipDetail.mode==='interior'?'ship-overview':'world'};
    else if(entrances[name]){if(entrances[name].includes(source))placeParents[name]={label:labels[source],action:source};else if(!source)delete placeParents[name];}
    if(name==='modules'&&!['stored-module','system-module','salvage-review'].includes(source))moduleOrigin='inventory';
    sheetPage=0;if(!sheet)focusBeforeSheet=document.activeElement;sheet=name;sheetNotice='';$('og-toast').hidden=true;renderSheet();afterSheet(()=>$('og-sheet-backdrop').querySelector('button:not(:disabled)')?.focus({preventScroll:true}));}
  function closeSheet(){sheet=null;syncExperience();sheetNotice='';const backdrop=$('og-sheet-backdrop');backdrop.hidden=true;backdrop.innerHTML='';Array.from(root.children).forEach(el=>{el.inert=false;});const restore=focusBeforeSheet?.isConnected&&root.contains(focusBeforeSheet)&&focusBeforeSheet.getClientRects().length?focusBeforeSheet:root.querySelector(`.og-tabs [data-tab="${tab}"]`);restore?.focus({preventScroll:true});}
  function dismissSheet(){if(moduleOrigin==='ship'&&['system-module','stored-module'].includes(sheet))shipOverview();else closeSheet();}
  function toast(text,error){const el=$('og-toast');clearTimeout(toastTimer);el.textContent=text;el.classList.toggle('error',!!error);el.hidden=false;toastTimer=setTimeout(()=>el.hidden=true,4400);}
  function beep(action){window.OrbitAudio.fx(action);}
  function craftFeedback(quantity,anchor,message){
    if(!anchor)return;
    root.querySelectorAll('.og-craft-feedback').forEach(el=>el.remove());
    const box=root.getBoundingClientRect(),el=document.createElement('div');
    el.className='og-craft-feedback';el.setAttribute('role','status');el.setAttribute('aria-label',message);
    el.textContent='+'+quantity;el.style.left=(anchor.x+anchor.width/2-box.x)+'px';el.style.top=(anchor.y-box.y)+'px';
    root.append(el);setTimeout(()=>el.remove(),1300);
  }
  function act(action,payload={}){
    if(state.expedition&&!payload.riskAccepted){const safety=E.expeditionSafety?.(state,action,payload);if(safety?.risky&&(safety.costReserve>0||safety.costIntegrity>0)&&(safety.stranded||safety.returnMargin<E.expeditionReturnRoute(state).afterReserve)&&E.preview(state,action,payload).allowed){pendingFieldAction={action,payload:{...payload}};navigate(()=>openSheet('expedition-risk-confirm'));return {ok:false,confirmation:true,message:safety.reason};}}
    const craftAnchor=action==='craftComponent'?root.querySelector('[data-action="craftComponent"]')?.getBoundingClientRect():null;
    const craftBefore=action==='craftComponent'?(state.components?.[payload.componentId]||0):0;
    const beforeCampaign=E.campaignView?.(state),wasGuided=!!state.guide?.active;
    const oldSheet=sheet,wasInField=!!state.expedition,installedType=action==='equip'?state.inventory.find(m=>m.id===payload.moduleId)?.type:null,metricsBefore=(installedType||['runeEngrave','runeRemove','fleetSwitch'].includes(action))&&E.shipMetrics?E.shipMetrics(state):null,result=E.dispatch(state,action,payload);
    if(!result.ok){if(sheet){sheetNotice=result.message;renderSheet();}else toast(result.message,true);beep('error');return result;}
    const fieldAction=action.startsWith('expedition'),fieldEnded=wasInField&&!state.expedition;
    if(action==='discardCargo'){const parent=parentPlace();openSheet(parent.action);}
    if(action==='craftComponent')window.OrbitWorkshop.afterCraft?.(state,lab,payload);
    if(action==='stabilizeSite')sheetNotice='';
    if(action==='explore'){delete root.dataset.effect;closeSheet();tab='expedition';fieldNotice='Toque em um setor vizinho para pilotar. Preserve energia para a volta.';}
    if(fieldAction){fieldNotice=result.message;clearTimeout(toastTimer);$('og-toast').hidden=true;}
    if(fieldEnded){closeSheet();tab='explore';}
    if(['travel','warp','rescue','campaignReturnHome','guideSkip','guideFinish'].includes(action)){closeSheet();tab='explore';selected=state.location.planetId;selectedSystem=currentSystem().id;mapLevel='system';environmentSite=null;}
    if(action==='stationDock'){closeSheet();tab='explore';openSheet('station');}
    if(action==='stationLeave'){closeSheet();tab='galaxy';mapLevel='galaxy';}
    if(action==='launch'){closeSheet();if(tab!=='galaxy')selected=state.location.planetId;}
    if(action==='equip'){closeSheet();shipDetail.expanded=false;selectedCandidateId='';}
    const installReturn=installedType&&!wasGuided?(moduleOrigin==='inventory'?'modules':moduleOrigin==='fabricated'&&fabricatedParent==='campaign'?'campaign':moduleOrigin==='fabricated'?'fabricator':null):null;
    if(installedType&&moduleOrigin!=='workshop'&&!installReturn){tab='ship';shipDetail={mode:'interior',selectedModule:null,expanded:false};scene.resetCamera();}
    if(['scan','dock','travel','warp'].includes(action)){scene.effect(action);root.dataset.effect=action;$('og-effect').textContent=({scan:'Sinais identificados',dock:here().medium==='gas'?'Sonda atmosférica ativa':here().medium==='liquid'?'Submersão iniciada':'Ancoragem concluída',travel:'Traçando rota',warp:'Dobra espacial'})[action];clearTimeout(effectTimer);effectTimer=setTimeout(()=>delete root.dataset.effect,1300);}
    if(sheet)sheetNotice=['expeditionTune','expeditionTask','craftComponent','paint','trail','rename'].includes(action)?'':result.message;
    beep(action);save();render();
    if(metricsBefore&&result.ok)showShipDelta(metricsBefore,E.shipMetrics(state));
    // Each exemplar has its own capture cinematic; it cannot be skipped (taps, keys and Back wait for it).
    if(result.ok&&action==='xenoCapture'&&state.xeno?.pending){if(window.OrbitXenoCinema)window.OrbitXenoCinema.play(root,state.xeno.pending);else window.OrbitXenoUI?.captured(root,state.xeno.pending);}
    if(result.ok&&result.reward?.specimen)window.OrbitXenoUI?.arrived(root,result.reward.specimen);
    window.OrbitFeedback?.show(root,result,action,state);
    if(installedType){scene.effect('equip',installedType);const equipped=state.equipped[installedType],resistance=E.campaignView(state).resistance;toast(equipped.name+' instalado.'+(equipped.mission?' Resistência dimensional: '+resistance+'%.':''));}
    if(installedType&&moduleOrigin==='workshop')openSheet('fabricator');
    else if(installReturn){const parent=placeParents[installReturn];openSheet(installReturn);if(parent)placeParents[installReturn]=parent;updateHistoryButtons();renderSheet();}
    if(installedType)$('og-context').querySelector('[data-action="module-info"]')?.focus({preventScroll:true});
    if(action==='salvage'&&oldSheet==='salvage-review'){if(moduleOrigin==='ship')openSystem(systemType,'');else openSheet('modules');}
    else if(action==='launch'&&oldSheet==='station-route')openSheet('station-route');
    else if(action==='scan')openSheet('sites');
    else if(action==='dock'&&!wasGuided)openSheet('sites');
    else if(action==='expeditionInteract')openSheet('expedition-puzzle');
    else if(action==='expeditionEncounter'&&!sheet){openSheet('expedition-puzzle');sheetNotice=result.message;renderSheet();}
    else if(action==='expeditionTune')$('og-sheet-backdrop').querySelector(`[data-index="${payload.index}"]`)?.focus({preventScroll:true});
    else if(action==='expeditionRecover'&&state.expedition?.coreRecovered){closeSheet();fieldScene?.effect('core');fieldNotice='Núcleo recuperado. Leve a carga ao ponto de extração.';render();}
    else if(action==='expeditionOverdrive'){closeSheet();render();}
    else if(action==='expeditionReturn'){closeSheet();fieldNotice='Você voltou com a carga. Extraia para guardá-la na nave.';render();}
    else if(action==='expeditionExtract'){reward=result.reward||{};reward.story=E.campaignDebrief?.(beforeCampaign,state,reward);const after=E.campaignView?.(state)?.active;if(after&&after.sitesDone>(beforeCampaign?.active?.sitesDone||0)){reward.campaignProgress=after.sitesDone+' / '+after.sitesRequired+' sinais do Coro';if(after.itemOwned&&!beforeCampaign?.active?.itemOwned)reward.storyItem=after.item;}openSheet('reward');}
    else if(fieldEnded&&action!=='expeditionAbort')openSheet('expedition-failed');
    else if(action==='campaignCross'){closeSheet();window.OrbitCampaignUI.playClip(root,()=>{save();render();},true);}
    else if(action==='campaignClaim'){campaignPage='mission';openSheet('campaign');}
    else if(action==='fabricate'||action==='campaignCraft'||action==='claimBeacon'){fabricatedParent=action==='claimBeacon'?'campaign':'fabricator';reward=result.reward;if(reward?.module){moduleOrigin=action==='fabricate'?'workshop':'fabricated';systemType=reward.module.type;selectedCandidateId=reward.module.id;sheetNotice='';openSheet('system-module');}else openSheet('fabricated');}
    else if(fieldAction&&!sheet){if(action==='expeditionScan')fieldScene?.effect('scan');$('og-field-cells').querySelector('button:not(:disabled):not([data-field-hint])')?.focus({preventScroll:true});}
    else if(!sheet&&action!=='paint'&&action!=='rename'&&action!=='explore')toast(result.message);
    if(action==='craftComponent')craftFeedback((state.components?.[payload.componentId]||0)-craftBefore,craftAnchor,result.message);
    if(action==='explore')$('og-field-cells').querySelector('button:not(:disabled):not([data-field-hint])')?.focus({preventScroll:true});
    if(action==='equip'&&wasGuided&&!state.guide?.active)toast('Treinamento concluído! Use Mapa para viajar, Nave para gerenciar peças e Missão para seguir o Coro.');
    return result;
  }
  function handleClick(event){
    if(event.target===$('og-sheet-backdrop')){dismissSheet();return;}
    const control=event.target.closest('button');if(!control||!root.contains(control)||control.disabled)return;
    if(control.dataset.campaignPage){campaignPage=control.dataset.campaignPage;sheetPage=0;sheetNotice='';renderSheet();return;}
    if(control.dataset.resourceStep){const ids=E.market(state).rows.map(g=>g.id),i=ids.indexOf(commerceView.resource);commerceView.resource=ids[(i+Number(control.dataset.resourceStep)+ids.length)%ids.length];commerceView.quantity=1;commerceView.side='buy';sheetPage=0;renderSheet();return;}
    if(control.dataset.tradeSide){commerceView.side=control.dataset.tradeSide;renderSheet();return;}
    if(control.dataset.tradeStep||control.dataset.tradeQuantity){commerceView.quantity=Math.max(1,Math.min(50,control.dataset.tradeQuantity?Number(control.dataset.tradeQuantity):commerceView.quantity+Number(control.dataset.tradeStep)));renderSheet();return;}
    if(control.dataset.catalogMaterial){catalogView.materialId=control.dataset.catalogMaterial;sheetPage=0;renderSheet();return;}
    if(control.dataset.catalogPage){catalogView={page:control.dataset.catalogPage,systemId:null};sheetPage=0;renderSheet();return;}
    if(control.dataset.catalogSystem){catalogView={page:'system',systemId:control.dataset.catalogSystem};sheetPage=0;renderSheet();return;}
    if(control.dataset.catalogPlanet){const planet=state.galaxy.planets.find(p=>p.id===control.dataset.catalogPlanet);if(!planet)return;closeSheet();selected=planet.id;selectedSystem=planet.systemId;mapLevel='system';tab=planet.id===state.location.planetId?'explore':'galaxy';render();save();return;}
    if(control.dataset.sheetPage){sheetPage+=Number(control.dataset.sheetPage);renderSheet();return;}
    if(control.dataset.xenoSheet){window.OrbitXenoUI?.select(control.dataset.xenoSpecimen,control.dataset.xenoRune);openSheet(control.dataset.xenoSheet);return;}
    if(window.OrbitWorkshop.handle(control,lab)){sheetPage=0;sheetNotice='';renderSheet();return;}
    if(control.dataset.fieldHint){toast(control.dataset.fieldHint);return;}
    if(control.dataset.expeditionX!==undefined){act('expeditionMove',{x:Number(control.dataset.expeditionX),y:Number(control.dataset.expeditionY)});return;}
    if(control.dataset.cargo){openCargo(control.dataset.cargo);return;}
    if(control.dataset.moduleFocus){focusModule(control.dataset.moduleFocus);return;}
    if(control.dataset.pickSite){environmentSite=control.dataset.pickSite;sheetPage=0;renderSheet();return;}
    if(control.dataset.tab){if(sheet)closeSheet();tab=control.dataset.tab;environmentSite=null;render();save();return;}
    if(control.dataset.mapLevel){if(sheet)closeSheet();tab='galaxy';mapLevel=control.dataset.mapLevel;environmentSite=null;render();save();$('og-map-levels').querySelector(`[data-map-level="${mapLevel}"]`)?.focus({preventScroll:true});return;}
    if(control.dataset.system){selectedSystem=control.dataset.system;selected=systemArrival(mapSystem()).id;render();save();$('og-map').querySelector(`[data-system="${selectedSystem}"]`)?.focus({preventScroll:true});return;}
    if(control.dataset.destination){selectedDestination=control.dataset.destination;render();save();$('og-map').querySelector(`[data-destination="${selectedDestination}"]`)?.focus({preventScroll:true});return;}
    if(control.dataset.select){selected=control.dataset.select;environmentSite=null;render();save();$('og-map').querySelector(`[data-select="${selected}"]`)?.focus({preventScroll:true});return;}
    if(control.dataset.inventory){inventoryTab=control.dataset.inventory;sheetNotice='';renderSheet();return;}
    if(control.dataset.maintenance){maintenanceAction=control.dataset.maintenance;sheetNotice='';renderSheet();return;}
    if(control.dataset.marketGroup){commerceView.marketGroup=control.dataset.marketGroup;sheetNotice='';renderSheet();return;}
    if(control.dataset.stockGroup){commerceView.stockGroup=control.dataset.stockGroup;sheetNotice='';renderSheet();return;}
    const action=control.dataset.action;if(!action)return;
    if(action==='journey'){openSheet('journey');return;}
    if(action==='campaign-route'){const lead=E.campaignLead(state);closeSheet();tab='galaxy';environmentSite=null;const planet=state.galaxy.planets.find(p=>p.id===lead.planetId);if(planet){selected=planet.id;selectedSystem=planet.systemId;mapLevel='system';}else mapLevel='universe';render();save();return;}
    if(action==='campaign'||action==='campaign-gate'||action==='campaign-relics'){campaignPage=action==='campaign-gate'?'gate':action==='campaign-relics'?'collection':'mission';openSheet('campaign');return;}
    if(action==='campaign-intro'||action==='campaign-ending'){closeSheet();window.OrbitCampaignUI.playClip(root,()=>{E.dispatch(state,'campaignIntro');save();render();},action==='campaign-ending');return;}
    if(action==='components-menu'){lab={page:'components',history:[{page:'home'}]};openSheet('fabricator');return;}
    if(action==='module-slide'){const type=control.dataset.type,cards=[state.equipped[type],...state.inventory.filter(m=>m.type===type)],i=cards.findIndex(m=>m.id===control.dataset.module)+Number(control.dataset.step),m=cards[i];if(m){systemType=type;selectedCandidateId=i?m.id:'';openSheet(i?'stored-module':'system-module');}return;}
    if(action==='card-page'){cardPage=Number(control.dataset.page);renderSheet();return;}
    if(action==='stored-module'){moduleOrigin='inventory';cardPage=0;selectedCandidateId=control.dataset.module;openSheet('stored-module');return;}
    if(action==='discard-review'){discardChoice={kind:control.dataset.kind,id:control.dataset.id};placeParents['discard-review']={label:sheet==='stock-components'?'Componentes':'Item',action:sheet};openSheet('discard-review');return;}
    if(action==='discardCargo'){act(action,{kind:control.dataset.kind,id:control.dataset.id,amount:Number(control.dataset.amount)});return;}
    if(action==='market-item'){commerceView.origin=sheet==='stock'?'stock':'market';commerceView.resource=control.dataset.resource;commerceView.quantity=1;commerceView.side='buy';openSheet('market-item');return;}
    if(action==='trade-confirm'){act('trade',{...commerceView,expectedTotal:Number(control.dataset.total)});return;}
    if(['station','market','stock','stock-components','maintenance'].includes(action)){openSheet(action);return;}
    if(action==='catalog'){catalogView={page:'systems',systemId:null};openSheet('catalog');return;}
    if(action==='nav-back'||action==='nav-forward'){stepNavigation(action==='nav-back'?-1:1);return;}
    if(action==='expedition-return'){openSheet('expedition-return-menu');return;}
    if(action==='confirm-field-action'){const pending=pendingFieldAction;pendingFieldAction=null;if(pending){closeSheet();act(pending.action,{...pending.payload,riskAccepted:true});}return;}
    if(action==='environment'||action==='site-details'){environmentSite=action==='site-details'?control.dataset.site:null;openSheet('environment');return;}
    if(action==='module-info'||action==='replace-module'){cardPage=0;openSystem(shipDetail.selectedModule);return;}
    if(action==='inspect-module'){openSystem(systemType,'');return;}
    if(action==='compare-module'){const candidate=state.inventory.find(m=>m.id===control.dataset.module);if(candidate){if(['reward','fabricated'].includes(sheet))moduleOrigin=sheet;openSystem(candidate.type,candidate.id);}return;}
    if(action==='salvage-review'){salvageModuleId=control.dataset.module;openSheet('salvage-review');return;}
    if(action==='system-lab'){lab={page:'type',type:control.dataset.type,history:[{page:'home'}]};openSheet('fabricator');return;}
    if(action==='fabricator'){lab={page:'home',history:[]};openSheet('fabricator');return;}
    if(action==='rescue-menu'&&!preview('rescue').allowed)return;
    if(['overdrive-menu','menu','help','xeno','xeno-tools','fleet','fleet-trader','planet-info','sites','modules','customize','workshop','status','warp-menu','rescue-menu','reset-menu','settings','saves','contracts','route-info','expedition-cargo','expedition-abort-menu'].includes(action)){openSheet(action);return;}
    if(action==='close-sheet'){dismissSheet();return;}
    if(action==='open-interior'){showShip('interior');return;}
    if(action==='ship-back'){shipBack();return;}
    if(action==='toggle-module'){shipDetail.expanded=!shipDetail.expanded;render();save();$('og-context').querySelector('[data-action="toggle-module"]').focus({preventScroll:true});return;}
    if(action==='camera'){scene.resetCamera();return;}
    if(action==='save-checkpoint'){save();sheetNotice=window.OrbitSaves.checkpoint()?'Ponto de recuperação guardado.':'Não foi possível guardar o ponto.';renderSheet();return;}
    if(action==='save-export'){save();window.OrbitSaves.download({state:E.snapshot(state),tab,selected,shipDetail,mapLevel,selectedSystem,selectedDestination});return;}
    if(action==='save-import'){if(window.OrbitFiles?.importGame)window.OrbitFiles.importGame();else $('og-save-file').click();return;}
    if(action==='save-restore'){pendingImport=window.OrbitSaves.previous();if(pendingImport)openSheet('save-review');return;}
    if(action==='save-accept'){if(pendingImport){save();window.OrbitSaves.checkpoint();if(applySnapshot(pendingImport)){pendingImport=null;history.past=[];history.future=[];closeSheet();save();render();toast('Jornada restaurada.');}}return;}
    if(action==='sound'){sound=!window.OrbitAudio.prefs.sound;window.OrbitAudio.set('sound',sound);beep('toggle');renderSheet();return;}
    if(action==='confirm-reset'){closeSheet();state=E.create();tab='explore';selected=state.location.planetId;shipDetail={mode:'exterior',selectedModule:null,expanded:false};mapLevel='system';selectedSystem=currentSystem().id;selectedDestination=null;environmentSite=null;reward=null;save();render();toast('Sua nova expedição está pronta.');window.OrbitCampaignUI?.playClip(root,()=>{E.dispatch(state,'campaignIntro');save();render();});return;}
    if(action==='fleetSwitch'){act(action,{shipId:control.dataset.ship});return;}
    // A bought ship goes straight to the hangar, reached as from the station (the merchant has left).
    if(action==='fleetBuy'){const id=control.dataset.ship;act(action,{shipId:id});if(state.fleet?.owned.includes(id)&&sheet==='fleet-trader'){const notice=sheetNotice;sheet='station';openSheet('fleet');sheetNotice=notice;renderSheet();}return;}
    if(['xenoCapture','xenoBuyTool','xenoStudy','xenoRune','runeEngrave','runeRemove'].includes(action)){act(action,{toolId:control.dataset.xenoTool,specimenId:control.dataset.xenoSpecimen,runeId:control.dataset.xenoRune,moduleId:control.dataset.xenoModule});return;}
    const payload={};if(control.dataset.intensive)payload.intensive=true;if(control.dataset.contract)payload.contractId=control.dataset.contract;if(control.dataset.trail)payload.trail=control.dataset.trail;if(control.dataset.payment)payload.payment=control.dataset.payment;if(control.dataset.planet)payload.planetId=control.dataset.planet;if(control.dataset.site)payload.siteId=control.dataset.site;if(control.dataset.module)payload.moduleId=control.dataset.module;if(control.dataset.color)payload.color=control.dataset.color;
    if(control.dataset.component){payload.componentId=control.dataset.component;payload.amount=Number(control.dataset.amount||1);payload.returnToRecipe=control.dataset.labReturn==='true';}
    if(control.dataset.recipe)payload.recipeId=control.dataset.recipe;if(control.dataset.warpDestination)payload.destinationId=control.dataset.warpDestination;
    if(control.dataset.index!==undefined)payload.index=Number(control.dataset.index);
    act(action,payload);
  }
  function receiveSave(text){try{pendingImport=window.OrbitSaves.decode(text);openSheet('save-review');}catch(error){sheetNotice=error.message;renderSheet();}}
  window.orbitReceiveSave=receiveSave;
  const onChangeBatched=e=>batchSheet(()=>onChange(e)),onClickBatched=e=>batchSheet(()=>onClick(e)),onSubmitBatched=e=>batchSheet(()=>onSubmit(e)),onKeyBatched=e=>batchSheet(()=>onKey(e));
  function onChange(event){if(event.target.hasAttribute('data-campaign-select')){campaignPage=event.target.value;sheetPage=0;renderSheet();return;}if(event.target.hasAttribute('data-help-topic')){window.OrbitHelp.topic=Number(event.target.value);renderSheet();return;}if(event.target.dataset.atlasSelect){catalogView[event.target.dataset.atlasSelect]=Number(event.target.value);renderSheet();return;}if(event.target.hasAttribute('data-atlas-source')){catalogView.sourceId=event.target.value;renderSheet();return;}if(event.target.dataset.preference){const k=event.target.dataset.preference;window.OrbitAudio.set(k,k==='light'?event.target.checked:Number(event.target.value)/100);syncExperience();return;}if(event.target.id==='og-save-file'){const file=event.target.files?.[0];if(file){if(file.size>2000000){sheetNotice='Arquivo grande demais.';renderSheet();return;}file.text().then(receiveSave).catch(()=>{sheetNotice='Não foi possível ler o arquivo.';renderSheet();});}return;}if(event.target.id==='og-module-choice')navigate(()=>{selectedCandidateId=event.target.value;sheetPage=0;sheetNotice='';renderSheet();afterSheet(()=>$('og-module-choice')?.focus({preventScroll:true}));});}
  function onClick(event){const control=event.target.closest('button');if(['nav-back','nav-forward'].includes(control?.dataset.action)||control?.dataset.sheetPage)handleClick(event);else navigate(()=>handleClick(event));}
  function onSubmit(event){if(event.target.id==='og-name-form'){event.preventDefault();act('rename',{name:$('og-name').value.trim()});}}
  function navigateBack(){
    // By design, Back is consumed during the introduction and the guided training (use the scene controls or Skip).
    if(window.OrbitXenoCinema?.isPlaying())return true;
    if(root.querySelector('.og-story-clip')||state.guide?.active)return true;
    if(sheet){stepNavigation();save();return true;}
    if(tab==='ship'){shipBack();return true;}
    if(tab!=='explore'&&!state.expedition){tab='explore';render();save();return true;}
    if(state.expedition&&tab!=='expedition'){tab='expedition';render();save();return true;}
    return false;
  }
  function onKey(event){
    if(window.OrbitXenoCinema?.isPlaying()){event.preventDefault();return;}
    if(event.key==='Escape'&&navigateBack()){event.preventDefault();return;}
    
    if(sheet&&event.key==='Tab'){const c=Array.from($('og-sheet-backdrop').querySelectorAll('button,input,select,summary')).filter(e=>!e.disabled&&e.getClientRects().length);if(event.shiftKey&&document.activeElement===c[0]){event.preventDefault();c[c.length-1].focus();}else if(!event.shiftKey&&document.activeElement===c[c.length-1]){event.preventDefault();c[0].focus();}return;}
    if(sheet||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
    // Held keys and browser shortcuts must not fire game actions; the guided training only accepts its highlighted target.
    if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||root.querySelector('.og-story-clip'))return;
    if(tab==='expedition'&&state.expedition&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(event.key)){
      event.preventDefault();const ex=E.expeditionView(state),delta=({ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]})[event.key],x=ex.position.x+delta[0],y=ex.position.y+delta[1];if(state.guide?.active&&!root.querySelector(`[data-expedition-x="${x}"][data-expedition-y="${y}"].og-guide-target`))return;act('expeditionMove',{x,y});return;
    }
    if(['1','2','3','4'].includes(event.key)&&!state.guide?.active){tab=['ship','explore','galaxy','expedition'][Number(event.key)-1];render();save();}
  }
  function onGlobals(event){const snapshot=event.detail?.globals?.widgetState;if(snapshot&&applySnapshot(snapshot)){if(sheet==='system-module'&&!labels[systemType]||sheet?.startsWith('expedition-')&&!state.expedition)closeSheet();render();}}
  root.addEventListener('change',onChangeBatched);root.addEventListener('click',onClickBatched);root.addEventListener('submit',onSubmitBatched);root.addEventListener('keydown',onKeyBatched);root.addEventListener('orbit-clip',syncExperience);document.addEventListener('visibilitychange',onHidden);window.addEventListener('pagehide',flushSave);window.addEventListener('openai:set_globals',onGlobals);
  window.orbitApp={back:navigateBack,getState:()=>state,getView:()=>({tab,selected,sheet,sheetPage,campaignPage,history:{back:history.past.length,forward:history.future.length},systemType,selectedCandidateId,lab:{...lab},catalogView:{...catalogView},cargoResource,mapLevel,selectedSystem,selectedDestination,environmentSite,shipDetail:{...shipDetail}}),getInspection:()=>scene.getInspection?.()||null,act,destroy(){tutorialCleanup?.();window.OrbitCampaignUI?.closeClip();resizeObserver.disconnect();scene.destroy();fieldScene?.destroy();clearTimeout(toastTimer);clearTimeout(effectTimer);clearTimeout(deltaTimer);root.removeEventListener('orbit-clip',syncExperience);flushSave();document.removeEventListener('visibilitychange',onHidden);window.removeEventListener('pagehide',flushSave);root.removeEventListener('change',onChangeBatched);root.removeEventListener('click',onClickBatched);root.removeEventListener('submit',onSubmitBatched);root.removeEventListener('keydown',onKeyBatched);window.removeEventListener('openai:set_globals',onGlobals);audioModule?.destroy();delete window.orbitReceiveSave;}};
  let lastSize='';
  const resizeObserver=new ResizeObserver(()=>{const size=root.clientWidth+'x'+root.clientHeight;if(size===lastSize)return;lastSize=size;fitStage();if(sheet)renderSheet();});resizeObserver.observe(root);
  if(window.OrbitCampaignUI){const menu=root.querySelector('.og-header [data-action="menu"]');if(window.OrbitXenoUI)menu.insertAdjacentHTML('beforebegin','<button class="og-round og-xeno-access" data-action="xeno" aria-label="Xenobiologia: caça aos exemplares únicos"><span class="og-xeno-access-art" aria-hidden="true"></span><i class="og-xeno-dot" aria-hidden="true"></i></button>');menu.insertAdjacentHTML('beforebegin','<button class="og-round og-campaign-access" data-action="campaign" aria-label="O Coro do Limiar: missão atual">✦</button>');}
  render();
  tutorialCleanup=window.OrbitTutorial?.mount(root,window.orbitApp);
  if(window.OrbitCampaignUI&&!E.campaignView(state).introSeen)window.OrbitCampaignUI.playClip(root,()=>{E.dispatch(state,'campaignIntro');save();render();});
})();
