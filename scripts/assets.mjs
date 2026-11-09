import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require('C:/Projects/Amorely/node_modules/sharp');
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'web/assets');fs.mkdirSync(dir,{recursive:true});
for(const [name,url,w,h]of [['workshop.jpg','https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1400&q=85',900,1100],['details.jpg','https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=1400&q=85',900,1000]]){
const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(name+' HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());await sharp(b).resize(w,h,{fit:'cover'}).jpeg({quality:84,mozjpeg:true}).toFile(path.join(dir,name));console.log(name+' saved');}
