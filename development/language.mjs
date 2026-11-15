let language='de';
let dictionary={};
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
export function initialLanguage(){try{const q=new URLSearchParams(location.search).get('lang');if(q==='ru'||q==='de')return q;const saved=JSON.parse(localStorage.getItem('verl-language')||'null');if(saved==='ru'||saved==='de')return saved;return navigator.language?.startsWith('ru')?'ru':'de'}catch{return 'de'}}
export function setLanguage(value){language=value==='ru'?'ru':'de';if(typeof document!=='undefined'){document.documentElement.lang=language;document.title=language==='ru'?'Verl kompakt — Всё о вашем городе':'Verl kompakt – Deine Stadt. Dein Überblick.';}}
export function appLocale(){return language==='ru'?'ru-RU':'de-DE'}
export function setTranslations(value){dictionary=value||{};}
export const getTranslations=()=>dictionary;
export const displayText=value=>language==='ru'?russianText(value):value;
const plural=(n,one,few,many)=>{const x=Math.abs(+n);return x%10===1&&x%100!==11?one:x%10>=2&&x%10<=4&&(x%100<12||x%100>14)?few:many};
export function countText(n,kind){if(language!=='ru')return `${n} ${{articles:'Beiträge',offers:'Angebote',results:'Treffer',events:'Termine'}[kind]||kind}`;const forms={articles:['статья','статьи','статей'],offers:['предложение','предложения','предложений'],results:['результат','результата','результатов'],events:['мероприятие','мероприятия','мероприятий']};return `${n} ${plural(n,...(forms[kind]||[kind,kind,kind]))}`;}
export function russianText(value){
 const s=clean(value);if(!s)return value;if(Object.hasOwn(dictionary,s))return (String(value).match(/^\s*/)?.[0]||'')+dictionary[s]+(String(value).match(/\s*$/)?.[0]||'');
 let m;if((m=s.match(/^(\d+) Jahre$/)))return `${m[1]} ${plural(m[1],'год','года','лет')}`;
 if((m=s.match(/^Nur (\d+) Jahre$/)))return `Только для возраста ${m[1]} ${plural(m[1],'год','года','лет')}`;
 if((m=s.match(/^(\d+)[–-](\d+) Jahre$/)))return `${m[1]}–${m[2]} лет`;
 if((m=s.match(/^(\d+)\+ Jahre$/)))return `От ${m[1]} лет`;
 if((m=s.match(/^(\d+) oder (\d+) Jahre$/)))return `${m[1]} или ${m[2]} ${plural(m[2],'год','года','лет')}`;
 if((m=s.match(/^Alle (\d+) (Angebote|Termine|Treffer|Meldungen)(?: anzeigen| zeigen)?$/))){const nouns={Angebote:['предложение','предложения','предложений'],Termine:['событие','события','событий'],Treffer:['результат','результата','результатов'],Meldungen:['сообщение','сообщения','сообщений']};return `Показать все: ${m[1]} ${plural(m[1],...nouns[m[2]])}`;}
 if((m=s.match(/^(Merken: |Nicht mehr merken: |Favorit entfernen: |Teilen: )(.+)$/))){const p={'Merken: ':'Сохранить: ','Nicht mehr merken: ':'Удалить из сохранённого: ','Favorit entfernen: ':'Удалить из избранного: ','Teilen: ':'Поделиться: '};return p[m[1]]+russianText(m[2]);}
 if((m=s.match(/^([·•]\s*)?(\d+)\s+Termine$/)))return `${m[1]||''}${m[2]} ${plural(m[2],'занятие','занятия','занятий')}`;
 if((m=s.match(/^Platz (\d+) · (\d+) Punkte · (\d+) Spiele$/)))return `Место ${m[1]} · ${m[2]} ${plural(m[2],'очко','очка','очков')} · ${m[3]} ${plural(m[3],'игра','игры','игр')}`;
 if((m=s.match(/^Historische Informationstafel (.+)$/)))return 'Исторический информационный стенд: '+russianText(m[1]);
 if((m=s.match(/^(.+) groß ansehen$/)))return 'Открыть крупно: '+russianText(m[1]);
 if((m=s.match(/^(.+), mit Veranstaltungen$/)))return m[1]+', есть мероприятия';
 if((m=s.match(/^(Nachrichten zu |Keine Nachrichten zu )„(.+)“$/)))return `${m[1].startsWith('Keine')?'Новостей не найдено':'Новости по запросу'} «${m[2]}»`;
 if((m=s.match(/^Gilt (nicht )?im (Hallenbad|Freibad)\.$/)))return `${m[1]?'Не действует':'Действует'} в ${m[2]==='Hallenbad'?'крытом':'открытом'} бассейне.`;
 if((m=s.match(/^Die Saison (\d{4}) ist seit dem (.+) beendet\. Ein neuer Saisonbeginn ist in diesem Abruf nicht bestätigt\.$/)))return `Сезон ${m[1]} завершён ${m[2]}. Дата начала нового сезона пока не подтверждена.`;
 if((m=s.match(/^(.+) gegen (.+)$/)))return `${m[1]} — ${m[2]}`;
 if(/\d{1,2}:\d{2}\s*Uhr/.test(s))return russianText(s.replace(/(\d{1,2}:\d{2})\s*Uhr/g,'$1'));
 // Translate known fragments in longer dynamic labels without touching numbers or names.
 const parts=s.split(/( · | ·|· |\s+–\s+)/);if(parts.length>1){const result=parts.map(x=>dictionary[clean(x)]||x).join('');if(result!==s)return result;}
 return value;
}
export function matchesSearch(query,text){const q=clean(query).toLocaleLowerCase('ru');if(!q)return true;const original=String(text||'');if(original.toLocaleLowerCase('de').includes(q)||russianText(original).toLocaleLowerCase('ru').includes(q))return true;return Object.entries(dictionary).some(([de,ru])=>de.length>3&&original.includes(de)&&String(ru).toLocaleLowerCase('ru').includes(q));}
const searchAliases=[[/жилищн|квартирн.*пособ|пособ.*жиль|вохнгельд/i,'Wohngeld'],[/семейн.*карт|семейн.*паспорт|фамилиенпас/i,'Familienpass'],[/удостоверен.*личност|персоналаусвайс/i,'Personalausweis'],[/загранпаспорт|паспорт/i,'Reisepass'],[/крупногабарит|стар.*мебел/i,'Sperrmüll'],[/вывоз.*мусор|мусор|отход/i,'Abfall'],[/детск.*сад|садик/i,'Kindergarten'],[/продл[её]нк/i,'Offener Ganztag'],[/библиотек/i,'Bibliothek'],[/пропаж|найден.*вещ|бюро.*наход/i,'Fundbüro'],[/регистрац.*адрес|пропис/i,'Anmeldung'],[/свидетельств.*рожден/i,'Geburtsurkunde'],[/запис.*при[её]м/i,'Terminvereinbarung'],[/лист|листв/i,'Gartenabfälle']];
export function citySearchTerm(query){for(const [pattern,value] of searchAliases)if(pattern.test(query))return value;const q=clean(query).toLocaleLowerCase('ru');for(const [de,ru] of Object.entries(dictionary))if(clean(ru).toLocaleLowerCase('ru')===q&&de.length<100)return de;return query;}
export function translatedSiteURL(url){const u=new URL('https://translate.google.com/translate');u.searchParams.set('sl','de');u.searchParams.set('tl','ru');u.searchParams.set('hl','ru');u.searchParams.set('u',url);return u.href;}
export function translateDocument(root=document.body){
 const originalText=new WeakMap(),originalAttributes=new WeakMap();let running=false;
 const skip=el=>!el||el.closest('script,style,textarea,[data-no-translate],.notranslate');
 function apply(){if(running)return;running=true;observer.disconnect();
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){if(skip(node.parentElement))continue;let state=originalText.get(node);if(!state||node.nodeValue!==state.last)state={original:node.nodeValue,last:node.nodeValue};const next=language==='ru'?russianText(state.original):state.original;if(node.parentElement?.tagName==='OPTION'&&!node.parentElement.hasAttribute('value'))node.parentElement.setAttribute('value',state.original);if(node.nodeValue!==next)node.nodeValue=next;state.last=next;originalText.set(node,state);}
  for(const el of root.querySelectorAll('[placeholder],[aria-label],[title],[alt]')){if(skip(el))continue;const states=originalAttributes.get(el)||{};for(const key of ['placeholder','aria-label','title','alt']){if(!el.hasAttribute(key))continue;const value=el.getAttribute(key);let state=states[key];if(!state||value!==state.last)state={original:value,last:value};const next=language==='ru'?russianText(state.original):state.original;if(next!==value)el.setAttribute(key,next);state.last=next;states[key]=state;}originalAttributes.set(el,states);}
  observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title','alt']});running=false;
 }
 const observer=new MutationObserver(apply);apply();return {apply,stop(){observer.disconnect();}};
}
