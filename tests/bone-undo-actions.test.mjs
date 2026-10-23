import {openPage,check,done} from './cdp.mjs';
const SP=process.argv[2], page=process.argv[3]||'bone.html';
const p=await openPage('file://'+SP+'/pages/'+page, SP+'/profile-boneu-'+page);
const {ev,drag,errors}=p;
const state=()=>ev(`JSON.stringify({b:S.bones,a:S.anims,id:S.anim?.id??null})`);
// run an action, then one undo must restore the exact previous document
async function undoable(name, action){
  const before=await state(), n=await ev(`undoStack.length`);
  await ev(`(()=>{${action}})();true`);
  const after=await state();
  const changed=after!==before;
  await ev(`undo();true`);
  const restored=await state();
  check(name+': 1 step, undo restores', changed && await ev(`undoStack.length`)===n && restored===before,
    `changed=${changed} steps=${(await ev('undoStack.length'))-n} restored=${restored===before}`);
  await ev(`redo();true`);
}
await ev(`addBone(null);addBone(null);addBone(null);S.selBone=S.bones[0].id;
  const a={id:uid(),name:'walk',frameCount:24,loop:true,keyframes:[]};S.anims.push(a);S.anim=a;S.frame=3;
  const b={id:uid(),name:'run',frameCount:12,loop:true,keyframes:[]};S.anims.push(b);
  b.keyframes.push({frame:0,boneId:S.bones[2].id,angle:10,x:0,y:0});
  syncAnimCfg();renderAll=()=>{renderBoneTree();renderProps();renderZOrder();renderAnimList();renderTL();renderVP();};renderAll();true`);
console.log('Bone Forge — undo for every action');
await undoable('+ Key', `document.getElementById('btn-addkey').click()`);
await undoable('+ Pose (bake all)', `document.getElementById('btn-addpose').click()`);
await undoable('− Key', `document.getElementById('tl-delkey').click()`);
await undoable('New animation', `document.getElementById('btn-new-anim').click();document.getElementById('modal-ok').click()`);
await undoable('Update animation', `document.getElementById('an-frames').value=48;document.getElementById('btn-upd-anim').click()`);
await undoable('Z-order down', `document.querySelectorAll('#zorder-list .zo-dn')[0].click()`);
await undoable('Reparent (drop)', `(()=>{const rows=document.querySelectorAll('#bone-tree .bn');const dt=new DataTransfer();dt.setData('bid',String(S.bones[1].id));
  const tgt=[...rows].find(r=>+r.dataset.id===S.bones[0].id);tgt.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true}));})()`);
await undoable('Rename in Properties', `const el=document.getElementById('p-nm');el.focus();for(const v of ['h','he','head']){el.value=v;el.dispatchEvent(new Event('input'));}el.blur()`);
await ev(`window.__del=S.bones[2].id;true`);
await undoable('Delete bone (keys removed from all anims)', `deleteBone(__del)`);
// state is now redone (bone deleted)
check('deleted bone has no keys left in other animations', !await ev(`!!getBone(__del)`) && await ev(`S.anims.every(a=>a.keyframes.every(k=>getBone(k.boneId)))`));
await ev(`undo();true`);

// B mode: click+drag creates a bone = one undo step; a plain click (draft cancelled) = no step
await ev(`S.selBone=null;S.mode='bone';setModeBtns();true`);
const [x0,y0]=await ev(`(()=>{const r=vpC.getBoundingClientRect();return [r.left+r.width/2+80,r.top+r.height/2+80]})()`);
const nb=await ev(`S.bones.length`), nu=await ev(`undoStack.length`);
await drag(x0,y0,x0+40,y0+10,6);
check('B-mode drag created a bone (+1 undo step)', await ev(`S.bones.length`)===nb+1 && await ev(`undoStack.length`)===nu+1);
await ev(`undo();true`);
check('undo removes the drawn bone', await ev(`S.bones.length`)===nb);
await ev(`S.mode='bone';setModeBtns();true`);
await drag(x0,y0,x0,y0,1);
check('plain click in B mode adds no bone and no undo step', await ev(`S.bones.length`)===nb && await ev(`undoStack.length`)===nu);
check('no page exceptions', errors.length===0, errors.join(' | '));
p.close(); done();
