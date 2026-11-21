import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const a=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('modal preserves full details and offers one-record PDF',()=>{
 for(const s of ['id="download-complaint-pdf"','generateComplaintPdf({record:r})',"$('close-modal').onclick=dismiss","$('close-detail-footer').onclick=dismiss",'Customer Contact Number'])assert.ok(a.includes(s));
});