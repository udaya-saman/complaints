import {test} from 'node:test';import assert from 'node:assert/strict';
import {File} from 'node:buffer';
globalThis.self=globalThis;
let messages=[];globalThis.postMessage=event=>messages.push(event);
await import('../import-worker.js');
const fields=['Area Coach','Outlet','Order Date','Customer Name','Order Number','Complaint Description','Close Complaint(Yes/No)','Closure Directive By','Sales Centre Closure Status','Customer Contact Number'];
const make=(rows,includeCoach=true)=>new File([[(includeCoach?fields:fields.slice(1)),...rows].map(r=>r.map(v=>String(v??'')).join(',')).join('\n')], 'source.csv',{type:'text/csv'});
async function parse(file){messages=[];await self.onmessage({data:{file,period:'2026-11'}});const err=messages.find(x=>x.type==='error');if(err)throw Error(err.message);return messages.find(x=>x.type==='complete')?.result;}
test('worker discards other coaches and mismatched coach/outlet while retaining valid rows',async()=>{
 const result=await parse(make([
 ['Tharanga','Matara 2','2026-11-05','Jane','J001','Missing item','Yes','Tharanga','Pending','0710000000'],
 ['Morris','Galle','2026-11-05','Sam','J002','Cold food','No','','Pending','0710000001'],
 ['Other Coach','Matara 2','2026-11-05','Jim','J003','Late service','No','','Pending','0710000002'],
 ['Morris','Matara 2','2026-11-05','Ali','J004','Wrong item','No','','Pending','0710000003'],
 ['Tharanga','Hikkaduwa','2026-11-05','Kim','J005','Wrong item','No','','Pending','0710000004'],
 ['Tharanga','Matara 2','2026-11-05','Jane','J001','Missing item','Yes','Tharanga','Pending','0710000000']
 ]));
 assert.equal(result.records.length,2);assert.equal(result.records[0].status,'resolved');assert.equal(result.records[1].status,'pending');
 assert.equal(result.stats.reasonCounts.otherCoach,1);assert.equal(result.stats.reasonCounts.coachOutletMismatch,1);assert.equal(result.stats.reasonCounts.unknownOutlet,1);assert.equal(result.stats.duplicate,1);assert.equal(result.stats.missingCoachColumn,false);
});
test('worker marks coachless CSV import as unverified and never auto approves',async()=>{
 const result=await parse(make([
 ['Galle','2026-11-03','Jane','J3','Wrong item','No','','Pending','0710000009'],
 ['Matara','2026-11-04','Luke','J4','Late delivery','Yes','Tharanga','Pending','0710000005']
 ],false));
 assert.equal(result.records.length,2);assert.equal(result.stats.unverified,2);assert.equal(result.stats.missingCoachColumn,true);
 assert.ok(result.records.every(r=>r.coachUnverified===true));
});
test('no matching coach/outlet in valid CSV shows empty review, not misleading counts',async()=>{
 const result=await parse(make([['Different Coach','Matara','2026-11-04','L','J3','Missing','No','','Pending','']]));
 assert.equal(result.records.length,0);assert.equal(result.stats.ignored,1);
});

test('XLSX formatted empty cells cannot swallow adjacent headers or values',async()=>{
 const {readCells}=await import('../import-worker.js');
 const headers=readCells('<row r="1"><c r="A1" s="1"/><c r="B1" t="s"><v>0</v></c><c r="C1" t="s"><v>1</v></c><c r="D1" s="4"/><c r="E1" t="s"><v>2</v></c><c r="F1" t="s"><v>3</v></c><c r="G1" t="s"><v>4</v></c></row>',['Area Coach','Outlet','Complaint Description','Close Complaint(Yes/No)','Closure Directive By']);
 assert.deepEqual(headers,{B:'Area Coach',C:'Outlet',E:'Complaint Description',F:'Close Complaint(Yes/No)',G:'Closure Directive By'});
 const values=readCells('<row r="2"><c r="A2" s="1"/><c r="B2" t="s"><v>0</v></c><c r="C2" t="s"><v>1</v></c><c r="D2" s="4"/><c r="E2" t="inlineStr"><is><t>Really missing item</t></is></c><c r="F2" t="s"><v>2</v></c><c r="G2" t="s"><v>3</v></c></row>',['Other Coach','Matara','Yes','Tharanga']);
 assert.deepEqual(values,{B:'Other Coach',C:'Matara',E:'Really missing item',F:'Yes',G:'Tharanga'});
 const {detectHeaders,normalizeComplaint}=await import('../parser-core.js');assert.equal(normalizeComplaint(values,detectHeaders(headers),2,'2026-11').reason,'otherCoach');
});
test('blank CSV lines do not inflate exclusions and malformed quote is rejected',async()=>{
 const file=make([['Morris','Galle','2026-11-05','Sam','J002','Cold food','No','','Pending','0710000001']]);const text=await file.text();const result=await parse(new File([text+'\n\n'], 'source.csv'));assert.equal(result.stats.ignored,0);await assert.rejects(()=>parse(new File([text+'\n"unfinished'], 'source.csv')),/unfinished quoted field/);
});

test('different actions/status on same complaint are retained and flagged, identical record collapsed',async()=>{
 const rows=[['Morris','Galle','2026-11-05','Sam','G1','Missing item','No','','Pending','0710000000'],['Morris','Galle','2026-11-05','Sam','G1','Missing item','Yes','Morris','Pending','0710000000']];
 const r=await parse(make([...rows,rows[0]]));assert.equal(r.records.length,2);assert.equal(r.stats.duplicate,1);assert.equal(r.stats.possibleDuplicates,1);
});
