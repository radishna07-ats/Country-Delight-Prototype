import json,re,collections
POS={
'P01 Milk & product quality, freshness, taste':r"quality|fresh|pure|taste|tasty|creamy|thick|malai|natural|healthy|best milk|good milk|nice milk|unadulter|no preservative|lab",
'P02 Reliable early-morning delivery':r"on time|timely|punctual|early|morning|before 7|7 ?am|daily|every day|everyday|reliab|consisten|never miss|regular",
'P03 Convenience & doorstep service':r"convenien|doorstep|door step|home delivery|hassle|easy|easily|saves? time|comfort",
'P04 App ease of use':r"(easy|simple|user.?friendly|smooth|good|nice|great|best) (to use )?(app|application|interface|ui)|app (is )?(easy|simple|smooth|good|nice|user)",
'P05 Subscription & vacation flexibility':r"subscri|pause|vacation|skip|modify|change (the )?order|flexib",
'P06 Customer support helpful':r"customer (care|service|support)|support team|resolv|helpful|quick response|responsive|refund (was|is) (quick|fast)|replac",
'P07 Value, VIP & offers':r"vip|saving|save|discount|offer|value for money|affordable|cashback|price",
'P08 Product range & groceries':r"variety|range|vegetable|fruit|grocer|paneer|curd|ghee|coconut|products",
}
pn=json.load(open('reviews.json')); io=json.load(open('ios_reviews.json'))
for name,data in [('play',[r for r in pn if r['score']>=4]),('ios',[r for r in io if r['score']>=4])]:
    c=collections.Counter(); sub=[r for r in data if len((r.get('title') or '')+(r['text'] or ''))>=20]
    for r in sub:
        t=((r.get('title') or '')+' '+(r['text'] or '')).lower(); c.update(k for k,p in POS.items() if re.search(p,t))
    print(name,'positives n=',len(data),'substantive(>=20ch)=',len(sub))
    for k in POS: print(f"  {k:48s}{c[k]:4d} {100*c[k]/len(sub):5.1f}%")
