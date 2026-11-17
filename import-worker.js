import {openZip} from './zip-reader.js?v=2.5.0';
import {detectHeaders,normalizeComplaint} from './parser-core.js?v=2.5.0';
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
    sheet(mapping,sheetName){headerSheets++;sourceSheets.push(sheetName);if(!mapping.coach)warnings.push(`${sheetName}: no Area Coach column. Outlet-only rows require explicit confirmation.`);},
    add(row,map,sourceRow){
      // Excel formulas fill blank template rows with #N/A; those are not complaints.
      const meaningful=key=>{const v=String(row[map[key]]??'').trim();return v&&!/^#(?:N\/A|REF!|VALUE!|DIV\/0!|NAME\?|NUM!|NULL!)$/i.test(v);};
      if(!['outlet','description','type','customerName','orderNumber'].some(meaningful))return;
      const res=normalizeComplaint(row,map,sourceRow,period,{allowMissingCoach:true});
      if(res.ignored){ignored++;reasonCounts[res.reason]=(reasonCounts[res.reason]||0)+1;
        if(res.reason==='unknownOutlet')unknown.set(res.originalOutlet,(unknown.get(res.originalOutlet)||0)+1);
        if(res.reason==='otherCoach')otherCoaches.set(res.originalCoach,(otherCoaches.get(res.originalCoach)||0)+1);
        if(res.reason==='coachOutletMismatch' && mismatches.length<12)mismatches.push({row:res.sourceRow,outlet:res.originalOutlet,coach:res.originalCoach});
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
      missingCoachColumn:unverified>0||warnings.length>0,unknownOutlets:Object.fromEntries(unknown),excludedCoaches:Object.fromEntries(otherCoaches),mismatches,warnings}};}
  };
}
async function readXlsx(file,period){
  postMessage({type:'progress',percent:1,label:'Reading workbook…'});
  const zip=await openZip(file);const shared=sharedValues(await zip.entryText('xl/sharedStrings.xml',120*1024*1024));
  // Resolve real worksheet names/paths via workbook relationships, not ZIP entry order.
  const workbook=await zip.entryText('xl/workbook.xml'),rels=await zip.entryText('xl/_rels/workbook.xml.rels');
  const links=new Map();for(const m of rels.matchAll(/<Relationship\b[^>]*>/g)){const tag=m[0],target=xmlDecode(attr(tag,'Target'));if(attr(tag,'Type').endsWith('/worksheet')&&attr(tag,'TargetMode')!=='External')links.set(attr(tag,'Id'),target.startsWith('/')?target.slice(1):'xl/'+target);}
  const sheets=[];for(const m of workbook.matchAll(/<sheet\b[^>]*>/g)){const tag=m[0],path=links.get(attr(tag,'r:id')),entry=zip.entries.get(path);if(entry)sheets.push({...entry,title:xmlDecode(attr(tag,'name')),hidden:!!attr(tag,'state')&&attr(tag,'state')!=='visible'});}
  if(!sheets.length)throw Error('No Excel worksheets were found.');
  const masters=sheets.filter(x=>/^master\s*sheet(?:\s*\(\d+\))?$/i.test(x.title.trim()));
  if(masters.length>1)throw Error('Multiple Master Sheet tabs were found. Keep only the intended complaint Master Sheet and retry.');
  const worksheets=masters.length?masters:sheets.filter(x=>!x.hidden&&!/^(data\s*sheet|summary|complaint\s*insights|closure\s*snapshot)\s*$/i.test(x.title.trim()));
  const c=collector(period),ignoredSheets=sheets.filter(s=>!worksheets.includes(s)).map(s=>s.title);
  for(let i=0;i<worksheets.length;i++){
    const sheet=worksheets[i];let mapping=null;
    const stream=await zip.entryStream(sheet.name);
    await parseXmlRows(stream,shared,(row,rowNum)=>{
      if(!mapping){mapping=detectHeaders(row);if(mapping){c.sheet(mapping,sheet.title);return;}}
      else if(Object.values(row).some(v=>String(v).trim())){if(detectHeaders(row))return;c.add(row,mapping,rowNum);}
    },(pct,scanned)=>postMessage({type:'progress',percent:Math.min(96,Math.floor((i+pct/100)/worksheets.length*95)),label:`Reading ${sheet.title} · ${scanned.toLocaleString()} rows scanned`}),sheet.uncompressed);
    if(!mapping)ignoredSheets.push(sheet.title);
  }
  const result=c.result();result.stats.ignoredSheets=ignoredSheets;return result;
}
async function readCsv(file,period){
  if(file.size>40*1024*1024)throw Error('Large CSV files are not supported. Please split the file into smaller months.');
  const rows=csvRows(await file.text());const c=collector(period);let map=null;
  rows.forEach((arr,i)=>{const o={};arr.forEach((v,j)=>{let n=j+1,s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}o[s]=v;});if(!map){map=detectHeaders(o);if(map)return;}else if(arr.some(v=>String(v).trim()))c.add(o,map,i+1);});
  if(map)c.sheet(map,'CSV');const result=c.result();result.stats.ignoredSheets=map?[]:['CSV'];return result;
}
self.onmessage=async e=>{
  const {file,period}=e.data||{};
  try{
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))throw Error('Choose a valid year and month.');
    if(!(file instanceof Blob))throw Error('Please select a file to import.');
    const ext=String(file.name||'').toLowerCase().split('.').pop();
    if(!['xlsx','csv'].includes(ext))throw Error('Please upload an .xlsx or .csv file.');
    const result=ext==='csv'?await readCsv(file,period):await readXlsx(file,period);
    if(!result.stats.headerSheets){throw Error('No individual complaint columns were found. This importer needs an Outlet plus Complaint Description or Complaint Type. The 5% summary workbook is a reporting reference, not a complaint register.');}
    postMessage({type:'complete',result});
  }catch(err){postMessage({type:'error',message:err instanceof Error?err.message:'The file could not be read.'});}
};
