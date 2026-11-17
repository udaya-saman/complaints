from pathlib import Path
from playwright.sync_api import sync_playwright
import sys
root=Path(__file__).resolve().parents[1]; folder=Path(sys.argv[1]) if len(sys.argv)>1 else root.parent
# Opaque-origin browser environment: real DOM, Worker, XLSX and PDF code;
# IndexedDB API stand-in and blob URL for bundled worker only.
old=(root/'tests/browser-release-qa.py').read_text();store_js=old.split("store_js='''",1)[1].split("'''",1)[0]
expected={'April':(4,11,10,1),'May':(5,18,14,4),'June':(6,27,25,2),'July':(7,31,30,1),'August':(8,30,25,5),'September':(9,15,11,4)}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':1250,'height':850});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 html=(root/'index.html').read_text();page.set_content('<!doctype html><html><head><style>'+ (root/'styles-2.5.0.css').read_text()+'</style></head><body>'+html.split('<body>',1)[1].split('</body>',1)[0]+'</body></html>')
 page.add_script_tag(content=(root/'startup-2.5.0.js').read_text());page.add_script_tag(content=store_js)
 page.evaluate('''workerSource=>{const native=window.Worker;window.Worker=class extends native{constructor(url){if(url!=='./workbook-2.5.0.js')throw Error('Unexpected worker path '+url);const blob=URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'}));super(blob);URL.revokeObjectURL(blob)}};const nativeURL=URL.createObjectURL.bind(URL);window._downloads=[];URL.createObjectURL=function(blob){if(blob.type!=='text/javascript')window._downloads.push(blob);return nativeURL(blob)};document.addEventListener('click',e=>{if(e.target.closest('a[download]'))e.preventDefault()},true)}''',(root/'workbook-2.5.0.js').read_text())
 page.add_script_tag(content=(root/'hub-2.5.0.js').read_text());page.wait_for_function("window.hubReady && !document.querySelector('main').innerText.includes('Loading saved complaint history')")
 def nav(key,heading,width=1250):
  selector=('.side-nav' if width>820 else '.mobile-nav')+' [data-nav='+key+']';page.locator(selector).click();page.wait_for_function('(h)=>document.querySelector("main h1")?.textContent===h',arg=heading);assert page.locator(selector).get_attribute('aria-current')=='page';assert 'This section could not open' not in page.locator('main').inner_text()
 for name,(m,total,res,pending) in expected.items():
  file=next(folder.glob(f'PHSL Customer Complaint Report*{name} 2026*.xlsx'))
  with page.expect_file_chooser() as fc:page.locator('#global-excel-file').click()
  fc.value.set_files(str(file));assert page.locator('#upload-month').input_value()==str(m);assert page.locator('#upload-year').input_value()=='2026';page.locator('#start-import').click();page.locator('#save-preview').wait_for(timeout=30000);assert f'Save {total} complaints' in page.locator('#save-preview').inner_text();assert 'Source worksheet:' in page.locator('main').inner_text();assert page.locator('#coach-ack').count()==0;page.locator('#save-preview').click();period=f'2026-{m:02}';page.wait_for_function('(period)=>_snaps.has(period) && document.querySelector("main h1")?.textContent==="Overview"',arg=period);assert page.evaluate('(p)=>_snaps.get(p).records.filter(x=>x.status==="resolved").length',period)==res;print('PASS real browser Worker import + review + save for',name,flush=True)
 for width in (1250,390):
  page.set_viewport_size({'width':width,'height':850})
  for key,heading in [('overview','Overview'),('complaints','Complaints'),('trends','Monthly trends'),('reports','PDF reports'),('library','Data library')]:nav(key,heading,width)
  nav('complaints','Complaints',width)
  for name,(m,total,res,pending) in expected.items():
   page.locator('#month-select').select_option(f'2026-{m:02}');assert f'{total} matching complaints' in page.locator('main').inner_text();page.locator('[data-status=pending]').click();assert f'{pending} matching complaints' in page.locator('main').inner_text();page.locator('[data-status=all]').click()
  page.locator('#month-select').select_option('all');assert '132 matching complaints' in page.locator('main').inner_text();page.locator('[data-mode=outlet]').click();page.locator('#scope-select').select_option('Aluthgama');assert int(page.locator('.record-count').inner_text().split()[0])==10
  page.locator('#clear-filters').click();page.locator('#month-select').select_option('2026-08');r=page.evaluate("_snaps.get('2026-08').records.find(r=>r.orderNumber&&r.customerName&&r.customerContact&&r.orderDate)")
  for field in ('orderDate','customerName','customerContact','orderNumber'):
   page.locator('#search-field').select_option(field);page.locator('#search-complaints').fill(r[field]);assert int(page.locator('.record-count').inner_text().split()[0])>=1;page.locator('#clear-search').click()
  for field,selector in [('serviceChannel','#service-channel'),('complaintChannel','#complaint-channel')]:
   page.locator(selector).select_option(r[field].strip().lower());assert int(page.locator('.record-count').inner_text().split()[0])>=1
  page.locator('#clear-filters').click();nav('trends','Monthly trends',width);assert '6 months' in page.locator('main').inner_text();nav('reports','PDF reports',width);page.locator('#download-pdf').click();page.locator('input[name=report][value=detail]').check();page.locator('#download-pdf').click();assert page.evaluate("async()=>{const docs=_downloads.filter(x=>x.type==='application/pdf');return docs.length>=2&&(await docs.at(-1).text()).startsWith('%PDF-')}");nav('library','Data library',width);assert '6 months' in page.locator('main').inner_text();print('PASS six months, all five tabs, search, channels, status, outlet alias, trends and PDF at width',width,flush=True)
 for width in (1250,390,320):
  page.set_viewport_size({'width':width,'height':850})
  for key,heading in [('overview','Overview'),('complaints','Complaints'),('trends','Monthly trends'),('reports','PDF reports'),('library','Data library')]:
   nav(key,heading,width);assert page.locator('.page-header .eyebrow').count()==0;assert page.locator('.page-header p').count()==0
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),(width,key,page.evaluate('document.documentElement.scrollWidth'))
  assert 'Import checks Area Coach + outlet together' not in page.locator('main').inner_text()
  page.locator('.page-header a[href="#/update"]').click();assert page.locator('main h1').inner_text()=='Update & repair';assert page.locator('#repair-in-app').is_enabled();assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1');assert page.locator('.mobile-nav [data-nav=library]' if width<=820 else '.side-nav [data-nav=library]').get_attribute('aria-current')=='page';page.locator('main a[href="#/overview"]').click();assert page.locator('main h1').inner_text()=='Overview';assert page.evaluate('_snaps.size===6');nav('library','Data library',width)
  print('PASS simplified headers, update subpage, return link, and no page overflow at width',width,flush=True)
 page.locator('#export-backup').click();assert page.evaluate("async()=>JSON.parse(await _downloads.find(b=>b.type==='application/json').text()).snapshots.length===6");print('PASS backup of all six snapshots',flush=True)
 assert not errors,errors
 b.close()
