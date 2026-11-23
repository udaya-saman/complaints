/* Customer Complaints Hub v2.9.3: standalone offline application */
(()=>{'use strict';
const {OUTLETS,CLUSTERS,normalized,canonicalOutlet,clusterOf,COACH_HANDOVER_PERIOD,coachForOutletAtPeriod,canonicalCoach,detectHeaders,excelDate,classifyStatus,normalizeCategory,complaintIdentity,normalizeComplaint,verifiedRecordScope,getScopeOutlets,summarize,pendingAge,crossMonthDuplicates}=(()=>{
// Pure complaint normalization, suitable for the browser worker and Node tests.
const OUTLETS=['Akuressa','Aluthgama','Ambalangoda','Embilipitiya','Galle','Karapitiya','Matara','Matara 2','Megalle','Monaragala','Tangalle','Unawatuna','Welipenna A','Welipenna B'];
const CLUSTERS={tharanga:['Akuressa','Embilipitiya','Matara','Matara 2','Monaragala','Tangalle'],morris:['Aluthgama','Ambalangoda','Galle','Karapitiya','Megalle','Unawatuna','Welipenna A','Welipenna B']};
const normalized=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const outletMap=new Map(OUTLETS.map(x=>[normalized(x),x]));
for(const alias of ['matara02','matara2','mataraii'])outletMap.set(alias,'Matara 2');
outletMap.set('alutgama','Aluthgama');
const editDistance=(a,b,limit=2)=>{if(Math.abs(a.length-b.length)>limit)return limit+1;let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=next;}return prev[b.length];};
function canonicalOutlet(value){
 const name=normalized(value);if(!name)return null;
 if(outletMap.has(name))return outletMap.get(name);
 if(['welipenna','welipena','welipenn'].includes(name))return null;
 const digit=name.match(/(?:0?2|ii)$/)?.[0]||'';
 const letter=name.match(/(?:welipenn[ab]|welipena[ab])$/)?.[0]?.slice(-1)||'';
 const candidates=[];
 for(const [alias,outlet] of outletMap){
  if(outlet==='Matara 2'&&!digit)continue;
  if(outlet==='Matara'&&digit)continue;
  if((outlet==='Welipenna A'||outlet==='Welipenna B')&&(!letter||outlet.slice(-1).toLowerCase()!==letter))continue;
  const distance=editDistance(name,alias,2),threshold=name.length>=10?2:1;
  if(distance<=threshold)candidates.push({outlet,distance});
 }
 candidates.sort((a,b)=>a.distance-b.distance);
 if(!candidates.length)return null;
 return new Set(candidates.filter(c=>c.distance===candidates[0].distance).map(c=>c.outlet)).size===1?candidates[0].outlet:null;
}
const clusterOf=outlet=>CLUSTERS.tharanga.includes(outlet)?'Tharanga':CLUSTERS.morris.includes(outlet)?'Morris':null;
// Historical handover. Morris led all 14 outlets until May 2026; the six
// Tharanga-group outlets transfer at the start of June 2026.
const COACH_HANDOVER_PERIOD='2026-06';
function coachForOutletAtPeriod(outlet,period){
 const group=clusterOf(outlet);
 if(!group||!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(period||'')))return null;
 return period<COACH_HANDOVER_PERIOD?'Morris':group;
}
// Exact, bounded name matching: never infer a coach from an unrelated or compound name.
function canonicalCoach(value){let n=normalized(value);n=n.replace(/^(mr|mister|areacoach|ac)/,'').replace(/(areacoach|ac)$/,'');return n==='tharanga'?'Tharanga':n==='morris'?'Morris':null;}
const HEADER_MATCH={
  outlet:['outlet','outletname','branch','branchname','storename','store','restaurant','restaurantname','location'],
  description:['complaintdescription','customercomplaint','complaintdetails','complaintdetail','issuedescription','feedbackdescription','issue','complainttext','feedbackdetails'],
  status:['salescentreclosurestatus','salescenterclosurestatus','complaintclosurestatus','closurestatus','complaintstatus','resolutionstatus','currentstatus','status'],
  closedFlag:['closecomplaintyesno','closecomplaint','complaintclosed','isclosed','closed'],
  closureDirective:['closuredirectiveby','closuredirective','directiveby','closureauthorizedby','closedirectedby'],
  customerName:['customername','nameofcustomer','customer','guestname'],
  customerContact:['customercontactnumber','customercontactno','customerphone','customerphonenumber','contactnumber','contactno','mobilenumber','mobilephone','phonenumber','guestcontactnumber','customertelephone'],
  lodgedBy:['complaintlodgedby','lodgedby','complainant','complaintreceivedby','reportedby'],
  action:['outletcomment','outletcomments','actiontaken','correctiveaction','correctiveactiontaken','actiontakenbyoutlet','outletresponse'],
  salesAction:['salescentrecomment','salescentercomment','callcentrecomment','customercontactaction','contactcentercomment'],
  orderDate:['orderdate','complaintdate','dateofcomplaint','date','reporteddate'],
  orderNumber:['ordernumber','orderno','ordernum','orderid','ordernumberid'],
  type:['complainttype','issuetype','complaintcategory','category','typeofcomplaint'],
  feedback:['customerfeedbackstatus','feedbackstatus','customerresponse','customersatisfaction'],
  notes:['remark','remarks','additionalremarks','additionalnotes','notes'],
  channel:['complaintchannel','sourceofcomplaint','sourcechannel'],
  service:['servicechannel','orderchannel','channel'],
  product:['productdetailsmentionproductnametopping','productdetails','itemdescription','productname','menuitem'],
  coach:['areacoach','areacoachname','areacoachincharge','clustercoach','clustername','coach']
};
function detectHeaders(row){
  const entries=Object.entries(row).map(([c,v])=>[c,normalized(v)]).filter(([,v])=>v);
  const map={};
  const patterns={
    outlet:v=>/^(outlet|branch|store|restaurant|location)(name|code|number|no)?$/.test(v)||/^(name|code|number|no)(of)?(outlet|branch|store)$/.test(v),
    description:v=>/^(complaint|issue|feedback)(description|details|detail|narrative|text|summary|explanation|nature)$/.test(v)||/^(description|details|detail|nature|summary)of(complaint|issue|feedback)$/.test(v),
    coach:v=>/^(area|regional|cluster)(coach|manager|leader)(name|incharge)?$/.test(v)||/^(coach|manager)of(area|cluster)$/.test(v),
    orderNumber:v=>/^(order|invoice|receipt|bill)(number|no|id|reference|ref)$/.test(v),
    orderDate:v=>/^(order|complaint|incident|reported|received)(date|on)$/.test(v),
    action:v=>/^(outlet|store|branch)(comment|comments|action|response|reply)$/.test(v)||/^(action|response|solution)(taken|provided)?(by)?(outlet|store|branch)$/.test(v),
    status:v=>/^(complaint|salescentre|salescenter|case)(close|closure|resolution)?status$/.test(v),
    closedFlag:v=>/^(close|closed|closure)(the)?complaint(yesno|yn|flag|status)?$/.test(v),
    closureDirective:v=>/^(closure|closing)(directive|authorized|approved)(by|from)?$/.test(v),
    customerContact:v=>/^(customer|guest|client)(contact|phone|telephone|mobile)(number|no)?$/.test(v),
    customerName:v=>/^(customer|guest|client)(name|fullname)$/.test(v),
    channel:v=>/^(complaint|feedback)(source|channel|medium)$/.test(v),
    service:v=>/^(service|order|delivery)(channel|mode|type)$/.test(v),
    type:v=>/^(complaint|issue|feedback)(type|category|classification)$/.test(v)
  };
  for(const [field,aliases] of Object.entries(HEADER_MATCH)){
    const hit=entries.find(([,v])=>aliases.includes(v)||(patterns[field]?.(v)??false));
    if(hit)map[field]=hit[0];
  }
  // PHSL templates sometimes contain edited O/R/U column headings. Recover
  // positions only when multiple independent anchors verify this layout.
  const anchors={B:'areacoach',C:'outlet',D:'orderdate',F:'customername',G:'customercontactnumber',H:'ordernumber',I:'servicechannel',J:'complaintchannel',K:'complainttype',P:'salescentrecomment',Q:'complaintlodgedby',T:'commentupdatedby',V:'closuredirectiveby',W:'salescentreclosurestatus',X:'customerfeedbackstatus',Y:'remark',Z:'updatedby'};
  const evidence=Object.entries(anchors).filter(([col,label])=>col!=='B'&&normalized(row[col])===label).length;
  if(map.outlet==='C'&&evidence>=6&&[row.D,row.H,row.K].filter(x=>x!=null).length>=2){
    for(const [field,col] of Object.entries({description:'O',action:'R',closedFlag:'U'}))if(!map[field])map[field]=col;
    map.outlet='C';
  }
  const hasNarrative=!!map.description;
  const hasIdentity=!!(map.orderDate||map.orderNumber||map.customerName||map.lodgedBy);
  return map.outlet?map:null;
}
const pad=n=>String(n).padStart(2,'0');
const validDate=(y,m,d)=>y>1900&&m>=1&&m<=12&&d>=1&&d<=31&&new Date(Date.UTC(y,m-1,d)).getUTCDate()===d;
function excelDate(value){if(value==null||String(value).trim()==='')return '';const s=String(value).trim();
 if(/^\d{4,5}(?:\.\d+)?$/.test(s)){const n=Number(s);if(n>20000&&n<100000)return new Date(Date.UTC(1899,11,30)+Math.floor(n)*86400000).toISOString().slice(0,10);}
 let m=s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);if(m){const y=+m[1],mo=+m[2],d=+m[3];return validDate(y,mo,d)?`${y}-${pad(mo)}-${pad(d)}`:s;}
 m=s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);if(m){const y=+m[3],mo=+m[2],d=+m[1];return validDate(y,mo,d)?`${y}-${pad(mo)}-${pad(d)}`:s;}return s;
}
const text=v=>String(v??'').trim();
const fnv=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);};
function classifyStatus(raw,closedFlag,directive=''){
 const yes=['yes','y','true','1','closed'].includes(normalized(closedFlag));
 if(canonicalCoach(directive)&&yes)return 'resolved';
 const s=normalized(raw);
 if(['resolved','closed','completed','complete','done','settled'].includes(s))return 'resolved';
 if(s)return 'pending';
 return 'pending'; // Yes alone is not an authorized closure when no explicit status exists.
}
const CATEGORIES=new Map([
 ['wrongitem','Wrong item'],['incorrectitem','Wrong item'],['missingitem','Missing item'],['missingitems','Missing item'],
 ['missingproduct','Missing item'],['latedelivery','Late delivery'],['deliverydelay','Late delivery'],
 ['coldfood','Food temperature'],['foodcold','Food temperature'],['temperature','Food temperature'],
 ['productquality','Product quality'],['quality','Product quality'],['badquality','Product quality'],
 ['staffbehavior','Staff behaviour'],['staffbehaviour','Staff behaviour'],['rudeservice','Staff behaviour'],
 ['foodpoisoning','Food safety'],['foodquality','Food quality'],
 ['servicerelated','Service related'],['servicerelatedcomplaint','Service related'],['incompleteorder','Incomplete order'],
 ['productrelated','Product related'],['deliveryrelated','Delivery related'],['orderissue','Order issue'],
 ['orderrelated','Order related'],['incorrectorder','Incorrect Order'],['orderdelays','Order Delays'],['safetyrelated','Safety Related'],['other','Other']
]);
function normalizeCategory(value){const source=text(value).replace(/\s+/g,' ');if(!source)return 'Uncategorized';return CATEGORIES.get(normalized(source))||source;}
// Stable cross-month fingerprint. Order number + outlet + date is primary; fallback uses customer/description.
function complaintIdentity(r){const key=[r.outlet,normalized(r.orderNumber),r.orderDate];
 if(r.orderNumber&&!/^(na|nil|none|notavailable|unknown|unavailable|unabletotrace|notprovided|noordernumber|0)$/.test(normalized(r.orderNumber)))return fnv([...key,normalized(r.description)].join('|'));
 return fnv([r.outlet,r.orderDate,normalized(r.customerContact)||normalized(r.customerName),normalized(r.description)].join('|'));
}
function normalizeComplaint(row,map,sourceRow='',period='',{allowMissingCoach=false}={}){
 const pick=key=>{const val=map[key]?text(row[map[key]]):'';return /^(#N\/A|#REF!|#VALUE!|#DIV\/0!|#NAME\?|#NUM!|#NULL!)$/i.test(val)?'':val;};
 const outlet=canonicalOutlet(pick('outlet'));
 if(!outlet)return {ignored:true,reason:pick('outlet')?'unknownOutlet':'blankOutlet',originalOutlet:pick('outlet'),sourceRow:Number(sourceRow)||0};
 const description=pick('description')||pick('type')||'';
 // Area Coach is informational only. Never reject by coach.\n const expectedCoach=coachForOutletAtPeriod(outlet,period),coachValue=pick('coach');
 const orderDate=excelDate(pick('orderDate')),orderNumber=pick('orderNumber'),customerName=pick('customerName');
 const closedFlag=pick('closedFlag'),closureDirective=pick('closureDirective'),statusRaw=pick('status');
 const r={period,outlet,cluster:expectedCoach,areaCoach:expectedCoach,sourceAreaCoach:coachValue,coachUnverified:false,
  orderDate,orderNumber,customerName,customerContact:pick('customerContact'),lodgedBy:pick('lodgedBy'),
  description,complaintType:pick('type'),category:normalizeCategory(pick('type')),status:classifyStatus(statusRaw,closedFlag,closureDirective),statusRaw,closedFlag,closureDirective,
  action:pick('action'),salesAction:pick('salesAction'),customerFeedback:pick('feedback'),notes:pick('notes'),
  complaintChannel:pick('channel'),serviceChannel:pick('service'),product:pick('product'),sourceRow:Number(sourceRow)||0};
 r.identity=complaintIdentity(r);r.id=fnv([period,r.identity,normalized(r.description),r.sourceRow].join('|'));return r;
}
// Only the approved outlet name is checked, including restored records.
function verifiedRecordScope(r){return !!r&&!!canonicalOutlet(r.outlet);}
function getScopeOutlets(mode,value){if(mode==='outlet')return value==='all'?OUTLETS:OUTLETS.includes(value)?[value]:[];
 return value==='tharanga'?CLUSTERS.tharanga:value==='morris'?CLUSTERS.morris:OUTLETS;}
function summarize(rows){const total=rows.length,resolved=rows.filter(r=>r.status==='resolved').length;return {total,resolved,pending:total-resolved,rate:total?Math.round(resolved/total*100):0};}
function pendingAge(orderDate,reference=new Date()){
 if(!/^\d{4}-\d\d-\d\d$/.test(orderDate||''))return null;
 const time=Date.parse(orderDate+'T00:00:00Z');if(!Number.isFinite(time))return null;
 const now=Date.UTC(reference.getFullYear(),reference.getMonth(),reference.getDate());return Math.max(0,Math.floor((now-time)/86400000));
}
function crossMonthDuplicates(candidate,snapshots){const seen=new Map();for(const s of snapshots)for(const r of s.records||[]){const key=r.identity||complaintIdentity(r);if(!seen.has(key))seen.set(key,new Set());seen.get(key).add(s.period);}
 return candidate.filter(r=>seen.has(r.identity||complaintIdentity(r))).map(r=>({id:r.id,outlet:r.outlet,orderNumber:r.orderNumber,months:[...seen.get(r.identity||complaintIdentity(r))].sort()}));
}

return {OUTLETS,CLUSTERS,normalized,canonicalOutlet,clusterOf,COACH_HANDOVER_PERIOD,coachForOutletAtPeriod,canonicalCoach,detectHeaders,excelDate,classifyStatus,normalizeCategory,complaintIdentity,normalizeComplaint,verifiedRecordScope,getScopeOutlets,summarize,pendingAge,crossMonthDuplicates};
})();

const {channelKey,channelOptions,matchesChannels,phoneSearchMatches,matchesSearch}=(()=>{
// Local-only report searching and channel filtering. No server requests or telemetry.
const channelKey=value=>String(value??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');
function channelOptions(records,field){
  const map=new Map();let missing=false;
  for(const r of records){const v=String(r[field]??'').trim().replace(/\s+/g,' ');
    if(!v){missing=true;continue;}
    const key=channelKey(v);if(!map.has(key))map.set(key,v);
  }
  const values=[...map].sort((a,b)=>a[1].localeCompare(b[1],'en',{sensitivity:'base'})).map(([value,label])=>({value,label}));
  if(missing)values.push({value:'__missing__',label:'Not specified'});
  return values;
}
function matchesChannels(record,{serviceChannel='all',complaintChannel='all'}={}){
  const check=(value,selected)=>selected==='all'||(selected==='__missing__'?!channelKey(value):channelKey(value)===selected);
  return check(record.serviceChannel,serviceChannel) && check(record.complaintChannel,complaintChannel);
}
function phoneSearchMatches(contact,query){
  const digits=s=>String(s??'').replace(/\D/g,'');
  const canonical=s=>{let v=digits(s);if(v.length===12&&v.startsWith('94'))v=v.slice(2);if(v.length===11&&v.startsWith('94'))v=v.slice(2);if(v.length===10&&v.startsWith('0'))v=v.slice(1);return v;};
  const q=digits(query),v=digits(contact);
  if(!q||!v)return false;
  return v.includes(q)||canonical(v).includes(canonical(q));
}
const textMatch=(value,query)=>String(value??'').toLocaleLowerCase('en').includes(query.toLocaleLowerCase('en'));
const dateMatch=(value,query)=>{
  const raw=String(value??''),q=String(query??'').trim();
  if(textMatch(raw,q))return true;
  const uk=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return !!uk && [uk[3]+'/'+uk[2]+'/'+uk[1],uk[3]+'-'+uk[2]+'-'+uk[1],uk[3]+'/'+uk[2]+'/'+uk[1].slice(2)].some(d=>textMatch(d,q));
};
function matchesSearch(record,search='',field='all'){
  const q=String(search??'').trim();if(!q)return true;
  switch(field){
    case 'orderDate': return dateMatch(record.orderDate,q);
    case 'customerName': return textMatch(record.customerName,q);
    case 'customerContact': return phoneSearchMatches(record.customerContact,q);
    case 'orderNumber': return textMatch(record.orderNumber,q);
    case 'description': return textMatch(record.description,q);
    default: return [record.outlet,record.customerName,record.lodgedBy,record.description,record.complaintType,record.orderNumber,record.action,record.salesAction,record.complaintChannel,record.serviceChannel].some(v=>textMatch(v,q)) || dateMatch(record.orderDate,q) || phoneSearchMatches(record.customerContact,q);
  }
}

return {channelKey,channelOptions,matchesChannels,phoneSearchMatches,matchesSearch};
})();

const {openDatabase,listSnapshots,saveSnapshot,removeSnapshot,saveBatch,requestDurableStorage}=(()=>{
// Local-only storage. Each month is one atomic snapshot; source workbook binary is not retained.
const NAME='ph-complaints-hub',VERSION=1,STORE='snapshots';let promise;
function requestValue(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||Error('Local storage request failed.'));});}
function openDatabase(){
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
async function listSnapshots(){const db=await openDatabase();return requestValue(db.transaction(STORE,'readonly').objectStore(STORE).getAll());}
async function saveSnapshot(snapshot){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(snapshot.period)||!Array.isArray(snapshot.records))throw Error('Invalid monthly dataset.');
  const db=await openDatabase();return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(snapshot);
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Unable to store this month. Export a backup and check available device storage.'));
    tx.onabort=()=>reject(tx.error||Error('The monthly import was cancelled by storage.'));
  });
}
async function removeSnapshot(period){const db=await openDatabase();return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(period);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Unable to remove month.'));tx.onabort=()=>reject(tx.error||Error('Delete operation was cancelled.'));
});}
async function saveBatch(snapshots){const db=await openDatabase();return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');for(const snap of snapshots)tx.objectStore(STORE).put(snap);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Backup restore did not complete.'));tx.onabort=()=>reject(tx.error||Error('Backup restore was cancelled.'));
});}
async function requestDurableStorage(){try{if(navigator.storage?.persist)await navigator.storage.persist();}catch{/* optional */}}

return {openDatabase,listSnapshots,saveSnapshot,removeSnapshot,saveBatch,requestDurableStorage};
})();

const {generateSummaryPdf,generateDetailedPdf,generateComplaintPdf}=(()=>{
// Dependency-free, fully offline PDF writer. Vector charts, selectable English text,
// explicit page breaks, no third-party services or PDF rendering APIs required.

const RED='#C8102E',INK='#20242B',GRAY='#586372',PAPER='#FFFFFF',LIGHT='#F3F5F7',GREEN='#27744B',GOLD='#B7791F';
const safe=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2018\u2019]/g,"'").replace(/[\u2013\u2014]/g,'-').replace(/[\u201c\u201d]/g,'"').replace(/[\u2022]/g,'-').replace(/[^\x20-\x7E\n\r\t]/g,'?');
const hex=h=>[1,3,5].map(i=>(parseInt(h.slice(i,i+2),16)/255).toFixed(3)).join(' ');
const escapePdf=s=>safe(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/\r|\n/g,' ');
const n=v=>Number(v).toFixed(2).replace(/\.00$/,'');
const labelMonth=v=>/^\d{4}-\d{2}$/.test(v)?new Date(v+'-01T12:00:00Z').toLocaleDateString('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}):v;
function wrap(value,maxWidth,size=9){const parts=safe(value||'Not provided').split(/\n/);const lines=[];const max=Math.max(10,Math.floor(maxWidth/(size*.53)));
  for(const p of parts){const words=p.split(/\s+/);let line='';for(let word of words){while(word.length>max){if(line){lines.push(line);line='';}lines.push(word.slice(0,max));word=word.slice(max);}if(!word)continue;const s=line?line+' '+word:word;if(s.length>max&&line){lines.push(line);line=word;}else line=s;}lines.push(line||' ');}return lines;
}
class PDF {
 constructor(width=595.28,height=841.89){this.W=width;this.H=height;this.pages=[];this.ops=[];this.pageNo=0;this.y=0;this.title='';this.period='';}
 cmd(s){this.ops.push(s);}
 rect(x,top,w,h,color=LIGHT){this.cmd(`${hex(color)} rg ${n(x)} ${n(this.H-top-h)} ${n(w)} ${n(h)} re f`);}
 stroke(x,top,w,h,color='#D7DCE1'){this.cmd(`${hex(color)} RG 0.75 w ${n(x)} ${n(this.H-top-h)} ${n(w)} ${n(h)} re S`);}
 line(x,top,x2,top2,color='#D8DDE3',width=.8){this.cmd(`${hex(color)} RG ${n(width)} w ${n(x)} ${n(this.H-top)} m ${n(x2)} ${n(this.H-top2)} l S`);}
 text(x,top,s,size=10,{bold=false,color=INK}={}){this.cmd(`${hex(color)} rg BT /${bold?'FB':'FR'} ${n(size)} Tf 1 0 0 1 ${n(x)} ${n(this.H-top-size)} Tm (${escapePdf(s)}) Tj ET`);}
 multiline(x,top,value,width,size=9,{color=INK,bold=false,lineHeight=13,maxLines=0}={}){const lines=wrap(value,width,size);const use=maxLines?lines.slice(0,maxLines):lines;use.forEach((s,i)=>this.text(x,top+i*lineHeight,s,size,{bold,color}));return use.length*lineHeight;}
 page(title='Customer Complaints Hub',subtitle=''){if(this.ops.length)this.pages.push(this.ops.join('\n'));this.ops=[];this.pageNo++;this.title=title;
  this.rect(0,0,this.W,9,RED);this.rect(0,9,this.W,63,PAPER);this.text(36,25,'PIZZA HUT  /  SRI LANKA',9,{bold:true,color:RED});this.text(36,43,title,18,{bold:true,color:INK});if(subtitle)this.text(this.W-250,29,subtitle,8,{color:GRAY});
  this.line(36,78,this.W-36,78,'#E1E5E9');this.y=92;
 }
 ensure(height=50){if(this.y+height>this.H-57)this.page(this.title,this.period);}
 footer(){const total=this.pages.length;this.pages=this.pages.map((p,i)=>{
   const d=new PDF(this.W,this.H);d.ops=[p];d.line(36,this.H-44,this.W-36,this.H-44,'#D9DDE2');d.text(36,this.H-35,'INTERNAL  -  DEVICE-GENERATED REPORT',8,{color:GRAY});d.text(this.W-116,this.H-35,`Page ${i+1} of ${total}`,8,{color:GRAY});return d.ops.join('\n');});}
 output(){if(this.ops.length)this.pages.push(this.ops.join('\n'));this.ops=[];this.footer();
   const o=[''],add=s=>(o.push(s),o.length-1);const fr=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');const fb=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
   const pageTree=add('');const pageIds=[];
   for(const stream of this.pages){const content=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
     pageIds.push(add(`<< /Type /Page /Parent ${pageTree} 0 R /MediaBox [0 0 ${n(this.W)} ${n(this.H)}] /Resources << /Font << /FR ${fr} 0 R /FB ${fb} 0 R >> >> /Contents ${content} 0 R >>`));}
   o[pageTree]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
   const catalog=add(`<< /Type /Catalog /Pages ${pageTree} 0 R >>`);
   let text='%PDF-1.4\n%Offline PDF\n';const offsets=[0];for(let i=1;i<o.length;i++){offsets.push(text.length);text+=`${i} 0 obj\n${o[i]}\nendobj\n`;}
   const xref=text.length;text+=`xref\n0 ${o.length}\n0000000000 65535 f \n`;
   for(let i=1;i<o.length;i++)text+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
   text+=`trailer\n<< /Size ${o.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
   return new Blob([text],{type:'application/pdf'});
 }
}
const group=(rows,getter)=>{const map=new Map();for(const r of rows){const k=getter(r)||'Uncategorized',key=String(k).toLowerCase().replace(/[^a-z0-9]+/g,'');if(!map.has(key))map.set(key,{name:k,count:0});map.get(key).count++;}return [...map.values()].map(v=>[v.name,v.count]).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));};
function heading(doc,text,sub=''){doc.ensure(53);doc.text(36,doc.y,text,13,{bold:true});doc.y+=23;if(sub){doc.text(36,doc.y,sub,8,{color:GRAY});doc.y+=19;}}
function table(doc,heads,rows,widths,{rowHeight=25,firstWidth=0}={}){const x=36;let y=doc.y;
 const header=()=>{doc.rect(x,doc.y,doc.W-72,29,INK);let col=x+10;heads.forEach((h,i)=>{doc.text(col,doc.y+8,h,8,{bold:true,color:PAPER});col+=widths[i];});doc.y+=29;};header();
 rows.forEach((values,index)=>{doc.ensure(rowHeight+3);if(doc.y===92)header();if(index%2===0)doc.rect(x,doc.y,doc.W-72,rowHeight,LIGHT);
   let col=x+10;values.forEach((value,i)=>{doc.multiline(col,doc.y+7,String(value),widths[i]-12,8,{lineHeight:10,maxLines:2});col+=widths[i];});doc.y+=rowHeight;});doc.y+=13;
}
function kpi(doc,rows){const x=summarize(rows),items=[['TOTAL COMPLAINTS',x.total,INK],['RESOLVED',x.resolved,GREEN],['PENDING',x.pending,GOLD],['RESOLUTION RATE',`${x.rate}%`,RED]];
 const gap=10,w=(doc.W-72-gap*3)/4;for(const [i,[label,val,c]] of items.entries()){
  const bx=36+i*(w+gap);doc.rect(bx,doc.y,w,82,LIGHT);doc.rect(bx,doc.y,3,82,c);doc.text(bx+12,doc.y+15,label,7.3,{bold:true,color:GRAY});doc.text(bx+12,doc.y+36,String(val),23,{bold:true,color:c});}
 doc.y+=104;
}
function chart(doc,monthly){heading(doc,'MONTHLY COMPLAINT TREND','Latest 10 saved months for the selected scope, channels, status and search filters');
 const months=monthly.slice(-10);if(!months.length){doc.text(36,doc.y,'No monthly history available.',9,{color:GRAY});doc.y+=30;return;}
 const left=47,width=doc.W-104,height=122,start=doc.y+18;const max=Math.max(1,...months.map(x=>x.total));
 doc.line(left,start+height,left+width,start+height);doc.line(left,start+height/2,left+width,start+height/2,'#E3E5E7');
 const bw=Math.min(34,width/months.length*.54),step=width/months.length;
 months.forEach((m,i)=>{const x=left+i*step+(step-bw)/2,bar=m.total/max*height,pending=m.pending/max*height;
   doc.rect(x,start+height-bar,bw,bar,'#D7DDE5');if(pending>0)doc.rect(x,start+height-pending,bw,pending,RED);
   doc.text(x,start+height+5,m.period.slice(5)+'/'+m.period.slice(2,4),8,{color:GRAY});doc.text(x,start+height-bar-14,m.total,8,{bold:true,color:INK});});
 doc.y=start+height+39;doc.text(47,doc.y,'Grey: total complaints    Red: pending complaints',8,{color:GRAY});doc.y+=27;
}
function generateSummaryPdf({rows=[],monthly=[],periodLabel='All saved months',scopeLabel='Both clusters',includeContact=false,referenceDate=new Date(),filterText=''}={}){
 const doc=new PDF();doc.period=periodLabel;doc.page('Management summary',periodLabel);doc.text(36,doc.y,`Scope: ${scopeLabel}`,10,{bold:true});doc.text(36,doc.y+18,`Reporting period: ${periodLabel}     Generated: ${new Date().toLocaleDateString('en-GB')}`,8,{color:GRAY});doc.y+=38;if(filterText){doc.y+=doc.multiline(36,doc.y,filterText,doc.W-72,8,{color:GRAY})+10;}else doc.y+=13;
 kpi(doc,rows);chart(doc,monthly);
 heading(doc,'OUTLET PERFORMANCE');const outletRows=OUTLETS.filter(o=>rows.some(r=>r.outlet===o)).map(o=>{const s=summarize(rows.filter(r=>r.outlet===o));return [o,String(s.total),String(s.resolved),String(s.pending),`${s.rate}%`];});
 if(outletRows.length)table(doc,['OUTLET','TOTAL','RESOLVED','PENDING','CLOSED %'],outletRows,[193,72,82,80,94],{rowHeight:24});else {doc.text(36,doc.y,'No complaints for the selected filters.',9,{color:GRAY});doc.y+=24;}
 heading(doc,'COMPLAINT CATEGORIES');const groups=group(rows,r=>r.category||normalizeCategory(r.complaintType));if(groups.length)table(doc,['CATEGORY','COMPLAINTS'],groups.map(([k,v])=>[k,v]),[380,141],{rowHeight:24});
 heading(doc,'CHANNEL BREAKDOWN');const services=group(rows,r=>r.serviceChannel||'Not specified');if(services.length)table(doc,['SERVICE CHANNEL','COMPLAINTS'],services.map(([k,v])=>[k,v]),[380,141],{rowHeight:23});
 const complaintChannels=group(rows,r=>r.complaintChannel||'Not specified');if(complaintChannels.length){heading(doc,'COMPLAINT CHANNEL BREAKDOWN');table(doc,['COMPLAINT CHANNEL','COMPLAINTS'],complaintChannels.map(([k,v])=>[k,v]),[380,141],{rowHeight:23});}
 heading(doc,'PENDING FOLLOW-UP');const pending=rows.filter(r=>r.status==='pending');doc.multiline(36,doc.y,pending.length?`${pending.length} complaint(s) currently pending; ${pending.filter(r=>(pendingAge(r.orderDate,referenceDate)||0)>=14).length} are aged 14+ days based on order date.`:'No pending complaints in the selected records.',doc.W-72,9);doc.y+=36;
 return doc.output();
}
function generateDetailedPdf({rows=[],periodLabel='All saved months',scopeLabel='Both clusters',includeContact=false,filterText=''}={}){
 const doc=new PDF(841.89,595.28);doc.period=periodLabel;doc.page('Detailed complaint register',periodLabel);doc.text(36,doc.y,`${scopeLabel}  |  ${rows.length} complaints  |  ${includeContact?'Contacts included':'Contacts withheld'}`,9,{color:GRAY});doc.y+=17;if(filterText){doc.y+=doc.multiline(36,doc.y,filterText,doc.W-72,8,{color:GRAY})+10;}else doc.y+=16;
 if(!rows.length){doc.text(36,doc.y,'No matching complaints.',11);return doc.output();}
 const font=10,lineHeight=15,labelHeight=17,fieldGap=11,headerHeight=52,recordGap=28;
 const linesFor=value=>wrap(value||'Not provided',doc.W-100,font);
 const field=(label,value,identity)=>{const lines=linesFor(value);
  doc.ensure(labelHeight+lineHeight);doc.text(49,doc.y,label.toUpperCase(),8.5,{bold:true,color:GRAY});doc.y+=labelHeight;
  for(const line of lines){if(doc.y+lineHeight>doc.H-57){doc.page(doc.title,doc.period);doc.text(49,doc.y,`${identity} - ${label.toUpperCase()} (CONTINUED)`,8.5,{bold:true,color:GRAY});doc.y+=labelHeight;}doc.text(49,doc.y,line,font);doc.y+=lineHeight;}doc.y+=fieldGap;
 };
 rows.forEach((r,i)=>{
  const fields=[['Customer / complaint lodged by',`${r.customerName||'Not provided'}  /  ${r.lodgedBy||'Not provided'}`]];
  if(includeContact)fields.push(['Customer contact number',r.customerContact]);
  fields.push(['Service channel / complaint channel',`${r.serviceChannel||'Not specified'}  /  ${r.complaintChannel||'Not specified'}`],['Category',r.category||r.complaintType],['Complaint',r.description],['Outlet action / comment',r.action]);
  if(r.salesAction)fields.push(['Sales centre action',r.salesAction]);
  fields.push(['Source closure fields',`Closure status: ${r.statusRaw||'Blank'}; Close complaint: ${r.closedFlag||'Blank'}; Closure directive by: ${r.closureDirective||'Blank'}`]);
  const cardHeight=headerHeight+fields.reduce((h,[,v])=>h+labelHeight+linesFor(v).length*lineHeight+fieldGap,0)+recordGap;
  if(cardHeight<=doc.H-57-92)doc.ensure(cardHeight);else doc.ensure(headerHeight+labelHeight+lineHeight);
  doc.rect(36,doc.y,doc.W-72,40,LIGHT);doc.rect(36,doc.y,4,40,r.status==='resolved'?GREEN:GOLD);
  doc.text(48,doc.y+8,`${i+1}.  ${r.outlet}  /  ${r.areaCoach||r.cluster}  /  ${r.status.toUpperCase()}`,12,{bold:true});
  doc.text(48,doc.y+25,`Order: ${r.orderNumber||'N/A'}     Date: ${r.orderDate||'N/A'}     Reporting month: ${r.period||periodLabel}`,9,{color:GRAY});doc.y+=headerHeight;
  for(const [label,value] of fields)field(label,value,`Complaint ${i+1}`);
  if(doc.y+4<=doc.H-57)doc.line(36,doc.y,doc.W-36,doc.y);
  doc.y+=recordGap;
 });
 return doc.output();
}

function generateComplaintPdf({record}={}){
 if(!record || !record.outlet || !record.period)throw Error('Complaint information is missing.');
 const r=record,doc=new PDF(595.28,841.89);
 doc.period=r.period;doc.page('Complaint details',r.period);
 doc.rect(36,doc.y,doc.W-72,55,LIGHT);doc.rect(36,doc.y,4,55,r.status==='resolved'?GREEN:GOLD);
 doc.text(48,doc.y+9,`${r.outlet} / ${r.status==='resolved'?'RESOLVED':'PENDING'}`,13,{bold:true});
 doc.text(48,doc.y+31,`Order ${r.orderNumber||'Not provided'}  |  ${r.orderDate||'Date not provided'}`,9,{color:GRAY});doc.y+=71;
 const fields=[
  ['Area Coach',r.areaCoach],['Outlet',r.outlet],['Order Date',r.orderDate],['Order Number',r.orderNumber],
  ['Customer Name',r.customerName],['Customer Contact Number',r.customerContact],
  ['Complaint Lodged By',r.lodgedBy],['Reporting Month',r.period],
  ['Service Channel',r.serviceChannel],['Complaint Channel',r.complaintChannel],
  ['Complaint Type (original)',r.complaintType],['Complaint Type (normalized)',r.category],
  ['Complaint Description',r.description],['Outlet Action / Comment',r.action],
  ['Sales Centre Action / Comment',r.salesAction],['Current Status',r.status],
  ['Original Sales Centre Closure Status',r.statusRaw],
  ['Close Complaint? (Yes / No)',r.closedFlag],['Closure Directive By',r.closureDirective],
  ['Customer Feedback Status',r.customerFeedback],['Remarks',r.notes],['Product Details',r.product]
 ];
 for(const [label,value] of fields){
  const lines=wrap(String(value||'Not provided'),doc.W-96,10.5);
  doc.ensure(37);doc.text(48,doc.y,label.toUpperCase(),8.5,{bold:true,color:GRAY});doc.y+=17;
  for(const line of lines){doc.ensure(16);doc.text(48,doc.y,line,10.5);doc.y+=16;}
  doc.y+=12;
 }
 return doc.output();
}

return {generateSummaryPdf,generateDetailedPdf,generateComplaintPdf};
})();





const VERSION='2.9.3';
const PAGES={overview:['Overview'],complaints:['Complaints'],trends:['Monthly trends'],reports:['PDF reports'],library:['Data library'],update:['Update & repair']};
const $=id=>document.getElementById(id),main=$('main-content'),modal=$('modal-root');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n||0).toLocaleString('en-LK');
const current=new Date();
const MONTH_NAMES=['january','february','march','april','may','june','july','august','september','october','november','december'];
function filenamePeriod(name){const m=String(name||'').match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})\b/i);return m?`${m[2]}-${String(MONTH_NAMES.indexOf(m[1].toLowerCase())+1).padStart(2,'0')}`:'';}
const monthName=s=>/^\d{4}-\d{2}$/.test(s||'')?new Date(s+'-01T12:00:00Z').toLocaleString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}):'No month selected';
const prettyDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?new Date(s+'T12:00:00Z').toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}):s||'Not provided';
const savePref=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
const getPref=(k,d='')=>{try{return localStorage.getItem(k)||d;}catch{return d;}};
const state={snapshots:[],route:'overview',mode:getPref('ph-scope-mode','cluster')==='outlet'?'outlet':'cluster',scope:getPref('ph-scope','both'),period:'latest',status:'all',search:'',searchField:'all',serviceChannel:'all',complaintChannel:'all',page:1,selectedFile:null,preview:null,importing:false,saving:false,dbLoading:true,progress:0,progressLabel:'',importError:'',uploadMonth:current.getMonth()+1,uploadYear:current.getFullYear(),missingCoachAck:false,includeContacts:false,reportType:'summary',dbError:'',sort:'recent',repairing:false,repairStatus:''};
const orderedSnapshots=()=>[...state.snapshots].sort((a,b)=>a.period.localeCompare(b.period));
const latestPeriod=()=>{const ordered=orderedSnapshots();return ordered.length?ordered[ordered.length-1].period:'';};
const selectedPeriod=()=>state.period==='latest'?latestPeriod():state.period;
const scopeOutlets=()=>{
 if(state.mode==='outlet')return getScopeOutlets(state.mode,state.scope);
 if(state.scope==='morris'&&(state.period==='all'||(selectedPeriod()&&selectedPeriod()<'2026-06')))return OUTLETS;
 if(state.scope==='tharanga'&&state.period!=='all'&&selectedPeriod()&&selectedPeriod()<'2026-06')return [];
 return getScopeOutlets(state.mode,state.scope);
};
const scopeName=()=>state.mode==='outlet'?(state.scope==='all'?'All 14 outlets':state.scope):state.scope==='tharanga'?"Tharanga's Cluster":state.scope==='morris'?"Morris's Cluster":"Tharanga's and Morris's Clusters";
// Older v1.1 snapshots lacked coach proof. Prevent unverified legacy entries
// silently appearing under the new strict coach policy.
const verifiedRow=verifiedRecordScope;
const allRecords=()=>state.snapshots.flatMap(s=>(s.records||[]).filter(verifiedRow).map(r=>{const outlet=canonicalOutlet(r.outlet);const coach=coachForOutletAtPeriod(outlet,s.period);return {...r,outlet,period:s.period,sourceAreaCoach:r.sourceAreaCoach??r.areaCoach,areaCoach:coach,cluster:coach};}));
const scopeRecords=records=>records.filter(r=>{
 const included=state.mode==='outlet'?new Set(scopeOutlets()).has(r.outlet):
 (state.scope==='both'||coachForOutletAtPeriod(r.outlet,r.period)===(state.scope==='tharanga'?'Tharanga':'Morris'));
 return included&&matchesChannels(r,state);
});
const monthRecords=()=>scopeRecords(allRecords()).filter(r=>state.period==='all'||r.period===selectedPeriod());
const visibleRecords=()=>monthRecords().filter(r=>(state.status==='all'||r.status===state.status)&&matchesSearch(r,state.search,state.searchField)).sort((a,b)=>((a.status==='pending'?0:1)-(b.status==='pending'?0:1))||(b.orderDate||'').localeCompare(a.orderDate||'')||(b.sourceRow||0)-(a.sourceRow||0));
const picker=(label,classes='btn btn-secondary')=>`<label class="${classes} native-picker">${label}<input type="file" data-import-input aria-label="${label.replace(/[^a-zA-Z ]/g,'').trim()}" accept=".xlsx,.xlsm,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ${state.importing||state.saving?'disabled':''}></label>`;
const blankState=(heading,body,link=true)=>`<div class="empty-state"><div class="empty-icon" aria-hidden="true">▤</div><h3>${esc(heading)}</h3><p>${esc(body)}</p>${link?picker('Import Excel report'):''}</div>`;
const orderMeta=r=>`<span class="order-meta"><span class="order-date">${esc(prettyDate(r.orderDate))}</span>${r.orderNumber?`<span class="order-number" title="Order number">${esc(r.orderNumber)}</span>`:''}</span>`;
const statusTag=r=>`<span class="status-tag ${r.status==='resolved'?'is-resolved':'is-pending'}"><i></i>${r.status==='resolved'?'Resolved':'Pending'}</span>`;
function alertToast(message){const el=document.createElement('div');el.className='toast';el.textContent=message;$('toast-root').append(el);setTimeout(()=>el.remove(),5000);}
function header(name,extra=''){return `<div class="page-header"><div><h1>${esc(PAGES[name][0])}</h1></div>${extra}</div>`;}
function selectOption(value,text,selected){return `<option value="${esc(value)}" ${selected===value?'selected':''}>${esc(text)}</option>`;}
function filterPanel({includeMonth=true}={}){
 const scopeOpts=state.mode==='cluster'?[['both',"Tharanga's and Morris's Cluster"],['tharanga',"Tharanga's Cluster"],['morris',"Morris's Cluster"]]:[['all','All approved outlets'],...OUTLETS.map(o=>[o,o])];
 const periodOpts=[['latest','Latest saved month'],['all','All saved months'],...orderedSnapshots().reverse().map(s=>[s.period,monthName(s.period)])];
 const channels=(id,field,label)=>`<label class="field"><span>${label}</span><select class="select" id="${id}" data-channel="${field}"><option value="all">All ${label.toLowerCase()}s</option>${channelOptions(allRecords(),field).map(x=>selectOption(x.value,x.label,state[field])).join('')}</select></label>`;
 return `<section class="panel filters" aria-label="Report filters"><div class="filter-heading"><div><strong>Report filters</strong><span>Combine filters to narrow results</span></div><div class="choice-pills" role="group" aria-label="Filter by"><button class="pill ${state.mode==='cluster'?'selected':''}" data-mode="cluster" type="button" aria-pressed="${state.mode==='cluster'}">By cluster</button><button class="pill ${state.mode==='outlet'?'selected':''}" data-mode="outlet" type="button" aria-pressed="${state.mode==='outlet'}">By outlet</button></div></div><div class="filters-grid">
 <label class="field"><span>${state.mode==='cluster'?'Cluster':'Outlet'}</span><select id="scope-select" class="select" data-scope>${scopeOpts.map(([v,l])=>selectOption(v,l,state.scope)).join('')}</select></label>
 ${includeMonth?`<label class="field"><span>Reporting month</span><select id="month-select" class="select" data-period>${periodOpts.map(([v,l])=>selectOption(v,l,state.period)).join('')}</select></label>`:''}
 ${channels('service-channel','serviceChannel','Service channel')}
 ${channels('complaint-channel','complaintChannel','Complaint channel')}
 </div><div class="filter-bottom"><span><span class="filter-number">${num(monthRecords().length)}</span> complaints in your current selection</span><button class="text-button" type="button" id="clear-filters">Reset filters</button></div></section>`;
}
function metrics(rows){const s=summarize(rows);return `<div class="kpi-grid">
 <div class="panel kpi"><span class="kpi-symbol">▦</span><div class="kpi-name">TOTAL COMPLAINTS</div><div class="kpi-val">${num(s.total)}</div><div class="kpi-note">Selected reporting records</div></div>
 <div class="panel kpi"><span class="kpi-symbol gold">◷</span><div class="kpi-name">PENDING</div><div class="kpi-val text-gold">${num(s.pending)}</div><div class="kpi-note">Require follow-up</div></div>
 <div class="panel kpi"><span class="kpi-symbol green">✓</span><div class="kpi-name">RESOLVED</div><div class="kpi-val text-green">${num(s.resolved)}</div><div class="kpi-note">Closed complaints</div></div>
 <div class="panel kpi"><span class="kpi-symbol red">↗</span><div class="kpi-name">RESOLUTION RATE</div><div class="kpi-val">${s.rate}<span class="kpi-unit">%</span></div><div class="kpi-note">Resolved ÷ total</div></div>
 </div>`;}
function compactTable(rows,limit=8){if(!rows.length)return blankState('No matching complaints','Adjust filters or upload a monthly report.',!state.snapshots.length);
 return `<div class="table-scroller complaint-table-scroller"><table class="complaints-table"><thead><tr><th>Outlet / order</th><th>Customer / issue</th><th>Complaint</th><th>Status</th><th><span class="sr-only">Details</span></th></tr></thead><tbody>
 ${rows.slice(0,limit).map(r=>`<tr><td><strong>${esc(r.outlet)}</strong>${orderMeta(r)}</td><td><strong>${esc(r.customerName||'Customer not specified')}</strong><small>${esc(r.lodgedBy||'Lodged by not specified')}</small></td><td><span class="description-preview">${esc(r.description)}</span></td><td>${statusTag(r)}</td><td><button class="row-link" type="button" data-detail="${esc(r.period)}|${esc(r.id)}">View details <span aria-hidden="true">→</span></button></td></tr>`).join('')}
 </tbody></table></div><div class="mobile-cards">${rows.slice(0,limit).map(r=>`<article class="mobile-complaint-card"><div class="mobile-card-top"><div><strong>${esc(r.outlet)}</strong>${orderMeta(r)}</div>${statusTag(r)}</div><div class="mobile-card-name">${esc(r.customerName||'Customer not specified')} <small>· Lodged by ${esc(r.lodgedBy||'Not specified')}</small></div><p>${esc(r.description)}</p><button class="row-link" type="button" data-detail="${esc(r.period)}|${esc(r.id)}">View complaint details →</button></article>`).join('')}</div>`;
}
function miniOutlets(rows){const counts=(state.mode==='cluster'&&state.scope==='morris'?OUTLETS:scopeOutlets()).map(o=>{const s=summarize(rows.filter(r=>r.outlet===o));return {outlet:o,...s};}).sort((a,b)=>b.pending-a.pending||b.total-a.total);
 if(!rows.length)return blankState('No outlet activity','Results will appear when a matching month is saved.',false);
 return `<div class="outlet-bars">${counts.map(r=>`<div class="outlet-bar"><div class="outlet-bar-heading"><strong>${esc(r.outlet)}</strong><span>${r.total} complaint${r.total===1?'':'s'}</span></div><div class="bar-track" role="img" aria-label="${esc(r.outlet)}: ${r.pending} pending and ${r.resolved} resolved"><span class="bar-pending" data-width="${r.total?Math.round(r.pending/r.total*100):0}"></span><span class="bar-resolved" data-width="${r.total?Math.round(r.resolved/r.total*100):0}"></span></div></div>`).join('')}</div><div class="legend"><span><i class="legend-pending"></i> Pending</span><span><i class="legend-resolved"></i> Resolved</span></div>`;
}
function agingMarkup(rows){const pending=rows.filter(r=>r.status==='pending');const categories=[['0–6 days',0,6],['7–13 days',7,13],['14–29 days',14,29],['30+ days',30,100000]];
 return `<div class="aging-grid">${categories.map(([label,min,max])=>`<div class="aging-cell"><strong>${pending.filter(r=>{const age=pendingAge(r.orderDate);return age!==null&&age>=min&&age<=max;}).length}</strong><span>${label}</span></div>`).join('')}</div><p class="subnote">Age is measured from <strong>Order Date</strong> to today, not from the actual complaint filing date. Missing dates are excluded.</p>`;}
function overview(){const rows=monthRecords(),pending=rows.filter(r=>r.status==='pending');const recent=[...rows].sort((a,b)=>(a.status==='pending'?0:1)-(b.status==='pending'?0:1)||(b.orderDate||'').localeCompare(a.orderDate||''));
 return `${header('overview',`<a href="#/reports" class="btn btn-secondary">↧ Download report</a>`)}${!state.snapshots.length?`<div class="welcome-callout"><div><strong>Start with your first monthly report</strong><p>Upload a complaints Excel file. The app will filter to Tharanga and Morris, then build this dashboard automatically.</p></div>${picker('Import Excel →','btn btn-primary')}</div>`:''}${filterPanel()}${metrics(rows)}<div class="content-grid wide-left"><section class="panel section-card"><div class="section-heading"><div><h2>Complaints to review</h2><p>Pending complaints appear first, followed by resolved cases.</p></div><a href="#/complaints" class="subtle-link">View all →</a></div>${compactTable(recent,6)}</section><section class="panel section-card"><div class="section-heading"><div><h2>Outlet performance</h2><p>Pending vs. resolved by outlet</p></div></div>${miniOutlets(rows)}</section></div><div class="content-grid equal"><section class="panel section-card"><div class="section-heading"><div><h2>Pending complaint aging</h2><p>See how long open orders have remained outstanding.</p></div></div>${agingMarkup(rows)}</section><section class="panel section-card"><div class="section-heading"><div><h2>Reporting at a glance</h2><p>Quick links to the tasks that matter most.</p></div></div><div class="quick-links"><a href="#/complaints"><span class="quick-icon">⌕</span><span><strong>Find a complaint</strong><small>Search customer, order and dates</small></span><span>→</span></a><a href="#/trends"><span class="quick-icon">↗</span><span><strong>Compare months</strong><small>Outlet and cluster behavior</small></span><span>→</span></a><a href="#/reports"><span class="quick-icon">▤</span><span><strong>Management PDF</strong><small>Offline, printable reports</small></span><span>→</span></a></div></section></div>`;
}
function complaints(){const rows=visibleRecords(),size=15,totalPages=Math.max(1,Math.ceil(rows.length/size));state.page=Math.min(state.page,totalPages);
 const options=[['all','All details'],['orderDate','Order Date'],['customerName','Customer Name'],['customerContact','Customer Contact Number'],['orderNumber','Order Number'],['description','Complaint Description']];
 const placeholders={all:'Name, contact, order number or complaint…',customerName:'Enter customer name',customerContact:'Enter 07… or +94…',orderNumber:'Enter order number',description:'Search complaint details…'};
 const s=summarize(monthRecords());
 return `${header('complaints',`<button class="btn btn-secondary" id="export-csv" type="button" ${!rows.length?'disabled':''}>↧ Export CSV</button>`)}${filterPanel()}<section class="panel complaints-panel"><div class="complaint-toolbar"><div class="choice-pills" aria-label="Status filter">${[['all','All',s.total],['pending','Pending',s.pending],['resolved','Resolved',s.resolved]].map(([id,label,count])=>`<button class="pill ${state.status===id?'selected':''}" data-status="${id}" aria-pressed="${state.status===id}" type="button">${label} <strong>${count}</strong></button>`).join('')}</div><span class="record-count">${num(rows.length)} matching complaints</span></div>
 <div class="search-row"><label class="field search-select"><span>Search by</span><select class="select" id="search-field">${options.map(([v,l])=>selectOption(v,l,state.searchField)).join('')}</select></label><label class="field search-input"><span>${state.searchField==='orderDate'?'Order date':'Search complaints'}</span><input class="input" id="search-complaints" type="${state.searchField==='orderDate'?'date':'search'}" ${state.searchField==='customerContact'?'inputmode="tel"':''} placeholder="${esc(placeholders[state.searchField]||'Select an order date')}" value="${esc(state.search)}"></label><button id="clear-search" class="btn btn-secondary clear-search" type="button" ${!state.search?'disabled':''}>Clear</button></div>
 ${compactTable(rows.slice((state.page-1)*size,state.page*size),size)}${rows.length?`<div class="pagination"><span>Showing ${num((state.page-1)*size+1)}–${num(Math.min(rows.length,state.page*size))} of ${num(rows.length)}</span><div><button type="button" data-page="-1" ${state.page===1?'disabled':''}>← Previous</button><span class="page-number">${state.page} / ${totalPages}</span><button type="button" data-page="1" ${state.page>=totalPages?'disabled':''}>Next →</button></div></div>`:''}</section>`;
}
function monthMetrics(filtered=false){const seen=new Set();return orderedSnapshots().map(s=>{const rows=scopeRecords((s.records||[]).filter(verifiedRow).map(r=>({...r,period:s.period}))).filter(r=>!filtered||((state.status==='all'||r.status===state.status)&&matchesSearch(r,state.search,state.searchField)));const agg=summarize(rows);let newCount=0;
 for(const r of rows){const identity=r.identity||complaintIdentity(r);if(!seen.has(identity)){seen.add(identity);newCount++;}}
 return {...agg,period:s.period,newCount};});}
function trendsChart(data){if(!data.length)return blankState('Monthly comparisons will appear here','Save reports for at least two different months.',true);
 const max=Math.max(1,...data.map(x=>x.total));return `<div class="chart-scroll"><div class="chart-inner" role="img" aria-label="Monthly complaints stacked into resolved and pending counts">${data.map(m=>`<div class="chart-col"><div class="chart-values">${m.total}</div><div class="chart-bar" data-height="${Math.max(3,m.total/max*180)}"><div class="chart-pending" data-chart-percent="${m.total?Math.round(m.pending/m.total*100):0}"></div></div><span>${esc(m.period.slice(5))}<small>${esc(m.period.slice(0,4))}</small></span></div>`).join('')}</div></div><div class="legend"><span><i class="legend-resolved"></i> Resolved</span><span><i class="legend-pending"></i> Pending</span></div>`;
}
function basicTable(headers,rows,emptyText){if(!rows.length)return blankState('Nothing to show',emptyText,false);
 return `<div class="table-scroller"><table class="simple-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((v,i)=>`<td>${i===0?'<strong>':''}${esc(v)}${i===0?'</strong>':''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function categoryTable(rows){const map=new Map();for(const r of rows){const c=r.category||normalizeCategory(r.complaintType);const key=String(c).toLowerCase().replace(/[^a-z0-9]+/g,'');const v=map.get(key)||{name:c,total:0,pending:0,resolved:0};v.total++;v[r.status]++;map.set(key,v);}return basicTable(['Complaint type','Total','Pending','Resolved'],[...map].sort((a,b)=>b[1].total-a[1].total).map(([,v])=>[v.name,v.total,v.pending,v.resolved]),'The selected month has no complaint categories.');}
function trends(){const data=monthMetrics(),displayPeriod=state.period==='all'?latestPeriod():selectedPeriod(),rows=scopeRecords(allRecords()).filter(r=>r.period===displayPeriod),periodOptions=[['latest','Latest saved month'],...orderedSnapshots().reverse().map(s=>[s.period,monthName(s.period)])];
 return `${header('trends',`<a href="#/reports" class="btn btn-secondary">↧ PDF summary</a>`)}${filterPanel({includeMonth:false})}<section class="panel section-card chart-card"><div class="section-heading"><div><h2>Complaint trends across months</h2><p>Stored month-end snapshots. Comparing both new and open complaints.</p></div><span class="info-chip">${data.length} month${data.length===1?'':'s'}</span></div>${trendsChart(data)}<div class="subnote">The total is the number in each saved month's report. “New unique” is the first appearance of a complaint identity in saved history; earlier months missing from your library may affect this count.</div></section>
 <div class="content-grid equal"><section class="panel section-card"><div class="section-heading"><h2>Month-by-month comparison</h2></div>${basicTable(['Month','Total','New unique','Pending','Closed %'],data.map(r=>[monthName(r.period),r.total,r.newCount,r.pending,r.rate+'%']),'Import monthly reports to compare changes.')}</section>
 <section class="panel section-card"><div class="section-heading"><h2>Outlet performance</h2></div><label class="field trend-month-field"><span>Compare this reporting month</span><select class="select" data-period>${periodOptions.map(([v,l])=>selectOption(v,l,state.period==='all'?'latest':state.period)).join('')}</select></label>${miniOutlets(rows)}</section></div>
 <section class="panel section-card"><div class="section-heading"><div><h2>Complaint category breakdown</h2><p>${esc(monthName(displayPeriod))} · normalized for consistent reporting</p></div><span class="info-chip">Based on complaint records</span></div>${categoryTable(rows)}</section>`;
}
function reports(){const rows=visibleRecords(),s=summarize(rows),months=monthMetrics();return `${header('reports')} ${filterPanel()}<div class="reports-layout"><section class="panel section-card"><div class="section-heading"><div><h2>Choose your report</h2><p>PDFs are generated on this device, with no internet connection required.</p></div></div><label class="field report-status-field"><span>Include complaints with status</span><select class="select" data-status-select>${[['all','All complaints'],['pending','Pending only'],['resolved','Resolved only']].map(([v,l])=>selectOption(v,l,state.status)).join('')}</select></label>${state.search?`<div class="alert notice">An active complaint search is also limiting this report: <strong>${esc(state.search)}</strong>. <button type="button" class="text-button" id="clear-report-search">Clear search</button></div>`:''}<div class="report-types"><label class="report-choice ${state.reportType==='summary'?'checked':''}"><input type="radio" name="report" value="summary" ${state.reportType==='summary'?'checked':''}><span class="report-icon">▥</span><span><strong>Management summary</strong><small>A4 portrait · KPI cards, monthly chart, outlet and category statistics</small></span></label><label class="report-choice ${state.reportType==='detail'?'checked':''}"><input type="radio" name="report" value="detail" ${state.reportType==='detail'?'checked':''}><span class="report-icon">☷</span><span><strong>Detailed complaint report</strong><small>A4 landscape · All selected complaints, descriptions and actions</small></span></label></div><div class="report-options"><label class="check-label"><input type="checkbox" id="include-contacts" ${state.includeContacts?'checked':''}> Include customer contact numbers in the detailed PDF</label><p>Contact numbers are hidden by default to reduce unnecessary sharing of personal data.</p></div><button type="button" id="download-pdf" class="btn btn-primary btn-wide" ${rows.length?'':'disabled'}>↧ Generate & download PDF</button><p class="subnote">The report uses your current period, outlet or cluster, status, channel and search filters. Imported source files stay on your device.</p></section>
 <aside class="panel section-card report-preview"><div class="report-preview-title"><span>REPORT PREVIEW</span><span class="info-chip">${state.reportType==='summary'?'A4 Portrait':'A4 Landscape'}</span></div><div class="paper-preview"><div class="preview-redline"></div><small>PIZZA HUT  /  SRI LANKA</small><h3>${state.reportType==='summary'?'Management summary':'Detailed complaint register'}</h3><p>${esc(scopeName())}</p><hr><div class="preview-metrics"><div><strong>${s.total}</strong><span>Total</span></div><div><strong>${s.resolved}</strong><span>Resolved</span></div><div><strong>${s.pending}</strong><span>Pending</span></div></div><div class="fake-lines"><i></i><i></i><i></i><i></i></div></div><p class="preview-count">${num(rows.length)} complaints selected · ${esc(state.period==='all'?'All saved months':monthName(selectedPeriod()))}</p></aside></div>`;}
function legacyNotice(){return state.snapshots.some(s=>!s.importerVersion||/^2\.[0-3]\./.test(s.importerVersion))?'<div class="alert important" role="status"><strong>Earlier imports need rechecking.</strong> Earlier importers could misread altered headers, miss outlet aliases or include non-register sheets. Back up your history and re-import the original workbook for each earlier month. Saved records have not been deleted or automatically changed.</div>':'';}
function library(){const total=orderedSnapshots().length,last=getPref('ph-last-backup','');const days=last?Math.floor((Date.now()-Date.parse(last))/86400000):null;
 return `${header('library','<a href="#/update" class="btn btn-secondary">Update &amp; repair →</a>')}<div class="content-grid wide-left"><section class="panel section-card upload-panel"><div class="section-heading"><div><h2>Import monthly complaint report</h2><p>Upload an Excel workbook or CSV; select its reporting month before processing.</p></div><span class="info-chip">Version ${VERSION}</span></div><div class="upload-grid"><div><label class="drop-zone" id="dropzone" ><span class="upload-art">⇧</span><strong>${esc(state.selectedFile?.name||'Choose an Excel or CSV file')}</strong><small>${state.selectedFile?`${(state.selectedFile.size/1024/1024).toFixed(1)} MB selected`:'Click to choose, or drag and drop a .xlsx / .csv file'}</small><span class="btn btn-secondary">Browse files</span><input id="excel-file" type="file" data-import-input aria-label="Browse complaint files" accept=".xlsx,.xlsm,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ${state.importing||state.saving?'disabled':''}></label></div><div class="import-controls"><div class="import-period"><label class="field"><span>Reporting month</span><select class="select" id="upload-month" ${state.importing||state.saving?'disabled':''}>${Array.from({length:12},(_,i)=>selectOption(i+1,new Date(Date.UTC(2026,i,1)).toLocaleString('en-GB',{month:'long',timeZone:'UTC'}),state.uploadMonth)).join('')}</select></label><label class="field"><span>Year</span><input class="input" type="number" id="upload-year" min="2000" max="2100" value="${state.uploadYear}" inputmode="numeric" ${state.importing||state.saving?'disabled':''}></label></div><button class="btn btn-primary btn-wide" type="button" id="start-import" ${!state.selectedFile||state.importing||state.saving||state.dbLoading||!!state.dbError?'disabled':''}>${state.importing?'Reading workbook…':'Analyze & review file →'}</button>${state.selectedFile?`<button class="text-button" type="button" id="clear-selected-file" ${state.importing||state.saving?'disabled':''}>Clear selected file</button>`:''}</div></div>
 ${state.importing?`<div class="import-progress" aria-live="polite"><label for="excel-progress">${esc(state.progressLabel||'Reading file…')}</label><progress max="100" value="${state.progress}" id="excel-progress"></progress><small>${state.progress}% · Very large, heavily formatted Excel files may require extra processing.</small></div>`:''}
 ${state.dbLoading?'<div class="alert notice">Opening your saved library. You can choose a file now; analysis will be available once storage is ready.</div>':''}${state.dbError?`<div class="alert error" role="alert">${esc(state.dbError)} <a href="./update.html" class="text-button">Update / repair app</a></div>`:''}${state.importError?`<div class="alert error" role="alert">${esc(state.importError)}</div>`:''}
 ${state.preview?`<div class="import-review" role="status"><div class="section-heading"><div><h2>${num(state.preview.records.length)} complaints ready to save</h2><p>${esc(monthName(state.preview.period))}</p></div></div>

 <div class="review-actions"><button type="button" class="btn btn-primary" id="save-preview" ${state.saving||state.dbLoading||!!state.dbError||!state.preview.records.length?'disabled':''}>✓ Save ${num(state.preview.records.length)} complaints</button><button type="button" class="btn btn-secondary" id="discard-preview" ${state.saving?'disabled':''}>Discard preview</button></div>${!state.preview.records.length?`<p class="alert important">No approved-outlet complaint records were extracted. Your saved data is unchanged. Please check this is the complaint report; if it has valid outlets, report this import failure for investigation.</p>`:''}</div>`:''}</section>
 <aside class="panel section-card library-aside"><div class="section-heading"><h2>How it works</h2></div><div class="steps"><div><span>01</span><p><strong>Select month & file</strong><small>Only outlet names are checked during import.</small></p></div><div><span>02</span><p><strong>Review eligible complaints</strong><small>Historical Area Coach ownership is applied by reporting month.</small></p></div><div><span>03</span><p><strong>Save & analyze</strong><small>Generate reports and compare historical months.</small></p></div></div><div class="aside-note"><strong>Privacy comes first</strong><p>Customer names and phone numbers are kept in this browser's private device storage. GitHub Pages hosts only the app code, not your reports.</p></div></aside></div>
 <div class="content-grid equal"><section class="panel section-card"><div class="section-heading"><div><h2>Saved reporting months</h2><p>${total} month${total===1?'':'s'} in this device's library</p></div></div>${total?`<div class="saved-months">${orderedSnapshots().reverse().map(s=>`<div class="month-entry"><span class="month-symbol">▦</span><div><strong>${esc(monthName(s.period))}</strong><small>${num((s.records||[]).length)} complaints · ${esc(s.fileName||'Imported data')}</small></div><div class="month-actions"><button type="button" class="text-button" data-open-month="${esc(s.period)}">View</button><button type="button" class="text-button danger" data-delete-month="${esc(s.period)}">Delete</button></div></div>`).join('')}</div>`:blankState('No saved reports yet','Your uploaded monthly history will appear here.',false)}</section>
 <section class="panel section-card"><div class="section-heading"><div><h2>Backup & recovery</h2><p>Protect your locally saved complaint history.</p></div></div><div class="backup-card"><div class="backup-badge">${days===null?'No backup recorded':days===0?'Backed up today':`Last backup ${days} day${days===1?'':'s'} ago`}</div><p>Export your full history to a secure JSON file. The file contains customer information; store it somewhere private.</p><div class="backup-actions"><button class="btn btn-primary" id="export-backup" type="button" ${!total?'disabled':''}>↧ Download backup</button><label class="btn btn-secondary restore-button">Restore backup<input class="sr-only" id="backup-file" type="file" accept=".json,application/json"></label></div>${total&&(days===null||days>=7)?'<p class="backup-warning">Backup reminder: seven days have passed, or no backup has been made yet.</p>':''}</div><div class="install-tip"><strong>Install for easier offline access</strong><p>iPhone: Share → Add to Home Screen. Android: browser menu → Install app. The app also works in a regular browser after its first successful load.</p></div></section></div>`;
}
function showDetails(period,id){const r=allRecords().find(x=>x.period===period&&x.id===id);if(!r){alertToast('This complaint is no longer in your library.');return;}
 const previous=document.activeElement,detail=(label,value,full=false)=>`<div class="detail-item ${full?'full':''}"><span>${esc(label)}</span><p>${esc(value||'Not provided')}</p></div>`;
 modal.innerHTML=`<div class="modal-shade"><section class="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-heading"><header class="detail-header"><div><div class="eyebrow">COMPLAINT RECORD</div><h2 id="detail-heading">${esc(r.outlet)} · ${esc(r.orderNumber||'Order unlisted')}</h2><p>${esc(monthName(r.period))} · ${esc(prettyDate(r.orderDate))}</p></div><button type="button" class="close-modal" id="close-modal" aria-label="Close complaint details">×</button></header><div class="detail-content"><div class="detail-status">${statusTag(r)} <span class="info-chip">${esc(r.category||'Uncategorized')}</span>${r.coachUnverified?'<span class="info-chip caution">Coach assigned by outlet only</span>':''}</div><div class="detail-grid">
 ${detail('Area Coach',r.areaCoach)}${detail('Outlet',r.outlet)}${detail('Order Date',prettyDate(r.orderDate))}${detail('Order Number',r.orderNumber)}${detail('Customer Name',r.customerName)}${detail('Customer Contact Number',r.customerContact)}${detail('Complaint Lodged By',r.lodgedBy)}${detail('Reporting Month',monthName(r.period))}${detail('Service Channel',r.serviceChannel)}${detail('Complaint Channel',r.complaintChannel)}${detail('Complaint Type (original)',r.complaintType)}${detail('Complaint Type (normalized)',r.category)}${detail('Complaint Description',r.description,true)}${detail('Outlet Action / Comment',r.action,true)}${detail('Sales Centre Action / Comment',r.salesAction,true)}${detail('Original Sales Centre Closure Status',r.statusRaw)}${detail('Close Complaint? (Yes / No)',r.closedFlag)}${detail('Closure Directive By',r.closureDirective)}${detail('Resolution classification',r.status==='resolved'&&canonicalCoach(r.closureDirective)&&/^\s*(yes|y|true|1)\s*$/i.test(r.closedFlag)?'Resolved by approved manager directive and Yes':'Based on recorded closure fields',true)}${detail('Customer Feedback Status',r.customerFeedback)}${detail('Remarks',r.notes,true)}${detail('Product Details',r.product,true)}</div></div><footer class="detail-footer"><span class="detail-pdf-note">PDF contains customer details. Keep it private.</span><button class="btn btn-primary" type="button" id="download-complaint-pdf">↧ Download PDF</button><button class="btn btn-secondary" type="button" id="close-detail-footer">Close</button></footer></section></div>`;
 document.body.classList.add('modal-open');$('close-modal').focus();const dismiss=()=>{modal.innerHTML='';document.body.classList.remove('modal-open');window.removeEventListener('keydown',keyHandler);previous?.focus?.({preventScroll:true});};
 const keyHandler=e=>{if(e.key==='Escape')dismiss();if(e.key==='Tab'){const nodes=[...modal.querySelectorAll('button:not([disabled])')];if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}}};
 $('download-complaint-pdf').onclick=()=>{try{const blob=generateComplaintPdf({record:r});const safe=String(r.orderNumber||r.id||'record').replace(/[^a-z0-9_-]+/gi,'_').slice(0,50);download(`complaint-${r.period}-${safe}.pdf`,blob,'application/pdf');alertToast('Complaint PDF downloaded. Store customer details securely.');}catch(e){alertToast('Could not create the complaint PDF: '+(e?.message||'Unknown error'));}};
 $('close-modal').onclick=dismiss;$('close-detail-footer').onclick=dismiss;modal.querySelector('.modal-shade').onclick=e=>{if(e.target.classList.contains('modal-shade'))dismiss();};window.addEventListener('keydown',keyHandler);
}
function csvCell(value){let s=String(value??'');if(/^\s*[=+\-@]/.test(s))s="'"+s;return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function download(name,data,type){const blob=data instanceof Blob?data:new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}
function exportCsv(records){const cols=[['Reporting Month','period'],['Area Coach','areaCoach'],['Outlet','outlet'],['Order Date','orderDate'],['Order Number','orderNumber'],['Service Channel','serviceChannel'],['Complaint Channel','complaintChannel'],['Customer Name','customerName'],['Customer Contact Number','customerContact'],['Complaint Lodged By','lodgedBy'],['Complaint Type','complaintType'],['Normalized Category','category'],['Complaint Description','description'],['Current Status','status'],['Source Closure Status','statusRaw'],['Close Complaint','closedFlag'],['Closure Directive By','closureDirective'],['Outlet Action','action'],['Sales Centre Comment','salesAction'],['Customer Feedback','customerFeedback'],['Remarks','notes']];const csv='\ufeff'+[cols.map(([l])=>csvCell(l)).join(','),...records.map(r=>cols.map(([,key])=>csvCell(r[key])).join(','))].join('\r\n');download(`complaints-${state.period}-${new Date().toISOString().slice(0,10)}.csv`,csv,'text/csv;charset=utf-8');}
// The header and every "Import Excel" CTA open a real native file picker.
// Keep a separate picker outside #main-content so rendering never removes it.
function useComplaintFile(file){
 if(state.repairing){alertToast("Finish the app refresh first.");return;}
 if(!file)return;
 if(state.importing||state.saving){alertToast('Finish the current import before choosing another file.');return;}
 const ext=String(file.name||'').toLowerCase().split('.').pop();
 if(!['xlsx','xlsm','csv'].includes(ext)){
  state.selectedFile=null;state.preview=null;state.importError='Please choose an Excel .xlsx/.xlsm workbook or a .csv complaint file.';
 }else if(file.size===0){
  state.selectedFile=null;state.preview=null;state.importError='The chosen file is empty. Please choose a valid complaint workbook.';
 }else if(file.size>512*1024*1024){
  state.selectedFile=null;state.preview=null;state.importError='This file exceeds the 512 MB upload safety limit. Please export a smaller workbook.';
 }else{
  state.selectedFile=file;state.preview=null;state.importError='';state.missingCoachAck=false;const inferred=filenamePeriod(file.name);if(inferred){state.uploadYear=Number(inferred.slice(0,4));state.uploadMonth=Number(inferred.slice(5));}
 }
 state.missingCoachAck=false;state.progress=0;state.page=1;
 if(location.hash!=='#/library')location.hash='#/library';
 render();
 if(state.importError)alertToast(state.importError);
}
function invalidateImportPreview(){
 if(!state.preview)return;
 state.preview=null;state.missingCoachAck=false;
 alertToast('Reporting period changed. Analyze the selected file again before saving.');
}
async function importFile(){if(!state.selectedFile||state.importing||state.saving||state.dbLoading||state.dbError)return;const chosenFile=state.selectedFile;const period=`${state.uploadYear}-${String(state.uploadMonth).padStart(2,'0')}`;if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)||state.uploadYear<2000||state.uploadYear>2100){alertToast('Select a valid reporting year and month.');return;}
 const namedPeriod=filenamePeriod(chosenFile.name);if(namedPeriod&&namedPeriod!==period)alertToast(`Reading under the selected ${monthName(period)} reporting month.`);
 state.importing=true;state.preview=null;state.importError='';state.progress=0;state.progressLabel='Reading workbook';state.missingCoachAck=false;render();
 let worker;try{worker=new Worker('./workbook-2.9.3.js');}catch(e){state.importing=false;state.importError='The workbook reader could not start. Check this browser supports offline files, then refresh and try again.';render();return;}
 let timer;const stop=()=>{clearTimeout(timer);state.importing=false;worker.terminate();render();};const watchdog=()=>{clearTimeout(timer);timer=setTimeout(()=>{state.importError='The workbook reader stopped responding. Try again or export the complaint rows to a smaller file.';stop();},300000);};watchdog();
 worker.onmessage=e=>{const d=e.data||{};if(d.type==='progress'){watchdog();state.progress=d.percent||0;state.progressLabel=d.label||'Reading workbook';const p=$('excel-progress');if(p){p.value=state.progress;const parent=p.parentElement;parent.querySelector('label').textContent=state.progressLabel;parent.querySelector('small').textContent=`${state.progress}% · Very large worksheets may take extra processing.`;}}
 else if(d.type==='complete'){state.preview=d.result;state.preview.fileName=chosenFile.name;state.preview.crossDuplicates=crossMonthDuplicates(d.result.records,state.snapshots.filter(s=>s.period!==period));stop();alertToast(`${num(state.preview.records.length)} complaints ready for review.`);}
 else if(d.type==='error'){state.importError=d.message||'Workbook could not be processed.';stop();}};
 worker.onmessageerror=()=>{state.importError='The workbook reader returned unreadable data. Please try again.';stop();};
 worker.onerror=e=>{e.preventDefault?.();state.importError='The workbook reader could not load or stopped unexpectedly. Check that workbook-2.9.3.js was uploaded, or try a smaller .xlsx or .csv file.';stop();};
 try{worker.postMessage({file:chosenFile,period});}catch(e){state.importError='The selected file could not be passed to the workbook reader. Please try again.';stop();}
}
async function saveReview(){const p=state.preview;if(!p||state.saving||state.importing||state.dbLoading||state.dbError)return;
 
 if(!p.records.length){alertToast('No complaints to save. Existing monthly data has not been changed.');return;}
 if(state.snapshots.some(s=>s.period===p.period)&&!confirm(`Replace the saved ${monthName(p.period)} report? The existing month stays unchanged until you confirm. Create a backup first if needed.`))return;
 state.saving=true;render();try{const snapshot={period:p.period,records:p.records,fileName:p.fileName,savedAt:new Date().toISOString(),stats:p.stats,version:2,importerVersion:VERSION};await saveSnapshot(snapshot);state.snapshots=await listSnapshots();state.preview=null;state.selectedFile=null;state.missingCoachAck=false;state.period=p.period;state.status='all';state.search='';state.searchField='all';state.serviceChannel='all';state.complaintChannel='all';state.page=1;alertToast(`${monthName(p.period)} saved successfully.`);location.hash='#/overview';render();}catch(e){alertToast(e.message||'Unable to save the imported month.');}finally{state.saving=false;render();}
}
async function deleteMonth(period){if(state.saving||state.importing||state.dbLoading||state.dbError||state.repairing)return alertToast('Finish the current operation first.');if(!confirm(`Permanently remove ${monthName(period)} from this device? This cannot be undone without a backup.`))return;state.saving=true;render();try{await removeSnapshot(period);state.snapshots=await listSnapshots();if(state.period===period)state.period='latest';render();alertToast('The month was removed.');}catch(e){alertToast(e.message||'Cannot delete the month.');}finally{state.saving=false;render();}}
async function backup(){const payload={app:'Customer Complaints Hub',schemaVersion:2,exportedAt:new Date().toISOString(),snapshots:orderedSnapshots()};download(`complaints-hub-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(payload),'application/json');savePref('ph-last-backup',new Date().toISOString());render();alertToast('Backup download started. Verify the file was saved securely.');}
async function restore(file){if(!file)return;if(state.saving||state.importing||state.dbLoading||state.dbError||state.repairing)return alertToast('Finish the current operation first.');state.saving=true;render();try{if(file.size>60*1024*1024)throw Error('Backup exceeds the 60 MB safety limit.');const parsed=JSON.parse(await file.text());if(parsed.app!=='Customer Complaints Hub'||![1,2].includes(parsed.schemaVersion)||!Array.isArray(parsed.snapshots))throw Error('This is not a valid complaints backup.');
 // Backups from earlier versions without coach evidence are not silently accepted.
 const excluded=[];const snaps=parsed.snapshots.map(s=>{if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(s.period)||!Array.isArray(s.records))throw Error('The backup has invalid month data.');
  const records=s.records.map(r=>{const outlet=canonicalOutlet(r.outlet);const coach=coachForOutletAtPeriod(outlet,s.period);return {...r,outlet,cluster:coach,sourceAreaCoach:r.sourceAreaCoach??r.areaCoach,areaCoach:coach};}).filter(r=>{const valid=verifiedRecordScope(r)&&['pending','resolved'].includes(r.status);if(!valid)excluded.push(`${s.period} / ${r.outlet||'Unknown'}`);return valid;});return {...s,records,version:2};});
 if(excluded.length)throw Error(`${excluded.length} backup records contain unapproved or unrecognizable outlets or invalid status fields. Reimport these from the source workbook.`);
 
 if(new Set(snaps.map(s=>s.period)).size!==snaps.length)throw Error('The backup contains duplicate reporting months. Restore a valid backup instead.');
 const overrides=snaps.filter(s=>state.snapshots.some(old=>old.period===s.period)).length;
 if(!confirm(`Restore ${snaps.length} reporting months? ${overrides} existing month(s) will be overwritten. Back up your current data first.`))return;
 await saveBatch(snaps);state.snapshots=await listSnapshots();state.period='latest';state.page=1;state.search='';state.status='all';state.serviceChannel='all';state.complaintChannel='all';render();alertToast('Backup restored successfully.');}catch(e){alertToast(e.message||'Could not restore this backup.');}finally{state.saving=false;render();}}
function makePdf(){const rows=visibleRecords();if(!rows.length)return alertToast('No matching complaints to include in this PDF.');try{const label=state.period==='all'?'All saved months':monthName(selectedPeriod());const filters=[`Status: ${state.status==='all'?'All':state.status}`,`Service: ${state.serviceChannel==='all'?'All':state.serviceChannel}`,`Complaint channel: ${state.complaintChannel==='all'?'All':state.complaintChannel}`];if(state.search)filters.push(`Search filter applied (${state.searchField})`);const args={rows,monthly:monthMetrics(true),periodLabel:label,scopeLabel:scopeName(),includeContact:state.includeContacts,filterText:filters.join('  |  ')};const blob=state.reportType==='summary'?generateSummaryPdf(args):generateDetailedPdf(args);download(`complaints-${state.reportType}-${state.period}-${new Date().toISOString().slice(0,10)}.pdf`,blob,'application/pdf');alertToast('PDF created. Use your PDF viewer to print it.');}catch(e){alertToast('Could not generate the PDF: '+e.message);}}
function resetFilters(){state.mode='cluster';state.scope='both';state.period='latest';state.serviceChannel='all';state.complaintChannel='all';state.status='all';state.search='';state.searchField='all';state.page=1;savePref('ph-scope-mode','cluster');savePref('ph-scope','both');render();}
function bind(){main.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;state.scope=state.mode==='cluster'?'both':'all';state.page=1;savePref('ph-scope-mode',state.mode);savePref('ph-scope',state.scope);render();});
 main.querySelectorAll('[data-scope]').forEach(x=>x.onchange=()=>{state.scope=x.value;state.page=1;savePref('ph-scope',state.scope);render();});
 main.querySelectorAll('[data-period]').forEach(x=>x.onchange=()=>{state.period=x.value;state.page=1;render();});
 main.querySelectorAll('[data-channel]').forEach(x=>x.onchange=()=>{state[x.dataset.channel]=x.value;state.page=1;render();});
 main.querySelectorAll('[data-status]').forEach(x=>x.onclick=()=>{state.status=x.dataset.status;state.page=1;render();});
 main.querySelectorAll('[data-status-select]').forEach(x=>x.onchange=()=>{state.status=x.value;render();});
 $('clear-report-search')?.addEventListener('click',()=>{state.search='';render();});
 main.querySelectorAll('[data-detail]').forEach(x=>x.onclick=()=>{const [period,id]=x.dataset.detail.split('|');showDetails(period,id);});
 main.querySelectorAll('[data-page]').forEach(x=>x.onclick=()=>{state.page=Math.max(1,state.page+Number(x.dataset.page));render();});
 main.querySelectorAll('[data-open-month]').forEach(x=>x.onclick=()=>{state.period=x.dataset.openMonth;state.search='';state.status='all';state.serviceChannel='all';state.complaintChannel='all';state.page=1;location.hash='#/complaints';render();});
 main.querySelectorAll('[data-delete-month]').forEach(x=>x.onclick=()=>deleteMonth(x.dataset.deleteMonth));
 $('clear-filters')?.addEventListener('click',resetFilters);
 $('search-field')?.addEventListener('change',e=>{state.searchField=e.target.value;state.search='';state.page=1;render();$('search-complaints')?.focus();});
 const search=$('search-complaints');if(search){const update=()=>{state.search=search.value;state.page=1;const pos=search.type==='date'?null:search.selectionStart;render();const fresh=$('search-complaints');fresh?.focus({preventScroll:true});if(pos!==null)try{fresh.setSelectionRange(pos,pos);}catch{}};search.addEventListener(search.type==='date'?'change':'input',update);}
 $('clear-search')?.addEventListener('click',()=>{state.search='';state.page=1;render();$('search-complaints')?.focus();});
 $('export-csv')?.addEventListener('click',()=>exportCsv(visibleRecords()));
 document.querySelectorAll('input[name="report"]').forEach(x=>x.onchange=()=>{state.reportType=x.value;render();});
 $('include-contacts')?.addEventListener('change',e=>{state.includeContacts=e.target.checked;});
 $('download-pdf')?.addEventListener('click',makePdf);
 $('repair-in-app')?.addEventListener('click',repairInApp);
 $('upload-month')?.addEventListener('change',e=>{state.uploadMonth=Number(e.target.value);invalidateImportPreview();render();});
 $('upload-year')?.addEventListener('change',e=>{state.uploadYear=Number(e.target.value);invalidateImportPreview();render();});

 const drop=$('dropzone');if(drop){drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragging');});drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));drop.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();drop.classList.remove('dragging');useComplaintFile(e.dataTransfer?.files?.[0]);});}
 $('start-import')?.addEventListener('click',importFile);
 
 $('save-preview')?.addEventListener('click',saveReview);
 $('discard-preview')?.addEventListener('click',()=>{if(state.saving)return;state.preview=null;state.missingCoachAck=false;render();});
 $('clear-selected-file')?.addEventListener('click',()=>{if(state.importing||state.saving)return;state.selectedFile=null;state.preview=null;state.importError='';state.missingCoachAck=false;render();});
 $('export-backup')?.addEventListener('click',backup);
 $('backup-file')?.addEventListener('change',e=>{const f=e.target.files?.[0];e.target.value='';restore(f);});
}
function updatePage(){const local=['localhost','127.0.0.1'].includes(location.hostname);const blocked=state.importing||state.saving||!!state.selectedFile||!!state.preview;
 return `${header('update','<a href="#/library" class="btn btn-secondary">← Data library</a>')}<section class="panel section-card update-card"><div class="section-heading"><div><h2>Application version ${VERSION}</h2></div><span class="info-chip">${local?'Local launcher':'Web application'}</span></div><p>${local?'To install a newer version, close the current launcher and open the newer Windows executable. Keep using the same browser and local address.':'Publish the new application files before refreshing the app.'}</p><p>Refresh or repair the application files without deleting your saved complaint history.</p>${blocked?'<p class="alert notice">Finish or discard the selected import before repairing the app.</p>':''}<div class="backup-actions"><button type="button" class="btn btn-primary" id="repair-in-app" ${blocked||state.repairing?'disabled':''}>${state.repairing?'Checking application…':'Refresh / repair app'}</button><a class="btn btn-secondary" href="#/overview">Return to overview</a></div><p class="update-status" id="in-app-repair-status" role="status">${esc(state.repairStatus||'Ready to check the application files.')}</p></section>`;
}
async function repairInApp(){
 if(state.importing||state.saving||state.selectedFile||state.preview||state.repairing)return;
 state.repairing=true;state.repairStatus='Checking application files…';render();
 try{
  const root=new URL('./',location.href),stamp=Date.now();
  const res=await fetch(new URL('index.html?repair='+stamp,root),{cache:'no-store'});if(!res.ok)throw Error('Application files are unavailable. Start the local launcher or reconnect, then retry.');
  const html=await res.text(),version=html.match(/VERSION (\d+\.\d+\.\d+)/)?.[1];if(!version)throw Error('The available application version could not be verified.');
  for(const path of [`startup-${version}.js`,`hub-${version}.js`,`workbook-${version}.js`,`styles-${version}.css`]){const asset=await fetch(new URL(path+'?repair='+stamp,root),{cache:'no-store'});if(!asset.ok||/text\/html/i.test(asset.headers.get('content-type')||''))throw Error('A required application file is missing. Please check the launcher or published files.');}
  if('serviceWorker' in navigator){for(const reg of await navigator.serviceWorker.getRegistrations())if(reg.scope===root.href)await reg.unregister();}
  if('caches' in window){for(const key of await caches.keys())if(/^ph-complaints-v2\.\d+\.\d+$/.test(key)){const cache=await caches.open(key);for(const req of await cache.keys())if(req.url.startsWith(root.href))await cache.delete(req);}}
  state.repairStatus='Application verified. Returning to overview…';render();location.replace(new URL('index.html?refresh='+stamp+'#/overview',root));
 }catch(e){state.repairStatus=e.message||'Unable to refresh the application. Please try again.';state.repairing=false;render();}
}
function renderPage(){const page=(location.hash||'#/overview').split('/')[1]||'overview';state.route=Object.prototype.hasOwnProperty.call(PAGES,page)?page:'overview';if(state.mode==='cluster'&&!['both','morris','tharanga'].includes(state.scope))state.scope='both';if(state.mode==='outlet'&&!['all',...OUTLETS].includes(state.scope))state.scope='all';
 document.title=`${PAGES[state.route][0]} · Customer Complaints Hub`;$('page-crumb').textContent=PAGES[state.route][0];document.querySelectorAll('[data-nav]').forEach(x=>{const active=x.dataset.nav===state.route||(state.route==='update'&&x.dataset.nav==='library');x.classList.toggle('active',active);if(active)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});
 $('global-excel-file').disabled=state.importing||state.saving||state.repairing;
 main.innerHTML=(state.dbError?`<div class="alert error" role="alert"><strong>Saved data is unavailable.</strong> ${esc(state.dbError)} The figures below cannot be used until storage is loaded. <button type="button" class="text-button" id="retry-storage">Retry loading data</button></div>`:state.dbLoading?'<div class="alert notice" role="status">Loading saved complaint history…</div>':'')+legacyNotice()+({overview,complaints,trends,reports,library,update: updatePage})[state.route]();
 main.querySelectorAll('[data-width]').forEach(x=>{x.style.width=Math.min(100,Math.max(0,Number(x.dataset.width)||0))+'%';});
 main.querySelectorAll('[data-height]').forEach(x=>{x.style.height=Math.min(180,Math.max(3,Number(x.dataset.height)||3))+'px';});
 main.querySelectorAll('[data-chart-percent]').forEach(x=>{x.style.height=Math.min(100,Math.max(0,Number(x.dataset.chartPercent)||0))+'%';});
 const pending=allRecords().filter(x=>x.status==='pending').length;$('side-pending').textContent=pending?num(pending):'';bind();
 $('retry-storage')?.addEventListener('click',loadData);
}
function render(){try{renderPage();}catch(e){savePref('ph-last-error',new Date().toISOString()+' render: '+String(e.message||e).slice(0,400));main.innerHTML=`<section class="panel section-card" role="alert"><h1>${esc(PAGES[state.route]?.[0]||'Dashboard')}</h1><p>This section could not open. Your saved reports have not been deleted.</p><p>${esc(e.message||'Unexpected error')}</p><button type="button" id="retry-render" class="btn btn-secondary">Try again</button> <a href="#/library" class="text-button">Data library</a> <a href="#/update" class="text-button">Repair app</a></section>`;$('retry-render')?.addEventListener('click',render);console.error(e);}}
function workerInstall(){if(!('serviceWorker' in navigator)||!window.isSecureContext)return;navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
 const prompt=()=>{$('update-banner').classList.remove('hidden');$('update-now').onclick=()=>{if(state.importing||state.saving||state.preview||state.selectedFile||state.repairing){alertToast('Finish the import or clear the selected file before updating.');return;}reg.waiting?.postMessage({type:'SKIP_WAITING'});};};
 if(reg.waiting)prompt();reg.addEventListener('updatefound',()=>{const installing=reg.installing;installing?.addEventListener('statechange',()=>{if(installing.state==='installed'&&navigator.serviceWorker.controller)prompt();});});
 let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloading&&!state.importing&&!state.saving&&!state.preview&&!state.selectedFile&&!state.repairing){reloading=true;location.reload();}});
 }).catch(()=>{});}
function navigate(hash){if(state.repairing){alertToast('Finish the app refresh first.');return;}if(location.hash!==hash)location.hash=hash;render();window.scrollTo(0,0);}
document.addEventListener('click',e=>{const a=e.target.closest?.('a[href^="#/"]');if(!a||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();navigate(a.getAttribute('href'));});
window.addEventListener('hashchange',()=>{const route=(location.hash||'#/overview').split('/')[1]||'overview';if(route!==state.route){render();window.scrollTo(0,0);}});


for(const type of ['error','unhandledrejection'])window.addEventListener(type,e=>savePref('ph-last-error',`${new Date().toISOString()} ${type}: ${String(e.message||e.reason).slice(0,400)}`));
async function loadData(){state.dbLoading=true;state.dbError='';render();try{state.snapshots=await listSnapshots();requestDurableStorage();}catch(e){state.dbError=`Local storage is unavailable: ${e.message}. Open this app in a normal browser tab and check device storage.`;}finally{state.dbLoading=false;render();}}
async function start(){
 document.addEventListener('hub-file-selected',e=>useComplaintFile(e.detail));
 window.hubReady=true;
 const queued=window.hubPendingFile;window.hubPendingFile=null;
 render();if(queued)useComplaintFile(queued);
 workerInstall();
 // Prevent dropping a file outside the drop zone from replacing this app page.
 window.addEventListener('dragover',e=>{if(Array.from(e.dataTransfer?.types||[]).includes('Files'))e.preventDefault();});
 window.addEventListener('drop',e=>{if(!Array.from(e.dataTransfer?.types||[]).includes('Files'))return;e.preventDefault();if(state.importing){alertToast('Finish the current import first.');return;}useComplaintFile(e.dataTransfer?.files?.[0]);});
 await loadData();}
start().catch(e=>{window.hubReady=false;const msg=$('startup-message');if(msg)msg.textContent='The application could not start. Open Update / repair app below.';else{main.innerHTML='<section class="panel section-card" role="alert"><h1>Dashboard could not start</h1><p>Your saved data has not been deleted.</p><a class="btn btn-primary" href="./update.html">Update / repair app</a></section>';}console.error(e);});

})();
