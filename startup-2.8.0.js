// The native input works without the main module. Queue the chosen file until it loads.
(function(){
 const note=()=>document.getElementById('startup-message');
 function fail(){if(!window.hubReady&&note())note().textContent='The dashboard did not finish loading. Use Update / repair app below. Your saved data will not be deleted.';}
 document.addEventListener('change',function(e){
  const input=e.target;if(!input||input.type!=='file'||(input.id!=='global-excel-file'&&!input.hasAttribute('data-import-input')))return;
  const file=input.files&&input.files[0];if(!file)return;input.value='';
  if(window.hubReady)document.dispatchEvent(new CustomEvent('hub-file-selected',{detail:file}));
  else {window.hubPendingFile=file;if(note())note().textContent='File selected. Waiting for the dashboard to load…';}
 });
 document.addEventListener('click',function(e){const a=e.target.closest&&e.target.closest('a[href^="#/"]');if(a&&!window.hubReady&&note())note().textContent='The dashboard code has not loaded. Use Update / repair app below if it does not start.';});
 window.addEventListener('error',fail,true);setTimeout(fail,8000);
})();
