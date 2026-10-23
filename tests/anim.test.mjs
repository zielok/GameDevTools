import {openPage,check,done} from './cdp.mjs';
const SP=process.argv[2], page=process.argv[3]||'anim.html';
const p=await openPage('file://'+SP+'/pages/'+page, SP+'/profile-anim-'+page);
const {ev,errors,dialog}=p;
const NAME='my "seg" <b>bold</b>';
// build a stored ZIP of two 4x4 checkerboard PNG frames in the page, then load it on track 1
await ev(`(async()=>{
  const pngs=[];
  for(let f=0;f<2;f++){const c=document.createElement('canvas');c.width=4;c.height=4;const x=c.getContext('2d');
    for(let i=0;i<4;i++)for(let j=0;j<4;j++){x.fillStyle=((i+j+f)%2)?'#ff0000':'#0000ff';x.fillRect(i,j,1,1);}
    pngs.push(new Uint8Array(await (await new Promise(r=>c.toBlob(r,'image/png'))).arrayBuffer()));}
  const crc=d=>{let c=~0;for(const b of d){c^=b;for(let k=0;k<8;k++)c=c&1?(c>>>1)^0xEDB88320:c>>>1;}return ~c>>>0;};
  const parts=[],cds=[];let off=0;
  pngs.forEach((d,i)=>{const n=new TextEncoder().encode('frame_'+i+'.png');const h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint32(14,crc(d),true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,n.length,true);
    parts.push(new Uint8Array(h.buffer),n,d);const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);
    c.setUint32(16,crc(d),true);c.setUint32(20,d.length,true);c.setUint32(24,d.length,true);c.setUint16(28,n.length,true);c.setUint32(42,off,true);cds.push(new Uint8Array(c.buffer),n);off+=30+n.length+d.length;});
  const cdSize=cds.reduce((s,b)=>s+b.length,0);const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,2,true);e.setUint16(10,2,true);e.setUint32(12,cdSize,true);e.setUint32(16,off,true);
  await loadZipToTrack(new File([...parts,...cds,new Uint8Array(e.buffer)],${JSON.stringify(NAME)}+'.zip'),0);
  return true;})()`);

console.log('Anim Forge — UI');
check('segment loaded with 2 frames', await ev(`state.tracks[0][0]?.frames.length`)===2);
const thumbPx=await ev(`(()=>{const c=document.querySelector('#frames-list canvas');if(!c)return -1;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n;})()`);
check('frame thumbnails are not blank', thumbPx>0, thumbPx);
check('segment label shows the name as text', await ev(`document.querySelector('.seg-block .seg-name').textContent`)===NAME, await ev(`document.querySelector('.seg-block .seg-name').innerHTML`));
check('name field holds the full name', await ev(`document.getElementById('p-name').value`)===NAME, await ev(`document.getElementById('p-name').value`));

console.log('Anim Forge — export');
await ev(`window.__blobs=[];const o=URL.createObjectURL;URL.createObjectURL=b=>{__blobs.push(b);return o(b);};HTMLAnchorElement.prototype.click=function(){};true`);
dialog.accept=false;                                  // user presses Cancel in the scale prompt
await ev(`exportZip()`);
check('Cancel aborts export (no ZIP produced)', await ev(`__blobs.length`)===0, await ev(`__blobs.length`)+' blob(s)');
check('no modal left open', !await ev(`document.getElementById('modal-overlay').classList.contains('open')`));
dialog.accept=true; dialog.promptText='4';
await ev(`exportZip()`);
const res=await ev(`(async()=>{const b=__blobs[__blobs.length-1];if(!b)return null;const files=await parseZip(await b.arrayBuffer());
  const name=Object.keys(files).sort()[0];const img=await loadPNG(files[name]);const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
  const x=c.getContext('2d');x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let mixed=0;
  for(let i=0;i<d.length;i+=4){const pure=(d[i]===255&&d[i+2]===0)||(d[i]===0&&d[i+2]===255);if(!pure||d[i+1]!==0)mixed++;}
  return {w:img.width,h:img.height,mixed,count:Object.keys(files).length};})()`);
check('scale 4 export is 16x16 with 2 frames', res&&res.w===16&&res.h===16&&res.count===2, JSON.stringify(res));
check('scaled export has no blended pixels', res&&res.mixed===0, res&&res.mixed+' blended px');
check('no page exceptions', errors.length===0, errors.join(' | '));
p.close(); done();
