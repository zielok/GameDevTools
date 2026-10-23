import {openPage,check,done} from './cdp.mjs';
const W=process.argv[2];
const p=await openPage('file://'+W+'/pages/mesh.html', W+'/profile-mesh-bounds');
const {ev,drag,errors}=p;
await ev(`new Promise(res=>{const c=document.createElement('canvas');c.width=16;c.height=16;const x=c.getContext('2d');
  for(let i=0;i<16;i++)for(let j=0;j<16;j++){x.fillStyle='rgb('+(i*16)+','+(j*16)+',90)';x.fillRect(i,j,1,1);}
  c.toBlob(b=>{loadImage(new File([b],'t.png',{type:'image/png'}));setTimeout(()=>res(true),400);});})`);
// grid 4x4 → right edge = vertices with x==16; at frame 10 stretch them +8 px
await ev(`document.getElementById('grid-cols').value=4;document.getElementById('grid-rows').value=4;autoMeshGrid();
  setMode('deform');goToFrame(0);addKeyframe();goToFrame(10);verts.forEach(v=>{if(v.ox===16)v.x+=8;});addKeyframe();true`);
await ev(`document.getElementById('inp-total').value=11;setTotalFrames(11);true`);

console.log('Anim Mesh Forge — deformation beyond the sprite');
await ev(`goToFrame(10);render();true`);
check('preview buffer grows to the pose (24×16)', await ev(`_dstCanvas.width===24&&_dstCanvas.height===16`), await ev(`_dstCanvas.width+'x'+_dstCanvas.height`));
check('stretched part is drawn past the sprite edge', await ev(`_dstCtx.getImageData(22,8,1,1).data[3]`)===255);

// mouse: drag a right-edge vertex further out in Deform mode
const idx=await ev(`verts.findIndex(v=>v.ox===16&&v.oy===8)`);
const [x,y]=await ev(`(()=>{const r=canvas.getBoundingClientRect();const c=spriteToCanvas(verts[${idx}].x,verts[${idx}].y);return [r.left+c.x,r.top+c.y]})()`);
const sc=await ev(`viewScale`);
await drag(x,y,x+4*sc,y,6);
check('deform drag is not clamped to the sprite (x > 24)', await ev(`verts[${idx}].x`)>27, await ev(`verts[${idx}].x`));
await ev(`undo();setMode('select');goToFrame(0);true`);
const [x2,y2]=await ev(`(()=>{const r=canvas.getBoundingClientRect();const c=spriteToCanvas(verts[${idx}].x,verts[${idx}].y);return [r.left+c.x,r.top+c.y]})()`);
await drag(x2,y2,x2+6*sc,y2,6);
check('Select mode keeps the rest pose inside the sprite', await ev(`verts[${idx}].ox`)<=16);
await ev(`undo();true`);

// export helper: run the export and unpack the stored ZIP
await ev(`window.__frames=async()=>{await runExport();const u=new Uint8Array(exportZIPBuffer),dv=new DataView(u.buffer);let p=0;const out=[];
  while(dv.getUint32(p,true)===0x04034b50){const sz=dv.getUint32(p+18,true),nl=dv.getUint16(p+26,true);
    const img=await createImageBitmap(new Blob([u.slice(p+30+nl,p+30+nl+sz)],{type:'image/png'}));
    const c=new OffscreenCanvas(img.width,img.height),x=c.getContext('2d');x.drawImage(img,0,0);out.push({w:img.width,h:img.height,d:x.getImageData(0,0,img.width,img.height).data});p+=30+nl+sz;}
  return out;};true`);
const fit=await ev(`(async()=>{document.getElementById('sel-bounds').value='fit';const f=await __frames();
  const a=(fr,x,y)=>fr.d[(y*fr.w+x)*4+3];const src=_getSrcPixels();
  let same=true;for(let y=0;y<16;y++)for(let x=0;x<16;x++){const i=(y*24+x)*4,j=(y*16+x)*4;if(f[0].d[i]!==src[j]||f[0].d[i+3]!==src[j+3])same=false;}
  return {n:f.length,sizes:[...new Set(f.map(fr=>fr.w+'x'+fr.h))],stretched:a(f[10],22,8),frame0Right:a(f[0],20,8),same};})()`);
check('Fit animation: every frame 24×16', fit.sizes.length===1&&fit.sizes[0]==='24x16', JSON.stringify(fit.sizes));
check('Fit animation: stretched pixels kept in the last frame', fit.stretched===255);
check('Fit animation: frame 0 = original sprite + transparent margin', fit.same && fit.frame0Right===0);
const crop=await ev(`(async()=>{document.getElementById('sel-bounds').value='sprite';const f=await __frames();return [...new Set(f.map(fr=>fr.w+'x'+fr.h))];})()`);
check('Sprite size: frames cropped to 16×16', crop.length===1&&crop[0]==='16x16', JSON.stringify(crop));
await ev(`goToFrame(10);verts.forEach(v=>{if(v.ox===16)v.x-=8;});addKeyframe();true`);
const inside=await ev(`(async()=>{document.getElementById('sel-bounds').value='fit';const f=await __frames();return [...new Set(f.map(fr=>fr.w+'x'+fr.h))];})()`);
check('Fit animation with poses inside the sprite: unchanged 16×16', inside.length===1&&inside[0]==='16x16', JSON.stringify(inside));
check('no page exceptions', errors.length===0, errors.join(' | '));
p.close(); done();
