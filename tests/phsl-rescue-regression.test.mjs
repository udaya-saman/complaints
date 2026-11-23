import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../workbook-2.9.3.js',import.meta.url),'utf8');
test('PHSL Master Sheet rescue is included in the published workbook worker',()=>{
 new vm.Script(source);
 for(const feature of ['PHSL_COLUMNS','phslHeaderRow','phslDataRow','complaintCoverage','rescueHints','rescueValid'])
  assert.ok(source.includes(feature),feature);
});
test('Area Coach never determines import eligibility',()=>{
 assert.ok(source.includes('sourceAreaCoach:coachValue'));
 assert.ok(!source.includes("reason:'coachOutletMismatch'"));
 assert.ok(!source.includes("reason:'otherCoach'"));
});
test('empty imports are prevented from replacing saved monthly data',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.ok(app.includes('No complaints to save. Existing monthly data has not been changed.'));
 assert.ok(app.includes('!state.preview.records.length'));
});
