import fs from 'node:fs';
import {collect,URLS} from './sources.mjs';
const file=new URL('./live.json',import.meta.url);
const old=JSON.parse(fs.readFileSync(file));
const fresh=await collect();
delete fresh.material;
const statuses=fresh.statuses.map(s=>{const previous=old.statuses?.find(x=>x.id===s.id);return s.status==='error'?{...s,label:previous?.label||s.label,checkedAt:previous?.checkedAt}:s;});
const merged={...old,...fresh,statuses,urls:URLS};
const program=new URL('./droste-program.json',import.meta.url);if(fs.existsSync(program)){merged.droste=JSON.parse(fs.readFileSync(program,'utf8'));if(merged.drosteCheck&&merged.droste.programSourceLink)merged.drosteCheck.programChanged=!merged.drosteCheck.programLinks?.some(p=>(typeof p==='string'?p:p.url)===merged.droste.programSourceLink);}
if(merged.police){const items=[...(old.police?.items||[]),...(fresh.police?.items||[])];merged.police={...merged.police,items:[...new Map(items.map(x=>[x.id,x])).values()].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,250)};}
if(merged.flyProgram?.news?.status==='error'&&old.flyProgram?.news)merged.flyProgram.news={...old.flyProgram.news,...merged.flyProgram.news,checkedAt:old.flyProgram.news.checkedAt};
if(fresh.venueEvents){const failed=fresh.venueEvents.sources.filter(s=>s.status==='error').map(s=>s.id);merged.venueEvents={...fresh.venueEvents,items:[...fresh.venueEvents.items,...(old.venueEvents?.items||[]).filter(e=>failed.includes(e.sourceKey))],sources:fresh.venueEvents.sources.map(s=>s.status==='error'?{...s,checkedAt:old.venueEvents?.sources?.find(x=>x.id===s.id)?.checkedAt}:s)};}
fs.writeFileSync(file,JSON.stringify(merged));
console.log(JSON.stringify({statuses:statuses.map(s=>({source:s.id,status:s.status,checkedAt:s.checkedAt})),events:merged.events?.length,table:merged.sports?.standings?.length}));
if(statuses.every(s=>s.status==='error'))throw new Error('Alle Quellenabrufe fehlgeschlagen; letzte bestätigte Daten wurden erhalten.');
