// Minimal Chrome DevTools Protocol driver: launches headless Chrome, opens a
// page and exposes helpers for real mouse/keyboard input. No npm dependencies
// (needs Node 22+ for the global WebSocket). Set CHROME to override the path.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
const CHROME = process.env.CHROME || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(p => existsSync(p));
if (!CHROME) { console.error('Chrome not found — set the CHROME environment variable.'); process.exit(2); }
export async function openPage(url, profileDir, opts={}){
  const port=9300+Math.floor(Math.random()*500);
  const proc=spawn(CHROME,['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${profileDir}`,
    '--window-size=1400,900','--no-first-run','--no-default-browser-check','about:blank'],{stdio:'ignore'});
  process.on('exit',()=>proc.kill()); // never leave a browser behind, even if a test throws
  let tabs;
  for(let i=0;i<50;i++){ try{ tabs=await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if(tabs.length)break; }catch{} await new Promise(r=>setTimeout(r,200)); }
  const tab=tabs.find(t=>t.type==='page');
  const ws=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r=>ws.onopen=r);
  let id=0; const pending=new Map(); const errors=[]; const dialog={accept:true,promptText:undefined};
  ws.onmessage=ev=>{const m=JSON.parse(ev.data);
    if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}
    if(m.method==='Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
    if(m.method==='Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog',{accept:dialog.accept,promptText:dialog.promptText});
  };
  const send=(method,params={})=>new Promise(r=>{const i=++id;pending.set(i,r);ws.send(JSON.stringify({id:i,method,params}));});
  await send('Runtime.enable'); await send('Page.enable');
  if(opts.offline){ await send('Network.enable'); await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1}); }
  await send('Page.navigate',{url}); await new Promise(r=>setTimeout(r,1500));
  const ev=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
    if(r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description||'eval error'); return r.result.result.value;};
  const mouse=async(type,x,y,button='left')=>send('Input.dispatchMouseEvent',{type,x,y,button,buttons:type==='mouseReleased'?0:1,clickCount:1});
  const click=async(x,y)=>{await mouse('mousePressed',x,y);await mouse('mouseReleased',x,y);};
  const drag=async(x0,y0,x1,y1,steps=8)=>{await mouse('mousePressed',x0,y0);
    for(let i=1;i<=steps;i++) await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:x0+(x1-x0)*i/steps,y:y0+(y1-y0)*i/steps,button:'left',buttons:1});
    await mouse('mouseReleased',x1,y1);};
  const key=async(k,mods=0)=>{const code='Key'+k.toUpperCase();
    const text=(mods&8)?k.toUpperCase():k;
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:text,code,modifiers:mods,windowsVirtualKeyCode:k.toUpperCase().charCodeAt(0)});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:text,code,modifiers:mods,windowsVirtualKeyCode:k.toUpperCase().charCodeAt(0)});};
  const close=()=>{ws.close();proc.kill();};
  return {send,ev,mouse,click,drag,key,errors,dialog,close};
}
let fails=0;
export function check(name,cond,detail=''){ console.log((cond?'  PASS ':'  FAIL ')+name+(cond?'':'  -> '+detail)); if(!cond)fails++; }
export function done(){ console.log(fails?`\n${fails} FAILED`:'\nALL PASSED'); process.exitCode=fails?1:0; }
