export const MOBILITY_URLS={city:'https://www.verl.de/stadt-zukunft/mobilitaet/mobil-mit-bus-und-bahn.html',closures:'https://www.verl.de/aktuelles/uebersicht-ueber-aktuelle-baustellen-im-stadtgebiet.html',operator:'https://www.go-on-gbs.de/',line73:'https://www.go-on-gbs.de/verkehrsmeldungen/detail/buslinie-73-baustellenbedingte-fahrplanaenderungen-in-verl/',lineS18:'https://www.go-on-gbs.de/westfalenschnellbus-s18/',stops:'https://haltestellenmonitor.vrr.de/backend/api/stations/search?query=Verl',monitor:'https://haltestellenmonitor.vrr.de/vu/mobiel'};
export function officialMonitorURL(stopId){if(!Number.isInteger(+stopId)||+stopId<=0)throw Error('Ungültige Haltestellen-ID');return MOBILITY_URLS.monitor+'?station='+encodeURIComponent(stopId)+'#/index';}
export function parseStops(payload){if(!Array.isArray(payload?.suggestions))throw Error('Haltestellenverzeichnis nicht auswertbar');return payload.suggestions.filter(r=>Number.isInteger(+r.data)&&/^(?:Verl(?:\s|,)|Sende \(Verl\)\s)/.test(r.value||'')).map(r=>({id:+r.data,name:r.value,monitorURL:officialMonitorURL(r.data)}));}
export function createMobilitySource({getText,dom,all,txt}){
 async function mobility(){
  const [stopsJSON,s18HTML,line73HTML]=await Promise.all([getText(MOBILITY_URLS.stops),getText(MOBILITY_URLS.lineS18),getText(MOBILITY_URLS.line73)]);
  const stops=parseStops(JSON.parse(stopsJSON));if(!stops.some(s=>s.id===23006753))throw Error('Verl Bahnhof nicht im bestätigten Haltestellenverzeichnis');
  const s18PDF=all(dom(s18HTML),n=>n.tag==='a'&&/Linie_S18.*\.pdf$/i.test(n.attrs.href||''))[0];
  const paragraphs=all(dom(line73HTML),n=>n.tag==='p').map(txt),confirmed73=paragraphs.some(s=>s.includes('„Ev. Kirche“')&&s.includes('„Am Bühlbusch“')&&s.includes('bis auf weiteres'));
  return {checkedAt:new Date().toISOString(),sourceURL:MOBILITY_URLS.city,stops,s18:{url:MOBILITY_URLS.lineS18,timetableURL:s18PDF?new URL(s18PDF.attrs.href,MOBILITY_URLS.operator).href:null},disruptions:confirmed73?[{id:'goon-linie73-verl-20260902',title:'Linie 73: Haltestellen in Verl entfallen',line:'73',startDate:'2026-09-02',endDate:null,period:'Seit 2. September 2026 · bis auf Weiteres',summary:'Die Haltestellen Ev. Kirche und Am Bühlbusch werden vorübergehend nicht bedient. Die Linie fährt wegen der Baustelle an der Verler Straße nicht über Lindenstraße und Eichendorffstraße. An der Bühlbuschschule erfolgt der Einstieg Richtung Gütersloh auf der gegenüberliegenden Seite.',source:'go.on / ArGe ÖPNV Gütersloh',sourceURL:MOBILITY_URLS.line73}]:[]};
 }
 return {mobility};
}
