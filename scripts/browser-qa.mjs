import fs from 'node:fs';import path from 'node:path';import {spawn}from'node:child_process';import{createRequire}from'node:module';import assert from'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),runtime=path.join(root,'.runtime'),out=path.join(runtime,'screenshots');fs.mkdirSync(out,{recursive:true});
const profile=path.join(runtime,'chrome-'+Date.now());fs.mkdirSync(profile,{recursive:true});const wait=ms=>new Promise(r=>setTimeout(r,ms));
const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;const bookingName='Browser QA '+Date.now();let savedId=null;const errors=[];
try{
const pf=path.join(profile,'DevToolsActivePort');for(let i=0;i<60&&!fs.existsSync(pf);i++)await wait(200);const port=fs.readFileSync(pf,'utf8').split('\n')[0];const pages=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let id=0;const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
async function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('CDP timeout '+method));},15000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function until(expression){for(let i=0;i<90;i++){if(await evaluate(expression))return;await wait(250);}throw Error('Condition timeout: '+expression);}
async function navigate(url,width,height,mobile){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await send('Page.navigate',{url});await until('document.readyState==="complete"');await wait(500);}
async function capture(name,full=false){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:full,fromSurface:true,...(full?{clip:{x:0,y:0,width:1440,height:Math.min(await evaluate('document.documentElement.scrollHeight'),6500),scale:1}}:{})});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(shot.data,'base64'));}
await send('Page.enable');await send('Runtime.enable');
const base=process.env.CAR_SERVICE_TEST_SITE||'http://127.0.0.1:4175/car-service/';
await navigate(base,1440,1000,false);await until('!!document.querySelector("#booking-service")');
assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await capture('desktop',true);
await navigate(base,390,844,true);await until('!!document.querySelector("#booking-service")');assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await capture('mobile');
await evaluate('document.querySelector("#booking-service").value="inspection";document.querySelector("#booking-service").dispatchEvent(new Event("change",{bubbles:true}));document.querySelector("#booking-panel .panel-actions .button").click()');
await until('!!document.querySelector("#booking-date")');
const apiBase=process.env.CAR_SERVICE_TEST_API||'http://127.0.0.1:5086/api/car-service';const config=await(await fetch(apiBase+'/config')).json();let date,slot;for(let i=1;i<8&&!slot;i++){date=new Date(new Date(config.today+'T12:00:00Z').getTime()+i*86400000).toISOString().slice(0,10);const r=await(await fetch(apiBase+'/slots?date='+date+'&serviceId=inspection')).json();slot=r.slots.find(s=>s.available)?.time;}
await evaluate('document.querySelector("#booking-date").value='+JSON.stringify(date)+';document.querySelector("#booking-date").dispatchEvent(new Event("change",{bubbles:true}))');await until('Array.from(document.querySelectorAll(".time-slot")).some(b=>!b.disabled)');
await evaluate('Array.from(document.querySelectorAll(".time-slot")).find(b=>b.textContent==='+JSON.stringify(slot)+').click();document.querySelector("#booking-panel .panel-actions .button").click()');await until('!!document.querySelector("#booking-contact")');
await evaluate('const f=document.querySelector("#booking-contact");for(const [n,v]of Object.entries('+JSON.stringify({phone:'+375290000001',name:bookingName,car:'Тестовый автомобиль'})+')){f.elements[n].value=v;f.elements[n].dispatchEvent(new Event("input",{bubbles:true}));}f.elements.consent.checked=true;f.elements.consent.dispatchEvent(new Event("change",{bubbles:true}));f.requestSubmit()');await until('!!document.querySelector(".panel-success")');await evaluate('document.querySelector("#booking").scrollIntoView()');await capture('booking-success');
await navigate(base+'admin/',1440,1000,false);await until('!!document.querySelector("#admin-password")');
const password=fs.readFileSync(path.join(root,'MVP-access.local.txt'),'utf8').match(/Пароль: (.+)/)[1];
await evaluate('document.querySelector("#admin-password").value='+JSON.stringify(password)+';document.querySelector(".login-card form").requestSubmit()');
await until('!!document.querySelector(".bookings-table")');
assert.ok(await evaluate('document.querySelector(".bookings-table").textContent.includes('+JSON.stringify(bookingName)+')'));
await capture('admin');
await evaluate('Array.from(document.querySelectorAll(".bookings-table tbody tr")).find(r=>r.textContent.includes('+JSON.stringify(bookingName)+')).querySelector("button").click()');await until('!!document.querySelector("dialog[open]")');
await evaluate('const d=document.querySelector("dialog");d.querySelector("[name=status]").value="confirmed";d.querySelector("[name=note]").value="Проверено через интерфейс";d.querySelector("form").requestSubmit()');await until('!document.querySelector("dialog[open]")');
await navigate(base+'admin/',390,844,true);await until('!!document.querySelector(".admin-layout")');assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await capture('admin-mobile');
assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,browserErrors:errors,checks:['desktop layout','mobile layout','public booking','admin login','record visible','status update','admin mobile'],screenshots:out}));
await send('Browser.close').catch(()=>{});
}finally{
if(ws)ws.close();if(child.exitCode===null)child.kill();
const server=path.resolve(root,'../Amorely/server'),require=createRequire(path.join(server,'package.json'));require('ts-node').register({project:path.join(server,'tsconfig.json')});const mongoose=require('mongoose');require('dotenv').config({path:path.join(server,'.env')});const{mutateWorkspace}=require(path.join(server,'src/carService/store.ts'));
await mongoose.connect(process.env.MONGODB_URI);await mutateWorkspace(s=>{s.bookings=s.bookings.filter(b=>b.name!==bookingName);});await mongoose.disconnect();
}
