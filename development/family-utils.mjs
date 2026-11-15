export const FAMILY_DAYS=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
export function fitsAge(offer,age){
 if(!Number.isFinite(age)||age<7||/Vorschul|Kindergarten|Krabbel|Baby|Eltern.?Kind/i.test(offer.title||''))return false;
 if(offer.schoolGroup==='primary'&&offer.minAge==null&&offer.maxAge==null)return age>=7&&age<=10;
 if(offer.minAge==null&&offer.maxAge==null)return false;
 return age>=(offer.minAge??7)&&age<=(offer.maxAge??17);
}
export function currentOffer(offer,today){
 if(offer.canceled)return false;
 if(offer.endDate)return offer.endDate>=today;
 if(offer.sessions===1&&offer.startDate)return offer.startDate>=today;
 if(offer.startDate&&offer.startDate<today){const days=(Date.parse(today+'T12:00:00Z')-Date.parse(offer.startDate+'T12:00:00Z'))/86400000;return days<90;}
 return true;
}
export function filterOffers(offers,{age1=7,age2=10,ageMode='either',provider='Alle',category='Alle',weekday='Alle',availability='Alle',query='',today='',gender='all'}={}){
 const q=query.toLocaleLowerCase('de');return offers.filter(o=>currentOffer(o,today)&&
 (ageMode==='first'?fitsAge(o,age1):ageMode==='second'?fitsAge(o,age2):ageMode==='both'?fitsAge(o,age1)&&fitsAge(o,age2):fitsAge(o,age1)||fitsAge(o,age2))&&
 (provider==='Alle'||o.provider===provider)&&(category==='Alle'||o.category===category)&&(weekday==='Alle'||o.weekday===weekday||o.weekly?.some(w=>w.weekday===weekday))&&
 (availability==='Alle'||availability==='new'&&(o.kind==='regular-sport'||o.startDate&&o.startDate>=today)&&!['waitlist','full','canceled'].includes(o.bookingStatus))&&
 (gender==='all'||o.gender!==(gender==='girls'?'boys':'girls'))&&(!q||(o.title+' '+(o.category||'')+' '+(o.ageLabel||'')).toLocaleLowerCase('de').includes(q))
 ).sort((a,b)=>{const ongoingA=a.startDate&&a.startDate<today,ongoingB=b.startDate&&b.startDate<today;return Number(ongoingA)-Number(ongoingB)||(a.startDate||'9999').localeCompare(b.startDate||'9999')||a.title.localeCompare(b.title,'de')});
}
export function familyCalendar(data,today){
 const dates=[...(data.schoolHolidays?.items||[]),...(data.familyRegistration?.items||[])];
 for(const o of [...(data.droste?.offers||[]),...(data.tvKids?.offers||[...(data.tvSports?.offers||[]),...(data.tvCourses?.offers||[])])]){if(!o.startDate||o.startDate<today||!currentOffer(o,today)||!Array.from({length:11},(_,i)=>fitsAge(o,i+7)).some(Boolean))continue;dates.push({id:'course-'+o.id,title:o.title,date:o.startDate,endDate:o.sessions===1?o.startDate:o.endDate||o.startDate,type:'Kinderangebot',time:o.time,source:o.provider,sourceURL:o.sourceURL,checkedAt:o.checkedAt,note:o.sessions>1?'Kursstart · weitere Termine beim Anbieter prüfen':o.note||'',offer:o});}
 for(const e of data.events||[]){if(e.category==='Familie'&&e.date>=today&&!/Vorschul|Kindergarten|Krabbel|Baby|Eltern.?Kind/i.test(e.title||''))dates.push({...e,type:'Familientermin',source:'Stadt Verl',sourceURL:e.url,endDate:e.date});}
 return dates.filter(d=>(d.endDate||d.date)>=today).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
}
export function downloadFamilyCalendar(items){
 const escape=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Verl kompakt//Familienkalender//DE','CALSCALE:GREGORIAN','X-WR-CALNAME:Verl Familienkalender'];
 for(const e of items){const next=new Date((e.endDate||e.date)+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);lines.push('BEGIN:VEVENT','UID:'+escape(e.id)+'@verl-kompakt','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z/,'Z'),'DTSTART;VALUE=DATE:'+e.date.replaceAll('-',''),'DTEND;VALUE=DATE:'+next.toISOString().slice(0,10).replaceAll('-',''),'SUMMARY:'+escape(e.title),'DESCRIPTION:'+escape([e.time?'Uhrzeit: '+e.time:'',e.note,'Quelle: '+e.sourceURL].filter(Boolean).join('\n')),'URL:'+e.sourceURL,'END:VEVENT');}
 lines.push('END:VCALENDAR');const a=document.createElement('a'),u=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}));a.href=u;a.download='Verl-Familienkalender.ics';a.click();setTimeout(()=>URL.revokeObjectURL(u),30000);
}
