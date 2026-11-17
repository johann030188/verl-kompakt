import {readFile,writeFile,rename} from 'node:fs/promises';
import {refreshOpeningHours} from './opening-hours-source.mjs';

const path=new URL('./opening-hours.json',import.meta.url);
let previous={items:[],checkedAt:null};
try{previous=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const data=await refreshOpeningHours(previous);
const temporary=new URL('./opening-hours.json.tmp',import.meta.url);
await writeFile(temporary,JSON.stringify(data,null,2)+'\n');
await rename(temporary,path);
for(const item of data.items)console.log(`${item.id}: ${item.status}${item.error?' — '+item.error:''}${item.extraSources?.some(x=>x.status==='error')?' — Zusatzquelle eingeschränkt':''}`);
if(data.items.every(x=>x.status==='error'))process.exitCode=1;
