import json,re,collections,random
NEG={
'N01 Price, value & pack size':r"price|pric(ey|y)|expensive|costly|cost |rate (is|are)|\brates?\b|mehanga|overpric|450 ?ml|500 ?ml|850|pack size|standard (size|quantit|weight)|odd|225 ?g|cheaper|hike|increas|afford|अफोर्ड|double rate|2-3x|market price",
'N02 VIP membership pressure & benefit caps':r"\bvip\b|membership|prime member|free vip|trial page|subscribe vip|forces? (you|users|to)|force to|forcing|dark pattern",
'N03 Wallet deductions, balance & refunds':r"wallet|deduct|debit|negative balance|balance|refund|withdraw|money (back|not|is|got|stuck)|cd money|paisa|paise|confiscat|not credited|stealing|0\.5|charged me|charge (extra|more)|extra charg|hidden (cost|fee|charg)|convenien|handling (fee|charg)|small (order|cart) fee",
'N04 Recharge, payment & autopay friction':r"recharg|autopay|auto.?pay|auto.?recharge|payment (fail|gateway|option|process|not|method)|payment fails|direct pay|upi|minimum (recharge|amount|payment)|3,?000|load money|add(ing)? money|food card|zaggle|cash on delivery|\bcod\b|prepaid",
'N05 Offers, cashback & referral disputes':r"offer|4 ?\+ ?3|4 ?\+ ?4|3 ?\+ ?3|1 ?\+ ?1|cash ?back|referr|reffer|refferal|coupon|free (milk|packet|product|case)",
'N06 Delivery reliability (missed, false "delivered", late, cancelled)':r"not deliver|didn.?t deliver|no deliver|never (came|arriv|deliver)|marked (as )?delivered|shows? .{0,20}delivered|false deliver|deliver(ed)? .{0,10}without|haven.?t received|delay|\blate\b|cancel(l)?ed (my |the )?order|order (got |gets )?cancel|cancel the order in the morning|without (any )?(prior )?(intimation|inform|notif)|out of stock|forgot|nahi aaya|nahi hota|nhi aaya|not received|haven.?t (been )?deliver|waiting for|afternoon",
'N07 Doorstep experience (5 AM, calls, left outside, behaviour)':r"5 ?(am|a\.m)|5:00|5:45|door ?bell|ring(s|ing)? the bell|wake (me|us)|wale you up|disturb my sleep|sleep disturb|left outside|outside|security|main gate|doorstep|door step|rude|behaviou?r|unprofessional|harsh|delivery (boy|guy|person|partner|agent).{0,40}(call|rude|refus)|wrong address|different (address|location)|photo|video|hawker",
'N08 Product quality, freshness & damage':r"quality|fresh|stale|rotten|spoil|sour|curd|leak|damag|broken|crack|smash|expir|batch|manufactur|watery|thin|malai|adulter|chemical|urea|fake (milk|product)|hormone|coconut.{0,60}(water|empty|half|ml|glass|dried|used)|half glass|seal|less (quantity|water)|stink|smell|taste",
'N09 Customer support access & resolution':r"customer (care|service|support)|support|helpline|help section|help/support|no (help|response|reply)|complain|complai|ticket|chat ?bot|bot|robot|executive|associate|escalat|resolv|resolution|call (center|centre)|numbers? .{0,30}(connect|available)|telugu|on hold|quality team",
'N10 Subscription, vacation & schedule control':r"vacation|subscri|skip|pause|calend[ae]r|modify|change (the )?(next )?(delivery|date|order)|edit|reschedul|auto(matically)? (add|deliver|continu)|adds? items? on its own|without (my )?(consent|concent|request)|unnecessary delivery|placed a long order|add(ing)? items? (in|to) (your )?cart|time slot|preferred (time|slot)|7 ?am|7:30",
'N11 App usability, performance & login':r"\bapp\b.{0,40}(slow|confus|complicat|tricky|crash|hang|not working|not opening|not user|worst|horrible|pathetic|useless|difficult|non intuitive|bad)|user interface|\bui\b|\bux\b|interface|navigation|otp|login|log in|crash|loading|loading|slow|pop.?up|showing ads|ads continuously|so many ads|spam ads|popping|redirect|search|keyboard|new update|not compatible|not getting updated",
'N12 Serviceability (area not covered)':r"not (available|serviceable|deliverable)|non.?serviceable|service(able)? (is )?not available|my (area|location|city)|in my area|location (is )?(unavailable|not)|out of range|service zone|kab aa rahe|not deliver(ed)? (my|to) (location|all location)|rural",
'N13 Unwanted calls & messages':r"call(s|ing)? (for offers|every|repeatedly|customers)|10 10 phone|phone calls|keep calling|continue calling|spam|whatsapp with|annoying person|calling every week|stop calling",
}
POSQ=re.compile(r"(milk|product|their)? ?quality (is|was) (good|great|best|excellent|10/10|absolute)|app ki quality|quality is 💯|products are good|milk bahut achcha")
def codes(t,TT):
    t=(t or '').lower(); out=[k for k,p in TT.items() if re.search(p,t)]
    if 'N08 Product quality, freshness & damage' in out and POSQ.search(t) and not re.search(r"stale|rotten|spoil|sour|leak|damag|expir|watery|adulter|deteriorat|degrad|poor quality|bad quality|worse",t): out.remove('N08 Product quality, freshness & damage')
    return out
pn=json.load(open('reviews.json')); io=json.load(open('ios_reviews.json'))
neg_p=[r for r in pn if r['score']<=2]; neg_i=[r for r in io if r['score']<=2]
res={}
for name,data in [('play',neg_p),('ios',neg_i)]:
    c=collections.Counter(); unc=0; coded=[]
    for r in data:
        cs=codes((r.get('title') or '')+' '+(r['text'] or ''),NEG); coded.append((r,cs))
        if not cs: unc+=1
        c.update(cs)
    res[name]=(len(data),c,unc,coded)
    print(f"\n{name} negatives n={len(data)} uncoded={unc}")
    for k in NEG: print(f"  {k:62s} {c[k]:4d}  {100*c[k]/len(data):5.1f}%")
json.dump({n:{'n':v[0],'uncoded':v[2],'counts':dict(v[1])} for n,v in res.items()},open('neg_counts.json','w'),indent=1)
# precision sample
random.seed(7); samp=random.sample([x for x in res['play'][3] if x[1] and len(x[0]['text'] or '')>40],45)
with open('precision_sample.txt','w') as f:
    for r,cs in samp: f.write(f"{r['id'][:12]}|{r['score']}|{'; '.join(c[:3] for c in cs)}|{(r['text'] or '')[:240]}\n")
# exemplar store
json.dump([{'id':r['id'],'date':r['date'],'score':r['score'],'text':r['text'],'codes':cs} for r,cs in res['play'][3]+res['ios'][3]],open('neg_coded.json','w'),indent=0)
