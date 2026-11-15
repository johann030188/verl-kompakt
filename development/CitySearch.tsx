import React,{useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Landmark,LoaderCircle,Search,ShieldCheck,WifiOff,X} from 'lucide-react';
import {cityApiURL,serviceRows,rankTopics,officialSearchURL,CITY_PORTAL} from './city-search.mjs';
const time=(s:string)=>s?new Date(s).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'})+' Uhr':'nicht bestätigt';
export default function CitySearch({query,onQuery,data,offline=false,onNews,showExamples=true}:any){
 const [remote,setRemote]=useState<any[]>([]),[state,setState]=useState('idle'),[at,setAt]=useState(''),[revision,setRevision]=useState(0),[expanded,setExpanded]=useState(false);
 const input=useRef<HTMLInputElement>(null),sequence=useRef(0);
 const active=query.trim().length>=2,index=data.citySearch,status=data.statuses?.find((s:any)=>s.id==='citySearch');
 const topics=new Map((index?.topics||[]).map((r:any)=>[r.url,r]));remote.forEach(r=>topics.set(r.url,{...r,apiMatch:true}));
 const results=active?rankTopics(query,[...topics.values()],500):[];
 const old=status?.status==='error'||!index?.checkedAt||Date.now()-Date.parse(index.checkedAt)>36*3600000;
 useEffect(()=>{
  const seq=++sequence.current;setRemote([]);setExpanded(false);setAt('');if(!active){setState('idle');return;}
  if(offline){setState('offline');return;}
  const controller=new AbortController();setState('loading');
  const timer=setTimeout(async()=>{const timeout=setTimeout(()=>controller.abort(),10000);try{const response=await fetch(cityApiURL(query),{credentials:'omit',signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('Stadt-Suche derzeit nicht erreichbar');const rows=serviceRows(await response.json());if(sequence.current===seq){setRemote(rows);setAt(new Date().toISOString());setState('live');}}catch{if(sequence.current===seq)setState('error');}finally{clearTimeout(timeout);}},revision?150:500);
  return()=>{sequence.current++;clearTimeout(timer);controller.abort()};
 },[query,revision,offline]);
 return <section className="city-search" aria-label="Suche nach Stadt-Themen und Nachrichten">
  <form className="city-search-form" role="search" onSubmit={e=>{e.preventDefault();setRevision(v=>v+1);input.current?.blur()}}>
   <label className="city-search-input"><Search size={23}/><span className="sr-only">Verl durchsuchen: Stadt-Themen und Nachrichten</span><input ref={input} type="search" value={query} maxLength={160} onChange={e=>{onQuery(e.target.value);setRevision(0)}} placeholder="Wohngeld, Familienpass, Nachrichten …" aria-label="Verl durchsuchen: Stadt-Themen und Nachrichten" autoComplete="off"/>{query&&<button type="button" aria-label="Suche löschen" onClick={()=>{onQuery('');input.current?.focus()}}><X size={19}/></button>}</label>
   <button type="submit" className="primary-button" aria-label="Suche starten"><Search size={19}/><span>Suchen</span></button>
  </form>
  {!query&&showExamples&&<div className="city-search-examples"><span>Direkt finden:</span>{['Wohngeld','Familienpass','Personalausweis','Sperrmüll'].map(s=><button key={s} onClick={()=>onQuery(s)}>{s}</button>)}</div>}
  {query.length===1&&<p className="city-search-hint">Gib mindestens zwei Zeichen ein.</p>}
  {active&&<div className="city-search-results">
   <div className="city-results-heading"><div><span className="eyebrow">Offizielle Angebote</span><h2>Bei der Stadt Verl</h2></div><span className="city-result-count">{results.length} Treffer</span></div>
   <div className={'city-search-status '+(['error','offline'].includes(state)?'warn':'')} role="status" aria-live="polite">{state==='loading'?<><LoaderCircle className="city-search-spinner" size={16}/>Serviceportal wird durchsucht …</>:state==='live'?<><ShieldCheck size={16}/>Serviceportal live erreicht · {time(at)}</>:<><WifiOff size={16}/>{state==='offline'?'Offline · gespeichertes Verzeichnis':'Live-Suche derzeit nicht erreichbar · gespeichertes Verzeichnis'} · Stand {time(index?.checkedAt)}</>}</div>
   {old&&<p className="city-search-hint">Das gespeicherte Themenverzeichnis konnte zuletzt nicht bestätigt werden. Aktuelle Angaben findest du auf den verlinkten Stadtseiten.</p>}
   {results.length>0?<div className="city-result-grid">{results.slice(0,expanded?500:6).map((r:any)=><a key={r.url} className="city-result" href={r.url} target="_blank" rel="noreferrer"><span className="circle-icon blue"><Landmark size={21}/></span><span><small>{r.kind==='service'?'Städtische Dienstleistung':'Offizielle Stadtseite'}</small><strong>{r.title}</strong><span>www.verl.de</span></span><ArrowUpRight size={21}/></a>)}</div>:<p className="city-no-results">{state==='loading'?'Die Live-Suche läuft.':'Kein passendes Stadt-Thema gefunden. Versuche ein anderes Stichwort oder öffne die vollständige Suche der Stadt.'}</p>}
   <div className="city-search-actions">{results.length>6&&<button className="outline-button" onClick={()=>setExpanded(!expanded)}>{expanded?'Weniger Treffer':`Alle ${results.length} Treffer anzeigen`}</button>}<a className="outline-button" href={officialSearchURL(query)} target="_blank" rel="noreferrer">Auf verl.de weitersuchen <ArrowUpRight size={17}/></a>{onNews&&<button className="text-button" onClick={onNews}>Passende Nachrichten <ArrowUpRight size={16}/></button>}<a className="text-button" href={CITY_PORTAL} target="_blank" rel="noreferrer">Serviceportal <ArrowUpRight size={16}/></a></div>
   <p className="city-search-hint">Die Treffer öffnen das jeweilige Thema direkt bei der Stadt Verl. Nachrichten dieser App findest du in der Rubrik „Nachrichten“.</p>
  </div>}
 </section>
}
