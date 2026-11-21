import gplay from 'google-play-scraper';import fs from 'fs';
const appId='app.mycountrydelight.in.countrydelight';
const app=await gplay.app({appId,country:'in',lang:'en'});
fs.writeFileSync('app.json',JSON.stringify({title:app.title,score:app.score,ratings:app.ratings,reviews:app.reviews,histogram:app.histogram,installs:app.installs,version:app.version,updated:new Date(app.updated).toISOString(),developer:app.developer,summary:app.summary},null,1));
let all=[];
for (const sort of [gplay.sort.NEWEST]) {let tok=null;for(let i=0;i<8;i++){const r=await gplay.reviews({appId,country:'in',lang:'en',sort,num:150,paginate:true,nextPaginationToken:tok});all.push(...r.data);tok=r.nextPaginationToken;if(!tok)break;}}
const seen=new Set();all=all.filter(r=>!seen.has(r.id)&&seen.add(r.id));
fs.writeFileSync('reviews.json',JSON.stringify(all.map(r=>({id:r.id,date:r.date,score:r.score,text:r.text,thumbsUp:r.thumbsUp,version:r.version,replyDate:r.replyDate,replyText:r.replyText})),null,1));
console.log(app.title,app.score,app.ratings,app.installs,app.version,all.length);
