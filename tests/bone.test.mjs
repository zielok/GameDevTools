import {openPage,check,done} from './cdp.mjs';
const SP=process.argv[2], page=process.argv[3]||'bone.html';
const p=await openPage('file://'+SP+'/pages/'+page, SP+'/profile-bone-'+page);
const {ev,drag,send,errors}=p;
const scr=expr=>ev(`(()=>{const r=vpC.getBoundingClientRect();const w=${expr};const s=w2s(w.x,w.y);return [r.left+s.sx,r.top+s.sy]})()`);
await ev(`addBone(null);const a={id:uid(),name:'walk',frameCount:24,loop:true,keyframes:[]};S.anims.push(a);S.anim=a;S.frame=0;
  addBone(S.bones[0].id);S.selBone=S.bones[0].id;S.mode='sel';setModeBtns();renderVP();undoStack.length=0;updateUndoButtons();true`);

console.log('Bone Forge — one undo step per gesture');
const a0=await ev(`interpBone(S.bones[0].id,0).angle`);
const tip=await scr(`boneTip(S.bones[0],0)`);
await drag(tip[0],tip[1],tip[0]-10,tip[1]+60,30);
const a1=await ev(`interpBone(S.bones[0].id,0).angle`);
check('tip drag rotated the bone', Math.abs(a1-a0)>10, a0+' -> '+a1);
check('tip drag = exactly 1 undo step', await ev(`undoStack.length`)===1, await ev(`undoStack.length`));
await ev(`undo();true`);
check('undo restores the original angle', Math.abs(await ev(`interpBone(S.bones[0].id,0).angle`)-a0)<1e-6);

await ev(`S.mode='ik';setModeBtns();true`);
const ctip=await scr(`boneTip(S.bones[1],0)`);
const n0=await ev(`undoStack.length`);
await drag(ctip[0],ctip[1],ctip[0]+30,ctip[1]+40,30);
check('IK drag = exactly 1 undo step', await ev(`undoStack.length`)===n0+1, (await ev(`undoStack.length`))-n0);

await ev(`S.mode='sel';setModeBtns();S.selBone=S.bones[0].id;renderProps();true`);
const n1=await ev(`undoStack.length`);
await ev(`(()=>{const el=document.getElementById('p-a');el.focus();for(const v of ['1','12','123']){el.value=v;el.dispatchEvent(new Event('input'));}el.blur();})();true`);
check('typing 3 chars in Angle = 1 undo step', await ev(`undoStack.length`)===n1+1, (await ev(`undoStack.length`))-n1);

console.log('Bone Forge — timeline key drag');
await ev(`renderTL();true`);
const kf0=await ev(`S.anim.keyframes.filter(k=>k.boneId===S.bones[0].id).map(k=>k.frame).join()`);
const [tx,ty]=await ev(`(()=>{const r=tlC.getBoundingClientRect();const kf=S.anim.keyframes.find(k=>k.boneId===S.bones[0].id&&k.frame===0);
  return [r.left+kf.frame*S.tlZoom+S.tlZoom/2, r.top+22+0*22+11]})()`);
const n2=await ev(`undoStack.length`);
await drag(tx,ty,tx+5*await ev(`S.tlZoom`),ty,10);
check('key moved 0 -> 5', await ev(`S.anim.keyframes.some(k=>k.boneId===S.bones[0].id&&k.frame===5)`), kf0);
check('key drag = 1 undo step', await ev(`undoStack.length`)===n2+1);
await ev(`undo();true`);
check('undo puts key back at frame 0', await ev(`S.anim.keyframes.some(k=>k.boneId===S.bones[0].id&&k.frame===0)&&!S.anim.keyframes.some(k=>k.boneId===S.bones[0].id&&k.frame===5)`));

console.log('Bone Forge — Length field');
await ev(`S.selBone=S.bones[0].id;renderProps();true`);
const before=await ev(`(()=>{const b=S.bones[0];return {dir:Math.atan2(b.tipDY,b.tipDX), child:boneWT(S.bones[1],S.frame)}})()`);
await ev(`(()=>{const el=document.getElementById('p-ln');el.focus();el.value='80';el.dispatchEvent(new Event('input'));el.blur();})();true`);
const after=await ev(`(()=>{const b=S.bones[0];return {len:Math.hypot(b.tipDX,b.tipDY),dir:Math.atan2(b.tipDY,b.tipDX), child:boneWT(S.bones[1],S.frame)}})()`);
check('Length=80 sets tip offset to 80px', Math.abs(after.len-80)<1e-6, after.len);
check('tip direction preserved', Math.abs(after.dir-before.dir)<1e-9);
check('child bone follows the new tip', Math.hypot(after.child.wx-before.child.wx, after.child.wy-before.child.wy)>1);
check('no page exceptions', errors.length===0, errors.join(' | '));
p.close(); done();
