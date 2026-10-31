(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const mix = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const seedOf = value => String(value || 'auralis').split('').reduce((n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
  function random(seed) {
    return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n; return ((n ^ n >>> 14) >>> 0) / 4294967296; };
  }
  const THEMES = {
    forest: { ground: '#243d3c', light: '#39554c', rock: '#708078', shadow: '#182c30', accent: '#a3d49c' },
    desert: { ground: '#594536', light: '#846b48', rock: '#b59669', shadow: '#382f2d', accent: '#f1bd7f' },
    ice: { ground: '#354e61', light: '#638b9a', rock: '#a4c6cf', shadow: '#223645', accent: '#b7eced' },
    crystal: { ground: '#35374f', light: '#4d4b67', rock: '#8e8aa5', shadow: '#23263b', accent: '#c6a9f4' },
    volcanic: { ground: '#3c3435', light: '#50403b', rock: '#81756a', shadow: '#28272f', accent: '#f6a373' },
    magma: { ground: '#4f3030', light: '#714035', rock: '#886c56', shadow: '#30262d', accent: '#ffb475' },
    toxic: { ground: '#34463e', light: '#5b6343', rock: '#919471', shadow: '#243430', accent: '#c4d997' },
    ocean: { ground: '#143e50', light: '#205b68', rock: '#508c96', shadow: '#092c40', accent: '#84dbe4' },
    gas: { ground: '#514844', light: '#75634e', rock: '#b7a486', shadow: '#35333d', accent: '#efd5a5' },
    rogue: { ground: '#293743', light: '#3c5261', rock: '#738f9e', shadow: '#172832', accent: '#9dbfce' }
  };

  const TERRAIN_ORDER = ['forest','desert','ice','crystal','volcanic','magma','toxic','ocean','gas','rogue'];
  const WALL_ART = {forest:8,desert:10,ice:9,crystal:5,volcanic:11,magma:11,toxic:13,ocean:12,gas:14,rogue:7};
  function sprite(c, index, x=0, y=0, size=49) {
    const art=window.OrbitArt;if(!art?.ready('fieldSprites'))return false;
    const im=art.images.fieldSprites,w=im.naturalWidth/4,h=im.naturalHeight/4;
    c.drawImage(im,index%4*w,Math.floor(index/4)*h,w,h,x-size/2,y-size/2,size,size);return true;
  }

  function path(c, points, fill, stroke, width = 1) {
    c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function ellipse(c, x, y, rx, ry, fill, stroke) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); }
  }
  function line(c, points, color, width = 1) {
    c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
  }
  function glow(c, x, y, radius, color) {
    const g = c.createRadialGradient(x, y, 0, x, y, radius); g.addColorStop(0, color); g.addColorStop(1, 'rgba(80,160,180,0)'); c.fillStyle = g; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  function rock(c, x, y, size, theme, seed) {
    const r = random(seed), shape = Array.from({ length: 6 }, (_, i) => { const a = i * TAU / 6, k = .7 + r() * .3; return [x + Math.cos(a) * size * k, y + Math.sin(a) * size * .65 * k]; });
    ellipse(c, x + size * .23, y + size * .28, size * .91, size * .52, '#06141c55');
    path(c, shape, theme.rock); path(c, [shape[2], shape[3], shape[4], [x - size * .12, y - size * .2]], '#ffffff12');
    path(c, [shape[0], shape[1], shape[2], [x - size * .12, y - size * .2]], theme.shadow + 'a0');
    line(c, [shape[3], shape[4], shape[5]], '#dce8d82a', .65);
  }

  class OrbitExpeditionScene {
    constructor(canvas, callbacks = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.callbacks = callbacks; this.data = null;
      this.width = 0; this.height = 0; this.frame = 0; this.lastFrame = 0; this.visible = true; this.dead = false;
      this.position = null; this.motion = null; this.heading = 0; this.signal = null; this.cache = null; this.cacheKey = '';
      this.media = window.matchMedia('(prefers-reduced-motion: reduce)'); this.reduced = this.media.matches;
      this.onReduce = event => { this.reduced = event.matches; this.draw(performance.now()); this.wake(); };
      this.media.addEventListener?.('change', this.onReduce);
      this.onVisibility = () => { if (document.hidden) this.stop(); else this.wake(); };
      document.addEventListener('visibilitychange', this.onVisibility);
      this.onPointer = event => {
        if (!this.data || !this.callbacks.onSelectCell) return;
        const box = canvas.getBoundingClientRect(), g = this.geometry();
        const x = Math.floor(((event.clientX - box.left) * this.width / box.width - g.left) / g.size);
        const y = Math.floor(((event.clientY - box.top) * this.height / box.height - g.top) / g.size);
        if (x >= 0 && x < g.columns && y >= 0 && y < g.rows) this.callbacks.onSelectCell(x, y);
      };
      canvas.addEventListener('pointerup', this.onPointer);
      this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(canvas);
      if (typeof IntersectionObserver !== 'undefined') {
        this.intersection = new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; if (this.visible) this.wake(); else this.stop(); }); this.intersection.observe(canvas);
      }
      this.onArtReady=()=>{if(!this.dead){this.cacheKey='';this.draw(performance.now());}};
      for(const key of ['fieldTerrain','fieldSprites'])window.OrbitArt?.images[key]?.addEventListener('load',this.onArtReady);
      this.resize();
    }

    geometry() {
      const columns = this.data?.view?.width || 6, rows = this.data?.view?.height || 6;
      const size = Math.max(1, Math.min((this.width - 8) / columns, (this.height - 8) / rows));
      return { columns, rows, size, left: (this.width - size * columns) / 2, top: (this.height - size * rows) / 2 };
    }

    resize() {
      if (this.dead) return;
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width || this.canvas.clientWidth || 320, height = rect.height || this.canvas.clientHeight || width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Same size: keep the bitmap and the terrain/fog/route caches instead of rebuilding them at 2x.
      if (width === this.width && height === this.height && dpr === this.dpr) return;
      this.width = width; this.height = height; this.dpr = dpr;
      this.canvas.width = Math.round(this.width * dpr); this.canvas.height = Math.round(this.height * dpr);
      this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0); this.cacheKey = ''; this.draw(performance.now());
    }

    update(data) {
      if (this.dead) return;
      const next = data?.view?.position || (data?.view ? { x: data.view.x ?? 2, y: data.view.y ?? 5 } : null);
      const now = performance.now(), oldPlanet = this.data?.planet?.id;
      if (next && this.position && oldPlanet === data?.planet?.id && (next.x !== this.position.x || next.y !== this.position.y)) {
        const from = this.currentPosition(now), dx = next.x - this.position.x, dy = next.y - this.position.y;
        this.heading = Math.atan2(dy, dx) + Math.PI / 2;
        this.motion = this.reduced ? null : { from, to: { ...next }, start: now, duration: 220 };
      } else if (!next || oldPlanet !== data?.planet?.id) { this.motion = null; this.heading = 0; }
      this.position = next ? { ...next } : null; this.data = data; this.draw(now); if (data?.view) this.wake(); else this.stop();
    }

    currentPosition(now) {
      if (!this.motion) return this.position || { x: 2, y: 5 };
      const t = clamp((now - this.motion.start) / this.motion.duration, 0, 1), eased = 1 - Math.pow(1 - t, 3);
      const p = { x: mix(this.motion.from.x, this.motion.to.x, eased), y: mix(this.motion.from.y, this.motion.to.y, eased) };
      if (t === 1) this.motion = null; return p;
    }

    effect(kind) { this.signal = { kind, start: performance.now() }; this.draw(performance.now()); this.wake(); }
    setPaused(value){this.paused=value;if(value)this.stop();else{this.draw(performance.now());this.wake();}}
    stop() { cancelAnimationFrame(this.frame); this.frame = 0; }
    wake() {
      if (this.paused || this.dead || this.frame || !this.visible || document.hidden || !this.data?.view || this.reduced) return;
      this.frame = requestAnimationFrame(now => {
        this.frame = 0;
        // Rover moves and scan/collect signals animate at full rate; the idle board (bob, pulse, motes) only needs ~15 fps.
        const busy = this.motion || (this.signal && now - this.signal.start < 2500);
        if (busy || now - this.lastFrame > 64) { this.lastFrame = now; this.draw(now); }
        this.wake();
      });
    }

    terrain(theme, biome, seed, g) {
      const painted=window.OrbitArt?.ready('fieldTerrain');
      const key = [painted, biome, seed, this.width, this.height, g.columns, g.rows].join(':');
      if (key === this.cacheKey && this.cache) return this.cache;
      this.cacheKey = key; this.cache = document.createElement('canvas');
      this.cache.width = Math.ceil(this.width * 2); this.cache.height = Math.ceil(this.height * 2);
      const c = this.cache.getContext('2d'); c.scale(2, 2); c.fillStyle = '#0a1b25'; c.fillRect(0, 0, this.width, this.height);
      if(painted){
        const im=window.OrbitArt.images.fieldTerrain,i=Math.max(0,TERRAIN_ORDER.indexOf(biome)),tw=im.naturalWidth/4,th=im.naturalHeight/3;
        // Cover the map with one continuous painting; never stretch individual grid cells.
        const crop=Math.min(tw,th)-4,offset=(seed%100)/100;
        c.filter='saturate(1.18) contrast(1.12)';
        c.drawImage(im,i%4*tw+2,Math.floor(i/4)*th+2+(th-crop-4)*offset,crop,crop,0,0,this.width,this.height);
        c.filter='none';
        return this.cache;
      }
      for (let y = 0; y < g.rows; y++) for (let x = 0; x < g.columns; x++) {
        const rnd = random(seed + x * 719 + y * 2143), s = g.size;
        c.save(); c.translate(g.left + x * s, g.top + y * s);
        const light = c.createLinearGradient(0, 0, s, s); light.addColorStop(0, theme.light); light.addColorStop(1, theme.ground); c.fillStyle = light; c.fillRect(0, 0, s, s);
        c.fillStyle = `rgba(5,15,25,${rnd() * .13})`; c.fillRect(0, 0, s, s);
        for (let n = 0; n < 27; n++) { c.fillStyle = n % 3 ? '#ffffff09' : '#05182222'; ellipse(c, rnd() * s, rnd() * s, .3 + rnd() * 1.2, .3 + rnd() * .6, c.fillStyle); }
        if (['ocean', 'gas', 'toxic'].includes(biome)) {
          for (let n = 0; n < 4; n++) {
            const yy = (n + .3) * s / 4, off = rnd() * 5;
            c.beginPath(); c.moveTo(1, yy); c.bezierCurveTo(s * .28, yy - 6 + off, s * .55, yy + 9 - off, s - 1, yy - 2); c.strokeStyle = biome === 'gas' ? '#ead4aa14' : '#8fdddb18'; c.lineWidth = biome === 'gas' ? 3 : 1; c.stroke();
          }
        } else if (biome === 'desert') {
          for (let n = 0; n < 3; n++) { c.beginPath(); c.ellipse(s * (.2 + rnd() * .6), s * (.2 + rnd() * .7), s * .3, s * .07, -.38, Math.PI * .9, TAU); c.strokeStyle = '#e9c58b20'; c.lineWidth = 1.3; c.stroke(); }
        } else {
          for (let n = 0; n < 3; n++) rock(c, rnd() * s * .8 + s * .1, rnd() * s * .8 + s * .1, 1.5 + rnd() * 2.5, theme, seed + x + y * 7 + n);
          if (biome === 'forest') for (let n = 0; n < 4; n++) { const xx = 4 + rnd() * (s - 8), yy = 4 + rnd() * (s - 8); line(c, [[xx - 2, yy + 1], [xx, yy - 3], [xx + 1, yy]], '#7a9c674a', .9); }
          if (['magma', 'volcanic', 'ice', 'rogue'].includes(biome)) {
            const xx = rnd() * s * .5 + s * .25;
            line(c, [[xx - 8, 0], [xx - 3, s * .3], [xx + 5, s * .47], [xx, s * .7], [xx + 12, s]], biome === 'magma' ? '#e87a4f65' : biome === 'volcanic' ? '#b4775e3a' : '#b8e2ef25', biome === 'magma' ? 1.7 : 1);
          }
        }
        c.strokeStyle = '#03151c39'; c.lineWidth = 1; c.strokeRect(.5, .5, s - 1, s - 1);
        c.restore();
      }
      return this.cache;
    }

    fog(g){
      const ready=window.OrbitArt?.ready('fieldTerrain'),key=[this.width,this.height,ready].join(':');
      if(this.fogKey===key)return this.fogCache;
      this.fogKey=key;const canvas=document.createElement('canvas');canvas.width=Math.ceil(this.width*2);canvas.height=Math.ceil(this.height*2);const c=canvas.getContext('2d');c.scale(2,2);
      c.fillStyle='#112937';c.fillRect(0,0,this.width,this.height);
      if(ready){const im=window.OrbitArt.images.fieldTerrain,tw=im.width/4,th=im.height/3;c.filter='saturate(.65) brightness(.12)';c.drawImage(im,2,2*th+2,tw-4,th-4,0,0,this.width,this.height);c.filter='none';}
      const shade=c.createLinearGradient(0,0,this.width,this.height);shade.addColorStop(0,'#07132140');shade.addColorStop(1,'#061624b0');c.fillStyle=shade;c.fillRect(0,0,this.width,this.height);this.fogCache=canvas;return canvas;
    }

    routes(c,cells,g,theme,biome,seed){
      // One continuous, terrain-aligned network; never infer hidden terrain.
      const key=[seed,biome,this.width,this.height,cells.map(v=>v.visible?v.kind:'?').join(',')].join(':');
      if(key!==this.routeKey){
        this.routeKey=key;const layer=document.createElement('canvas');layer.width=Math.ceil(this.width*2);layer.height=Math.ceil(this.height*2);
        const p=layer.getContext('2d');p.scale(2,2);const s=g.size;
        const palettes={forest:['#273a29','#70664a','#a19667'],desert:['#765036','#b58b57','#e9c78e'],ice:['#294656','#689bab','#b4d6db'],crystal:['#332c49','#726186','#bd9fc7'],volcanic:['#251e26','#655048','#b28360'],magma:['#301f24','#725045','#b48769'],toxic:['#253b30','#627345','#a4b37a'],ocean:['#123643','#357181','#77b4bb'],gas:['#393248','#7a6e86','#cab1c7'],rogue:['#182b37','#536676','#95b0be']};
        const [edge,bed,light]=palettes[biome]||palettes.forest,fluid=['gas','ocean'].includes(biome);
        const known=new Map(cells.filter(v=>v.visible&&v.kind!=='unknown').map(v=>[v.x+','+v.y,v]));
        const pass=cells.filter(v=>v.visible&&!['unknown','wall'].includes(v.kind));
        const segments=[];for(const v of pass)for(const [dx,dy] of [[1,0],[0,1]]){const n=known.get((v.x+dx)+','+(v.y+dy));if(n&&n.kind!=='wall')segments.push([v,n]);}
        const trace=(color,width)=>{p.strokeStyle=color;p.lineWidth=s*width;p.lineCap='round';p.lineJoin='round';p.beginPath();for(const [a,b]of segments){p.moveTo(g.left+(a.x+.5)*s,g.top+(a.y+.5)*s);p.lineTo(g.left+(b.x+.5)*s,g.top+(b.y+.5)*s);}p.stroke();for(const v of pass)ellipse(p,g.left+(v.x+.5)*s,g.top+(v.y+.5)*s,s*width/2,s*width/2,color);};
        trace('#05141c99',.43);trace(edge,.39);trace(light,.32);trace(bed,.29);
        // Gravel, ice facets or current markings belong to the route itself.
        for(const v of pass){const x=g.left+(v.x+.5)*s,y=g.top+(v.y+.5)*s,r=random(seed+v.x*79+v.y*997);
          for(let i=0;i<13;i++){const a=r()*TAU,d=r()*s*.12;ellipse(p,x+Math.cos(a)*d,y+Math.sin(a)*d,fluid?1.4:.6+r(),.6,i%3?light+'4d':edge+'80');}
          if(!['empty','hazard'].includes(v.kind))ellipse(p,x,y,s*.22,s*.22,null,light+'70');
        }
        if(fluid){p.setLineDash([s*.07,s*.09]);for(const [a,b]of segments)line(p,[[g.left+(a.x+.5)*s,g.top+(a.y+.5)*s],[g.left+(b.x+.5)*s,g.top+(b.y+.5)*s]],light+'a0',1);p.setLineDash([]);}
        this.routeLayer=layer;
      }
      c.drawImage(this.routeLayer,0,0,this.width,this.height);
    }

    draw(now) {
      const c=this.ctx;if(!c||this.dead)return;
      c.clearRect(0,0,this.width,this.height);if(!this.data?.view)return;
      const {view,planet={}}=this.data,biome=view.biome||planet.biome||'forest',theme=THEMES[biome]||THEMES.forest;
      const g=this.geometry(),seed=seedOf(planet.seed||planet.id||planet.name),cells=view.cells||[],s=g.size;
      c.drawImage(this.terrain(theme,biome,seed,g),0,0,this.width,this.height);
      this.routes(c,cells,g,theme,biome,seed);
      for(const cell of cells){
        const px=g.left+(cell.x+.5)*s,py=g.top+(cell.y+.5)*s;
        c.save();c.translate(px,py);c.scale(s/52,s/52);
        if(!cell.visible||cell.kind==='unknown'){
          const fog=this.fog(g),sx=g.left+cell.x*s,sy=g.top+cell.y*s;
          c.drawImage(fog,sx*2,sy*2,s*2,s*2,-26,-26,52.1,52.1);
          if(view.core&&view.core.x===cell.x&&view.core.y===cell.y&&!view.coreRecovered){
            glow(c,0,0,23,'#deac6740');ellipse(c,0,0,14,14,null,'#e4bc8170');
            path(c,[[0,-8],[5,0],[0,8],[-5,0]],'#e7c28b','#ffedba');
          }
        }else{
          if(cell.visited){c.fillStyle='#b2dfd909';c.fillRect(-25,-25,50,50);}
          this.drawObject(c,cell,theme,biome,now,seed,view);
          if(cell.adjacent&&cell.moveAllowed){
            const alpha=this.reduced?.52:.44+Math.sin(now*.0025)*.08;
            c.strokeStyle=`rgba(136,223,221,${alpha})`;c.lineWidth=1;c.fillStyle='rgba(140,236,213,.08)';
            c.beginPath();c.roundRect(-23,-23,46,46,12);c.fill();c.stroke();
            if(cell.kind==='empty'||cell.collected){
              const pos=view.position||this.position,angle=Math.atan2(cell.y-pos.y,cell.x-pos.x);
              c.save();c.rotate(angle);line(c,[[-3,-3.5],[1,0],[-3,3.5]],'#a5e6e59c',1.4);c.restore();
            }
          }
        }
        c.restore();
      }
      this.drawAtmosphere(c,cells,g,biome,now,seed);this.drawTrail(c,cells,g,view);this.drawWeather(c,g,view,now);
      if(this.position){
        const p=this.currentPosition(now),x=g.left+(p.x+.5)*s,y=g.top+(p.y+.5)*s;
        c.save();c.translate(x,y);c.scale(s/52,s/52);this.rover(c,biome,now,view);c.restore();this.drawSignal(c,now,x,y,s);
      }
      if(!this.vignette||this.vignette.w!==this.width||this.vignette.h!==this.height){const vignette=c.createRadialGradient(this.width*.45,this.height*.4,this.width*.22,this.width*.5,this.height*.5,this.width*.77);vignette.addColorStop(0,'#03152300');vignette.addColorStop(1,'#03152320');this.vignette={w:this.width,h:this.height,fill:vignette};}
      c.fillStyle=this.vignette.fill;c.fillRect(0,0,this.width,this.height);
      c.strokeStyle='#7897a23b';c.lineWidth=1;c.strokeRect(g.left+.5,g.top+.5,g.columns*s-1,g.rows*s-1);
    }

    drawTrail(c, cells, g, view) {
      if (!Array.isArray(view.trail) || view.trail.length < 2) return;
      const known = new Set(cells.filter(cell => cell.visible).map(cell => `${cell.x},${cell.y}`));
      c.save(); c.setLineDash([2, 5]); c.strokeStyle = '#b1d3c637'; c.lineWidth = 1;
      for (let i = 1; i < view.trail.length; i++) { const a = view.trail[i - 1], b = view.trail[i]; if (Math.abs(a.x-b.x)+Math.abs(a.y-b.y)!==1 || !known.has(`${a.x},${a.y}`) || !known.has(`${b.x},${b.y}`)) continue; line(c, [[g.left + (a.x + .5) * g.size, g.top + (a.y + .5) * g.size], [g.left + (b.x + .5) * g.size, g.top + (b.y + .5) * g.size]], c.strokeStyle, 1); }
      c.restore();
    }

    drawObject(c, cell, theme, biome, now, seed, view) {
      const rnd = random(seed + cell.x * 139 + cell.y * 1009), kind = cell.kind;
      if (cell.collected && !['base', 'wall'].includes(kind)) {
        ellipse(c, 0, 5, 10, 4.5, '#08233366', '#95b6b82c');
        line(c, [[-3, 3], [-.4, 5.5], [5, .5]], '#b2dfb787', 1.1); return;
      }
      // Crystal cliffs are barriers, not the same collectible crystal sprite.
      if(kind==='wall'&&biome==='crystal'){
        [[-12,7,13],[10,5,15],[-2,-7,17]].forEach(([x,y,size],i)=>rock(c,x,y,size,{...theme,rock:'#75617c',shadow:'#302a40'},seed+cell.x*71+cell.y*83+i));
        line(c,[[-18,9],[-7,-4],[4,8],[15,-9]],'#b4a0c25c',1.4);return;
      }
      if(window.OrbitArt?.ready('fieldSprites')){
        let index=({base:2,core:3,beacon:6,ore:4,crystal:5,data:6,wall:WALL_ART[biome]??7})[kind];

        if(kind==='base'&&['gas','ocean'].includes(biome))index=1;
        if(index!==undefined){
          if(kind==='core'&&view.coreRecovered){ellipse(c,0,7,14,6,'#162d35','#b6dcca');line(c,[[-4,5],[0,9],[7,1]],'#b6edca',2);return;}
          ellipse(c,1,15,18,6,'#03141e70');
          if(['core','beacon','crystal','data','base'].includes(kind))glow(c,0,1,25,kind==='core'?'#f4c37540':'#6bded52e');
          const bob=kind==='core'&&!this.reduced?Math.sin(now*.002)*1.2:0;
          c.save();if(kind==='hazard'&&biome==='ocean')c.filter='hue-rotate(145deg) saturate(.7)';sprite(c,index,0,-1+bob,kind==='wall'?53:kind==='base'?40:36);c.restore();
          if(['ore','crystal','data'].includes(kind)){
            const label={ore:'Minério',crystal:'Cristais',data:'Dados'}[kind];
            c.fillStyle='#102c32ed';c.strokeStyle='#a3dad4';c.lineWidth=.6;c.beginPath();c.roundRect(-22,15,44,12,4);c.fill();c.stroke();c.fillStyle='#edfff3';c.textAlign='center';c.font='bold 8px sans-serif';c.fillText(label,0,23.5);
          }
          return;
        }
      }
      if (kind === 'base') {
        glow(c, 0, 2, 27, '#86dce024'); ellipse(c, 0, 5, 20, 13, '#123440', '#92d9d477'); ellipse(c, 0, 5, 16, 10, null, '#92d9d438');
        for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; ellipse(c, Math.cos(a) * 18, 5 + Math.sin(a) * 11, 1.3, 1.1, '#aeebdc'); }
        if (['gas', 'ocean'].includes(biome)) {
          line(c, [[-9, 8], [0, -11], [9, 8]], '#9faeac', 2); line(c, [[0, -11], [0, 9]], '#566b76', 2.6);
          path(c, [[-6, -10], [0, -16], [6, -10], [0, -6]], '#d0ddd0', '#e5e5cc70'); ellipse(c, 0, -11, 2.5, 1.5, '#91e4de');
        } else {
          ellipse(c, 2, 8, 8, 4, '#07192288'); path(c, [[-4, -9], [-9, 7], [-5, 9], [0, 3], [5, 9], [9, 7], [4, -9]], '#e79868');
          const metal = c.createLinearGradient(-5, 0, 5, 0); metal.addColorStop(0, '#9facb0'); metal.addColorStop(.4, '#edf0dc'); metal.addColorStop(1, '#738992');
          path(c, [[0, -18], [5, -9], [5, 7], [-5, 7], [-5, -9]], metal, '#e4ead659', .7); ellipse(c, 0, -6, 2.3, 3, '#1e5364', '#9ee4e2'); line(c, [[-4, 3], [4, 3]], '#e99b70', 2);
        }
      } else if (kind === 'core') {
        const recovered = view.coreRecovered;
        glow(c, 0, -2, 27, recovered ? '#8cbab520' : '#e4b07542'); ellipse(c, 0, 10, 17, 6, '#091a2877');
        path(c, [[-15, 5], [0, -3], [15, 5], [15, 9], [0, 17], [-15, 9]], '#324953', '#c6c9a532');
        path(c, [[-15, 5], [0, -3], [15, 5], [0, 13]], '#5a6e71', '#bcc1a961');
        for (const [x, y, h] of [[-10, 0, 13], [10, 0, 13], [0, 8, 8]]) {
          path(c, [[x - 3, y + 4], [x - 3, y - h], [x, y - h - 3], [x + 3, y - h], [x + 3, y + 4]], '#809a98', '#d5dec958', .7); line(c, [[x, y - h + 1], [x, y]], '#edd7ac', 1);
        }
        if (!recovered) { const bob = this.reduced ? 0 : Math.sin(now * .0028) * 1.2; path(c, [[0, -17 + bob], [7, -8 + bob], [0, -1 + bob], [-7, -8 + bob]], '#eac88b', '#fff0be'); path(c, [[0, -17 + bob], [0, -1 + bob], [-7, -8 + bob]], '#91d8d5'); ellipse(c, 0, -8 + bob, 2, 2, '#eafde8'); }
      } else if (kind === 'ore') {
        [[-8, 5, 10], [7, 7, 9], [0, -3, 10]].forEach(([x, y, s], i) => { rock(c, x, y, s, { ...theme, rock: '#a88b6b', shadow: '#53605f' }, seed + i); line(c, [[x - 3, y + 1], [x + 1, y - 3], [x + 4, y - 2]], '#ffc384b0', 1.1); });
      } else if (kind === 'crystal') {
        ellipse(c, 0, 10, 15, 5, '#12233988'); glow(c, 0, 1, 19, '#b695ef2e');
        for (const [x, y, h, w] of [[-9, 7, 14, 4], [7, 7, 18, 5], [0, 10, 28, 6]]) {
          path(c, [[x - w, y], [x - w, y - h + 6], [x, y - h], [x + w, y - h + 6], [x + w, y], [x, y + 3]], '#9a91c8', '#d4caedb3', .7);
          path(c, [[x, y - h], [x + w, y - h + 6], [x + w, y], [x, y + 3]], '#5e729b'); line(c, [[x, y - h + 2], [x, y]], '#e7d8efc9', .8);
        }
      } else if (kind === 'data') {
        ellipse(c, 1, 10, 14, 5, '#091b2788'); path(c, [[-10, -6], [6, -11], [12, -6], [12, 10], [-4, 15], [-10, 10]], '#546e76', '#92b7b84c');
        path(c, [[-10, -6], [6, -11], [12, -6], [-4, -1]], '#91a7a5'); path(c, [[-4, -1], [12, -6], [12, 10], [-4, 15]], '#284654');
        path(c, [[-1, 2], [9, -1], [9, 6], [-1, 9]], '#8ed9d0', '#c5f7dd'); line(c, [[0, 4], [3, 5], [7, 1]], '#285e6e', 1); line(c, [[-7, 3], [-7, 8]], '#f0b682', 1.5); glow(c, 4, 4, 14, '#8ddccc23');
      } else if (kind === 'wall') {
        if (biome === 'gas') {
          for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(0, 1, 7 + i * 4, 2 + i * 2, -.35, 0, TAU * .77); c.strokeStyle = i % 2 ? '#d7c2a145' : '#241f3388'; c.lineWidth = 2; c.stroke(); }
          line(c, [[-5, -9], [3, -2], [-2, 4], [6, 12]], '#e9d5aa7a', 1.3);
        } else {
          [[-11, 7, 11], [9, 6, 14], [-2, -4, 15]].forEach(([x, y, size], i) => rock(c, x, y, size, theme, seed + i + cell.x + cell.y * 3));
          if (biome === 'forest') for (const [x, y] of [[-9, -3], [7, 2]]) { ellipse(c, x, y, 8, 5, '#426c59'); ellipse(c, x - 1, y - 2, 5, 3.5, '#69815d'); }
        }
      } else if (kind === 'hazard') {
        glow(c, 0, 2, 24, ['ice', 'rogue', 'ocean'].includes(biome) ? '#719bcc30' : '#ed8b5c29');
        if (['gas', 'ocean', 'toxic'].includes(biome)) {
          for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(0, 2, 8 + i * 5, 3 + i * 3, -.2, .3 + i, TAU + i - .5); c.strokeStyle = biome === 'toxic' ? '#cfdb8c70' : '#b0cbd06b'; c.lineWidth = 1.6; c.stroke(); }
          ellipse(c, 0, 2, 6, 3, '#092638a8');
        } else {
          path(c, [[-20, -14], [-8, -5], [-12, 5], [1, 9], [10, 19], [8, 5], [-4, 2], [1, -7]], '#091b28');
          line(c, [[-18, -13], [-6, -5], [-9, 3], [3, 7], [10, 19]], ['ice', 'rogue'].includes(biome) ? '#9fc9df94' : '#efa16fbb', 1.4);
          line(c, [[-4, 2], [3, -2], [12, 0]], '#e5b49475', .8);
        }
        const cost=cell.traversalCost;
        if(cost){c.fillStyle='#251b15ed';c.strokeStyle='#e7ae76';c.lineWidth=.7;c.beginPath();c.roundRect(-24,15,48,12,4);c.fill();c.stroke();c.font='bold 7px sans-serif';c.textAlign='center';c.fillStyle='#ffe1b3';c.fillText('−'+cost.reserve+' E · −'+cost.integrity+' INT',0,23.5);}

      }
    }

    drawWeather(c,g,view,now){
      const weather=view.weather;if(!weather?.rigorous)return;
      const strength=weather.active?1:weather.warning?.35:.08;
      const t=this.reduced?0:now*.001,biome=view.biome,color=({ice:'#e3f7ff',magma:'#ffbb6f',volcanic:'#efbca3',gas:'#ebc894',toxic:'#b4ec88',ocean:'#98f1ed',desert:'#efc086'})[biome]||'#bedee5';
      c.save();c.beginPath();c.rect(g.left,g.top,g.size*g.columns,g.size*g.rows);c.clip();
      const r=random(773);for(let i=0;i<42;i++){
        const x=(r()*this.width+t*(weather.active?54:16)+this.width)%this.width,y=(r()*this.height+t*11)%this.height;
        c.globalAlpha=strength*(.14+r()*.4);
        if(biome==='ice')ellipse(c,x,y,1.2,1.2,color);
        else line(c,[[x,y],[x-5-r()*14,y+2]],color,biome==='magma'?1.4:.8);
      }
      c.globalAlpha=strength*.12;c.strokeStyle=color;c.lineWidth=12;
      for(let i=0;i<3;i++){const y=((t*20+i*this.height/3)%this.height);c.beginPath();c.moveTo(-10,y);c.bezierCurveTo(this.width*.3,y-20,this.width*.6,y+30,this.width+10,y-10);c.stroke();}
      c.restore();
    }

    drawAtmosphere(c,cells,g,biome,now,seed){
      if(this.reduced)return;
      const r=random(seed),known=new Set(cells.filter(v=>v.visible&&v.kind!=='unknown').map(v=>v.x+','+v.y));
      c.save();
      for(let i=0;i<15;i++){
        const x=(r()*this.width+Math.sin(now*.00025+i)*8+this.width)%this.width;
        const y=(r()*this.height-now*(biome==='ocean'?.004:.0015)+this.height*100)%this.height;
        if(!known.has(Math.floor((x-g.left)/g.size)+','+Math.floor((y-g.top)/g.size)))continue;
        c.globalAlpha=.16+Math.sin(now*.001+i)**2*.35;
        const color=['magma','volcanic'].includes(biome)?'#ffba63':biome==='forest'?'#c7f79a':'#bce9ee';
        ellipse(c,x,y,i%3===0?1.2:.7,i%3===0?1.2:.7,biome==='ocean'?null:color,biome==='ocean'?color:null);
      }
      c.restore();
    }

    rover(c, biome, now, view) {
      if(window.OrbitArt?.ready('fieldSprites')){
        const probe=['ocean','gas'].includes(biome),bob=this.reduced?0:Math.sin(now*.003)*(probe?1:.25);
        glow(c,0,0,26,'#8aede636');ellipse(c,0,16,17,6,'#00121b99');
        c.save();if(Math.sin(this.heading)<-.1)c.scale(-1,1);sprite(c,probe?1:0,0,-3+bob,48);c.restore();
        c.strokeStyle=view.integrity<view.maxIntegrity*.3?'#ffb284':'#b4f7e8';c.lineWidth=1.4;c.beginPath();c.ellipse(0,17,20,7,0,.15,Math.PI-.15);c.stroke();
        if(view.coreRecovered){glow(c,13,-15,9,'#ffd47b55');path(c,[[13,-20],[17,-15],[13,-10],[9,-15]],'#ffe0a1','#fff8dd');}
        return;
      }

      const probe = ['ocean', 'gas'].includes(biome), bob = probe && !this.reduced ? Math.sin(now * .003) * .7 : 0;
      glow(c, 0, 0, 24, '#9de7e426'); ellipse(c, 2, 11, 14, 7, '#00142388');
      c.save(); c.translate(0, bob); c.rotate(this.heading);
      if (probe) {
        for (const side of [-1, 1]) { line(c, [[side * 5, 1], [side * 12, 3]], '#b7c8c3', 2.7); ellipse(c, side * 13, 4, 4, 8, '#617d89', '#bfd3cc'); ellipse(c, side * 13, 8, 2.5, 2, '#82dddf'); }
        const g = c.createLinearGradient(-8, 0, 8, 0); g.addColorStop(0, '#8ba5ae'); g.addColorStop(.35, '#e6ebe0'); g.addColorStop(1, '#728d97'); ellipse(c, 0, 0, 7.5, 15, g, '#e0e9dba3');
        ellipse(c, 0, -6, 4, 5, '#234c62', '#a6e5e1'); ellipse(c, -1, -7, 1.4, 2, '#81bec8'); line(c, [[-5, 5], [5, 5]], '#e7a77a', 2.5);
      } else {
        for (const x of [-10, 10]) for (const y of [-7, 6]) { c.fillStyle = '#112733'; c.fillRect(x - 3, y - 4, 6, 9); line(c, [[x - 2, y - 2], [x + 2, y - 2]], '#8ca5a4', 1); line(c, [[x - 2, y + 1], [x + 2, y + 1]], '#718b91', .8); }
        line(c, [[-10, -7], [10, -7]], '#8a9fa1', 2.2); line(c, [[-10, 7], [10, 7]], '#8a9fa1', 2.2);
        const metal = c.createLinearGradient(-8, -7, 7, 9); metal.addColorStop(0, '#f0efda'); metal.addColorStop(.55, '#bacbc5'); metal.addColorStop(1, '#6e8a98');
        path(c, [[-6, -12], [6, -12], [9, -5], [8, 11], [-8, 11], [-9, -5]], metal, '#d6e8e28c', .8);
        path(c, [[-5, -8], [5, -8], [6, -1], [-6, -1]], '#284d5e', '#759ba67a'); line(c, [[-4, -6], [1, -6]], '#9ddfdc', 1);
        line(c, [[-6, 5], [6, 5]], '#e6a77e', 3); line(c, [[-4, 9], [4, 9]], '#546d79', 1);
        line(c, [[7, 0], [15, -5], [13, -11], [17, -13]], '#d3ddcf', 2); ellipse(c, 15, -5, 2, 2, '#617f89', '#c3d2c6');
        line(c, [[-3, -10], [-5, -19]], '#becdc3', 1); ellipse(c, -5, -19, 1.5, 1.5, '#a9f0da');
      }
      for (const x of [-4, 4]) { ellipse(c, x, -11, 1.5, .9, '#e0f6df'); glow(c, x, -13, 6, '#c4f8da39'); }
      if (view.coreRecovered) { path(c, [[0, 1], [4, 5], [0, 9], [-4, 5]], '#eaca91', '#fff0bf'); }
      c.restore();
      const warning = Number(view.integrity) < Number(view.maxIntegrity || 100) * .3;
      c.strokeStyle = warning ? '#f2a5809c' : '#8ddddb9c'; c.lineWidth = .8; c.beginPath(); c.ellipse(0, 13, 18, 7.5, 0, .13, Math.PI * .88); c.stroke();
    }

    drawSignal(c, now, x, y, size) {
      if (!this.signal) return;
      const t = (now - this.signal.start) / 950;
      if (t >= 1 || this.reduced) { this.signal = null; return; }
      c.save(); c.globalAlpha = Math.pow(1 - t, 2); c.lineWidth = 1.7;
      c.strokeStyle = /damage|hazard|hit/.test(this.signal.kind) ? '#f0a079' : /core|recover|collect/.test(this.signal.kind) ? '#f8d393' : '#a4e5dd';
      c.beginPath(); c.arc(x, y, size * (.3 + t * 2.6), 0, TAU); c.stroke(); c.restore();
    }

    destroy() {
      this.dead = true; this.stop(); this.resizeObserver?.disconnect(); this.intersection?.disconnect();
      this.media.removeEventListener?.('change', this.onReduce); document.removeEventListener('visibilitychange', this.onVisibility);
      for(const key of ['fieldTerrain','fieldSprites'])window.OrbitArt?.images[key]?.removeEventListener('load',this.onArtReady);
      this.canvas.removeEventListener('pointerup', this.onPointer); this.data = null; this.cache = null; this.fogCache=null;this.routeLayer=null;
    }
  }

  window.OrbitExpeditionScene = OrbitExpeditionScene;
})();
