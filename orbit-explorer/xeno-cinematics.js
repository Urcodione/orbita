(function(root){
'use strict';
// One exclusive, unskippable capture cinematic per unique exemplar: its own landscape, particles, motion, behaviour
// effect, narration and the capture tool closing on it. Drawn on a canvas over the painted art (no video).
const E=root.OrbitEngine;if(!E?.xenoCatalog)return;
const DURATION=7200,ACT=[700,3600],TOOL=[3600,5000],SEAL=[5000,5800];
// bg: landscape panel (2×4: forest, desert, ice, crystal, volcanic, toxic, ocean, gas).
const SCRIPTS={
 'raposa-aurora':{bg:0,sky:'#3a2a7a',particles:'aurora',motion:'dash',fx:'trail',lines:['As auroras dançam sobre o bosque luminoso…','…e a última raposa-aurora corre entre elas.']},
 'salamandra-brasa':{bg:4,sky:'#5a1a08',particles:'embers',motion:'lavaRun',fx:'haze',lines:['A lava estala sob patas que não queimam.','Ela some e reaparece entre as fissuras.']},
 'urso-geada':{bg:2,sky:'#173a6a',particles:'snow',motion:'emerge',fx:'icebreak',lines:['Uma bolha de ar trinca o gelo eterno.','O gigante desperta da hibernação.']},
 'mariposa-cristal':{bg:3,sky:'#2a1250',particles:'glints',motion:'flutter',fx:'refraction',lines:['A luz se parte em mil reflexos violeta.','Só quem procura enxerga as asas de vidro.']},
 'escaravelho-ferro':{bg:1,sky:'#6a3410',particles:'sand',motion:'burrow',fx:'dust',lines:['As dunas tremem por baixo.','Uma carapaça de ferro rompe a areia.']},
 'leviata-vidro':{bg:6,sky:'#062a44',particles:'bubbles',motion:'drift',fx:'song',lines:['No fundo, uma canção atravessa a água.','O leviatã acende os filamentos antes de atacar.']},
 'lesma-acida':{bg:5,sky:'#22320a',particles:'spores',motion:'crawl',fx:'cleanse',lines:['A névoa corrosiva cobre o pântano.','Por onde a lesma passa, o ar fica limpo.']},
 'arraia-tempestade':{bg:7,sky:'#3a2a50',particles:'wind',motion:'glide',fx:'storm',lines:['O furacão ruge entre ilhas de nuvens.','A arraia plana dentro dele sem bater as asas.']},
 'samambaia-mae':{bg:0,sky:'#0c3a2a',particles:'pollen',motion:'unfurl',fx:'spores',lines:['Toda samambaia-lume nasceu desta planta.','Ao toque, ela solta esporos ardentes.']},
 'orquidea-eterna':{bg:2,sky:'#a8d8ff',particles:'frost',motion:'bloom',fx:'frostring',lines:['Mil invernos e nenhuma pétala caída.','Fora do frio, morreria em segundos.']},
 'flor-vazio':{bg:3,sky:'#05040f',dark:.55,particles:'void',motion:'fold',fx:'lensing',lines:['Um mundo sem estrela. Uma flor sem sombra.','Suas pétalas dobram a própria luz.']},
 'lirio-solar':{bg:1,sky:'#ffb04f',particles:'light',motion:'radiate',fx:'sunburst',lines:['O dia inteiro guardado em pétalas.','À noite, o lírio devolve o sol.']},
 'cacto-magma':{bg:4,sky:'#3a0a04',particles:'embers',motion:'pulse',fx:'heartbeat',lines:['A rocha derretida sobe pelas raízes.','O cacto pulsa no ritmo do planeta.']},
 'alga-nebular':{bg:7,sky:'#5a4a7a',particles:'mist',motion:'float',fx:'tethers',lines:['Uma floresta inteira flutua entre as nuvens.','Nada a prende — até agora.']},
 'coral-cantor':{bg:6,sky:'#08304a',particles:'bubbles',motion:'reveal',fx:'sonar',lines:['O fundo do mar muda de cor e canta.','Cardumes seguem a voz do coral escondido.']},
 'trepadeira-prisma':{bg:3,sky:'#3a1060',particles:'glints',motion:'grow',fx:'thorns',lines:['Os cristais crescem onde ela se enrosca.','Seus espinhos guardam um veneno lento.']}
};
const TOOL_LINES={garra:'A garra de contenção se fecha.',rede:'A rede de plasma envolve o contorno.',casulo:'O casulo selado se fecha sobre a toxina.',laco:'O laço gravitacional ancora o voo.',crio:'A cápsula criogênica mantém o frio.',termico:'O coletor térmico isola o calor.'};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,phase=(ms,[a,b])=>clamp((ms-a)/(b-a),0,1);
function rng(seed){let s=seed>>>0||1;return()=>((s=Math.imul(s^s>>>15,2246822507)^Math.imul(s^s>>>13,3266489909))>>>0)/4294967296;}
// Creature motion during the act (t 0..1) in canvas-relative units; ends near centre for the capture.
const MOTIONS={
 dash:t=>({x:.12+.42*ease(t)+Math.sin(t*14)*.03,y:.66-Math.abs(Math.sin(t*9))*.05,s:1,r:Math.sin(t*14)*.08,flip:false}),
 lavaRun:t=>({x:t<.45?.2+t*.9:.62-(t-.45)*.2,y:.68-Math.abs(Math.sin(t*10))*.04,s:1,r:0,a:t>.38&&t<.52?.2:1}),
 emerge:t=>({x:.5,y:.95-.3*ease(Math.min(1,t*1.4)),s:.7+.5*ease(t),r:0}),
 flutter:t=>({x:.5+Math.sin(t*7)*.25,y:.45+Math.cos(t*11)*.1,s:.85,r:Math.sin(t*20)*.15,a:.25+.75*Math.abs(Math.sin(t*5))}),
 burrow:t=>({x:.5+Math.sin(t*3)*.08,y:.92-.26*ease(Math.min(1,t*1.6)),s:.9,r:Math.sin(t*12)*.05}),
 drift:t=>({x:.3+.4*t,y:.42+Math.sin(t*6)*.06,s:1.2,r:Math.sin(t*4)*.05}),
 crawl:t=>({x:.12+.45*t,y:.7,s:.8+Math.sin(t*16)*.03,r:0}),
 glide:t=>({x:.08+.47*ease(t),y:.35+Math.sin(t*5)*.12,s:1.1,r:-.2+Math.sin(t*5)*.25}),
 unfurl:t=>({x:.5,y:.66,s:.6+.5*ease(t),r:Math.sin(t*6)*.04}),
 bloom:t=>({x:.5,y:.64,s:.5+.6*ease(t),r:0}),
 fold:t=>({x:.5,y:.58,s:.9+Math.sin(t*8)*.08,r:t*1.2,a:.6+.4*Math.sin(t*10)}),
 radiate:t=>({x:.5,y:.64,s:.9+Math.sin(t*12)*.05,r:0}),
 pulse:t=>({x:.5,y:.66,s:1+Math.max(0,Math.sin(t*18))*.08,r:0}),
 float:t=>({x:.5+Math.sin(t*3)*.18,y:.4+Math.sin(t*5)*.05,s:1,r:Math.sin(t*3)*.1}),
 reveal:t=>({x:.5,y:.66,s:1,r:0,a:t<.3?.08:Math.min(1,(t-.3)*2)}),
 grow:t=>({x:.5,y:.66,s:.4+.7*ease(t),r:Math.sin(t*5)*.05})
};
function particles(kind,seed,n=46){const r=rng(seed);return Array.from({length:n},()=>({x:r(),y:r(),v:.2+r()*.8,s:r(),p:r()*Math.PI*2}));}
function drawParticles(c,w,h,kind,list,ms,still){
 const t=still?0:ms/1000;c.save();
 for(const q of list){let x=q.x*w,y=q.y*h,size=1+q.s*3,color='#fff',alpha=.8;
  switch(kind){
   case 'aurora':y=(q.y*.35)*h+Math.sin(t*1.2+q.p)*8;color=q.s>.5?'#7fffd4':'#c58cff';alpha=.35;size=3+q.s*6;break;
   case 'embers':y=((q.y-t*q.v*.25)%1+1)%1*h;x+=Math.sin(t*2+q.p)*6;color='#ffb04f';alpha=.85;break;
   case 'snow':y=((q.y+t*q.v*.12)%1)*h;x+=Math.sin(t+q.p)*10;color='#ffffff';break;
   case 'glints':alpha=.2+.8*Math.max(0,Math.sin(t*4+q.p));color=q.s>.5?'#e3c8ff':'#9ff3ff';break;
   case 'sand':x=((q.x+t*q.v*.3)%1)*w;color='#e0a868';alpha=.5;size=1+q.s*2;break;
   case 'bubbles':y=((q.y-t*q.v*.15)%1+1)%1*h;x+=Math.sin(t*1.5+q.p)*5;color='#c8f6ff';alpha=.45;break;
   case 'spores':case 'pollen':y=((q.y-t*q.v*.06)%1+1)%1*h;x+=Math.sin(t+q.p)*12;color=kind==='spores'?'#b5ff6b':'#eaffb0';alpha=.6;break;
   case 'wind':x=((q.x+t*q.v*.7)%1)*w;y=q.y*h*.8;c.globalAlpha=.35;c.strokeStyle='#ffffff';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x-30-q.s*40,y+6);c.stroke();continue;
   case 'frost':y=((q.y+t*q.v*.05)%1)*h;alpha=.4+.6*Math.max(0,Math.sin(t*3+q.p));color='#e9fbff';break;
   case 'void':{const k=((t*q.v*.2+q.s)%1);x=w/2+(q.x-.5)*w*(1-k);y=h*.58+(q.y-.5)*h*(1-k);color='#8a5cff';alpha=.6*(1-k);break;}
   case 'light':{const k=((t*q.v*.25+q.s)%1);x=w/2+Math.cos(q.p)*k*w*.6;y=h*.6+Math.sin(q.p)*k*h*.5;color='#ffe7a0';alpha=.8*(1-k);break;}
   case 'mist':x=((q.x+t*q.v*.03)%1)*w;color='#f4e8ff';alpha=.12;size=18+q.s*30;break;
  }
  c.globalAlpha=alpha;c.fillStyle=color;c.beginPath();c.arc(x,y,size,0,Math.PI*2);c.fill();
 }
 c.restore();
}
function drawFx(c,w,h,fx,t,pos,size,still){
 const x=pos.x*w,y=pos.y*h;c.save();
 const ring=(r,color,width,alpha)=>{c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();};
 const glow=(r,color,alpha)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=alpha;c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);};
 switch(fx){
  case 'trail':for(let i=1;i<5;i++){c.globalAlpha=.12*(5-i);c.fillStyle='#b07bff';c.beginPath();c.ellipse(x-i*22,y+6,size*.25,size*.08,0,0,Math.PI*2);c.fill();}break;
  case 'haze':glow(size*.9,'rgba(255,120,40,.55)',.6+.3*Math.sin(t*20));break;
  case 'icebreak':if(t<.5){ring(size*.5*(1+t),'#e9fbff',3,1-t*1.5);}c.globalAlpha=.6;c.strokeStyle='#bfefff';c.lineWidth=2;for(let i=0;i<6;i++){const a=i/6*Math.PI*2;c.beginPath();c.moveTo(x,y+size*.3);c.lineTo(x+Math.cos(a)*size*.7*t,y+size*.3+Math.sin(a)*size*.25*t);c.stroke();}break;
  case 'refraction':for(let i=0;i<7;i++){c.globalAlpha=.25*Math.abs(Math.sin(t*6+i));c.fillStyle=['#ff9ad5','#b07bff','#7ff7ee','#ffe08a'][i%4];c.beginPath();const a=i/7*Math.PI*2+t*2;c.moveTo(x,y);c.lineTo(x+Math.cos(a)*size*.8,y+Math.sin(a)*size*.8);c.lineTo(x+Math.cos(a+.25)*size*.8,y+Math.sin(a+.25)*size*.8);c.fill();}break;
  case 'dust':for(let i=0;i<8;i++){c.globalAlpha=.3*(1-t);c.fillStyle='#c48a52';c.beginPath();c.arc(x+(i-4)*size*.12,y+size*.35-t*size*.2*(i%3),size*.12*(1+t),0,Math.PI*2);c.fill();}break;
  case 'song':for(let i=0;i<3;i++){const k=((t*2+i/3)%1);ring(size*(.3+k*.9),'#7ff7ee',2,(1-k)*.7);}break;
  case 'cleanse':{const g=c.createLinearGradient(0,y,x,y);g.addColorStop(0,'rgba(200,255,220,0)');g.addColorStop(1,'rgba(200,255,220,.55)');c.globalAlpha=1;c.fillStyle=g;c.fillRect(0,y+size*.15,x,size*.12);break;}
  case 'storm':c.globalAlpha=.35;c.strokeStyle='#ffffff';c.lineWidth=2;for(let i=0;i<4;i++){c.beginPath();c.arc(w*.7,h*.3,40+i*28,t*4+i,t*4+i+2.2);c.stroke();}break;
  case 'spores':for(let i=0;i<14;i++){const a=i/14*Math.PI*2,k=(t*1.5+i*.07)%1;c.globalAlpha=.8*(1-k);c.fillStyle='#d4ff7a';c.beginPath();c.arc(x+Math.cos(a)*size*k,y-size*.2+Math.sin(a)*size*k*.7,3,0,Math.PI*2);c.fill();}break;
  case 'frostring':ring(size*(.3+t*.8),'#ffffff',3,.8*(1-t));glow(size*.7,'rgba(180,235,255,.6)',.6);break;
  case 'lensing':glow(size*.9,'rgba(20,0,40,.9)',.8);ring(size*.55,'#b07bff',2.5,.7+.3*Math.sin(t*10));break;
  case 'sunburst':c.globalAlpha=.45;c.fillStyle='#ffe08a';for(let i=0;i<12;i++){const a=i/12*Math.PI*2+t;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*size*1.4,y+Math.sin(a)*size*1.4);c.lineTo(x+Math.cos(a+.1)*size*1.4,y+Math.sin(a+.1)*size*1.4);c.fill();}break;
  case 'heartbeat':glow(size*(.8+.3*Math.max(0,Math.sin(t*18))),'rgba(255,90,40,.7)',.75);break;
  case 'tethers':c.globalAlpha=.4;c.strokeStyle='#f4e8ff';c.lineWidth=1.2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x+(i-2)*size*.15,y+size*.3);c.quadraticCurveTo(x+(i-2)*size*.3,y+size*.8,x+(i-2)*size*.2+Math.sin(t*4+i)*10,h);c.stroke();}break;
  case 'sonar':for(let i=0;i<4;i++){const k=((t*1.6+i/4)%1);ring(size*(.2+k*1.2),'#ff9ad5',2,(1-k)*.6);}break;
  case 'thorns':c.globalAlpha=.7;c.strokeStyle='#d9a6ff';c.lineWidth=2;for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const r1=size*.45,r2=size*(.45+.2*t);c.beginPath();c.moveTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);c.lineTo(x+Math.cos(a)*r2,y+Math.sin(a)*r2);c.stroke();}break;
 }
 c.restore();
}
// Tool action, t 0..1, specific to each capture tool.
function drawTool(c,w,h,tool,t,pos,size){
 const x=pos.x*w,y=pos.y*h,img=root.OrbitXenoTools?.image(tool),s=size*.9;c.save();
 const place=(px,py,scale,rot=0,alpha=1)=>{if(!img||img.complete===false)return;c.globalAlpha=alpha;c.translate(px,py);c.rotate(rot);c.drawImage(img,-s*scale/2,-s*scale/2,s*scale,s*scale);c.setTransform(1,0,0,1,0,0);};
 if(tool==='garra'){place(x+s*.2,y-h*.55*(1-ease(t))-s*.1,1,-.5+.5*t);}
 else if(tool==='rede'){c.globalAlpha=.8;c.strokeStyle='#7ff7ee';c.lineWidth=1.5;const r=s*(1.6-1.1*ease(t));for(let i=0;i<8;i++){const a=i/8*Math.PI;c.beginPath();c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);c.lineTo(x-Math.cos(a)*r,y-Math.sin(a)*r);c.stroke();}c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();place(x,y+s*.75,.5,0,1-t);}
 else if(tool==='casulo'){c.globalAlpha=.35*ease(t);c.fillStyle='#cfeff0';c.beginPath();c.ellipse(x,y,s*.75,s*.9*ease(t),0,0,Math.PI*2);c.fill();c.globalAlpha=.9*ease(t);c.strokeStyle='#e9fffb';c.lineWidth=2;c.stroke();place(x+s*.9,y-s*.6,.45);}
 else if(tool==='laco'){c.globalAlpha=.9;c.strokeStyle='#b07bff';c.lineWidth=5;c.shadowColor='#a46cff';c.shadowBlur=12;c.beginPath();c.ellipse(x,y,s*(1.4-.8*ease(t)),s*.35,t*6,0,Math.PI*2);c.stroke();c.shadowBlur=0;place(x-s*1.1,y+s*.8,.55,-.3);}
 else if(tool==='crio'){for(let i=0;i<10;i++){const a=i/10*Math.PI*2,k=1-ease(t);c.globalAlpha=.8;c.fillStyle='#e9fbff';c.beginPath();c.arc(x+Math.cos(a)*s*1.4*k,y+Math.sin(a)*s*1.4*k,3,0,Math.PI*2);c.fill();}place(x,y+s*.95,.6,0,t);}
 else if(tool==='termico'){place(x,y-s*(1.2-1.05*ease(t)),1.15,Math.PI);}
 c.restore();
}
function tinted(spec){
 const im=root.OrbitArt?.images.biology,painted=root.OrbitArt?.images.xenoSpecimens&&root.OrbitIllustrations?.xenoSpecimens;
 const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');
 if(painted&&root.OrbitArt.ready('xenoSpecimens')){const p=root.OrbitArt.images.xenoSpecimens,i=E.xenoCatalog.SPECIMENS.findIndex(x=>x.id===spec.id);g.drawImage(p,(i%4)*p.width/4,Math.floor(i/4)*p.height/4,p.width/4,p.height/4,0,0,256,256);cv.painted=true;return cv;}
 if(!im||!root.OrbitArt.ready('biology'))return null;
 const [index,hue]=spec.art;g.filter=`hue-rotate(${hue}deg)`;g.drawImage(im,(index%2)*im.width/2,Math.floor(index/2)*im.height/3,im.width/2,im.height/3,0,0,256,256);return cv;
}
let playing=null;
function play(container,id,onDone){
 const spec=E.xenoCatalog.SPECIMENS.find(s=>s.id===id),script=SCRIPTS[id];if(!spec||!script){onDone?.();return;}
 stop();
 const tool=E.xenoCatalog.BEHAVIORS[spec.behavior].tool,still=root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const el=document.createElement('section');el.className='og-xeno-cine';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Captura de '+spec.name);
 el.innerHTML='<canvas></canvas><div class="og-xeno-cine-caption" aria-live="polite"></div><div class="og-xeno-cine-title"><small>Exemplar único contido</small><strong></strong><span></span></div>';
 container.append(el);
 const canvas=el.querySelector('canvas'),c=canvas.getContext('2d'),caption=el.querySelector('.og-xeno-cine-caption'),title=el.querySelector('.og-xeno-cine-title');
 title.querySelector('strong').textContent=spec.name;title.querySelector('span').textContent=spec.rune?.name?'Estude-o para revelar a '+spec.rune.name+'.':'';
 const rect=container.getBoundingClientRect(),dpr=Math.min(2,root.devicePixelRatio||1),w=rect.width,h=rect.height;
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);c.setTransform(dpr,0,0,dpr,0,0);
 const land=root.OrbitArt?.images.landscapes,list=particles(script.particles,spec.id.length*97+spec.tier);
 // The painted exemplar replaces the stand-in as soon as its atlas finishes loading (it is read lazily).
 let sprite=tinted(spec);
 const start=performance.now();let lastLine='';
 function frame(now){
  if(playing?.el!==el)return;
  if(!sprite||!sprite.painted&&root.OrbitIllustrations?.xenoSpecimens&&root.OrbitArt?.ready('xenoSpecimens'))sprite=tinted(spec);
  const ms=Math.min(DURATION,now-start),act=phase(ms,ACT),tp=phase(ms,TOOL),seal=phase(ms,SEAL),intro=phase(ms,[0,700]);
  c.setTransform(dpr,0,0,dpr,0,0);c.globalAlpha=1;c.fillStyle=script.sky;c.fillRect(0,0,w,h);
  if(land&&root.OrbitArt.ready('landscapes')){const pw=land.width/2,ph=land.height/4,sx=(script.bg%2)*pw,sy=Math.floor(script.bg/2)*ph,scale=Math.max(w/pw,h/ph)*1.15,dw=pw*scale,dh=ph*scale,pan=still?0:(ms/DURATION)*(dw-w)*.5;c.globalAlpha=intro;c.drawImage(land,sx,sy,pw,ph,-pan-(dw-w)*.25,(h-dh)/2,dw,dh);}
  if(script.dark){c.globalAlpha=script.dark;c.fillStyle='#05030c';c.fillRect(0,0,w,h);}
  c.globalAlpha=1;const vg=c.createLinearGradient(0,h*.55,0,h);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(3,8,14,.85)');c.fillStyle=vg;c.fillRect(0,0,w,h);
  drawParticles(c,w,h,script.particles,list,ms,still);
  const m=(MOTIONS[script.motion]||MOTIONS.bloom)(still?1:act),size=Math.min(w,h)*.42*(m.s||1);
  const pos={x:m.x,y:m.y};
  if(ms>=ACT[0])drawFx(c,w,h,script.fx,still?.5:act,pos,size,still);
  if(sprite){c.save();c.globalAlpha=(m.a??1)*(1-seal*.15);c.translate(pos.x*w,pos.y*h);c.rotate(m.r||0);c.drawImage(sprite,-size/2,-size/2,size,size);c.restore();}
  if(ms>=TOOL[0])drawTool(c,w,h,tool,still?1:tp,pos,size);
  if(seal>0){c.save();c.globalAlpha=.9*(1-Math.abs(seal-.5)*2);c.strokeStyle='#d9c8ff';c.lineWidth=4;c.shadowColor='#a46cff';c.shadowBlur=18;c.beginPath();c.arc(pos.x*w,pos.y*h,size*(.9-.3*seal),0,Math.PI*2);c.stroke();c.restore();
   if(seal>.4){c.globalAlpha=(seal-.4)*.5;c.fillStyle='#ffffff';c.fillRect(0,0,w,h);}}
  const line=ms<ACT[0]?'Sinal vivo único…':ms<(ACT[0]+ACT[1])/2?script.lines[0]:ms<TOOL[0]?script.lines[1]:ms<SEAL[1]?TOOL_LINES[tool]:'';
  if(line!==lastLine){caption.textContent=line;lastLine=line;}
  title.classList.toggle('is-shown',ms>=SEAL[1]);
  if(ms<DURATION)requestAnimationFrame(frame);else finish();
 }
 function finish(){if(playing?.el!==el)return;el.classList.add('is-leaving');setTimeout(()=>{el.remove();if(playing?.el===el)playing=null;onDone?.();},420);}
 playing={el,finish};requestAnimationFrame(frame);
}
function stop(){if(playing){playing.el.remove();playing=null;}}
root.OrbitXenoCinema={play,stop,isPlaying:()=>!!playing,SCRIPTS,DURATION};
})(window);
