import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OUTLETS,CLUSTERS,canonicalOutlet,clusterOf,canonicalCoach,detectHeaders,normalizeComplaint,excelDate,classifyStatus,summarize,getScopeOutlets,pendingAge,normalizeCategory,crossMonthDuplicates,verifiedRecordScope} from '../parser-core.js';
const map=detectHeaders({A:'Area Coach',B:'Outlet',C:'Complaint Description',D:'Close complaint? (Yes / No)',E:'Sales Centre Closure Status',F:'Complaint lodged by',G:'Closure Directive By',H:'Order Number',I:'Order Date',J:'Complaint Type'});
const row=(coach='Tharanga',outlet='Matara 2',description='Late service')=>({A:coach,B:outlet,C:description,D:'Yes',E:'Pending',F:'Agent',G:'Tharanga',H:'A001',I:'2026-11-11',J:'Late Delivery'});
test('exact 14 approved outlets and two mapped clusters',()=>{
 assert.equal(OUTLETS.length,14);assert.equal(CLUSTERS.tharanga.length,6);assert.equal(CLUSTERS.morris.length,8);
 assert.equal(canonicalOutlet(' Matara 02 '),'Matara 2');assert.equal(canonicalOutlet('Hikkaduwa'),null);
 assert.equal(clusterOf('Galle'),'Morris');assert.equal(getScopeOutlets('cluster','both').length,14);
});
test('coach aliases are bounded; unknown names do not match',()=>{
 for(const value of ['Mr. Tharanga','AREA COACH Tharanga','Tharanga','AC Tharanga'])assert.equal(canonicalCoach(value),'Tharanga');
 assert.equal(canonicalCoach('Mr Morris'),'Morris');assert.equal(canonicalCoach('Morris & Tharanga'),null);
 assert.equal(canonicalCoach('Morris Junior'),null);assert.equal(canonicalCoach('Anura'),null);
});
test('source complaint column names map correctly',()=>{assert.equal(map.coach,'A');assert.equal(map.closedFlag,'D');assert.equal(map.closureDirective,'G');assert.equal(map.orderDate,'I');});
test('eligible records require BOTH coach and matching approved outlet',()=>{
 const r=normalizeComplaint(row(),map,2,'2026-11');assert.equal(r.outlet,'Matara 2');assert.equal(r.areaCoach,'Tharanga');assert.equal(r.status,'resolved');
 assert.equal(normalizeComplaint(row('Anura'),map,3,'2026-11').reason,'otherCoach');
 assert.equal(normalizeComplaint(row('Morris'),map,4,'2026-11').reason,'coachOutletMismatch');
 assert.equal(normalizeComplaint(row('Tharanga','Hikkaduwa'),map,5,'2026-11').reason,'unknownOutlet');
 assert.equal(normalizeComplaint(row(''),map,6,'2026-11').reason,'missingCoachValue');
});
test('missing coach column is blocked unless outlet-only explicitly permitted',()=>{
 const m=detectHeaders({B:'Outlet',C:'Complaint Description',D:'Close Complaint(Yes/No)',E:'Sales Centre Closure Status',F:'Order Number'});
 const data={B:'Galle',C:'Wrong item',D:'No',E:'Pending',F:'G100'};
 assert.equal(normalizeComplaint(data,m,4,'2026-11').reason,'missingCoachColumn');
 const verified=normalizeComplaint(data,m,4,'2026-11',{allowMissingCoach:true});assert.equal(verified.coachUnverified,true);assert.equal(verified.areaCoach,'Morris');assert.equal(verified.status,'pending');
});
test('directive plus Yes overrides Pending, other rules stay intact',()=>{
 assert.equal(classifyStatus('Pending','Yes','Mr. Morris'),'resolved');
 assert.equal(classifyStatus('Un-Cont','Yes','Tharanga'),'resolved');
 assert.equal(classifyStatus('Pending','Yes','Other coach'),'pending');
 assert.equal(classifyStatus('Resolved','No','Morris'),'resolved');
 assert.equal(classifyStatus('Pending','No','Tharanga'),'pending');
 assert.equal(classifyStatus('','Yes',''),'pending');
 const r=normalizeComplaint({...row(),G:'Other coach'},map,5,'2026-11');assert.equal(r.status,'pending');assert.equal(summarize([r]).pending,1);
});
test('dates, category normalization and aging',()=>{
 assert.equal(excelDate('46322'),'2026-10-27');assert.equal(excelDate('10/08/2026'),'2026-08-10');assert.equal(excelDate('31/02/2026'),'31/02/2026');
 assert.equal(normalizeCategory(' incorrect item '),'Wrong item');assert.equal(normalizeCategory('Late Delivery'),'Late delivery');
 assert.equal(pendingAge('2026-11-01',new Date('2026-11-17T11:00:00Z')),16);
});
test('cross-month duplicate identities are stable without suppressing a month snapshot',()=>{
 const a=normalizeComplaint(row(),map,2,'2026-10'),b=normalizeComplaint(row(),map,3,'2026-11');
 assert.equal(a.identity,b.identity);assert.notEqual(a.id,b.id);
 assert.equal(crossMonthDuplicates([b],[{period:'2026-10',records:[a]}]).length,1);
 const another=normalizeComplaint(row('Tharanga','Matara 2','Wrong product'),map,4,'2026-11');assert.notEqual(a.identity,another.identity);
});

test('persisted and restored records are always rechecked for coach/outlet mismatch',()=>{
 const r=normalizeComplaint(row(),map,2,'2026-11');assert.ok(verifiedRecordScope(r));
 assert.equal(verifiedRecordScope({...r,areaCoach:'Other',coachUnverified:true}),false);
 assert.equal(verifiedRecordScope({...r,cluster:'Morris'}),false);
 assert.equal(verifiedRecordScope({...r,outlet:'Hikkaduwa'}),false);
 assert.equal(verifiedRecordScope({...r,coachUnverified:'true'}),false);
});

test('PHSL template restores overwritten description, action and closure headers only when anchors match',()=>{
 const header={B:'Area Coach',C:'Outlet',D:'Order Date',F:'Customer Name',G:'Customer Contact Number',H:'Order Number',I:'Service Channel',J:'Complaint Channel',K:'Complaint Type',O:'overwritten description header',P:'Sales Centre Comment',Q:'Complaint lodged by',R:'outlet',T:'Comment Updated By',U:'yes',V:'Closure Directive By',W:'Sales Centre Closure Status',X:'Customer Feedback Status',Y:'Remark',Z:'Updated by'};
 const m=detectHeaders(header);assert.equal(m.outlet,'C');assert.equal(m.description,'O');assert.equal(m.action,'R');assert.equal(m.closedFlag,'U');
 const a=normalizeComplaint({B:'Morris',C:'Alutgama',D:'46120',F:'Example',K:'Product Quality',O:'Actual detailed complaint',R:'Actual action',U:'Yes',V:'Morris',W:'Pending'},m,2,'2026-04');
 assert.equal(a.outlet,'Aluthgama');assert.equal(a.description,'Actual detailed complaint');assert.equal(a.action,'Actual action');assert.equal(a.status,'resolved');
 const changed=detectHeaders({...header,Q:'Something else'});assert.equal(changed.description,'O');assert.equal(changed.action,'R');
});
test('lookup and summary headers are rejected even when they mention outlet, coach and complaint type',()=>{
 assert.equal(detectHeaders({A:'Outlet',B:'Area Coach',D:'Complaint Type',F:'Complaint Channel',H:'Closure Directive By',I:'Sales Centre Closure Status',K:'Service Channel',N:'Close Complaint? (YES/NO)'}),null);
});
