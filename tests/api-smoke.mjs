import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{createRequire}from'node:module';
const root=path.resolve(import.meta.dirname,'..'),server=path.resolve(root,'../Amorely/server'),require=createRequire(path.join(server,'package.json'));
require('ts-node').register({project:path.join(server,'tsconfig.json')});const mongoose=require('mongoose'),dotenv=require('dotenv');dotenv.config({path:path.join(server,'.env')});
const {mutateWorkspace}=require(path.join(server,'src/carService/store.ts'));
const base=process.env.CAR_SERVICE_TEST_API||'http://127.0.0.1:5086/api/car-service';const ids=[],blockIds=[],prefix='smoke-'+crypto.randomUUID();
async function call(url,body,token,method=body?'POST':'GET'){const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return{status:r.status,body:await r.json()};}
try{
const config=await call('/config');assert.equal(config.status,200);assert.equal(config.body.ready,true);assert.equal((await call('/admin/state')).status,401);
const password=fs.readFileSync(path.join(root,'MVP-access.local.txt'),'utf8').match(/Пароль: (.+)/)[1];
const login=await call('/admin/login',{password});assert.equal(login.status,200);const token=login.body.token;
let date,slot;
for(let i=1;i<8&&!slot;i++){date=new Date(new Date(config.body.today+'T12:00:00Z').getTime()+i*86400000).toISOString().slice(0,10);const r=await call('/slots?date='+date+'&serviceId=inspection');slot=r.body.slots.find(s=>s.available)?.time;}
assert.ok(slot,'No free slot for smoke test');
const payload={requestId:prefix,serviceId:'inspection',date,time:slot,phone:'+375290000001',name:'Проверка демо',consent:true};
const results=await Promise.all([call('/bookings',payload),call('/bookings',{...payload,requestId:prefix+'-other'})]);
assert.equal(results.filter(r=>r.status===201).length,1,'Only one parallel request can occupy the slot');assert.equal(results.filter(r=>r.status===409).length,1);
const won=results.find(r=>r.status===201),winnerId=won.body.booking.id;ids.push(winnerId);
const winningPayload=results[0].status===201?payload:{...payload,requestId:prefix+'-other'};
const retry=await call('/bookings',winningPayload);assert.equal(retry.status,200);assert.equal(retry.body.booking.id,winnerId);
assert.equal((await call('/admin/blocks',{date,start:slot,end:String(Number(slot.slice(0,2))+1).padStart(2,'0')+':'+slot.slice(3),reason:'smoke'},token)).status,409);
assert.equal((await call('/admin/bookings/'+winnerId,{status:'confirmed',note:'Проверено автоматически'},token,'PATCH')).status,200);
const admin=await call('/admin/state',undefined,token);assert.ok(admin.body.bookings.some(b=>b.id===winnerId&&b.status==='confirmed'));
const publicSlots=await call('/slots?date='+date+'&serviceId=inspection');assert.equal(publicSlots.body.slots.find(s=>s.time===slot).available,false);assert.ok(!JSON.stringify(publicSlots.body).includes('+375'));
assert.equal((await call('/admin/bookings/'+winnerId,{status:'cancelled'},token,'PATCH')).status,200);
const free=await call('/slots?date='+date+'&serviceId=inspection');assert.equal(free.body.slots.find(s=>s.time===slot).available,true);
assert.equal((await call('/bookings',{...payload,requestId:crypto.randomUUID(),phone:'invalid'})).status,400);
console.log(JSON.stringify({ok:true,checks:['admin auth','parallel conflict','idempotent retry','block conflict','status persistence','public data isolation','cancellation releases slot','validation']}));
}finally{
await mongoose.connect(process.env.MONGODB_URI);
await mutateWorkspace(s=>{s.bookings=s.bookings.filter(b=>!b.requestId.startsWith(prefix));s.blocks=s.blocks.filter(b=>!blockIds.includes(b.id));});
await mongoose.disconnect();
}
