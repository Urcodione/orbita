// Efeitos sintetizados para a viagem, gelo, vulcão, atmosfera, floresta e portal.
const fs=require('fs');const rate=48000,T=32,N=rate*T,ch=2,buf=Buffer.alloc(44+N*4),tau=2*Math.PI;buf.write('RIFF');buf.writeUInt32LE(buf.length-8,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(ch,22);buf.writeUInt32LE(rate,24);buf.writeUInt32LE(rate*4,28);buf.writeUInt16LE(4,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*4,40);
let seed=81625,lp=0,slow=0;const rnd=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;const clamp=x=>Math.max(0,Math.min(1,x));function zone(t,a,b){return clamp((t-a)/.9)*clamp((b-t)/1.1)}
for(let i=0;i<N;i++){const t=i/rate,n=rnd()*2-1;lp=lp*.964+n*.036;slow=slow*.997+lp*.003;
const engine=zone(t,.1,5.3)*(.07*Math.sin(tau*(55*t+1.2*Math.sin(t*.65)))+.82*slow);
const ice=zone(t,4.7,10.1)*(.39*lp+.045*Math.sin(tau*1320*t)*Math.exp(-4*(t%2.6)));
const fire=zone(t,9.8,15.1)*(.65*slow+.05*Math.sin(tau*41*t)+Math.max(0,Math.sin(2.7*t))**14*lp*.45);
const cloud=zone(t,14.6,20.2)*((.55+.3*Math.sin(1.2*t))*lp+.05*Math.sin(tau*43*t));
const life=zone(t,19.9,25.4)*(.028*Math.sin(tau*(891*t+4*Math.sin(1.8*t)))*Math.max(0,Math.sin(4.1*t))**8+.16*lp);
const warp=zone(t,24.9,31.9)*(.046*Math.sin(tau*110*t)+.027*Math.sin(tau*165*t)+.7*slow);
let who=0;for(const mark of [4.7,9.7,14.7,19.7,24.7,29.1])who+=Math.exp(-((t-mark)**2)/.13)*lp*.68;
for(let k=0;k<2;k++){const pan=.89+.11*Math.sin((k?1:-1)*t*.8);buf.writeInt16LE(Math.round(32767*pan*(engine+ice+fire+cloud+life+warp+who)),44+i*4+k*2)}}
fs.writeFileSync('/tmp/orbita-v2-ambientes.wav',buf);
