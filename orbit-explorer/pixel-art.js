(function () {
  'use strict';
  // Shared indexed palette. Art is drawn on a 2× pixel grid; UI/hit testing stays in CSS coordinates.
  const palette = ['080e21','10182d','171f38','202a45','2d3553','3c4266','514b78','69558c','8d6aab','b18cc8','d4b8e6','f2ddf0',
    '102c3c','194150','245663','30717b','48929a','6eb5b7','9ad6cb','c7eee0','eff4df',
    '173831','24513f','337155','4c9265','75b579','a6cf92','d1e6ad',
    '382932','58383f','7c4948','a15c4d','c57957','e89c65','f6c180','ffe0a3','fff1cf',
    '242b45','334765','49648a','6386ab','81acd0','a9d3e6','d6edf0',
    '402d52','624273','8c5893','b87bb0','e0a0ca','f6c7d8',
    '5b3436','9e4540','d56545','ef8951','ffb354','ffd66b','ffe99b',
    '3b4450','59646b','7d8b8e','a3b3ad','c9d4bf','e5e7cf'];
  const colors = palette.map(h => [0,2,4].map(i => parseInt(h.slice(i,i+2),16)));
  let lookup;
  function table() {
    if (lookup) return lookup;
    lookup = new Uint8Array(32768);
    for (let n=0;n<32768;n++) {
      const r=((n>>10)&31)*8+4,g=((n>>5)&31)*8+4,b=(n&31)*8+4;
      let best=Infinity,index=0;
      colors.forEach((c,i)=>{ const d=(r-c[0])**2*.85+(g-c[1])**2*1.2+(b-c[2])**2; if(d<best){best=d;index=i;} });
      lookup[n]=index;
    }
    return lookup;
  }
  function finish(c) {
    const w=c.canvas.width,h=c.canvas.height;if(!w||!h)return;
    const im=c.getImageData(0,0,w,h),d=im.data,lut=table();
    for(let i=0;i<d.length;i+=4){ if(!d[i+3])continue;const col=colors[lut[((d[i]>>3)<<10)|((d[i+1]>>3)<<5)|(d[i+2]>>3)]]; d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2]; }
    c.putImageData(im,0,0);
  }
  const hash=(x,y,seed)=>{let n=Math.imul(x+seed,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
  function noise(x,y,seed){let a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return (hash(a,b,seed)*(1-u)+hash(a+1,b,seed)*u)*(1-v)+(hash(a,b+1,seed)*(1-u)+hash(a+1,b+1,seed)*u)*v;}
  function nebula(width,height,seed=17) {
    const cvs=document.createElement('canvas');cvs.width=Math.ceil(width/2);cvs.height=Math.ceil(height/2);
    const c=cvs.getContext('2d'),im=c.createImageData(cvs.width,cvs.height),d=im.data;
    const ramps=[['080e21','10182d','171f38','202a45','2d3553','3c4266','514b78'],['080e21','10182d','171f38','102c3c','194150','245663','30717b']].map(r=>r.map(h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16))));
    for(let y=0;y<cvs.height;y++)for(let x=0;x<cvs.width;x++){
      const u=x/cvs.width,v=y/cvs.height;
      const n=noise(x/28,y/32,seed)*.6+noise(x/11,y/13,seed+7)*.27+noise(x/4,y/5,seed+19)*.13;
      const ribbon=Math.exp(-((v-.38-u*.22+Math.sin(u*6+seed)*.10)**2)/.026);
      const ribbon2=Math.exp(-((v-.75+u*.5)**2)/.018)*.65;
      const strength=Math.max(ribbon,ribbon2)*Math.max(0,(n-.28))*14;
      const dither=((x&1)^(y&1))*.18;
      const col=ramps[ribbon>ribbon2?0:1][Math.min(6,Math.floor(strength+dither))];
      const i=(y*cvs.width+x)*4;d.set([...col,255],i);
    }
    c.putImageData(im,0,0);return cvs;
  }
  // Small hand-authored silhouette sprites also identify modules in the workshop.
  const sprites={
    engine:['.....aa.....','....abba....','...abbbba...','...acccca...','...acccca...','...adddda...','..aaddddaa..','..adddddda..','...aaaaaa...','....effe....','...effffe...','....effe....'],
    warp:['....aaaa....','..aabbbbaa..','.abccccc cba.'.replace(/ /g,''),'.abc....cba.','abc..dd..cba','abc.dffd.cba','abc.dffd.cba','abc..dd..cba','.abc....cba.','.abccccccba.','..aabbbbaa..','....aaaa....'],
    shield:['..aaaaaaaa..','..abbbbbba..','..abccccba..','..abcddcba..','..abcddcba..','..abcddcba..','...abccba...','...abccba...','....abba....','.....aa.....'],
    scanner:['.....aa.....','..aaaabaaa..','..abbbbbba..','...abbbba...','....abba....','.....aa.....','.....ab.....','...aaabaa...','..abbbbbba..','..aaaaaaaa..'],
    cargo:['.aaaaaaaaaa.','.abbbabbbba.','.abbbabbbba.','.abbbabbbba.','.aaaaaaaaaa.','.acccccccca.','.acddddddca.','.acccccccca.','.aaaaaaaaaa.'],
    life:['...aaaaaa...','..abbbbbaa..','..abccccba..','..abcddcba..','..abccccba..','..abccccba..','..abccccba..','..abbbb bba..'.replace(/ /g,''),'...aaaaaa...'],
    collector:['.......aaa..','......abba..','..aa..aba...','.abbaaba....','.abbbba.....','..abba......','...aba......','...aba......','..aabba.....','.abbbbba....','.aaaaaaa....'],
    survival:['....aaaa....','....abba....','..aaaaaaaa..','.abbbbbbba..','.abcccccba..','.abccdccba..','.abcddd cba..'.replace(/ /g,''),'.abccdccba..','.abcccccba..','.aaaaaaaaa..']
  };
  function spriteURL(type){const rows=sprites[type]||sprites.cargo,cvs=document.createElement('canvas');cvs.width=12;cvs.height=12;const c=cvs.getContext('2d'),ink={a:'#10182d',b:'#7d8b8e',c:'#e5e7cf',d:'#48929a',e:'#e89c65',f:'#ffe0a3'};rows.forEach((row,y)=>[...row].forEach((v,x)=>{if(ink[v]){c.fillStyle=ink[v];c.fillRect(x,y,1,1);}}));return cvs.toDataURL();}
  sprites.arm=sprites.collector;
  const root=document.getElementById('orbit-game');
  if(root) Object.keys(sprites).forEach(type=>root.style.setProperty('--pixel-'+type,`url("${spriteURL(type)}")`));
  window.OrbitPixel={finish,nebula,spriteURL};
})();
