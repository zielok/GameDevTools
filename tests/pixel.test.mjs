import {openPage,check,done} from './cdp.mjs';
const SP=process.argv[2];
const p=await openPage('file://'+SP+'/pages/pixel.html', SP+'/profile-pixel');
const {ev,click,key,errors}=p;
await ev(`document.querySelector('#newFileW').value=8;document.querySelector('#newFileH').value=8;document.querySelector('#newFileGo').click();true`);
const [ox,oy,z]=await ev(`(()=>{const r=document.querySelector('#canvasArea').getBoundingClientRect();return [r.left+__T.S.ox,r.top+__T.S.oy,__T.S.zoom]})()`);
const at=(x,y)=>[ox+(x+0.5)*z, oy+(y+0.5)*z];
const alpha=(x,y)=>ev(`__T.getPx(${x},${y})[3]`);
const row=async()=>[await alpha(0,0),await alpha(1,0),await alpha(2,0)].map(a=>a?1:0).join('');
const undoBtn=()=>ev(`document.querySelector('#btnUndo').click();true`);
const redoBtn=()=>ev(`document.querySelector('#btnRedo').click();true`);

console.log('Pixel Forge — undo/redo');
check('undo disabled on fresh file', await ev(`document.querySelector('#btnUndo').disabled`));
for(const x of [0,1,2]) await click(...at(x,0));
check('3 pencil strokes drawn', await row()==='111', await row());
await undoBtn(); check('undo #1 removes only stroke 3', await row()==='110', await row());
await key('z',2); check('Ctrl+Z #2 removes only stroke 2', await row()==='100', await row());
await redoBtn(); check('redo restores stroke 2', await row()==='110', await row());
await key('z',2|8); check('Ctrl+Shift+Z restores stroke 3', await row()==='111', await row());
check('redo stack empty at top', await ev(`document.querySelector('#btnRedo').disabled`));

console.log('Pixel Forge — layers');
await ev(`document.querySelector('#btnLayerAdd').click();true`);
check('layer added', await ev(`__T.S.layers.length`)===2);
await click(...at(5,5));
check('pixel on layer 2', await ev(`__T.S.frames[0].cells[1].data[(5*8+5)*4+3]`)===255);
await undoBtn(); await undoBtn();
check('undo back to 1 layer', await ev(`__T.S.layers.length`)===1 && await ev(`__T.S.frames[0].cells.length`)===1);
check('layer-1 strokes intact', await row()==='111', await row());
await redoBtn(); await redoBtn();
check('redo restores layer 2 + its pixel', await ev(`__T.S.layers.length`)===2 && await ev(`__T.S.frames[0].cells[1].data[(5*8+5)*4+3]`)===255);

console.log('Pixel Forge — frames');
await ev(`document.querySelector('#btnFrameAdd').click();true`);       // frame 1 (empty), active
await click(...at(7,7));                                               // mark frame 1
await ev(`document.querySelector('#btnFrameAdd').click();true`);       // frame 2, active
await click(...at(6,6));                                               // mark frame 2
const mark=(f,x,y)=>ev(`__T.S.frames[${f}].cells.some(c=>c.data[(${y}*8+${x})*4+3]===255)`);
await ev(`window.__sel=(i)=>{document.querySelectorAll('#frameStrip .frame-thumb, #frameStrip [data-idx]');} ;true`);
// select frame 1 and delete it
await ev(`__T.S.activeFrame=1;true`);
await ev(`document.querySelector('#btnFrameDel').click();true`);
check('frame deleted (3 -> 2)', await ev(`__T.S.frames.length`)===2);
check('frame 2 content shifted to index 1', await mark(1,6,6));
await undoBtn();
check('undo restores 3 frames', await ev(`__T.S.frames.length`)===3);
check('frame 1 content back at 1, frame 2 content intact at 2', await mark(1,7,7) && !await mark(1,6,6) && await mark(2,6,6));

console.log('Pixel Forge — no-op actions');
await ev(`__T.S.activeFrame=0;true`);
const names=()=>ev(`__T.S.layers.map(l=>l.name).join(',')`);
const n0=await names();                                                // active = top layer (idx 1)
await ev(`document.querySelector('#btnLayerDn').click();true`);        // no-op (already last)
await ev(`document.querySelector('#btnLayerUp').click();true`);        // real move 1 -> 0
const n1=await names();
await ev(`document.querySelector('#btnLayerUp').click();true`);        // no-op (already first)
await ev(`document.querySelector('#btnLayerDel').click();document.querySelector('#btnLayerDel').click();true`); // 2nd is no-op ("last layer" alert)
check('layer moved, then one layer deleted', n1!==n0 && await ev(`__T.S.layers.length`)===1);
await undoBtn(); check('undo #1 restores deleted layer', await ev(`__T.S.layers.length`)===2 && await names()===n1, await names());
await undoBtn(); check('undo #2 reverts the real move (no-ops skipped)', await names()===n0, await names());
check('no page exceptions', errors.length===0, errors.join(' | '));
p.close(); done();
