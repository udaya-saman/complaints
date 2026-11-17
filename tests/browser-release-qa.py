from playwright.sync_api import sync_playwright
from pathlib import Path
import os
root=Path(__file__).resolve().parents[1]
synthetic=os.environ.get('HUB_SYNTHETIC')=='1'
source=root/'sample/demo-complaints.csv' if synthetic else root.parent/'Mr. Tharanga and Mr,Morris.xlsx'
count=4 if synthetic else 22
pending=2 if synthetic else 1
matara=1 if synthetic else 4
# Local navigation is administratively blocked. The browser runs the exact release
# scripts in an isolated DOM, real dedicated Worker via a blob URL, and an IndexedDB
# API stand-in (the about:blank document is an opaque origin). No parser/UI mocks.
store_js='''
window._snaps=new Map();
window._failOpen=false;
Object.defineProperty(window,'indexedDB',{configurable:true,value:{open(){const req={};setTimeout(()=>{if(window._failOpen){req.error=Error('Test storage unavailable');req.onerror?.();return;}req.result={objectStoreNames:{contains:()=>true},close(){},transaction(){const tx={};tx.objectStore=()=>({getAll(){const r={};setTimeout(()=>{r.result=Array.from(window._snaps.values());r.onsuccess?.()},0);return r},put(s){window._snaps.set(s.period,structuredClone(s));setTimeout(()=>tx.oncomplete?.(),0)},delete(p){window._snaps.delete(p);setTimeout(()=>tx.oncomplete?.(),0)}});return tx}};req.onsuccess?.()},0);return req}}});
'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':1250,'height':850});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 html=(root/'index.html').read_text();page.set_content('<!doctype html><html><head><style>'+ (root/'styles-2.5.0.css').read_text()+'</style></head><body>'+html.split('<body>',1)[1].split('</body>',1)[0]+'</body></html>')
 page.add_script_tag(content=(root/'startup-2.5.0.js').read_text());page.add_script_tag(content=store_js)
 page.evaluate('''workerSource=>{const native=window.Worker;window.Worker=class extends native{constructor(url){if(url!=='./workbook-2.5.0.js')throw Error('Unexpected worker path '+url);const blob=URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'}));super(blob);URL.revokeObjectURL(blob)}};const nativeURL=URL.createObjectURL.bind(URL);window._downloads=[];URL.createObjectURL=function(blob){if(blob.type!=='text/javascript')window._downloads.push(blob);return nativeURL(blob)};document.addEventListener('click',e=>{if(e.target.closest('a[download]'))e.preventDefault()},true)}''',(root/'workbook-2.5.0.js').read_text())
 page.add_script_tag(content=(root/'hub-2.5.0.js').read_text());page.wait_for_function("window.hubReady && !document.querySelector('main').innerText.includes('Loading saved complaint history')")
 def nav(key,heading,width):
  selector=('.side-nav' if width>820 else '.mobile-nav')+' [data-nav='+key+']';page.locator(selector).click();page.wait_for_function('(h)=>document.querySelector("main h1")?.textContent===h',arg=heading);assert page.locator(selector).get_attribute('aria-current')=='page';assert 'This section could not open' not in page.locator('main').inner_text()
 for key,heading in [('complaints','Complaints'),('trends','Monthly trends'),('reports','PDF reports'),('library','Data library'),('overview','Overview')]:nav(key,heading,1250)
 print('PASS all five desktop tabs before data import',flush=True)
 with page.expect_file_chooser() as fc:page.locator('#global-excel-file').click()
 fc.value.set_files(str(source));page.locator('#upload-month').select_option('10');page.locator('#upload-year').fill('2026');page.locator('#upload-year').press('Tab');page.locator('#start-import').click();page.locator('#save-preview').wait_for(timeout=120000);assert f'Save {count} complaints' in page.locator('#save-preview').inner_text();page.locator('#save-preview').click();page.wait_for_function("document.querySelector('main h1')?.textContent==='Overview' && window._snaps.size===1");assert page.evaluate("Array.from(_snaps.values())[0].records.filter(x=>x.status==='pending').length") == pending
 print(f'PASS real browser Worker reads {"synthetic CSV" if synthetic else "original 68 MB workbook"}, saves {count} records ({count-pending} resolved, {pending} pending) through storage stand-in',flush=True)
 for width in (1250,390):
  page.set_viewport_size({'width':width,'height':850})
  for key,heading in [('complaints','Complaints'),('trends','Monthly trends'),('reports','PDF reports'),('library','Data library'),('overview','Overview')]:nav(key,heading,width)
  nav('complaints','Complaints',width);assert f'{count} matching complaints' in page.locator('main').inner_text();page.locator('[data-status=pending]').click();assert f'{pending} matching complaints' in page.locator('main').inner_text();page.locator('[data-status=all]').click();page.locator('#search-complaints').fill('no matching record 8765523');assert '0 matching complaints' in page.locator('main').inner_text();page.locator('#clear-search').click();page.locator('[data-mode=outlet]').click();page.locator('#scope-select').select_option('Matara 2');assert f'{matara} matching complaints' in page.locator('main').inner_text();page.locator('#clear-filters').click();nav('reports','PDF reports',width);page.locator('#download-pdf').click();page.wait_for_function("_downloads.some(b=>b.type==='application/pdf')");nav('library','Data library',width);assert 'October 2026' in page.locator('main').inner_text();print('PASS all five tabs, status/search/outlet filters, PDF generation, and saved history at width',width,flush=True)
 # Both PDF report types produce actual selectable PDF bytes; downloads captured in memory.
 nav('reports','PDF reports',390)
 page.locator('input[name=report][value=detail]').check();page.locator('#download-pdf').click()
 assert page.evaluate("async()=>{const docs=_downloads.filter(b=>b.type==='application/pdf');return docs.length>=3&&(await docs.at(-1).text()).startsWith('%PDF-')}")
 print('PASS detailed PDF output',flush=True)
 with page.expect_file_chooser() as fc:page.locator('#global-excel-file').click()
 fc.value.set_files(str(root/'sample/demo-complaints-november.csv'))
 page.locator('#upload-month').select_option('11');page.locator('#start-import').click();page.locator('#save-preview').wait_for();page.locator('#save-preview').click();page.wait_for_function("_snaps.size===2 && document.querySelector('main h1')?.textContent==='Overview'")
 nav('trends','Monthly trends',390);assert '2 months' in page.locator('main').inner_text();nav('complaints','Complaints',390);page.locator('#month-select').select_option('2026-10');assert f'{count} matching complaints' in page.locator('main').inner_text();nav('library','Data library',390);page.locator('#export-backup').click();assert page.evaluate("async()=>JSON.parse(await _downloads.find(b=>b.type==='application/json').text()).snapshots.length===2")
 print('PASS second month import, trend/history switching and backup generation',flush=True)
 assert not errors,errors
 page.close()
 # Use an independent browser DOM to exercise startup failure then retry (no data deletion).
 page=b.new_page(viewport={'width':1250,'height':850});page.set_content('<!doctype html><html><head><style>'+ (root/'styles-2.5.0.css').read_text()+'</style></head><body>'+html.split('<body>',1)[1].split('</body>',1)[0]+'</body></html>');page.add_script_tag(content=(root/'startup-2.5.0.js').read_text());page.add_script_tag(content=store_js);page.evaluate('window._failOpen=true');page.add_script_tag(content=(root/'hub-2.5.0.js').read_text());page.locator('#retry-storage').wait_for();nav('trends','Monthly trends',1250);assert 'Saved data is unavailable' in page.locator('main').inner_text();page.evaluate('window._failOpen=false');page.locator('#retry-storage').click();page.wait_for_function("!document.querySelector('#retry-storage') && !document.querySelector('main').innerText.includes('Loading saved complaint history')");nav('complaints','Complaints',1250);print('PASS simulated storage startup error, navigation remains usable, retry succeeds',flush=True)
 b.close()
