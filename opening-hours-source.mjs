import {getText,dom,all,txt} from './sources.mjs';

const DAYS=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
const ENGLISH=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const SHORT=['Mo','Tu','We','Th','Fr','Sa','Su'];
const blankWeek=()=>Array.from({length:7},()=>null);
export const OPENING_SOURCES=[
 {id:'aldi-verl-westfalenweg',title:'ALDI Nord',address:'Westfalenweg 8, 33415 Verl',category:'Einkaufen',sourceURL:'https://www.aldi-nord.de/filialen-und-oeffnungszeiten/verl/westfalenweg-8/3181758.html',parser:'aldi'},
 {id:'lidl-verl-westring',title:'Lidl',address:'Westring 11, 33415 Verl',category:'Einkaufen',sourceURL:'https://www.lidl.de/s/de-DE/filialen/verl/westring-11/',parser:'lidl'},
 {id:'sb-luening-verl',title:'sb LÜNING',address:'Österwieher Str. 16, 33415 Verl',category:'Einkaufen',sourceURL:'https://www.sb-luening.de/standorte/verl',parser:'luening'},
 {id:'rossmann-verl-westfalenweg',title:'ROSSMANN',address:'Westfalenweg 16, 33415 Verl',category:'Einkaufen',sourceURL:'https://www.rossmann.de/de/filialen/nordrhein-westfalen/verl/westfalenweg-16.html',parser:'rossmann'},
 {id:'edeka-niederschulte-verl',title:'EDEKA Niederschulte',address:'Oesterwieher Straße 20, 33415 Verl',category:'Einkaufen',sourceURL:'https://www.edeka.de/maerkte/071796/',parser:'edeka'},
 {id:'wertstoffhof-verl',title:'Wertstoffhof Verl',address:'Ewersweg 5, Verl',category:'Entsorgung',sourceURL:'https://www.verl.de/service/abfallentsorgung/haeufige-fragen-zur-abfallentsorgung.html',parser:'waste'},
 {id:'gartenabfallannahme-marienstrasse',title:'Gartenabfallannahme Marienstraße',address:'Marienstraße, Kaunitz',category:'Entsorgung',sourceURL:'https://www.verl.de/service/abfallentsorgung/gartenabfaelle.html',parser:'garden'},
 {id:'bibliothek-verl',title:'Bibliothek Verl',address:'Hauptstraße 15, 33415 Verl',category:'Bibliothek',sourceURL:'https://www.bibliothek.verl.de/de/ueber-uns/oeffnungszeiten.php',parser:'library'}
];
export const GARDEN_SPECIAL_URL='https://www.verl.de/aktuelles/gartenabfallannahme-zusaetzliche-zeiten-und-kostenlose-laubabgabe.html';
export const ACCESS_URL='https://www.verl.de/aktuelles/uebersicht-ueber-aktuelle-baustellen-im-stadtgebiet.html';

export function timeRanges(value=''){
 const out=[];
 for(const m of value.matchAll(/(\d{1,2})(?:[.:](\d{2}))?\s*(?:bis|–|—|-)\s*(\d{1,2})(?:[.:](\d{2}))?/g)){
  const a=`${m[1].padStart(2,'0')}:${m[2]||'00'}`,b=`${m[3].padStart(2,'0')}:${m[4]||'00'}`;
  if(+m[1]>23||+m[3]>24||+(m[2]||0)>59||+(m[4]||0)>59||a>=b||b>'24:00')continue;
  out.push([a,b]);
 }
 return out;
}
function validateWeek(week,minDays=1){
 if(week.length!==7||week.filter(x=>x!==null).length<minDays||!week.some(x=>x?.length))throw Error('Öffnungszeiten nicht ausreichend bestätigt');
 return week;
}
export function tableWeek(table){
 const week=blankWeek();
 for(const tr of all(table,n=>n.tag==='tr')){
  const cells=all(tr,n=>n.tag==='td'||n.tag==='th').map(txt),i=DAYS.indexOf((cells[0]||'').replace(/:$/,''));
  if(i<0)continue;
  const content=cells.slice(1).join(' '),ranges=timeRanges(content);
  if(ranges.length)week[i]=ranges;else if(/geschlossen/i.test(content))week[i]=[];
 }
 return week;
}
export function jsonLDObjects(html){
 const out=[];
 function walk(o){if(!o||typeof o!=='object')return;if(Array.isArray(o)){o.forEach(walk);return;}out.push(o);if(o['@graph'])walk(o['@graph']);}
 for(const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{walk(JSON.parse(m[1]));}catch{
   // Some official pages contain literal line breaks inside JSON string values.
   try{walk(JSON.parse(m[1].replace(/"(?:\\.|[^"\\])*"/g,s=>s.replace(/[\r\n\t]/g,' '))));}catch{}
  }
 }
 return out;
}
export function jsonLDWeek(object){
 const week=blankWeek();
 if(object.openingHoursSpecification){for(const row of [].concat(object.openingHoursSpecification)){
  const ranges=timeRanges(`${row.opens||''}-${row.closes||''}`);
  if(!ranges.length)continue;
  for(const day of [].concat(row.dayOfWeek||[])){const i=ENGLISH.indexOf(String(day).split('/').at(-1));if(i>=0)week[i]=[...(week[i]||[]),...ranges];}
 }}
 if(typeof object.openingHours==='string')for(const part of object.openingHours.split(',')){
  const m=part.trim().match(/^(Mo|Tu|We|Th|Fr|Sa|Su)\s+(.+)$/);if(m){const ranges=timeRanges(m[2]);if(ranges.length)week[SHORT.indexOf(m[1])]=ranges;}
 }
 return validateWeek(week,6);
}
function specialLD(object){
 return [].concat(object.specialOpeningHoursSpecification||[]).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.validFrom||'')&&x.validFrom===x.validThrough).map(x=>({date:x.validFrom,ranges:x.opens&&x.closes?timeRanges(`${x.opens}-${x.closes}`):[]}));
}
const ownNotes={
 waste:['Für Abfälle aus Verler Privathaushalten. Gültigen Personalausweis mitbringen. An gesetzlichen Feiertagen geschlossen. Annahmearten und mögliche Gebühren bitte im Original prüfen.'],
 garden:['Annahme für Verler Bürgerinnen und Bürger; gültigen Personalausweis mitbringen. Andere Gartenabfälle sind nicht pauschal kostenlos.'],
 library:['Open Library: Zugang ohne Personal nur mit freigeschaltetem Open-Library-Ausweis für Erwachsene. Die Zustimmung zu den Nutzungsbedingungen ist erforderlich.'],
 shops:['Sonderöffnungen, Betriebsferien und kurzfristige Änderungen bitte bei der Filiale prüfen.']
};
export function parseOpeningHours(html,definition){
 const p=typeof definition==='string'?definition:definition.parser,root=dom(html),text=txt(root);
 let week=blankWeek(),openLibraryWeek,specialHours=[],notes=[...(ownNotes[p]||ownNotes.shops)];
 if(p==='lidl'||p==='edeka'||p==='rossmann'){
  const object=jsonLDObjects(html).find(x=>/^(GroceryStore|Store)$/.test(x['@type']||'')&&(/Verl/i.test(x.name||'')||/Verl/i.test(x.address?.addressLocality||'')));
  if(!object)throw Error('Offizielle Filialdaten fehlen');
  const street=String(object.address?.streetAddress||'');
  if((p==='lidl'&&!/Westring\s*11/i.test(street))||(p==='edeka'&&!/Oesterwieher.*20/i.test(street))||(p==='rossmann'&&!/Westfalenweg\s*16/i.test(street)))throw Error('Filialadresse nicht bestätigt');
  week=jsonLDWeek(object);specialHours=specialLD(object);
  if(/(?:Sonntag|So)\s*:?\s*Geschlossen/i.test(text))week[6]=[];
 }else if(p==='aldi'){
  if(!/Westfalenweg\s*8/i.test(text))throw Error('ALDI-Filiale nicht bestätigt');
  const tables=all(root,n=>n.tag==='table');
  const parsed=tables.map(tableWeek).find(w=>w.filter(x=>x!==null).length===7);
  if(!parsed)throw Error('ALDI-Wochentabelle nicht auswertbar');week=parsed;
  for(const table of tables)for(const tr of all(table,n=>n.tag==='tr')){
   const cells=all(tr,n=>n.tag==='td'||n.tag==='th').map(txt),m=(cells[0]||'').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
   if(m&&(/geschlossen/i.test(cells.slice(1).join(' '))||timeRanges(cells.slice(1).join(' ')).length))specialHours.push({date:`${m[3]}-${m[2]}-${m[1]}`,ranges:/geschlossen/i.test(cells.slice(1).join(' '))?[]:timeRanges(cells.slice(1).join(' '))});
  }
 }else if(p==='luening'){
  if(!/Österwieher Str\.\s*16/i.test(text))throw Error('LÜNING-Filiale nicht bestätigt');
  const m=text.match(/Montag\s*-\s*Freitag:\s*([\d\s:bis]+Uhr)\s*Samstag:\s*([\d\s:bis]+Uhr)/i);
  if(!m)throw Error('LÜNING-Öffnungszeiten nicht auswertbar');
  const weekdays=timeRanges(m[1]),sat=timeRanges(m[2]);if(!weekdays.length||!sat.length)throw Error('LÜNING-Zeiten unvollständig');
  for(let i=0;i<5;i++)week[i]=weekdays;week[5]=sat;
 }else if(p==='waste'){
  const m=text.match(/Wertstoffhof am Ewersweg 5 hat jeden Samstag von\s*([\d.:]+\s*bis\s*[\d.:]+)\s*Uhr/);
  if(!m||!timeRanges(m[1]).length)throw Error('Wertstoffhof-Regel nicht bestätigt');
  week[5]=timeRanges(m[1]);
 }else if(p==='garden'){
  const m=text.match(/Gartenabfallannahme an der Marienstraße in Kaunitz[\s\S]{0,160}?jeden Freitag von\s*([\d.:]+\s*bis\s*[\d.:]+)\s*Uhr/);
  if(!m||!timeRanges(m[1]).length)throw Error('Gartenabfallannahme-Regel nicht bestätigt');week[4]=timeRanges(m[1]);
 }else if(p==='library'){
  const tables=all(root,n=>n.tag==='table'),weeks=tables.map(tableWeek).filter(w=>w.some(x=>x?.length));
  if(weeks.length<2||!text.includes('Open-Library-Ausweis'))throw Error('Bibliothekszeiten nicht vollständig auswertbar');
  week=weeks.find(w=>w.filter(x=>x?.length).length===5);openLibraryWeek=weeks.find(w=>w.filter(x=>x?.length).length===7);
  if(!week||!openLibraryWeek||week===openLibraryWeek)throw Error('Personal- und Open-Library-Zeiten nicht unterscheidbar');
 }else throw Error('Unbekannte Öffnungszeitenquelle');
 validateWeek(week);return {week,...(openLibraryWeek?{openLibraryWeek}:{}),specialHours,notes};
}
export function parseGardenSpecial(html){
 const text=txt(dom(html)),date=text.match(/(\d{2})\.(\d{2})\.(20\d{2})/),year=date?.[3];
 const passage=text.match(/an den Montagen\s+([\s\S]{1,180}?)\s+ebenfalls von\s*([\d.:]+\s*bis\s*[\d.:]+)\s*Uhr/i);
 if(!year||!passage)throw Error('Datierte Herbstsonderzeiten fehlen');
 const ranges=timeRanges(passage[2]);if(!ranges.length)throw Error('Herbstsonderzeiten nicht lesbar');
 const specialHours=[];
 for(const m of passage[1].matchAll(/([\d.*\s,und]+)\s+(Oktober|November)/g))for(const day of m[1].matchAll(/(\d{1,2})\./g)){
  const d=`${year}-${m[2]==='Oktober'?'10':'11'}-${day[1].padStart(2,'0')}`;
  if(new Date(d+'T12:00:00Z').getUTCDay()!==1)throw Error('Sondertermin passt nicht zum genannten Montag');
  specialHours.push({date:d,ranges});
 }
 if(specialHours.length!==4)throw Error('Herbstsondertermine unvollständig');
 const notes=/Im Oktober und November kann Laub kostenlos/.test(text)?[`Kostenlose Laubabgabe im Oktober und November ${year}.`]:[];
 return {specialHours,notes};
}
export function parseGardenAccess(html){
 const text=txt(dom(html)),i=text.indexOf('Marienstraße | ab 29. Juni'),part=i>=0?text.slice(i,i+1600):'';
 if(!/Gartenabfallannahme bleibt[\s\S]*gewohnten An- und Abfahrtswege erreichbar/.test(part)||!/Öffnungszeiten[\s\S]*Vollsperrung jeweils aufgehoben/.test(part))throw Error('Aktuelle Zufahrtsregel nicht bestätigt');
 return {notes:['Während der Marienstraßenarbeiten bleibt die Gartenabfallannahme laut Stadt zu den Öffnungszeiten über die gewohnten An- und Abfahrtswege erreichbar. Die Vollsperrung wird dafür jeweils aufgehoben.']};
}

export async function refreshOpeningHours(previous={},fetchText=getText){
 const oldItems=previous.items||[];
 const items=await Promise.all(OPENING_SOURCES.map(async definition=>{
  const old=oldItems.find(x=>x.id===definition.id),{parser,...identity}=definition;
  try{
   const result=parseOpeningHours(await fetchText(definition.sourceURL),definition);
   const checkedAt=new Date().toISOString();
   const item={...identity,...result,checkedAt,status:'ok',attemptedAt:checkedAt};
   if(parser==='garden'){
    item.extraSources=[];
    for(const [kind,sourceURL,parse] of [['specialHours',GARDEN_SPECIAL_URL,parseGardenSpecial],['access',ACCESS_URL,parseGardenAccess]]){
     const oldExtra=old?.extraSources?.find(x=>x.kind===kind&&x.sourceURL===sourceURL);
     try{
      const extra=parse(await fetchText(sourceURL)),at=new Date().toISOString();
      item.extraSources.push({kind,sourceURL,...extra,checkedAt:at,status:'ok',attemptedAt:at});
     }catch(e){item.extraSources.push({...oldExtra,kind,sourceURL,status:'error',error:String(e.message),attemptedAt:new Date().toISOString(),checkedAt:oldExtra?.checkedAt||null});}
    }
    const special=item.extraSources.find(x=>x.kind==='specialHours');
    if(special?.specialHours)item.specialHours=special.specialHours;
    // Notes from extra sources retain their own source timestamps and status.
   }
   return item;
  }catch(e){return {...(old||{...identity,week:blankWeek(),specialHours:[],notes:[]}),status:'error',error:String(e.message),checkedAt:old?.checkedAt||null,attemptedAt:new Date().toISOString()};}
 }));
 const success=items.filter(x=>x.status==='ok').map(x=>x.checkedAt).sort();
 return {items,checkedAt:success.at(-1)||previous.checkedAt||null,attemptedAt:new Date().toISOString()};
}
