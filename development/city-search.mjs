export const CITY_API='https://verl.optigov.app/api/search';
export const CITY_PORTAL='https://www.verl.de/serviceportal';
export const CITY_SEARCH='https://www.verl.de/suche.html';
export const normalize=s=>String(s||'').toLocaleLowerCase('de').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const compact=s=>normalize(s).replaceAll(' ','');
const aliases=[['wohngeld','mietzuschuss','lastenzuschuss','wohn geld'],['familienpass','familien pass'],['personalausweis','perso','personal ausweis'],['kindertageseinrichtungen','kita','kindergarten'],['offener ganztag','ogs','ganztagsbetreuung'],['sperrmuellabholung','sperrmuell','sperrmuellabfuhr'],['fundbuero','fundsachen','verloren'],['maengel','maengelmelder','maengel melden'],['buergerservice','buergerbuero','buergeramt'],['terminvereinbarung','rathaustermin','termin buchen'],['hunde','hundesteuer','hund anmelden'],['abfall','muellabfuhr','muellkalender'],['reisepass','reise pass'],['buecherei','bibliothek'],['bildung und teilhabe','bildungspaket','but']];
const stop=new Set(['ich','moechte','will','wie','wo','was','ist','kann','man','den','die','das','der','ein','eine','einen','fuer','bei','zur','zum','in','und','von','mit','bitte','stadt','verl','beantragen','antrag','bekomme','bekommen','suche','suchen']);
export function serviceRows(payload){
 if(!payload?.data||!Array.isArray(payload.data.dienstleistungen))throw Error('Die Stadt-Suche liefert kein gültiges Dienstleistungsverzeichnis.');
 return payload.data.dienstleistungen.filter(r=>Number.isInteger(+r.id)&&+r.id>0&&typeof r.leistungsname==='string'&&r.leistungsname.trim()).map(r=>({id:'service-'+r.id,title:r.leistungsname.trim(),kind:'service',url:CITY_PORTAL+'?ansicht=dienstleistung&eintrag='+r.id}));
}
export function cityApiURL(query){const u=new URL(CITY_API);u.searchParams.set('verwaltungId','1');u.searchParams.set('query',query.trim().slice(0,160));return u.href;}
export function officialSearchURL(query){const u=new URL(CITY_SEARCH);u.searchParams.set('tx_solr[q]',query.trim().slice(0,160));return u.href;}
function nearly(a,b){if(a===b)return true;if(a.length<5||Math.abs(a.length-b.length)>1)return false;let i=0,j=0,errors=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++errors>1)return false;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++;}}return errors+(i<a.length||j<b.length?1:0)<=1;}
export function rankTopics(query,topics,limit=30){
 const q=normalize(query),tokens=q.split(' ').filter(t=>t.length>1&&!stop.has(t));if(!q||!tokens.length)return [];
 const alternatives=aliases.filter(g=>g.some(s=>compact(q).includes(compact(s)))).flat();
 const scored=topics.map(row=>{const title=normalize(row.title),joined=compact(row.title),extra=aliases.filter(g=>g.some(s=>joined.includes(compact(s)))).flat().join(' '),hay=title+' '+extra;let score=0;
 if(joined===compact(q))score=1000;else if(title===q)score=950;else if(title.includes(q))score=700;else if(alternatives.some(s=>joined===compact(s)))score=600;else if(tokens.every(t=>hay.includes(t)))score=350;else if(tokens.every(t=>hay.split(' ').some(w=>nearly(t,w))))score=120;else if(row.apiMatch)score=50;
 if(score&&row.kind==='service')score+=10;return {...row,score};}).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'de'));
 const seen=new Set();return scored.filter(r=>{const key=compact(r.title);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,limit);
}
