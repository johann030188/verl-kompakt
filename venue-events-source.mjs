export const VENUE_URLS={hall:'https://www.verl.de/freizeit-kultur/veranstaltungskalender/veranstaltungsort/ostwestfalenhalle-kaunitz-81.html',flea:'https://www.flohmarktmitflair.de/index.php/termine',listing:'https://www.marktcom.de/veranstaltung/verler-schuetzenhalle-drinnen-und-draussen-33415-verl?term_id=1172064',oldtimer:'https://thejukin50s.club/'};
const months=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
export function parseHallEvents(html,helpers,checkedAt=new Date().toISOString()){
 const {all,dom,txt}=helpers,rows=all(dom(html),n=>n.tag==='a'&&/\/veranstaltung\//.test(n.attrs.href||''));
 const items=rows.flatMap(n=>{const text=txt(n),m=text.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,2})[.:](\d{2})\s+Uhr\s*\|\s*(.+)/);if(!m)return [];const date=m[3]+'-'+m[2]+'-'+m[1],url=new URL(n.attrs.href,VENUE_URLS.hall).href;return [{id:'halle-'+date+'-'+m[6].toLowerCase().replace(/[^a-z0-9]+/g,'-'),title:m[6],date,time:m[4].padStart(2,'0')+':'+m[5],location:'Ostwestfalenhalle Kaunitz',category:/markt|basar/i.test(m[6])?'Märkte':/oldtimer|straßenkreuzer/i.test(m[6])?'Oldtimer':'Kultur',source:'Stadt Verl',sourceKey:'hall',url,sourceURL:url,checkedAt}];});
 if(!items.length)throw Error('Einzeltermine der Ostwestfalenhalle nicht auswertbar.');return items;
}
export function parseFleaListing(html,official,helpers,checkedAt=new Date().toISOString()){
 const {decode,txt,dom}=helpers,blocks=[...html.matchAll(/<script[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi)].flatMap(m=>{try{return [JSON.parse(decode(m[1]))]}catch{return []}}),event=blocks.flatMap(x=>Array.isArray(x)?x:x['@graph']||[x]).find(x=>x['@type']==='Event'&&/Schützenhalle/i.test(x.name||''));
 if(!event||event.organizer?.name!=='Flohmarkt mit Flair'||event.location?.address?.addressLocality!=='Verl'||!/Paderborner.*88/.test(event.location?.address?.streetAddress||''))throw Error('Veranstalter oder Veranstaltungsort des Flohmarkts nicht bestätigt.');
 const date=event.startDate?.slice(0,10),time=event.startDate?.slice(11,16),endTime=event.endDate?.slice(11,16),t=txt(dom(official)),when=date&&new Date(date+'T12:00:00Z'),month=when&&months[when.getUTCMonth()];
 if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!t.includes(when.getUTCDate()+'. '+month)||!/Verl, Schützenhalle/.test(t))throw Error('Flohmarkt-Termin auf der Veranstalterseite nicht wiedergefunden.');
 if(date<checkedAt.slice(0,10))return [];
 const description=event.description||'',visitors=/Ab 10\.00 Uhr/.test(description),free=/Halleneintritt.*Parken.*FREI/s.test(description);
 return [{id:'schuetzenhalle-flohmarkt-'+date,title:'Flohmarkt an der Schützenhalle Verl',date,time:visitors?'10:00':time,endTime:endTime||null,location:'Schützenhalle Verl, Paderborner Straße 88',category:'Märkte',source:'Flohmarkt mit Flair · Veranstalteranzeige',sourceKey:'flea',url:VENUE_URLS.listing,sourceURL:VENUE_URLS.listing,additionalSourceURL:VENUE_URLS.flea,description:'Flohmarkt in der Schützenhalle und auf dem Außengelände.',note:visitors?'Laut Veranstalteranzeige: Aufbau ab 08:00 Uhr, Stöbern ab 10:00 Uhr; Terminende 15:00 Uhr. Zeiten vor dem Besuch prüfen.':'Uhrzeiten und Teilnahmebedingungen in der Veranstalteranzeige prüfen.',free:free?true:null,checkedAt}];
}
export function parseOldtimer(html,helpers,checkedAt=new Date().toISOString()){
 const text=helpers.txt(helpers.dom(html)),m=text.match(/(\d{1,2})\s*\.\s*(?:&|und|–|-)\s*(\d{1,2})\s*\.\s*(Mai)\s*(20\d{2})/i);
 if(!/Ostwestfalenhalle Kaunitz/.test(text)||!/Oldtimer/.test(text))throw Error('Oldtimer-Veranstalterseite nicht auswertbar.');
 const dates=m?[m[1],m[2]].map(day=>m[4]+'-05-'+day.padStart(2,'0')):[];
 const future=dates.filter(date=>date>=checkedAt.slice(0,10));
 return {items:future.map(date=>({id:'jukin50s-'+date,title:'Musikbox- und Straßenkreuzer-Festival',date,time:null,location:'Ostwestfalenhalle Kaunitz',category:'Oldtimer',source:'The Jukin’ 50s · Veranstalter',sourceKey:'oldtimer',url:VENUE_URLS.oldtimer,sourceURL:VENUE_URLS.oldtimer,description:'Oldtimerfestival an der Ostwestfalenhalle. Programm, Uhrzeiten und Eintritt beim Veranstalter prüfen.',checkedAt})),note:future.length?'Der Veranstalter veröffentlicht kommende Festivaltage; Uhrzeiten und Eintritt separat prüfen.':'Auf der Veranstalterseite ist noch kein kommender Festivaltermin bestätigt.'};
}
export function createVenueEvents(helpers){return async()=>{
 const jobs={hall:async()=>{const html=await helpers.getText(VENUE_URLS.hall);return {items:parseHallEvents(html,helpers)};},flea:async()=>{const [html,official]=await Promise.all([helpers.getText(VENUE_URLS.listing),helpers.getText(VENUE_URLS.flea)]);return {items:parseFleaListing(html,official,helpers)};},oldtimer:async()=>parseOldtimer(await helpers.getText(VENUE_URLS.oldtimer),helpers)};
 const items=[],sources=[];await Promise.all(Object.entries(jobs).map(async([id,run])=>{try{const result=await run();items.push(...result.items);sources.push({id,status:'ok',checkedAt:new Date().toISOString(),sourceURL:id==='hall'?VENUE_URLS.hall:id==='flea'?VENUE_URLS.flea:VENUE_URLS.oldtimer,note:result.note||null});}catch{sources.push({id,status:'error',attemptedAt:new Date().toISOString(),sourceURL:id==='hall'?VENUE_URLS.hall:id==='flea'?VENUE_URLS.flea:VENUE_URLS.oldtimer});}}));
 if(sources.every(s=>s.status==='error'))throw Error('Zusätzliche Veranstaltungsquellen nicht erreichbar.');
 return {items,sources};
};}
