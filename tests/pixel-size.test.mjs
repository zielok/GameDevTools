import {openPage,check,done} from './cdp.mjs';
const SP=process.argv[2];
const p=await openPage('file://'+SP+'/pages/pixel.html', SP+'/profile-pixel3');
const {ev,errors}=p;
const btn=id=>ev(`document.querySelector('#${id}').click();true`);
const consistent=()=>ev(`__T.S.frames.every(f=>f.cells.length===__T.S.layers.length&&f.cells.every(c=>c.width===__T.S.w&&c.height===__T.S.h))`);
const px=(f,l,x,y)=>ev(`(()=>{const c=__T.S.frames[${f}].cells[${l}];return c.data[(${y}*c.width+${x})*4+3]})()`);
await ev(`document.querySelector('#newFileW').value=8;document.querySelector('#newFileH').value=4;document.querySelector('#newFileGo').click();true`);
await btn('btnLayerAdd');                                     // 2 layers
await ev(`__T.S.frames[0].cells[0].data[(0*8+7)*4+3]=255; __T.S.frames[0].cells[1].data[(3*8+0)*4+3]=255; true`);
await btn('btnFrameAdd');                                     // 2 frames

console.log('Pixel Forge — rotate 90° (8x4, 2 layers, 2 frames)');
await btn('btnRot90');
check('canvas is now 4x8', await ev(`__T.S.w`)===4 && await ev(`__T.S.h`)===8);
check('every layer/frame has the new size', await consistent());
check('layer 1 pixel (7,0) -> (3,7)', await px(0,0,3,7)===255);
check('layer 2 pixel (0,3) -> (0,0)', await px(0,1,0,0)===255);
await ev(`__T.undo();true`);
check('undo -> 8x4 and consistent', await ev(`__T.S.w`)===8 && await consistent() && await px(0,0,7,0)===255);
await ev(`__T.redo();true`);
check('redo -> 4x8 and consistent', await ev(`__T.S.w`)===4 && await consistent());
await ev(`__T.undo();true`);

console.log('Pixel Forge — resize with 2 frames');
check('resize scope selector removed', await ev(`!document.querySelector('#resScope')`));
await ev(`__T.S.activeFrame=1;document.querySelector('#resW').value=16;document.querySelector('#resH').value=8;document.querySelector('#resInterp').value='nearest';true`);
await btn('resGo');
check('canvas is 16x8', await ev(`__T.S.w`)===16 && await ev(`__T.S.h`)===8);
check('ALL frames resized (consistent)', await consistent());
check('frame 0 content scaled 2x', await px(0,0,14,0)===255 && await px(0,0,15,1)===255);
await ev(`__T.undo();true`);
check('undo -> 8x4 and consistent', await ev(`__T.S.w`)===8 && await consistent());
check('no page exceptions', errors.length===0, errors.join(' | '));
p.close(); done();
