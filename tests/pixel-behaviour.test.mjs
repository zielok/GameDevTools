import {openPage,check,done} from './cdp.mjs';
const W=process.argv[2];
const p=await openPage('file://'+W+'/pages/pixel.html', W+'/profile-pixel-beh');
const {ev,click,drag,key,send,errors}=p;
await ev(`document.querySelector('#newFileW').value=8;document.querySelector('#newFileH').value=8;document.querySelector('#newFileGo').click();true`);
const [ox,oy,z]=await ev(`(()=>{const r=document.querySelector('#canvasArea').getBoundingClientRect();return [r.left+__T.S.ox,r.top+__T.S.oy,__T.S.zoom]})()`);
const at=(x,y)=>[ox+(x+0.5)*z, oy+(y+0.5)*z];
// alpha of (x,y) in the ACTIVE layer of the active frame (l is kept for readability)
const cellA=(l,x,y)=>ev(`__T.S.imgData.data[(${y}*8+${x})*4+3]`);
const undo=()=>ev(`__T.undo();true`);
const tool=t=>ev(`document.querySelector('[data-tool="${t}"]').click();true`);

console.log('Pixel Forge — undo leaves layer properties alone');
await click(...at(0,0));
await ev(`__T.S.layers[0].visible=false;__T.S.layers[0].opacity=0.4;__T.S.layers[0].name='Ink';true`);
await undo();
check('stroke undone', await cellA(0,0,0)===0);
check('visibility / opacity / name kept', await ev(`(l=>!l.visible&&l.opacity===0.4&&l.name==='Ink')(__T.S.layers[0])`), await ev(`JSON.stringify(__T.S.layers[0])`));
await ev(`__T.S.layers[0].visible=true;true`);
await ev(`document.querySelector('#btnLayerAdd').click();true`);                 // layer 2 (active)
await ev(`__T.S.layers[1].opacity=0.5;__T.S.layers[1].name='Shade';true`);
await ev(`document.querySelector('#btnLayerDel').click();true`);                 // delete it
await undo();
check('deleted layer comes back with its own properties', await ev(`__T.S.layers.length===2&&__T.S.layers[1].name==='Shade'&&__T.S.layers[1].opacity===0.5`), await ev(`JSON.stringify(__T.S.layers)`));
await ev(`document.querySelector('#btnLayerDup').click();true`);
check('duplicated layer gets its own identity', await ev(`(()=>{const ids=__T.S.layers.map(l=>l.id).filter(x=>x!=null);return new Set(ids).size===ids.length})()`));
await undo();

console.log('Pixel Forge — floating selection');
await tool('pencil'); await click(...at(1,1));
await tool('rect');
await drag(...at(0,0),...at(2,2));           // select 3x3
await drag(...at(1,1),...at(3,3));           // move +2,+2
check('selection still floating after the move', await ev(`!!(__T.S.sel&&__T.S.selData)`));
await drag(...at(3,3),...at(5,4));           // move again +2,+1
check('second move continues from the floating position', await ev(`__T.S.sel.x===4&&__T.S.sel.y===3`), await ev(`JSON.stringify(__T.S.sel)`));
await undo();
check('one undo reverts the whole move', await cellA(0,1,1)===255 && await ev(`!__T.S.sel`));
await ev(`__T.redo();true`);
check('redo re-applies it (committed at 5,4)', await cellA(0,5,4)===255 && await cellA(0,1,1)===0);
await drag(...at(4,3),...at(6,5));           // select around the pixel
await drag(...at(5,4),...at(6,6));           // move +1,+2 → floating at (6,6)
for(const type of ['keyDown','keyUp']) await send('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
check('Enter commits the floating selection', await ev(`!__T.S.sel`) && await cellA(0,6,6)===255);
await drag(...at(6,6),...at(6,6));           // select the pixel at (6,6)
await drag(...at(6,6),...at(7,7));           // floating at (7,7), not yet in the layer
check('pixels are floating (not in the layer yet)', await cellA(0,7,7)===0);
await ev(`window.__b=[];const o=URL.createObjectURL;URL.createObjectURL=b=>{__b.push(b);return o(b);};HTMLAnchorElement.prototype.click=function(){};
  document.querySelector('#expFormat').value='zip';document.querySelector('#expGo').click();true`);
await new Promise(r=>setTimeout(r,800));
check('export commits the floating pixels first', await cellA(0,7,7)===255 && await ev(`__b.length`)>0);
await tool('pencil');
await ev(`document.querySelector('#btnFrameAdd').click();true`);
await click(...at(0,7)); await tool('rect');
await drag(...at(0,7),...at(0,7)); await drag(...at(0,7),...at(1,7));   // float on frame 1
await ev(`(()=>{const t=document.querySelectorAll('#frameThumbsWrap > *');t[0].click();})();true`);
check('switching frames commits into the frame it came from', await ev(`__T.S.frames[1].cells[__T.S.activeLayer].data[(7*8+1)*4+3]===255&&__T.S.frames[0].cells[__T.S.activeLayer].data[(7*8+1)*4+3]===0`));
check('no page exceptions', errors.length===0, errors.join(' | '));
p.close(); done();
