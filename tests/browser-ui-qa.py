from playwright.sync_api import sync_playwright
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
# Run the exact source in an isolated browser DOM; normal URL navigation is administratively blocked.
# Import declarations are resolved from local modules; storage and actual worker transport are separately tested.
def module(name):
 s=(root/name).read_text();s=re.sub(r'^import .*?;\s*$', '',s,flags=re.M);names=re.findall(r'\bexport\s+(?:async\s+)?(?:const|let|var|function|class)\s+(\w+)',s);s=re.sub(r'\bexport\s+','',s);return 'Object.assign(window,(()=>{'+s+'\nreturn {'+','.join(names)+'};})());\n'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1200,'height':800});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 html=(root/'index.html').read_text();page.set_content('<!doctype html><html><head><style>'+ (root/'styles.css').read_text()+'</style></head><body>'+html.split('<body>',1)[1].split('</body>',1)[0]+'</body></html>')
 page.add_script_tag(content=(root/'startup.js').read_text())
 # Queue selection while main application is deliberately not running.
 with page.expect_file_chooser() as fc:page.locator('#global-excel-file').click()
 fc.value.set_files(str(root/'sample/demo-complaints.csv'))
 assert page.evaluate('window.hubPendingFile.name')=='demo-complaints.csv'
 page.add_script_tag(content=module('parser-core.js')+module('filters.js')+module('pdf-reports.js'))
 # In-memory transport stand-ins; parser and real workbook separately verified in Node.
 page.add_script_tag(content="""window._snaps=[];window.listSnapshots=async()=>window._snaps;window.saveSnapshot=async s=>{window._snaps=window._snaps.filter(x=>x.period!==s.period).concat(s);};window.removeSnapshot=async p=>{window._snaps=window._snaps.filter(x=>x.period!==p)};window.saveBatch=async s=>{window._snaps=s};window.requestDurableStorage=async()=>{};Object.defineProperty(window,'isSecureContext',{value:false});window.Worker=class{postMessage({file,period}){file.text().then(()=>{const m=detectHeaders({A:'Area Coach',B:'Outlet',C:'Complaint Description',D:'Sales Centre Closure Status',E:'Order Number',F:'Order Date'});const records=[normalizeComplaint({A:'Tharanga',B:'Matara',C:'Example missing item',D:'Pending',E:'001',F:'2026-11-01'},m,2,period)];this.onmessage({data:{type:'complete',result:{period,records,stats:{found:1,ignored:0,reasonCounts:{},duplicate:0,missingCoachColumn:false}}}});})}terminate(){}};""")
 s=(root/'app.js').read_text();s=re.sub(r'^import .*?;\s*$', '',s,flags=re.M);page.add_script_tag(content=s)
 page.wait_for_function("document.querySelector('#start-import') && !document.querySelector('#start-import').disabled",timeout=7000)
 assert 'demo-complaints.csv' in page.locator('#dropzone').inner_text();print('PASS selected before main startup appears in real Data Library UI')
 page.locator('#start-import').click();page.locator('#save-preview').wait_for();assert 'Save 1 complaints' in page.locator('#save-preview').inner_text();page.locator('#save-preview').click();page.wait_for_function("document.querySelector('h1')?.textContent==='Overview'");assert page.evaluate('window._snaps.length')==1;print('PASS Analyze → review → save → overview (storage/worker transport mocked)')
 page.locator('.side-nav [data-nav=complaints]').click();page.locator('#search-complaints').wait_for();assert 'Example missing item' in page.locator('main').inner_text();page.locator('#search-complaints').fill('does not exist');assert 'No matching complaints' in page.locator('main').inner_text();print('PASS complaint search and navigation')
 for width in (1200,390):
  page.set_viewport_size({'width':width,'height':800})
  with page.expect_file_chooser() as fc:page.locator('#global-excel-file').click()
  fc.value.set_files(str(root/'sample/demo-complaints.csv'));page.locator('#dropzone').wait_for();assert 'demo-complaints.csv' in page.locator('#dropzone').inner_text();print('PASS header import works from active dashboard at width',width)
  with page.expect_file_chooser() as fc:page.locator('#excel-file').click()
  fc.value.set_files(str(root/'sample/demo-complaints.csv'));assert 'demo-complaints.csv' in page.locator('#dropzone').inner_text();print('PASS native Browse files repeat selection at width',width)
 assert not errors, errors
 b.close()
