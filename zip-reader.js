// ZIP file reader using the native streaming decompressor (no CDN, no external JS).
// Supports ordinary XLSX ZIP files up to 4 GiB; encrypted/ZIP64 files are not supported.
const u16=(dv,p)=>dv.getUint16(p,true),u32=(dv,p)=>dv.getUint32(p,true);
const decoder=new TextDecoder();
export async function openZip(blob){
  const tailLen=Math.min(blob.size,65557);
  const end=new DataView(await blob.slice(blob.size-tailLen).arrayBuffer());
  let eocd=-1;
  for(let i=end.byteLength-22;i>=0;i--){if(u32(end,i)===0x06054b50){eocd=i;break;}}
  if(eocd<0)throw Error('This is not a valid .xlsx file. Please select an Excel .xlsx workbook.');
  const count=u16(end,eocd+10),size=u32(end,eocd+12),offset=u32(end,eocd+16);
  if(count===65535 || size===0xffffffff || offset===0xffffffff)throw Error('ZIP64 Excel files are not supported. Save a standard .xlsx copy and retry.');
  if(offset+size>blob.size-tailLen+eocd)throw Error('The Excel ZIP directory has invalid bounds.');
  if(size>20*1024*1024)throw Error('This Excel workbook has unusually large ZIP metadata.');
  const cd=new DataView(await blob.slice(offset,offset+size).arrayBuffer());
  let pos=0;const entries=new Map();
  for(let i=0;i<count;i++){
    if(pos+46>cd.byteLength||u32(cd,pos)!==0x02014b50)throw Error('The Excel ZIP directory could not be read.');
    const method=u16(cd,pos+10),compressed=u32(cd,pos+20),uncompressed=u32(cd,pos+24);
    const flags=u16(cd,pos+8),nameLen=u16(cd,pos+28),extraLen=u16(cd,pos+30),commentLen=u16(cd,pos+32),localOffset=u32(cd,pos+42);
    if(pos+46+nameLen+extraLen+commentLen>cd.byteLength)throw Error('The Excel ZIP directory is incomplete.');
    const name=decoder.decode(new Uint8Array(cd.buffer,cd.byteOffset+pos+46,nameLen));
    if(!(flags&1))entries.set(name,{name,method,compressed,uncompressed,localOffset});
    pos+=46+nameLen+extraLen+commentLen;
  }
  async function entryStream(name){
    const entry=entries.get(name);if(!entry)throw Error(`Missing Excel component: ${name}`);
    if(entry.localOffset+30>blob.size||entry.uncompressed>1024*1024*1024)throw Error('A worksheet is too large or damaged. Save a smaller Excel copy.');
    const head=new DataView(await blob.slice(entry.localOffset,entry.localOffset+30).arrayBuffer());
    if(u32(head,0)!==0x04034b50)throw Error('The Excel file has a damaged ZIP entry.');
    const begin=entry.localOffset+30+u16(head,26)+u16(head,28);
    if(begin+entry.compressed>offset)throw Error('The compressed Excel entry is incomplete.');
    const source=blob.slice(begin,begin+entry.compressed).stream();
    if(entry.method===0)return source;
    if(entry.method!==8)throw Error('This workbook uses an unsupported ZIP compression method.');
    // Native DEFLATE-RAW is fastest. Some Safari/WebKit versions do not support
    // that exact format, so use the locally bundled MIT-licensed pako inflater.
    try{if(typeof DecompressionStream!=='undefined')return source.pipeThrough(new DecompressionStream('deflate-raw'));}catch{}
    await import('./vendor/pako_inflate.min.js?v=2.9.2');
    const inflate=new self.pako.Inflate({raw:true});
    // pako may finish on the last non-empty chunk. Calling push again on an
    // already-ended inflater returns false even for a valid workbook.
    const reader=source.getReader();let chunks=[],bytes=0,finished=false;
    inflate.onData=chunk=>{bytes+=chunk.byteLength;if(bytes>entry.uncompressed)throw Error('Excel entry expanded beyond its declared size.');chunks.push(chunk);};
    return new ReadableStream({
      async pull(controller){try{
        while(!chunks.length&&!finished){const {done,value}=await reader.read();
          if(done){if(!inflate.ended&&!inflate.push(new Uint8Array(0),true))throw Error(inflate.msg||'The Excel file is damaged.');if(!inflate.ended||inflate.err||bytes!==entry.uncompressed)throw Error('The Excel entry could not be fully decompressed.');finished=true;}
          else {if(inflate.ended||!inflate.push(value,false))throw Error(inflate.msg||'The Excel file is damaged.');}
        }
        if(chunks.length)controller.enqueue(chunks.shift());else if(finished)controller.close();
      }catch(e){reader.cancel().catch(()=>{});controller.error(e);}},
      cancel(){reader.cancel().catch(()=>{});}
    });
  }
  async function entryText(name,limit=20*1024*1024){
    const entry=entries.get(name);if(!entry)return '';
    if(entry.uncompressed>limit)throw Error(`The Excel component ${name} is too large to load safely.`);
    const reader=(await entryStream(name)).getReader();let bytes=0;const parts=[];
    for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>limit){await reader.cancel();throw Error('Excel metadata exceeded the safe size limit.');}parts.push(value);}
    const all=new Uint8Array(bytes);let p=0;for(const b of parts){all.set(b,p);p+=b.byteLength;}return decoder.decode(all);
  }
  return {entries,entryStream,entryText};
}
