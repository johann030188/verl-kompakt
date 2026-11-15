import {getText,dom,all,txt} from './sources.mjs';
export const FAMILY_URLS={holidays:'https://www.schulministerium.nrw/service/ferienordnung-nrw-bis-2029-30',droste:'https://www.droste-haus.de/de/angebote-buchen/',holidayOffers:'https://www.droste-haus.de/de/fuer-jugendliche/ferienangebote/index.php'};
const months=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const isoDate=(day,month,year)=>`${year}-${String(months.indexOf(month)+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
export function parseSchoolHolidays(html,checkedAt=new Date().toISOString()){
 const r=dom(html),items=[];for(const tr of all(r,n=>n.tag==='tr')){const c=all(tr,n=>n.tag==='td'||n.tag==='th').map(txt);if(!['Sommer','Herbst','Weihnachten','Ostern','Pfingsten'].includes(c[0])||/Keine Pfingstferien/.test(c.join(' ')))continue;
  const dates=[...c.slice(1).join(' ').matchAll(new RegExp('(\\d{1,2})\\.\\s*('+months.join('|')+')\\s+(20\\d{2})','g'))].map(m=>isoDate(m[1],m[2],m[3]));if(!dates.length)throw Error('Ein Ferientermin hat kein auswertbares Datum');const [date,endDate=date]=dates;if(date>endDate)throw Error('Ungültiger Ferienzeitraum');items.push({id:'nrw-'+c[0].toLowerCase()+'-'+date,title:c[0]==='Weihnachten'?'Weihnachtsferien NRW':c[0]==='Ostern'?'Osterferien NRW':c[0]==='Pfingsten'?'Pfingstferien NRW':c[0]+'ferien NRW',date,endDate,type:'Schulferien',source:'Schulministerium NRW',sourceURL:FAMILY_URLS.holidays,checkedAt});
 }
 if(items.length<10)throw Error('Ferienordnung nicht vollständig auswertbar');return {items:[...new Map(items.map(i=>[i.id,i])).values()].sort((a,b)=>a.date.localeCompare(b.date)),sourceURL:FAMILY_URLS.holidays,checkedAt};
}
export async function schoolHolidays(){return parseSchoolHolidays(await getText(FAMILY_URLS.holidays));}
export async function familyRegistration(){
 const [offers,booking]=await Promise.all([getText(FAMILY_URLS.holidayOffers),getText(FAMILY_URLS.droste)]),text=txt(dom(offers)),b=txt(dom(booking));
 if(!/Ferienangebote|Ferienworkshops/.test(text)||!/(Kursprogramm|Kurse buchen)/.test(b))throw Error('Ferien-/Buchungsseite nicht eindeutig auswertbar');
 const checkedAt=new Date().toISOString(),items=[];const m=text.match(/Oster- und Sommerferien (20\d{2}).*?ab dem (\d{2})\.(\d{2})\.(\d{2,4}) buchbar/);
 const bookingNotice=/Online-Anmeldung.*?(?:nicht möglich|unmöglich)|Anmelden nur per E-Mail oder telefonisch/i.test(b)?'Anmeldung laut aktueller Programmseite derzeit nur per Telefon oder E-Mail. Teilnahme und Plätze direkt beim Droste-Haus prüfen.':'Anmeldeweg und verfügbare Plätze auf der aktuellen Programmseite prüfen.';
 if(m){const year=m[4].length===2?'20'+m[4]:m[4];items.push({id:'droste-ferien-anmeldestart-'+m[1],title:'Droste-Haus: angekündigter Anmeldestart für Oster- und Sommerferien '+m[1],date:`${year}-${m[3]}-${m[2]}`,endDate:`${year}-${m[3]}-${m[2]}`,type:'Anmeldung',source:'Droste-Haus',sourceURL:FAMILY_URLS.holidayOffers,note:bookingNotice,checkedAt});}
 return {items,sourceURL:FAMILY_URLS.holidayOffers,checkedAt,bookingNotice,bookingURL:FAMILY_URLS.droste};
}

export async function drosteCheck(){
 const html=await getText(FAMILY_URLS.droste),text=txt(dom(html));if(!/Kursprogramm|Kurse buchen/.test(text))throw Error('Droste-Programmseite nicht auswertbar');
 const programLinks=all(dom(html),n=>n.tag==='a'&&/canva\.link|canva\.com\/design/.test(n.attrs.href||'')).map(n=>({title:txt(n),url:n.attrs.href}));
 return {checkedAt:new Date().toISOString(),sourceURL:FAMILY_URLS.droste,programLinks,bookingNotice:/Anmelden nur per E-Mail oder telefonisch|Online-Anmeldung.*?nicht möglich/i.test(text)?'Anmeldung derzeit nur per Telefon oder E-Mail.':'Anmeldeweg auf der aktuellen Programmseite prüfen.'};
}
