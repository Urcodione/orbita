(function(root){
'use strict';
// Provisional illustrations for the six capture tools, drawn as shaded vectors in the ship's palette (ivory ceramic,
// brushed copper, teal glass). When the painted atlas assets/xeno-tools.webp exists (see assets/XENO-ARTE.md), the
// build embeds it as OrbitIllustrations.xenoTools and the UI uses that instead.
const defs=`<defs>
<linearGradient id="xt-ivory" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff8ea"/><stop offset=".55" stop-color="#e6d6bc"/><stop offset="1" stop-color="#9c8a72"/></linearGradient>
<linearGradient id="xt-copper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd09a"/><stop offset=".45" stop-color="#c8763d"/><stop offset="1" stop-color="#6e3519"/></linearGradient>
<linearGradient id="xt-teal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff7f2"/><stop offset=".5" stop-color="#2ba7a8"/><stop offset="1" stop-color="#0d4a55"/></linearGradient>
<radialGradient id="xt-violet"><stop offset="0" stop-color="#f3e6ff"/><stop offset=".45" stop-color="#b07bff"/><stop offset="1" stop-color="#5a2aa8" stop-opacity="0"/></radialGradient>
<radialGradient id="xt-toxic"><stop offset="0" stop-color="#eaffb8"/><stop offset=".5" stop-color="#7bd64a"/><stop offset="1" stop-color="#2b6a1c"/></radialGradient>
<radialGradient id="xt-heat"><stop offset="0" stop-color="#fff2c2"/><stop offset=".45" stop-color="#ff9a3d"/><stop offset="1" stop-color="#a5300f"/></radialGradient>
<radialGradient id="xt-frost"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#9fe6ff"/><stop offset="1" stop-color="#2a76b8"/></radialGradient>
<filter id="xt-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#000" flood-opacity=".45"/></filter>
</defs>`;
const shapes={
 garra:`<g filter="url(#xt-shadow)"><path d="M14 52 L30 34 L36 40 L20 58 Z" fill="url(#xt-copper)"/><circle cx="33" cy="37" r="6" fill="url(#xt-ivory)" stroke="#6e3519" stroke-width="1.2"/><path d="M33 31 C40 18 50 14 56 16 C52 20 46 24 42 32 Z" fill="url(#xt-ivory)" stroke="#7d5a3a" stroke-width="1.2"/><path d="M38 36 C50 30 58 34 60 40 C54 39 48 40 42 43 Z" fill="url(#xt-ivory)" stroke="#7d5a3a" stroke-width="1.2"/><path d="M35 42 C42 50 44 58 40 62 C38 56 35 52 31 47 Z" fill="url(#xt-ivory)" stroke="#7d5a3a" stroke-width="1.2"/><circle cx="33" cy="37" r="2.4" fill="#5ee7e0"/><path d="M14 52 L20 58" stroke="#ffe0b8" stroke-width="1" opacity=".7"/></g>`,
 rede:`<g filter="url(#xt-shadow)"><circle cx="32" cy="32" r="24" fill="none" stroke="url(#xt-copper)" stroke-width="5"/><circle cx="32" cy="32" r="20" fill="#0d3a44" opacity=".55"/><g stroke="#7ff7ee" stroke-width="1.4" opacity=".95" fill="none"><path d="M32 12 L49 22 L49 42 L32 52 L15 42 L15 22 Z"/><path d="M32 12 L32 52 M15 22 L49 42 M49 22 L15 42"/><path d="M23.5 17 L40.5 47 M40.5 17 L23.5 47 M15 32 L49 32"/></g><circle cx="32" cy="32" r="4" fill="url(#xt-teal)"/><circle cx="32" cy="8" r="3.4" fill="url(#xt-ivory)"/><circle cx="56" cy="32" r="3.4" fill="url(#xt-ivory)"/><circle cx="8" cy="32" r="3.4" fill="url(#xt-ivory)"/><circle cx="32" cy="56" r="3.4" fill="url(#xt-ivory)"/></g>`,
 casulo:`<g filter="url(#xt-shadow)"><ellipse cx="32" cy="34" rx="16" ry="22" fill="#cfeff0" opacity=".35" stroke="#e9fffb" stroke-width="1.5"/><ellipse cx="32" cy="38" rx="11" ry="13" fill="url(#xt-toxic)" opacity=".85"/><circle cx="28" cy="34" r="2.2" fill="#f2ffd8" opacity=".8"/><circle cx="35" cy="42" r="1.6" fill="#f2ffd8" opacity=".7"/><rect x="15" y="20" width="34" height="5" rx="2.5" fill="url(#xt-copper)"/><rect x="15" y="44" width="34" height="5" rx="2.5" fill="url(#xt-copper)"/><path d="M22 12 H42 L39 18 H25 Z" fill="url(#xt-ivory)" stroke="#7d5a3a" stroke-width="1"/><path d="M26 56 H38 L36 60 H28 Z" fill="url(#xt-ivory)"/><path d="M24 26 C22 32 22 40 24 46" stroke="#ffffff" stroke-width="2" opacity=".55" fill="none"/></g>`,
 laco:`<g filter="url(#xt-shadow)"><ellipse cx="34" cy="26" rx="20" ry="11" fill="none" stroke="url(#xt-violet)" stroke-width="7" opacity=".9"/><ellipse cx="34" cy="26" rx="20" ry="11" fill="none" stroke="#efe0ff" stroke-width="1.6"/><path d="M18 31 C16 40 20 46 24 50" stroke="#c9a6ff" stroke-width="3" fill="none"/><rect x="18" y="46" width="13" height="14" rx="4" fill="url(#xt-copper)" transform="rotate(-18 24 53)"/><circle cx="25" cy="50" r="3" fill="#b07bff"/><circle cx="50" cy="20" r="2.2" fill="#ffffff"/><circle cx="16" cy="24" r="1.6" fill="#ffffff" opacity=".8"/></g>`,
 crio:`<g filter="url(#xt-shadow)"><rect x="18" y="10" width="28" height="46" rx="12" fill="url(#xt-ivory)" stroke="#7d5a3a" stroke-width="1.2"/><rect x="23" y="18" width="18" height="28" rx="8" fill="url(#xt-frost)" stroke="#e9fffb" stroke-width="1.2"/><path d="M32 22 V42 M24.5 26.5 L39.5 37.5 M39.5 26.5 L24.5 37.5" stroke="#ffffff" stroke-width="1.6" opacity=".9"/><rect x="16" y="12" width="32" height="5" rx="2.5" fill="url(#xt-copper)"/><rect x="16" y="49" width="32" height="5" rx="2.5" fill="url(#xt-copper)"/><circle cx="44" cy="31" r="2" fill="#5ee7e0"/><path d="M12 56 L16 52 M50 58 L47 53 M10 44 L14 44" stroke="#bfefff" stroke-width="1.4"/></g>`,
 termico:`<g filter="url(#xt-shadow)"><path d="M10 30 C10 46 22 56 32 56 C42 56 54 46 54 30 Z" fill="url(#xt-copper)" stroke="#6e3519" stroke-width="1.2"/><path d="M14 30 C15 42 24 50 32 50 C40 50 49 42 50 30 Z" fill="#3a1a10" opacity=".55"/><circle cx="32" cy="34" r="9" fill="url(#xt-heat)"/><path d="M8 30 H56" stroke="url(#xt-ivory)" stroke-width="4" stroke-linecap="round"/><g stroke="url(#xt-ivory)" stroke-width="3" stroke-linecap="round"><path d="M20 22 V14"/><path d="M32 22 V10"/><path d="M44 22 V14"/></g><path d="M26 30 C24 26 28 24 26 20 M38 30 C36 26 40 24 38 20" stroke="#ffcf8a" stroke-width="1.4" fill="none" opacity=".85"/></g>`
};
function svg(id,size=64){const body=shapes[id];if(!body)return '';return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${defs}${body}</svg>`;}
const ORDER=['garra','rede','casulo','laco','crio','termico'];
// Markup for a tool icon: the painted atlas (2 columns × 3 rows, in ORDER) when present, otherwise the vector.
function html(id,cls=''){const src=root.OrbitIllustrations?.xenoTools,i=ORDER.indexOf(id);
 if(src&&i>=0)return `<span class="og-xeno-toolart ${cls}" style="background-image:var(--og-xeno-tools-art);background-position:${i%2*100}% ${Math.floor(i/2)*50}%" aria-hidden="true"></span>`;
 return `<span class="og-xeno-toolart ${cls}" aria-hidden="true">${svg(id)}</span>`;}
// Image for canvas use (cinematics): the painted atlas cell once it has loaded (reading it starts the load), else the vector.
const images={},painted={};
function image(id){const i=ORDER.indexOf(id),art=root.OrbitArt;
 if(i>=0&&root.OrbitIllustrations?.xenoTools&&art?.images.xenoTools&&art.ready('xenoTools')){if(painted[id])return painted[id];
  const p=art.images.xenoTools,cv=document.createElement('canvas');cv.width=cv.height=256;cv.getContext('2d').drawImage(p,i%2*p.width/2,Math.floor(i/2)*p.height/3,p.width/2,p.height/3,0,0,256,256);return painted[id]=cv;}
 if(images[id])return images[id];const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg(id,256));return images[id]=im;}
const game=root.document?.getElementById('orbit-game');
if(game){for(const [key,name]of [['xenoTools','xeno-tools'],['xenoSpecimens','xeno-specimens']])if(root.OrbitIllustrations?.[key])game.style.setProperty('--og-'+name+'-art','url("'+root.OrbitIllustrations[key]+'")');}
root.OrbitXenoTools={svg,html,image,ORDER};
})(window);
