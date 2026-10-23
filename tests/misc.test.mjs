import {openPage,check,done} from './cdp.mjs';
const SP=process.argv[2], sfx=process.argv[3]||'';   // sfx '-orig' runs against git HEAD copies
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const open=(name)=>openPage('file://'+SP+'/pages/'+name+sfx+'.html', SP+'/profile-misc-'+name+sfx+Date.now());

{ console.log('Particle Forge'); const p=await open('particle'); const {ev}=p;
  await ev(`(()=>{const s=document.getElementById('presetSelect');s.value='campfire';s.dispatchEvent(new Event('change'));})();true`);
  check('preset toast is English', /Applied preset: Campfire/.test(await ev(`document.getElementById('toast').textContent`)), await ev(`document.getElementById('toast').textContent`));
  await ev(`Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError');};
    document.querySelector('#emittersBar input[type=checkbox], .emitter-chip input[type=checkbox], input[type=checkbox]').click();true`);
  await wait(4600);
  check('autosave failure is reported', /Autosave failed/.test(await ev(`document.getElementById('toast').textContent`)), await ev(`document.getElementById('toast').textContent`));
  p.close(); }

{ console.log('Bone Forge — onion skin'); const p=await open('bone'); const {ev}=p;
  await ev(`new Promise(res=>{const c=document.createElement('canvas');c.width=32;c.height=32;const x=c.getContext('2d');
    x.fillStyle='#fff';x.fillRect(0,0,1,1);x.fillRect(31,31,1,1);x.fillStyle='#0f0';x.fillRect(14,14,4,4); // opaque corners keep trim at 32x32
    c.toBlob(b=>{const img=new Image();img.onload=()=>{S.sprites.push({id:uid(),name:'s',img,trimX:0,trimY:0,trimW:32,trimH:32});
      addBone(null);const bn=S.bones[0];bn.spriteId=S.sprites[0].id;bn.pivotX=16;bn.pivotY=16;
      const a={id:uid(),name:'a',frameCount:3,loop:true,keyframes:[]};S.anims.push(a);S.anim=a;S.frame=1;S.selBone=null;
      S.vp.zoom=8;S.vp.x=vpC.width/2;S.vp.y=vpC.height/2;res(true);};img.src=URL.createObjectURL(b);});})`);
  const grab=()=>ev(`(()=>{renderVP();const s=w2s(-12,-12),e=w2s(12,12);return [...vpX.getImageData(s.sx,s.sy,e.sx-s.sx,e.sy-s.sy).data].join(',')})()`);
  await ev(`S.onion=false;true`); const off=await grab();
  await ev(`S.onion=true;true`); const on=await grab();
  check('onion tint does not colour the grid/background around the sprite', off===on);
  p.close(); }

{ console.log('Anim Forge — Clear All'); const p=await open('anim'); const {ev}=p;
  await ev(`applyPreviewZoom(3);state.tracks[0].push(createSegment('x',[{img:previewCanvas,thumb:makeThumbnail(previewCanvas)}]));recalcTotal();state.currentFrame=0;renderFrame(0);true`);
  await ev(`document.getElementById('clear-btn').click();true`);
  check('preview back to 320x180 at 100%', await ev(`previewCanvas.width===320&&previewCanvas.height===180&&document.getElementById('zoom-label').textContent==='100%'`),
    await ev(`previewCanvas.width+'x'+previewCanvas.height+' '+document.getElementById('zoom-label').textContent`));
  check('frame counter "0 / 0", info "No animation loaded"', await ev(`document.getElementById('frame-counter').textContent==='0 / 0'&&document.getElementById('preview-info').textContent==='No animation loaded'`),
    await ev(`document.getElementById('frame-counter').textContent+' | '+document.getElementById('preview-info').textContent`));
  check('ruler canvas height matches its CSS row (26px)', await ev(`document.getElementById('ruler').height===26`));
  p.close(); }

{ console.log('Fluid Forge — paused brush'); const p=await open('fluid'); const {ev,drag}=p;
  await ev(`document.getElementById('btnReset').click();document.getElementById('btnPlay').click();true`); // pause
  await wait(200);
  const alpha=()=>ev(`(()=>{const c=document.getElementById('simCanvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)n+=d[i];return n;})()`);
  const a0=await alpha();
  const [x,y]=await ev(`(()=>{const r=document.getElementById('simCanvas').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
  await drag(x,y,x+30,y+10,5);
  check('painting while paused is visible immediately', (await alpha())>a0, a0+' -> '+await alpha());
  p.close(); }

{ console.log('Pixel Forge — Recent files'); const p=await open('pixel'); const {ev}=p;
  await ev(`new Promise(res=>{const c=document.createElement('canvas');c.width=13;c.height=7;c.getContext('2d').fillRect(0,0,3,3);
    c.toBlob(b=>{const dt=new DataTransfer();dt.items.add(new File([b],'hero.png',{type:'image/png'}));const i=document.getElementById('fileIn');i.files=dt.files;i.dispatchEvent(new Event('change'));setTimeout(()=>res(true),700);});})`);
  check('PNG opened (13x7)', await ev(`__T.S.w===13&&__T.S.h===7`));
  await ev(`document.querySelector('#newFileW').value=8;document.querySelector('#newFileH').value=8;document.querySelector('#newFileGo').click();true`);
  await ev(`document.getElementById('btnRecent').click();true`); await wait(200);
  await ev(`document.querySelector('#recentList .recent-item').click();true`); await wait(900);
  check('clicking Recent re-opens the stored copy', await ev(`__T.S.w===13&&__T.S.h===7&&__T.S.fileName==='hero'`), await ev(`__T.S.w+'x'+__T.S.h+' '+__T.S.fileName`));
  check('pixels restored', await ev(`__T.getPx(1,1)[3]===255&&__T.getPx(5,5)[3]===0`));
  p.close(); }
done();
