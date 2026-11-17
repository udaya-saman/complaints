// Local-only storage. Each month is one atomic snapshot; source workbook binary is not retained.
const NAME='ph-complaints-hub',VERSION=1,STORE='snapshots';let promise;
function requestValue(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||Error('Local storage request failed.'));});}
export function openDatabase(){
  if(!('indexedDB' in globalThis))return Promise.reject(Error('This browser does not support private offline storage.'));
  if(!promise)promise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(NAME,VERSION);let finished=false;const timer=setTimeout(()=>{finished=true;reject(Error('Local storage took too long to open. Close other app tabs and retry.'));},10000);const fail=e=>{if(finished)return;finished=true;clearTimeout(timer);reject(e);};
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'period'});};
    req.onsuccess=()=>{const db=req.result;if(finished){db.close();return;}finished=true;clearTimeout(timer);db.onversionchange=()=>{db.close();promise=undefined;};resolve(db);};
    req.onerror=()=>fail(req.error||Error('Unable to open local storage.'));
    req.onblocked=()=>fail(Error('Close other open tabs of this app and try again.'));
  }).catch(e=>{promise=undefined;throw e;});
  return promise;
}
export async function listSnapshots(){const db=await openDatabase();return requestValue(db.transaction(STORE,'readonly').objectStore(STORE).getAll());}
export async function saveSnapshot(snapshot){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(snapshot.period)||!Array.isArray(snapshot.records))throw Error('Invalid monthly dataset.');
  const db=await openDatabase();return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(snapshot);
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Unable to store this month. Export a backup and check available device storage.'));
    tx.onabort=()=>reject(tx.error||Error('The monthly import was cancelled by storage.'));
  });
}
export async function removeSnapshot(period){const db=await openDatabase();return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(period);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Unable to remove month.'));tx.onabort=()=>reject(tx.error||Error('Delete operation was cancelled.'));
});}
export async function saveBatch(snapshots){const db=await openDatabase();return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');for(const snap of snapshots)tx.objectStore(STORE).put(snap);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Backup restore did not complete.'));tx.onabort=()=>reject(tx.error||Error('Backup restore was cancelled.'));
});}
export async function requestDurableStorage(){try{if(navigator.storage?.persist)await navigator.storage.persist();}catch{/* optional */}}
