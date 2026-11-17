import {matchesSearch,citySearchTerm} from './language.mjs';
import {relevantToAudience} from './local-guide-utils.mjs';
const clean=s=>String(s||'').toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss');
export function appSearchRecords(data={},today=''){
 const out=[];const add=(kind,section,x,description='',aliases='')=>{if(!x.title||!relevantToAudience(x))return;out.push({key:kind+':'+(x.id||x.title),kind,section,id:x.id,title:x.title,description,url:x.url||x.sourceURL||'',aliases,article:kind==='Nachrichten'});};
 for(const x of data.articles||[])add('Nachrichten','today',x,x.summary);
 for(const x of data.openingHours?.items||[])add('Öffnungszeiten','openings',x,x.address,'Öffnungszeiten geöffnet wann '+(x.category||'')+' '+(x.title.includes('Marienstraße')?'Abfallhof Müllhof Gartenabfälle Laub':'')+(x.title.includes('Wertstoffhof')?' Abfallhof Müllhof Recycling Sperrmüll':''));
 for(const x of data.restaurants?.items||[])add('Restaurants','restaurants',x,[x.cuisine,x.address].join(' · '),'Restaurant Essen Speisekarte Lieferung Lieferdienst Abholung '+(x.delivery?.available?'liefert':''));
 for(const x of data.events||[])if(!today||x.date>=today)add('Veranstaltungen','events',x,[x.date,x.time,x.location].filter(Boolean).join(' · '),'Termine Eintritt Familienpass');
 for(const x of data.eventTips?.items||[])if(!x.validUntil||!today||x.validUntil>=today)add('Veranstaltungen','events',x,x.description,'besondere Termine Eintritt Familienpass');
 for(const x of data.droste?.offers||[])add('Kinderangebote','family',x,[x.ageLabel,x.category].filter(Boolean).join(' · '),'Droste Haus Kurse Kinder Familie');
 for(const group of [data.tvSports,data.tvCourses])for(const x of group?.offers||[])add('Kinderangebote','family',x,[x.ageLabel,x.category].filter(Boolean).join(' · '),'TV Verl Sport Kinder Familie');
 for(const [i,x] of (data.poolCourses?.courses||[]).entries())add('Schwimmkurse','pools',{...x,id:x.id||'pool-course-'+i,title:x.name||x.title},'Offizielle Schwimm- und Aquakurse.','Schwimmen Schwimmkurs Kurs Hallenbad Freibad Aqua');
 for(const x of data.familyGuide?.outings||[])add('Ausflüge','outings',x,x.description,'Ausflug Spielplatz Freizeit Familie '+x.setting);
 for(const x of data.familyGuide?.help||[])add('Hilfe','help',x,x.description,'Notdienst Bereitschaft Hilfe');
 add('Abfall','waste',{id:'waste',title:'Dein Abfallkalender'},'Straße, Tonnen und nächste Abholtermine.','Müll Müllabfuhr Restmüll Bio Kompost Papier Gelbe Tonne Bahnhofstraße');
 add('Suchbereich','market',{id:'miete',title:'Mietwohnungen in Verl'},'Dein Mietprofil und vorbereitete Originalsuche.','Miete Wohnung Immobilien Haus Garten Warmmiete');
 add('Suchbereich','market',{id:'autos',title:'Autos in und um Verl'},'Dein Autoprofil mit Privat- und Händlerangeboten.','Auto Fahrzeug Gebrauchtwagen Börse');
 add('Suchbereich','saved-events',{id:'saved-events',title:'Gemerkte Veranstaltungen'},'Deine Termine und Kalenderexport.','Merkliste merken Termine Kalender');
 add('Suchbereich','sc',{id:'sc',title:'SC Verl'},'Tabelle, Spielplan und Ticketshop.','Fußball Sportclub Tickets');
 add('Suchbereich','pools',{id:'pools',title:'Hallenbad & Freibad'},'Badezeiten, Kurse und Kartengültigkeit.','Schwimmen Schwimmbad Freibadkarte');
 return out;
}
export function searchApp(query,data,today){const q=String(query||'').trim();if(q.length<2)return [];const term=citySearchTerm(q),tokens=clean(term).split(/\s+/).filter(x=>x.length>1&&!['wann','hat','haben','die','der','das','ist','sind','für','mit','von','und','in'].includes(x));return appSearchRecords(data,today).map(r=>{const text=[r.title,r.description,r.kind,r.aliases].join(' '),plain=clean(text);let score=matchesSearch(q,text)?20:0;if(tokens.length&&tokens.every(t=>plain.includes(t)))score+=15;if(clean(r.title).includes(clean(term)))score+=30;if(r.kind==='Öffnungszeiten'&&/öffn|geöffnet|wann/.test(term))score+=10;return {...r,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).filter((x,i,all)=>all.findIndex(y=>y.section===x.section&&y.title===x.title)===i).slice(0,30);}
