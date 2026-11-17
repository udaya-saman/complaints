import {test} from 'node:test';
import assert from 'node:assert/strict';
import {detectHeaders,normalizeComplaint,classifyStatus} from '../parser-core.js';
import {phoneSearchMatches,matchesSearch,matchesChannels,channelOptions} from '../filters.js';
const headers={B:'Area Coach',C:'Outlet',D:'Order Date',F:'Customer Name',G:'Customer Contact Number',H:'Order Number',I:'Service Channel',J:'Complaint Channel',O:'Complaint Description',Q:'Complaint lodged by',R:'Outlet  Comment',U:'Close complaint? (Yes / No)',V:'Closure Directive By',W:'Sales Centre Closure Status'};
const map=detectHeaders(headers);
const row={B:'Tharanga',C:'Matara 2',D:'46296',F:'Hasani',G:'707607581',H:'M36699',I:'Take away',J:'GES',O:'Missing beverage',Q:'Hamza',R:'Contacted customer',U:'Yes',V:'Tharanga',W:'Pending'};
const complaint=normalizeComplaint(row,map,2,'2026-10');
test('source headers map both new fields',()=>{assert.equal(map.customerContact,'G');assert.equal(map.closureDirective,'V');});
test('manager directive plus yes is resolved despite pending primary status',()=>{assert.equal(complaint.status,'resolved');assert.equal(complaint.statusRaw,'Pending');assert.equal(complaint.closureDirective,'Tharanga');assert.equal(complaint.customerContact,'707607581');
 assert.equal(classifyStatus('Un-Cont','Yes','Morris'),'resolved');assert.equal(classifyStatus('Pending',' YES ',' tharanga '),'resolved');assert.equal(classifyStatus('Pending','No','Tharanga'),'pending');assert.equal(classifyStatus('Pending','Yes','Another Coach'),'pending');assert.equal(classifyStatus('Resolved','No','Morris'),'resolved');});
test('search: customer name, order number and date',()=>{
 assert.equal(complaint.orderDate,'2026-10-01');
 assert.ok(matchesSearch(complaint,'2026-10-01','orderDate'));
 assert.ok(matchesSearch(complaint,'01/10/2026','orderDate'));
 assert.ok(matchesSearch(complaint,'has','customerName'));
 assert.ok(matchesSearch(complaint,'m366','orderNumber'));
 assert.equal(matchesSearch(complaint,'Hasani','orderNumber'),false);
 assert.ok(matchesSearch(complaint,'missing','all'));
});
test('contact lookup handles raw, local 0 and country prefix +94',()=>{
 assert.ok(phoneSearchMatches('707607581','707607581'));
 assert.ok(phoneSearchMatches('707607581','0707607581'));
 assert.ok(phoneSearchMatches('707607581','+94 70 760 7581'));
 assert.ok(matchesSearch(complaint,'+94707607581','customerContact'));
 assert.ok(matchesSearch(complaint,'0707607581','all'));
 assert.equal(matchesSearch(complaint,'0771234567','customerContact'),false);
});
test('service and complaint channel filters combine correctly',()=>{
 assert.ok(matchesChannels(complaint,{serviceChannel:'take away',complaintChannel:'ges'}));
 assert.equal(matchesChannels(complaint,{serviceChannel:'online',complaintChannel:'ges'}),false);
 assert.equal(matchesChannels(complaint,{serviceChannel:'take away',complaintChannel:'hotline'}),false);
 const opts=channelOptions([complaint,{serviceChannel:' take  away '},{serviceChannel:'ONLINE'},{}],'serviceChannel');
 assert.deepEqual(opts.map(x=>x.value),['online','take away','__missing__']);
});
