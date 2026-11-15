import React,{useEffect,useState} from 'react';
import {ArrowUpRight,CalendarDays,Clock,Info,MapPin,ShieldCheck,Ticket,Waves} from 'lucide-react';
import {berlinNow,publicHours,nextSessions,DAYS} from './pool-state.mjs';

const date=(s:string)=>new Date(s+'T12:00:00Z').toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Berlin'});
const checked=(s:string)=>s?new Date(s).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'})+' Uhr':'noch nicht bestätigt';
const ranges=(rs:any[])=>rs?.length?rs.map(([a,b])=>a+'–'+b+' Uhr').join(' · '):'Kein öffentliches Schwimmen';
const link=(url:string,label:string,primary=false)=><a className={primary?'primary-button':'outline-button'} href={url} target="_blank" rel="noreferrer">{label}<ArrowUpRight size={17}/></a>;

export default function Pools({data,offline=false}:any){
 const [which,setWhich]=useState('indoor'),[card,setCard]=useState(''),[filter,setFilter]=useState('Alle'),[all,setAll]=useState(false),[now,setNow]=useState(new Date());
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[]);
 const today=berlinNow(now),pool=which==='indoor'?data.poolIndoor:data.poolOutdoor,courses=data.poolCourses;
 const status=data.statuses?.find((s:any)=>s.id===(which==='indoor'?'poolIndoor':'poolOutdoor'));
 const courseStatus=data.statuses?.find((s:any)=>s.id==='poolCourses');
 const stale=offline||status?.status==='error'||!pool?.checkedAt||now.getTime()-Date.parse(pool.checkedAt)>36*3600000;
 const staleCourses=offline||courseStatus?.status==='error'||!courses?.checkedAt||now.getTime()-Date.parse(courses.checkedAt)>36*3600000;
 const seasonClosed=pool?.season?.status==='closed'&&today.date>=pool.season.closedSince;
 const sessions=nextSessions(courses,now).filter((s:any)=>filter==='Alle'||s.name===filter);
 const types=(courses?.courses||[]).map((c:any)=>c.name);
 const notices=(pool?.notices||[]).filter((n:any)=>n.date>=today.date);
 const play=(pool?.play||[]).filter((p:any)=>p.date>=today.date);
 const selectedCard=pool?.cards?.find((c:any)=>c.name===card);
 return <div className="pools">
  <div className="pool-switch" role="group" aria-label="Bad auswählen">{[['indoor','Hallenbad'],['outdoor','Freibad']].map(([id,name])=><button key={id} className={which===id?'active':''} onClick={()=>setWhich(id)}><Waves size={21}/>{name}</button>)}</div>
  {!pool?<div className="notice"><Info size={22}/><div><strong>Badzeiten konnten noch nicht bestätigt werden.</strong><p>Bitte prüfe den Stand auf der offiziellen Stadtseite.</p>{link(which==='indoor'?'https://www.verl.de/freizeit-kultur/sport/hallenbad.html':'https://www.verl.de/freizeit-kultur/sport/freibad.html','Offizielle Badseite')}</div></div>:<>
   {stale&&<div className="notice pool-warning"><Info size={22}/><span>Der aktuelle Abruf ist nicht bestätigt. Angezeigt wird der zuletzt gespeicherte Stand vom {checked(pool.checkedAt)}. Bitte vor dem Besuch die offizielle Badseite prüfen.</span></div>}
   <div className="pool-top-grid">
    <section className={'pool-today '+(seasonClosed?'pool-season-closed':'')}>
     <div className="quick-top"><span className="circle-icon blue"><Waves size={25}/></span><span className="mini-label">Stadt Verl · offizielle Angaben</span></div>
     <h2>{pool.name}</h2><p className="pool-address"><MapPin size={17}/>{pool.address}</p>
     <span className="eyebrow">{seasonClosed?'Saisonpause':stale?'Gespeicherter Wochenplan':'Heute · '+today.day}</span>
     <h3 className="pool-today-time">{seasonClosed?'Freibad geschlossen':which==='outdoor'?'Saisonstatus prüfen':ranges(publicHours(pool,today.date,today.day))}</h3>
     <p>{seasonClosed?`Die Saison ${pool.season.closedSince.slice(0,4)} ist seit dem ${date(pool.season.closedSince)} beendet. Ein neuer Saisonbeginn ist in diesem Abruf nicht bestätigt.`:which==='outdoor'?'Die veröffentlichten Saisonzeiten allein bestätigen keinen heutigen Badebetrieb. Bitte die aktuelle Saisonmeldung der Stadt prüfen.':'Öffentliches Schwimmen nach dem veröffentlichten Plan. Sonderregelungen stehen direkt darunter.'}</p>
     {link(pool.sourceURL,'Offizielle Badseite',true)}
    </section>
    <section className="pool-card-check">
     <span className="circle-icon green"><Ticket size={24}/></span><h2>Gilt meine Karte?</h2>
     <label htmlFor="pool-card">Bezeichnung auf deiner Karte</label><select id="pool-card" value={card} onChange={e=>setCard(e.target.value)}><option value="">Karte auswählen</option>{pool.cards.map((c:any)=><option key={c.name}>{c.name}</option>)}</select>
     {selectedCard&&<p className={'pool-card-result '+(selectedCard[which]?'valid':'invalid')}>{selectedCard[which]?`Gilt im ${which==='indoor'?'Hallenbad':'Freibad'}.`:`Gilt nicht im ${which==='indoor'?'Hallenbad':'Freibad'}.`}</p>}
     <p>Eine <b>Freibad-Saisonkarte</b> gilt ausschließlich im Freibad. <b>Kombi-Jahreskarte</b> und <b>Kombi-12er Karte</b> gelten in beiden Bädern.</p>
     <p className="small">Eine gültige Karte ermöglicht den Eintritt während der öffentlichen Badezeiten. Kurse sind gesondert zu buchen. Außerhalb der öffentlichen Zeiten gibt es keinen freien Badebetrieb mit der Karte.</p>
    </section>
   </div>
   {(notices.length>0||play.length>0)&&<section className="pool-notices"><h2>Änderungen & besondere Termine</h2>{notices.map((n:any)=><div key={n.date}><CalendarDays size={21}/><p><strong>{date(n.date)} · {n.title}</strong><br/>{n.closed?'Kein öffentlicher Badebetrieb.':n.ranges?ranges(n.ranges):n.until?'Öffentlicher Badebetrieb nur bis '+n.until+' Uhr.':'Details bitte bei der Stadt prüfen.'}</p></div>)}{play.length>0&&<div><Waves size={21}/><p><strong>Wasserparcours · {ranges(play[0].ranges)}</strong><br/>{play.map((p:any)=>date(p.date)).join(' · ')}<br/>Der Parcours belegt einen großen Teil des Schwimmerbeckens. Reguläres Schwimmen ist eingeschränkt.</p></div>}</section>}
   <div className="pool-info-grid">
    <section className="pool-panel"><div className="section-heading"><div><span className="eyebrow">{which==='outdoor'?'Nur während der geöffneten Saison':'Öffentliches Schwimmen'}</span><h2>{which==='outdoor'?'Veröffentlichte Saisonzeiten':'Reguläre Öffnungszeiten'}</h2></div><Clock size={24}/></div>
     <div className="pool-hours">{pool.week.map((d:any)=><div key={d.day} className={!seasonClosed&&d.day===today.day?'is-today':''}><strong>{d.day}{!seasonClosed&&d.day===today.day&&<small>Heute</small>}</strong><span>{ranges(d.ranges)}</span></div>)}</div>
     {pool.lastEntryMinutes&&<p className="small">Letzter Einlass: {pool.lastEntryMinutes} Minuten vor Ende der Öffnungszeit. Die Stadt nennt dieselben Saisonzeiten für gesetzliche Feiertage.</p>}
     <p className="small">{which==='indoor'?'Feiertage und kurzfristige Änderungen bitte auf der offiziellen Badseite prüfen. Schul- und Vereinszeiten außerhalb dieses Plans sind keine öffentlichen Schwimmzeiten.':'Diese Tabelle gilt nur bei geöffnetem Freibad. Sie ist keine Bestätigung eines Saisonbeginns.'}</p>
    </section>
    <section className="pool-panel"><span className="eyebrow">Gut zu wissen</span><h2>{which==='indoor'?'Welche Becken sind frei?':'Dein Freibadbesuch'}</h2>
     {which==='indoor'?<>
      {pool.restriction?<div className="pool-fact"><strong>{pool.restriction.publicLanes} von {pool.restriction.totalLanes} Bahnen öffentlich</strong><p>{pool.week.filter((d:any)=>d.restricted).map((d:any)=>d.day).join(', ')} · {pool.restriction.from}–{pool.restriction.to} Uhr. Parallel findet Vereinstraining statt.</p></div>:<p>Die aktuelle Beckenbelegung bitte auf der Badseite prüfen.</p>}
      {pool.multi&&<div className="pool-fact"><strong>Multifunktionsbecken · {pool.multi.depth} m Wassertiefe</strong><p>Freitag ab {pool.multi.friday} Uhr, Samstag ab {pool.multi.saturday} Uhr sowie Sonntag verfügbar. Während des parallelen Vereinstrainings sonst nicht öffentlich nutzbar.</p></div>}
      <div className="pool-fact"><strong>Kurszeit ist keine freie Schwimmzeit</strong><p>Zum Beispiel kann ein gebuchter Kurs montags nachmittags stattfinden, obwohl das Bad dann nicht für den allgemeinen Badebetrieb geöffnet ist.</p></div>
     </>:<><div className="pool-fact"><strong>{seasonClosed?'Aktuell kein Badebetrieb':'Saisonmeldung zuerst prüfen'}</strong><p>In der Saison sind die öffentlichen Badezeiten mit einer gültigen Freibad- oder Kombikarte nutzbar. Ein eigener Kurs ist dafür nicht erforderlich.</p></div><div className="pool-fact"><strong>Hallenbad als Alternative</strong><p>Die reine Freibad-Saisonkarte gilt dort nicht. Prüfe oben die genaue Kartenbezeichnung.</p><button className="text-button" onClick={()=>setWhich('indoor')}>Zum Hallenbad <ArrowUpRight size={17}/></button></div></>}
    </section>
   </div>
   <p className={'source-note '+(stale?'warn':'')}><ShieldCheck size={16}/>Stadt Verl · geprüft am {checked(pool.checkedAt)} · stündlicher automatischer Abruf</p>
  </>}
  <section className="pool-course-section">
   <div className="section-heading"><div><span className="eyebrow">Offizielles Bäder-Kursportal</span><h2>Kurse & Schwimmen lernen</h2></div>{link('https://baeder.verl.de/de/courses/','Kursportal öffnen')}</div>
   <p>Bestätigte Termine aus dem Buchungsportal. Kurse benötigen eine eigene Buchung; die Karten oben ersetzen keine Kursanmeldung.</p>
   {staleCourses&&<div className="notice"><Info size={21}/><span>Die Kursdaten sind aktuell nicht bestätigt. Bitte Termine und Verfügbarkeit direkt im offiziellen Portal prüfen.</span></div>}
   <div className="category-row pool-course-filters">{['Alle',...types].map((name:any)=><button key={name} className={filter===name?'active':''} onClick={()=>{setFilter(name);setAll(false)}}>{name}</button>)}</div>
   <div className="pool-course-grid">{sessions.slice(0,all?100:6).map((s:any)=><article className="pool-course" key={s.id}><span className="eyebrow">{s.location}</span><h3>{s.name}</h3><p><CalendarDays size={17}/><strong>{date(s.date)}{s.endDate!==s.date?' bis '+date(s.endDate):''}</strong></p><p><Clock size={17}/><b>{s.time} Uhr</b>{s.endDate!==s.date?' · Kursblock':''}</p><span className={'pool-booking '+(s.status==='full'?'full':'')}>{s.status==='full'?'Beim Abruf ausgebucht':'Termin im Portal gelistet'}</span>{link(s.url,'Kursdetails & Buchung')}</article>)}</div>
   {!sessions.length&&<div className="pool-course-empty"><CalendarDays size={26}/><p>Für diese Auswahl sind keine kommenden datierten Kursblöcke im bestätigten Abruf gelistet. Neue Anmeldetermine und freie Plätze bitte im offiziellen Kursportal prüfen.</p></div>}
   {sessions.length>6&&<button className="outline-button pool-more" onClick={()=>setAll(!all)}>{all?'Weniger Termine zeigen':`Alle ${sessions.length} Termine zeigen`}</button>}
   <p className="small">Plätze können sich seit dem Abruf geändert haben. Maßgeblich ist die Verfügbarkeit im offiziellen Buchungsportal.</p>
   {courses?.weekly?.length>0&&<details className="pool-weekly" open={filter!=='Alle'&&sessions.length===0?true:undefined}><summary>Wochenkursplan · einschließlich Kinderkurse</summary><p>Der offizielle Wochenplan zeigt diese Kurszeiten. Er bestätigt keine freien Plätze und keinen neuen Kursblock. Weitere datierte Kurse stehen in der Terminliste oben.</p>{courses.weekly.filter((c:any)=>filter==='Alle'||c.name===filter).map((c:any)=><div key={c.name+c.from}><span><strong>{c.name}</strong><br/>{c.day} · {c.from}–{c.to} Uhr</span>{link(c.url,'Im Kursplan ansehen')}</div>)}{link(courses.planURL,'Vollständiger offizieller Kursplan')}</details>}
   <p className={'source-note '+(staleCourses?'warn':'')}><ShieldCheck size={16}/>Bäder Verl · Kursdaten geprüft am {checked(courses?.checkedAt)}</p>
  </section>
 </div>
}
