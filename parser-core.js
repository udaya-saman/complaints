// Pure complaint normalization, suitable for the browser worker and Node tests.
export const OUTLETS=['Akuressa','Aluthgama','Ambalangoda','Embilipitiya','Galle','Karapitiya','Matara','Matara 2','Megalle','Monaragala','Tangalle','Unawatuna','Welipenna A','Welipenna B'];
export const CLUSTERS={tharanga:['Akuressa','Embilipitiya','Matara','Matara 2','Monaragala','Tangalle'],morris:['Aluthgama','Ambalangoda','Galle','Karapitiya','Megalle','Unawatuna','Welipenna A','Welipenna B']};
export const normalized=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const outletMap=new Map(OUTLETS.map(x=>[normalized(x),x]));
for(const alias of ['matara02','matara2','mataraii'])outletMap.set(alias,'Matara 2');
outletMap.set('alutgama','Aluthgama');
export const canonicalOutlet=value=>outletMap.get(normalized(value))||null;
export const clusterOf=outlet=>CLUSTERS.tharanga.includes(outlet)?'Tharanga':CLUSTERS.morris.includes(outlet)?'Morris':null;
// Exact, bounded name matching: never infer a coach from an unrelated or compound name.
export function canonicalCoach(value){let n=normalized(value);n=n.replace(/^(mr|mister|areacoach|ac)/,'').replace(/(areacoach|ac)$/,'');return n==='tharanga'?'Tharanga':n==='morris'?'Morris':null;}
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
export function detectHeaders(row){const entries=Object.entries(row).map(([c,v])=>[c,normalized(v)]).filter(([,v])=>v);const map={};
  for(const [field,aliases] of Object.entries(HEADER_MATCH)){
    let hit=entries.find(([,v])=>aliases.includes(v));
    if(!hit&&field==='description')hit=entries.find(([,v])=>v==='description'||(v.includes('complaint')&&(v.includes('detail')||v.includes('description'))));
    if(!hit&&field==='status')hit=entries.find(([,v])=>v.endsWith('closurestatus'));
    if(!hit&&field==='action')hit=entries.find(([,v])=>v.includes('outlet')&&v.includes('comment'));
    if(hit)map[field]=hit[0];
  }
  // PHSL Master Sheet template has stable anchors even where users overwrite headers.
  const anchors={B:'areacoach',C:'outlet',D:'orderdate',F:'customername',G:'customercontactnumber',H:'ordernumber',I:'servicechannel',J:'complaintchannel',K:'complainttype',P:'salescentrecomment',Q:'complaintlodgedby',T:'commentupdatedby',V:'closuredirectiveby',W:'salescentreclosurestatus',X:'customerfeedbackstatus',Y:'remark',Z:'updatedby'};
  if(Object.entries(anchors).every(([col,label])=>normalized(row[col])===label)){
    // Only use positional recovery when ALL template anchors match; never guess on another layout.
    for(const [field,col] of Object.entries({description:'O',action:'R',closedFlag:'U'}))if(!map[field]||map[field]!==col)map[field]=col;
    // An overwritten R header 'outlet' must not replace the genuine C header.
    map.outlet='C'; map.coach='B';
  }
  return map.outlet&&(map.description||map.type)&&(map.orderDate||map.orderNumber||map.customerName||map.lodgedBy||(map.description&&map.closedFlag&&map.closureDirective))&&Object.keys(map).length>=4?map:null;
}
const pad=n=>String(n).padStart(2,'0');
const validDate=(y,m,d)=>y>1900&&m>=1&&m<=12&&d>=1&&d<=31&&new Date(Date.UTC(y,m-1,d)).getUTCDate()===d;
export function excelDate(value){if(value==null||String(value).trim()==='')return '';const s=String(value).trim();
 if(/^\d{4,5}(?:\.\d+)?$/.test(s)){const n=Number(s);if(n>20000&&n<100000)return new Date(Date.UTC(1899,11,30)+Math.floor(n)*86400000).toISOString().slice(0,10);}
 let m=s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);if(m){const y=+m[1],mo=+m[2],d=+m[3];return validDate(y,mo,d)?`${y}-${pad(mo)}-${pad(d)}`:s;}
 m=s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);if(m){const y=+m[3],mo=+m[2],d=+m[1];return validDate(y,mo,d)?`${y}-${pad(mo)}-${pad(d)}`:s;}return s;
}
const text=v=>String(v??'').trim();
const fnv=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);};
export function classifyStatus(raw,closedFlag,directive=''){
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
export function normalizeCategory(value){const source=text(value).replace(/\s+/g,' ');if(!source)return 'Uncategorized';return CATEGORIES.get(normalized(source))||source;}
// Stable cross-month fingerprint. Order number + outlet + date is primary; fallback uses customer/description.
export function complaintIdentity(r){const key=[r.outlet,normalized(r.orderNumber),r.orderDate];
 if(r.orderNumber&&!/^(na|nil|none|notavailable|unknown|unavailable|unabletotrace|notprovided|noordernumber|0)$/.test(normalized(r.orderNumber)))return fnv([...key,normalized(r.description)].join('|'));
 return fnv([r.outlet,r.orderDate,normalized(r.customerContact)||normalized(r.customerName),normalized(r.description)].join('|'));
}
export function normalizeComplaint(row,map,sourceRow='',period='',{allowMissingCoach=false}={}){
 const pick=key=>{const val=map[key]?text(row[map[key]]):'';return /^(#N\/A|#REF!|#VALUE!|#DIV\/0!|#NAME\?|#NUM!|#NULL!)$/i.test(val)?'':val;};
 const outlet=canonicalOutlet(pick('outlet'));
 if(!outlet)return {ignored:true,reason:pick('outlet')?'unknownOutlet':'blankOutlet',originalOutlet:pick('outlet'),sourceRow:Number(sourceRow)||0};
 const description=pick('description')||pick('type');if(!description)return {ignored:true,reason:'noComplaint',originalOutlet:outlet,sourceRow:Number(sourceRow)||0};
 const expectedCoach=clusterOf(outlet),coachValue=pick('coach');
 if(map.coach){const coach=canonicalCoach(coachValue);
   if(!coach)return {ignored:true,reason:coachValue?'otherCoach':'missingCoachValue',originalCoach:coachValue,originalOutlet:outlet,sourceRow:Number(sourceRow)||0};
   if(coach!==expectedCoach)return {ignored:true,reason:'coachOutletMismatch',originalCoach:coachValue,originalOutlet:outlet,sourceRow:Number(sourceRow)||0};
 }else if(!allowMissingCoach)return {ignored:true,reason:'missingCoachColumn',originalOutlet:outlet,sourceRow:Number(sourceRow)||0};
 const orderDate=excelDate(pick('orderDate')),orderNumber=pick('orderNumber'),customerName=pick('customerName');
 const closedFlag=pick('closedFlag'),closureDirective=pick('closureDirective'),statusRaw=pick('status');
 const r={period,outlet,cluster:expectedCoach,areaCoach:map.coach?canonicalCoach(coachValue):expectedCoach,coachUnverified:!map.coach,
  orderDate,orderNumber,customerName,customerContact:pick('customerContact'),lodgedBy:pick('lodgedBy'),
  description,complaintType:pick('type'),category:normalizeCategory(pick('type')),status:classifyStatus(statusRaw,closedFlag,closureDirective),statusRaw,closedFlag,closureDirective,
  action:pick('action'),salesAction:pick('salesAction'),customerFeedback:pick('feedback'),notes:pick('notes'),
  complaintChannel:pick('channel'),serviceChannel:pick('service'),product:pick('product'),sourceRow:Number(sourceRow)||0};
 r.identity=complaintIdentity(r);r.id=fnv([period,r.identity,normalized(r.description),r.sourceRow].join('|'));return r;
}
// Re-check persisted and restored data, not only workbook input. A crafted or
// outdated backup must never leak an unrelated coach into the approved clusters.
export function verifiedRecordScope(r){
 if(!r||!OUTLETS.includes(r.outlet))return false;
 const coach=clusterOf(r.outlet);
 return r.cluster===coach && r.areaCoach===coach && (r.coachUnverified===true||r.coachUnverified===false||r.coachUnverified==null);
}
export function getScopeOutlets(mode,value){if(mode==='outlet')return value==='all'?OUTLETS:OUTLETS.includes(value)?[value]:[];
 return value==='tharanga'?CLUSTERS.tharanga:value==='morris'?CLUSTERS.morris:OUTLETS;}
export function summarize(rows){const total=rows.length,resolved=rows.filter(r=>r.status==='resolved').length;return {total,resolved,pending:total-resolved,rate:total?Math.round(resolved/total*100):0};}
export function pendingAge(orderDate,reference=new Date()){
 if(!/^\d{4}-\d\d-\d\d$/.test(orderDate||''))return null;
 const time=Date.parse(orderDate+'T00:00:00Z');if(!Number.isFinite(time))return null;
 const now=Date.UTC(reference.getFullYear(),reference.getMonth(),reference.getDate());return Math.max(0,Math.floor((now-time)/86400000));
}
export function crossMonthDuplicates(candidate,snapshots){const seen=new Map();for(const s of snapshots)for(const r of s.records||[]){const key=r.identity||complaintIdentity(r);if(!seen.has(key))seen.set(key,new Set());seen.get(key).add(s.period);}
 return candidate.filter(r=>seen.has(r.identity||complaintIdentity(r))).map(r=>({id:r.id,outlet:r.outlet,orderNumber:r.orderNumber,months:[...seen.get(r.identity||complaintIdentity(r))].sort()}));
}
