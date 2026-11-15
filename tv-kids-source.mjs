// Official TV Verl source adapters. Inject the existing DOM/getText helpers.
export const TV_SPORTS_URL='https://tv-verl.de/sportangebote/';
export const TV_COURSES_URL='https://tv-verl.de/kursangebote/kursangebote-kinder-jugendliche/';
const DAYS={Mo:'Montag',Montag:'Montag',Di:'Dienstag',Dienstag:'Dienstag',Mi:'Mittwoch',Mittwoch:'Mittwoch',Do:'Donnerstag',Donnerstag:'Donnerstag',Fr:'Freitag',Freitag:'Freitag',Sa:'Samstag',Samstag:'Samstag',So:'Sonntag',Sonntag:'Sonntag'};
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function lineText(n){if(typeof n==='string')return n;if(n.tag==='br')return '\n';return (n.children||[]).map(lineText).join('');}
export function officialAge(s){
 let m=s.match(/(\d{1,2})\s*(?:Jahre?\s*)?(?:bis|[-–])\s*(\d{1,2})\s*(?:Jahre?|J\.?)/i);
 if(m)return{minAge:+m[1],maxAge:+m[2],ageLabel:m[0].trim()};
 m=s.match(/ab\s*(\d{1,2})\.?\s*(?:Jahre?|J\.?)/i);if(m)return{minAge:+m[1],maxAge:null,ageLabel:m[0].trim()};
 if(/Grundschul(?:kinder|alter)/i.test(s))return{minAge:null,maxAge:null,ageLabel:'Grundschulkinder',schoolGroup:'primary'};
 return null;
}
function fits(age,ages){return !!age&&(age.schoolGroup==='primary'||ages.some(a=>(age.minAge===null||a>=age.minAge)&&(age.maxAge===null||a<=age.maxAge)));}
export function parseTVSports(html,{dom,all,txt,checkedAt=new Date().toISOString(),ages=[7,10]}={}){
 const groups=[];let current=null;
 // The publisher contains malformed nested <p> tags. Read source paragraphs
 // separately so ages cannot leak from one nested paragraph into the next.
 const paragraphs=[...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>dom(m[1].replace(/<\/?p\b[^>]*>/gi,'')));
 for(const p of paragraphs){
   const strong=all(p,n=>n.tag==='strong')[0],st=strong?txt(strong):'';
   const title=st&&!/^(?:Hinweis|U\d|Sommertraining|Wintertraining|\d|ab\s*\d)/i.test(st)&&!Object.keys(DAYS).some(d=>st.startsWith(d+','));
   if(title){current={title:st,parts:[]};groups.push(current)}
   if(current)current.parts.push(p);
 }
 const offers=[];
 for(const group of groups){const text=group.parts.map(txt).join(' '),mainAge=officialAge(group.title);let age=mainAge,season=null,subgroup='';
  const bookingStatus=/Warteliste/.test(text)?'waitlist':/keine weiteren Personen aufgenommen|Gruppen sind alle belegt/.test(text)?'full':'contact-provider';
  for(const p of group.parts){age=mainAge;subgroup='';const lines=lineText(p).split('\n').map(clean).filter(Boolean);
   for(const line of lines){
    if(/Sommertraining|Ultimate Frisbee Sommer/.test(line))season='summer';if(/Wintertraining|Ultimate Frisbee Winter/.test(line))season='winter';
    const found=officialAge(line);if(found){age=found;subgroup=line.replace(/[:：]\s*$/,'');}
    else if(/^U\d|^Leistungsgruppe|^Schüler\/Jugend|^Erwachsene/.test(line)){age=null;subgroup=line;}
    const m=line.match(/\b(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Mo|Di|Mi|Do|Fr|Sa|So)\.?\s*[:,]?\s*(\d{1,2})[.:](\d{2})\s*(?:Uhr\s*)?(?:bis|[-–])\s*(\d{1,2})(?:[.:](\d{2}))?\s*(?:Uhr)?/);
    if(!m||!fits(age,ages))continue;
    const from=m[2].padStart(2,'0')+':'+m[3],to=m[4].padStart(2,'0')+':'+(m[5]||'00');
    let location=clean(line.slice(m.index+m[0].length)).replace(/^\s*[,;:]\s*/,'').replace(/,?\s*ÜL\s+.*$/,'').replace(/\s*\(nach Absprache\)\s*$/,'');
    if(location&&!/SH|GS|Halle|Schulzentrum|Versammlungsraum|Sportgelände|Bühlbusch|Gymnastik|Foyer/.test(location))location=null;
    const title=group.title.replace(/\s*\((?:ab\s*)?\d[^)]*\)\s*$/,'').trim();
    const lineDays=[...line.slice(0,m.index+m[1].length).matchAll(/\b(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Mo|Di|Mi|Do|Fr|Sa|So)\b/g)].map(m=>DAYS[m[1]]);for(const weekday of [...new Set(lineDays)])offers.push({id:'tv-sport-'+slug([title,age.ageLabel,subgroup,weekday,from,season||'all'].join('-')),provider:'TV Verl',kind:'regular-sport',title,sport:title,category:/Tanz|Ballett/.test(title)?'Tanz':/Schach/.test(title)?'Denken':'Sport',sourceURL:TV_SPORTS_URL,programURL:TV_SPORTS_URL,checkedAt,...age,startDate:null,endDate:null,weekday,time:from+'–'+to,from,to,sessions:null,location:location||null,bookingStatus,membershipInfo:'Vereinsangebot; Mitgliedschaft und Aufnahme bitte direkt beim TV Verl prüfen.',season,seasonLabel:season==='winter'?'Wintertraining: nach den Herbstferien bis zu den Osterferien':season==='summer'?'Sommertraining: nach den Osterferien bis zu den Herbstferien':null,...(/weiblich|Mädchen/.test(group.title)?{gender:'girls'}:/männlich|Jungen/.test(group.title)?{gender:'boys'}:{})});
   }
  }
 }
 const rows=[...new Map(offers.map(o=>[o.id,o])).values()];if(rows.length<10)throw Error('TV-Kinder-Sportzeiten konnten nicht zuverlässig ausgelesen werden.');return{offers:rows,checkedAt,sourceURL:TV_SPORTS_URL,notice:'Regelmäßige Vereinszeiten laut offiziellem Sportprogramm. Ferien, Feiertage und kurzfristige Änderungen beim Verein prüfen. Saisonpläne getrennt beachten.'};
}
export async function getTVSports(helpers){return parseTVSports(await helpers.getText(TV_SPORTS_URL),helpers);}
const API_DAY={MONDAY:'Montag',TUESDAY:'Dienstag',WEDNESDAY:'Mittwoch',THURSDAY:'Donnerstag',FRIDAY:'Freitag',SATURDAY:'Samstag',SUNDAY:'Sonntag'};
const berlinDate=s=>s?new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date(s)):null;
const hour=t=>t&&Number.isInteger(t.hour)&&Number.isInteger(t.minute)?String(t.hour).padStart(2,'0')+':'+String(t.minute).padStart(2,'0'):null;
export function discoverTVCourseWidgets(html,{dom,all}){return [...new Set(all(dom(html),n=>n.tag==='iframe').map(n=>n.attrs.src).filter(url=>{try{const u=new URL(url);return u.origin==='https://widgets.yolawo.de'&&/^\/w\/[a-f0-9]{24}$/.test(u.pathname)}catch{return false}}))].map(url=>({widgetId:new URL(url).pathname.split('/').pop(),widgetURL:url,apiURL:'https://api.yolawo.de/widgets/'+new URL(url).pathname.split('/').pop()+'/offers?view=default&limit=100'}));}
export function parseTVCourseOffers(payload,{widgetId,widgetURL,apiURL,checkedAt=new Date().toISOString(),ages=[7,10],today=berlinDate(new Date().toISOString())}={}){
 if(!Array.isArray(payload))throw Error('Unerwartetes öffentliches TV-Kursformat');
 const offers=[];
 for(const course of payload){if(course.canceled)continue;const plain=(course.description?.ops||[]).map(op=>typeof op.insert==='string'?op.insert:'').join(' '),age=officialAge(course.title)||officialAge(plain);if(!fits(age,ages))continue;
 const startDate=berlinDate(course.dates?.range?.from),endDate=berlinDate(course.dates?.range?.to);if(!startDate||!endDate)throw Error('TV-Kurs ohne bestätigten Zeitraum');if(endDate<today)continue;
 const weeks=(course.dates?.weekdays||[]).map(w=>({weekday:API_DAY[w.dayOfWeek]||null,from:hour(w.from),to:hour(w.to),location:w.locations?.map(l=>l.name).filter(Boolean).join(' / ')||null})).filter(w=>w.weekday&&w.from&&w.to);if(!weeks.length)throw Error('TV-Kurs ohne bestätigte Uhrzeit');
 offers.push({id:'tv-course-'+course.id,provider:'TV Verl',kind:'course',title:course.title.replace(/^\s*\d{2}-\d+\s*/,''),courseNumber:course.number||null,category:'Sport',sourceURL:TV_COURSES_URL,programURL:widgetURL,apiURL,widgetId,offerId:course.id,checkedAt,...age,startDate,endDate,weekday:weeks.map(w=>w.weekday).join(', '),time:weeks.map(w=>w.from+'–'+w.to).join(' / '),weekly:weeks,sessions:course.dates.dateCount??null,location:course.dates.locations?.map(l=>l.name).filter(Boolean).join(' / ')||null,bookingStatus:'provider-check',scheduleStatus:startDate<today?'series-already-started':'upcoming',membershipInfo:'Kursangebot; Teilnahmebedingungen, Buchbarkeit und Tarife im offiziellen Kursportal prüfen.',...(/für Mädchen|für Damen/.test(course.title)?{gender:'girls'}:/für Jungen|männlich/.test(course.title)?{gender:'boys'}:{})});
 }
 return offers;
}
export async function getTVCourses(helpers){
 const widgets=discoverTVCourseWidgets(await helpers.getText(TV_COURSES_URL),helpers);if(!widgets.length)throw Error('Keine offiziellen TV-Kurswidgets gefunden');const checkedAt=new Date().toISOString();
 const lists=await Promise.all(widgets.map(async w=>parseTVCourseOffers(JSON.parse(await helpers.getText(w.apiURL)),{...w,checkedAt,ages:helpers.ages||[7,10]})));
 return {offers:lists.flat(),widgets,checkedAt,sourceURL:TV_COURSES_URL,notice:'Offiziell eingebundene Kursangebote. Nur bestätigte Zeiträume; laufende Serien gesondert gekennzeichnet. Buchbarkeit und freie Plätze direkt im Kursportal prüfen.'};
}
