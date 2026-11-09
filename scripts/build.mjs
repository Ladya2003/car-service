import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const local=path.join(root,'.env.local');
if(fs.existsSync(local))for(const line of fs.readFileSync(local,'utf8').split(/\r?\n/)){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim();}
const base=(process.env.CAR_SERVICE_BASE_PATH||'/car-service/').replace(/\/?$/,'/');
const apiUrl=process.env.CAR_SERVICE_API_URL||'http://127.0.0.1:5086/api/car-service';
const site=(process.env.CAR_SERVICE_SITE_URL||'https://ladya2003.github.io/car-service').replace(/\/$/,'');
const out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});fs.cpSync(path.join(root,'web'),out,{recursive:true});
fs.writeFileSync(path.join(out,'config.js'),'window.CAR_SERVICE_CONFIG='+JSON.stringify({apiUrl,basePath:base})+';\n');
const services=[
['diagnostics','Диагностика автомобиля','45','60','Проверка автомобиля перед ремонтом','Начинаем с разговора о симптомах, осматриваем автомобиль и проверяем подходящие системы. После диагностики объясняем результат и согласуем дальнейшие действия.'],
['oil','Замена масла и фильтров','35','60','Регулярное обслуживание без спешки','Уточняем требования к маслу и фильтрам для вашего автомобиля. Стоимость материалов согласуется отдельно. Время визита включает подготовку и проверку после замены.'],
['brakes','Обслуживание тормозов','65','90','Сначала проверяем, затем согласуем','Осматриваем тормозную систему и обсуждаем необходимые работы. Замена деталей выполняется после согласования. Если требуется сложный ремонт, его длительность уточняется после осмотра.'],
['tires','Шиномонтаж','60','60','Сезонная смена колёс по записи','Уточняем размер колёс, меняем шины и выполняем балансировку. Ориентир цены относится к демонстрационному примеру: итог зависит от размера и состояния колёс.'],
['alignment','Развал-схождение','75','60','Проверка углов установки колёс','Перед регулировкой оцениваем состояние элементов подвески. Если обнаруживаются неисправности, сначала обсуждаем ремонт. Состав регулировки зависит от модели автомобиля.'],
['inspection','Осмотр перед ремонтом','25','30','Можно приехать с вопросом','Если вы пока не знаете, какую услугу выбрать, начните с первичного осмотра. Мастер уточнит симптомы и предложит подходящую диагностику.'],
];
for(const [id,name,price,duration,title,description]of services){
const dir=path.join(out,'services',id);fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'index.html'),'<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+name+' в Фаниполе — Смена · демо</title><meta name="description" content="'+title+'. '+name+' в демонстрационном автосервисе Смена. Стоимость от '+price+' BYN, длительность '+duration+' минут."><link rel="canonical" href="'+site+'/services/'+id+'/"><link rel="stylesheet" href="../../styles.css"><body><div class="demo-bar"><span>Демонстрационный автосервис</span><a href="../../admin/">Кабинет СТО ↗</a></div><header class="site-header container"><a class="brand" href="../../"><span class="brand-symbol">↗</span>смена<span class="brand-caption">автосервис</span></a><a class="button button-small" href="../../?service='+id+'#booking">Выбрать время ↗</a></header><main class="container service-detail"><a class="back-link" href="../../#services">← Все услуги</a><p class="eyebrow">Фаниполь · услуги автосервиса</p><h1>'+name+'</h1><p class="lead">'+title+'</p><div class="detail-meta"><span>от '+price+' BYN</span><span>'+duration+' минут</span><span>Материалы отдельно</span></div><p class="detail-copy">'+description+'</p><a class="button" href="../../?service='+id+'#booking">Выбрать дату и время <span>↗</span></a><div class="notice">Это вымышленный сервис для показа продукта. Цены, услуги и время — демонстрационные. Реальное обслуживание не производится.</div></main><footer class="container site-footer"><a href="../../">Смена · демонстрационный сайт</a><a href="../../privacy/">О данных</a></footer></body></html>');
}
fs.writeFileSync(path.join(out,'robots.txt'),'User-agent: *\nDisallow: /\n# Fictional demo: enable indexing only after replacing all demonstration content.\n');
fs.writeFileSync(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+site+'/</loc></url>'+services.map(([id])=>'<url><loc>'+site+'/services/'+id+'/</loc></url>').join('')+'</urlset>');
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('Built static site in dist/ · '+services.length+' service pages · API '+new URL(apiUrl).origin);
