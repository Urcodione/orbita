(function(){
 'use strict';
 const types=['scanner','survival','arm','cargo','life','shield','engine','warp'];
 const biomes=['forest','volcanic','ice','desert','ocean','crystal','gas','magma','toxic','rogue'];
 const sources=window.OrbitIllustrations||{};
 // The build embeds art as data: URLs. Copying those multi-MB strings into CSS variables and Image elements duplicated
 // them in memory and made the style system parse them on every recalculation. Each one is turned into a short blob:
 // URL the first time it is read (the in-conversation preview keeps data: URLs, since its host may not allow blob:).
 if(!window.OrbitArtDataUrls&&typeof URL!=='undefined'&&URL.createObjectURL&&typeof Blob!=='undefined')for(const key of Object.keys(sources)){
  const data=sources[key];if(typeof data!=='string'||!data.startsWith('data:'))continue;let url='';
  Object.defineProperty(sources,key,{enumerable:true,configurable:true,get(){if(!url)try{const comma=data.indexOf(','),bin=atob(data.slice(comma+1)),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);url=URL.createObjectURL(new Blob([bytes],{type:data.slice(5,data.indexOf(';'))}));}catch{url=data;}return url;}});
 }
 // Images are created on first use instead of all 30 at startup; listeners can wait for 'load' or the window event.
 const created={};
 function image(key){if(created[key])return created[key];if(!(key in sources))return undefined;const im=new Image();im.decoding='async';im.addEventListener('load',()=>window.dispatchEvent(new CustomEvent('orbit-art-ready',{detail:key})),{once:true});im.src=sources[key];return created[key]=im;}
 const images=new Proxy(created,{get:(target,key)=>typeof key==='string'?image(key):undefined,has:(target,key)=>key in sources,ownKeys:()=>Object.keys(sources),getOwnPropertyDescriptor:(target,key)=>key in sources?{value:image(key),writable:true,enumerable:true,configurable:true}:undefined});
 const ready=key=>{const im=images[key];return !!im&&im.complete&&im.naturalWidth>0;};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),lerp=(a,b,t)=>a+(b-a)*t;
 const moduleRect=type=>{const i=types.indexOf(type),im=images.modules;return [(i%2)*im.width/2,Math.floor(i/2)*im.height/4,im.width/2,im.height/4];};
 const cosmicTypes=['engine','warp','life','shield','scanner','arm','cargo','survival'];
 function module(c,type,x,y,w,h,m){if(m?.mission&&ready('cosmic')){const i=cosmicTypes.indexOf(type),im=images.cosmic;c.drawImage(im,i%4*im.width/4,Math.floor(i/4)*im.height/2,im.width/4,im.height/2,x-w/2,y-h/2,w,h);return true;}if(!ready('modules')||!types.includes(type))return false;c.drawImage(images.modules,...moduleRect(type),x-w/2,y-h/2,w,h);return true;}
 function icon(type,className='',m){if(m?.mission){const i=cosmicTypes.indexOf(type);return `<span class="og-painted-module is-cosmic ${className}" aria-hidden="true" style="background-position:${i%4/3*100}% ${Math.floor(i/4)*100}%"></span>`;}const i=types.indexOf(type);if(i<0)return '';return `<span class="og-painted-module ${className}" aria-hidden="true" style="background-position:${i%2*100}% ${Math.floor(i/2)/3*100}%"></span>`;}
 function world(c,planet,x,y,r){if(!ready('worlds'))return false;if(planet.trainingPrisma){
   const climates=['forest','ice','volcanic','gas'];
   climates.forEach((biome,i)=>{c.save();c.beginPath();c.moveTo(x,y);c.arc(x,y,r,i*Math.PI/2-Math.PI*.75,(i+1)*Math.PI/2-Math.PI*.75);c.closePath();c.clip();world(c,{...planet,trainingPrisma:false,biome},x,y,r);c.restore();});
   c.save();c.strokeStyle='#d1c1ff';c.lineWidth=Math.max(1,r*.012);c.shadowColor='#ac83ff';c.shadowBlur=r*.1;c.beginPath();c.ellipse(x,y,r*1.16,r*.26,-.45,0,Math.PI*2);c.stroke();c.shadowBlur=0;c.restore();return true;
  }let i=biomes.indexOf(planet.biome);if(i<0)i=0;const im=images.worlds,s=im.width/1024;const cx=[295,732][i%2]*s,cy=[150,451,751,1048,1348][Math.floor(i/2)]*s;
  const hash=String(planet.id||planet.seed||'').split('').reduce((n,v)=>(Math.imul(n,31)+v.charCodeAt(0))>>>0,17);
  // The per-world tint used to be a canvas filter applied on every frame (and per node on the system map);
  // it is baked once into a small cached tile instead.
  const key=i+':'+(hash%15)+':'+(hash%9);let tile=worldTiles.get(key);
  if(!tile){const size=Math.round(300*s);tile=document.createElement('canvas');tile.width=tile.height=size;const g=tile.getContext('2d');g.filter=`hue-rotate(${(hash%15)-7}deg) saturate(${.94+(hash%9)/60})`;g.drawImage(im,cx-150*s,cy-150*s,300*s,300*s,0,0,size,size);if(worldTiles.size>=40)worldTiles.delete(worldTiles.keys().next().value);worldTiles.set(key,tile);}
  c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();c.drawImage(tile,x-r,y-r,r*2,r*2);c.restore();return true;
 }
 const worldTiles=new Map();
 const galaxyTiles=new Map();
 function galaxy(c,node,x,y,r){
  if(!ready('galaxies'))return false;
  const kind=String(node.kind||''),i=/forge|ellip/.test(kind)?1:/abyss|neb|irreg/.test(kind)?2:0;
  if(!galaxyTiles.has(i)){
   const im=images.galaxies,tile=document.createElement('canvas');tile.width=384;tile.height=512;
   const g=tile.getContext('2d');g.drawImage(im,i*im.width/3,im.height*.12,im.width/3,im.height*.76,0,0,384,512);
   g.globalCompositeOperation='destination-in';g.translate(192,256);g.scale(192,256);
   const fade=g.createRadialGradient(0,0,.55,0,0,1);fade.addColorStop(0,'#fff');fade.addColorStop(1,'transparent');g.fillStyle=fade;g.fillRect(-1,-1,2,2);galaxyTiles.set(i,tile);
  }
  c.drawImage(galaxyTiles.get(i),x-r*1.25,y-r*1.6,r*2.5,r*3.2);return true;
 }
 function phenomenon(c,node,x,y,r){
  if(!ready('phenomena'))return false;
  const i=node.kind==='forge'?0:node.kind==='verdant'?1:2,im=images.phenomena;
  c.drawImage(im,i*im.width/3,0,im.width/3,im.height,x-r*1.5,y-r*2.1,r*3,r*4.2);return true;
 }
 function star(c,kind,x,y,r){
  if(!ready('stars'))return false;
  const index=({'yellow':0,'red-dwarf':1,'blue-giant':2,pulsar:3})[kind]??0,im=images.stars;
  c.drawImage(im,(index%2)*im.width/2,Math.floor(index/2)*im.height/2,im.width/2,im.height/2,x-r*1.65,y-r*1.65,r*3.3,r*3.3);return true;
 }
 const game=document.getElementById('orbit-game');for(const key of ['commerce','biology','cosmic','relics','purpose','lume','warpCell'])if(key in sources)game.style.setProperty('--og-'+key+'-art','url("'+sources[key]+'")');
 // Story and room scenes are cut at build time (qa/prepare-ui-art.py): no canvas crop or WebP encode on the main thread.
 for(let i=0;i<4;i++)if(('story'+i)in sources)game.style.setProperty('--og-story-scene-'+i,'url("'+sources['story'+i]+'")');
 game.style.setProperty('--og-room-aspect','2.25');for(let i=0;i<6;i++)if(('room'+i)in sources)game.style.setProperty('--og-room-'+i,'url("'+sources['room'+i]+'")');
 const loading=key=>{const im=created[key];return !!im&&!im.complete;};
 // Painting keys of the active ship (ships.js): the Andorinha uses ship/interior, the fleet hull-<id>/open-<id>.
 const hullKeys=id=>id&&id!=='andorinha'&&('hull-'+id)in sources&&('open-'+id)in sources?{ship:'hull-'+id,interior:'open-'+id}:{ship:'ship',interior:'interior'};
 const ANDORINHA_NOZZLES=[[21,84,0],[50,95.5,1],[79,84,0]];
 const nozzlesOf=id=>window.OrbitEngine?.fleetCatalog?.SHIPS.find(s=>s.id===id)?.nozzles||ANDORINHA_NOZZLES;
 window.OrbitArt={images,ready,loading,module,icon,world,galaxy,phenomenon,star,types,hullKeys};
 if('modules' in sources)game.style.setProperty('--og-module-art',`url("${sources.modules}")`);
 const premiumCache=new Map(),tintCache=new Map();
 // Paint colours were a canvas filter re-applied to the full hull on every frame; bake each tint once.
 function tintedHull(key,paint){
  if(paint==='none')return images[key];const id=key+'|'+paint;let tile=tintCache.get(id);
  if(!tile){const im=images[key];tile=document.createElement('canvas');tile.width=im.naturalWidth;tile.height=im.naturalHeight;const g=tile.getContext('2d');g.filter=paint;g.drawImage(im,0,0);if(tintCache.size>=4)tintCache.delete(tintCache.keys().next().value);tintCache.set(id,tile);}
  return tile;
 }
 function premiumHull(key,tint){
  const id=key+tint;if(premiumCache.has(id))return premiumCache.get(id);
  const im=images[key],tile=document.createElement('canvas');tile.width=im.naturalWidth;tile.height=im.naturalHeight;const g=tile.getContext('2d');
  g.drawImage(im,0,0);
  const pixels=g.getImageData(0,0,tile.width,tile.height),data=pixels.data,target=tint.match(/\w\w/g).map(v=>parseInt(v,16));
  // Preserve original opacity, panel shading, ceramic body and glass. Replace warm enamel only.
  for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const r=data[i],b=data[i+2],green=data[i+1],warm=clamp((r-b-18)/65,0,1)*clamp((r-green+5)/40,0,1);
   if(warm<.05)continue;const light=Math.max(r,green,b)/255;
   for(let k=0;k<3;k++){const enamel=target[k]*(.36+.64*light)+Math.pow(light,8)*28;data[i+k]=lerp(data[i+k],clamp(enamel,0,255),warm*.96);}
  }
  g.putImageData(pixels,0,0);if(premiumCache.size>=4)premiumCache.delete(premiumCache.keys().next().value);premiumCache.set(id,tile);return tile;
 }
 function premiumAura(c,w,h,t,tint){
  c.save();c.globalCompositeOperation='screen';
  const pulse=.78+Math.sin(t*1.6)*.12,g=c.createRadialGradient(0,0,w*.16,0,0,h*.52);
  g.addColorStop(0,tint+'00');g.addColorStop(.4,tint+'30');g.addColorStop(.7,tint+'55');g.addColorStop(1,tint+'00');
  c.save();c.scale(.75,1);c.globalAlpha=pulse;c.fillStyle=g;c.fillRect(-h*.6,-h*.6,h*1.2,h*1.2);c.restore();
  const violet=tint==='#a34dff',green=tint==='#31ffbb';
  for(let i=0;i<3;i++){
   c.save();c.strokeStyle=i===1?'#dffcff':tint;c.shadowColor=tint;c.shadowBlur=7;c.lineWidth=i===1?.65:1.4;c.globalAlpha=.45;
   c.beginPath();
   if(violet){c.ellipse(0,0,w*(.43+i*.045),h*.43,.12*Math.sin(t*.5+i),t*.35+i*2,t*.35+i*2+1.8);}
   else if(green){for(let j=0;j<=32;j++){const u=j/32,y=(u-.5)*h*.9,x=(i%2?-1:1)*(w*.38+Math.sin(u*9-t*1.5+i)*w*.04);j?c.lineTo(x,y):c.moveTo(x,y);}}
   else {const phase=(t*.3+i/3)%1;c.globalAlpha=(1-phase)*.55;c.ellipse(0,0,w*(.33+phase*.2),h*(.39+phase*.13),0,0,Math.PI*2);}
   c.stroke();c.restore();
  }
  for(let i=0;i<12;i++){const a=t*(violet?.24:.12)+i*2.399,r=1+Math.sin(t+i)*.06,x=Math.cos(a)*w*.47*r,y=Math.sin(a)*h*.46*r;c.globalAlpha=.4+.35*Math.sin(t*2+i);c.fillStyle=i%3?tint:'#fff';c.beginPath();c.arc(x,y,i%4===0?1.6:.8,0,Math.PI*2);c.fill();}
  c.restore();
 }
 function premiumReflection(renderer,key,w,h,t,tint){
  const tile=renderer.premiumReflectionCanvas||(renderer.premiumReflectionCanvas=document.createElement('canvas'));
  if(tile.width!==256){tile.width=256;tile.height=384;}
  const bases=renderer.premiumReflectionBases||(renderer.premiumReflectionBases={});
  if(!bases[key]){const base=document.createElement('canvas');base.width=256;base.height=384;base.getContext('2d').drawImage(images[key],0,0,256,384);bases[key]=base;}
  const g=tile.getContext('2d');g.clearRect(0,0,256,384);g.globalCompositeOperation='source-over';g.drawImage(bases[key],0,0);g.globalCompositeOperation='source-in';
  const pos=((t*.10)%1)*2-.5,shine=g.createLinearGradient(0,0,256,384);shine.addColorStop(0,'#ffffff00');
  for(const [offset,color]of [[pos-.12,'#ffffff00'],[pos-.04,tint+'50'],[pos,'#eaffff99'],[pos+.025,tint+'60'],[pos+.1,'#ffffff00']])if(offset>0&&offset<1)shine.addColorStop(offset,color);
  shine.addColorStop(1,'#ffffff00');g.fillStyle=shine;g.fillRect(0,0,256,384);
  renderer.ctx.save();renderer.ctx.globalCompositeOperation='screen';renderer.ctx.drawImage(tile,-w/2,-h/2,w,h);renderer.ctx.restore();
 }
 window.OrbitArt.previewCustomization=function(canvas,state){
  if(!canvas)return;
  const renderer={ctx:canvas.getContext('2d'),state:{shipDetail:{mode:'exterior'},shipModel:state.fleet?.active,shipColor:state.ship.color,shipTrail:state.ship.trail||'blue',modules:state.equipped},yaw:.18,pitch:.2,reduced:window.OrbitAudio?.prefs.light||matchMedia('(prefers-reduced-motion: reduce)').matches,publishHotspots(){},publishCargoHotspots(){}};
  const start=performance.now();function frame(now){if(!canvas.isConnected)return;if(document.hidden){document.addEventListener('visibilitychange',()=>requestAnimationFrame(frame),{once:true});return;}const dpr=Math.min(devicePixelRatio||1,2),w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}const c=renderer.ctx;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);renderer.width=w;renderer.height=h;
   const scale=Math.min(w/225,h/430);OrbitScene.prototype.drawPaintedShip.call(renderer,w/2,h*.43,scale,(now-start)/1000,0,0,now,false,false);if(!renderer.reduced||!ready(hullKeys(renderer.state.shipModel).ship))requestAnimationFrame(frame);
  }requestAnimationFrame(frame);
 };
 OrbitScene.prototype.drawPaintedShip=function(cx,cy,scale,t,warp,travel,now,shipView,portrait){
  const hull=hullKeys(this.state.shipModel);
  if(!ready(hull.ship)||!ready(hull.interior)||!ready('modules'))return false;
  const c=this.ctx,detail=this.state.shipDetail||{},selected=types.includes(detail.selectedModule)?detail.selectedModule:null;
  const inspecting=shipView&&detail.mode==='module'&&!!selected,interior=shipView&&(detail.mode==='interior'||inspecting);
  const drag=inspecting&&this.moduleDrag?.type===selected?this.moduleDrag:null,side=selected?(types.indexOf(selected)%2?1:-1):1;
  const target={x:cx,y:cy,scale,yaw:this.yaw,pitch:this.pitch,open:interior?1:0,focus:inspecting?1:0,explode:drag?drag.pose:inspecting&&detail.expanded?1:0,fx:0,fy:0,fz:0};
  if(drag)Object.assign(target,drag.cameraLock);
  if(!this.camera)this.camera={...target};
  const dt=clamp(now-(this.cameraTime||now-16),1,48),blend=this.reduced?1:1-Math.exp(-dt/125);this.cameraTime=now;
  for(const k of Object.keys(target))this.camera[k]=lerp(this.camera[k],target[k],blend);
  const cam=this.camera;if(drag)cam.explode=drag.pose;
  const layout=this.state.inspectionLayout,top=shipView?(inspecting?120:layout?.top||120):0,bottom=shipView?(inspecting?this.height-177:layout?.bottom||this.height-177):this.height;
  // Interior zoom prioritizes the equipment rack; small screens crop the nose and exhaust instead of shrinking the sockets.
  const baseH=lerp(310*cam.scale,Math.max(360,310*cam.scale*1.16),cam.open),baseW=baseH*2/3;
  const tilt=clamp(cam.yaw-.18,-1,1)*.08,lean=clamp(cam.pitch-.2,-.15,.4)*.05;
  const local=type=>{const i=types.indexOf(type);return {x:baseW*([.421,.580][i%2]-.5),y:baseH*([.352,.446,.540,.639][Math.floor(i/2)]-.5)};};
  const chosen=local(selected||'scanner'),desired=Math.min(137,this.width*.38,Math.max(65,(bottom-top)*.68));
  const zoom=lerp(1,desired/(baseW*.16),cam.focus);
  const anchor={x:cam.x,y:lerp(cam.y,(top+bottom)/2,cam.focus)};
  const origin={x:anchor.x-chosen.x*zoom*cam.focus,y:anchor.y-chosen.y*zoom*cam.focus};
  const point=(x,y)=>({x:origin.x+(x*Math.cos(tilt)-y*Math.sin(tilt))*zoom,y:origin.y+(x*Math.sin(tilt)+y*Math.cos(tilt))*(1+lean)*zoom});
  const mountPoint=type=>{const p=local(type);return point(p.x,p.y);};
  const vector={x:side*Math.min(78,this.width*.21),y:12};
  const pieceW=baseW*.16*zoom,pieceH=pieceW*.85;
  c.save();if(shipView){c.beginPath();c.rect(0,top,this.width,Math.max(1,bottom-top));c.clip();}
  // A continuous fade opens the same illustrated hull; rotating never reverts to the old mesh.
  c.save();c.translate(origin.x,origin.y);c.rotate(tilt);c.scale(zoom,zoom*(1+lean));
  c.globalAlpha=1-cam.focus*.83;
  const rgb=(this.state.shipColor||'#f0a270').match(/\w\w/g).map(v=>parseInt(v,16)/255),hi=Math.max(...rgb),lo=Math.min(...rgb),delta=hi-lo;
  let hue=delta?(hi===rgb[0]?(rgb[1]-rgb[2])/delta:hi===rgb[1]?(rgb[2]-rgb[0])/delta+2:(rgb[0]-rgb[1])/delta+4)*60:0;
  const neon=['#a34dff','#31ffbb','#ff4795'].includes(this.state.shipColor);
  const originalHues={'#71bdc4':148,'#c9b1df':252,'#9bb68c':72,'#e7d8b5':12};
  let paint='none';
  if(this.state.shipColor==='#f0a270')paint='none';
  else if(originalHues[this.state.shipColor]!==undefined){const h=originalHues[this.state.shipColor];paint=`hue-rotate(${h}deg) saturate(${h===12?.55:.85})`;}
  else paint=`hue-rotate(${hue-24}deg) saturate(${neon?1.7:.65}) brightness(${neon?1.08:1.04})`;
  if(neon){paint='none';c.save();c.globalAlpha=1-cam.focus;premiumAura(c,baseW,baseH,this.reduced?2:t,this.state.shipColor);c.restore();}
  if(cam.open<.999){const hullAlpha=c.globalAlpha;c.globalAlpha*=1-cam.open;c.drawImage(neon?premiumHull(hull.ship,this.state.shipColor):tintedHull(hull.ship,paint),-baseW/2,-baseH/2,baseW,baseH);
   c.globalAlpha=hullAlpha;}
  if(cam.open>.001){c.globalAlpha=(1-cam.focus*.83)*cam.open;c.drawImage(neon?premiumHull(hull.interior,this.state.shipColor):tintedHull(hull.interior,paint),-baseW/2,-baseH/2,baseW,baseH);}
  if(neon){c.globalAlpha=(1-cam.focus*.83);premiumReflection(this,cam.open>.5?hull.interior:hull.ship,baseW,baseH,this.reduced?2:t,this.state.shipColor);}
  c.restore();
  const jets=1-cam.open,trail=this.state.shipTrail||'blue',special=['cosmic','aurora','solar'].includes(trail),colors=({blue:['#9deeff','#419eeacc','#516bf000'],orange:['#ffe0a3','#ff8c35cc','#ff542000'],cosmic:['#ead0ff','#a351ffcc','#6633ee00'],aurora:['#c6ffea','#34edb3cc','#22aacc00'],solar:['#ffe1f3','#ff55b0cc','#9a22ee00']})[trail]||['#9deeff','#419eeacc','#516bf000'];
  if(jets>.01){
   c.save();c.globalCompositeOperation='screen';
   for(const [nx,ny,main] of nozzlesOf(this.state.shipModel)){
    const dx=main?0:nx/100-.5,p=point((nx/100-.5)*baseW,baseH*(ny/100-.5)),pulse=this.reduced?1:1+Math.sin(t*17+dx*9)*.12+Math.sin(t*29+dx*21)*.055;
    const len=(dx?34:57)*cam.scale*(1+warp+travel*.5)*(special?1.65:1)*pulse,width=(dx?5:8)*cam.scale;
    for(let layer=0;layer<3;layer++){
     const length=len*(1-layer*.23),radius=width*(1-layer*.25),sway=this.reduced?0:Math.sin(t*13+layer+dx*17)*radius*.3;
     const g=c.createLinearGradient(p.x,p.y,p.x,p.y+length);g.addColorStop(0,layer===2?'#fffbe9':colors[0]);g.addColorStop(.35,layer===2?colors[0]:colors[1]);g.addColorStop(1,colors[2]);
     c.globalAlpha=jets*(layer===0?.5:.8);c.fillStyle=g;c.beginPath();c.moveTo(p.x-radius,p.y);c.bezierCurveTo(p.x-radius*1.5,p.y+length*.3,p.x+sway-radius*.5,p.y+length*.7,p.x+sway,p.y+length);c.bezierCurveTo(p.x+sway+radius*.6,p.y+length*.7,p.x+radius*1.5,p.y+length*.3,p.x+radius,p.y);c.fill();
    }
    if(special){
     const time=this.reduced?1.7:t,spread=width*(dx?1.7:3),tail=len*1.12;
     // Different physical signatures: double helix, aurora ribbons, or pulsed shock rings.
     if(trail==='cosmic'||trail==='aurora')for(let strand=0;strand<(trail==='cosmic'?2:4);strand++){
      c.beginPath();for(let j=0;j<=30;j++){const u=j/30,wave=Math.sin(u*(trail==='cosmic'?11:5)-time*3+strand*Math.PI*(trail==='cosmic'?1:.5));const x=p.x+wave*spread*Math.sin(u*Math.PI)*(.5+u),y=p.y+tail*u;j?c.lineTo(x,y):c.moveTo(x,y);}
      const ribbon=c.createLinearGradient(0,p.y,0,p.y+tail);ribbon.addColorStop(0,colors[0]);ribbon.addColorStop(.4,trail==='aurora'?(strand%2?'#42adff':'#64ffb5'):'#c07aff');ribbon.addColorStop(1,colors[2]);c.strokeStyle=ribbon;c.lineWidth=(trail==='aurora'?5:2)*cam.scale;c.globalAlpha=jets*(trail==='aurora'?.32:.75);c.stroke();
     }
     if(trail==='solar')for(let ring=0;ring<5;ring++){const u=((time*.6+ring/5)%1),r=spread*(.3+u);c.globalAlpha=jets*(1-u)*.75;c.strokeStyle=ring%2?'#ffd6a3':'#ff63c4';c.lineWidth=1.7*cam.scale;c.beginPath();c.ellipse(p.x,p.y+tail*u,r,r*.24,0,0,Math.PI*2);c.stroke();}
     const count=dx?10:24;for(let i=0;i<count;i++){const u=(i/count+time*(.17+(i%3)*.03))%1,x=p.x+Math.sin(i*12.7+u*7)*spread*(.3+u),y=p.y+tail*u;c.globalAlpha=jets*Math.sin(u*Math.PI)*.85;c.fillStyle=i%3?colors[0]:'#ffffff';const r=(i%5===0?1.8:.8)*cam.scale;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();if(trail==='cosmic'&&i%5===0){c.fillRect(x-r*3,y-.3*cam.scale,r*6,.6*cam.scale);c.fillRect(x-.3*cam.scale,y-r*3,.6*cam.scale,r*6);}}
    }
   }c.restore();
  }

  this.inspection=null;this.cargoHitFaces=[];const cargo=[],points=[];
  for(const type of types){const installed=!!this.state.modules?.[type],socket=mountPoint(type),isSelected=type===selected;
   const pose=isSelected?cam.explode:0,p={x:socket.x+vector.x*pose,y:socket.y+vector.y*pose};
   if(cam.open>.001&&installed){c.save();c.globalAlpha=cam.open*(isSelected?1:1-cam.focus*.88);if(isSelected&&cam.focus>.5){c.strokeStyle='#9bdbd4aa';c.lineWidth=1;c.setLineDash([3,4]);c.strokeRect(socket.x-pieceW*.42,socket.y-pieceH*.42,pieceW*.84,pieceH*.84);c.setLineDash([]);if(pose>.05){c.beginPath();c.moveTo(socket.x,socket.y);c.lineTo(p.x,p.y);c.stroke();}}module(c,type,p.x,p.y,pieceW,pieceH,this.state.modules?.[type]);c.restore();}
   if(inspecting&&isSelected){const bounds={x:p.x-pieceW/2,y:p.y-pieceH/2,width:pieceW,height:pieceH,w:pieceW,h:pieceH};
    if(type==='cargo')for(const item of [{resource:'ore',label:'Minérios',x:-.20,y:.10},{resource:'crystals',label:'Cristais',x:-.04,y:-.22},{resource:'oxygen',label:'Oxigênio',x:.32,y:-.10}]){const x=p.x+item.x*pieceW,y=p.y+item.y*pieceH,w=pieceW*.27,h=pieceH*.42,b={x:x-w/2,y:y-h/2,width:w,height:h};cargo.push({resource:item.resource,label:item.label,x,y,bounds:b,visible:true});this.cargoHitFaces.push({resource:item.resource,points:[[b.x,b.y],[b.x+w,b.y],[b.x+w,b.y+h],[b.x,b.y+h]]});}
    this.inspection={type,bounds,socket:{x:socket.x,y:socket.y,bounds:{x:socket.x-pieceW/2,y:socket.y-pieceH/2,width:pieceW,height:pieceH}},dragging:!!drag?.active,expanded:drag?drag.pose>=.5:!!detail.expanded,pose:cam.explode,expansionVector:vector,side,contents:cargo};
   }
   if(interior&&!inspecting&&cam.open>.7){const s=types.indexOf(type)%2?1:-1,edge=12+(layout?.labelWidth||88)/2;points.push({type,side:s,x:socket.x,y:socket.y,anchorX:socket.x,anchorY:socket.y,width:Math.max(44,pieceW*.85),height:Math.max(44,pieceH*.85),visible:true,attached:true,installed});}
  }
  c.restore();

  this.shipHit={x:origin.x-baseW*zoom/2,y:origin.y-baseH*zoom/2,w:baseW*zoom,h:baseH*zoom};this.publishHotspots(points);this.publishCargoHotspots(cargo);return true;
 };
})();
