import {openPage,check,done} from './cdp.mjs';
import {writeFileSync} from 'node:fs';
import {execSync} from 'node:child_process';
const SP=process.argv[2], page=process.argv[3]||'sprite.html';
const p=await openPage('file://'+SP+'/pages/'+page, SP+'/profile-sprite-'+page, {offline:true});
const {ev,errors}=p;
console.log('Sprite Forge — offline ('+page+')');
// DEFLATE zip built in the page: a/f1.png, b/f1.png (duplicate name), f2.png, __MACOSX junk, a folder entry
await ev(`(async()=>{
  const png=async(seed)=>{const c=document.createElement('canvas');c.width=12;c.height=12;const x=c.getContext('2d');
    for(let i=0;i<12;i++)for(let j=0;j<12;j++){x.fillStyle='rgb('+((i*20+seed*40)%256)+','+(j*20)+','+(seed*60)+')';x.fillRect(i,j,1,1);}
    return new Uint8Array(await (await new Promise(r=>c.toBlob(r,'image/png'))).arrayBuffer());};
  const deflate=async d=>new Uint8Array(await new Response(new Blob([d]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
  const crc=d=>{let c=~0;for(const b of d){c^=b;for(let k=0;k<8;k++)c=c&1?(c>>>1)^0xEDB88320:c>>>1;}return ~c>>>0;};
  const items=[['a/',new Uint8Array(0)],['a/f1.png',await png(1)],['b/f1.png',await png(2)],['f2.png',await png(3)],['__MACOSX/._f2.png',new Uint8Array([1,2,3])]];
  const parts=[],cds=[];let off=0;
  for(const [name,raw] of items){const n=new TextEncoder().encode(name);const comp=raw.length?await deflate(raw):raw;const m=raw.length?8:0;
    const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(8,m,true);h.setUint32(14,crc(raw),true);h.setUint32(18,comp.length,true);h.setUint32(22,raw.length,true);h.setUint16(26,n.length,true);
    parts.push(new Uint8Array(h.buffer),n,comp);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(10,m,true);c.setUint32(16,crc(raw),true);c.setUint32(20,comp.length,true);c.setUint32(24,raw.length,true);c.setUint16(28,n.length,true);c.setUint32(42,off,true);
    cds.push(new Uint8Array(c.buffer),n);off+=30+n.length+comp.length;}
  const cd=cds.reduce((s,b)=>s+b.length,0);const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,items.length,true);e.setUint16(10,items.length,true);e.setUint32(12,cd,true);e.setUint32(16,off,true);
  const file=new File([...parts,...cds,new Uint8Array(e.buffer)],'frames.zip',{type:'application/zip'});
  const dt=new DataTransfer();dt.items.add(file);const inp=document.getElementById('fileInput');inp.files=dt.files;inp.dispatchEvent(new Event('change'));
  await new Promise(r=>setTimeout(r,800));return true;})()`);
const st=await ev(`document.getElementById('loadStatus').textContent`);
check('deflate ZIP loaded offline: 3 frames', /Loaded 3 frames/.test(st), st.split('\n')[0]);

// process with progress
await ev(`window.__st=[];new MutationObserver(()=>__st.push(document.getElementById('loadStatus').textContent)).observe(document.getElementById('loadStatus'),{childList:true,characterData:true,subtree:true});
  document.getElementById('relaxationOn').checked=true;document.getElementById('processBtn').click();true`);
for(let i=0;i<100 && !/Done\./.test(await ev(`document.getElementById('loadStatus').textContent`));i++) await new Promise(r=>setTimeout(r,100));
const seen=await ev(`__st.filter(s=>/Processing frame \\d+ \\/ 3/.test(s)).length`);
check('processing finished', /Done\. Processed 3 frames/.test(await ev(`document.getElementById('loadStatus').textContent`)));
check('per-frame progress shown', seen>=3, seen);

// save ZIP and verify with the system unzip
await ev(`window.__blobs=[];const o=URL.createObjectURL;URL.createObjectURL=b=>{__blobs.push(b);return o(b);};HTMLAnchorElement.prototype.click=function(){};
  document.getElementById('saveZipBtn').click();true`);
await new Promise(r=>setTimeout(r,1500));
const b64=await ev(`(async()=>{const b=__blobs.find(b=>b.type==='application/zip');if(!b)return null;const u=new Uint8Array(await b.arrayBuffer());let s='';for(const x of u)s+=String.fromCharCode(x);return btoa(s);})()`);
check('ZIP produced', !!b64, await ev(`document.getElementById('downloadArea').textContent`));
if(b64){
  const out=SP+'/sprite-out.zip'; writeFileSync(out, Buffer.from(b64,'base64'));
  let t=''; try{ t=execSync(`unzip -t "${out}"`).toString(); }catch(e){ t=e.stdout?.toString()||String(e); }
  check('unzip -t: no errors', /No errors detected/.test(t), t);
  const list=execSync(`unzip -Z1 "${out}"`).toString().trim().split('\n').sort().join(',');
  check('duplicate names kept (f1.png, f1_2.png, f2.png)', list==='f1.png,f1_2.png,f2.png', list);
}
check('no page exceptions', errors.length===0, errors.join(' | '));
p.close(); done();
