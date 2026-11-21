const button=document.getElementById('repair'),status=document.getElementById('repair-status');
button.addEventListener('click',async()=>{
 button.disabled=true;status.textContent='Checking the published application…';
 try{
  const root=new URL('./',location.href),fresh=await fetch(new URL('index.html?v=2.7.0&repair='+Date.now(),root),{cache:'no-store'});
  if(!fresh.ok||!(await fresh.text()).includes('VERSION 2.7.0'))throw Error('Version 2.7.0 is not published yet. Check your GitHub Pages deployment.');
  // Verify key code files before retiring an old cache. Do not touch IndexedDB or localStorage.
  for(const path of ['startup-2.7.0.js','hub-2.7.0.js','workbook-2.7.0.js','styles-2.7.0.css']){const res=await fetch(new URL(path+'?repair='+Date.now(),root),{cache:'reload'});if(!res.ok||/text\/html/i.test(res.headers.get('content-type')||''))throw Error('A required application file is missing or incorrectly published: '+path);}
  if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const reg of regs){if(reg.scope===root.href)await reg.unregister();}}
  if('caches' in window){const keys=await caches.keys();for(const key of keys){if(/^ph-complaints-v2\.\d+\.\d+$/.test(key)){const cache=await caches.open(key);const requests=await cache.keys();for(const req of requests){if(req.url.startsWith(root.href))await cache.delete(req);}}}}
  status.textContent='Update ready. Opening your app…';location.replace(new URL('index.html?v=2.7.0#/overview',root));
 }catch(e){status.textContent=e.message||'Update failed. Check your internet connection and retry.';button.disabled=false;}
});
