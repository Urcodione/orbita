(function(root){
'use strict';
// Makes results visible: gained resources rise in green, spent ones fall in red, and the first time a species
// reaches the hold a card says what it is for.
const E=root.OrbitEngine;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NAMES={credits:'Lumes',data:'pesquisa',ore:'minério',crystals:'cristais',fuel:'combustível',oxygen:'oxigênio',hull:'casco',warpFuel:'célula de dobra',reserve:'energia',integrity:'integridade'};
const name=k=>NAMES[k]||E.materials?.[k]?.name||null;
// Field steps already show their cost on the cell and in the energy bar; only other actions get falling costs.
const QUIET_COSTS=['expeditionMove','expeditionWait','expeditionTune','expeditionScan','expeditionBeacon','expeditionCollect','expeditionInteract'];
function chips(result,action){
 const out=[];
 for(const [k,v]of Object.entries(result.reward||{}))if(typeof v==='number'&&v>0&&name(k))out.push({text:'+'+v+' '+name(k),good:true});
 if(!QUIET_COSTS.includes(action))for(const [k,v]of Object.entries(result.cost||{}))if(typeof v==='number'&&v>0&&name(k))out.push({text:'−'+v+' '+name(k),good:false});
 return out.slice(0,5);
}
function float(container,list,pending){
 if(!list.length)return;container.querySelector('.og-reward-float')?.remove();
 const el=document.createElement('div');el.className='og-reward-float';el.setAttribute('aria-hidden','true');
 el.innerHTML=list.map((c,i)=>`<span class="${c.good?'is-gain':'is-cost'}" style="--i:${i}">${esc(c.text)}${pending&&c.good?' <small>na carga</small>':''}</span>`).join('');
 container.append(el);setTimeout(()=>el.remove(),2600);
}
let seen=null;
function seenSet(){if(seen)return seen;try{seen=new Set(JSON.parse(localStorage.getItem('orbita-species-seen')||'[]'));}catch{seen=new Set();}return seen;}
function markSeen(id){seenSet().add(id);try{localStorage.setItem('orbita-species-seen',JSON.stringify([...seen]));}catch{}}
function speciesCard(container,id,amount){
 const m=E.materials?.[id];if(!m||m.bio===undefined)return;
 container.querySelector('.og-species-card')?.remove();
 const el=document.createElement('div');el.className='og-species-card';el.setAttribute('role','status');
 el.innerHTML=`<span class="og-species-art" style="--art-x:${m.bio%2*100}%;--art-y:${Math.floor(m.bio/2)*50}%" aria-hidden="true"></span><div><small>Nova espécie · ${esc(m.category)} · ${esc(m.rarity)}</small><strong>${esc(m.name)}</strong><p>${esc(m.description)}</p><small>${esc(id==='lumenfern'?'Use na Oficina → Manutenção para produzir oxigênio, ou venda no entreposto.':'Valorizada nos entrepostos: venda pelo Mercado ou entregue em encomendas.')} +${amount} na nave.</small></div>`;
 container.append(el);setTimeout(()=>el.classList.add('is-leaving'),5500);setTimeout(()=>el.remove(),6000);
}
root.OrbitFeedback={show(container,result,action,state){
 if(!result?.ok)return;
 // The extraction summary already lists every reward; floating numbers would only repeat it.
 if(action!=='expeditionExtract')float(container,chips(result,action),!!state.expedition&&action==='expeditionCollect');
 if(action==='expeditionExtract')for(const [id,amount]of Object.entries(result.reward||{}))if(E.materials?.[id]?.bio!==undefined&&amount>0&&!seenSet().has(id)){markSeen(id);const wait=result.cinema?(result.cinema.seen?1500:4300):container.querySelector('.og-xeno-scene')?4300:0;setTimeout(()=>speciesCard(container,id,amount),wait);break;}
}};
})(window);
