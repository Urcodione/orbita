(function(root){
'use strict';
// Laboratory, capture feedback and rune slots for the unique exemplars (logic in xenobiology.js).
const E=root.OrbitEngine;if(!E?.xenoView)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const RES={credits:'Lumes',data:'dados',ore:'minério',crystals:'cristais',reserve:'energia',integrity:'integridade'};
const costText=cost=>Object.entries(cost||{}).filter(([,n])=>n).map(([k,n])=>n+' '+(RES[k]||k)).join(' · ');
const biomeName=b=>E.biomes?.[b]?.name||b;
let selected={specimen:null,rune:null};
// Painted biology atlas (2 columns × 3 rows) with a hue shift: each exemplar reads as its own creature.
function art(sp,{unknown=false,size=''}={}){const [index,hue]=sp.art;return `<span class="og-xeno-art ${unknown?'is-unknown':''} ${size}" style="--art-x:${index%2*100}%;--art-y:${Math.floor(index/2)*50}%;--hue:${hue}deg" aria-hidden="true"></span>`;}
function status(sp){return sp.engraved?'Runa gravada':sp.hasRune?'Runa pronta':sp.studied?'Estudado':sp.captured?'No laboratório':sp.pending?'Na carga':sp.hint?'Neste setor':'Desconhecido';}
function actionButton(action,label,preview,attrs){return `<button class="og-button ${preview.allowed?'primary':''}" data-action="${action}" ${attrs} ${preview.allowed?'':'disabled'} title="${esc(preview.reason||'')}">${esc(label)}<span class="og-cost">${esc(costText(preview.cost))}</span></button>${preview.allowed?'':`<p class="og-xeno-reason">${esc(preview.reason)}</p>`}`;}
function lab(s){
 const v=E.xenoView(s),here=v.specimens.filter(sp=>sp.hint),known=v.specimens.filter(sp=>sp.captured||sp.pending);
 const tile=sp=>{const open=sp.captured||sp.hint||sp.pending;return `<button class="og-xeno-tile ${sp.captured?'is-captured':''}" ${open?`data-xeno-sheet="xeno-specimen" data-xeno-specimen="${esc(sp.id)}"`:'disabled'} aria-label="${esc(open?sp.name:'Exemplar desconhecido')}">${art(sp,{unknown:!sp.captured&&!sp.pending})}<strong>${esc(sp.captured||sp.pending?sp.name:sp.hint?'Sinal vivo':'???')}</strong><small>${esc(status(sp))}</small></button>`;};
 return {title:'Laboratório de xenobiologia',html:`<div class="og-xeno-summary"><strong>${v.captured}/${v.total}</strong><span>exemplares únicos · ${v.runes.length} runas</span></div>`+
  (here.length?`<h3 class="og-xeno-heading">Sinais vivos neste setor</h3><div class="og-xeno-hints">${here.map(sp=>`<button class="og-xeno-hint" data-xeno-sheet="xeno-specimen" data-xeno-specimen="${esc(sp.id)}">${art(sp,{unknown:true})}<span><strong>${sp.kind==='fauna'?'Fauna':'Flora'} única em ${esc(sp.hint.planetName)}</strong><small>${esc(sp.behaviorLabel)} · requer ${esc(sp.toolName)}</small></span></button>`).join('')}</div>`:'<p class="og-xeno-empty">Nenhum sinal vivo único neste setor.</p>')+
  `<h3 class="og-xeno-heading">Coleção</h3><div class="og-xeno-collection">${[0,4,8,12].map(i=>`<div class="og-xeno-grid">${v.specimens.slice(i,i+4).map(tile).join('')}</div>`).join('')}</div>`+
  (v.runes.length?`<h3 class="og-xeno-heading">Runas</h3><div class="og-xeno-runes">${v.runes.map(r=>`<button class="og-xeno-rune" data-xeno-sheet="xeno-rune" data-xeno-rune="${esc(r.id)}"><b>◆</b><span><strong>${esc(r.name)}</strong><small>${esc(r.text)}${r.module?' · em '+esc(r.module.name):' · livre'}</small></span></button>`).join('')}</div>`:'')};
}
function specimenSheet(s){
 const sp=E.xenoView(s).specimens.find(x=>x.id===selected.specimen);if(!sp)return {title:'Laboratório',html:'<p>Exemplar indisponível.</p>'};
 const known=sp.captured||sp.pending;
 let body;
 if(!known)body=`<p>${esc(sp.kind==='fauna'?'Um animal':'Uma planta')} único vive em <strong>${esc(sp.hint?.planetName||'algum mundo')}</strong>, em um dos locais de exploração. ${esc(sp.behaviorLabel)}: ${esc(E.xenoCatalog.BEHAVIORS[sp.behavior].hint)}</p><p class="og-xeno-tool">Ferramenta: <strong>${esc(sp.toolName)}</strong> · ${E.xenoView(s).tools.find(t=>t.id===sp.tool).owned?'na nave':'à venda nos entrepostos'}</p>`;
 else if(sp.pending)body='<p>Contido na carga da expedição. Extraia-o na nave para levá-lo ao laboratório.</p>';
 else body=`<p class="og-xeno-lore">${esc(sp.lore)}</p>`+(sp.studied?`<div class="og-xeno-runecard"><b>◆</b><span><strong>${esc(sp.rune.name)}</strong><small>${esc(sp.rune.text)}</small></span></div>`:'<div class="og-xeno-runecard is-locked"><b>◇</b><span><strong>Runa desconhecida</strong><small>O estudo revela o que este exemplar pode gravar em um módulo.</small></span></div>')+
  (!sp.studied?actionButton('xenoStudy','Estudar exemplar',sp.studyPreview,`data-xeno-specimen="${esc(sp.id)}"`):!sp.hasRune?actionButton('xenoRune','Criar '+sp.rune.name,sp.runePreview,`data-xeno-specimen="${esc(sp.id)}"`):`<button class="og-button primary" data-xeno-sheet="xeno-rune" data-xeno-rune="${esc(sp.rune.id)}">${sp.engraved?'Mover runa':'Gravar runa em um módulo'}</button>`);
 return {title:known?sp.name:'Sinal vivo',singleCard:true,html:`<div class="og-xeno-hero">${art(sp,{unknown:!known,size:'is-large'})}<div><small>${sp.kind==='fauna'?'Fauna':'Flora'} única · ${esc(sp.biomes.map(biomeName).join(' · '))}</small><strong>${esc(known?sp.name:'???')}</strong><span>${esc(sp.behaviorLabel)}</span></div></div>${body}`};
}
function runeSheet(s){
 const r=E.xenoView(s).runes.find(x=>x.id===selected.rune);if(!r)return {title:'Runas',html:'<p>Runa indisponível.</p>'};
 const modules=[...Object.values(s.equipped).map(m=>({m,installed:true})),...s.inventory.map(m=>({m,installed:false}))];
 const row=({m,installed})=>{const here=m.rune===r.id,other=m.rune&&!here;
  const p=here?E.preview(s,'runeRemove',{moduleId:m.id}):E.preview(s,'runeEngrave',{runeId:r.id,moduleId:m.id});
  return `<div class="og-xeno-module ${here?'is-here':''}"><span><strong>${esc(m.name)}</strong><small>${installed?'Instalado':'No estoque'}${other?' · já tem runa':''}</small></span><button class="og-button small" data-action="${here?'runeRemove':'runeEngrave'}" data-xeno-rune="${esc(r.id)}" data-xeno-module="${esc(m.id)}" ${p.allowed?'':'disabled'} title="${esc(p.reason||'')}">${here?'Remover':'Gravar'}${!here&&p.cost?.credits?`<span class="og-cost">${p.cost.credits} Lumes</span>`:''}</button></div>`;};
 return {title:r.name,html:`<div class="og-xeno-runecard"><b>◆</b><span><strong>${esc(r.name)}</strong><small>${esc(r.text)}. Uma runa por módulo; módulos com runa não podem ser reciclados.</small></span></div><div class="og-xeno-modules">${modules.map(row).join('')}</div>`};
}
function toolsSheet(s){
 const v=E.xenoView(s),beh=E.xenoCatalog.BEHAVIORS;
 return {title:'Ferramentas de captura',html:`<p>Cada exemplar único exige uma ferramenta. Elas ficam na nave para sempre.</p><div class="og-xeno-tools">${v.tools.map(t=>`<article class="og-xeno-toolcard ${t.owned?'is-owned':''}"><strong>${esc(t.name)}</strong><small>${esc(t.description)}</small><small>Para: ${esc(Object.values(beh).filter(b=>b.tool===t.id).map(b=>b.label.toLowerCase()).join(', '))}</small>${t.owned?'<span class="og-xeno-owned">Na nave</span>':actionButton('xenoBuyTool','Comprar',t.preview,`data-xeno-tool="${esc(t.id)}"`)}</article>`).join('')}</div>`};
}
function sheet(name,s){
 if(name==='xeno')return lab(s);
 if(name==='xeno-specimen')return specimenSheet(s);
 if(name==='xeno-rune')return runeSheet(s);
 if(name==='xeno-tools')return toolsSheet(s);
 return null;
}
// Rune slot on a module card: shows the engraved rune (with removal) or offers the free runes.
function moduleRune(s,m){
 const v=E.xenoView(s);if(!v.runes.length&&!m.rune)return '';
 if(m.rune){const r=v.runes.find(x=>x.id===m.rune),p=E.preview(s,'runeRemove',{moduleId:m.id});return `<div class="og-rune-slot is-filled"><b>◆</b><span><strong>${esc(r?.name||'Runa')}</strong><small>${esc(r?.text||'')}</small></span><button class="og-button small" data-action="runeRemove" data-xeno-module="${esc(m.id)}" ${p.allowed?'':'disabled'} title="${esc(p.reason||'')}">Remover</button></div>`;}
 const free=v.runes.filter(r=>!r.module);if(!free.length)return '<div class="og-rune-slot"><b>◇</b><span><small>Encaixe de runa vazio · todas as runas estão gravadas</small></span></div>';
 return `<div class="og-rune-slot"><b>◇</b><span><small>Encaixe de runa vazio</small></span>${free.slice(0,3).map(r=>{const p=E.preview(s,'runeEngrave',{runeId:r.id,moduleId:m.id});return `<button class="og-button small" data-action="runeEngrave" data-xeno-rune="${esc(r.id)}" data-xeno-module="${esc(m.id)}" ${p.allowed?'':'disabled'} title="${esc(p.reason||r.text)}">${esc(r.name)}</button>`;}).join('')}</div>`;
}
// Short capture scene: the behaviour plays out (flee, toxin, camouflage, wind, frost, heat) and the tool closes on it.
function scene(container,sp,mode){
 container.querySelector('.og-xeno-scene')?.remove();
 const el=document.createElement('div');el.className='og-xeno-scene is-'+sp.behavior+' is-'+mode;el.setAttribute('role','status');
 const line=mode==='capture'?{foge:'Ele dispara pelo terreno… a garra o alcança.',camufla:'A rede revela o contorno escondido.',veneno:'Uma nuvem de toxina! O casulo sela a tempo.',voa:'Ele sobe no vento… o laço o ancora.',congela:'A geada se espalha; a cápsula mantém o frio.',irradia:'Calor intenso! O coletor isola a planta.'}[sp.behavior]:'Chegou ao laboratório de bordo. Estude-o para revelar sua runa.';
 el.innerHTML=`<div class="og-xeno-stage">${art(sp,{size:'is-large'})}<i class="og-xeno-fx"></i><i class="og-xeno-tool-fx"></i></div><strong>${mode==='capture'?'Exemplar único contido':'Novo exemplar no laboratório'}</strong><span>${esc(sp.name)}</span><small>${esc(line)}</small>`;
 container.append(el);setTimeout(()=>el.classList.add('is-leaving'),3600);setTimeout(()=>el.remove(),4100);
}
function find(id){return E.xenoCatalog.SPECIMENS.find(s=>s.id===id);}
root.OrbitXenoUI={sheet,moduleRune,cellArt(id){const sp=find(id);return sp?art(sp,{size:'is-cell'}):'';},select(specimen,rune){selected={specimen:specimen||selected.specimen,rune:rune||selected.rune};},
 captured(container,id){const sp=find(id);if(sp)scene(container,sp,'capture');},arrived(container,id){const sp=find(id);if(sp)scene(container,sp,'arrival');}};
})(window);
