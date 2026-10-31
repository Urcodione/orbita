(function(root){
'use strict';
const E=root.OrbitEngine;
E.campaignMilestones=function(s){const v=E.campaignView(s),a=v.active;if(!a)return [];return [
 {label:'Primeiro eco',done:a.sitesDone>0},
 {label:'Peça da transmissão',done:a.sitesDone>=Math.ceil(a.sitesRequired/2)},
 {label:'Descoberta única',done:a.itemOwned},
 {label:'Arquivo completo',done:a.ready},
 {label:'Receita recebida',done:a.claimed}
];};
E.extractionConsequence=function(s,reward={}){
 if(reward.milestoneComponent){const c=E.componentRecipes.find(c=>c.id===reward.milestoneComponent);return (c?.name||'Componente')+' recebido: uma peça a menos para fabricar na oficina.';}
 if(reward.module){const c=E.compareModule(s,reward.module.id);if(c.opens.length)return 'Ao instalar '+reward.module.name+': acesso a '+c.opens.slice(0,2).map(p=>p.name).join(' e ')+'.';const row=c.rows.find(r=>r.better==='up');if(row)return 'Ao instalar: '+row.label+' passa de '+row.before+' para '+row.after+' '+row.unit+'. Confira também as perdas no cartão.';return 'Nova alternativa de equipamento guardada. Compare suas especialidades no cartão.';}
 const a=E.campaignView(s).active,r=E.campaignRecipes.find(r=>r.id===a?.recipeId);if(r){const done=Object.entries(r.components).reduce((n,[id,q])=>n+Math.min(q,s.components[id]||0),0),total=Object.values(r.components).reduce((n,q)=>n+q,0);return 'Montagem de '+r.name+': '+done+'/'+total+' componentes a bordo. A carga desta saída fica disponível na oficina.';}
 return 'Carga armazenada para abastecer, fabricar ou negociar no entreposto.';
};
// Guidance is derived from real, saved progress. Reading it never advances a mission.
E.campaignLead=function(s){
 const v=E.campaignView(s),a=v.active;
 const base={completed:v.completed,chapter:Math.min(v.chapter,8),purpose:'Salvar a biosfera de Íris',planetId:null,siteId:null,action:'campaign',label:'Ver missão',progress:'Tecnologias '+v.completed+'/8'};
 if(v.finished)return {...base,title:'Íris voltou a respirar',detail:'A Aurora foi reencontrada. Complete suas coleções e descubra outros mundos.',progress:'Coro completo · 8/8'};
 if(!a)return {...base,title:v.atHome?'Prepare a travessia':'Volte ao Olho de Íris',detail:'Equipe as oito tecnologias para alcançar 100% de resistência dimensional. A Aurora espera do outro lado.',progress:'Resistência '+v.resistance+'%'};
 const recipe=E.campaignRecipes.find(r=>r.id===a.recipeId);
 base.progress=E.campaignMilestones(s).filter(m=>m.done).length+'/5 marcos · Núcleos '+Math.min(a.sitesDone,a.sitesRequired)+'/'+a.sitesRequired;
 base.unlock=recipe.name;
 if(a.claimed)return {...base,title:'Construa '+recipe.name,detail:'Nave → Oficina → Construir módulos. Essa tecnologia abre a próxima galáxia e acrescenta 12,5% de resistência quando instalada.',progress:'Receita decifrada',label:'Ver missão',action:'campaign',recipeId:a.recipeId};
 if(a.ready)return {...base,title:'Uma tecnologia foi decifrada',detail:'Os ecos se conectaram. Receba a receita de '+recipe.name+' para continuar a busca pela Aurora.',progress:'Capítulo pronto',label:'Receber receita',action:'campaignClaim'};
 if(!a.eligible)return {...base,title:'Siga a próxima frequência',detail:'A próxima voz do Coro está em outra galáxia. Prepare combustível de dobra e escolha uma rota.',label:'Ver rotas de dobra',action:'campaign-route'};
 const worlds=new Set(),systems=new Set();
 for(const id of s.campaign.sites){const p=s.galaxy.planets.find(p=>p.sites.some(t=>t.id===id));if(p){worlds.add(p.id);systems.add(p.systemId);}}
 let remaining=s.galaxy.planets.flatMap(p=>p.sites.filter(t=>!t.explored).map(t=>({p,t})));
 // Once enough cores are secured, additional repeats cannot satisfy the missing milestone.
 if(a.sitesDone>=a.sitesRequired){
  if(!a.itemOwned&&s.campaign.chapter!==5)remaining=remaining.filter(({t})=>t.id===a.targetSiteId);
  else if(systems.size<a.systemsRequired)remaining=remaining.filter(({p})=>!systems.has(p.systemId));
  else if(worlds.size<a.worldsRequired)remaining=remaining.filter(({p})=>!worlds.has(p.id));
 }
 // Assess already includes stellar heat/radiation. Evaluate each candidate only when needed.
 const assessments=new Map();
 const assessment=({p,t})=>{if(!assessments.has(t.id))assessments.set(t.id,E.assess(s,p.id,t.id));return assessments.get(t.id);};
 const findCandidate=predicate=>remaining.find(x=>(!predicate||predicate(x))&&assessment(x).allowed);
 let target=null,title='',detail='';
 if(!a.itemOwned&&s.campaign.chapter===5){
  const relic=v.stationRelic;
  return {...base,title:'Negocie o Escapamento Aural',detail:'Um único entreposto guarda a peça: '+(relic.systemName||'sistema indicado na missão')+'. Reúna '+relic.price+' Lumes; você tem '+s.resources.credits+'.',planetId:a.targetPlanetId,label:'Localizar entreposto',action:'campaign-route'};
 }
 if(!a.itemOwned)target=findCandidate(({t})=>t.id===a.targetSiteId);
 if(target){title='Encontre '+a.item.name;detail='O eco único está em '+target.p.name+'. Recupere o núcleo e extraia a carga para preservar a descoberta.';}
 else{
  target=findCandidate(({p})=>systems.size<a.systemsRequired&&!systems.has(p.systemId))||findCandidate(({p})=>worlds.size<a.worldsRequired&&!worlds.has(p.id))||findCandidate(({p})=>p.id===s.location.planetId)||findCandidate();
  if(!a.itemOwned){title='Decifre os ecos próximos';detail='O sinal único exige outra proteção. Recupere núcleos acessíveis para reunir recursos e preparar a nave para '+(a.targetName||'o mundo indicado')+'.';}
  else if(systems.size<a.systemsRequired){title='Escute outro sistema';detail='Precisamos comparar ecos de '+a.systemsRequired+' sistemas para distinguir a voz da Aurora. Você já confirmou '+systems.size+'.';}
  else if(worlds.size<a.worldsRequired){title='Investigue outro mundo';detail='A mesma frequência precisa aparecer em '+a.worldsRequired+' mundos. Você já confirmou '+worlds.size+'.';}
  else{title='Complete a transmissão';detail='Faltam '+Math.max(0,a.sitesRequired-a.sitesDone)+' núcleos extraídos para reconstruir a receita de '+recipe.name+'.';}
 }
 if(!target){target=remaining.find(({t})=>!a.itemOwned&&t.id===a.targetSiteId)||remaining.find(({p})=>!systems.has(p.systemId))||remaining.find(({p})=>!worlds.has(p.id))||remaining[0];if(target){title='Prepare a próxima expedição';const missing=assessment(target).missing;detail='Falta proteção: '+[...new Set(missing.map(r=>r.label))].join(', ')+'. Ajuste os módulos para investigar este sinal.';}}
 return {...base,title,detail:detail+(target?' Próximo sinal: '+target.p.name+'.':''),planetId:target?.p.id||a.targetPlanetId,siteId:target?.t.id||a.targetSiteId,label:target?'Localizar próximo sinal':'Ver proteção necessária',action:'campaign-route'};
};
E.campaignDebrief=function(before,s,reward){
 const v=E.campaignView(s),a=v.active,old=before?.active,lead=E.campaignLead(s);
 const consequence=E.extractionConsequence(s,reward)+(reward?.emergencyDamage?' Sobrecarga: 12 de dano no casco; repare na oficina.':'');
 if(!a||!old||a.id!==old.id)return {title:'Carga preservada',message:'A exploração abastece sua próxima viagem.',advanced:false,consequence};
 if(a.sitesDone<=old.sitesDone)return {title:'Suprimentos para a jornada',message:'A carga ajuda a manter a Andorinha. Para decifrar o Coro, recupere o núcleo do local e extraia: só visitar um mundo não confirma seu sinal.',advanced:false,consequence};
 let title='Um eco a mais',message='O núcleo trouxe outra parte da transmissão. Cada eco extraído aproxima a receita de '+lead.unlock+'.';
 if(a.sitesDone===1&&v.chapter===1){title='Não estamos sozinhos';message='Aurora: “O sinal chegou. As florestas de Íris ainda podem florescer. Cruzem os ecos de outros mundos; um único registro não revela o caminho.”';}
 else if(a.sitesDone===1){title='A próxima voz do Coro';message=a.story;}
 else if(a.systemsDone>old.systemsDone&&old.systemsDone>0){title:'A voz atravessa sistemas';message='Dois céus diferentes repetem a mesma assinatura. A Aurora existe: agora podemos separar sua voz do ruído das estrelas.';}
 else if(a.worldsDone>old.worldsDone){title:'Outro mundo respondeu';message='A frequência reapareceu longe do primeiro núcleo. Os registros pertencem à mesma rede viva que pode restaurar Íris.';}
 if(a.transmission&&!old.transmission){title:'Mensagem da Aurora';message=a.transmission;}
 if(a.itemOwned&&!old.itemOwned){title=a.item.name+' preservado';message=a.item.description+' Esta descoberta será usada em '+lead.unlock+', não vendida.';}
 if(a.ready&&!old.ready){title:'Transmissão reconstruída';message='Os ecos formaram a receita de '+lead.unlock+'. Receba a tecnologia: você abriu o próximo passo da busca pela Aurora.';}
 return {title,message,consequence,advanced:true,sites:a.sitesDone,required:a.sitesRequired,worlds:a.worldsDone,worldsRequired:a.worldsRequired,systems:a.systemsDone,systemsRequired:a.systemsRequired};
};
})(typeof window==='object'?window:globalThis);
