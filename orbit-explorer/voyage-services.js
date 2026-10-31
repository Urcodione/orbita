(function(root){
'use strict';
const E=root.OrbitEngine,key='orbita-explorador-v1',backup=key+'-backup';
let lastGood=null,lastCheckpoint=0;
function decode(text){if(typeof text!=='string'||text.length>2_000_000)throw Error('Arquivo de partida inválido ou grande demais.');const wrapper=JSON.parse(text),value=wrapper.privateContent||wrapper;if(!value||!E.restore(value.state))throw Error('Esta partida não é válida ou não é compatível.');return value;}
function read(){for(const k of [key,backup])try{const text=localStorage.getItem(k);if(!text)continue;const value=decode(text);lastGood=JSON.stringify(value);return {value,recovered:k===backup};}catch{}return null;}
function write(value){const text=JSON.stringify(value);try{const now=Date.now();if(lastGood&&now-lastCheckpoint>=60000){localStorage.setItem(backup,lastGood);lastCheckpoint=now;}localStorage.setItem(key,text);lastGood=text;return true;}catch{return false;}}
function checkpoint(){try{if(!lastGood)return false;localStorage.setItem(backup,lastGood);lastCheckpoint=Date.now();return true;}catch{return false;}}
function previous(){try{const text=localStorage.getItem(backup);return text?decode(text):null;}catch{return null;}}
function download(value){const text=JSON.stringify({format:'orbita-backup-v1',...value});if(root.OrbitFiles?.exportGame){root.OrbitFiles.exportGame(text);return;}const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='orbita-partida-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
root.OrbitSaves={read,write,checkpoint,previous,decode,download};
})(window);
