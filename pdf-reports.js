// Dependency-free, fully offline PDF writer. Vector charts, selectable English text,
// explicit page breaks, no third-party services or PDF rendering APIs required.
import {summarize,OUTLETS,pendingAge,normalizeCategory} from './parser-core.js?v=2.5.0';
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
export function generateSummaryPdf({rows=[],monthly=[],periodLabel='All saved months',scopeLabel='Both clusters',includeContact=false,referenceDate=new Date(),filterText=''}={}){
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
export function generateDetailedPdf({rows=[],periodLabel='All saved months',scopeLabel='Both clusters',includeContact=false,filterText=''}={}){
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
