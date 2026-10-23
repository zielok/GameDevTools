import {openPage,check,done} from './cdp.mjs';
const SP=process.argv[2], page=process.argv[3]||'mesh.html';
const p=await openPage('file://'+SP+'/pages/'+page, SP+'/profile-mesh-'+page);
const {ev,click,key,errors}=p;
// 16x16 sprite where every pixel has a unique colour (r=x*16, g=y*16)
await ev(`new Promise(res=>{const c=document.createElement('canvas');c.width=16;c.height=16;const x=c.getContext('2d');
  for(let i=0;i<16;i++)for(let j=0;j<16;j++){x.fillStyle='rgb('+(i*16)+','+(j*16)+',0)';x.fillRect(i,j,1,1);}
  c.toBlob(b=>{loadImage(new File([b],'t.png',{type:'image/png'}));setTimeout(()=>res(true),400);});})`);
await ev(`document.getElementById('grid-cols').value=4;document.getElementById('grid-rows').value=4;autoMeshGrid();true`);

console.log('Anim Mesh Forge — pixel-exact warp');
// deform only the bottom-right corner vertex; pixels far from it must match the source exactly
await ev(`verts[verts.length-1].x-=3;verts[verts.length-1].y-=3;render();true`);
const bad=await ev(`(()=>{const d=_dstCtx.getImageData(0,0,16,16).data;const s=_getSrcPixels();let bad=[];
  for(let y=0;y<12;y++)for(let x=0;x<12;x++){const i=(y*16+x)*4;if(d[i]!==s[i]||d[i+1]!==s[i+1]||d[i+3]!==s[i+3])bad.push(x+','+y);}
  return bad;})()`);
check('untouched region identical to source (no 1px shift)', bad.length===0, bad.length+' px differ, e.g. '+bad.slice(0,4).join(' '));
const edge=await ev(`(()=>{const d=_dstCtx.getImageData(0,0,16,16).data;const s=_getSrcPixels();let ok=true;
  for(let y=0;y<12;y++){const i=(y*16+0)*4;if(d[i+3]!==255||d[i]!==s[i])ok=false;}
  return ok;})()`);
check('left column present and correct', edge);
await ev(`resetDeform();undo();undo();true`);

console.log('Anim Mesh Forge — add vertex after keyframes');
await ev(`autoMeshGrid();setMode('deform');goToFrame(0);addKeyframe();goToFrame(10);verts[0].x+=2;addKeyframe();goToFrame(5);setMode('add');true`);
const [cx,cy]=await ev(`(()=>{const r=canvas.getBoundingClientRect();const c=spriteToCanvas(7.3,7.6);return [r.left+c.x,r.top+c.y]})()`);
const n0=await ev(`verts.length`);
await click(cx,cy);
check('vertex added by click', await ev(`verts.length`)===n0+1);
await ev(`goToFrame(3);goToFrame(10);goToFrame(0);true`);
check('no NaN positions after interpolation', await ev(`verts.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y))`));
check('keyframes grown to new vertex count', await ev(`[...keyframes.values()].every(a=>a.length===verts.length*2)`));
check('new vertex sits at its rest position in keyframes', await ev(`(()=>{const v=verts[verts.length-1];return Math.abs(v.x-v.ox)<1e-4&&Math.abs(v.y-v.oy)<1e-4})()`));

console.log('Anim Mesh Forge — shortcuts');
await ev(`setMode('select');selIdx.clear();true`);
await key('a',2);
check('Ctrl+A selects all', await ev(`selIdx.size===verts.length`));
check('Ctrl+A keeps Select mode', await ev(`mode`)==='select', await ev(`mode`));
await key('a');
check('plain A still switches to Add', await ev(`mode`)==='add');
const vBefore=await ev(`verts.length`);
await key('z',2);
check('Ctrl+Z undoes vertex add', await ev(`verts.length`)===vBefore-1);
await key('z',2|8);
check('Ctrl+Shift+Z redoes it', await ev(`verts.length`)===vBefore);
check('no page exceptions', errors.length===0, errors.join(' | '));
p.close(); done();
