import {openPage,check,done} from './cdp.mjs';
const W=process.argv[2];
const move=(send,x,y,buttons)=>send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y,button:buttons?'left':'none',buttons});

{ console.log('Anim Mesh Forge — release outside the canvas');
  const p=await openPage('file://'+W+'/pages/mesh.html', W+'/profile-drag-mesh');
  const {ev,mouse,send,errors}=p;
  await ev(`new Promise(res=>{const c=document.createElement('canvas');c.width=16;c.height=16;c.getContext('2d').fillRect(0,0,16,16);
    c.toBlob(b=>{loadImage(new File([b],'t.png',{type:'image/png'}));setTimeout(()=>res(true),400);});})`);
  await ev(`autoMeshGrid();setMode('select');true`);
  const [x,y]=await ev(`(()=>{const r=canvas.getBoundingClientRect();const c=spriteToCanvas(verts[6].x,verts[6].y);return [r.left+c.x,r.top+c.y]})()`);
  const [tx,ty]=await ev(`(()=>{const r=document.getElementById('tlCanvas').getBoundingClientRect();return [r.left+20,r.top+20]})()`);
  await mouse('mousePressed',x,y); await move(send,tx,ty,1); await mouse('mouseReleased',tx,ty);
  check('drag ended by release over the timeline', !await ev(`dragging`));
  const v=await ev(`verts[6].x`);
  await move(send,x+100,y,0);
  check('vertex does not follow the cursor afterwards', await ev(`verts[6].x`)===v);
  check('no page exceptions', errors.length===0, errors.join(' | '));
  p.close(); }

{ console.log('Bone Forge — release outside the viewport / timeline');
  const p=await openPage('file://'+W+'/pages/bone.html', W+'/profile-drag-bone');
  const {ev,mouse,send,errors}=p;
  await ev(`addBone(null);addBone(S.bones[0].id);S.mode='ik';setModeBtns();renderVP();true`);
  const [x,y]=await ev(`(()=>{const r=vpC.getBoundingClientRect();const t=boneTip(S.bones[1],0);const s=w2s(t.x,t.y);return [r.left+s.sx,r.top+s.sy]})()`);
  const [ox,oy]=await ev(`(()=>{const r=document.getElementById('bone-tree').getBoundingClientRect();return [r.left+10,r.top+10]})()`);
  await mouse('mousePressed',x,y); await move(send,ox,oy,1); await mouse('mouseReleased',ox,oy);
  check('IK drag ended by release over the bone tree', !await ev(`S.ikDrag`));
  const a=await ev(`S.bones[0].angle`);
  await move(send,x+80,y+80,0);
  check('bones do not follow the cursor afterwards', await ev(`S.bones[0].angle`)===a);

  // timeline: drag a key right, back to the start, release outside
  await ev(`const an={id:uid(),name:'a',frameCount:24,loop:true,keyframes:[{frame:0,boneId:S.bones[0].id,angle:0,x:0,y:0}]};S.anims.push(an);S.anim=an;S.frame=0;renderTL();undoStack.length=0;updateUndoButtons();true`);
  const [kx,ky]=await ev(`(()=>{const r=tlC.getBoundingClientRect();return [r.left+S.tlZoom/2,r.top+22+11]})()`);
  const z=await ev(`S.tlZoom`);
  await mouse('mousePressed',kx,ky); await move(send,kx+5*z,ky,1);
  check('key follows the drag (frame 5)', await ev(`S.anim.keyframes[0].frame`)===5);
  await move(send,kx,ky,1);
  check('moving back to the start puts the key back at 0', await ev(`S.anim.keyframes[0].frame`)===0);
  await move(send,ox,oy,1); await mouse('mouseReleased',ox,oy);
  check('timeline drag ended by release outside', !await ev(`S.tlDrag`));
  check('no net change leaves no undo step', await ev(`undoStack.length`)===0, await ev(`undoStack.length`));
  check('no page exceptions', errors.length===0, errors.join(' | '));
  p.close(); }
done();
