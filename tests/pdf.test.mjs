import {test} from 'node:test';import assert from 'node:assert/strict';
import {generateSummaryPdf,generateDetailedPdf} from '../pdf-reports.js';
const rows=[{outlet:'Matara 2',period:'2026-11',areaCoach:'Tharanga',orderNumber:'O1234',orderDate:'2026-11-05',customerName:'Test Guest',lodgedBy:'Call centre',description:'Cold pizza delivered',status:'pending',complaintType:'Food quality',category:'Food quality',action:'Outlet called the customer.',customerContact:'0710000000',serviceChannel:'Delivery',complaintChannel:'Call centre',statusRaw:'Pending',closedFlag:'No',closureDirective:''}];
test('management summary builds a stand-alone PDF with vector charts',async()=>{
 const pdf=generateSummaryPdf({rows,monthly:[{period:'2026-11',total:1,pending:1,resolved:0}],periodLabel:'November 2026',scopeLabel:"Tharanga's Cluster"});
 assert.equal(pdf.type,'application/pdf');assert.ok(pdf.size>2000);
 const t=await pdf.text();assert.ok(t.startsWith('%PDF-1.4'));assert.ok(t.includes('MONTHLY COMPLAINT TREND'));assert.ok(t.includes('PENDING FOLLOW-UP'));assert.ok(t.includes('xref'));
});
test('details PDF hides contact numbers by default, includes on explicit request',async()=>{
 const defaults=await generateDetailedPdf({rows}).text();assert.ok(defaults.includes('Cold pizza delivered'));assert.equal(defaults.includes('0710000000'),false);
 const included=await generateDetailedPdf({rows,includeContact:true}).text();assert.ok(included.includes('0710000000'));
});
