import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {File} from 'node:buffer';
import vm from 'node:vm';
const source=readFileSync(new URL('../workbook-2.9.1.js',import.meta.url),'utf8');
async function readCsv(text){
 const messages=[];
 const ctx=vm.createContext({Blob,TextDecoder,TextEncoder,ReadableStream,DecompressionStream,Date,setTimeout,clearTimeout,console,postMessage:x=>messages.push(x)});ctx.self=ctx;
 new vm.Script(source).runInContext(ctx);
 await ctx.onmessage({data:{file:new File([text],'test.csv'),period:'2026-08'}});
 const error=messages.find(x=>x.type==='error');assert.ok(!error,error?.message);
 return messages.find(x=>x.type==='complete')?.result;
}
test('a misleading Outlet-only title cannot suppress valid complaint rows',async()=>{
 const input=['Outlet,,,,,,','Regional monthly summary,,,,,,','Area Coach,Outlet,Order Date,Customer Name,Complaint Description,Order Number,Sales Centre Closure Status','Other manager,Matara,2026-08-12,Guest A,Wrong food,A-01,Pending','Morris,Galle,2026-08-14,Guest B,Delayed delivery,G-02,Resolved'].join('\n');
 const r=await readCsv(input);assert.equal(r.records.length,2);
 assert.deepEqual(Array.from(r.records.map(x=>x.outlet)),['Matara','Galle']);
 assert.equal(r.records[0].description,'Wrong food');assert.equal(r.records[0].sourceAreaCoach,'Other manager');
});
test('outlet typographical errors are accepted but ambiguous outlets remain excluded',async()=>{
 const input=['Outlet,Complaint Description,Area Coach','Akuresa,Cold pizza,Unknown coach','Matra 02,Missing item,Morris','Welipenna,Not identifiable,Morris','Hikkaduwa,Outside scope,Tharanga'].join('\n');
 const r=await readCsv(input);assert.equal(r.records.length,2);assert.equal(r.stats.ignored,2);
 assert.deepEqual(Array.from(r.records.map(x=>x.outlet)),['Akuressa','Matara 2']);
});
test('zero-record review cannot overwrite an existing saved month',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.ok(app.includes('No complaints to save. Existing monthly data has not been changed.'));
 assert.ok(app.includes('!state.preview.records.length'));
 assert.ok(!app.includes('id="coach-ack"'));
});
