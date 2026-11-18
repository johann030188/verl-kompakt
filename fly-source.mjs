export const FLY_URLS={program:'https://www.fly-verl.de/programm',news:'https://www.fly-verl.de/news',contact:'https://www.fly-verl.de/kontakt'};
const classes=n=>(n.attrs?.class||'').split(/\s+/);
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const slug=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
export function parseFlyProgram(html,helpers,checkedAt=new Date().toISOString()){
 const {dom,all,txt}=helpers,root=dom(html),today=checkedAt.slice(0,10);
 const nodes=all(root,n=>classes(n).includes('event')&&classes(n).includes('layout_list')&&n.attrs['data-filterort']);
 if(!nodes.length)throw Error('FLY-Programm enthält keine auswertbaren Einzeltermine.');
 const events=[];let dated=0;
 for(const n of nodes){
  const title=txt(all(n,x=>x.tag==='h3')[0]),facts=all(n,x=>classes(x).includes('facts'))[0],timeNode=all(n,x=>x.tag==='time'&&x.attrs.datetime)[0];
  const date=(timeNode?.attrs.datetime||'').slice(0,10),range=txt(timeNode).match(/(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})/),age=txt(facts).match(/\bab\s+(\d+)\s+Jahre?/i),location=txt(all(n,x=>classes(x).includes('location'))[0]);
  if(!title||!validDate(date)||!range||!age)continue;dated++;
  const minAge=+age[1],trip=/\bausflug\b/.test(n.attrs['data-filterort'])||/\b(?:fahrt|ausflug|freizeit)\b/i.test(title),thursday=n.attrs['data-filterort']==='verl'&&new Date(date+'T12:00:00Z').getUTCDay()===4;
  if(date<today||minAge>17||minAge<7||!(thursday||trip))continue;
  const registration=all(n,x=>x.tag==='a'&&/anmeld|buch/i.test(txt(x))).map(x=>{try{const u=new URL(x.attrs.href,FLY_URLS.program);return u.protocol==='https:'&&u.hostname==='www.fly-verl.de'?u.href:null}catch{return null}}).find(Boolean);
  events.push({id:'fly-'+date+'-'+slug(location+'-'+title),title,date,time:range[1],endTime:range[2],location,category:'Familie',provider:'FLY',kind:trip?'fly-trip':'fly-thursday',minAge,maxAge:null,ageLabel:'Ab '+minAge+' Jahren',description:trip?'Das FLY kündigt einen Ausflug an. Ziel und Teilnahmebedingungen im Original prüfen.':'Donnerstagsaktion im FLY Verl.',bookingNotice:registration?'Anmeldung über die verlinkte offizielle Seite prüfen.':trip?'Anmeldeweg, Kosten, Ziel und freie Plätze sind für diesen Ausflug nicht bestätigt.':'Teilnahmebedingungen für die einzelne Aktion im offiziellen Programm prüfen.',feeEUR:null,registrationURL:registration||FLY_URLS.contact,registrationOnlineConfirmed:!!registration,source:'FLY Verl',url:FLY_URLS.program,sourceURL:FLY_URLS.program,checkedAt});
 }
 if(!dated)throw Error('FLY-Einzeltermine ohne eindeutig lesbare Daten.');
 return {events,checkedAt,sourceURL:FLY_URLS.program,newsURL:FLY_URLS.news,contactURL:FLY_URLS.contact,scope:'Donnerstagsaktionen in Verl und angekündigte Ausflüge; keine vollständige FLY-Angebotsliste.'};
}
export function parseFlyNews(html,helpers,checkedAt=new Date().toISOString()){
 const {dom,all,txt}=helpers,root=dom(html),nodes=all(root,n=>classes(n).includes('layout_latest'));
 if(!nodes.length)throw Error('FLY-News nicht auswertbar.');
 const earliest=new Date(checkedAt);earliest.setUTCDate(earliest.getUTCDate()-60);
 const items=nodes.flatMap(n=>{const heading=all(n,x=>x.tag==='h3')[0],a=all(heading||{},x=>x.tag==='a')[0],title=txt(heading),publishedAt=all(n,x=>x.tag==='time')[0]?.attrs.datetime?.slice(0,10);if(!a||!validDate(publishedAt||'')||publishedAt<earliest.toISOString().slice(0,10)||publishedAt>checkedAt.slice(0,10)||!/ausflug|ausflüge|fahrt|anmeld|ferien/i.test(title))return [];const url=new URL(a.attrs.href,FLY_URLS.news);if(url.origin!=='https://www.fly-verl.de'||!url.pathname.startsWith('/news/'))return [];return [{id:'fly-news-'+slug(url.pathname),title,publishedAt,date:null,description:'Offizieller Hinweis zu Ausflügen oder Anmeldungen. Einzeltermine und Teilnahmebedingungen im Original prüfen.',url:url.href,sourceURL:url.href,checkedAt}];});
 return {items,checkedAt,status:'ok',sourceURL:FLY_URLS.news};
}
export function createFlySource(helpers){return async()=>{
 const results=await Promise.allSettled([helpers.getText(FLY_URLS.program),helpers.getText(FLY_URLS.news)]);
 if(results[0].status!=='fulfilled')throw results[0].reason;
 const checkedAt=new Date().toISOString(),program=parseFlyProgram(results[0].value,helpers,checkedAt);
 try{if(results[1].status!=='fulfilled')throw results[1].reason;program.news=parseFlyNews(results[1].value,helpers,new Date().toISOString());}catch{program.news={status:'error',sourceURL:FLY_URLS.news,attemptedAt:new Date().toISOString()};}
 return program;
};}
