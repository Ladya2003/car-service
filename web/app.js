import { api, money, dateLabel, element as el, requestId } from './lib/api.js';
const panel=document.querySelector('#booking-panel');
const state={config:null,step:1,serviceId:'',date:'',time:'',slots:[],loading:false,name:'',phone:'',car:'',comment:'',consent:false,requestId:requestId(),error:'',sending:false,receipt:null};
let slotVersion=0;
const service=()=>state.config?.services.find(s=>s.id===state.serviceId);
function field(label,control,hint=''){const wrapper=el('label','field');wrapper.append(el('span','',label),control);if(hint)wrapper.append(el('small','field-hint',hint));return wrapper;}
function input(name,placeholder,type='text'){const i=el('input');i.name=name;i.type=type;i.placeholder=placeholder;i.value=state[name];i.maxLength=name==='phone'?40:name==='car'?100:80;i.addEventListener('input',()=>{state[name]=i.value;});return i;}
function resetRequest(){state.requestId=requestId();state.error='';}
function dateAdd(date,days){return new Date(new Date(date+'T12:00:00Z').getTime()+days*86400000).toISOString().slice(0,10);}
function setDate(date){state.date=date;state.time='';resetRequest();void loadSlots();}
function showError(message){state.error=message;const box=panel.querySelector('.form-error');if(box){box.textContent=message;box.scrollIntoView({block:'nearest',behavior:'smooth'});}else render();}
async function loadSlots(){const version=++slotVersion;state.loading=true;state.error='';state.slots=[];render();
try{const result=await api('/slots?date='+encodeURIComponent(state.date)+'&serviceId='+encodeURIComponent(state.serviceId));if(version!==slotVersion)return;state.slots=result.slots;}
catch(e){if(version!==slotVersion)return;state.error=e.message;}
finally{if(version===slotVersion){state.loading=false;render();}}}
function summary(){const s=service(),box=el('div','booking-summary');box.append(el('strong','',s.name),el('div','',dateLabel(state.date)+' · '+state.time),el('span','',s.duration+' мин · от '+money(s.price)+' за работу'));return box;}
function progress(){const p=el('div','booking-progress');p.setAttribute('aria-label','Шаг '+state.step+' из 3');for(let i=1;i<=3;i++)p.append(el('span',i<=state.step?'active':''));return p;}
function heading(label,title){panel.append(el('p','booking-step-label',label),el('h3','',title));}
function actions(nextText,next,back){const box=el('div','panel-actions');if(back){const b=el('button','back-button','← Назад');b.type='button';b.onclick=back;box.append(b);}const b=el('button','button',nextText);b.type='button';b.onclick=next;box.append(b);panel.append(box);return b;}
function render(){
panel.replaceChildren();panel.setAttribute('aria-busy',String(state.loading||state.sending));
if(state.receipt){const wrap=el('div','panel-success');wrap.setAttribute('role','status');wrap.append(el('div','panel-success-icon','✓'),el('p','booking-step-label','Заявка получена'),el('h3','','Всё получилось!'),el('p','','Тестовая заявка появилась в кабинете СТО. Реального визита и звонка не будет.'),summary(),el('p','field-hint','Номер заявки: '+state.receipt.id.slice(0,8)));const button=el('button','button','Попробовать ещё раз ↗');button.onclick=()=>{state.receipt=null;state.step=1;state.time='';resetRequest();render();};wrap.append(button);panel.append(wrap);return;}
if(!state.config){heading('Онлайн-запись','Расписание временно недоступно');panel.append(el('p','status-message',state.error||'Не удалось загрузить расписание.'));const b=el('button','button','Попробовать ещё раз');b.style.marginTop='20px';b.onclick=init;panel.append(b);return;}
panel.append(progress());
if(state.step===1){
heading('Шаг 1 из 3','С чего начнём?');panel.append(el('p','panel-subtitle','Выберите услугу. Для неизвестной проблемы подойдёт осмотр.'));
const select=el('select');select.id='booking-service';select.name='service';const empty=el('option','','Выберите услугу');empty.value='';select.append(empty);
for(const s of state.config.services){const option=el('option','',s.name+' · от '+money(s.price));option.value=s.id;select.append(option);}select.value=state.serviceId;select.onchange=()=>{state.serviceId=select.value;state.time='';resetRequest();render();};panel.append(field('Услуга',select));
if(service()){const box=el('div','notice');box.append(el('strong','',service().duration+' минут · от '+money(service().price)),el('p','',service().description));panel.append(box);}
const b=actions('Выбрать дату и время ↗',()=>{if(!service())return;state.step=2;void loadSlots();});b.disabled=!service()||!state.config.ready;
if(!state.config.ready)panel.append(el('p','status-message','Демонстрация записи ещё настраивается. Попробуйте позже.'));
}else if(state.step===2){
heading('Шаг 2 из 3','Найдём удобное время');panel.append(el('p','panel-subtitle',service().name+' · '+service().duration+' минут · время Минска'));
const strip=el('div','date-strip');strip.setAttribute('aria-label','Ближайшие даты');
const stripStart=state.date<state.config.today?state.config.today:state.date;
for(let d=0;d<5;d++){const date=dateAdd(stripStart,d);if(date>dateAdd(state.config.today,59))break;const b=el('button','date-tile');b.type='button';b.setAttribute('aria-pressed',String(date===state.date));b.setAttribute('aria-label',dateLabel(date));const dt=new Date(date+'T12:00:00Z');b.append(el('small','',dt.toLocaleDateString('ru-BY',{weekday:'short'})),el('strong','',String(dt.getUTCDate())),el('small','',dt.toLocaleDateString('ru-BY',{month:'short'})));b.onclick=()=>setDate(date);strip.append(b);}panel.append(strip);
const date=el('input');date.type='date';date.id='booking-date';date.min=state.config.today;date.max=dateAdd(state.config.today,59);date.value=state.date;date.onchange=()=>{if(date.validity.valid&&date.value)setDate(date.value);};panel.append(field('Или выберите другую дату',date));
if(state.loading)panel.append(el('p','status-message','Проверяем свободное время…'));
else if(!state.slots.some(s=>s.available)&&!state.error)panel.append(el('div','notice','На эту дату свободных окон нет. Выберите другой день.'));
else{const grid=el('div','time-grid');grid.setAttribute('aria-label','Доступное время');for(const slot of state.slots){const b=el('button','time-slot',slot.time);b.type='button';b.disabled=!slot.available;b.setAttribute('aria-pressed',String(state.time===slot.time));b.onclick=()=>{state.time=slot.time;resetRequest();render();};grid.append(b);}panel.append(grid,el('p','slot-caption','Зачёркнутое время занято или недоступно.'));}
const b=actions('Продолжить ↗',()=>{state.step=3;state.error='';render();},()=>{slotVersion++;state.step=1;state.error='';render();});b.disabled=!state.time||state.loading;
}else{
heading('Шаг 3 из 3','Оставьте контакт');panel.append(el('p','panel-subtitle','Без регистрации и предоплаты. В этой демке звонков не будет.'),summary());
const form=el('form');form.id='booking-contact';const phone=input('phone','+375 (29) 000-00-01','tel');phone.id='booking-phone';phone.required=true;phone.autocomplete='tel';phone.inputMode='tel';form.append(field('Телефон *',phone,'Для демо используйте вымышленный номер: +375 (29) 000-00-01.'));
const name=input('name','Как к вам обращаться');name.autocomplete='given-name';form.append(field('Имя · необязательно',name));
form.append(field('Автомобиль · необязательно',input('car','Например, Volkswagen Golf')));
const comment=el('textarea');comment.name='comment';comment.placeholder='Что стоит знать мастеру?';comment.maxLength=500;comment.value=state.comment;comment.oninput=()=>state.comment=comment.value;form.append(field('Комментарий · необязательно',comment));
const hp=el('input','honeypot');hp.name='website';hp.tabIndex=-1;hp.autocomplete='off';hp.setAttribute('aria-hidden','true');form.append(hp);
const consent=el('label','consent'),checkbox=el('input');checkbox.type='checkbox';checkbox.name='consent';checkbox.required=true;checkbox.checked=state.consent;checkbox.onchange=()=>state.consent=checkbox.checked;const text=el('span');text.append(document.createTextNode('Согласен на обработку данных для тестовой заявки. '));const link=el('a','','Как используются данные');link.href='privacy/';link.target='_blank';link.rel='noopener';text.append(link);consent.append(checkbox,text);form.append(consent);
const error=el('div','form-error',state.error);error.setAttribute('role','alert');form.append(error);
const box=el('div','panel-actions'),back=el('button','back-button','← Назад'),send=el('button','button',state.sending?'Отправляем…':'Оставить тестовую заявку ↗');back.type='button';back.disabled=state.sending;back.onclick=()=>{state.step=2;void loadSlots();};send.type='submit';send.disabled=state.sending;box.append(back,send);form.append(box);
form.onsubmit=async event=>{event.preventDefault();if(state.sending||!form.reportValidity())return;state.sending=true;state.error='';send.disabled=true;send.textContent='Отправляем…';try{const result=await api('/bookings',{method:'POST',body:JSON.stringify({serviceId:state.serviceId,date:state.date,time:state.time,phone:state.phone,name:state.name,car:state.car,comment:state.comment,consent:state.consent,website:hp.value,requestId:state.requestId})});state.receipt=result.booking;render();}
catch(e){if(e.status===409){state.time='';state.step=2;await loadSlots();showError(e.message);}else showError(e.message);}
finally{state.sending=false;panel.setAttribute("aria-busy","false");if(!state.receipt){send.disabled=false;send.textContent='Оставить тестовую заявку ↗';}}};
panel.append(form);return;
}
const error=el('div','form-error',state.error);error.setAttribute('role','alert');panel.append(error);
}
async function init(){panel.replaceChildren(el('div','booking-loading','Загружаем расписание…'));try{state.config=await api('/config');state.date=state.date||state.config.today;const selected=new URLSearchParams(location.search).get('service');if(selected&&state.config.services.some(s=>s.id===selected))state.serviceId=selected;
const h=document.querySelector('#contact-hours');if(h){const days=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];h.textContent=state.config.settings.weekdays.map(d=>days[d]).join(', ')+' · '+state.config.settings.open+'–'+state.config.settings.close;}render();}catch(e){state.config=null;state.error=e.message;render();}}
for(const b of document.querySelectorAll('[data-service]'))b.addEventListener('click',()=>{state.serviceId=b.dataset.service;state.step=1;state.receipt=null;resetRequest();render();document.querySelector('#booking').scrollIntoView({behavior:'smooth'});});
const menu=document.querySelector('.menu-toggle'),mobile=document.querySelector('#mobile-nav');
menu?.addEventListener('click',()=>{mobile.hidden=!mobile.hidden;menu.setAttribute('aria-expanded',String(!mobile.hidden));});
mobile?.addEventListener('click',event=>{if(event.target.closest('a')){mobile.hidden=true;menu.setAttribute('aria-expanded','false');}});
const cta=document.querySelector('.mobile-booking-cta');
if(cta&&'IntersectionObserver'in window)new IntersectionObserver(entries=>cta.classList.toggle('in-booking',entries[0].isIntersecting),{threshold:.1}).observe(document.querySelector('#booking'));
void init();
