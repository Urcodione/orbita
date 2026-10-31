(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const color = hex => {
    if (Array.isArray(hex)) return hex;
    const h = String(hex || '#f08b54').replace('#', '');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) || 0);
  };
  const rgb = (c, k = 1) => `rgb(${c.map(v => Math.round(clamp(v * k, 0, 255))).join(',')})`;
  const mix = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
  const seedOf = v => String(v || 'auralis').split('').reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
  function random(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(x, y, z) { let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1442695041); n = Math.imul(n ^ n >>> 13, 1274126177); return ((n ^ n >>> 16) >>> 0) / 4294967295; }
  function noise(x, y, z) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    let u = x - ix, v = y - iy, w = z - iz;
    u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v); w = w * w * (3 - 2 * w);
    return lerp(lerp(lerp(hash(ix, iy, iz), hash(ix + 1, iy, iz), u), lerp(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), u), v), lerp(lerp(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), u), lerp(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), u), v), w);
  }
  function fbm(x, y, z) { return noise(x, y, z) * .57 + noise(x * 2.1, y * 2.1, z * 2.1) * .27 + noise(x * 4.3, y * 4.3, z * 4.3) * .11 + noise(x * 9.1, y * 9.1, z * 9.1) * .05; }

  const PALETTES = {
    forest: { low: [17, 69, 104], high: [71, 145, 111], peak: [185, 186, 126], glow: '#80e2e5' },
    ocean: { low: [17, 68, 113], high: [39, 130, 145], peak: [173, 190, 160], glow: '#73cce9' },
    volcanic: { low: [52, 34, 42], high: [107, 63, 54], peak: [214, 96, 47], glow: '#ec976a' },
    ice: { low: [71, 111, 145], high: [155, 187, 200], peak: [220, 231, 224], glow: '#b0e7f1' },
    desert: { low: [113, 64, 48], high: [180, 129, 79], peak: [210, 174, 118], glow: '#f0be8a' },
    crystal: { low: [54, 45, 106], high: [114, 90, 146], peak: [166, 155, 205], glow: '#baa0f5' },
    gas: { low: [143, 98, 77], high: [211, 180, 137], peak: [233, 211, 177], glow: '#e4c59d' },
    magma: { low: [114, 35, 26], high: [226, 83, 29], peak: [255, 187, 76], glow: '#ff9751' },
    toxic: { low: [38, 79, 66], high: [111, 145, 76], peak: [190, 192, 111], glow: '#c0d88a' },
    rogue: { low: [27, 39, 63], high: [70, 101, 128], peak: [117, 150, 163], glow: '#789dbb' }
  };

  function createPlanet(planet, size = 400) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    const data = ctx.createImageData(size, size), pixels = data.data;
    const seed = seedOf(planet.seed || planet.id || planet.name) % 8000;
    const biome = planet.biome || (planet.medium === 'gas' ? 'gas' : 'forest');
    const palette = PALETTES[biome] || PALETTES.forest;
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const x = (px + .5 - size / 2) / (size / 2 - 1), y = (py + .5 - size / 2) / (size / 2 - 1), r2 = x * x + y * y;
        if (r2 >= 1) continue;
        const z = Math.sqrt(1 - r2), latitude = Math.asin(y), longitude = Math.atan2(x, z);
        const terrain = fbm(x * 3.5 + seed, y * 3.5 + 47, z * 3.5 + 63);
        const fine = noise(x * 57 + seed, y * 57 + 53, z * 57 + 78);
        let c, emission = 0;
        if (biome === 'gas') {
          const bend = noise(x * 4.4 + seed, y * 6, z * 4.4) * 3.6 + Math.sin(longitude * 4) * .25;
          const bands = .5 + .5 * Math.sin(latitude * 29 + bend);
          c = mix(palette.low, palette.high, bands);
          c = mix(c, palette.peak, clamp((Math.sin(latitude * 54 + bend * 1.5) - .4) * .9, 0, .55));
          const dx = (x - .20) * 1.25, dy = (y - .18) * 2.3, r = Math.hypot(dx, dy);
          if (r < .34) {
            const vortex = .5 + .5 * Math.sin(Math.atan2(dy, dx) * 2 + r * 42);
            c = mix(c, mix([133, 73, 55], [219, 151, 103], vortex), clamp((.34 - r) * 14, 0, .85));
          }
        } else if (biome === 'ocean') {
          c = mix([12, 47, 83], [42, 128, 152], clamp((terrain - .22) * 1.9, 0, 1));
          const wave = Math.pow(.5 + .5 * Math.sin(longitude * 92 + latitude * 31 + terrain * 8), 15);
          c = mix(c, [82, 169, 183], wave * .17);
          const specular = Math.pow(Math.max(0, x * -.35 + y * -.42 + z * .836), 32);
          c = mix(c, [180, 222, 225], specular * .36);
          const dx = x + .28, dy = (y + .22) * 1.2, r = Math.hypot(dx, dy);
          const spiral = Math.pow(.5 + .5 * Math.sin(Math.atan2(dy, dx) * 3 - r * 31), 5);
          const cyclone = r > .025 && r < .39 ? spiral * Math.sin((r - .025) / .365 * Math.PI) * .62 : 0;
          c = mix(c, [217, 230, 226], cyclone);
        } else if (biome === 'magma') {
          const flow = .5 + .5 * Math.sin(longitude * 10 + latitude * 7 + terrain * 19);
          c = mix([154, 34, 23], [254, 157, 48], Math.pow(flow, .72));
          const crust = noise(x * 8 + seed + terrain * 4, y * 8 + terrain * 3, z * 8 + 4);
          c = mix(c, [41, 28, 31], clamp((crust - .55) * 4.8, 0, .86));
          if (flow > .91) c = mix(c, [255, 198, 87], (flow - .91) * 4);
          emission = .34 + flow * .30;
        } else if (biome === 'toxic') {
          const clouds = fbm(x * 6 + seed + 17, y * 4.5, z * 6 + 30);
          c = mix(palette.low, palette.high, clamp((terrain - .22) * 2.3, 0, 1));
          c = mix(c, palette.peak, clamp((clouds - .40) * 3.3, 0, .87));
          const ribbons = .5 + .5 * Math.sin(latitude * 28 + clouds * 10);
          c = mix(c, [193, 202, 128], Math.pow(ribbons, 7) * .17);
        } else if (biome === 'forest') {
          const coast = .49;
          c = terrain < coast ? mix(palette.low, [53, 112, 123], clamp(terrain / coast, 0, 1) * .42) : mix(palette.high, palette.peak, clamp((terrain - coast) * 3.6, 0, 1));
          if (terrain >= coast && terrain < coast + .018) c = mix(c, [210, 194, 139], .60);
          if(terrain < coast && terrain > coast-.026)c=mix(c,[55,164,171],.52);
        } else {
          c = mix(palette.low, palette.high, clamp((terrain - .22) * 2.4, 0, 1));
          if (terrain > .60) c = mix(c, palette.peak, clamp((terrain - .60) * 4, 0, 1));
        }
        if (biome === 'volcanic' && Math.abs(noise(x * 12 + seed, y * 12, z * 12) - .51) < .018 && terrain > .52) { c = mix(c, [252, 123, 48], .8); emission = .21; }
        if ((biome === 'ice' || biome === 'rogue') && Math.abs(noise(x * 17 + seed, y * 17, z * 17) - .5) < .022) c = mix(c, biome === 'rogue' ? [83, 135, 160] : [79, 147, 178], .4);
        if (!['gas', 'magma', 'toxic', 'rogue'].includes(biome)) {
          const clouds = fbm(x * 5.6 + seed + 30, y * 4.2 + 60, z * 5.6 + 100);
          const cloudAmount = biome === 'volcanic' ? .1 : biome === 'desert' ? .13 : biome === 'ocean' ? .38 : .68;
          c = mix(c, [220, 229, 222], clamp((clouds - .51) * 5.4, 0, .85) * cloudAmount);
        }
        const light = Math.max(0, x * -.63 + y * -.49 + z * .60);
        let illumination = .12 + .98 * Math.pow(light, .67);
        if (biome === 'rogue') illumination = .21 + .44 * Math.pow(light, .8);
        illumination = Math.max(illumination, emission);
        const rim = Math.pow(1 - z, 2.6) * Math.max(0, light) * (biome === 'rogue' ? .20 : .40);
        c = mix(c, color(palette.glow), rim);
        const idx = (py * size + px) * 4;
        pixels[idx] = clamp(c[0] * illumination + (fine - .5) * 7, 0, 255);
        pixels[idx + 1] = clamp(c[1] * illumination + (fine - .5) * 7, 0, 255);
        pixels[idx + 2] = clamp(c[2] * illumination + (fine - .5) * 7, 0, 255);
        pixels[idx + 3] = clamp((1 - Math.sqrt(r2)) * size * 1.2, 0, 1) * 255;
      }
    }
    ctx.putImageData(data, 0, 0);
    return canvas;
  }

  function createWeather(planet) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=160;
    const c=canvas.getContext('2d'),im=c.createImageData(160,160),seed=seedOf(planet.id||planet.name)%6000;
    for(let y=0;y<160;y++)for(let x=0;x<160;x++){
      const nx=(x-79.5)/79,ny=(y-79.5)/79,r=nx*nx+ny*ny;if(r>=1)continue;
      const z=Math.sqrt(1-r),cloud=fbm(nx*5+seed,ny*4+19,z*5+43);
      const light=Math.max(0,-nx*.63-ny*.49+z*.60);
      const a=clamp((cloud-.54)*5,0,.48)*light*Math.min(1,(1-r)*16);
      const i=(y*160+x)*4;im.data.set([209,237,232,Math.round(a*255)],i);
    }
    c.putImageData(im,0,0);return canvas;
  }

  function galaxyStamp(node) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 224;
    const c = canvas.getContext('2d'), rand = random(seedOf(node.id || node.name)), rawKind = String(node.kind || 'spiral').toLowerCase();
    const kind = ({ verdant: 'spiral', forge: 'elliptical', abyss: 'nebula' })[rawKind] || rawKind;
    if (!c) return canvas;
    const tint = color(node.color || '#90b7dc');
    c.translate(112, 112); c.rotate(-.35 + rand() * .65);
    const glow = c.createRadialGradient(0, 0, 0, 0, 0, 106); glow.addColorStop(0, 'rgba(151,185,205,.14)'); glow.addColorStop(1, 'rgba(60,100,150,0)'); c.fillStyle = glow; c.fillRect(-112, -112, 224, 224);
    c.scale(1, kind.includes('neb') || kind.includes('irreg') ? .85 : .62);
    for (let i = 0; i < 950; i++) {
      const r = Math.pow(rand(), kind.includes('ellip') ? 1.1 : .5) * 97;
      let angle = (i % 3) * TAU / 3 + r * .032 + rand() * .62;
      if (kind.includes('ellip')) angle = rand() * TAU;
      if (kind.includes('neb') || kind.includes('irreg')) angle = (i % 4) * TAU / 4 + rand() * 1.5 + Math.sin(r * .03);
      const x = Math.cos(angle) * r, y = Math.sin(angle) * r, bright = rand();
      c.fillStyle = bright > .84 ? 'rgba(239,217,185,.65)' : `rgba(${tint[0]},${tint[1]},${tint[2]},${.10 + bright * .40})`;
      c.beginPath(); c.arc(x, y, .4 + rand() * 1.9, 0, TAU); c.fill();
      if (i % 7 === 0) { c.globalAlpha = .13; c.beginPath(); c.arc(x, y, 5 + rand() * 4, 0, TAU); c.fill(); c.globalAlpha = 1; }
    }
    const core = c.createRadialGradient(-2, -1, 0, 0, 0, kind.includes('neb') ? 34 : 28); core.addColorStop(0, 'rgba(255,243,217,.96)'); core.addColorStop(.18, 'rgba(248,218,177,.76)'); core.addColorStop(.5, 'rgba(216,188,162,.24)'); core.addColorStop(1, 'rgba(169,166,181,0)'); c.fillStyle = core; c.fillRect(-40, -40, 80, 80);
    return canvas;
  }

  // The rocket is built as a real assembly: pressure shell, bulkheads,
  // sockets and eight removable instruments share the same 3D coordinates.
  function makeShip(accent, modules, resources = {}) {
    const faces = [], glows = [], jets = [], mounts = {};
    const WHITE = [224, 230, 219], LIGHT = [249, 240, 211], GRAY = [99, 139, 151], METAL = [39, 72, 88], DARK = [15, 35, 49], PAINT = color(accent);
    const moduleMap = Array.isArray(modules) ? Object.fromEntries(modules.map(m => [m.type || m.slot || m.id, m])) : modules || {};
    const rarityColor = { common: '#a5ccd2', uncommon: '#7ee5b3', rare: '#77bbff', epic: '#c9a1ff', legendary: '#ffc773' };
    let tag = {}, origin = [0, 0, 0];
    function face(vertices, c, opts = {}) {
      const v = vertices.map(p => p.map((n, i) => n + origin[i]));
      const u = v[1].map((n, i) => n - v[0][i]), w = v[2].map((n, i) => n - v[0][i]);
      let normal = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      const length = Math.hypot(...normal) || 1; normal = normal.map(n => n / length);
      faces.push({ v, c, normal, ...tag, ...opts });
    }
    function box(x, y, z, sx, sy, sz, c, bevel = 2) {
      const a = sx / 2, b = sy / 2, q = Math.min(bevel, a / 2, b / 2);
      const ring = [[-a + q, -b], [a - q, -b], [a, -b + q], [a, b - q], [a - q, b], [-a + q, b], [-a, b - q], [-a, -b + q]];
      const bot = ring.map(p => [x + p[0], y + p[1], z]);
      const top = ring.map(p => [x + p[0] * .96, y + p[1] * .96, z + sz]);
      face(top, c); face([...bot].reverse(), mix(c, DARK, .25));
      for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; face([bot[j], bot[i], top[i], top[j]], c); }
    }
    function tube(z0, z1, r0, r1, c, opts = {}, steps = 96, x = 0, y = 0) {
      for (let i = 0; i < steps; i++) {
        const a = i * TAU / steps, b = (i + 1) * TAU / steps, mid = (a + b) / 2;
        const shell = opts.openable && Math.sin(mid) > -.01 ? (Math.cos(mid) >= 0 ? 1 : -1) : 0;
        face([[x + Math.cos(a) * r0, y + Math.sin(a) * r0, z0], [x + Math.cos(b) * r0, y + Math.sin(b) * r0, z0], [x + Math.cos(b) * r1, y + Math.sin(b) * r1, z1], [x + Math.cos(a) * r1, y + Math.sin(a) * r1, z1]], c, { smooth: true, stroke: false, ...opts, shell });
      }
    }
    function cylinderZ(x, y, z, height, radius, c, steps = 12) {
      tube(z, z + height, radius, radius, c, {}, steps, x, y);
      face(Array.from({ length: steps }, (_, i) => [x + Math.cos(i * TAU / steps) * radius, y + Math.sin(i * TAU / steps) * radius, z + height]), c);
    }
    function cylinderY(x, y, z, length, radius, c, steps = 16, opts = {}) {
      const a = [], b = [];
      for (let i = 0; i < steps; i++) { const t = i / steps * TAU; a.push([x + Math.cos(t) * radius, y, z + Math.sin(t) * radius]); b.push([x + Math.cos(t) * radius, y + length, z + Math.sin(t) * radius]); }
      for (let i = 0; i < steps; i++) { const j = (i + 1) % steps; face([a[i], a[j], b[j], b[i]], c, opts); }
      face(b, c, opts);
    }
    function rod(a, b, r, c, steps = 8) {
      const d = b.map((n, i) => n - a[i]), length = Math.hypot(...d) || 1, n = d.map(v => v / length);
      let u = Math.abs(n[2]) < .9 ? [-n[1], n[0], 0] : [1, 0, 0]; const ul = Math.hypot(...u); u = u.map(v => v / ul);
      const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
      const ring = p => Array.from({ length: steps }, (_, i) => p.map((q, k) => q + r * (u[k] * Math.cos(i * TAU / steps) + v[k] * Math.sin(i * TAU / steps))));
      const aa = ring(a), bb = ring(b); face(bb, c); for (let i = 0; i < steps; i++) { const j = (i + 1) % steps; face([aa[i], aa[j], bb[j], bb[i]], c); }
    }
    function ringY(x, y, z, radius, thickness, c) {
      for (let i = 0; i < 24; i++) {
        const a = i * TAU / 24, b = (i + 1) * TAU / 24;
        face([[x + Math.cos(a) * radius, y, z + Math.sin(a) * radius], [x + Math.cos(b) * radius, y, z + Math.sin(b) * radius], [x + Math.cos(b) * (radius - thickness), y + 1.4, z + Math.sin(b) * (radius - thickness)], [x + Math.cos(a) * (radius - thickness), y + 1.4, z + Math.sin(a) * (radius - thickness)]], c, { emissive: true });
      }
    }
    function crystal(x, y, z, size, c) {
      const q = [[x - size, y, z], [x, y - size * .6, z], [x + size, y, z], [x, y + size * .6, z]];
      q.forEach((p, i) => { face([p, q[(i + 1) % 4], [x, y, z + size * 1.6]], c); face([q[(i + 1) % 4], p, [x, y, z - size * .65]], mix(c, METAL, .2)); });
    }
    // Andorinha: a pear-shaped ceramic cabin, panoramic visor and two swept nacelles.
    // Doors and fittings retain the original assembly coordinates and interaction contract.
    const profile = [[-106,25],[-98,33],[-78,39],[-48,44],[-12,46],[24,46],[58,43],[88,37],[104,30]];
    tag = { structure: true, hull: true };
    for(let i=0;i<profile.length-1;i++) tube(profile[i][0],profile[i+1][0],profile[i][1],profile[i+1][1],WHITE,{openable:true});
    tube(-100,-94,32,35,PAINT,{openable:true});
    tube(83,89,38.5,37,PAINT,{openable:true});
    // Warm metallic seam follows the doors, without a wireframe across the hull.
    [-54,43].forEach(z=>tube(z,z+.65,z<0?43.3:44.5,z<0?43.3:44.5,mix(GRAY,WHITE,.42),{openable:true}));
    tag = { structure: true };
    const nose=[[103,30],[114,27],[125,22],[134,16],[140,9],[142,1]];
    for(let i=0;i<nose.length-1;i++)tube(nose[i][0],nose[i+1][0],nose[i][1],nose[i+1][1],LIGHT);
    // The canopy is a sculpted panoramic lens, not a porthole drawn over the cabin.
    function lens(cx,cy,cz,rx,depth,rz,paint,opts={}) {
      const rings=16,steps=64;
      for(let row=0;row<rings;row++)for(let i=0;i<steps;i++){
        const point=(r,k)=>{const phi=r/rings*Math.PI/2,theta=k/steps*TAU;return [cx+rx*Math.sin(phi)*Math.cos(theta),cy+depth*Math.cos(phi),cz+rz*Math.sin(phi)*Math.sin(theta)];};
        face([point(row,i),point(row+1,i),point(row+1,i+1),point(row,i+1)],paint,{smooth:true,stroke:false,...opts});
      }
    }
    lens(0,24,108,26,15,25,METAL);
    lens(0,26,109,22,15,21,[27,123,146],{glass:true});
    // Reflection ribbons are painted onto the curved glass and move with the camera.
    face([[-15,37,111],[-13,36,121],[-5,40,126],[-8,41,118]], [190,242,234], {emissive:true,alpha:.65,stroke:false});
    face([[-8,41,118],[-5,40,126],[0,41,127],[-2,42,119]], [220,249,230], {emissive:true,alpha:.40,stroke:false});
    for(const side of [-1,1]){
      // Swept, layered wings with copper leading edges.
      const poly=[[32,-37],[47,-55],[72,-111],[67,-128],[48,-111],[29,-84]];
      const front=poly.map(([x,z])=>[x*side,8,z]),back=poly.map(([x,z])=>[x*side,-5,z]);
      face(front,PAINT,{stroke:false});face(back,GRAY,{stroke:false});
      for(let i=0;i<poly.length;i++){let j=(i+1)%poly.length;face([front[i],back[i],back[j],front[j]],i===0?LIGHT:METAL,{stroke:false});}
      face([[side*39,9,-56],[side*48,9,-64],[side*64,9,-107],[side*57,9,-112]],WHITE,{stroke:false});
      // Tapered side engines give the silhouette its own identity.
      const pod=[[-112,10],[-104,16],[-88,18],[-48,17],[-30,12],[-23,3]];
      for(let i=0;i<pod.length-1;i++)tube(pod[i][0],pod[i+1][0],pod[i][1],pod[i+1][1],i<2?METAL:PAINT,{},28,side*49,-3);
      tube(-111,-107,11,14,[96,208,216],{emissive:true},28,side*49,-3);
      for(const z of [-88,-80,-72])tube(z,z+2,18,18,METAL,{},28,side*49,-3);
      jets.push({p:[side*49,-3,-113],end:[side*49,-3,-157],width:.45});
      glows.push({p:[side*58,10,-40],color:side<0?'#f5b77e':'#89ebdb',size:2.2});
    }
    // Rear service spine, radiator ribs and attitude-control jets.
    tag={structure:true};
    rod([0,-45,-65],[0,-45,65],3.2,METAL,12);
    for(const side of [-1,1]){
      for(let i=0;i<7;i++)rod([side*7,-44,40-i*12],[side*25,-37,40-i*12],1.5,GRAY,8);
      cylinderY(side*24,-38,63,-7,5,METAL,16);
      glows.push({p:[side*24,-46,63],color:'#9deaff',size:2});
    }
    // Inlaid luminous rails, recessed panel and service hatch on the pressure shell.
    tag={structure:true,fairing:true};
    for(const side of [-1,1]){
      for(let i=0;i<3;i++){
        const z=20-i*9,x=side*30,y=34;
        face([[x-4,y,z],[x+4,y,z],[x+4,y,z+3],[x-4,y,z+3]],METAL,{shell:side,stroke:false});
      }
      rod([side*37,23,-16],[side*37,23,39],.8,[135,219,211]);
    }
    cylinderY(0,45,-17,1,12,METAL,32);
    cylinderY(0,46.1,-17,.5,9.5,PAINT,32);
    cylinderY(0,47,-17,.4,5,[215,231,220],24);
    tag={structure:true};
    tube(-118,-107,16,25,GRAY);tube(-126,-118,14,16,METAL);tube(-143,-126,23,14,METAL);tube(-147,-143,24,23,GRAY);
    tube(-146,-144,24.2,24.2,[108,216,224],{emissive:true});
    cylinderZ(0,0,-146,.5,19,DARK,32);glows.push({p:[0,18,-145],color:'#a4f5ff',size:3});
    jets.push({p:[0,0,-148],end:[0,0,-205]});
    // Interior bulkheads, cable conduits and rails stay in place while the shell opens.
    tag = { interior: true, structure: true };
    box(0, -10, -103, 66, 11, 202, DARK, 3);
    [-35, 35].forEach(x => { box(x, 11, -102, 3, 27, 201, GRAY, 1); box(x * .91, 11, -99, 1.3, 2, 194, [92, 155, 163], .3); });
    [-102, -53, -5, 43, 93].forEach(z => { box(0, 12, z, 68, 29, 3, METAL, 1); box(0, 28, z, 64, 2, 1.5, [107, 149, 151], .2); });
    box(0, 5, -100, 3, 10, 196, [86, 109, 116], 1);
    const layout = [['scanner', -18, 68], ['survival', 18, 68], ['arm', -18, 20], ['cargo', 18, 20], ['life', -18, -28], ['shield', 18, -28], ['engine', -18, -76], ['warp', 18, -76]];
    layout.forEach(([type, x, z], index) => {
      origin = [x, 6, z]; tag = { interior: true, socket: type };
      box(0, 0, -18, 30, 6, 37, [51, 75, 86], 2);
      cylinderY(0, 3.2, 0, 2, 7, [121, 148, 146], 12); cylinderY(0, 5.5, 0, .6, 3, [30, 54, 63], 8);
      [[-12, -15], [12, -15], [-12, 15], [12, 15]].forEach(([xx, zz]) => cylinderY(xx, 3.2, zz, 1.4, 1.2, [202, 179, 126], 6));
      box(-14, 5, -12, 2, 5, 25, GRAY, .5); box(14, 5, -12, 2, 5, 25, GRAY, .5);
      mounts[type] = { p: [x, 21, z], socket: [x, 11, z], side: x < 0 ? -1 : 1, row: Math.floor(index / 2), installed: !!moduleMap[type] };
      if (!moduleMap[type]) return;
      tag = { interior: true, module: type }; origin = [x, 14, z];
      if (type === 'engine') {
        tube(-16, -3, 11, 5, GRAY, {}, 14); cylinderZ(0, 0, -3, 17, 7, METAL, 14); cylinderZ(0, 0, 7, 4, 9, PAINT, 14);
        [-8, -1, 13].forEach(zz => cylinderZ(0, 0, zz, 2, zz < 0 ? 8 : 9, LIGHT, 12));
        rod([-10, 0, -1], [-10, 0, 14], 1.4, [180, 151, 103]); rod([-10, 0, 14], [0, 0, 14], 1.4, [180, 151, 103]);
        cylinderY(0, 8, 2, 2, 4, [110, 206, 221], 12, { emissive: true });
      } else if (type === 'warp') {
        cylinderZ(0, 0, -16, 33, 7, DARK, 12);
        [-11, -2, 7].forEach(zz => { cylinderZ(0, 0, zz, 4, 12, METAL, 16); cylinderZ(0, 0, zz + 1, 1.4, 12.8, [95, 222, 202], 16); });
        cylinderZ(0, 0, 15, 3, 8, LIGHT); box(-12, 0, -16, 3, 5, 33, GRAY, .4); box(12, 0, -16, 3, 5, 33, GRAY, .4);
      } else if (type === 'life') {
        [-6.2, 6.2].forEach(xx => { tube(-14, -10, 2.5, 5.4, WHITE, {}, 12, xx); cylinderZ(xx, 0, -10, 23, 5.4, WHITE); tube(13, 16, 5.4, 2.5, WHITE, {}, 12, xx); cylinderZ(xx, 0, -4, 4, 5.8, [101, 177, 151]); cylinderZ(xx, 0, 16, 3, 1.7, METAL, 8); });
        rod([-6, 0, 19], [6, 0, 19], 1.5, GRAY); box(0, 6, -14, 3, 3, 27, METAL, .5);
        box(0, 8, -11, 1.4, 1.5, clamp(Number(resources.oxygen || 0) / 100, .05, 1) * 21, [110, 227, 187], .2);
      } else if (type === 'shield') {
        ringY(0, 3, 0, 14.5, 4.4, [117, 184, 192]); ringY(0, 4.6, 0, 10.1, 1.5, [144, 243, 219]);
        [-1, 1].forEach(s => { box(s * 12, 0, -3, 6, 8, 6, LIGHT, 1); box(0, 0, s * 12 - 2, 6, 8, 5, LIGHT, 1); });
        crystal(0, 7, -3, 5.5, [146, 232, 212]);
      } else if (type === 'scanner') {
        box(0, -1, -17, 17, 10, 4, METAL); rod([0, 0, -12], [0, 0, 2], 2, GRAY);
        for (let i = 0; i < 20; i++) { const a = i * TAU / 20, b = (i + 1) * TAU / 20; face([[Math.cos(a) * 13.5, 5, 4 + Math.sin(a) * 13.5], [Math.cos(b) * 13.5, 5, 4 + Math.sin(b) * 13.5], [Math.cos(b) * 5, -1, 4 + Math.sin(b) * 5], [Math.cos(a) * 5, -1, 4 + Math.sin(a) * 5]], LIGHT); }
        cylinderY(0, -1, 4, 13, 1.5, PAINT, 8); ringY(0, 5.5, 4, 13.9, 1.2, [132, 193, 201]);
      } else if (type === 'arm') {
        box(-8, 0, -16, 13, 12, 7, METAL); cylinderY(-8, 7, -8, 3, 5, WHITE, 12);
        rod([-8, 3, -8], [-9, 5, 10], 3.5, PAINT); cylinderY(-9, 7, 10, 3, 4.5, LIGHT, 12);
        rod([-9, 5, 10], [8, 5, 16], 3, PAINT); cylinderY(8, 7, 16, 2, 4, LIGHT, 12); rod([8, 5, 16], [10, 6, 1], 2.3, GRAY);
        rod([10, 6, 1], [5, 6, -3], 1.4, LIGHT); rod([10, 6, 1], [14, 6, -3], 1.4, LIGHT); rod([5, 6, -3], [7, 6, -8], 1.2, METAL); rod([14, 6, -3], [12, 6, -8], 1.2, METAL);
      } else if (type === 'cargo') {
        box(0, 0, -17, 28, 17, 3, METAL);
        tag = { ...tag, resource: 'ore' };
        box(-8, 0, -13, 12, 12, 13, [178, 146, 94], 1.5);
        box(-8, 6.4, -10, 10, 1, 2, LIGHT, .2); box(-8, 6.7, -13, 1.2, 1, 13, METAL, .2);
        if (Number(resources.ore || 0) > 0) { crystal(-8, 4, 4, 5.5, [165, 210, 170]); crystal(1, 4, 4, 4.5, [210, 158, 91]); }
        tag = { ...tag, resource: 'crystals' };
        box(7, 0, -13, 12, 12, 13, [123, 155, 158], 1.5);
        box(7, 6.4, -10, 10, 1, 2, LIGHT, .2); box(7, 6.7, -13, 1.2, 1, 13, METAL, .2);
        if (Number(resources.crystals || 0) > 0) crystal(-5, 1, 11, 4.4, [149, 171, 235]);
        tag = { ...tag, resource: 'oxygen' };
        cylinderZ(9, -1, 1, 15, 3.8, [117, 180, 193], 10); cylinderZ(9, -1, 16, 2, 1.6, LIGHT, 8); box(9, 3, 2, 1.8, 1.6, 12, DARK, .3);
        if (Number(resources.oxygen || 0) > 0) box(9, 3.9, 2, 1.3, .4, 12 * clamp(Number(resources.oxygen) / 100, 0, 1), [179, 233, 225], .15);
      } else if (type === 'survival') {
        box(-1, 0, -15, 23, 12, 29, [170, 159, 126], 3); box(-1, 0, 14, 12, 6, 3, METAL, 1); box(-1, 6.5, -9, 18, 2, 18, PAINT, 2);
        face([[-3, 8, 5], [1, 8, 5], [1, 8, 1], [5, 8, 1], [5, 8, -3], [1, 8, -3], [1, 8, -7], [-3, 8, -7], [-3, 8, -3], [-7, 8, -3], [-7, 8, 1], [-3, 8, 1]], LIGHT);
        cylinderZ(12, 0, -11, 23, 2.4, [146, 196, 183], 8);
      }
      glows.push({ p: [x + 11, 23, z - 15], color: rarityColor[moduleMap[type]?.rarity] || '#a5ccd2', size: 1.8, module: type, interior: true });
    });
    origin = [0, 0, 0];
    return { faces, glows, jets, mounts };
  }

  class OrbitScene {
    constructor(canvas, callbacks = {}) {
      this.callbacks = callbacks || {}; this.hotspots = [];
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.state = { view: 'explore', mode: 'orbit', shipColor: '#f08b54', modules: {}, shipDetail: { mode: 'exterior', selectedModule: null, expanded: false }, resources: {}, planet: { id: 'auralis', biome: 'forest', seed: 123 } };
      this.width = 800; this.height = 430; this.yaw = .18; this.pitch = .20; this.zoom = 1; this.dragging = false;
      this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
      this.startTime = performance.now(); this.effects = {}; this.planetCache = new Map(); this.weatherCache = new Map(); this.mapArtCache = new Map(); this.dead = false;
      const rand = random(79148);
      this.stars = Array.from({ length: 225 }, () => ({ x: rand(), y: rand(), r: .3 + rand() * 1.12, a: .13 + rand() * .59, phase: rand() * TAU, blue: rand() > .65 }));
      this.debris = Array.from({ length: 8 }, () => ({ x: rand(), y: rand(), size: 1 + rand() * 2, phase: rand() * TAU }));
      this.ship = makeShip(this.state.shipColor, this.state.modules, this.state.resources);
      this.resize = this.resize.bind(this); this.tick = this.tick.bind(this);
      this.onArtReady = () => { if (!this.dead && this.reduced && !this.paused && this.ship && !document.hidden) this.draw(performance.now()); };
      window.addEventListener('orbit-art-ready', this.onArtReady);
      this.onVisibility = () => { if (!document.hidden && !this.dead && !this.paused && !this.raf) this.raf = requestAnimationFrame(this.tick); };
      this.onDown = e => {
        if (e.button && e.button !== 0) return;
        const rect = canvas.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top;
        const info = this.inspection, b = info?.bounds;
        const onPiece = b && x >= b.x - 7 && x <= b.x + b.width + 7 && y >= b.y - 7 && y <= b.y + b.height + 7;
        this.dragging = true;
        this.pointer = { x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch, kind: onPiece ? 'module' : 'camera', moved: false };
        if (onPiece && this.camera) {
          const cameraLock = {};
          ['x', 'y', 'scale', 'yaw', 'pitch', 'fx', 'fy', 'fz'].forEach(k => { cameraLock[k] = this.camera[k]; });
          this.moduleDrag = { type: info.type, startPose: this.camera.explode, pose: this.camera.explode, vectorX: info.expansionVector.x, cameraLock, active: false };
        }
        canvas.setPointerCapture?.(e.pointerId); canvas.style.cursor = 'grabbing';
      };
      this.onMove = e => {
        if (!this.dragging || !this.pointer) return;
        const dx = e.clientX - this.pointer.x, dy = e.clientY - this.pointer.y;
        this.pointer.moved = this.pointer.moved || Math.hypot(dx, dy) > 7;
        if (this.pointer.kind === 'module' && this.moduleDrag) {
          if (this.pointer.moved) {
            const drag = this.moduleDrag;
            if (!drag.active) { drag.active = true; this.callbacks.onInteractionHint?.('Arraste a peça até o encaixe ou para fora dele.'); }
            const vector = Math.abs(drag.vectorX) > 10 ? drag.vectorX : (this.ship.mounts[drag.type]?.side || 1) * 80;
            drag.pose = clamp(drag.startPose + dx / vector, 0, 1.12);
          }
          return;
        }
        this.yaw = this.pointer.yaw + dx * .007;
        this.pitch = clamp(this.pointer.pitch + dy * .003, .05, .65);if(this.reduced&&!this.paused)this.draw(performance.now());
      };
      this.onUp = e => {
        const pointer = this.pointer, drag = this.moduleDrag;
        this.dragging = false; this.pointer = null; this.moduleDrag = null; canvas.style.cursor = 'grab';
        if (!pointer) return;
        if (e.type === 'pointercancel' || e.type === 'lostpointercapture') return;
        if (drag && pointer.moved) {
          const expanded = drag.pose >= .5;
          this.state.shipDetail = { ...this.state.shipDetail, expanded };
          this.callbacks.onModulePose?.({ type: drag.type, expanded });
          this.callbacks.onInteractionHint?.(expanded ? 'Peça fora do encaixe.' : 'Peça encaixada.');
          return;
        }
        if (pointer.moved) return;
        const rect = canvas.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top;
        if (drag?.type === 'cargo') {
          const content = this.pickCargo(x, y);
          if (content) { this.callbacks.onCargoSelect?.(content); return; }
        }
        if (drag) return;
        const point = this.hotspots.filter(p => p.visible).map(p => ({ p, distance: Math.min(Math.hypot(x - p.x, y - p.y), Math.hypot(x - p.anchorX, y - p.anchorY)) })).sort((a, b) => a.distance - b.distance)[0];
        if (point && point.distance < 26) this.callbacks.onSelectModule?.(point.p.type);
        else if ((!this.state.shipDetail || this.state.shipDetail.mode === 'exterior' || this.state.view === 'explore') && this.state.view !== 'galaxy' && this.shipHit && x >= this.shipHit.x && x <= this.shipHit.x + this.shipHit.w && y >= this.shipHit.y && y <= this.shipHit.y + this.shipHit.h) this.callbacks.onOpenShip?.();
      };
      this.onWheel = e => { if (e.ctrlKey || e.metaKey) return; e.preventDefault(); this.zoom = clamp(this.zoom - e.deltaY * .001, .7, 1.5); };
      canvas.style.cursor = 'grab'; canvas.style.touchAction = 'none';
      canvas.addEventListener('pointerdown', this.onDown); canvas.addEventListener('pointermove', this.onMove); canvas.addEventListener('pointerup', this.onUp); canvas.addEventListener('pointercancel', this.onUp); canvas.addEventListener('lostpointercapture', this.onUp); canvas.addEventListener('wheel', this.onWheel, { passive: false });
      document.addEventListener('visibilitychange', this.onVisibility);
      this.observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(this.resize) : null;
      this.observer?.observe(canvas); window.addEventListener('resize', this.resize);
      this.resize(); this.update(this.state); this.raf = requestAnimationFrame(this.tick);
    }
    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width || 800), height = Math.max(1, rect.height || 430);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      // Assigning canvas.width clears the bitmap and reallocates it: only do that when the size really changed.
      if (width === this.width && height === this.height && dpr === this.dpr) return;
      this.width = width; this.height = height; this.mapRect = null;
      this.canvas.width = Math.round(this.width * dpr); this.canvas.height = Math.round(this.height * dpr);
      this.dpr = dpr;
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
      // Paused or reduced-motion scenes have no running loop to repaint the cleared canvas.
      if ((this.paused || this.reduced) && !this.dead && this.ship) this.draw(performance.now());
    }
    // Static full-screen layers (background gradients, vignette) are painted once per size instead of every frame.
    layer(name, paint) {
      const w = this.width, h = this.height, key = w + 'x' + h + '@' + this.dpr;
      this.layers = this.layers || {};
      let entry = this.layers[name];
      if (!entry || entry.key !== key) {
        const canvas = entry?.canvas || document.createElement('canvas');
        canvas.width = Math.round(w * this.dpr); canvas.height = Math.round(h * this.dpr);
        const g = canvas.getContext('2d'); g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); paint(g, w, h);
        entry = this.layers[name] = { key, canvas };
      }
      return entry.canvas;
    }
    update(next = {}) {
      const oldKey = this.shipKey;
      this.state = { ...this.state, ...next }; this.mapRect = null;
      if (this.moduleDrag && (this.state.shipDetail?.mode !== 'module' || this.state.shipDetail.selectedModule !== this.moduleDrag.type || !['ship', 'hangar'].includes(this.state.view))) {
        this.moduleDrag = null; this.pointer = null; this.dragging = false;
      }
      if (next.ship?.color && !next.shipColor) this.state.shipColor = next.ship.color;
      if (next.equipped && !next.modules) this.state.modules = next.equipped;
      // Only these resources affect the ship geometry; credits/fuel/data do not.
      const cargo = this.state.resources || {};
      this.shipKey = `${this.state.shipColor}:${JSON.stringify(this.state.modules)}:${cargo.oxygen || 0}:${Number(cargo.ore || 0) > 0}:${Number(cargo.crystals || 0) > 0}`;
      if (oldKey !== this.shipKey) this.ship = makeShip(this.state.shipColor, this.state.modules, this.state.resources);
    }
    planetTextureFor(planet, map = false) {
      const size = map ? 176 : 400;
      const key = `${size}:${planet.id || planet.name}:${planet.seed}:${planet.biome}:${planet.medium}`;
      if (!this.planetCache.has(key)) {
        if (this.planetCache.size >= 40) this.planetCache.delete(this.planetCache.keys().next().value);
        this.planetCache.set(key, createPlanet(planet, size));
      }
      return this.planetCache.get(key);
    }
    effect(kind, type) { this.effects[kind] = performance.now(); if (kind === 'equip') this.equipType = type; }
    resetCamera() { this.yaw = .18; this.pitch = .20; this.zoom = 1; }
    progress(kind, now, duration) { return this.effects[kind] === undefined ? 0 : clamp(1 - (now - this.effects[kind]) / duration, 0, 1); }
    setPaused(value) {
      if(value){if(!this.paused)this.pausedAt=performance.now();this.paused=true;cancelAnimationFrame(this.raf);this.raf=null;return;}
      if(this.paused){this.startTime+=performance.now()-(this.pausedAt||performance.now());this.paused=false;}
      if(!this.raf&&!this.dead&&!document.hidden)this.raf=requestAnimationFrame(this.tick);
    }
    tick(now) {
      this.raf = null;
      if (this.dead || this.paused || document.hidden) return;
      // Idle scenes (slow drift, twinkling) run at ~30 fps; drags and short effects get every display frame.
      // On 90/120 Hz phones an uncapped loop redrew the whole canvas up to 120 times a second.
      const busy = !this.light && (this.dragging || this.moduleDrag || Object.values(this.effects).some(start => now - start < 2400));
      if (this.ctx&&(busy||!this.lastLightFrame||now-this.lastLightFrame>=29)){this.draw(now);this.lastLightFrame=now;}
      if(!this.reduced)this.raf = requestAnimationFrame(this.tick);
    }
    draw(now) {
      const c = this.ctx, w = this.width, h = this.height;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const t = this.reduced ? 0 : (now - this.startTime) / 1000;
      this.artTime=t;
      const warp = this.reduced ? 0 : this.progress('warp', now, 2000);
      const travel = this.reduced ? 0 : this.progress('travel', now, 2300);
      const scan = this.progress('scan', now, 2100);
      const dock = this.progress('dock', now, 1800);
      const explore = this.progress('explore', now, 1700);
      const shipView = this.state.view === 'ship' || this.state.view === 'hangar';
      const galaxy = this.state.view === 'galaxy';
      const cruising = shipView && this.state.shipDetail?.mode === 'exterior';
      const portrait = this.state.viewport === 'mobile' || (w < 500 && h > 500);
      const planetTarget = !shipView && !galaxy ? 1 : 0;
      const drawDt = clamp(now - (this.lastDrawNow || now - 16), 1, 48); this.lastDrawNow = now;
      if (this.planetOpacity === undefined) this.planetOpacity = planetTarget;
      this.planetOpacity = this.reduced ? planetTarget : lerp(this.planetOpacity, planetTarget, 1 - Math.exp(-drawDt / 90));
      c.drawImage(this.layer('backdrop', (c, w, h) => {
        const bg = c.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#081721'); bg.addColorStop(.48, '#0b1b29'); bg.addColorStop(1, '#09131f'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
        const fog = c.createRadialGradient(w * .70, h * .22, 0, w * .70, h * .22, w * .65); fog.addColorStop(0, 'rgba(68, 82, 113, .20)'); fog.addColorStop(.55, 'rgba(36, 61, 84, .07)'); fog.addColorStop(1, 'rgba(6,18,28,0)'); c.fillStyle = fog; c.fillRect(0, 0, w, h);
        c.save(); c.translate(w * .54, h * .43); c.rotate(-.38); c.scale(1, .3); const dust = c.createRadialGradient(0, 0, 10, 0, 0, w * .7); dust.addColorStop(0, 'rgba(98, 90, 128, .09)'); dust.addColorStop(.5, 'rgba(70, 96, 125, .065)'); dust.addColorStop(1, 'rgba(16,29,43,0)'); c.fillStyle = dust; c.fillRect(-w, -w, w * 2, w * 2); c.restore();
      }), 0, 0, w, h);
      if(cruising)this.drawCruise(t);
      this.stars.forEach((s,index) => {
        if(cruising&&index%3!==0)return;
        const x = ((s.x * w - t * (cruising ? 3+s.r*s.r*9 : s.r*.34)) % w + w) % w, y = cruising ? (s.y*h+t*(1+s.r*s.r*2.4))%h : s.y*h;
        const alpha = s.a * (.85 + Math.sin(t * .75 + s.phase) * .15);
        c.globalAlpha = alpha; c.fillStyle = s.blue ? '#94c2d7' : '#d8e1de';
        if (warp || travel) { const strength = warp ? Math.sin(warp * Math.PI) * 75 : Math.sin(travel * Math.PI) * 16; c.strokeStyle = c.fillStyle; c.lineWidth = s.r * .8; c.beginPath(); c.moveTo(x, y); c.lineTo(x - strength * (1 + s.r), y + strength * .2); c.stroke(); }
        if(cruising&&s.r>1.1){c.strokeStyle=c.fillStyle;c.lineWidth=.65;c.beginPath();c.moveTo(x,y);c.lineTo(x+3+s.r*2,y-1.2);c.stroke();}
        c.beginPath(); c.arc(x, y, cruising?s.r*.75:s.r, 0, TAU); c.fill();
        if (s.r > 1.32) { c.globalAlpha = alpha * .32; c.fillRect(x - 3.3, y - .35, 6.6, .7); c.fillRect(x - .35, y - 3.3, .7, 6.6); }
        c.globalAlpha = 1;
      });
      if (galaxy) { if (Array.isArray(this.state.navigation?.nodes)) this.drawNavigation(t); else this.drawGalaxy(t, portrait); }
      const planet = this.state.planet || {};
      const medium = planet.medium || (planet.biome === 'gas' ? 'gas' : planet.biome === 'ocean' ? 'liquid' : 'solid');
      const pr = portrait ? Math.min(w * .287, h * .20, 124) : Math.min(w * .162, h * .325, 168);
      const px = w * (portrait ? .70 : .805);
      const py = portrait ? Math.max(pr + 80, h * .28) : h * .40;
      if (this.planetOpacity > .005 && !galaxy) {
        c.save(); c.globalAlpha = this.planetOpacity;
        // The orbit sits behind the sphere; the break in its arc makes its depth readable.
        c.save(); c.translate(px, py + pr * .2); c.rotate(-.28); c.strokeStyle = 'rgba(150,181,185,.15)'; c.lineWidth = .8; c.setLineDash([3, 7]); c.beginPath(); c.ellipse(0, 0, pr * 1.52, pr * .39, 0, 0, TAU); c.stroke(); c.setLineDash([]); c.restore();
        this.drawPlanetBody(px, py, pr, planet, false);
        if (scan > 0) { c.save(); c.strokeStyle = `rgba(123,235,204,${scan * .7})`; c.lineWidth = 1; for (let i = 0; i < 3; i++) { const rad = pr * (.7 + ((1 - scan + i / 3) % 1) * .8); c.beginPath(); c.arc(px, py, rad, 0, TAU); c.stroke(); } c.restore(); }
        if (dock > 0 || explore > 0) {
          const amount = Math.max(dock, explore), tx = px - pr * (medium === 'gas' ? 1.03 : medium === 'liquid' ? .38 : .63), ty = py + pr * (medium === 'gas' ? -.40 : .30);
          c.save(); c.strokeStyle = `rgba(164,242,205,${amount * .85})`; c.lineWidth = 1.2;
          [8, 17, 27].forEach(r => { c.beginPath(); c.arc(tx, ty, r * (1.45 - amount * .45), 0, TAU); c.stroke(); });
          if (explore > 0) for (let i = 0; i < 8; i++) { const angle = i * TAU / 8, distance = (1 - explore) * 48 + 9; c.fillStyle = `rgba(205,241,181,${explore})`; c.fillRect(tx + Math.cos(angle) * distance - 1, ty + Math.sin(angle) * distance - 1, 2, 2); }
          c.restore();
        }
        if (this.state.mode === 'docked' || this.state.mode === 'surface') {
          const probe = medium === 'solid' ? null : this.drawRemoteOperation(px, py, pr, planet, t);
          c.strokeStyle = 'rgba(122,219,185,.25)'; c.setLineDash([2, 5]); c.beginPath(); c.moveTo(w * (portrait ? .45 : .51), h * (portrait ? .51 : .58));
          if (probe) c.quadraticCurveTo(w * (portrait ? .50 : .68), h * .45, probe.x - 10, probe.y);
          else c.quadraticCurveTo(w * (portrait ? .80 : .68), h * (portrait ? .49 : .73), px - pr * .78, py + pr * .38);
          c.stroke(); c.setLineDash([]);
        } else if ((dock > 0 || explore > 0) && medium !== 'solid') this.drawRemoteOperation(px, py, pr, planet, t, Math.max(dock, explore));
        c.restore();
      }
      if (shipView && !cruising) {
        c.save(); c.translate(w * .51, h * (portrait ? .57 : .69)); c.scale(1, .33);
        [105, 170, 240].forEach((r, i) => { c.strokeStyle = `rgba(99,164,170,${.10 - i * .018})`; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, r * Math.min(w / 600, 1.4), 0, TAU); c.stroke(); }); c.restore();
      }
      const baseScale = portrait ? Math.min(w / 390, (h - 292) / 320) : Math.min(w / 610, h / 395);
      const overview = shipView && this.state.shipDetail?.mode !== 'module' ? this.state.inspectionLayout : null;
      const scale = overview ? Math.min(w / 330, (overview.bottom - overview.top) / 310, w / 390 * this.zoom) : Math.max(.65, baseScale) * this.zoom * (shipView ? 1 : .83);
      const sx = w * (shipView ? .50 : (portrait ? .34 : .36)) - Math.sin(travel * Math.PI) * w * .035;
      const sy = overview ? (overview.top + overview.bottom) / 2 : portrait ? (shipView ? (120 + h - 177) / 2 : h * .50) : h * .54;
      const bob = this.reduced || this.dragging || shipView ? 0 : Math.sin(t * .75) * 2;
      if (!galaxy) this.drawShip(sx, sy + bob, scale, t, warp, travel, now, shipView, portrait);
      else { this.shipHit = null; this.inspection = null; this.cargoHitFaces = []; this.publishHotspots([]); this.publishCargoHotspots([]); }
      if (!shipView) this.debris.forEach(d => { const dx = d.x * w, dy = d.y * h; if (dx < w * .2 || dy > h * .82) { c.fillStyle = 'rgba(81,112,128,.28)'; c.save(); c.translate(dx + Math.sin(t * .12 + d.phase) * 5, dy); c.rotate(d.phase + t * .015); c.fillRect(-d.size, -d.size * .5, d.size * 2, d.size); c.restore(); } });
      // A subtle vignette keeps labels legible without flattening the central art.
      c.drawImage(this.layer('vignette', (c, w, h) => { const vignette = c.createRadialGradient(w * .5, h * .48, Math.min(w, h) * .28, w * .5, h * .48, w * .75); vignette.addColorStop(0, 'rgba(2,9,15,0)'); vignette.addColorStop(1, 'rgba(2,9,15,.48)'); c.fillStyle = vignette; c.fillRect(0, 0, w, h); }), 0, 0, w, h);
      if (warp > 0) { c.fillStyle = `rgba(139,209,225,${Math.sin(warp * Math.PI) * .07})`; c.fillRect(0, 0, w, h); }
    }
    drawPlanetBody(x, y, radius, planet, map) {
      const c = this.ctx, biome = planet.biome || (planet.medium === 'gas' ? 'gas' : 'forest');
      const palette = PALETTES[biome] || PALETTES.forest, rings = biome === 'gas' || biome === 'crystal';
      const ring = front => {
        c.save(); c.translate(x, y); c.rotate(biome === 'crystal' ? -.43 : -.27);
        for (let i = 0; i < (biome === 'gas' ? 7 : 3); i++) {
          const r = radius * (1.23 + i * .051);
          c.strokeStyle = biome === 'gas' ? ['#c0ad8966', '#e0cca280', '#ad947348'][i % 3] : '#b7a4d35e';
          c.lineWidth = Math.max(.65, radius * (i % 2 ? .019 : .027)); c.beginPath(); c.ellipse(0, 0, r, r * .26, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); c.stroke();
        }
        c.restore();
      };
      if (rings) ring(false);
      c.save();
      const glow = c.createRadialGradient(x, y, radius * .83, x, y, radius * (biome === 'magma' ? 1.35 : 1.17));
      glow.addColorStop(0, palette.glow + '00'); glow.addColorStop(.59, palette.glow + (biome === 'magma' ? '2e' : biome === 'rogue' ? '0c' : '30')); glow.addColorStop(1, palette.glow + '00');
      c.fillStyle = glow; c.fillRect(x - radius * 1.4, y - radius * 1.4, radius * 2.8, radius * 2.8);
      // The painted worlds atlas replaces the procedural texture, which costs 0.2-0.3 s per planet to generate.
      // Generate it only when that art is unavailable; while the atlas is still loading, draw a plain disc.
      if (!window.OrbitArt?.world(c,planet,x,y,radius)) {
        if (window.OrbitArt?.loading?.('worlds')) { c.fillStyle = palette.glow + '55'; c.beginPath(); c.arc(x, y, radius, 0, TAU); c.fill(); }
        else c.drawImage(this.planetTextureFor(planet, map), x - radius, y - radius, radius * 2, radius * 2);
      }
      if(radius>45 && ['forest','ocean','toxic','ice'].includes(biome)){
        const key=planet.id||planet.name;
        if(!this.weatherCache.has(key)){if(this.weatherCache.size>=12)this.weatherCache.delete(this.weatherCache.keys().next().value);this.weatherCache.set(key,createWeather(planet));}
        c.save();c.translate(x,y);c.rotate(Math.sin((this.artTime||0)*.025)*.12);c.globalAlpha*=.46;
        c.drawImage(this.weatherCache.get(key),-radius,-radius,radius*2,radius*2);c.restore();
      }
      c.strokeStyle = palette.glow + (biome === 'rogue' ? '38' : '77'); c.lineWidth = Math.max(.6, radius * .0065); c.beginPath(); c.arc(x, y, radius - .6, Math.PI * .83, Math.PI * 1.79); c.stroke();
      c.restore();
      if (rings) ring(true);
    }
    drawNavStar(x, y, radius, kind, tint, t, companion = false) {
      const c = this.ctx, k = String(kind || 'yellow').toLowerCase();
      if (k.includes('binary') && !companion) {
        this.drawNavStar(x - radius * .44, y + radius * .17, radius * .59, 'yellow', '#f6c48c', t, true);
        this.drawNavStar(x + radius * .43, y - radius * .15, radius * .48, 'blue-giant', '#9bdcfa', t, true);
        return;
      }
      if(window.OrbitArt?.star(c,k,x,y,radius))return;
      const hue = tint || (k.includes('red') ? '#ed9c79' : k.includes('blue') ? '#9bddfa' : k.includes('puls') || k.includes('neutron') || k.includes('white') ? '#ccebf6' : '#f4ce8c');
      const channels = color(hue), rgba = a => `rgba(${channels.join(',')},${a})`, pulsar = k.includes('puls') || k.includes('neutron');
      c.save();
      const corona = c.createRadialGradient(x, y, radius * .4, x, y, radius * 2.7); corona.addColorStop(0, rgba(.39)); corona.addColorStop(.43, rgba(.13)); corona.addColorStop(1, rgba(0)); c.fillStyle = corona; c.fillRect(x - radius * 2.8, y - radius * 2.8, radius * 5.6, radius * 5.6);
      if (pulsar) {
        c.save(); c.translate(x, y); c.rotate(-.28 + Math.sin(t * .2) * .04);
        [-1, 1].forEach(sign => {
          const beam = c.createLinearGradient(0, 0, 0, sign * radius * 4.7); beam.addColorStop(0, rgba(.6)); beam.addColorStop(.3, rgba(.13)); beam.addColorStop(1, rgba(0)); c.fillStyle = beam; c.beginPath(); c.moveTo(-radius * .16, 0); c.lineTo(-radius * .33, sign * radius * 4.7); c.lineTo(radius * .33, sign * radius * 4.7); c.lineTo(radius * .16, 0); c.closePath(); c.fill();
        });
        c.strokeStyle = rgba(.42); c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, radius * 1.54, radius * .45, 0, 0, TAU); c.stroke(); c.restore();
      } else {
        c.strokeStyle = rgba(.25); c.lineWidth = 1;
        for (let i = 0; i < 11; i++) { const angle = i / 11 * TAU, r = radius * (1.25 + Math.sin(t * .3 + i) * .10); c.beginPath(); c.moveTo(x + Math.cos(angle) * radius * .9, y + Math.sin(angle) * radius * .9); c.quadraticCurveTo(x + Math.cos(angle + .13) * r, y + Math.sin(angle + .13) * r, x + Math.cos(angle + .23) * radius, y + Math.sin(angle + .23) * radius); c.stroke(); }
      }
      const bodyRadius = pulsar ? radius * .57 : radius;
      const sphere = c.createRadialGradient(x - bodyRadius * .32, y - bodyRadius * .34, bodyRadius * .02, x, y, bodyRadius);
      sphere.addColorStop(0, '#fff8dfff'); sphere.addColorStop(.38, hue); sphere.addColorStop(1, rgb(channels, k.includes('red') ? .62 : .78));
      c.fillStyle = sphere; c.beginPath(); c.arc(x, y, bodyRadius, 0, TAU); c.fill();
      c.strokeStyle = rgba(.60); c.lineWidth = .8; c.beginPath(); c.arc(x, y, bodyRadius + 1.2, .2, TAU - .2); c.stroke();
      c.restore();
    }
    drawNavigation(t) {
      const c = this.ctx, nav = this.state.navigation || {}, level = nav.level || 'system';
      // Reading layout inside every frame could force a synchronous reflow after DOM changes; the map box only
      // changes with a render (update) or a resize, so it is measured once per change.
      if (!this.mapRect) { const map = this.canvas.parentElement.querySelector('.og-map'); this.mapRect = map && map.offsetWidth ? {x:map.offsetLeft,y:map.offsetTop,width:map.offsetWidth,height:map.offsetHeight} : { x: 22, y: 145, width: this.width - 44, height: this.height - 350 }; }
      const rect = this.mapRect;
      const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      const nodes = (nav.nodes || []).filter(n => Number.isFinite(Number(n.x)) && Number.isFinite(Number(n.y))).map(n => ({ ...n, px: rect.x + clamp(Number(n.x), 0, 100) * rect.width / 100, py: rect.y + clamp(Number(n.y), 0, 100) * rect.height / 100, radius: clamp(Number(n.size) || 17, 10, 28), isSelected: !!n.selected || n.id === nav.selectedId, isCurrent: !!n.current || n.id === nav.currentId }));
      c.save(); c.beginPath(); c.rect(0, Math.max(0,rect.y-10), this.width, rect.height+60); c.clip();
      if (level === 'system') {
        nodes.forEach(node => {
          const dx = node.px - center.x, dy = node.py - center.y, aspect=rect.height/rect.width, r = Math.hypot(dx, dy / aspect);
          c.strokeStyle = node.isSelected ? 'rgba(159,193,182,.23)' : 'rgba(104,142,158,.115)'; c.lineWidth = node.isSelected ? .9 : .65; c.setLineDash(node.isSelected ? [] : [2, 7]); c.beginPath(); c.ellipse(center.x, center.y, r, r * aspect, 0, 0, TAU); c.stroke();
        }); c.setLineDash([]);
        this.drawNavStar(center.x, center.y, 13, nav.star?.kind || 'yellow', nav.star?.color || nav.star?.starColor, t);
      } else {
        if(level==='galaxy'){
          c.save(); c.globalAlpha=.78;
          window.OrbitArt?.galaxy(c,nav.galaxy||{},center.x,center.y,Math.min(this.width*.37,rect.height*.40));
          c.restore();
        }
        c.save(); c.translate(center.x, center.y); c.rotate(-.28); c.scale(1, .58);
        const mist = c.createRadialGradient(0, 0, 8, 0, 0, this.width * .56); mist.addColorStop(0, level === 'galaxy' ? 'rgba(120,130,163,.085)' : 'rgba(99,95,144,.07)'); mist.addColorStop(1, 'rgba(38,60,83,0)'); c.fillStyle = mist; c.fillRect(-this.width, -this.width, this.width * 2, this.width * 2); c.restore();
        c.strokeStyle = 'rgba(121,156,175,.075)'; c.lineWidth = .7; c.setLineDash([1, 8]);
        for (let i = 1; i < nodes.length; i++) { c.beginPath(); c.moveTo(nodes[i - 1].px, nodes[i - 1].py); c.lineTo(nodes[i].px, nodes[i].py); c.stroke(); } c.setLineDash([]);
      }
      const selected = nodes.find(n => n.isSelected), current = nodes.find(n => n.isCurrent);
      if (selected && (!current || selected.id !== current.id)) {
        const from = current || center, ax = from.px ?? from.x, ay = from.py ?? from.y;
        const dx = selected.px - ax, dy = selected.py - ay;
        const mx = (ax + selected.px) / 2 - dy * .13, my = (ay + selected.py) / 2 + dx * .13;
        c.strokeStyle = selected.blocked ? 'rgba(210,157,128,.47)' : 'rgba(147,222,191,.57)'; c.lineWidth = 1.2; c.setLineDash([3, 6]); c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx, my, selected.px, selected.py); c.stroke(); c.setLineDash([]);
        const u = this.reduced ? .50 : (t * .16) % 1, v = 1 - u;
        const tx = v * v * ax + 2 * v * u * mx + u * u * selected.px, ty = v * v * ay + 2 * v * u * my + u * u * selected.py;
        c.fillStyle = selected.blocked ? '#ddb79b' : '#b2f0d5'; c.beginPath(); c.arc(tx, ty, 1.65, 0, TAU); c.fill();
      }
      nodes.forEach(node => {
        const x = node.px, y = node.py, r = node.radius;
        if (node.isSelected) {
          const halo = c.createRadialGradient(x, y, r, x, y, r + 15); halo.addColorStop(0, 'rgba(162,215,203,.16)'); halo.addColorStop(1, 'rgba(94,164,173,0)'); c.fillStyle = halo; c.fillRect(x - r - 15, y - r - 15, (r + 15) * 2, (r + 15) * 2);
        }
        if (level === 'system') {
          const planet = node.planet || { id: node.id, seed: node.id, biome: node.kind || 'forest' };
          this.drawPlanetBody(x, y, r, planet, true);
          // Decorative satellites are deterministic and have no interactive targets.
          const moonSeed=Array.from(String(planet.id)).reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,7);
          const moons=planet.medium==='gas'?2:moonSeed%3===0?1:0;
          for(let m=0;m<moons;m++){
            const a=-.65-m*1.8,dist=r+9+m*3,mx=x+Math.cos(a)*dist,my=y+Math.sin(a)*dist,mr=m?2.4:3.6;
            c.save();c.strokeStyle='rgba(175,201,214,.16)';c.lineWidth=.6;c.beginPath();c.ellipse(x,y,dist,dist*.65,-.25,0,TAU);c.stroke();
            const moon=c.createRadialGradient(mx-mr*.4,my-mr*.4,0,mx,my,mr);moon.addColorStop(0,'#d6ddd9');moon.addColorStop(.5,'#8b9da7');moon.addColorStop(1,'#263744');c.fillStyle=moon;c.beginPath();c.arc(mx,my,mr,0,TAU);c.fill();
            c.fillStyle='rgba(37,53,65,.42)';c.beginPath();c.arc(mx+mr*.2,my-mr*.1,mr*.24,0,TAU);c.fill();c.restore();
          }
        } else if (level === 'galaxy') {
          this.drawNavStar(x, y, r * 1.12, node.kind || 'yellow', node.color, t);
        } else {
          const key = `${node.id}:${node.kind}:${node.color}`;
          if (!this.mapArtCache.has(key)) { if (this.mapArtCache.size >= 28) this.mapArtCache.delete(this.mapArtCache.keys().next().value); this.mapArtCache.set(key, galaxyStamp(node)); }
          if(!window.OrbitArt?.phenomenon(c,node,x,y,r)) c.drawImage(this.mapArtCache.get(key), x - r * 1.22, y - r * 1.22, r * 2.44, r * 2.44);
        }
        if (node.isCurrent) {
          c.strokeStyle = 'rgba(136,220,187,.64)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r + 4.4, Math.PI * .07, Math.PI * .83); c.stroke();
          c.fillStyle = '#a1e1c2'; c.beginPath(); c.moveTo(x, y + r + 4); c.lineTo(x + 3, y + r + 8); c.lineTo(x, y + r + 12); c.lineTo(x - 3, y + r + 8); c.closePath(); c.fill();
        }
        if (node.isSelected) {
          c.strokeStyle = 'rgba(220,235,219,.82)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r + 7, 0, TAU); c.stroke();
          c.strokeStyle = 'rgba(191,227,211,.75)';
          for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; c.beginPath(); c.moveTo(x + Math.cos(a) * (r + 9), y + Math.sin(a) * (r + 9)); c.lineTo(x + Math.cos(a) * (r + 12), y + Math.sin(a) * (r + 12)); c.stroke(); }
        }
        if (node.blocked) {
          const bx = x + r * .8, by = y + r * .68;
          c.fillStyle = '#152633'; c.beginPath(); c.arc(bx, by, 4.5, 0, TAU); c.fill(); c.strokeStyle = '#cfaa88'; c.lineWidth = 1; c.beginPath(); c.arc(bx, by, 3.8, 0, TAU); c.moveTo(bx - 2, by); c.lineTo(bx + 2, by); c.stroke();
        }
      });
      if(nav.wormhole){
        const x=rect.x+rect.width*.82,y=rect.y+rect.height*.67,r=21;
        c.save();c.translate(x,y);c.rotate(-.4);
        const aura=c.createRadialGradient(0,0,4,0,0,36);aura.addColorStop(0,'#c5a1ff20');aura.addColorStop(.65,'#a26fe077');aura.addColorStop(1,'#9a67dc00');c.fillStyle=aura;c.fillRect(-36,-36,72,72);
        c.fillStyle='#090615';c.beginPath();c.ellipse(0,0,r,r*.7,0,0,TAU);c.fill();
        for(let i=0;i<4;i++){c.strokeStyle=['#e0c3ff','#b17dec','#8e59bc','#eecdf9'][i];c.lineWidth=i===0?2:1;c.beginPath();c.ellipse(0,0,r+i*2,r*.7+i*1.8,0,(this.reduced?0:t*.3)+i,(this.reduced?0:t*.3)+i+4.9);c.stroke();}
        c.restore();
      }
      if(level==='galaxy'&&window.OrbitArt?.ready('commerce')){
        const im=window.OrbitArt.images.commerce;
        c.drawImage(im,0,0,im.naturalWidth/2,im.naturalHeight*.29,center.x-36,center.y-32,72,64);
      }
      c.restore();
    }
    drawRemoteOperation(px, py, radius, planet, t, strength = 1) {
      const c = this.ctx, medium = planet.medium || (planet.biome === 'gas' ? 'gas' : planet.biome === 'ocean' ? 'liquid' : 'solid');
      if (medium === 'solid') return;
      const gas = medium === 'gas', x = gas ? px - radius * 1.03 : px - radius * .38, y = gas ? py - radius * .40 : py + radius * .30;
      c.save(); c.globalAlpha *= strength;
      if (gas) {
        c.save(); c.translate(px, py + radius * .05); c.rotate(-.17); c.strokeStyle = 'rgba(179,227,201,.35)'; c.setLineDash([2, 5]); c.lineWidth = .9; c.beginPath(); c.ellipse(0, 0, radius * 1.09, radius * .20, 0, 0, Math.PI); c.stroke(); c.setLineDash([]); c.restore();
      } else {
        [8, 16, 25].forEach((r, i) => { const pulse = this.reduced ? 0 : Math.sin(t * 1.2 - i * .6) * 1.5; c.strokeStyle = `rgba(125,225,220,${.36 - i * .08})`; c.lineWidth = .9; c.beginPath(); c.ellipse(x, y, r + pulse, (r + pulse) * .36, -.2, 0, TAU); c.stroke(); });
      }
      const glow = c.createRadialGradient(x, y, 0, x, y, 17); glow.addColorStop(0, 'rgba(138,229,218,.24)'); glow.addColorStop(1, 'rgba(100,185,205,0)'); c.fillStyle = glow; c.fillRect(x - 17, y - 17, 34, 34);
      c.fillStyle = '#557c8e'; c.fillRect(x - 9, y - 2, 6, 4); c.fillRect(x + 3, y - 2, 6, 4); c.strokeStyle = '#b4d7d0'; c.lineWidth = .8; c.strokeRect(x - 9, y - 2, 6, 4); c.strokeRect(x + 3, y - 2, 6, 4);
      c.fillStyle = '#d2e7dc'; c.beginPath(); c.ellipse(x, y, 3.2, 5.2, .2, 0, TAU); c.fill(); c.fillStyle = '#73dacf'; c.beginPath(); c.arc(x, y + 2, 1.3, 0, TAU); c.fill();
      c.restore();
      return { x, y };
    }
    drawGalaxy(t, portrait = false) {
      const c = this.ctx, w = this.width, h = this.height;
      const rand = random(6210);
      c.save(); c.translate(w * (portrait ? .51 : .61), h * (portrait ? .44 : .43)); c.rotate(-.20); c.scale(1, portrait ? .66 : .48);
      for (let i = 0; i < 470; i++) {
        const radius = Math.sqrt(rand()) * Math.min(w * (portrait ? .45 : .34), h * .78), arm = i % 3;
        const angle = arm * TAU / 3 + radius * .018 + rand() * .62 + t * .005;
        const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
        c.fillStyle = i % 5 === 0 ? 'rgba(222,179,146,.44)' : 'rgba(134,166,192,.32)'; c.beginPath(); c.arc(x, y, rand() * 1.8 + .3, 0, TAU); c.fill();
      }
      const core = c.createRadialGradient(0, 0, 1, 0, 0, 90); core.addColorStop(0, 'rgba(208,202,192,.17)'); core.addColorStop(1, 'rgba(173,193,202,0)'); c.fillStyle = core; c.fillRect(-90, -90, 180, 180); c.restore();
    }
    drawCruise(t) {
      const c=this.ctx,w=this.width,h=this.height,art=window.OrbitArt;
      if(!art?.ready('cruise')){
        const glow=c.createRadialGradient(w*.65,h*.35,0,w*.65,h*.35,w*.9);glow.addColorStop(0,'#28385d');glow.addColorStop(.5,'#182d49');glow.addColorStop(1,'#07111e');c.fillStyle=glow;c.fillRect(0,0,w,h);return;
      }
      const im=art.images.cruise;
      // Overscan keeps all edges covered while the camera travels through the illustration.
      const scale=Math.max(w/im.naturalWidth,h/im.naturalHeight)*1.30,iw=im.naturalWidth*scale,ih=im.naturalHeight*scale;
      // Two long camera cycles keep travel visible without sliding to an abrupt loop seam.
      const dx=(Math.sin(t*.15)*.68+Math.sin(t*.057+1.1)*.28)*((iw-w)*.48);
      const dy=(Math.sin(t*.11+.7)*.65+Math.sin(t*.043)*.30)*((ih-h)*.48);
      if(!this.cruiseFrame||this.cruiseFrame.width!==Math.ceil(iw)||this.cruiseFrame.height!==Math.ceil(ih)){const frame=document.createElement('canvas');frame.width=Math.ceil(iw);frame.height=Math.ceil(ih);frame.getContext('2d').drawImage(im,0,0,frame.width,frame.height);this.cruiseFrame=frame;}
      c.save();c.globalAlpha=1;c.drawImage(this.cruiseFrame,(w-iw)/2+dx,(h-ih)/2+dy);c.restore();
      // Sparse near-field blue motes cross faster than the painted far field.
      c.save();c.globalCompositeOperation='screen';
      for(let i=0;i<(this.light?9:18);i++){
        const x=((w*(i*.618%1)-t*(23+i*1.3))%(w+60)+w+60)%(w+60)-30,y=(h*(i*.381%1)+t*(2+i*.1))%(h+40)-20;
        const g=c.createLinearGradient(x,y,x+12,y-3);g.addColorStop(0,'#c7f5ff88');g.addColorStop(1,'#62c8ff00');c.strokeStyle=g;c.lineWidth=.8;c.beginPath();c.moveTo(x,y);c.lineTo(x+12,y-3);c.stroke();
      }
      const age=t%97;if(age>70&&age<74){const u=(age-70)/4,x=w*(1.2-u*1.5),y=h*(.1+u*.3);c.globalAlpha=Math.sin(u*Math.PI)*.7;const g=c.createLinearGradient(x,y,x+45,y-16);g.addColorStop(0,'#e8faff');g.addColorStop(1,'#70cfff00');c.strokeStyle=g;c.lineWidth=1.4;c.beginPath();c.moveTo(x,y);c.lineTo(x+45,y-16);c.stroke();}
      c.restore();
    }
    drawShip(cx, cy, scale, t, warp, travel, now, shipView, portrait) {
      if(this.drawPaintedShip?.(cx,cy,scale,t,warp,travel,now,shipView,portrait))return;
      const c = this.ctx, detail = this.state.shipDetail || {}, inspecting = shipView && detail.mode === 'module';
      const interior = shipView && (detail.mode === 'interior' || inspecting);
      const selected = this.ship.mounts[detail.selectedModule] ? detail.selectedModule : null;
      const mount = selected ? this.ship.mounts[selected] : null;
      const activeDrag = inspecting && this.moduleDrag?.type === selected ? this.moduleDrag : null;
      const targetOpen = interior ? 1 : 0, targetExplode = activeDrag ? activeDrag.pose : inspecting && detail.expanded && mount ? 1 : 0;
      const side = mount?.side || 1;
      const focus = inspecting && mount ? [mount.p[0] + side * targetExplode * 40, mount.p[1] + targetExplode * 37, mount.p[2]] : [0, 0, 0];
      const target = { x: cx, y: cy, scale: scale * (inspecting ? 2.7 : 1), yaw: interior ? clamp(this.yaw * .4, -.45, .45) : this.yaw, pitch: interior ? .15 + (this.pitch - .2) * .3 : this.pitch, open: targetOpen, focus: inspecting ? 1 : 0, explode: targetExplode, fx: focus[0], fy: focus[1], fz: focus[2] };
      if (activeDrag) Object.assign(target, activeDrag.cameraLock);
      if (!this.camera) this.camera = { ...target };
      const dt = clamp(now - (this.cameraTime || now - 16), 1, 48), blend = this.reduced ? 1 : 1 - Math.exp(-dt / 130);
      this.cameraTime = now;
      Object.keys(target).forEach(k => this.camera[k] = lerp(this.camera[k], target[k], blend));
      if (activeDrag) this.camera.explode = activeDrag.pose;
      const artBlend = 0;
      const cam = this.camera, co = Math.cos(cam.yaw), si = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch), sc = cam.scale;
      const project = p => {
        const x = p[0] - cam.fx, y = p[1] - cam.fy, z = p[2] - cam.fz;
        return [cam.x + (x * co - y * si) * sc, cam.y + ((x * si + y * co) * sp - z * cp) * sc, (x * si + y * co) * cp + z * sp];
      };
      const installing = this.reduced ? 0 : this.progress('equip', now, 850);
      const displacement = type => {
        const expanded = type === selected ? cam.explode : 0, install = type === this.equipType ? installing : 0;
        const s = this.ship.mounts[type]?.side || 1;
        return [s * (expanded * 40 + install * 27), expanded * 37 + install * 44, install * 5];
      };
      const transform = (p, f) => {
        let q = p;
        if (f.shell) {
          const hinge = f.shell * 37, a = -f.shell * cam.open * 1.74;
          const x = p[0] - hinge, y = p[1];
          q = [hinge + x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), p[2]];
        }
        if (f.module) { const offset = displacement(f.module); q = q.map((v, i) => v + offset[i]); }
        return q;
      };
      c.save();
      if (portrait && shipView) {
        const layout = !inspecting ? this.state.inspectionLayout : null;
        c.beginPath(); c.rect(0, layout?.top ?? 120, this.width, layout ? layout.bottom - layout.top : Math.max(160, this.height - 287)); c.clip();
      }
      const trail=this.state.shipTrail||'blue',special=['cosmic','aurora','solar'].includes(trail),jetColors=({blue:['#bffdfa','#7ae3fb','#61a4f7'],orange:['#fff1cc','#ffb665','#f56b30'],cosmic:['#f2dcff','#bf7aff','#7238ee'],aurora:['#e0fff4','#58efb9','#159ba9'],solar:['#ffe8f4','#ff8acb','#c4359d']})[trail]||['#bffdfa','#7ae3fb','#61a4f7'];
      this.ship.jets.forEach(jet => {
        const p = project(jet.p), end = project(jet.end), strength = (1 + warp * 1.6 + travel)*(special?1.7:1);
        const len = Math.hypot(end[0] - p[0], end[1] - p[1]) * (this.reduced ? 1 : 1 + Math.sin(t * 7) * .035);
        const jetScale = sc * (jet.width || 1);
        c.save(); c.globalAlpha = (1 - cam.open * .82) * (1 - cam.focus); c.translate(p[0], p[1]); c.rotate(Math.atan2(end[1] - p[1], end[0] - p[0]));
        const plume = c.createLinearGradient(-4, 0, len * strength, 0); plume.addColorStop(0, jetColors[0]); plume.addColorStop(.14, jetColors[1]+'cc'); plume.addColorStop(.48, jetColors[2]+'55'); plume.addColorStop(1, jetColors[2]+'00');
        c.fillStyle = plume; c.beginPath(); c.moveTo(-3, -16 * jetScale); c.bezierCurveTo(len * .25, -11 * jetScale, len * .60 * strength, -5 * jetScale, len * strength, 0); c.bezierCurveTo(len * .60 * strength, 5 * jetScale, len * .25, 11 * jetScale, -3, 16 * jetScale); c.closePath(); c.fill(); c.restore();
      });
      const drawn = this.ship.faces.filter(f => !f.interior || cam.open > .025).map(f => {
        const world = f.v.map(p => transform(p, f)), points = world.map(project);
        return { f, points, depth: points.reduce((n, p) => n + p[2], 0) / points.length };
      }).sort((a, b) => a.depth - b.depth);
      const boundsOf = points => {
        if (!points.length) return null;
        const x = Math.min(...points.map(p => p[0])), y = Math.min(...points.map(p => p[1]));
        const width = Math.max(...points.map(p => p[0])) - x, height = Math.max(...points.map(p => p[1])) - y;
        return { x, y, width, height, w: width, h: height };
      };
      const selectedFaces = inspecting && mount ? drawn.filter(entry => entry.f.module === selected) : [];
      const pieceBounds = boundsOf(selectedFaces.flatMap(entry => entry.points));
      const socketBounds = boundsOf(selectedFaces.flatMap(entry => entry.f.v.map(project)));
      this.cargoHitFaces = selected === 'cargo' && inspecting && cam.focus > .7 ? drawn.filter(entry => entry.f.module === 'cargo' && entry.f.resource).map(entry => ({ resource: entry.f.resource, points: entry.points })) : [];
      drawn.forEach(({ f, points }) => {
        let alpha = (f.alpha === undefined ? 1 : f.alpha) * (1 - artBlend);
        if (f.interior) alpha *= Math.min(1, cam.open * 2);
        if (f.fairing) alpha *= 1 - cam.open;
        if (f.shell) alpha *= 1 - cam.open * .16;
        if (cam.focus > .01 && f.module !== selected && f.socket !== selected) alpha *= 1 - cam.focus * (f.module ? .77 : .88);
        if (alpha < .015) return;
        c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
        let normal = f.normal;
        if (f.shell) { const a = -f.shell * cam.open * 1.74; normal = [normal[0] * Math.cos(a) - normal[1] * Math.sin(a), normal[0] * Math.sin(a) + normal[1] * Math.cos(a), normal[2]]; }
        const facing = normal[0] * si * cp + normal[1] * co * cp + normal[2] * sp;
        if (facing < 0) normal = normal.map(v => -v);
        const light = clamp(normal[0] * -.48 + normal[1] * .57 + normal[2] * .67, -.5, 1);
        const intensity = f.emissive ? 1 : .40 + Math.max(0, light) * .70;
        let paint = f.c;
        if (f.hull && !f.shell) paint = mix(paint, [39, 61, 73], cam.open * .78);
        if (f.module === selected) paint = mix(paint, [181, 224, 211], .06 * cam.focus);
        const warmth = f.emissive ? paint : mix(mix(paint,[39,86,112],Math.max(0,.50-light)*.35),[255,234,197],Math.max(0,light-.6)*.12);
        const shinePower=f.glass?14:32;
        const specular=f.smooth?Math.pow(Math.max(0,normal[0]*-.35+normal[1]*.86+normal[2]*.37),shinePower)* (f.glass?.55:.19):0;
        const lit=mix(warmth.map(v=>clamp(v*intensity,0,255)),[231,250,239],specular);
        c.globalAlpha = alpha; c.fillStyle = rgb(lit); c.fill();
        if(f.smooth){c.strokeStyle=rgb(lit);c.lineWidth=.45;c.stroke();}
        if (f.glass && !f.smooth) {
          const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));
          const shine = c.createLinearGradient(0, minY, 0, maxY + 1); shine.addColorStop(0, 'rgba(160,229,227,.36)'); shine.addColorStop(.4, 'rgba(61,154,168,.03)'); shine.addColorStop(1, 'rgba(0,15,31,.24)'); c.fillStyle = shine; c.fill();
        }
        if (f.stroke !== false) { c.strokeStyle = f.glass ? 'rgba(123,192,191,.3)' : 'rgba(13,32,45,.18)'; c.lineWidth = clamp(sc * .40, .3, .7); c.stroke(); }
        c.globalAlpha = 1;
      });
      this.ship.glows.forEach(glow => {
        if (glow.interior && cam.open < .3) return;
        const p = project(transform(glow.p, glow));
        const opacity = glow.interior ? cam.open * (cam.focus > .1 && glow.module !== selected ? .2 : 1) : 1 - cam.focus;
        c.save(); c.globalAlpha = opacity * (1-artBlend); c.shadowBlur = 8 * sc; c.shadowColor = glow.color; c.fillStyle = glow.color; c.beginPath(); c.arc(p[0], p[1], Math.max(1, glow.size * sc * .6), 0, TAU); c.fill(); c.restore();
      });
      const illustration=artBlend > .001 && window.OrbitArt?.ready('ship') ? window.OrbitArt.images.ship : null;
      if(illustration) {
        const center=project([0,0,-3]),height=310*sc,width=height*illustration.naturalWidth/illustration.naturalHeight;
        c.save();c.globalAlpha=artBlend;c.translate(center[0],center[1]);c.rotate((cam.yaw-.18)*.05);
        // Existing paint customization also changes the illustration's accent palette.
        const hue={'#71bdc4':148,'#c9b1df':252,'#9bb68c':72,'#e7d8b5':12}[this.state.shipColor];
        if(hue!==undefined)c.filter=`hue-rotate(${hue}deg) saturate(${hue===12?.55:.85})`;
        c.drawImage(illustration,-width/2,-height/2,width,height);c.restore();
      }
      if (cam.open < .8 && !inspecting) {
        const p = project([0, 40, 15]); c.save(); c.globalAlpha = (1 - cam.open) * (1-artBlend); c.translate(p[0], p[1]); c.fillStyle = '#405765'; c.textAlign = 'center'; c.font = `700 ${Math.max(4, 4.8 * sc)}px monospace`; c.fillText('A N D O R I N H A', 0, 0); c.fillStyle = '#79908f'; c.fillRect(-8 * sc, 8 * sc, 16 * sc, 1.2 * sc); c.restore();
      }
      if (mount && cam.explode > .015) {
        const off = displacement(selected); c.save(); c.strokeStyle = `rgba(158,230,207,${cam.explode * .7})`; c.lineWidth = 1; c.setLineDash([3, 5]);
        [-1, 1].forEach(s => { const a = project([mount.socket[0] + s * 11, mount.socket[1], mount.socket[2] - 14]); const b = project([mount.p[0] + s * 11 + off[0], mount.p[1] + off[1], mount.p[2] - 14]); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }); c.setLineDash([]);
        const socket = project(mount.socket); c.strokeStyle = 'rgba(169,228,209,.75)'; c.beginPath(); c.arc(socket[0], socket[1], 11 * sc, 0, TAU); c.stroke(); c.restore();
      }
      if (inspecting && mount && socketBounds && cam.focus > .7 && (cam.explode > .03 || activeDrag?.active)) {
        const b = socketBounds, close = cam.explode < .24;
        c.save(); c.fillStyle = close ? 'rgba(115,226,187,.11)' : 'rgba(104,176,188,.055)';
        c.fillRect(b.x - 5, b.y - 5, b.width + 10, b.height + 10);
        c.strokeStyle = close ? 'rgba(158,248,206,.95)' : 'rgba(144,214,209,.60)'; c.lineWidth = close ? 1.8 : 1; c.setLineDash([4, 4]);
        c.strokeRect(b.x - 5, b.y - 5, b.width + 10, b.height + 10); c.setLineDash([]);
        c.font = '600 10px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = close ? '#b6f6d7' : '#98c9c6'; c.fillText('Encaixar', b.x + b.width / 2, b.y - 13); c.restore();
      }
      const cargoContents = [];
      this.inspection = null;
      if (inspecting && mount && pieceBounds && cam.focus > .7) {
        const socket = project(mount.socket), rest = project(mount.p), extended = project([mount.p[0] + mount.side * 40, mount.p[1] + 37, mount.p[2]]);
        if (selected === 'cargo') {
          const contents = [
            { resource: 'ore', label: 'Minérios', p: [-8, 7.5, -7] },
            { resource: 'crystals', label: 'Cristais', p: Number(this.state.resources?.crystals || 0) > 0 ? [-5, 1.5, 14] : [7, 7, -6] },
            { resource: 'oxygen', label: 'Oxigênio', p: [9, 3.8, 10] }
          ];
          contents.forEach(item => {
            const world = [mount.p[0] + item.p[0], 14 + item.p[1], mount.p[2] + item.p[2]], p = project(transform(world, { module: selected }));
            const itemBounds = boundsOf(this.cargoHitFaces.filter(f => f.resource === item.resource).flatMap(f => f.points));
            cargoContents.push({ resource: item.resource, label: item.label, x: p[0], y: p[1], bounds: itemBounds, visible: true });
          });
        }
        this.inspection = { type: selected, bounds: pieceBounds, socket: { x: socket[0], y: socket[1], bounds: socketBounds }, dragging: !!activeDrag?.active, expanded: activeDrag ? activeDrag.pose >= .5 : !!detail.expanded, pose: cam.explode, expansionVector: { x: extended[0] - rest[0], y: extended[1] - rest[1] }, side: mount.side, contents: cargoContents };
      }
      const hullBounds=boundsOf(drawn.flatMap(entry=>entry.points));
      this.shipHit = hullBounds ? {x:hullBounds.x-12,y:hullBounds.y-12,w:hullBounds.width+24,h:hullBounds.height+24}:null;
      const points = [];
      if (interior && cam.open > .7 && !inspecting && cam.focus < .10) {
        const layout = this.state.inspectionLayout || { top: 120, bottom: this.height - 100, labelWidth: 88, labelHeight: 44 };
        Object.entries(this.ship.mounts).forEach(([type, m]) => {
          const p = project(transform(m.p, { module: type }));
          const edge = 12 + layout.labelWidth / 2;
          points.push({ type, side: m.side, x: m.side < 0 ? edge : this.width - edge, y: p[1], anchorX: p[0], anchorY: p[1], visible: true, attached: true, installed: m.installed });
        });
        // Keep each label beside its real socket; spread only enough for touch targets.
        for (const side of [-1, 1]) {
          const group = points.filter(p => p.side === side).sort((a, b) => a.anchorY - b.anchorY);
          const spacing = Math.min((layout.bottom - layout.top - layout.labelHeight) / (group.length - 1), Math.max(layout.labelHeight + 4, (group.at(-1).anchorY - group[0].anchorY) / (group.length - 1)));
          const span = spacing * (group.length - 1), middle = group.reduce((sum, p) => sum + p.anchorY, 0) / group.length;
          const first = clamp(middle - span / 2, layout.top + layout.labelHeight / 2, Math.max(layout.top + layout.labelHeight / 2, layout.bottom - layout.labelHeight / 2 - span));
          group.forEach((p, i) => { p.y = first + i * spacing; p.connectorX = p.x - side * (layout.labelWidth / 2 - 2); });
        }
      } else if (inspecting && mount && cam.open > .7) {
        const p = project(transform(mount.p, { module: selected }));
        points.push({ type: selected, x: p[0], y: p[1], anchorX: p[0], anchorY: p[1], visible: true, attached: !detail.expanded, label: detail.expanded ? 'Encaixe revelado' : 'Módulo encaixado', installed: mount.installed, bounds: pieceBounds });
      }
      if (installing > 0 && this.equipType && this.ship.mounts[this.equipType]) {
        const p = project(transform(this.ship.mounts[this.equipType].p, { module: this.equipType })); c.save(); c.globalAlpha = installing * cam.open; c.strokeStyle = '#adf1d8'; c.lineWidth = 1.5; c.beginPath(); c.arc(p[0], p[1], 18 * sc + (1 - installing) * 18, 0, TAU); c.stroke(); c.restore();
      }
      c.restore();
      // Labels and connectors share geometry outside the model's clipping region.
      if (interior && !inspecting) {
        c.save(); c.globalAlpha = cam.open; c.strokeStyle = 'rgba(152,207,194,.45)'; c.lineWidth = 1;
        for (const p of points) {
          c.beginPath(); c.moveTo(p.connectorX, p.y); c.lineTo(p.anchorX, p.anchorY); c.stroke();
          c.fillStyle = '#a0d6c9'; c.beginPath(); c.arc(p.anchorX, p.anchorY, 2, 0, TAU); c.fill();
        }
        c.restore();
      }
      this.publishHotspots(points);
      this.publishCargoHotspots(cargoContents);
    }
    publishHotspots(points) {
      this.hotspots = points;
      const key = points.map(p => `${p.type}:${Math.round(p.x * 4)}:${Math.round(p.y * 4)}:${p.side}:${p.visible}:${p.attached}`).join('|');
      if (key !== this.hotspotKey) { this.hotspotKey = key; this.callbacks.onHotspots?.(this.getHotspots()); }
    }
    publishCargoHotspots(points) {
      const key = points.map(p => `${p.resource}:${Math.round(p.x * 4)}:${Math.round(p.y * 4)}`).join('|');
      if (key !== this.cargoHotspotKey) { this.cargoHotspotKey = key; this.callbacks.onCargoHotspots?.(points.map(p => ({ ...p, bounds: p.bounds ? { ...p.bounds } : null }))); }
    }
    pickCargo(x, y) {
      for (let i = (this.cargoHitFaces || []).length - 1; i >= 0; i--) {
        const face = this.cargoHitFaces[i], points = face.points; let inside = false;
        for (let a = 0, b = points.length - 1; a < points.length; b = a++) {
          const p = points[a], q = points[b];
          if ((p[1] > y) !== (q[1] > y) && x < (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]) + p[0]) inside = !inside;
        }
        if (inside) return face.resource;
      }
      return null;
    }
    getInspection() {
      if (!this.inspection) return null;
      const i = this.inspection;
      return { ...i, bounds: { ...i.bounds }, socket: { ...i.socket, bounds: i.socket.bounds ? { ...i.socket.bounds } : null }, expansionVector: { ...i.expansionVector }, contents: i.contents.map(p => ({ ...p, bounds: p.bounds ? { ...p.bounds } : null })) };
    }
    getHotspots() { return (this.hotspots || []).map(p => ({ ...p })); }
    destroy() {
      this.dead = true; if (this.raf) cancelAnimationFrame(this.raf);
      this.observer?.disconnect(); window.removeEventListener('resize', this.resize); document.removeEventListener('visibilitychange', this.onVisibility); window.removeEventListener('orbit-art-ready', this.onArtReady);
      this.canvas.removeEventListener('pointerdown', this.onDown); this.canvas.removeEventListener('pointermove', this.onMove); this.canvas.removeEventListener('pointerup', this.onUp); this.canvas.removeEventListener('pointercancel', this.onUp); this.canvas.removeEventListener('lostpointercapture', this.onUp); this.canvas.removeEventListener('wheel', this.onWheel); this.planetCache.clear(); this.weatherCache.clear(); this.mapArtCache.clear();
    }
  }
  window.OrbitScene = OrbitScene;
})();
