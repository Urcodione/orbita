(function(root){
'use strict';
// A re-run of the bundle replaces this module: stop the previous instance first so its context and timer do not leak.
root.OrbitAudio?.destroy?.();
const key='orbita-preferences-v1',defaults={sound:false,music:.45,effects:.6,ambience:.35,light:false};
let prefs={...defaults};try{const x=JSON.parse(localStorage.getItem(key));for(const k of Object.keys(defaults))if(typeof x?.[k]===typeof defaults[k])prefs[k]=typeof defaults[k]==='number'?Math.max(0,Math.min(1,x[k])):x[k];}catch{}
const themes={
 space:{name:'Entre as estrelas',root:45,scale:[0,3,7,10,14],tempo:3.8,wave:'sine'},
 ship:{name:'Coração da Andorinha',root:38,scale:[0,7,12,14,19],tempo:3.6,wave:'triangle'},
 station:{name:'Vozes do entreposto',root:48,scale:[0,4,7,11,14],tempo:2.8,wave:'triangle'},
 forest:{name:'Jardins suspensos',root:50,scale:[0,4,7,9,14],tempo:3.2,wave:'sine'},
 ocean:{name:'Memória das marés',root:41,scale:[0,5,7,10,14],tempo:4.2,wave:'sine'},
 ice:{name:'Vidro e silêncio',root:57,scale:[0,2,7,9,14],tempo:4,wave:'sine'},
 desert:{name:'Ecos das dunas',root:43,scale:[0,2,7,8,12],tempo:3.5,wave:'triangle'},
 volcanic:{name:'Sob a crosta',root:33,scale:[0,3,5,7,10],tempo:2.9,wave:'triangle'},
 magma:{name:'Forja profunda',root:31,scale:[0,1,5,7,12],tempo:2.7,wave:'triangle'},
 crystal:{name:'Catedral de prismas',root:55,scale:[0,4,7,11,14],tempo:3.4,wave:'sine'},
 gas:{name:'Correntes celestes',root:40,scale:[0,5,7,12,17],tempo:4.4,wave:'sine'},
 toxic:{name:'Jardim proibido',root:39,scale:[0,1,5,8,12],tempo:3.7,wave:'triangle'},
 rogue:{name:'A última luz',root:36,scale:[0,3,7,12,15],tempo:4.8,wave:'sine'}
};
let ctx,buses={},master,clock,engine,engineGain,wind,windGain,windFilter,theme='space',exploring=false,step=0,next=0,oldTheme='',visible=true,destroyed=false;
const midi=n=>440*Math.pow(2,(n-69)/12);
function apply(){if(!ctx)return;const t=ctx.currentTime;master.gain.setTargetAtTime(prefs.sound&&visible?.65:0,t,.15);for(const k of ['music','effects','ambience'])buses[k].gain.setTargetAtTime(prefs[k],t,.2);engineGain.gain.setTargetAtTime(theme==='ship'?.018:0,t,.5);if(windGain){const air={forest:[1200,.011],ocean:[260,.025],ice:[1600,.01],desert:[650,.02],volcanic:[120,.025],magma:[90,.028],gas:[450,.027],toxic:[850,.014],rogue:[1700,.005],station:[180,.008],ship:[350,.009]};const [freq,gain]=air[theme]||[500,0];windFilter.frequency.setTargetAtTime(freq,t,1.5);windGain.gain.setTargetAtTime(gain,t,1.5);}}
function note(freq,when,duration,volume,wave='sine',bus='music',end){
 if(!ctx||ctx.state!=='running')return;
 const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=wave;osc.frequency.setValueAtTime(freq,when);if(end)osc.frequency.exponentialRampToValueAtTime(end,when+duration*.8);gain.gain.setValueAtTime(.00001,when);gain.gain.exponentialRampToValueAtTime(Math.max(.00002,volume),when+Math.min(.25,duration*.2));gain.gain.exponentialRampToValueAtTime(.00001,when+duration);osc.connect(gain);gain.connect(buses[bus]);osc.start(when);osc.stop(when+duration+.03);osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
function schedule(){if(!ctx||ctx.state!=='running'||!prefs.sound||!visible)return;const def=themes[theme]||themes.space;if(oldTheme!==theme){oldTheme=theme;step=0;next=ctx.currentTime+.1;}
 if(next<ctx.currentTime-.5)next=ctx.currentTime+.1;
 if(next>ctx.currentTime+.25)return;
 const bar=Math.floor(step/4),shift=[0,5,3,7][Math.floor(bar/2)%4],base=def.root+shift,beat=def.tempo*(exploring?.72:1);
 if(step%4===0){[0,2,4].forEach((n,i)=>note(midi(base+def.scale[n]),next+i*.13,beat*4.6,.024,def.wave));note(midi(base-12),next,beat*3,.028,'sine','ambience');}
 const melody=[0,2,4,1,3,2,1,4,2,0,3,1][step%12];note(midi(base+12+def.scale[melody]),next,beat*1.5,.026,'sine');
 if(exploring){note(midi(base),next, .19,.032,'triangle','ambience');if(step%2===0)note(midi(base+7),next+beat*.5,.13,.016,'sine','ambience');}
 next+=beat;step++;
}
function startClock(){if(!clock&&ctx)clock=setInterval(schedule,120);}
function stopClock(){clearInterval(clock);clock=null;}
// The audio graph is only built once the player has turned sound on, and only from a real activation (click/keyup), so
// the default silent game never creates an AudioContext, a looping buffer or a 120 ms timer.
async function unlock(){if(destroyed||!prefs.sound)return;try{if(!ctx){const C=root.AudioContext||root.webkitAudioContext;if(!C)return;ctx=new C();master=ctx.createGain();const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-18;limiter.ratio.value=8;master.connect(limiter);limiter.connect(ctx.destination);for(const k of ['music','effects','ambience']){buses[k]=ctx.createGain();buses[k].connect(master);}engine=ctx.createOscillator();engine.type='sine';engine.frequency.value=48;engineGain=ctx.createGain();engineGain.gain.value=0;engine.connect(engineGain);engineGain.connect(buses.ambience);engine.start();const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),samples=buffer.getChannelData(0);let previous=0;for(let i=0;i<samples.length;i++){previous=(previous+(Math.random()*2-1)*.025)/1.025;samples[i]=previous*3;}wind=ctx.createBufferSource();wind.buffer=buffer;wind.loop=true;windFilter=ctx.createBiquadFilter();windFilter.type='bandpass';windFilter.Q.value=.7;windGain=ctx.createGain();windGain.gain.value=0;wind.connect(windFilter);windFilter.connect(windGain);windGain.connect(buses.ambience);wind.start();apply();}if(prefs.sound&&visible){await ctx.resume();startClock();}}catch{}}
function set(k,v){if(!(k in defaults))return;prefs[k]=typeof defaults[k]==='boolean'?!!v:Math.max(0,Math.min(1,Number(v)||0));try{localStorage.setItem(key,JSON.stringify(prefs));}catch{}if(prefs.sound)unlock();apply();if(!prefs.sound&&ctx){stopClock();ctx.suspend().catch(()=>{});}}
function update(state,view,sheet){exploring=!!state.expedition&&view==='expedition';theme=['station','market','market-item','contracts'].includes(sheet)?'station':view==='ship'?'ship':view==='galaxy'?'space':(themes[state.galaxy.planets.find(p=>p.id===state.location.planetId)?.biome]?state.galaxy.planets.find(p=>p.id===state.location.planetId).biome:'space');apply();}
function fx(action){if(!prefs.sound||!ctx||ctx.state!=='running')return;const t=ctx.currentTime+.01;
 const sounds={scan:[280,.8,1300],expeditionScan:[350,.5,1000],warp:[65,2,800],travel:[90,1,230],dock:[180,.5,75],launch:[65,1,320],equip:[550,.35,850],craftComponent:[660,.25,990],fabricate:[440,.7,880],expeditionCollect:[780,.18,1180],expeditionRecover:[440,.6,880],expeditionMove:[110,.08,75],error:[150,.24,90],contractDeliver:[520,.7,1040],paint:[640,.12,820],trail:[240,.25,600]};const [f,d,end]=sounds[action]||[520,.12,650];note(f,t,d,.09,'sine','effects',end);}
function visibility(){visible=!document.hidden;if(ctx){if(!visible){stopClock();ctx.suspend().catch(()=>{});}else if(prefs.sound){next=ctx.currentTime+.1;ctx.resume().then(startClock).catch(()=>{});}apply();}}
root.addEventListener('click',unlock,{passive:true});root.addEventListener('keydown',unlock);document.addEventListener('visibilitychange',visibility);
root.OrbitAudio={prefs,set,update,fx,theme:()=>themes[theme].name+(exploring?' · expedição':''),status:()=>({running:ctx?.state==='running',theme,exploring}),destroy(){if(destroyed)return;destroyed=true;stopClock();root.removeEventListener('click',unlock);root.removeEventListener('keydown',unlock);document.removeEventListener('visibilitychange',visibility);ctx?.close().catch(()=>{});}};
})(window);
