(function(root){
'use strict';
const E=root.OrbitEngine;if(E.encounterView)return;
const base={preview:E.preview,dispatch:E.dispatch,validate:E.validate,restore:E.restore,safety:E.expeditionSafety};
const clone=x=>JSON.parse(JSON.stringify(x));
// Each sanctuary asks for an environmental decision, not another set of identical rotors.
const encounters=[
 {title:'O farol sob as dunas',type:'scanner',steps:[['A lente reflete três sóis. A gravação pede luz indireta para não apagar o eco.',['Projetar luz na areia','Iluminar a lente','Aquecer o vidro'],0],['A assinatura retorna em pares, com uma pausa entre eles.',['Pulso contínuo','Dois pulsos e silêncio','Três pulsos rápidos'],1],['O arquivo está sincronizado. A lente ainda está ligada ao pedestal.',['Puxar a lente','Cortar a alimentação','Isolar o pedestal antes de retirar'],2]]},
 {title:'O santuário da Véspera',type:'life',steps:[['As pétalas abrem na sombra; luz intensa as faz fechar.',['Reduzir iluminação','Aumentar iluminação','Acender ultravioleta'],0],['O solo respira por raízes expostas. A semente precisa viajar; a planta deve ficar.',['Retirar a planta inteira','Recolher só a semente solta','Cortar as raízes'],1],['A semente pulsa lentamente. A cápsula mostra umidade baixa.',['Secar a cápsula','Congelar a semente','Umidificar e ventilar'],2]]},
 {title:'O encontro com Náia',type:'arm',steps:[['Náia se afasta quando os propulsores agitam o recife.',['Desligar os propulsores','Acelerar a aproximação','Acender os faróis'],0],['Ela emite dois tons e espera uma resposta igual.',['Emitir três tons','Responder com dois tons','Usar a sirene'],1],['Náia se aproxima livremente. O vínculo precisa de contato, não de captura.',['Fechar a garra','Usar a rede','Abrir a palma do coletor'],2]]},
 {title:'O lago que guarda o tempo',type:'cargo',steps:[['A gota se desfaz quando a pressão da cápsula muda.',['Equalizar a pressão','Despressurizar','Aquecer a cápsula'],0],['O gelo protege a memória; a amostra não pode descongelar.',['Ativar aquecimento','Manter isolamento frio','Expor à luz'],1],['A leitura estabilizou. O espaço da gota deve permanecer fechado.',['Agitar o tanque','Misturar solvente','Selar sem transferência'],2]]},
 {title:'O olho da tempestade',type:'shield',steps:[['O Sopro só mantém coerência no intervalo entre as rajadas.',['Aguardar a calmaria','Coletar na rajada','Acelerar a turbina'],0],['A frequência da nuvem cai quando comprimida.',['Comprimir ao máximo','Coletar sem compressão','Aquecer a mistura'],1],['O gás reage ao metal descoberto. A câmara precisa de isolamento.',['Abrir a câmara','Misturar oxigênio','Ativar o campo de contenção'],2]]},
 null,
 {title:'A cidade sem sol',type:'survival',steps:[['O abrigo mantém uma luz acesa; o arquivo depende dessa mesma bateria.',['Desviar só energia excedente','Desligar o abrigo','Forçar descarga total'],0],['Os nomes gravados são um registro de moradores, não coordenadas.',['Apagar nomes duplicados','Preservar o registro inteiro','Substituir pelo mapa'],1],['O fóssil contém uma cópia viva. O original deve continuar no abrigo.',['Arrancar o original','Desmontar a cápsula','Criar uma cópia isolada'],2]]},
 {title:'A oitava voz',type:'warp',steps:[['Sete frequências já soam. Um oitavo canal permanece vazio.',['Sintonizar o canal vazio','Amplificar os sete','Silenciar tudo'],0],['A mensagem contém sua voz, mas a resposta chega antes da pergunta.',['Corrigir o atraso','Preservar a ordem recebida','Descartar a mensagem'],1],['O núcleo pede uma referência que você conhece: a assinatura de casa.',['Usar a estrela local','Escolher uma frequência aleatória','Transmitir a assinatura de Íris'],2]]}
];
function view(s){const a=E.campaignView(s).active,e=s.expedition;if(!e||!a?.eligible||a.itemOwned||e.siteId!==a.targetSiteId||!encounters[s.campaign.chapter])return null;const def=encounters[s.campaign.chapter],step=e.storyStep||0,entry=def.steps[step],offset=(e.seed+s.campaign.chapter+step*2)%3;
 return {title:def.title,type:def.type,step,total:def.steps.length,done:step===def.steps.length,item:a.item,clue:entry?.[0]||'O encontro está estabilizado. Preserve a descoberta e volte à nave.',options:entry?entry[1].map((_,i)=>({index:(i+offset)%3,label:entry[1][(i+offset)%3]})):[]};}
E.encounterView=view;
const fail=reason=>({allowed:false,reason,cost:{}});
function plan(s,action,p={}){
 const e=s.expedition;if(!e)return fail('Inicie uma expedição para operar o veículo.');
 if(action==='expeditionOverdrive'){
  if(e.overdriveUsed)return fail('A bateria de emergência desta saída já foi consumida.');
  if(s.guide?.active)return fail('Conclua ou pule a orientação antes de usar sobrecarga.');
  if(e.reserve>=e.maxReserve)return fail('A reserva já está cheia.');
  if(s.resources.hull<=12)return fail('Casco insuficiente: a descarga exige 12 e precisa deixar a nave íntegra.');
  return {allowed:true,reason:'',cost:{hull:12},energy:Math.min(6,e.maxReserve-e.reserve)};
 }
 const v=view(s),kind=E.expeditionCellKind(s);
 if(!v||kind!=='core'||!e.puzzle||e.coreRecovered||v.done)return fail('Alcance e abra o encontro único ainda não resolvido.');
 if(!Number.isInteger(p.index)||p.index<0||p.index>2)return fail('Escolha uma das três operações.');
 if(e.reserve<2||e.integrity<=1)return fail('Reserve 2 de energia e pelo menos 2 de integridade antes de tentar uma operação.');
 return {allowed:true,reason:'',cost:{},wrong:encounters[s.campaign.chapter].steps[v.step][2]!==p.index};
}
E.preview=(s,a,p)=>['expeditionEncounter','expeditionOverdrive'].includes(a)?plan(s,a,p):a==='expeditionRecover'&&view(s)&&!view(s).done?fail('Estabilize o encontro antes de preservar a descoberta.'):base.preview(s,a,p);
E.expeditionSafety=(s,a,p)=>{
 if(a!=='expeditionEncounter')return base.safety(s,a,p);
 const q=plan(s,a,p);if(!q.allowed)return null;const r=E.expeditionReturnRoute(s),remaining=s.expedition.reserve-2,margin=r.reserve===null?null:remaining-r.reserve;
 return {risky:margin===null||margin<3,costReserve:2,costIntegrity:1,afterReserve:remaining,returnReserve:r.reserve,returnMargin:margin,stranded:margin===null||margin<0,reason:'Uma operação incorreta consome 2 de energia e 1 de integridade. Isso pode comprometer a volta.'};
};
E.dispatch=(s,a,p)=>{
 if(a==='expeditionRecover'&&view(s)&&!view(s).done)return {ok:false,message:E.preview(s,a,p).reason};
 if(!['expeditionEncounter','expeditionOverdrive'].includes(a)){const discharged=s.expedition?.overdriveUsed,result=base.dispatch(s,a,p);if(result.ok&&discharged&&['expeditionExtract','expeditionAbort'].includes(a)){result.reward=result.reward||{};result.reward.emergencyDamage=12;result.message+=' A sobrecarga deixou 12 de dano no casco; repare na oficina.';}return result;}
 const q=plan(s,a,p);if(!q.allowed)return {ok:false,message:q.reason};const n=clone(s),e=n.expedition;let message;
 if(a==='expeditionOverdrive'){n.resources.hull-=12;e.reserve+=q.energy;e.overdriveUsed=true;message='Descarga de emergência: +'+q.energy+' energia; −12 de casco. O desgaste permanece após extrair ou evacuar.';}
 else if(q.wrong){e.reserve-=2;e.integrity-=1;message='A reação ficou instável: −2 energia e −1 integridade. Observe a pista antes de tentar outra operação.';}
 else {e.storyStep=(e.storyStep||0)+1;if(view(n).done)e.puzzle.dials=[...e.puzzle.target];message=view(n).done?'Encontro estabilizado. Preserve a descoberta e extraia a carga.':'A operação funcionou. O próximo sinal foi revelado.';}
 e.turns++;n.turn++;E.checkpointSite(n);if(!E.validate(n))return {ok:false,message:'Não foi possível preservar o estado da expedição.'};E.commit(s,n);return {ok:true,message,reward:{},cost:a==='expeditionOverdrive'?q.cost:q.wrong?{reserve:2,integrity:1}:{}};
};
E.validate=s=>base.validate(s)&&(!s.expedition||((s.expedition.overdriveUsed===undefined||typeof s.expedition.overdriveUsed==='boolean')&&(s.expedition.storyStep===undefined||Number.isInteger(s.expedition.storyStep)&&s.expedition.storyStep>=0&&s.expedition.storyStep<=3&&!!view(s))));
E.restore=saved=>{const s=base.restore(saved);return s&&E.validate(s)?s:null;};
})(typeof window==='object'?window:globalThis);
