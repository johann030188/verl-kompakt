export const POLICE_RSS='https://www.presseportal.de/rss/dienststelle_23127.rss2';
export const POLICE_LIST='https://www.presseportal.de/blaulicht/nr/23127?search=Verl';
const ALLOWED=/^https:\/\/www\.presseportal\.de\/blaulicht\/pm\/23127\/\d+$/;
const LOCATION=/^(Verl(?:-(?:Kaunitz|Sürenheide|Bornholte(?:-Bahnhof)?|Sende))?|Kaunitz|Sürenheide|Bornholte(?:-Bahnhof)?)\s*\([A-Z]{1,4}\)\s*(?:[-–]|(?=Am\b))/i;
export function actualPlace(text){
 const lead=String(text||'').split(/\(ots\)\s*[-–]?\s*/i)[1];
 if(!lead)return null;const m=lead.trim().match(LOCATION);return m?m[1]:null;
}
const ownNotes={
 '6390197':{title:'Einbruch am Rebhuhnweg: Polizei sucht Hinweise',paragraphs:['Am 12. November 2026 wurde zwischen 9.45 und 18.45 Uhr in ein Wohnhaus am Rebhuhnweg eingebrochen. Nach der Mitteilung der Polizei Gütersloh vom 13. November wurde eine Scheibe eingeschlagen; die Täter durchsuchten das Haus und nahmen Bargeld mit.','Die Ermittler bitten um Hinweise zu verdächtigen Beobachtungen am Tatort. Der offizielle Zeugenaufruf und die Kontaktmöglichkeit stehen in der verlinkten Polizeimitteilung.']},
 '6382181':{title:'Drei Wohnhauseinbrüche zwischen dem 28. und 31. Oktober',paragraphs:['Die Polizei Gütersloh berichtete am 2. November 2026 von Einbrüchen an der Bürmannstraße, Cheruskerstraße und Reuterstraße in Verl. Die erfassten Tatzeiten lagen zwischen dem 28. und 31. Oktober. In zwei der Fälle wurden Bargeld beziehungsweise Schmuck entwendet.','Die Polizei prüfte zum Zeitpunkt der Veröffentlichung einen möglichen Zusammenhang zwischen den Taten und bat um Zeugenhinweise. Die Originalquelle nennt die einzelnen Tatzeiträume.']},
 '6380982':{title:'Tödlicher Unfall an der Paderborner Straße',paragraphs:['Am 30. Oktober 2026 kam es gegen 6.10 Uhr an der Einmündung Veilchenweg zu einem Zusammenstoß zwischen einem elektrischen Leichtkraftrad und einem Auto. Der Zweiradfahrer starb noch an der Unfallstelle; der Autofahrer blieb laut Polizeimitteilung unverletzt.','Die Unfallaufnahme wurde von einem spezialisierten Team der Polizei Paderborn unterstützt. Die Zusammenfassung gibt den veröffentlichten Ermittlungsstand vom 30. Oktober wieder.']},
 '6377775':{title:'Polizei ermittelt nach Diesel-Diebstahl an einer Baustelle',paragraphs:['Nach einem Zeugenhinweis traf die Polizei in der Nacht zum 25. Oktober 2026 auf einen Tatverdächtigen an einer Baustelle im Bereich Bielefelder Straße und Sender Straße. Dort war ein Tank eines Baustellenfahrzeugs betroffen.','Zwei weitere Verdächtige wurden im Verlauf der Fahndung in der Umgebung angetroffen. Gegen alle drei Personen wurden laut Mitteilung vom 26. Oktober Ermittlungen eingeleitet.']}
};
function ownSummary(title){const topic=/einbruch|einbrüche/i.test(title)?'einem Einbruch':/unfall/i.test(title)?'einem Verkehrsunfall':/diebstahl|dieb/i.test(title)?'einem Diebstahl':/fahrradprüfung/i.test(title)?'einer Fahrradprüfung':'einem Ereignis';return `Die Polizei Gütersloh hat eine Meldung zu ${topic} im Stadtgebiet Verl veröffentlicht. Einzelheiten und gegebenenfalls Zeugenhinweise stehen in der offiziellen Quelle.`;}
function output({title,url,publishedAt,place},checkedAt){if(!place||!ALLOWED.test(url)||!title||!publishedAt)return null;const sourceId=url.split('/').at(-1),editorial=ownNotes[sourceId];return {id:'police-'+sourceId,title:editorial?.title||title.replace(/^POL-GT:\s*/,''),source:'Polizei Gütersloh / Presseportal',sourceURL:url,publishedAt,checkedAt,place,kind:editorial?'summary':'source-note',paragraphs:editorial?.paragraphs||[ownSummary(title)],summary:editorial?.paragraphs[0]||ownSummary(title)};}
export function createPoliceSource({dom,all,txt,decode,getText}){
 const clean=s=>txt(dom(decode(String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1'))));
 function parseRSS(xml,checkedAt=new Date().toISOString()){
  if(!/<title>Presseportal.de - Polizei Gütersloh<\/title>/.test(xml)||!xml.includes('<rss'))throw Error('Kein bestätigter RSS-Feed der Polizei Gütersloh');
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>{const field=k=>m[1].match(new RegExp('<'+k+'[^>]*>([\\s\\S]*?)<\\/'+k+'>'))?.[1]||'';const body=clean(field('description')),d=new Date(clean(field('pubDate')));return output({title:clean(field('title')),url:clean(field('link')),publishedAt:Number.isFinite(+d)?d.toISOString():null,place:actualPlace(body)},checkedAt)}).filter(Boolean);
 }
 function parseList(html,checkedAt=new Date().toISOString()){
  const root=dom(html),cards=all(root,n=>n.tag==='article');if(!cards.length)throw Error('Polizeiliste nicht auswertbar');
  return cards.map(card=>{const heading=all(card,n=>n.tag==='h3')[0],a=heading&&all(heading,n=>n.tag==='a')[0],text=txt(card),date=text.match(/(\d{2})\.(\d{2})\.(\d{4})/);return output({title:txt(heading),url:a?new URL(a.attrs.href,'https://www.presseportal.de').href:'',publishedAt:date?`${date[3]}-${date[2]}-${date[1]}`:null,place:actualPlace(text)},checkedAt)}).filter(Boolean);
 }
 async function police(){const results=await Promise.allSettled([getText(POLICE_RSS).then(t=>parseRSS(t)),getText(POLICE_LIST).then(t=>parseList(t))]);const good=results.filter(r=>r.status==='fulfilled');if(!good.length)throw Error('Polizeiquellen nicht erreichbar');const items=[...new Map(good.flatMap(r=>r.value).map(r=>[r.id,r])).values()].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));return {items,checkedAt:new Date().toISOString(),sourceURL:POLICE_LIST,rssURL:POLICE_RSS,partial:good.length!==results.length,filter:'Nur tatsächliche Ortsdateline Verl oder bestätigter Verler Ortsteil; keine bloßen Nennungen Verler Straße oder Einwohner aus Verl bei auswärtigem Ereignis.'};}
 return {police,parseRSS,parseList};
}
