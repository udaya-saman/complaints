import {openZip} from './zip-reader.js?v=2.9.1';
import {detectHeaders,normalizeComplaint} from './parser-core.js?v=2.9.1';
const xmlDecode=s=>String(s??'').replace(/&(?:#x([\da-f]+)|#(\d+)|amp|lt|gt|quot|apos);/gi,(full,hex,dec)=>{
  if(hex||dec){const n=parseInt(hex||dec,hex?16:10);return Number.isFinite(n)&&n<=0x10ffff?String.fromCodePoint(n):full;}
  return ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"})[full.toLowerCase()]??full;
});
const attr=(tag,key)=>{const r=new RegExp('(?:^|\\s)'+key+'="([^"]*)"');return tag.match(r)?.[1]||'';};
const sharedValues=xml=>{
  const out=[];const re=/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g;let m;
  while((m=re.exec(xml))){let t='',inner=m[1];const ts=/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;let part;while((part=ts.exec(inner)))t+=xmlDecode(part[1]);out.push(t);}
  return out;
};
export const readCells=(fragment,shared)=>{
  const row={}; const re=/<c\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/c>)/g;let m;
  while((m=re.exec(fragment))){
    const ref=attr(m[1],'r');const col=ref.match(/^[A-Z]+/)?.[0];if(!col)continue;
    const body=m[2]||'';if(!body)continue;
    const inline=attr(m[1],'t')==='inlineStr';
    let raw='';if(inline){for(const hit of body.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g))raw+=xmlDecode(hit[1]);}
    else{const v=body.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/);if(!v)continue;raw=xmlDecode(v[1]);}
    row[col]=attr(m[1],'t')==='s'?(shared[Number(raw)]??''):raw;
  }
  return row;
};
async function parseXmlRows(stream, shared, visit, progress, totalBytes){
  const reader=stream.getReader(),decoder=new TextDecoder();let buffer='',readBytes=0,lastPercent=0,rowsScanned=0;
  while(true){const {value,done}=await reader.read();if(done)break;
    readBytes+=value.byteLength;buffer+=decoder.decode(value,{stream:true});
    // Avoid ever building the inflated worksheet in memory. Consume one row at a time.
    const rowRe=/<row\b[^>]*?\/\s*>|<row\b[^>]*?>[\s\S]*?<\/row>/g;
    let m,lastEnd=0;
    while((m=rowRe.exec(buffer))){lastEnd=rowRe.lastIndex;rowsScanned++;
      const xml=m[0];if(!/<(?:v|is)(?:\s|>)/.test(xml))continue;
      const rowNumber=xml.match(/<row\b[^>]*\br="(\d+)"/)?.[1]||String(rowsScanned);
      visit(readCells(xml,shared),rowNumber);
    }
    if(lastEnd)buffer=buffer.slice(lastEnd);
    else if(buffer.length>2_000_000){ // Retain at most an incomplete row, never the XML prefix.
      const start=buffer.lastIndexOf('<row ');buffer=start>=0?buffer.slice(start):buffer.slice(-100);
      if(buffer.length>2_000_000)throw Error('A worksheet row is too large to process safely.');
    }
    const percent=totalBytes?Math.min(96,Math.floor(readBytes/totalBytes*96)):0;
    if(percent>=lastPercent+3){lastPercent=percent;progress(percent,rowsScanned);}
  }
  if(buffer){const re=/<row\b[^>]*>[\s\S]*?<\/row>/g;for(const m of buffer.matchAll(re)){if(/<(?:v|is)(?:\s|>)/.test(m[0]))visit(readCells(m[0],shared),'');}}
  return rowsScanned;
}
function csvRows(text){
  const rows=[];let row=[],field='',quoted=false;
  text=text.replace(/^\ufeff/,'');
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted && text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);field='';rows.push(row);row=[];}
    else field+=c;
  }
  if(quoted)throw Error('The CSV contains an unfinished quoted field. Export it again and retry.');
  if(field!==''||row.length){row.push(field);rows.push(row);}return rows;
}
// Import is provisional until user confirms the review. Missing coach columns are
// allowed only under an explicitly acknowledged outlet-only import policy.
export function collector(period){
  const seen=new Set(),records=[],reasonCounts={},unknown=new Map(),otherCoaches=new Map(),mismatches=[];
  let headerSheets=0,ignored=0,dateMismatch=0,duplicate=0,missingStatus=0,unverified=0;const sourceSheets=[];const identities=new Set();let possibleDuplicates=0;
  const warnings=[];
  return {
    sheet(mapping,sheetName){headerSheets++;sourceSheets.push(sheetName);},
    add(row,map,sourceRow){
      // Excel formulas fill blank template rows with #N/A; those are not complaints.
      const meaningful=key=>{const v=String(row[map[key]]??'').trim();return v&&!/^#(?:N\/A|REF!|VALUE!|DIV\/0!|NAME\?|NUM!|NULL!)$/i.test(v);};
      if(!['outlet','description','type','customerName','orderNumber'].some(meaningful))return;
      const res=normalizeComplaint(row,map,sourceRow,period);
      if(res.ignored){ignored++;reasonCounts[res.reason]=(reasonCounts[res.reason]||0)+1;
        if(res.reason==='unknownOutlet')unknown.set(res.originalOutlet,(unknown.get(res.originalOutlet)||0)+1);
        return;
      }
      // Exact repeated records are safe to collapse; changed closure/action rows are not silently dropped.
      const {id,sourceRow:source,identity,...fields}=res;const signature=JSON.stringify(fields);
      if(seen.has(signature)){duplicate++;return;}seen.add(signature);
      if(identities.has(res.identity))possibleDuplicates++;identities.add(res.identity);
      if(res.coachUnverified)unverified++;
      if(res.orderDate&&/^\d{4}-\d\d-\d\d$/.test(res.orderDate)&&res.orderDate.slice(0,7)!==period)dateMismatch++;
      if(!res.statusRaw&&!res.closedFlag)missingStatus++;
      records.push(res);
    },
    result(){return {period,records,stats:{found:records.length,ignored,reasonCounts,duplicate,dateMismatch,headerSheets,missingStatus,unverified,sourceSheets,possibleDuplicates,
      missingCoachColumn:false,unknownOutlets:Object.fromEntries(unknown),excludedCoaches:Object.fromEntries(otherCoaches),mismatches,warnings}};}
  };
}
// Locate the real complaint header, not the first occurrence of "Outlet".
const CORE_FIELDS=['description','type','orderDate','orderNumber','customerName','status','closedFlag','action','salesAction','customerContact','lodgedBy'];
function headerEvidence(map){
 if(!map?.outlet)return {strength:0,score:0,fieldCount:0};
 const fields=CORE_FIELDS.filter(k=>!!map[k]);
 const strong=fields.filter(k=>['description','type','orderDate','orderNumber','customerName','status'].includes(k));
 const score=fields.reduce((n,key)=>n+({description:5,type:3,orderNumber:3,orderDate:3,customerName:2,status:2,closedFlag:2,action:2,salesAction:2,customerContact:1,lodgedBy:1}[key]||1),0);
 return {strength:strong.length>=2?3:strong.length===1?2:fields.length?1:0,score,fieldCount:fields.length};
}
function newCandidate(map,sheetName,rowNumber,period){
 const c=collector(period);c.sheet(map,sheetName);
 return {map,c,sheetName,headerRow:Number(rowNumber)||0,rows:0,evidence:headerEvidence(map)};
}
function chooseCandidate(candidates){
 const evaluated=candidates.map(candidate=>({...candidate,result:candidate.c.result()}));
 const usable=evaluated.filter(c=>c.result.records.length>0&&c.evidence.strength>0);
 const qualified=usable.filter(c=>c.evidence.strength>=2);
 const pool=qualified.length?qualified:usable;
 if(!pool.length)return evaluated.sort((a,b)=>b.evidence.strength-a.evidence.strength||b.evidence.score-a.evidence.score)[0]||null;
 return pool.sort((a,b)=>b.evidence.strength-a.evidence.strength||b.result.records.length-a.result.records.length||b.evidence.score-a.evidence.score||a.headerRow-b.headerRow)[0];
}
function captureTableRow(candidates,row,rowNum,period,sheetTitle){
 if(!Object.values(row).some(v=>String(v).trim()))return;
 const map=detectHeaders(row);
 if(map){
  const evidence=headerEvidence(map);
  if(evidence.fieldCount>0){
   const signature=Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).map(([field,col])=>field+':'+col).join('|');
   if(!candidates.some(c=>c.signature===signature)&&candidates.length<24){
    const candidate=newCandidate(map,sheetTitle,rowNum,period);candidate.signature=signature;candidates.push(candidate);
   }
   return;
  }
  return;
 }
 for(const candidate of candidates){
  if(Number(rowNum)>candidate.headerRow){candidate.c.add(row,candidate.map,rowNum);candidate.rows++;}
 }
}
async function readXlsx(file,period){
 postMessage({type:'progress',percent:1,label:'Finding complaint records…'});
 const zip=await openZip(file),shared=sharedValues(await zip.entryText('xl/sharedStrings.xml',120*1024*1024));
 const workbook=await zip.entryText('xl/workbook.xml'),rels=await zip.entryText('xl/_rels/workbook.xml.rels');
 const links=new Map();
 for(const m of rels.matchAll(/<Relationship\b[^>]*>/g)){
  const tag=m[0],target=xmlDecode(attr(tag,'Target'));
  if(attr(tag,'Type').endsWith('/worksheet')&&attr(tag,'TargetMode')!=='External'){
   const raw=target.startsWith('/')?target.slice(1):target.startsWith('xl/')?target:'xl/'+target;
   const parts=[];for(const part of raw.split('/')){if(part==='..')parts.pop();else if(part!=='.'&&part)parts.push(part);}
   links.set(attr(tag,'Id'),parts.join('/'));
  }
 }
 const sheets=[];
 for(const m of workbook.matchAll(/<sheet\b[^>]*>/g)){
  const tag=m[0],path=links.get(attr(tag,'r:id')),entry=zip.entries.get(path);
  if(entry)sheets.push({...entry,title:xmlDecode(attr(tag,'name')),hidden:!!attr(tag,'state')&&attr(tag,'state')!=='visible'});
 }
 if(!sheets.length)throw Error('No readable Excel worksheets were found.');
 const master=x=>/^master\s*sheet(?:\s*\(\d+\))?$/i.test(x.title.trim());
 const summary=x=>/^(data\s*sheet|summary|complaint\s*insights|closure\s*snapshot|pivot\s*table|dashboard)\s*$/i.test(x.title.trim());
 const ordered=[...sheets].sort((a,b)=>{const rank=x=>master(x)?0:!x.hidden&&!summary(x)?1:!x.hidden?2:3;return rank(a)-rank(b);});
 const errors=[];let chosen=null;
 for(let i=0;i<ordered.length;i++){
  const sheet=ordered[i],candidates=[];
  try{
   const stream=await zip.entryStream(sheet.name);
   await parseXmlRows(stream,shared,(row,rowNum)=>captureTableRow(candidates,row,rowNum,period,sheet.title),
    (pct,scanned)=>postMessage({type:'progress',percent:Math.min(96,Math.floor((i+pct/100)/ordered.length*96)),label:`Checking ${sheet.title} · ${scanned.toLocaleString()} rows scanned`}),sheet.uncompressed);
  }catch(e){errors.push(`${sheet.title}: ${String(e?.message||e)}`);continue;}
  const candidate=chooseCandidate(candidates);
  if(!candidate)continue;
  const result=candidate.result,accepted=result.records.length,quality=candidate.evidence.strength;
  if(accepted&&quality){
   if(!chosen||quality>chosen.quality||(quality===chosen.quality&&accepted>chosen.result.records.length))chosen={result,quality,sheetTitle:sheet.title};
  }else if(!chosen){chosen={result,quality,sheetTitle:sheet.title};}
  if(chosen.result.records.length>0&&chosen.quality>=2&&master(sheet)&&!ordered.slice(i+1).some(master))break;
 }
 if(!chosen)throw Error(errors.length?`No usable complaint sheet found. ${errors[0]}`:'No complaint worksheet could be identified. Check that the file contains an Outlet column and complaint records.');
 const result=chosen.result;result.stats.ignoredSheets=sheets.filter(s=>!result.stats.sourceSheets.includes(s.title)).map(s=>s.title);
 if(errors.length)result.stats.warnings.push(...errors);
 return result;
}
async function readCsv(file,period){
 if(file.size>160*1024*1024)throw Error('CSV exceeds the safe text processing size. Please use an Excel .xlsx workbook for very large reports.');
 const rows=csvRows(await file.text()),candidates=[];
 for(let i=0;i<rows.length;i++){
  const o={};rows[i].forEach((v,j)=>{let n=j+1,s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}o[s]=v;});
  captureTableRow(candidates,o,i+1,period,'CSV');
 }
 const chosen=chooseCandidate(candidates);
 if(!chosen)return collector(period).result();
 const result=chosen.result;result.stats.ignoredSheets=[];return result;
}
self.onmessage=async e=>{
  const {file,period}=e.data||{};
  try{
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))throw Error('Choose a valid year and month.');
    if(!(file instanceof Blob))throw Error('Please select a file to import.');
    const ext=String(file.name||'').toLowerCase().split('.').pop();
    if(!['xlsx','xlsm','csv'].includes(ext))throw Error('Choose a .xlsx, .xlsm or .csv complaint file.');
    const result=ext==='csv'?await readCsv(file,period):await readXlsx(file,period);
    if(!result.stats.headerSheets){throw Error('No complaint table was detected. Please check that the file contains an Outlet heading and complaint details.');}
    postMessage({type:'complete',result});
  }catch(err){postMessage({type:'error',message:err instanceof Error?err.message:'The file could not be read.'});}
};
