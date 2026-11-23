import {test} from 'node:test';
import assert from 'node:assert/strict';
import {File} from 'node:buffer';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('August complaint workbook import is complete and save-zero is prohibited',async()=>{
 const src=readFileSync(new URL('../workbook-2.9.3.js',import.meta.url),'utf8');
 assert.match(src,/function chooseCandidate/);
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(app,/!state\.preview\.records\.length/);
 assert.match(app,/No complaints to save\. Existing monthly data/);
 const csv=['Outlet,Complaint Description,Area Coach,Order Number,Sales Centre Closure Status','Matara,Cold food,Another coach,ABC-1,Pending','Galle,Wrong order,Morris,ABC-2,Resolved'].join('\n');
 const messages=[];
 const ctx=vm.createContext({Blob,ReadableStream,TextDecoder,TextEncoder,DecompressionStream,Date,console,setTimeout,clearTimeout,postMessage:m=>messages.push(m)});ctx.self=ctx;
 new vm.Script(src).runInContext(ctx);
 await ctx.onmessage({data:{file:new File([csv],'august.csv'),period:'2026-08'}});
 const rows=messages.find(x=>x.type==='complete')?.result.records;
 assert.equal(rows?.length,2);assert.equal(rows[0].outlet,'Matara');
});