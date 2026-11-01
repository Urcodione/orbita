// Play Store captures for the November content: xenobiology lab, a capture cinematic and the star shipyard.
// Real game screens (360x640 at 3x = 1080x1920) in captures/, and the same with the kit's headline layout in images/.
// Usage (from orbit-explorer/): node promo/2026-10-playstore/source/capture-novidades.cjs [path/to/index.html]
// The index must be a build that already embeds the painted xeno/yard atlases.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../../..'),out=path.resolve(__dirname,'..'),index=path.resolve(process.argv[2]||root+'/index.html');
const shots=[['07-xenobiologia','Cada espécie<br>existe uma vez.','XENOBIOLOGIA'],['08-captura','Encontre. Contenha.<br>Estude.','CAPTURA DE EXEMPLARES'],['09-estaleiro','Monte a nave<br>peça por peça.','ESTALEIRO ESTELAR']];
const fontFile=['/usr/share/fonts/truetype/lato/Lato-Heavy.ttf','/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf'].find(f=>fs.existsSync(f));
const data=(file,mime)=>'data:'+mime+';base64,'+fs.readFileSync(file).toString('base64');
const CAPTURED=['raposa-aurora','leviata-vidro','orquidea-eterna','arraia-tempestade','lirio-solar','mariposa-cristal','cacto-magma'];

async function game(b){
 const ctx=await b.newContext({viewport:{width:360,height:640},deviceScaleFactor:3,isMobile:true,hasTouch:true});const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+index);await p.waitForFunction(()=>window.orbitApp);
 await p.locator('[data-story-action=skip]').click();await p.locator('[data-guide-skip]').click();
 await p.evaluate(()=>{for(const k of ['xenoTools','xenoSpecimens','yardParts','landscapes'])OrbitArt.images[k];});
 await p.waitForFunction(()=>['xenoTools','xenoSpecimens','yardParts','landscapes','ship'].every(k=>OrbitArt.ready(k)));
 return {p,ctx,errors};
}

(async()=>{const b=await chromium.launch();const report=[];
 // 1. Laboratory: seven exemplars captured, three studied, one rune engraved on the scanner.
 {const {p,ctx,errors}=await game(b);
  await p.evaluate(ids=>{const s=orbitApp.getState();Object.assign(s.resources,{credits:4200,data:900,ore:120,crystals:30});
   s.xeno.captured=ids.slice();s.xeno.studied=ids.slice(0,3);s.xeno.runes=['rune-'+ids[0],'rune-'+ids[2]];s.xeno.tools=['garra','casulo','crio','laco'];
   const scanner=Object.values(s.equipped).find(m=>m&&m.type==='scanner')||Object.values(s.equipped).find(Boolean);if(scanner)scanner.rune='rune-'+ids[0];orbitApp.act('stationLeave');},CAPTURED);
  await p.locator('.og-xeno-access').click();await p.waitForTimeout(600);
  // Show the page with the painted collection, not the intro page with the silhouettes of the signals.
  for(let i=0;i<4&&!await p.locator('#og-sheet-backdrop .og-xeno-tile.is-captured:visible').count();i++){const next=p.locator('[data-sheet-page="1"]:visible:not(:disabled)');if(!await next.count())break;await next.click();await p.waitForTimeout(300);}
  await p.waitForTimeout(600);
  await p.screenshot({path:out+'/captures/07-xenobiologia.png'});report.push(['07-xenobiologia',errors.slice()]);await ctx.close();}
 // 2. Capture cinematic of the glass leviathan, while the sealed cocoon closes on it.
 {const {p,ctx,errors}=await game(b);
  await p.evaluate(()=>OrbitXenoCinema.play(document.getElementById('orbit-game'),'leviata-vidro',()=>{}));await p.waitForTimeout(4500);
  await p.screenshot({path:out+'/captures/08-captura.png'});report.push(['08-captura',errors.slice()]);await ctx.close();}
 // 3. Star shipyard: a full Aural layout on the rocket-shaped blueprint.
 {const {p,ctx,errors}=await game(b);
  await p.evaluate(()=>{const s=orbitApp.getState();s.resources.credits=3000;s.yard.owned={'tanque-externo':2,'placas-casco':2,'vela-solar':1,'reservatorio-o2':1};
   for(const [partId,cell] of [['placas-casco',2],['tanque-externo',10],['tanque-externo',14],['vela-solar',11],['reservatorio-o2',21],['placas-casco',22]])orbitApp.act('yardPlace',{partId,cell});orbitApp.act('stationDock');});
  await p.waitForTimeout(400);if(!await p.locator('#og-sheet-backdrop [data-action=yard]:visible').count())await p.evaluate(()=>orbitApp.back());
  await p.locator('#og-sheet-backdrop [data-action=yard]:visible').click();
  // Let the stat toast and the fly-up numbers from mounting the parts fade before the shot.
  await p.waitForTimeout(6000);
  await p.screenshot({path:out+'/captures/09-estaleiro.png'});report.push(['09-estaleiro',errors.slice()]);await ctx.close();}
 // Headline versions, same layout as source/layout.cjs.
 const p=await b.newPage({viewport:{width:1080,height:1920}});const bg=data(root+'/assets/cruise-painted-v1.webp','image/webp');
 const font=fontFile?`@font-face{font-family:Display;src:url('${data(fontFile,fontFile.endsWith('.otf')?'font/otf':'font/ttf')}')}`:'';
 const css=`${font}*{box-sizing:border-box}body{margin:0;background:#081a29;color:#f0e9d8;font-family:Display,sans-serif}.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.4}.shade{position:absolute;inset:0;background:linear-gradient(120deg,#07142188,transparent 70%)}.header{position:absolute;left:70px;top:30px;right:70px}.brand{position:absolute;right:0;top:0;font-size:31px;letter-spacing:7px;color:#f1c28e}.eyebrow{font-size:18px;letter-spacing:3px;color:#92d2d1;margin:0 0 12px}.headline{font-size:57px;line-height:1.06;letter-spacing:-1.2px;margin:0;text-shadow:0 2px 12px #071421}.game{position:absolute;left:70px;top:220px;width:940px;height:1671.111px;object-fit:fill;border-radius:16px;box-shadow:0 0 0 1px #84bdca55,0 15px 50px #0007}.accent{width:55px;height:3px;background:#e6b077;margin-top:12px}`;
 for(const [id,title,kicker] of shots){const image=data(out+'/captures/'+id+'.png','image/png');
  await p.setContent(`<style>${css}</style><img class="bg" src="${bg}"><div class="shade"></div><header class="header"><div class="brand">ÓRBITA</div><p class="eyebrow">${kicker}</p><h1 class="headline">${title}</h1><div class="accent"></div></header><img class="game" src="${image}">`);
  await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:out+'/images/'+id+'.jpg',type:'jpeg',quality:96});}
 await b.close();console.log(JSON.stringify(report));})().catch(e=>{console.error(e);process.exit(1);});
