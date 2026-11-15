import fs from 'node:fs';
import path from 'node:path';
import {getDepartures,CORE_STOPS} from './departures-source.mjs';
import {officialMonitorURL} from './mobility-source.mjs';
const file=path.resolve(process.argv[2]||'departures.json');let old={stations:[]};try{old=JSON.parse(fs.readFileSync(file,'utf8'))}catch{}
const attemptedAt=new Date().toISOString(),results=[];for(const stop of CORE_STOPS){try{results.push({status:'fulfilled',value:await getDepartures(stop.id)})}catch(reason){results.push({status:'rejected',reason})}}
const stations=results.map((r,i)=>{const stop=CORE_STOPS[i];if(r.status==='fulfilled')return {...r.value,stationName:r.value.stationName||stop.name,status:'ok'};const previous=old.stations?.find(s=>s.stationId===stop.id);return {...(previous||{stationId:stop.id,stationName:stop.name,sourceURL:officialMonitorURL(stop.id),rows:[]}),status:'error',attemptedAt,error:String(r.reason?.message||r.reason).slice(0,180)};});
fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify({stations,attemptedAt,source:'moBiel / VRR Haltestellenmonitor'}));
console.log(JSON.stringify(stations.map(s=>({station:s.stationName,status:s.status,checkedAt:s.checkedAt,rows:s.rows.length}))));
if(stations.every(s=>s.status==='error'))console.warn('Abfahrtsquelle derzeit nicht bestätigt; ältere Prüfzeitpunkte wurden erhalten.');
