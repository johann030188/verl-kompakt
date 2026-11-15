export const DAYS=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
export function berlinNow(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
 const date=`${parts.year}-${parts.month}-${parts.day}`,time=`${parts.hour}:${parts.minute}`;
 return {date,time,day:DAYS[(new Date(date+'T12:00:00Z').getUTCDay()+6)%7]};
}
export function publicHours(pool,date,day){
 const base=pool?.week?.find(d=>d.day===day)?.ranges||[];
 if(pool?.season?.status==='closed'&&date>=pool.season.closedSince)return [];
 const notice=pool?.notices?.find(n=>n.date===date);
 if(notice?.closed)return [];if(notice?.ranges)return notice.ranges;
 if(notice?.until)return base.filter(([a])=>a<notice.until).map(([a,b])=>[a,b<notice.until?b:notice.until]);return base;
}
export function nextSessions(data,now=new Date()){
 const {date,time}=berlinNow(now);return (data?.courses||[]).flatMap(c=>(c.sessions||[]).filter(s=>s.endDate>date||(s.endDate===date&&(s.date<date||s.time>=time))).map(s=>({...s,name:c.name,sourceURL:c.url,checkedAt:c.checkedAt}))).sort((a,b)=>(a.date+a.time+a.name).localeCompare(b.date+b.time+b.name));
}
