(function(root){
'use strict';
const E=root.OrbitEngine,base={create:E.create,restore:E.restore,snapshot:E.snapshot,dispatch:E.dispatch,preview:E.preview};
const regions=[
 {name:'Bosque de auroras',biome:'forest',temperature:22,radiation:8,pressure:1,toxicity:0,weather:8,medium:'solid',breathable:false},
 {name:'Geleira suspensa',biome:'ice',temperature:-90,radiation:12,pressure:1,toxicity:0,weather:48,medium:'solid',breathable:false},
 {name:'Forja do horizonte',biome:'volcanic',temperature:320,radiation:25,pressure:1,toxicity:0,weather:62,medium:'solid',breathable:false},
 {name:'Mar de nuvens',biome:'gas',temperature:15,radiation:20,pressure:12,toxicity:10,weather:68,medium:'gas',breathable:false}
];
function trainingWorld(s,galaxy=s.galaxy){if(s.guide?.v!==2||!s.guide.active)return;const p=galaxy.planets[0],old=p.sites;
 Object.assign(p,regions[0],{name:'Prisma',trainingPrisma:true,biomeName:'Mundo-escola · quatro horizontes',anomaly:'Uma esfera impossível: florestas, gelo, fogo e nuvens coexistem num campo de treinamento.',atmosphere:'Biosfera de treinamento · circuito fechado',color:'#bb98ef'});
 p.sites=regions.map((r,i)=>({id:'g0-p0-s'+i,name:r.name,difficulty:1,explored:old.find(t=>t.id==='g0-p0-s'+i)?.explored||false,environment:{...r,name:'Prisma',color:E.biomes[r.biome].color,biomeName:E.biomes[r.biome].name,atmosphere:E.biomes[r.biome].atmosphere}}));
}
E.restoreTrainingWorld=trainingWorld;
function graduate(s,skip=false){const old=s.guide,crafted=s.inventory.find(m=>m.id===old.crafted)||Object.values(s.equipped).find(m=>m.id===old.crafted),next=base.create(s.seed);next.guide={...old,active:false,completed:!skip};next.campaign.introSeen=true;
 if(!skip&&crafted){next.inventory.push({...crafted,id:'prisma-graduate',favorite:true});next.log.unshift({id:next.turn,text:'Prisma concluído. Seu Abrigo Zero Absoluto acompanha a Andorinha. A jornada real começa em Auralis.',kind:'success'});}
 for(const k of Object.keys(s))delete s[k];E.commit(s,next);
}
function trainingBlocked(s,a,p){const g=s.guide;if(g?.v!==2||!g.active)return '';
 // Evacuating is the way out when energy ran out (away from base, or at base without enough to collect a
 // sample): without it the only exit was skipping the whole training and its reward.
 if(a==='expeditionAbort'&&s.expedition&&(!E.expeditionReturnRoute(s)?.canReturn||s.expedition.reserve<3))return '';
 if(['stationDock','warp','travel','launch','salvage','expeditionSalvage','expeditionAbort','rescue'].includes(a))return 'Prisma é um treinamento separado. Conclua as regiões ou use Pular tutorial.';
 if(a==='explore'&&p?.siteId!=='g0-p0-s'+g.region)return 'Siga a região indicada no treinamento.';
 if(a==='expeditionExtract'&&g.region===0&&(!s.expedition?.coreRecovered||!s.expedition?.harvested.includes(25)||!s.expedition?.harvested.includes(10)))return 'Recupere minério, cristais e o módulo antes de voltar com a primeira carga.';
 if(a==='expeditionExtract'&&g.region>0&&!s.expedition?.harvested.length)return 'Recolha uma amostra desta região antes de extrair.';
 return '';
}

const fresh=()=>({v:2,active:true,started:false,extracted:false,moduleId:null,region:0,visited:[],installed:false,oxygenMade:false,fuelMade:false,crafted:null,loan:false,completed:false});
const valid=g=>g&&[1,2].includes(g.v)&&['active','started','extracted'].every(k=>typeof g[k]==='boolean')&&(g.moduleId===null||typeof g.moduleId==='string')&&(g.v===1||Number.isInteger(g.region)&&g.region>=0&&g.region<4&&Array.isArray(g.visited)&&g.visited.length<=4&&new Set(g.visited).size===g.visited.length&&g.visited.every(i=>Number.isInteger(i)&&i>=0&&i<4)&&['installed','oxygenMade','fuelMade','loan','completed'].every(k=>typeof g[k]==='boolean')&&(g.crafted===null||typeof g.crafted==='string'));
E.create=(...args)=>{const s=base.create(...args);s.guide=fresh();trainingWorld(s);return s;};
E.snapshot=s=>({...base.snapshot(s),guide:s.guide||{...fresh(),active:false}});
E.restore=s=>{const state=base.restore(s);if(!state)return null;const guide=state.guide;if(guide!==undefined&&!valid(guide))return null;state.guide=guide?{...guide}:{...fresh(),active:state.galaxyIndex===0&&!state.progress.scans&&!state.progress.explorations};trainingWorld(state);return state;};
function blocked(s,a,p){if(s.guide?.v===2)return trainingBlocked(s,a,p);if(!s.guide?.active)return '';if(['stationDock','warp','travel','launch','salvage','expeditionSalvage','expeditionAbort','rescue'].includes(a))return 'Conclua a primeira saída ou toque em Pular tutorial para explorar livremente.';if(a==='explore'&&p?.siteId&&p.siteId!=='g0-p0-s0')return 'O treinamento acontece no primeiro local deste mundo.';if(a==='expeditionExtract'&&(!s.expedition?.coreRecovered||!s.expedition?.pending.module||!s.expedition?.harvested.includes(25)||!s.expedition?.harvested.includes(10)))return 'Antes de extrair, recupere o módulo, o minério e os cristais indicados. Você pode pular o tutorial a qualquer momento.';return '';}
E.preview=(s,a,p)=>{if(['guideStart','guideSkip','guideRegion','guideLoan','guideFinish'].includes(a))return {allowed:!!s.guide?.active,reason:'',cost:{}};const reason=blocked(s,a,p);return reason?{allowed:false,reason,cost:{}}:base.preview(s,a,p);};
E.dispatch=(s,a,p={})=>{if(s.guide?.v===2&&s.guide.active){const g=s.guide;if(a==='guideSkip'||a==='guideFinish'){if(a==='guideFinish'&&(!g.crafted||g.visited.length!==4))return {ok:false,message:'Conclua as quatro regiões.'};graduate(s,a==='guideSkip');return {ok:true,message:a==='guideSkip'?'Treinamento encerrado. Bem-vindo a Auralis.':'Prisma concluído! Seu abrigo foi guardado na nave.',reward:{}};}if(a==='guideRegion'){if(s.expedition||!g.visited.includes(g.region)||g.region===3||!g.oxygenMade||!g.fuelMade||!g.crafted)return {ok:false,message:'Conclua a preparação antes de avançar.'};g.region++;g.loan=false;return {ok:true,message:'Novo horizonte de Prisma desbloqueado.',reward:{}};}if(a==='guideLoan'){if(g.region<2||g.loan)return {ok:false,message:'Nenhum empréstimo disponível.'};Object.assign(s.equipped.shield.capabilities||(s.equipped.shield.capabilities={}),{heat:450,radiation:150,pressure:65});if(g.region===3)Object.assign(s.equipped.arm.capabilities||(s.equipped.arm.capabilities={}),{gas:true,pressure:65});g.loan=true;return {ok:true,message:'Kit de simulação emprestado. Será devolvido ao sair de Prisma.',reward:{}};}}if(a==='guideStart'||a==='guideSkip'){if(!s.guide?.active)return {ok:false,message:'Orientação já encerrada.'};if(a==='guideStart')s.guide.started=true;else s.guide.active=false;return {ok:true,message:a==='guideSkip'?'Exploração livre. Consulte Como jogar quando precisar. A caçada começou: 16 seres únicos vivem nas galáxias; o ponto violeta no topo avisa quando um deles está no setor.':'Vamos conhecer o scanner orbital.',reward:{}};}const reason=blocked(s,a,p);if(reason)return {ok:false,message:reason};const result=base.dispatch(s,a,p);if(result.ok&&s.guide?.active){if(a==='expeditionExtract'){s.guide.extracted=true;if(result.reward.module)s.guide.moduleId=result.reward.module.id;if(s.guide.v===2&&!s.guide.visited.includes(s.guide.region)){s.guide.visited.push(s.guide.region);if(s.guide.region===0){s.resources.data+=24;s.resources.ore+=9;result.message+=' Kit didático: 24 pesquisa e 9 minério para a oficina.';}}}if(a==='equip'&&p.moduleId===s.guide.moduleId){if(s.guide.v===2)s.guide.installed=true;else s.guide.active=false;}if(s.guide.v===2){if(a==='refillOxygen')s.guide.oxygenMade=true;if(a==='refuel')s.guide.fuelMade=true;if(a==='fabricate'&&p.recipeId==='cryo-suit'){s.guide.crafted=result.reward.module.id;s.guide.moduleId=result.reward.module.id;s.guide.installed=false;}}}return result;};
let mounted=null;
function mount(container,app){
 if(mounted)mounted();let notice='',noticeTimer,selector='',last='',frame,tip=document.createElement('aside');tip.id='og-guide';tip.setAttribute('aria-live','polite');container.append(tip);
 const visible=sel=>[...container.querySelectorAll(sel)].find(e=>e.getClientRects().length&&!e.disabled&&!e.closest('[hidden], [inert]'));
 function prismaPlan(s,g,v,ex){
  const close=['Continue o treinamento','Feche o cartão para seguir a próxima etapa.','[data-action="close-sheet"]'];
  if(g.region===0&&g.installed){
   if(!g.oxygenMade||!g.fuelMade){const a=!g.oxygenMade?'refillOxygen':'refuel',oxygen=a==='refillOxygen';
    if(v.sheet==='maintenance'){if(!visible(`[data-action="${a}"]`))return ['Abastecimento de bordo','Escolha o serviço indicado. A receita mostra consumo, estoque e resultado.',`[data-maintenance="${a}"]`];return [oxygen?'Plantas viram oxigênio':'Minério vira combustível',oxygen?'A Samambaia-lume veio da coleta. Uma unidade produz até 12 O₂; em mundos respiráveis, a atmosfera também ajuda.':'3 minérios rendem até 12 de combustível. Cada viagem e descida consome reservas: veja quanto sobra antes de partir.',`[data-action="${a}"]`];}
    if(v.sheet==='workshop')return ['Manutenção','Aqui você produz oxigênio e combustível, repara o casco e refina células de dobra.','[data-action="maintenance"]'];
    if(v.sheet)return close;if(v.tab!=='ship')return ['Oficina de bordo','Vamos usar os recursos que você trouxe.','.og-tabs [data-tab="ship"]'];if(v.shipDetail.mode==='exterior')return ['Entre na nave','Toque na nave para abrir os compartimentos.','#og-canvas'];return ['Oficina de bordo','Oficina: manutenção repõe reservas; componentes viram módulos. Tudo ocupa espaço no depósito.','[data-action="workshop"]'];
   }
   if(!g.crafted){
    if(v.sheet==='fabricator'){
     if(visible('[data-lab-type="survival"]'))return ['Um módulo feito por você','O próximo local está a −90 °C. Entre em Sobrevivência para fabricar isolamento contra frio.','[data-lab-type="survival"]'];
     if(visible('.og-lab-recipe[data-lab-recipe="cryo-suit"]'))return ['Escolha pelo benefício','O Abrigo Zero Absoluto protege até −260 °C. Raridade sozinha não define o melhor equipamento.','.og-lab-recipe[data-lab-recipe="cryo-suit"]'];
     const missing=Object.entries(E.recipes.find(r=>r.id==='cryo-suit').components).find(([id,n])=>(s.components[id]||0)<n);
     if(missing){const [id,n]=missing;if(visible(`[data-action="craftComponent"][data-component="${id}"]`))return ['Fabricar componentes','As peças ocupam espaço e ficam no estoque. Monte o necessário para esta receita.',`[data-action="craftComponent"][data-component="${id}"]`];if(visible(`[data-lab-component="${id}"]:not([data-lab-switch])`))return ['Ingredientes da receita',`Precisamos de ${n} ${E.componentRecipes.find(c=>c.id===id).name}. Toque na peça para ver como fabricar.`,`[data-lab-component="${id}"]:not([data-lab-switch])`];}
     if(visible('[data-action="fabricate"]:not(:disabled)'))return ['Monte seu abrigo','Ingredientes completos. Fabricar guarda o módulo; só instalar ativa a proteção.','[data-action="fabricate"]'];
     return ['Volte à receita','Seu componente já está no estoque. Volte ao cartão do abrigo.','.og-place-exit'];
    }
    if(v.sheet==='workshop')return ['Construir módulos','O kit didático forneceu pesquisa e minério para esta primeira montagem.','[data-action="fabricator"]'];if(v.sheet)return close;return ['Volte à oficina','Agora vamos construir o equipamento que abre a região gelada.','[data-action="workshop"]'];
   }
   if(v.sheet)return close;
   return ['Primeira preparação concluída','Você já coletou, extraiu, abasteceu e montou um abrigo. Vamos testar o frio de Prisma.',null,'guideRegion','Rumo à geleira'];
  }
  if(g.region>0){
   if(g.visited.includes(g.region)){if(v.sheet)return close;return g.region===3?['Pronto para o desconhecido','Seu abrigo segue com você; kits de treino ficam em Prisma. Missão mostra a próxima meta; Catálogo registra sua jornada. Viaje aos entrepostos para comércio e alianças. Nos postos restaurados: Aural cultiva ar, Veyra lê mundos e Thar recupera peças. O sinal violeta indica vida única.',null,'guideFinish','Começar a jornada']:['Amostra a bordo','Carga no depósito; descobertas entram no Catálogo. Consulte energia e custo da volta antes de avançar. A próxima região exige outra proteção.',null,'guideRegion','Próxima região'];}
   if(!ex){if(v.sheet==='sites'){
     const id='g0-p0-s'+g.region;if(!visible(`[data-pick-site="${id}"][aria-pressed="true"]`))return ['Quatro climas, um mundo','Escolha '+regions[g.region].name+'. Cada região tem requisitos próprios.',`[data-pick-site="${id}"]`];
     if(g.region>=2&&!g.loan)return ['Proteção antes da descida','Observe o requisito em vermelho. Nesta demonstração, a escola empresta escudo térmico e sonda atmosférica. Na campanha, você terá de obter esses módulos.',null,'guideLoan','Receber kit de simulação'];
     return ['Leia antes de descer',g.region===1?'Seu abrigo atende ao frio. Confira a energia e a reserva para voltar.':'Kit temporário conectado. Em gigantes gasosos, você opera uma sonda: não existe chão para pousar.',`[data-action="explore"][data-site="${id}"]`];}
    if(v.sheet)return close;if(v.tab!=='explore')return ['Próxima região','Abra Explorar para selecionar outro horizonte de Prisma.','.og-tabs [data-tab="explore"]'];return ['Escolha a região','Abra os locais de Prisma.','[data-action="sites"]'];
   }
   if(v.tab!=='expedition')return ['Retome sua saída','Sua carga ainda está no veículo.','.og-tabs [data-tab="expedition"]'];
   if(v.sheet)return close;
   if(ex.harvested.length&&ex.turns<5)return ['O clima tem ritmo','Aguarde um turno: o aviso antecipa a tempestade. Em terreno hostil, a travessia pode consumir energia extra. Abrigo e rota curta fazem diferença.',null,'expeditionWait','Observar clima'];
   const target=ex.harvested.length?32:25,index=ex.y*6+ex.x;
   if(index===target)return [target===32?'Voltar com a descoberta':'Coleta e reserva',target===32?'Extraia para guardar a amostra e encerrar a saída.':'Recolher também usa energia. O painel separa energia total, custo da volta e folga.',`[data-action="${target===32?'expeditionExtract':'expeditionCollect'}"]`];
   const next=index===32?26:index===26?(target===25?25:32):26;
   return ['Energia para ir e voltar',`Região ${g.region+1}/4 · ${E.expeditionReturnRoute(s).reserve} energia para retornar agora. A tempestade não é só decoração.`,`[data-expedition-x="${next%6}"][data-expedition-y="${Math.floor(next/6)}"]`];
  }
  return null;
 }

 function plan(){const s=app.getState(),g=s.guide,v=app.getView(),ex=s.expedition;
  if(!g?.active||!s.campaign.introSeen||container.querySelector('.og-story-clip'))return null;
  if(g.v===2&&g.started&&(g.region>0||g.installed)){const step=prismaPlan(s,g,v,ex);if(step)return step;}
  if(!g.started&&g.v===2)return ['Prisma · quatro horizontes','Um mundo impossível, só para aprender: bosque, gelo, fogo e nuvens. Treine com recursos reais da simulação; ao sair, a campanha começa intacta.',null,'guideStart','Entrar em Prisma'];
  if(!g.started)return ['Bem-vindo à Andorinha',`Chegamos à órbita de ${E.currentPlanet(s).name}, um mundo seguro para testar a nave. Vamos analisar, pousar, coletar e instalar sua primeira peça.`,null,'guideStart','Aprender a pilotar'];
  if(g.extracted){
   if(v.sheet==='stored-module')return ['Conheça sua peça','O cartão mostra atributos e raridade. Toque em Encaixar para comparar com a peça instalada.', '[data-action="compare-module"]'];
   if(v.sheet==='reward')return ['Carga salva!','Minério, cristais e um módulo chegaram ao depósito. Continue; a instalação é feita pela tela de módulos.','.og-sheet-footer [data-action="close-sheet"]'];
   if(v.sheet==='system-module'||visible('[data-action="equip"]'))return ['Sua primeira melhoria','Compare os atributos e instale a peça. Ela substitui a atual, que volta ao estoque.','[data-action="equip"]'];
   if(v.sheet==='modules')return ['Peças recuperadas','Abra o cartão da peça encontrada na expedição.',`[data-module="${g.moduleId}"]`];
   if(v.tab!=='ship')return ['A bordo outra vez','A aba Nave reúne seus módulos e recursos. Abra-a para instalar a descoberta.','.og-tabs [data-tab="ship"]'];
   if(v.shipDetail.mode==='exterior')return ['Abra a nave','Toque na nave para acessar o depósito de módulos.','#og-canvas'];
   return ['Seu armazém','Abra as peças guardadas na nave para encontrar o módulo recuperado.','[data-action="modules"]'];
  }
  if(!E.currentPlanet(s).scanned)return ['1 · Scanner orbital','Você está em órbita, ainda não na superfície. Analisar revela locais e riscos antes de pousar.','[data-action="scan"]'];
  if(s.location.mode!=='docked'&&v.sheet!=='sites')return ['2 · Escolher destino','Veja os pontos descobertos e o custo de preparar o veículo.','[data-action="sites"]'];
  if(!ex){if(v.sheet==='sites')return ['3 · Primeira saída','Escolha o primeiro local. O kit de treinamento fornece 48 de energia e espaço para todas as descobertas.','[data-action="explore"][data-site="g0-p0-s0"]'];return ['3 · Preparar expedição','A nave está ancorada. Abra os locais descobertos para pilotar o veículo de superfície.','[data-action="sites"]'];}
  if(v.tab!=='expedition')return ['Volte ao veículo','Sua carga ainda está no terreno. Retome a expedição.','.og-tabs [data-tab="expedition"]'];
  if(v.sheet==='expedition-puzzle'){
   const puzzle=E.expeditionView(s).puzzle;
   if(puzzle.matched)return ['6 · Circuito alinhado','O padrão está correto. Recupere o módulo; ele só fica salvo quando você extrair na nave.','[data-action="expeditionRecover"]'];
   let best=null;for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){const d=puzzle.dials,t=puzzle.target;if((d[0]+a+c)%4===t[0]&&(d[1]+a+b)%4===t[1]&&(d[2]+b+c)%4===t[2]&&(!best||a+b+c<best.reduce((x,y)=>x+y,0)))best=[a,b,c];}
   const i=best.findIndex(n=>n>0);return ['6 · Decifrar o núcleo','Cada rotor gira também o seguinte. Toque no rotor destacado para aproximar o desenho do padrão de referência.',`[data-action="expeditionTune"][data-index="${i}"]`];
  }
  if(v.sheet)return ['Continue no terreno','Feche o painel para acompanhar a rota guiada.','[data-action="close-sheet"]'];
  let target,title,text;
  if(!ex.harvested.includes(25)){target=25;title='4 · Coletar minério';text='Siga os setores destacados. Cada movimento usa energia; os números no painel mostram sua reserva.';}
  else if(!ex.harvested.includes(10)){target=10;title='5 · Coletar cristais';text='Agora busque os cristais. Minério mantém a nave; cristais alimentam tecnologias e a dobra.';}
  else if(!ex.coreRecovered){target=3;title='6 · Encontrar um módulo';text='O sinal ao norte guarda uma peça. Leve o veículo até ele e abra o circuito.';}
  else {target=32;title='7 · Voltar com a carga';text='O que foi coletado ainda está no veículo. Volte ao ponto azul e extraia para guardar tudo na nave.';}
  const index=ex.y*6+ex.x;
  if(index===target)return [title,target===32?'Você chegou à nave. Extraia a carga para confirmar suas descobertas.':target===3?text:'Você está sobre o recurso. Toque em Recolher para colocá-lo no veículo.',`[data-action="${target===32?'expeditionExtract':target===3?'expeditionInteract':'expeditionCollect'}"]`];
  // Fixed safe training corridor; no hidden terrain is exposed outside this tutorial.
  const safe=new Set([32,26,20,14,8,2,3,25,21,22,7,9,10]);
  const queue=[[index]],seen=new Set([index]);let path;
  while(queue.length){const q=queue.shift(),i=q.at(-1);if(i===target){path=q;break;}for(const j of [i-6,i+6,i-1,i+1])if(safe.has(j)&&Math.abs(j%6-i%6)+Math.abs(Math.floor(j/6)-Math.floor(i/6))===1&&!seen.has(j)){seen.add(j);queue.push([...q,j]);}}
  const next=path?.[1];return [title,text,next!==undefined?`[data-expedition-x="${next%6}"][data-expedition-y="${Math.floor(next/6)}"]`:'[data-action="expeditionReturn"]'];
 }
 function feedback(event){notice=String(event.detail?.text||'');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{notice='';schedule();},4400);schedule();}
 container.addEventListener('orbit-guide-feedback',feedback);
 function draw(){frame=0;container.querySelectorAll('.og-guide-target').forEach(e=>e.classList.remove('og-guide-target'));const step=plan();if(!step){tip.hidden=true;selector='';delete container.dataset.training;return;}tip.hidden=false;tip.inert=false;const [title,text,target,action,label]=step;selector=target||'';container.dataset.training=app.getState().guide?.v===2&&app.getState().guide?.active?'prisma':'';const s=app.getState(),energy=s.expedition?` · Energia ${s.expedition.reserve}/${s.expedition.maxReserve}`:'';const markup=`${s.guide?.v===2?`<nav class="og-prisma-progress" aria-label="Regiões de Prisma">${regions.map((r,i)=>`<span data-biome="${r.biome}" class="${s.guide.visited.includes(i)?'done':i===s.guide.region?'current':''}" title="${r.name}">${['Bosque','Gelo','Fogo','Nuvens'][i]}</span>`).join('')}</nav>`:''}<div><strong>${title}</strong><button data-guide-skip>Pular tutorial</button></div><p>${text}</p>${notice?'<small class="og-guide-feedback" role="status"></small>':''}${action?`<button data-guide-start data-guide-command="${action}" class="og-guide-target">${label}</button>`:`<small>Toque no destaque${energy}</small>`}`;if(markup!==last){tip.innerHTML=markup;last=markup;}if(notice){const line=tip.querySelector('.og-guide-feedback');if(line)line.textContent=notice;}if(action)tip.querySelector('[data-guide-start]')?.classList.add('og-guide-target');let el=target&&visible(target);if(!el&&target){el=visible('[data-sheet-page="1"]:not(:disabled)');if(el)selector='[data-sheet-page="1"]';}el?.classList.add('og-guide-target');const bounds=el?.getBoundingClientRect(),origin=container.getBoundingClientRect();tip.dataset.position=bounds&&bounds.top-origin.top<tip.offsetHeight+12?'bottom':'top';}
 function schedule(){if(!frame)frame=requestAnimationFrame(draw);}
 function capture(e){if(tip.hidden)return;const b=e.target.closest('button');if(b?.hasAttribute('data-guide-skip')||b?.hasAttribute('data-guide-start')){e.preventDefault();e.stopImmediatePropagation();app.act(b.hasAttribute('data-guide-skip')?'guideSkip':b.dataset.guideCommand||'guideStart');schedule();return;}if(!selector||!(b?.matches(selector)||e.target.matches?.(selector))){e.preventDefault();e.stopImmediatePropagation();}schedule();}
 container.addEventListener('click',capture,true);
 const observer=new MutationObserver(records=>{if(records.some(r=>!tip.contains(r.target)))schedule();});observer.observe(container,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
 schedule();mounted=()=>{observer.disconnect();cancelAnimationFrame(frame);clearTimeout(noticeTimer);container.removeEventListener('orbit-guide-feedback',feedback);container.removeEventListener('click',capture,true);tip.remove();};return mounted;
}
root.OrbitTutorial={mount};
})(typeof window!=='undefined'?window:globalThis);
