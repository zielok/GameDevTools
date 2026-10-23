import {openPage,check,done} from './cdp.mjs';
const W=process.argv[2];

{ console.log('Anim Mesh Forge — easing per segment');
  const p=await openPage('file://'+W+'/pages/mesh.html', W+'/profile-ease-mesh');
  const {ev,errors}=p;
  await ev(`new Promise(res=>{const c=document.createElement('canvas');c.width=16;c.height=16;c.getContext('2d').fillRect(0,0,16,16);
    c.toBlob(b=>{loadImage(new File([b],'t.png',{type:'image/png'}));setTimeout(()=>res(true),400);});})`);
  // keys at 0, 10, 20: vertex 6 moves +10 in each segment
  await ev(`autoMeshGrid();setMode('deform');goToFrame(0);addKeyframe();
    goToFrame(10);verts[6].x+=10;addKeyframe();goToFrame(20);verts[6].x+=10;addKeyframe();true`);
  const x0=await ev(`keyframes.get(0)[12]`);
  const at=f=>ev(`(()=>{goToFrame(${f});return verts[6].x-${x0}})()`);
  const setEase=async(f,v)=>{await ev(`goToFrame(${f});document.getElementById('sel-easing').value='${v}';document.getElementById('sel-easing').dispatchEvent(new Event('change'));true`);};
  await setEase(5,'linear'); await setEase(15,'step');
  check('segment 0→10 linear: halfway = 5', Math.abs(await at(5)-5)<1e-3, await at(5));
  check('segment 10→20 step: holds 10 until the next key', Math.abs(await at(15)-10)<1e-3 && Math.abs(await at(19)-10)<1e-3, await at(15));
  check('dropdown shows the segment under the playhead', await ev(`(()=>{goToFrame(15);return document.getElementById('sel-easing').value+' | '+document.getElementById('easing-target').textContent})()`)==='step | Segment: frames 10 → 20');
  await ev(`goToFrame(15);addKeyframe();true`);
  check('a key added inside a step segment keeps step on both halves', await ev(`keyEasing.get(10)==='step'&&keyEasing.get(15)==='step'`));
  await ev(`undo();true`);
  await ev(`undo();true`);
  check('undo restores the previous easing', await ev(`keyEasing.get(10)`)!=='step');
  check('export uses per-segment easing', await ev(`(()=>{interpolateFrameDirect(5);return Math.abs(verts[6].x-${x0}-5)<1e-3})()`));
  check('no page exceptions', errors.length===0, errors.join(' | '));
  p.close(); }

{ console.log('Bone Forge — easing per segment');
  const p=await openPage('file://'+W+'/pages/bone.html', W+'/profile-ease-bone');
  const {ev,errors}=p;
  await ev(`addBone(null);addBone(null);const a={id:uid(),name:'a',frameCount:30,loop:true,keyframes:[]};S.anims.push(a);S.anim=a;
    const [b1,b2]=S.bones;
    for(const b of [b1,b2]){a.keyframes.push({frame:0,boneId:b.id,angle:0,x:0,y:0},{frame:10,boneId:b.id,angle:100,x:0,y:0});}
    S.selBone=b1.id;S.frame=5;renderTL();true`);
  const ang=(i,f)=>ev(`interpBone(S.bones[${i}].id,${f}).angle`);
  check('default (in-out) at halfway = 50', Math.abs(await ang(0,5)-50)<1e-6);
  await ev(`(()=>{const e=document.getElementById('ease');e.value='step';e.dispatchEvent(new Event('change'));})();true`);
  check('selected bone segment → step (holds 0)', Math.abs(await ang(0,5))<1e-6);
  check('other bone unaffected', Math.abs(await ang(1,5)-50)<1e-6);
  check('label names the segment', /frames 0 → 10/.test(await ev(`document.getElementById('ease-target').textContent`)), await ev(`document.getElementById('ease-target').textContent`));
  await ev(`S.selKeys=[{boneId:S.bones[0].id,frame:0},{boneId:S.bones[1].id,frame:0}];renderTL();
    (()=>{const e=document.getElementById('ease');e.value='easeIn';e.dispatchEvent(new Event('change'));})();true`);
  check('selected keys on two bones → ease-in on both', Math.abs(await ang(0,5)-25)<1e-6 && Math.abs(await ang(1,5)-25)<1e-6, (await ang(0,5))+','+(await ang(1,5)));
  await ev(`undo();true`);
  check('undo restores step / in-out', Math.abs(await ang(0,5))<1e-6 && Math.abs(await ang(1,5)-50)<1e-6);
  await ev(`S.selKeys=[];S.selBone=S.bones[0].id;S.frame=7;setInterp('angle',0);true`);
  check('key added inside a step segment inherits step', await ev(`S.anim.keyframes.find(k=>k.boneId===S.bones[0].id&&k.frame===7).ease`)==='step');
  // old projects: keys without ease fall back to the default
  await ev(`delete S.anim.keyframes.find(k=>k.boneId===S.bones[1].id&&k.frame===0).ease;S.defaultEase='linear';true`);
  check('key without ease uses the default', Math.abs(await ang(1,5)-50)<1e-6 && Math.abs(await ang(1,2)-20)<1e-6);
  check('no page exceptions', errors.length===0, errors.join(' | '));
  p.close(); }
done();
