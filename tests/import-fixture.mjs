import {readFileSync} from 'node:fs';import {File} from 'node:buffer';
globalThis.self=globalThis;
let started=Date.now();let ended;
globalThis.postMessage=(p)=>{if(p.type==='progress'&&p.percent%12===0)console.log('progress',p.percent,p.label);if(p.type==='complete'){ended=true;const r=p.result;console.log(JSON.stringify({status:'success',elapsedSeconds:Math.round((Date.now()-started)/100)/10,...r.stats,byStatus:r.records.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{}),byOutlet:r.records.reduce((a,x)=>(a[x.outlet]=(a[x.outlet]||0)+1,a),{}),examples:r.records.slice(0,3).map(x=>({outlet:x.outlet,descriptionLength:x.description.length,status:x.status,statusRaw:x.statusRaw}))},null,2));}if(p.type==='error'){ended=true;console.error('ERROR',p.message);process.exitCode=1;}};
await import('../import-worker.js');
const input=process.argv[2],period=process.argv[3]||'2026-10';
const file=new File([readFileSync(input)],input.split('/').at(-1));
await self.onmessage({data:{file,period}});
if(!ended){console.error('NO RESPONSE');process.exitCode=1;}
