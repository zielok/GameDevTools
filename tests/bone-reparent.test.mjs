import {openPage,check,done} from './cdp.mjs';
const W=process.argv[2];
const p=await openPage('file://'+W+'/pages/bone.html', W+'/profile-reparent');
const {ev,errors}=p;
// A: root at (0,0); B: root at (100,50) angle 30, with a child C; animation keys on A and B
await ev(`addBone(null);addBone(null);const [A,B]=S.bones;A.name='A';B.name='B';B.x=100;B.y=50;B.angle=30;
  addBone(B.id);S.bones[2].name='C';
  const an={id:uid(),name:'walk',frameCount:20,loop:true,keyframes:[
    {frame:0,boneId:A.id,angle:0,x:0,y:0},{frame:10,boneId:A.id,angle:45,x:0,y:0},
    {frame:0,boneId:B.id,angle:30,x:100,y:50},{frame:10,boneId:B.id,angle:60,x:120,y:50}]};
  S.anims.push(an);S.anim=an;S.frame=0;renderBoneTree();renderTL();
  window.__world=(name)=>{const b=S.bones.find(x=>x.name===name);const out=[];const sv=S.anim;
    S.anim=null;{const w=boneWT(b,0),t=boneTip(b,0);out.push([w.wx,w.wy,w.wa,t.x,t.y]);}
    for(const f of [0,10]){S.anim=S.anims[0];const w=boneWT(b,f),t=boneTip(b,f);out.push([w.wx,w.wy,w.wa,t.x,t.y]);}
    S.anim=sv;return out;};
  window.__same=(a,b)=>a.every((r,i)=>r.every((v,j)=>Math.abs(v-b[i][j])<1e-6));
  window.__drop=(name,targetName)=>{const dt=new DataTransfer();dt.setData('bid',String(S.bones.find(x=>x.name===name).id));
    const tgt=targetName?[...document.querySelectorAll('#bone-tree .bn')].find(r=>+r.dataset.id===S.bones.find(x=>x.name===targetName).id):document.getElementById('bone-tree-wrap');
    tgt.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true}));};true`);
const before={B:await ev(`__world('B')`),C:await ev(`__world('C')`)};
const same=(n,ref)=>ev(`__same(__world('${n}'),${JSON.stringify(ref)})`);

console.log('Bone Forge — reparent keeps the world transform');
await ev(`__drop('B','A');true`);
check('B is now a child of A', await ev(`getBone(S.bones.find(x=>x.name==='B').parentId)?.name`)==='A');
check('B stays put (rest pose + both keyframes, root, angle and tip)', await same('B',before.B));
check('its child C stays put too', await same('C',before.C));
await ev(`undo();true`);
check('undo → B is a root again, unchanged', await ev(`S.bones.find(x=>x.name==='B').parentId`)===null && await same('B',before.B));
await ev(`redo();true`);
await ev(`S.selBone=S.bones.find(x=>x.name==='B').id;renderProps();document.getElementById('p-root').click();true`);
check('"Make root" detaches B without moving it', await ev(`S.bones.find(x=>x.name==='B').parentId`)===null && await same('B',before.B));
await ev(`__drop('C',null);true`);
check('dropping C on empty tree space makes it a root, unmoved', await ev(`S.bones.find(x=>x.name==='C').parentId`)===null && await same('C',before.C),
  `parent=${await ev("S.bones.find(x=>x.name==='C').parentId")} now=${JSON.stringify(await ev("__world('C')"))} before=${JSON.stringify(before.C)}`);

console.log('Bone Forge — IK on a chain with an offset joint');
await ev(`undo();undo();true`); // back to A → B (offset) → C
check('chain restored (B child of A, C child of B)', await ev(`(n=>getBone(n('B').parentId)?.name==='A'&&getBone(n('C').parentId)?.name==='B')(x=>S.bones.find(b=>b.name===x))`));
const reach=await ev(`(()=>{S.frame=5;const C=S.bones.find(x=>x.name==='C');const chain=ikChain(C);
  const base=boneWT(chain[0],5);const tgt={x:base.wx+60,y:base.wy+70};
  for(let i=0;i<5;i++)solveIK(chain,tgt.x,tgt.y);const t=boneTip(C,5);return Math.hypot(t.x-tgt.x,t.y-tgt.y);})()`);
check('IK reaches the target through the offset joint (< 0.5 px)', reach<0.5, reach);
check('no page exceptions', errors.length===0, errors.join(' | '));
p.close(); done();
