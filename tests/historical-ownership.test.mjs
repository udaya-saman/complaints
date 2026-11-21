import {test} from 'node:test';import assert from 'node:assert/strict';
import {detectHeaders,normalizeComplaint,verifiedRecordScope,coachForOutletAtPeriod} from '../parser-core.js';
import {generateComplaintPdf} from '../pdf-reports.js';
const m=detectHeaders({A:'Area Coach',B:'Outlet',C:'Complaint Description',D:'Order Date',E:'Order Number'});
const r=(coach,outlet='Matara')=>({A:coach,B:outlet,C:'A delayed order',D:'2026-05-31',E:'AB-123'});
test('Morris owns all 14 outlets through May 2026; six transfer in June',()=>{
 assert.equal(coachForOutletAtPeriod('Matara','2026-04'),'Morris');assert.equal(coachForOutletAtPeriod('Matara','2026-05'),'Morris');
 assert.equal(coachForOutletAtPeriod('Matara','2026-06'),'Tharanga');assert.equal(coachForOutletAtPeriod('Galle','2026-06'),'Morris');
 assert.equal(coachForOutletAtPeriod('Hikkaduwa','2026-05'),null);
});
test('reporting month, not source coach, determines cluster',()=>{const april=normalizeComplaint(r('Tharanga'),m,2,'2026-04');assert.equal(april.cluster,'Morris');assert.equal(april.sourceAreaCoach,'Tharanga');assert.ok(verifiedRecordScope(april));const june=normalizeComplaint(r('Morris'),m,3,'2026-06');assert.equal(june.cluster,'Tharanga');assert.ok(verifiedRecordScope(june));});

test('single complaint PDF includes customer and action details',async()=>{
 const r={...normalizeComplaint({A:'Morris',B:'Matara',C:'Delayed order',D:'2026-04-10',E:'D-100'},m,2,'2026-04'),customerName:'Test Guest',customerContact:'0700000000',action:'Customer refunded',notes:'Reviewed'};
 const pdf=generateComplaintPdf({record:r});assert.equal(pdf.type,'application/pdf');const content=await pdf.text();
 for(const value of ['CUSTOMER CONTACT NUMBER','0700000000','Customer refunded','OUTLET ACTION / COMMENT','REMARKS'])assert.ok(content.includes(value));
});
