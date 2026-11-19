export const NEWS_REFRESH_MS=60000;
export function newestArticles(rows=[]){return [...rows].sort((a,b)=>String(b.publishedAt||'').localeCompare(String(a.publishedAt||'')));}
export async function fetchNewsFeed(base,{signal,fetcher=fetch}={}){
 const nonce=Date.now(),read=async name=>{const r=await fetcher(base+name+'.json?t='+nonce,{cache:'no-store',credentials:'omit',signal});if(!r.ok)throw Error('Nachrichtenabruf fehlgeschlagen');return r.json();};
 const [articles,digest]=await Promise.all(['articles','digest'].map(read));
 if(!Array.isArray(articles)||!Number.isFinite(Date.parse(digest?.checkedAt))||articles.some(a=>!a?.id||!a.title||!Array.isArray(a.paragraphs)||!a.paragraphs.length||!/^\d{4}-\d{2}-\d{2}$/.test(a.publishedAt))||new Set(articles.map(a=>a.id)).size!==articles.length)throw Error('Nachrichtenstand nicht lesbar');
 return {articles,checkedAt:digest.checkedAt,loadedAt:new Date().toISOString()};
}
export function mergeNewsFeed(previous,feed){
 if(Date.parse(feed.checkedAt)<(Date.parse(previous.lastDigestAt)||0))return previous;
 const ids=new Set(feed.articles.map(a=>a.id));if((previous.articles||[]).some(a=>!ids.has(a.id)))throw Error('Unvollständiger Nachrichtenstand');
 return {...previous,articles:feed.articles,lastDigestAt:feed.checkedAt};
}
