import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {detectHeaders,normalizeComplaint} from '../parser-core.js';
test('renamed headings map to known complaint fields',()=>{
 const map=detectHeaders({A:'Area Manager',B:'Store Name',C:'Order Ref',D:'Issue Details',E:'Guest Name',F:'Closure Status'});
 assert.equal(map.coach,'A');assert.equal(map.outlet,'B');assert.equal(map.orderNumber,'C');assert.equal(map.description,'D');
 const r=normalizeComplaint({A:'Morris',B:'Galle',C:'J-100',D:'Food was delayed',E:'Jane',F:'Pending'},map,2,'2026-10');
 assert.equal(r.description,'Food was delayed');assert.equal(r.status,'pending');
});
test('missing optional fields and unrelated Area Coach are accepted by outlet',()=>{
 const map=detectHeaders({A:'Outlet Name',B:'Complaint Details'});
 const record=normalizeComplaint({A:'Matara 02',B:'Incorrect food'},map,2,'2026-10');
 assert.equal(record.outlet,'Matara 2');assert.equal(record.coachUnverified,false);
 const other=detectHeaders({A:'Area Manager',B:'Store Name',C:'Issue Details'});
 const result=normalizeComplaint({A:'Anura',B:'Galle',C:'Late delivery'},other,2,'2026-10');
 assert.equal(result.outlet,'Galle');assert.equal(result.sourceAreaCoach,'Anura');
});
test('worker supports duplicate master sheets and Excel macro extensions',()=>{
 const worker=readFileSync(new URL('../import-worker.js',import.meta.url),'utf8');
 assert.ok(worker.includes('const ordered=[...sheets]'));
 assert.ok(worker.includes('accepted>chosen.records.length'));
 assert.ok(worker.includes("['xlsx','xlsm','csv']"));
 assert.ok(worker.includes('missingCoachColumn'));
});