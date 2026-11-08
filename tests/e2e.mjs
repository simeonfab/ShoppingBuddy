import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const edge=[process.env.CHROME_PATH,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(value=>value&&existsSync(value))
if(!edge)throw new Error('Chrome/Chromium was not found. Set CHROME_PATH to run genuine browser tests.')
const profile=mkdtempSync(join(tmpdir(),'smartshop-e2e-'))
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--port','4173','--strictPort'],{stdio:'pipe'})
const browser=spawn(edge,['--headless','--no-sandbox','--disable-gpu','--disable-software-rasterizer','--disable-gpu-compositing','--remote-debugging-port=9333','--remote-allow-origins=*',`--user-data-dir=${profile}`,'--no-first-run','about:blank'],{stdio:'ignore'})
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const waitFor=async(fn,label,limit=12000)=>{const start=Date.now();while(Date.now()-start<limit){try{const value=await fn();if(value)return value}catch{}await sleep(100)}throw new Error(`Timed out: ${label}`)}

let socket,id=0,pending=new Map(),sessionId
const call=(method,params={},session=sessionId)=>new Promise((resolve,reject)=>{const request=++id;pending.set(request,{resolve,reject});socket.send(JSON.stringify({id:request,method,params,...(session?{sessionId:session}:{})}))})
const attach=async(width=390)=>{const {targetId}=await call('Target.createTarget',{url:'http://127.0.0.1:4173/'},null);const attached=await call('Target.attachToTarget',{targetId,flatten:true},null);sessionId=attached.sessionId;await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:2,mobile:true});return targetId}
const js=async(expression)=>{const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result.value}
const text=async(value)=>waitFor(()=>js(`document.body?.innerText.includes(${JSON.stringify(value)})`),`text ${value}`)
const click=async(label)=>{const ok=await js(`(()=>{const all=[...document.querySelectorAll('button')];const el=all.find(x=>x.textContent.trim().includes(${JSON.stringify(label)})||x.getAttribute('aria-label')?.includes(${JSON.stringify(label)}));if(!el)return false;el.click();return true})()`);if(!ok)throw new Error(`Button not found: ${label}`);await sleep(120)}
const clickSelector=async(selector)=>{const ok=await js(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return false;el.click();return true})()`);if(!ok)throw new Error(`Selector not found: ${selector}`);await sleep(120)}
const fill=async(selector,value)=>{const ok=await js(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return false;const setter=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;setter.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);if(!ok)throw new Error(`Input not found: ${selector}`);await sleep(80)}
const pressEnter=async(selector)=>{await js(`document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}))`);await sleep(150)}
const assert=async(condition,label)=>{if(!await condition())throw new Error(label);console.log(`PASS ${label}`)}

try{
  await waitFor(async()=>{const response=await fetch('http://127.0.0.1:9333/json/version');return response.ok&&response.json()},'Edge debugger')
  const version=await (await fetch('http://127.0.0.1:9333/json/version')).json();socket=new WebSocket(version.webSocketDebuggerUrl)
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const item=pending.get(message.id);pending.delete(message.id);message.error?item.reject(new Error(message.error.message)):item.resolve(message.result)}}})
  await call('Target.setDiscoverTargets',{discover:true},null)
  let target=await attach();await text('Weekly shop')
  await js(`(async()=>{await new Promise(resolve=>{const request=indexedDB.deleteDatabase('smartshop');request.onsuccess=request.onerror=request.onblocked=()=>resolve()});localStorage.clear();localStorage.setItem('smartshop-state-v1',JSON.stringify({lists:[{id:'legacy',name:'Legacy survivor',storeId:'tesco-hackney',items:[],updatedAt:1}],activeListId:'legacy',corrections:{},favouriteStores:[]}));location.reload()})()`);await text('Legacy survivor')
  await assert(()=>js(`new Promise(resolve=>{const request=indexedDB.open('smartshop',3);request.onsuccess=()=>{const get=request.result.transaction('state').objectStore('state').get('app');get.onsuccess=()=>resolve(get.result?.lists?.[0]?.name==='Legacy survivor'&&!!get.result?.lists?.[0]?.syncId);get.onerror=()=>resolve(false)};request.onerror=()=>resolve(false)})`),'legacy local data migrates to IndexedDB with sync identifiers')
  await js(`(async()=>{await new Promise(resolve=>{const request=indexedDB.deleteDatabase('smartshop');request.onsuccess=request.onerror=request.onblocked=()=>resolve()});localStorage.clear();location.reload()})()`);await text('Weekly shop')

  await click('Open Settings');await text('SmartShop 0.4.0');await text('Build 5');await text('DEVELOPMENT PREVIEW');await text('Account setup required');console.log('PASS Settings opens current version history and honest unconfigured account state');await click('Close')

  await clickSelector('.add-list');await text('New shopping list');await click('List actions');await fill('.name-save input','Kitchen walk');await clickSelector('.name-save button');await text('Kitchen walk')
  await click('List actions');await click('Duplicate list');await text('Kitchen walk copy');await click('Kitchen walk');await assert(()=>js(`document.querySelector('h1')?.textContent==='Kitchen walk'`),'create, rename, duplicate and switch lists');await click('Weekly shop')

  await fill('input[placeholder^="Add milk"]','Dishwasher salt');await pressEnter('input[placeholder^="Add milk"]');await text('Dishwasher salt')
  await fill('input[placeholder^="Add milk"]','Bananas');await pressEnter('input[placeholder^="Add milk"]');await assert(()=>js(`[...document.querySelectorAll('.grocery-row')].find(x=>x.textContent.includes('Bananas'))?.textContent.includes('7')`),'catalogue/custom add and duplicate combining')
  await js(`[...document.querySelectorAll('.item-main')].find(x=>x.textContent.includes('Dishwasher salt')).click()`);await fill('.edit-item input','Dishwasher salt');await clickSelector('.quantity-stepper button:last-child');await fill('input[placeholder="pack"]','box');await fill('input[placeholder="Optional note"]','Large');await click('Save changes');await assert(()=>js(`document.body.innerText.includes('2 box · Large')`),'edit quantity, unit and notes')

  await clickSelector('.store-choice');await click('Dalston Junction');await text('List reordered for Dalston Junction');await assert(()=>js(`document.querySelector('.store-choice')?.textContent.includes('Dalston Junction')`),'change supermarket branch')
  const aldiOrder=await js(`[...document.querySelectorAll('.item-group>header strong')].map(x=>x.textContent).join('|')`);await clickSelector('.store-choice');await click('Hackney Morning Lane');const tescoOrder=await js(`[...document.querySelectorAll('.item-group>header strong')].map(x=>x.textContent).join('|')`);if(aldiOrder===tescoOrder)throw new Error('Branch ordering did not differ');console.log('PASS different branches produce different ordering')

  await click('Start shopping');await text('SHOPPING AT');await js(`[...document.querySelectorAll('.wrong')].find(x=>x.getAttribute('aria-label')?.includes('Coconut milk')).click()`);await click('Produce');await text('Coconut milk moved to Produce');await sleep(400);await call('Page.reload',{ignoreCache:false});await text('Coconut milk');await click('Start shopping');await assert(()=>js(`[...document.querySelectorAll('.shopping-section')].find(x=>x.querySelector('header strong')?.textContent==='Produce')?.textContent.includes('Coconut milk')`),'branch correction persists after reload')
  await js(`[...document.querySelectorAll('.big-check')].find(x=>x.getAttribute('aria-label')?.includes('Bananas')).click()`);await text('Undo');await click('Undo');await assert(()=>js(`!![...document.querySelectorAll('.big-check')].find(x=>x.getAttribute('aria-label')?.includes('Bananas'))`),'check off and undo completion')
  await js(`[...document.querySelectorAll('.big-check')].find(x=>x.getAttribute('aria-label')?.includes('Bananas')).click()`);await click('Completed');await js(`[...document.querySelectorAll('.completed-item button')][0].click()`);await assert(()=>js(`!![...document.querySelectorAll('.big-check')].find(x=>x.getAttribute('aria-label')?.includes('Bananas'))`),'restore completed item')
  await js(`[...document.querySelectorAll('.shopping-item-main')].find(x=>x.textContent.includes('Oat milk')).click()`);await fill('input[placeholder="Optional note"]','Cold');await click('Save changes');await click('Add item');await fill('.sheet-search input','Lemons');await click('Add “Lemons”');await text('Lemons');console.log('PASS add and edit during Shopping Mode')
  await click('Leave Shopping Mode');await assert(()=>js(`!document.querySelector('.shopping-mode')`),'enter and leave Shopping Mode')

  await js(`window.SpeechRecognition=class{start(){this.onresult({results:[{0:{transcript:'Add pasta and two tins of chopped tomatoes'},isFinal:true}]});this.onend()}stop(){this.onend?.()}}`);await clickSelector('.voice-button');await click('Start listening');await click('Review proposed changes');await assert(()=>js(`document.querySelectorAll('.voice-proposals>div').length===2`),'mocked voice recognition parses multiple products');await click('Apply 2 changes');await text('Chopped tomatoes')

  await call('Page.reload',{ignoreCache:false});await text('Dishwasher salt');console.log('PASS refresh preserves IndexedDB lists')
  for(const width of [320,360,390,412,430]){await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:2,mobile:true});await assert(()=>js(`document.documentElement.scrollWidth<=window.innerWidth`),`${width}px viewport has no horizontal overflow`)}
  await waitFor(()=>js(`navigator.serviceWorker?.controller!==null`),'service worker control');await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await call('Page.reload',{ignoreCache:false});await text('Offline — saved on this phone');await fill('input[placeholder^="Add milk"]','Offline pears');await pressEnter('input[placeholder^="Add milk"]');await text('Offline pears');await call('Page.reload',{ignoreCache:false});await text('Offline pears');console.log('PASS genuine offline reload and edit persistence')
  await call('Network.emulateNetworkConditions',{offline:false,latency:20,downloadThroughput:500000,uploadThroughput:500000});await text('Saved on this phone')
  await call('Target.closeTarget',{targetId:target},null);target=await attach(390);await text('Offline pears');console.log('PASS close and reopen preserves IndexedDB state')
  console.log('E2E_RESULT PASS')
} catch(error){console.error('E2E_RESULT FAIL',error);process.exitCode=1}
finally{try{socket?.close()}catch{}browser.kill();server.kill();await sleep(300);rmSync(profile,{recursive:true,force:true})}
