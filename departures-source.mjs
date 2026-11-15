import {officialMonitorURL} from './mobility-source.mjs';
export const DEPARTURES_API='https://haltestellenmonitor.vrr.de/backend/api/stations/table';
export const CORE_STOPS=[
 {id:23006753,name:'Verl Bahnhof'},
 {id:23006782,name:'Verl Pausheide'},
 {id:23006771,name:'Verl Jagdhütte'},
 {id:23006774,name:'Verl Freibad'}
];
const text=s=>String(s||'').replace(/\\u([0-9a-f]{4})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16))).replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
const unix=s=>/^\d{10}$/.test(String(s))?+s:null;
export function parseDepartures(payload,stationId,checkedAt=new Date().toISOString()){
 if(!Array.isArray(payload?.departureData))throw Error('Keine gültigen Abfahrtsdaten');
 const sourceTime=unix(payload.currentTimeReal);if(!sourceTime)throw Error('Der Zeitstempel der Verkehrsquelle fehlt');
 const rows=payload.departureData.map(r=>{const departure=unix(r.fullTime),scheduled=unix(r.orgFullTime);if(!departure||!scheduled||!r.lineNumber||!r.direction)return null;return {id:`${stationId}-${r.lineCode||r.lineNumber}-${scheduled}-${r.directionCode||r.key||''}`,line:text(r.lineNumber),direction:text(r.direction),departureAt:new Date(departure*1000).toISOString(),scheduledAt:new Date(scheduled*1000).toISOString(),hasRealtime:r.isRealTime===true,delayMinutes:r.isRealTime===true&&/^[-+]?\d+$/.test(String(r.delay))?+r.delay:null,platform:text(r.platform),supplement:text(r.supplement)};}).filter(Boolean).filter(r=>Date.parse(r.departureAt)>=sourceTime*1000-30000).sort((a,b)=>a.departureAt.localeCompare(b.departureAt));
 if(payload.departureData.length&&!rows.length&&payload.departureData.some(r=>!unix(r.fullTime)))throw Error('Abfahrtsformat geändert; letzte bestätigte Daten erhalten');
 return {stationId:+stationId,stationName:text(payload.stationName),sourceTime:new Date(sourceTime*1000).toISOString(),checkedAt,source:'moBiel / VRR Haltestellenmonitor',sourceURL:officialMonitorURL(stationId),rows};
}
export async function getDepartures(stationId,{fetcher=fetch,now=()=>new Date()}={}){
 if(!Number.isInteger(+stationId)||+stationId<=0)throw Error('Ungültige Haltestelle');
 const stationName=CORE_STOPS.find(s=>s.id===+stationId)?.name||String(stationId);
 const body=new URLSearchParams();const fields={stationId:+stationId,stationName,platformVisibility:1,useAllLines:1,rowCount:6,refreshInterval:60,distance:0,optimizedForStation:0,transport:'5',marquee:0,rowNumberMode:0,rowDisplay:0};
 for(const[k,v]of Object.entries(fields))body.set(`table[departure][${k}]`,String(v));body.set('table[sortBy]','1');
 const response=await fetcher(DEPARTURES_API,{method:'POST',body,signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Abfahrtsquelle antwortet mit HTTP '+response.status);
 const checked=now(),data=parseDepartures(await response.json(),stationId,checked.toISOString());
 if(Math.abs(checked.getTime()-Date.parse(data.sourceTime))>15*60*1000)throw Error('Die Verkehrsquelle liefert einen veralteten Zeitstempel');
 return data;
}
