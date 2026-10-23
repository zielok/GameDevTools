import {openPage,check,done} from './cdp.mjs';
const SP=process.argv[2];
const p=await openPage('file://'+SP+'/pages/pixel.html', SP+'/profile-pixel2');
const {ev,click,drag,key,errors}=p;
await ev(`document.querySelector('#newFileW').value=8;document.querySelector('#newFileH').value=8;document.querySelector('#newFileGo').click();true`);
const [ox,oy,z]=await ev(`(()=>{const r=document.querySelector('#canvasArea').getBoundingClientRect();return [r.left+__T.S.ox,r.top+__T.S.oy,__T.S.zoom]})()`);
const at=(x,y)=>[ox+(x+0.5)*z, oy+(y+0.5)*z];
const a=(x,y)=>ev(`__T.getPx(${x},${y})[3]`);
const undoBtn=()=>ev(`document.querySelector('#btnUndo').click();true`);
const tool=t=>ev(`document.querySelector('[data-tool="${t}"]').click();true`);

console.log('Pixel Forge — selection move / cut / paste');
await click(...at(1,1));                         // pencil dot at (1,1)
await tool('rect');
await drag(...at(0,0),...at(2,2));               // select 3x3
await drag(...at(1,1),...at(5,5));               // move selection by +4,+4
check('pixel moved (1,1)->(5,5)', await a(1,1)===0 && await a(5,5)===255);
await undoBtn();
check('undo reverts the move in one step', await a(1,1)===255 && await a(5,5)===0);
await undoBtn();
check('2nd undo removes the pencil dot', await a(1,1)===0);
await ev(`document.querySelector('#btnRedo').click();document.querySelector('#btnRedo').click();true`);
check('redo x2 re-applies dot + move', await a(1,1)===0 && await a(5,5)===255);

await drag(...at(4,4),...at(6,6));               // select around (5,5)
await key('c',2); await key('v',2);              // copy + paste (floating, centred)
await click(...at(0,7));                         // click outside -> commit paste
const pasted=await ev(`__T.S.frames[0].cells[0].data.reduce((n,v,i)=>n+((i%4===3&&v)?1:0),0)`);
check('paste committed a second pixel', pasted===2, pasted);
await undoBtn();
check('undo removes only the paste', await ev(`__T.S.frames[0].cells[0].data.reduce((n,v,i)=>n+((i%4===3&&v)?1:0),0)`)===1 && await a(5,5)===255);
check('no page exceptions', errors.length===0, errors.join(' | '));
p.close(); done();
