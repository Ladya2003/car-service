import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
const server=process.env.AMORELY_SERVER_DIR||path.resolve(import.meta.dirname,'../../Amorely/server');
const require=createRequire(path.join(server,'package.json'));
require('ts-node').register({project:path.join(server,'tsconfig.json')});
const {emptyWorkspace,createBooking,addBlock,getSlots,setSettings,updateBooking,nowInMinsk}=require(path.join(server,'src/carService/domain.ts'));
function nextDay(){let d=new Date(Date.now()+86400000);while(d.getUTCDay()===0)d=new Date(d.getTime()+86400000);return d.toISOString().slice(0,10);}
function body(extra={}){return {requestId:crypto.randomUUID(),serviceId:'diagnostics',date:nextDay(),time:'09:00',phone:'+375 (29) 000-00-01',consent:true,...extra};}
test('booking occupies its entire duration, not only the starting slot',()=>{const s=emptyWorkspace();createBooking(s,body(), 'website');assert.throws(()=>createBooking(s,body({time:'09:30'}),'website'),/время/);assert.ok(getSlots(s,nextDay(),'inspection').find(s=>s.time==='10:00').available);});
test('retries with the same request id do not create a second booking',()=>{const s=emptyWorkspace(),b=body();const a=createBooking(s,b,'website'),r=createBooking(s,b,'website');assert.equal(a.booking.id,r.booking.id);assert.equal(r.created,false);assert.equal(s.bookings.length,1);});
test('lunch, closed days and closing time cannot be booked',()=>{const s=emptyWorkspace();for(const time of ['12:30','13:00','18:30'])assert.throws(()=>createBooking(s,body({time}),'website'));});
test('occupied time cannot be closed or removed by changing hours',()=>{const s=emptyWorkspace();createBooking(s,body(),'website');assert.throws(()=>addBlock(s,{date:nextDay(),start:'09:00',end:'10:00'}));assert.throws(()=>setSettings(s,{...s.settings,open:'10:00'}));});
test('cancellation frees a slot; restoration checks conflicts',()=>{const s=emptyWorkspace(),a=createBooking(s,body(),'website').booking;updateBooking(s,a.id,{status:'cancelled'});createBooking(s,body(),'website');assert.throws(()=>updateBooking(s,a.id,{status:'confirmed'}));});
test('capacity allocates distinct bays',()=>{const s=emptyWorkspace();s.settings.capacity=2;assert.equal(createBooking(s,body(),'website').booking.bay,1);assert.equal(createBooking(s,body(),'website').booking.bay,2);assert.throws(()=>createBooking(s,body(),'website'));});
test('phone, consent, dates and field lengths are validated',()=>{for(const extra of [{phone:'abc'},{consent:false},{date:'2026-02-31'},{comment:'x'.repeat(501)},{time:'oops'}])assert.throws(()=>createBooking(emptyWorkspace(),body(extra),'website'));});
test('blocked time is hidden from booking',()=>{const s=emptyWorkspace();addBlock(s,{date:nextDay(),start:'10:00',end:'11:00',reason:'Перерыв'});assert.equal(getSlots(s,nextDay(),'diagnostics').find(x=>x.time==='10:00').available,false);});
test('Minsk clock consistently uses UTC+3',()=>assert.deepEqual(nowInMinsk(new Date('2026-11-09T22:30:00Z')),{date:'2026-11-10',time:'01:30'}));
