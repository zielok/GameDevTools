import {openPage,check,done} from './cdp.mjs';
const W=process.argv[2];
const p=await openPage('file://'+W+'/pages/particle.html', W+'/profile-ploop');
const {ev,click,send,errors}=p;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const press=async(key,code,vk)=>{for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key,code,windowsVirtualKeyCode:vk});};

// capture downloads + helpers to unpack a stored ZIP of PNG frames and measure it
await ev(`window.__dl=[];const o=URL.createObjectURL;URL.createObjectURL=b=>{__dl.push(b);return o(b);};HTMLAnchorElement.prototype.click=function(){};
window.__analyze=async(blob)=>{
  const u=new Uint8Array(await blob.arrayBuffer()),dv=new DataView(u.buffer);let p=0;const files={};
  while(dv.getUint32(p,true)===0x04034b50){const sz=dv.getUint32(p+18,true),nl=dv.getUint16(p+26,true),xl=dv.getUint16(p+28,true);
    const name=new TextDecoder().decode(u.subarray(p+30,p+30+nl));files[name]=u.slice(p+30+nl+xl,p+30+nl+xl+sz);p+=30+nl+xl+sz;}
  const names=Object.keys(files).filter(n=>n.endsWith('.png')).sort();
  const frames=[];
  for(const n of names){const img=await createImageBitmap(new Blob([files[n]],{type:'image/png'}));const c=new OffscreenCanvas(img.width,img.height);
    const x=c.getContext('2d');x.drawImage(img,0,0);frames.push(x.getImageData(0,0,img.width,img.height).data);}
  const diff=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=Math.abs(a[i]-b[i]);return s/a.length;};
  const N=frames.length, cons=[];for(let i=0;i<N-1;i++)cons.push(diff(frames[i],frames[i+1]));
  const alpha=frames.map(f=>{let s=0;for(let i=3;i<f.length;i+=4)s+=f[i];return s;});
  const med=a=>[...a].sort((x,y)=>x-y)[a.length>>1];
  return {n:N,wrap:diff(frames[N-1],frames[0]),maxCons:Math.max(...cons),medCons:med(cons),a0:alpha[0],medA:med(alpha),
    meta:files['metadata.json']?JSON.parse(new TextDecoder().decode(files['metadata.json'])):null};
};true`);

async function setField(label,value){
  const [x,y]=await ev(`(()=>{const f=[...document.querySelectorAll('#exp_timeHost .field')].find(w=>w.querySelector('.field-label')?.textContent===${JSON.stringify(label)});
    const r=f.querySelector('.numfield').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
  await click(x,y); await wait(50);
  await ev(`document.activeElement.select();true`);
  await send('Input.insertText',{text:String(value)});
  await press('Enter','Enter',13); await wait(50);
}
async function exportRun({preset,duration,step,prewarm,loop,useCycle}){
  await ev(`(()=>{const s=document.getElementById('presetSelect');s.value=${JSON.stringify(preset)};s.dispatchEvent(new Event('change'));})();
    document.getElementById('btnExport').click();document.querySelector('#exp_format [data-val="frames"]').click();true`);
  await wait(100);
  if(useCycle){ await ev(`document.querySelector('#exp_loopHint button').click();true`); }
  else { await setField('Duration',duration); }
  await setField('Time step',step);
  await setField('Pre-warm',prewarm);
  if(await ev(`document.getElementById('exp_loop').checked`)!==loop) await ev(`document.getElementById('exp_loop').click();true`);
  const n0=await ev(`__dl.length`);
  await ev(`document.getElementById('exp_go').click();true`);
  for(let i=0;i<200&&await ev(`__dl.length`)===n0;i++) await wait(100);
  return ev(`__analyze(__dl[__dl.length-1])`);
}
const fmt=r=>`n=${r.n} wrap=${r.wrap.toFixed(2)} maxStep=${r.maxCons.toFixed(2)} medStep=${r.medCons.toFixed(2)} frame0/median alpha=${(r.a0/r.medA).toFixed(2)}`;

console.log('Particle Forge — seamless loop / pre-warm export');
const a=await exportRun({preset:'smoke',duration:4,step:0.1,prewarm:0,loop:true});
console.log('    smoke loop:      ', fmt(a));
check('loop has no duplicate closing frame (4s / 0.1s = 40 frames)', a.n===40, a.n);
check('loop seam (last→first) is no bigger than a normal frame step', a.wrap<=a.maxCons, fmt(a));
check('loop is at full density on frame 0', a.a0/a.medA>0.8, fmt(a));
check('metadata says loop:true', a.meta&&a.meta.loop===true&&a.meta.frameCount===40);

const b=await exportRun({preset:'smoke',duration:4,step:0.1,prewarm:0,loop:false});
console.log('    smoke plain:     ', fmt(b));
check('plain export starts from an empty scene (control)', b.a0/b.medA<0.3 && b.wrap>b.maxCons*2, fmt(b));

const c=await exportRun({preset:'smoke',duration:4,step:0.1,prewarm:5,loop:false});
console.log('    smoke prewarm 5s:', fmt(c));
check('pre-warm 5 s: frame 0 already at full density', c.a0/c.medA>0.8 && c.n===41 && c.meta.prewarm===5, fmt(c));

const hint=await ev(`(()=>{const s=document.getElementById('presetSelect');s.value='fireworks';s.dispatchEvent(new Event('change'));document.getElementById('btnExport').click();return document.getElementById('exp_loopHint').textContent;})()`);
check('fireworks: effect cycle 4 s suggested', /Effect cycle: 4 s/.test(hint), hint);
const d=await exportRun({preset:'fireworks',step:0.05,prewarm:1,loop:true,useCycle:true});
console.log('    fireworks loop:  ', fmt(d));
check('"Use 4 s" sets an 80-frame loop (step 0.05)', d.n===80, d.n);
check('fireworks (bursts + sub-emitters) loop seam is smooth', d.wrap<=d.maxCons, fmt(d));
check('no page exceptions', errors.length===0, errors.join(' | '));
p.close(); done();
