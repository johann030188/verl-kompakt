import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import react from '@vitejs/plugin-react';
const source=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(source),temp=path.join(source,'.build'),out=path.join(temp,'dist');
fs.mkdirSync(temp,{recursive:true});
for(const name of ['Dashboard.tsx','TodayOverview.tsx','changes-utils.mjs','app-search.mjs','EventTools.tsx','event-tools.mjs','LocalPlaces.tsx','local-places.css','daily-guide.css','OpeningHours.tsx','EventHighlights.tsx','Market.tsx','market-utils.mjs','local-guide-utils.mjs','local-guide.css','Pools.tsx','pool-state.mjs','CitySearch.tsx','city-search.mjs','Favorites.tsx','Family.tsx','family-utils.mjs','Mobility.tsx','Police.tsx','expansion.css','LanguageTools.tsx','language.mjs','language.css','ui-ru.json','main.tsx','style.css','index.html']){
 let content=fs.readFileSync(path.join(name==='ui-ru.json'?root:source,name),'utf8');
 if(name==='Dashboard.tsx')content=content.replaceAll("BASE+'data/'","BASE");
 fs.writeFileSync(path.join(temp,name),content);
}
fs.copyFileSync(path.join(source,'city-search.mjs'),path.join(root,'city-search.mjs'));
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name+'.json'),'utf8'));
const initial={...read('live'),departures:read('departures'),articles:read('articles'),openingHours:read('opening-hours'),restaurants:read('restaurants'),familyGuide:read('family-guide'),eventPrices:read('event-prices'),eventTips:read('event-tips'),lastDigestAt:read('digest').checkedAt};
fs.writeFileSync(path.join(temp,'initial.json'),JSON.stringify(initial));
await build({configFile:false,root:temp,publicDir:false,base:'/verl-kompakt/',plugins:[react()],build:{outDir:out,emptyOutDir:true}});
for(const name of fs.readdirSync(path.join(out,'assets')))fs.copyFileSync(path.join(out,'assets',name),path.join(root,name));
const html=fs.readFileSync(path.join(out,'index.html'),'utf8').replaceAll('/verl-kompakt/assets/','/verl-kompakt/');
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Web-App im Repository aktualisiert; bestehende Inhalte und PWA-Adresse erhalten.');



