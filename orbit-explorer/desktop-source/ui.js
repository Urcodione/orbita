(function () {
  'use strict';
  const root = document.getElementById('orbit-game');
  if (!root || !window.OrbitEngine || !window.OrbitScene) return;
  if (window.orbitApp && window.orbitApp.destroy) window.orbitApp.destroy();
  const E = window.OrbitEngine;
  const storageKey = 'orbita-explorador-v1';
  const $ = id => root.querySelector('#' + id);
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const round = n => Math.round(Number(n) || 0);
  const power = n => Number(n).toFixed(2).replace('.', ',');
  const biomeNames = {forest:'Floresta viva',volcanic:'Mundo vulcânico',ice:'Mundo glacial',desert:'Deserto mineral',ocean:'Mundo oceânico',crystal:'Mundo cristalino'};
  const biomeDescriptions = {forest:'Um mundo de florestas densas e mares tranquilos. Estruturas antigas se escondem sob a copa das árvores.',volcanic:'Rios de magma atravessam a crosta. Minerais valiosos aguardam quem enfrentar o calor e a radiação.',ice:'Oceanos congelados guardam vestígios de outras expedições. O silêncio aqui é quase absoluto.',desert:'Tempestades varrem ruínas soterradas. Um bom kit de sobrevivência faz toda a diferença.',ocean:'Ilhas isoladas em um oceano sem fim. Sinais desconhecidos vêm de baixo da superfície.',crystal:'Formações luminosas cobrem o horizonte. Um lugar promissor para encontrar cristais de dobra.'};
  const codes = {engine:'EN',warp:'DB',life:'O₂',shield:'RD',scanner:'SC',arm:'BC',cargo:'AR',survival:'SV'};
  const labels = {engine:'Motor',warp:'Dobra',life:'Suporte de vida',shield:'Proteção',scanner:'Scanner',arm:'Braço coletor',cargo:'Armazém',survival:'Sobrevivência'};
  const paints = [{color:'#f0a270',name:'Laranja solar'},{color:'#71bdc4',name:'Azul aurora'},{color:'#c9b1df',name:'Lilás nebulosa'},{color:'#9bb68c',name:'Verde musgo'},{color:'#e7d8b5',name:'Areia lunar'}];
  let state = E.create();
  let tab = 'explore', selected = state.location.planetId, lastFound = null, soundEnabled = false;
  let saveStatus = 'Expedição pronta', effectTimer, audioContext, focusBeforeDialog;
  const scene = new window.OrbitScene($('og-canvas'));
  function recover(raw) {
    if (!raw) return null;
    try {
      if (E.restore) return E.restore(raw);
      return raw.version === 1 && raw.galaxy && Array.isArray(raw.galaxy.planets) && raw.resources && raw.equipped && raw.location ? raw : null;
    } catch (_) { return null; }
  }
  function applySnapshot(snapshot) {
    const inner = snapshot && (snapshot.privateContent || snapshot);
    const restored = inner && recover(inner.state);
    if (!restored) return false;
    state = restored;
    tab = ['explore','ship','galaxy','log'].includes(inner.tab) ? inner.tab : 'explore';
    selected = state.galaxy.planets.some(p => p.id === inner.selected) ? inner.selected : state.location.planetId;
    return true;
  }
  let loaded = false;
  if (window.openai && window.openai.widgetState) loaded = applySnapshot(window.openai.widgetState);
  if (!loaded) { try { loaded = applySnapshot(JSON.parse(localStorage.getItem(storageKey))); } catch (_) {} }
  if (loaded) saveStatus = 'Expedição restaurada';
  function persist() {
    const privateContent = {state,tab,selected};
    let stored = false;
    try { localStorage.setItem(storageKey, JSON.stringify(privateContent)); stored = true; saveStatus = 'Salvo neste navegador'; } catch (_) {}
    if (window.openai && typeof window.openai.setWidgetState === 'function') {
      const snapshot = {modelContent:{game:'Órbita',ship:state.ship.name,galaxy:state.galaxy.name,planet:currentPlanet().name,mission:state.mission.stage},privateContent};
      try {
        const pending = window.openai.setWidgetState(snapshot);
        if (pending && pending.catch) pending.catch(() => { if (!stored) { saveStatus = 'Sessão em andamento'; $('og-save-status').textContent = saveStatus; } });
        saveStatus = 'Salvo nesta conversa';
      } catch (_) { if (!stored) saveStatus = 'Sessão em andamento'; }
    } else if (!stored) saveStatus = 'Sessão em andamento';
    $('og-save-status').textContent = saveStatus;
  }
  function currentPlanet() { return state.galaxy.planets.find(p => p.id === state.location.planetId) || state.galaxy.planets[0]; }
  function chosenPlanet() { return state.galaxy.planets.find(p => p.id === selected) || currentPlanet(); }
  function rarity(module) { return E.rarities[module.rarity] || {name:module.rarity,color:'#c2c8ce'}; }
  function preview(action,payload) {
    try { return E.preview ? E.preview(state,action,payload) : {allowed:true,cost:{}}; }
    catch (_) { return {allowed:false,reason:'Ação indisponível',cost:{}}; }
  }
  const costNames = {fuel:'comb.',oxygen:'O₂',hull:'casco',warpFuel:'dobra',ore:'minério',crystals:'cristais',credits:'cr.'};
  function costText(cost) { return Object.entries(cost || {}).filter(([k,v]) => Number(v)>0 && costNames[k]).map(([k,v]) => `${round(v)} ${costNames[k]}`).join(' · '); }
  function actionButton(action,label,options) {
    const opt = options || {}, p = preview(action,opt.payload);
    const attr = opt.attrs || '';
    const cost = opt.cost === false ? '' : costText(p.cost);
    return `<button class="og-button ${opt.primary ? 'primary' : ''} ${opt.small ? 'small' : ''}" data-action="${action}" ${attr} ${p.allowed ? '' : 'disabled'} ${!p.allowed && p.reason ? `aria-label="${esc(label+'. '+p.reason)}" data-tooltip="${esc(p.reason)}"` : ''}>${esc(label)}${cost ? `<span class="og-cost">${esc(cost)}</span>` : ''}</button>`;
  }
  function fact(label,value) { return `<div class="og-fact"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`; }
  function resource(label,value,max,unit,index) {
    const pct = max ? Math.max(0,Math.min(100,value/max*100)) : 0;
    return `<div class="og-resource ${index<3 && pct<25 ? 'is-low' : ''}"><div class="og-resource-head"><span>${label}</span><strong>${round(value)}${max ? `<small> / ${round(max)}</small>` : ''}${unit ? `<small> ${unit}</small>` : ''}</strong></div><div class="og-meter" role="meter" aria-label="${label}" aria-valuenow="${round(value)}" aria-valuemin="0" aria-valuemax="${round(max || Math.max(1,value))}"><i style="--fill:${pct}%"></i></div></div>`;
  }
  function renderResources() {
    const r=state.resources,s=E.stats(state);
    $('og-resources').innerHTML = resource('Integridade',r.hull,s.maxHull,'',0)+resource('Oxigênio',r.oxygen,s.maxOxygen,'',1)+resource('Combustível',r.fuel,s.maxFuel,'',2)+resource('Dobra',r.warpFuel,s.maxWarpFuel,'',3)+resource('Armazém',s.cargoUsed,s.cargoCapacity,'',4);
    $('og-location').innerHTML=`<b>${esc(state.galaxy.name)}</b> / G${String(state.galaxyIndex+1).padStart(2,'0')}`;
    $('og-footer-stats').textContent=`${round(r.ore)} minério · ${round(r.crystals)} cristais · ${round(r.data)} dados`;
    $('og-save-status').textContent=saveStatus;
    const mission = E.missions && E.missions[state.mission.stage];
    $('og-mission').innerHTML=`<span class="og-mission-mark" aria-hidden="true">◇</span><strong>${esc(mission ? mission.title : 'Continue explorando a fronteira')}</strong><span class="og-mission-description">${esc(mission ? '— '+mission.description : 'Novos mundos. Novas possibilidades.')}</span><span class="og-mission-count">${state.mission.stage<5 ? `${state.mission.stage+1} / 5` : 'EXPEDIÇÃO LIVRE'}</span>`;
  }
  function renderScene() {
    const p=chosenPlanet(), local=p.id===state.location.planetId;
    const headings={explore:[`${state.galaxy.name} · ${biomeNames[p.biome] || p.biome}`,p.name,local ? (state.location.mode==='docked' ? 'Ancoragem estabelecida · <span>Expedição de superfície</span>' : 'Órbita estável · <span>Aguardando suas ordens</span>') : 'Destino selecionado · <span>Defina sua próxima rota</span>'],ship:['EXPLORADORA MODULAR · CLASSE PIONEIRA',state.ship.name,'Sua nave. <span>Sua próxima descoberta.</span>'],galaxy:['CARTA ESTELAR · GALÁXIA '+(state.galaxyIndex+1),state.galaxy.name,'Seis mundos ao alcance. <span>O que existe além?</span>'],log:['REGISTRO DE BORDO · EXPEDIÇÃO PESSOAL','Cada descoberta conta.','Uma história escrita <span>entre as estrelas.</span>']};
    const h=headings[tab];
    $('og-scene-heading').innerHTML=`<div class="og-eyebrow">${esc(h[0])}</div><h1>${esc(h[1])}</h1><p>${h[2]}</p>`;
    $('og-scene-status').innerHTML=`<span class="og-dot"></span>${tab==='ship' ? 'SISTEMAS ONLINE' : tab==='galaxy' ? 'CARTA ATUALIZADA' : state.location.mode==='docked' ? 'ANCORADA' : 'EM ÓRBITA'}`;
    $('og-ship-caption').innerHTML=`<strong>${esc(state.ship.name.toUpperCase())}</strong><small>${Object.keys(state.equipped).length} SISTEMAS EQUIPADOS</small>`;
    $('og-ship-caption').hidden = tab==='galaxy';
    $('og-scene-hint').textContent=tab==='galaxy' ? 'Selecione um mundo para traçar sua rota' : 'Arraste a nave para girar · Role para aproximar';
    const showMap = tab==='galaxy';
    $('og-map').hidden=!showMap;
    if(showMap) renderMap();
    scene.update({planet:p,shipColor:state.ship.color,modules:state.equipped,mode:state.location.mode,view:tab==='ship' ? 'ship' : tab==='galaxy' ? 'galaxy' : 'explore'});
  }
  function renderMap() {
    const positions=[[15,32],[40,14],[70,24],[87,60],[59,77],[26,80]];
    const line=positions.map(x=>x.join(',')).join(' ');
    $('og-map').innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${line} ${positions[0].join(',')}" fill="none" stroke="#4e687c" stroke-opacity=".45" stroke-width=".25" stroke-dasharray="1 2"/></svg>`+state.galaxy.planets.map((p,i)=>`<button class="og-map-node ${p.id===selected ? 'is-selected' : ''}" data-select="${esc(p.id)}" style="left:${positions[i][0]}%;top:${positions[i][1]}%" aria-pressed="${p.id===selected}"><span class="og-planet-orb" style="--planet-color:${p.color}" aria-hidden="true"></span><span>${esc(p.name)}</span><small>${p.id===state.location.planetId ? 'Você está aqui' : E.travelCost(state,p.id)+' combustível'}</small></button>`).join('');
  }
  function rewardPanel() {
    if(!lastFound || !state.inventory.some(m=>m.id===lastFound.id)) return '';
    const m=lastFound,r=rarity(m);
    return `<div class="og-toast-reward">MÓDULO RECUPERADO<b>${esc(m.name)}</b><span style="color:${r.color}">${esc(r.name)} · ${esc(labels[m.type])}</span>${actionButton('equip','Equipar descoberta',{small:true,payload:{moduleId:m.id},attrs:`data-module="${esc(m.id)}"`,cost:false})}</div>`;
  }
  function planetPanel() {
    const p=chosenPlanet(), here=p.id===state.location.planetId, docked=here && state.location.mode==='docked';
    let html=`${rewardPanel()}<div class="og-panel-title"><h2>${esc(p.name)}</h2><span class="og-pill ${!p.scanned ? 'orange' : ''}">${p.scanned ? 'ANALISADO' : 'NÃO ANALISADO'}</span></div><p class="og-description">${esc(biomeDescriptions[p.biome] || 'Um novo mundo à espera da sua expedição.')}</p><div class="og-facts">${fact('Bioma',biomeNames[p.biome] || p.biome)}${fact('Temperatura',p.scanned ? round(p.temperature)+' °C' : 'A analisar')}${fact('Atmosfera',p.scanned ? p.atmosphere : 'A analisar')}${fact('Radiação',p.scanned ? round(p.radiation)+' / 100' : 'A analisar')}${fact('Gravidade',p.scanned ? Number(p.gravity).toFixed(2)+' g' : 'A analisar')}</div><div class="og-anomaly"><b>${p.scanned ? 'ASSINATURA DETECTADA' : 'SINAL DESCONHECIDO'}</b>${esc(p.scanned ? p.anomaly : 'Analise o planeta para identificar riscos e pontos de interesse.')}</div>`;
    if(docked) {
      html+=`<div class="og-wide"><div class="og-eyebrow">Pontos de interesse</div>${p.sites.map(site=>`<div class="og-site"><div class="og-site-name">${esc(site.name)}<small>${site.explored ? 'Área explorada' : 'Recursos e tecnologia'}</small></div>${site.explored ? '<span class="og-pill">CONCLUÍDO</span>' : actionButton('explore','Explorar',{small:true,payload:{siteId:site.id},attrs:`data-site="${esc(site.id)}"`,cost:false})}</div>`).join('')}</div>`;
    }
    html+='<div class="og-actions">';
    if(!here) html+=actionButton('travel','Viajar até aqui',{primary:true,payload:{planetId:p.id},attrs:`data-planet="${esc(p.id)}"`});
    else if(docked) html+=actionButton('launch','Voltar à órbita',{primary:!p.sites.some(s=>!s.explored),cost:false});
    else {
      html+=actionButton('scan',p.scanned ? 'Análise concluída' : 'Analisar planeta',{primary:!p.scanned,cost:false});
      html+=actionButton('dock','Ancorar no planeta',{primary:p.scanned,cost:false});
    }
    const blocked = !here ? preview('travel',{planetId:p.id}) : docked ? preview('explore',{siteId:(p.sites.find(s=>!s.explored)||{}).id}) : preview(p.scanned ? 'dock' : 'scan');
    if(!blocked.allowed && blocked.reason && !(docked && p.sites.every(s=>s.explored))) html+=`<div class="og-action-note">${esc(blocked.reason)}</div>`;
    if(docked) { const unexplored=p.sites.find(s=>!s.explored); if(unexplored) html+=`<div class="og-action-note">Por expedição: ${esc(costText(preview('explore',{siteId:unexplored.id}).cost) || 'recursos de suporte de vida')}</div>`; }
    html+=`<button class="og-button secondary small" data-tab="ship">Abastecer e personalizar ↗</button></div>`;
    return html;
  }
  function shipPanel() {
    const s=E.stats(state);
    return `<div class="og-panel-title"><h2>Pronta para ir além.</h2><span class="og-pill">NAVE</span></div><div><label class="og-field-label" for="og-name">Nome da nave</label><form class="og-name-field" id="og-name-form"><input id="og-name" name="shipName" maxlength="24" value="${esc(state.ship.name)}" autocomplete="off" aria-label="Nome da nave"><button class="og-button small" type="submit">Salvar</button></form></div><div><span class="og-field-label">Pintura do casco</span><div class="og-paints">${paints.map(p=>`<button class="og-paint" data-action="paint" data-color="${p.color}" style="--paint:${p.color}" aria-label="${p.name}" aria-pressed="${state.ship.color===p.color}" data-tooltip="${p.name}"></button>`).join('')}</div></div><div class="og-facts og-wide">${fact('Economia de combustível',Math.round((1-1/(s.fuelEfficiency||1))*100)+'%')}${fact('Proteção radiológica',Math.round((s.radiationProtection||0)*100)+'%')}${fact('Bônus de coleta','+'+Math.round(((s.collectionBonus||1)-1)*100)+'%')}</div><hr class="og-divider"><div class="og-wide"><div class="og-eyebrow">Oficina de bordo</div><div class="og-supplies"><span>${round(state.resources.ore)} minério</span><span>${round(state.resources.crystals)} cristais</span></div><div class="og-service-grid">${serviceButton('refuel','Reabastecer')}${serviceButton('refillOxygen','Repor oxigênio')}${serviceButton('repair','Reparar casco')}${serviceButton('refine','Refinar dobra')}</div></div><div class="og-actions"><button class="og-button secondary small" data-action="rescue-dialog">Solicitar resgate</button><div class="og-action-note">Desmonte peças extras para recuperar minério.</div></div>`;
  }
  function serviceButton(action,name) { const p=preview(action);return `<button class="og-button" data-action="${action}" ${p.allowed ? '' : 'disabled'} aria-label="${esc(name+(!p.allowed && p.reason ? '. '+p.reason : ''))}"><span>${name}</span><small>${esc(p.allowed ? costText(p.cost) || 'Disponível' : p.reason || 'Indisponível')}</small></button>`; }
  function galaxyPanel() {
    const p=chosenPlanet();
    return `<div class="og-panel-title"><h2>Além da fronteira</h2><span class="og-pill">DOBRA</span></div><p class="og-description">Dobre o espaço para alcançar uma nova galáxia. Outros mundos, condições e peças esperam pela sua expedição.</p><div class="og-facts">${fact('Galáxia atual',state.galaxy.name)}${fact('Mundos analisados',state.galaxy.planets.filter(x=>x.scanned).length+' / 6')}${fact('Células disponíveis',state.resources.warpFuel)}${fact('Custo da dobra',E.warpCost(state)+' células')}</div><div class="og-anomaly"><b>COMBUSTÍVEL DE DOBRA</b>Colete cristais e refine células na oficina da nave. Um módulo de dobra melhor reduz o custo da viagem.</div><div class="og-actions">${actionButton('warp','Iniciar salto de dobra',{primary:true})}${!preview('warp').allowed ? `<div class="og-action-note">${esc(preview('warp').reason)}</div>` : ''}<button class="og-button secondary small" data-tab="ship">Abrir oficina da nave</button></div><hr class="og-divider"><div class="og-wide"><div class="og-eyebrow">Destino local selecionado</div><div style="margin:7px 0 12px;font-size:15px">${esc(p.name)}</div>${p.id===state.location.planetId ? '<button class="og-button small" data-tab="explore">Explorar este planeta</button>' : actionButton('travel','Viajar até aqui',{payload:{planetId:p.id},attrs:`data-planet="${esc(p.id)}"`})}</div>`;
  }
  function logPanel() {
    return `<div class="og-panel-title"><h2>Seu caminho no cosmos</h2></div><p class="og-description">Módulos encontrados, planetas analisados e rotas percorridas. Cada decisão transforma sua nave e sua expedição.</p><div class="og-log-stats og-wide"><div class="og-log-stat"><strong>${state.galaxyIndex+1}</strong><small>galáxias</small></div><div class="og-log-stat"><strong>${round(state.resources.data)}</strong><small>dados</small></div><div class="og-log-stat"><strong>${round(state.turn)}</strong><small>ações</small></div></div><div class="og-anomaly og-wide"><b>SUA NAVE</b>${esc(state.ship.name)}<br>${Object.keys(state.equipped).length} sistemas · ${state.inventory.length} módulos no armazém</div><div class="og-actions"><button class="og-button primary" data-tab="explore">Continuar explorando</button><button class="og-button secondary" data-action="help">Manual do explorador</button></div>`;
  }
  function moduleCard(m) {
    const r=rarity(m), current=state.equipped[m.type];
    const diff=current ? m.power-current.power : 0;
    return `<article class="og-module" style="--rarity:${r.color}"><div class="og-module-top"><span class="og-module-code">${codes[m.type]||'MD'}</span><span class="og-rarity">${esc(r.name.toUpperCase())}</span></div><h3>${esc(m.name)}</h3><span class="og-rarity">NÍVEL ${esc(m.level)} · POTÊNCIA ${power(m.power)}×${current ? ` (${diff>=0 ? '+' : ''}${power(diff)})` : ''}</span><p>${esc(m.description)}</p><div class="og-module-buttons">${actionButton('equip','Equipar',{small:true,payload:{moduleId:m.id},attrs:`data-module="${esc(m.id)}"`,cost:false})}${actionButton('salvage','Desmontar',{small:true,payload:{moduleId:m.id},attrs:`data-module="${esc(m.id)}"`,cost:false})}</div></article>`;
  }
  function renderLower() {
    const lower=$('og-lower');
    if(tab==='ship') {
      lower.innerHTML=`<div class="og-section-heading"><h2>Sistemas equipados</h2><span>8 ENCAIXES MODULARES</span></div><div class="og-equipment">${Object.values(state.equipped).map(m=>`<div class="og-equipped" style="--rarity:${rarity(m).color}" data-tooltip="${esc(m.description)}"><span class="og-equipped-code">${codes[m.type]}</span><div class="og-equipped-text"><strong>${esc(m.name)}</strong><small>${esc(rarity(m).name)} · ${power(m.power)}× potência</small></div></div>`).join('')}</div><div class="og-section-heading"><h2>Módulos no armazém</h2><span>${state.inventory.length} PEÇAS · TROQUE E EXPERIMENTE</span></div><div class="og-inventory">${state.inventory.length ? state.inventory.map(moduleCard).join('') : '<div class="og-inventory-empty">Explore pontos de interesse nos planetas para recuperar novas peças.</div>'}</div>`;
    } else if(tab==='log') {
      lower.innerHTML=`<div class="og-section-heading"><h2>Últimas transmissões</h2><span>REGISTRO DA EXPEDIÇÃO</span></div><div class="og-logbook">${state.log.map((l,i)=>`<div class="og-log-entry"><time>${String(l.id).padStart(3,'0')}</time><span>${esc(l.text)}</span></div>`).join('')}</div>`;
    } else {
      lower.innerHTML=`<div class="og-section-heading"><h2>${tab==='galaxy' ? 'Mundos desta galáxia' : 'Seu próximo horizonte'}</h2><span>ESCOLHA UM DESTINO</span></div><div class="og-destinations">${state.galaxy.planets.map(p=>`<button class="og-planet-card ${p.id===selected ? 'is-selected' : ''}" data-select="${esc(p.id)}" aria-pressed="${p.id===selected}" aria-label="Selecionar ${esc(p.name)}, ${biomeNames[p.biome]}, ${p.id===state.location.planetId ? 'local atual' : E.travelCost(state,p.id)+' combustível'}"><span class="og-planet-orb" style="--planet-color:${p.color}" aria-hidden="true"></span>${p.id===state.location.planetId ? '<span class="og-orbit-marker">VOCÊ</span>' : ''}<strong>${esc(p.name)}</strong><small>${esc(biomeNames[p.biome] || p.biome)}</small><small>${p.id===state.location.planetId ? (state.location.mode==='docked' ? 'Ancorada' : 'Em órbita') : `${E.travelCost(state,p.id)} combustível`} ${p.scanned ? '· ✓' : ''}</small></button>`).join('')}</div>`;
    }
  }
  function render() {
    if(!state.galaxy.planets.some(p=>p.id===selected)) selected=state.location.planetId;
    root.querySelectorAll('.og-tabs button').forEach(b=>{ const active=b.dataset.tab===tab;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active)); });
    root.dataset.view=tab;
    renderResources();renderScene();
    $('og-sidebar').innerHTML=tab==='ship' ? shipPanel() : tab==='galaxy' ? galaxyPanel() : tab==='log' ? logPanel() : planetPanel();
    renderLower();
  }
  function message(text,ok) { $('og-message').textContent=text;$('og-message').parentElement.classList.toggle('is-error',ok===false); }
  function playSound(kind) {
    if(!soundEnabled) return;
    try {
      audioContext=audioContext || new (window.AudioContext||window.webkitAudioContext)();
      audioContext.resume();
      const osc=audioContext.createOscillator(),gain=audioContext.createGain(),time=audioContext.currentTime;
      osc.type='sine';osc.frequency.setValueAtTime(kind==='warp' ? 90 : kind==='error' ? 160 : 500,time);osc.frequency.exponentialRampToValueAtTime(kind==='warp' ? 700 : kind==='error' ? 85 : 900,time+.3);
      gain.gain.setValueAtTime(0.0001,time);gain.gain.exponentialRampToValueAtTime(.055,time+.03);gain.gain.exponentialRampToValueAtTime(.0001,time+.35);osc.connect(gain);gain.connect(audioContext.destination);osc.start(time);osc.stop(time+.36);
    } catch (_) {}
  }
  function act(action,payload) {
    const oldInventory=new Set(state.inventory.map(m=>m.id));
    let result;
    try { result=E.dispatch(state,action,payload||{}); } catch(err) { message('Não foi possível concluir a ação. A expedição continua disponível.',false); console.error(err);return {ok:false,message:String(err)}; }
    message(result.message,result.ok);
    if(!result.ok) {playSound('error');return result;}
    if(['travel','warp','rescue'].includes(action)) {selected=state.location.planetId;tab='explore';lastFound=null;}
    if(action==='explore') lastFound=state.inventory.find(m=>!oldInventory.has(m.id)) || lastFound;
    if(['travel','warp','scan','dock','explore'].includes(action)) {
      scene.effect(action);root.dataset.effect=action;
      $('og-event-label').textContent=({travel:'Traçando nova rota',warp:'Dobra espacial',scan:'Analisando assinaturas',dock:'Ancoragem estabelecida',explore:'Expedição de superfície'})[action];
      clearTimeout(effectTimer);effectTimer=setTimeout(()=>{delete root.dataset.effect;},1100);
    }
    playSound(action);persist();render();
    return result;
  }
  function closeDialog() {
    $('og-dialog').hidden=true;$('og-dialog').innerHTML='';
    Array.from(root.children).forEach(el=>{el.inert=false;});
    if(focusBeforeDialog && focusBeforeDialog.isConnected) focusBeforeDialog.focus();
  }
  function dialog(title,body) {
    focusBeforeDialog=document.activeElement;
    const el=$('og-dialog');el.hidden=false;
    el.innerHTML=`<section class="og-dialog" role="dialog" aria-modal="true" aria-labelledby="og-dialog-title"><div class="og-dialog-head"><h2 id="og-dialog-title">${esc(title)}</h2><button data-action="close-dialog" aria-label="Fechar">×</button></div>${body}</section>`;
    Array.from(root.children).forEach(child=>{if(child!==el)child.inert=true;});
    el.querySelector('button').focus();
  }
  function help() {
    dialog('Seu primeiro salto começa aqui.',`<p>Você comanda uma exploradora modular. As decisões são por turno: nada consome recursos enquanto você pensa.</p><ol><li><b>Analise o planeta</b> para descobrir atmosfera, radiação e anomalias.</li><li><b>Ancore e explore</b> os três pontos de interesse. Cada expedição consome oxigênio; ambientes hostis também danificam o casco.</li><li><b>Equipe suas descobertas</b> em Minha nave. A peça anterior volta ao armazém, e a potência muda as capacidades reais da nave.</li><li><b>Abasteça na oficina.</b> Minério serve para combustível e reparos; cristais viram células de dobra. Oxigênio é gratuito quando ancorado em um planeta respirável; fora dele, custa créditos ou minério.</li><li><b>Viaje mais longe.</b> Saia do planeta para viajar. Na aba Galáxia, use células de dobra para gerar uma nova região.</li></ol><div class="og-rarity-legend">${Object.values(E.rarities).map(r=>`<span style="color:${r.color}">● ${esc(r.name)}</span>`).join('')}</div><p>Arraste para girar a nave; use a roda do mouse para aproximar. O progresso é salvo automaticamente quando o navegador permite. Se faltar recurso, a oficina oferece resgate.</p><button class="og-button primary" data-action="close-dialog">Vamos explorar</button><button class="og-button secondary small" data-action="reset-dialog">Começar uma nova expedição</button>`);
  }
  function onClick(event) {
    const button=event.target.closest('button,a');if(!button||!root.contains(button)||button.disabled)return;
    if(button.dataset.tab) {tab=button.dataset.tab;render();persist();return;}
    if(button.dataset.select) {selected=button.dataset.select;render();persist();return;}
    const action=button.dataset.action;if(!action)return;
    event.preventDefault();
    if(action==='home') {tab='explore';render();return;}
    if(action==='help') return help();
    if(action==='close-dialog') return closeDialog();
    if(action==='camera') {scene.resetCamera();return;}
    if(action==='sound') {soundEnabled=!soundEnabled;button.textContent=soundEnabled?'Som: on':'Som: off';button.setAttribute('aria-pressed',String(soundEnabled));button.setAttribute('aria-label',soundEnabled?'Desativar sons':'Ativar sons');playSound('toggle');return;}
    if(action==='rescue-dialog') {dialog('Voltar em segurança',`<p>O resgate restaura os recursos essenciais e devolve a nave à órbita. Parte do minério, dos cristais e dos créditos paga o serviço. Seus módulos são preservados.</p><button class="og-button primary" data-action="confirm-rescue">Confirmar resgate</button><button class="og-button secondary" data-action="close-dialog">Continuar por conta própria</button>`);return;}
    if(action==='confirm-rescue') {closeDialog();act('rescue');return;}
    if(action==='reset-dialog') {dialog('Uma nova fronteira',`<p>Isso substitui sua expedição salva por uma nova nave e novos mundos.</p><button class="og-button primary" data-action="confirm-reset">Confirmar nova expedição</button><button class="og-button secondary" data-action="close-dialog">Manter minha expedição</button>`);return;}
    if(action==='confirm-reset') {closeDialog();state=E.create();tab='explore';selected=state.location.planetId;lastFound=null;persist();render();message('Nova expedição iniciada. Seu primeiro planeta espera pela análise.');return;}
    const payload={};if(button.dataset.planet)payload.planetId=button.dataset.planet;if(button.dataset.site)payload.siteId=button.dataset.site;if(button.dataset.module)payload.moduleId=button.dataset.module;if(button.dataset.color)payload.color=button.dataset.color;
    act(action,payload);
  }
  function onSubmit(event) {if(event.target.id==='og-name-form'){event.preventDefault();act('rename',{name:$('og-name').value.trim()});}}
  function onKey(event) {
    if(event.key==='Escape'&&!$('og-dialog').hidden){closeDialog();return;}
    if(!$('og-dialog').hidden && event.key==='Tab') {
      const controls=Array.from($('og-dialog').querySelectorAll('button,input,a')).filter(e=>!e.disabled);
      if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls[controls.length-1].focus();}
      else if(!event.shiftKey&&document.activeElement===controls[controls.length-1]){event.preventDefault();controls[0].focus();}return;
    }
    if(/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)||!$('og-dialog').hidden)return;
    if(['1','2','3','4'].includes(event.key)){tab=['explore','ship','galaxy','log'][Number(event.key)-1];render();persist();}
  }
  function onGlobals(event) {const snapshot=event.detail&&event.detail.globals&&event.detail.globals.widgetState;if(snapshot&&applySnapshot(snapshot)){lastFound=null;render();}}
  root.addEventListener('click',onClick);root.addEventListener('submit',onSubmit);root.addEventListener('keydown',onKey);window.addEventListener('openai:set_globals',onGlobals);
  window.orbitApp={getState:()=>state,act,getView:()=>({tab,selected}),destroy(){scene.destroy();clearTimeout(effectTimer);root.removeEventListener('click',onClick);root.removeEventListener('submit',onSubmit);root.removeEventListener('keydown',onKey);window.removeEventListener('openai:set_globals',onGlobals);if(audioContext)audioContext.close();}};
  render();
  if(loaded)message('Bem-vindo de volta, comandante. Sua expedição está pronta para continuar.');
})();
