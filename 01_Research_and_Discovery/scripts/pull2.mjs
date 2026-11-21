import gplay from 'google-play-scraper';import fs from 'fs';
const appId='app.mycountrydelight.in.countrydelight';let all=[];
for (const s of [1,2,3]) {const r=await gplay.reviews({appId,country:'in',lang:'en',sort:gplay.sort.HELPFULNESS,num:150,filterScoreWith:s});all.push(...r.data);}
fs.writeFileSync('reviews_helpful_low.json',JSON.stringify(all.map(r=>({id:r.id,date:r.date,score:r.score,text:r.text,thumbsUp:r.thumbsUp,version:r.version,replyText:r.replyText})),null,1));console.log(all.length);
