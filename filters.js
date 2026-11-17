// Local-only report searching and channel filtering. No server requests or telemetry.
export const channelKey=value=>String(value??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');
export function channelOptions(records,field){
  const map=new Map();let missing=false;
  for(const r of records){const v=String(r[field]??'').trim().replace(/\s+/g,' ');
    if(!v){missing=true;continue;}
    const key=channelKey(v);if(!map.has(key))map.set(key,v);
  }
  const values=[...map].sort((a,b)=>a[1].localeCompare(b[1],'en',{sensitivity:'base'})).map(([value,label])=>({value,label}));
  if(missing)values.push({value:'__missing__',label:'Not specified'});
  return values;
}
export function matchesChannels(record,{serviceChannel='all',complaintChannel='all'}={}){
  const check=(value,selected)=>selected==='all'||(selected==='__missing__'?!channelKey(value):channelKey(value)===selected);
  return check(record.serviceChannel,serviceChannel) && check(record.complaintChannel,complaintChannel);
}
export function phoneSearchMatches(contact,query){
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
export function matchesSearch(record,search='',field='all'){
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
