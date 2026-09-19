import csv, io, re, os, random, hashlib, collections
LET='ABCD'
def rng_for(s):
    return random.Random(int(hashlib.sha256(s.encode()).hexdigest()[:16],16))
def ascending_numeric(opts):
    vals=[]
    for o in opts:
        o=o.strip().rstrip('.').replace(',','')
        if not re.fullmatch(r'[\d.\- ]+', o): return False
        vals.append(float(o))
    return vals==sorted(vals)
def ideal_counts(n, need):
    base=n//need; extra=n%need
    return {LET[i]: (base+(1 if i<extra else 0) if i<need else 0) for i in range(4)}
def deal(counts, rng):
    rem=dict(counts); seq=[]; last=None; run=0
    while sum(rem.values())>0:
        avail=[L for L in LET if rem[L]>0]
        mx=max(rem[L] for L in avail)
        cands=[L for L in avail if rem[L]>=mx-1]
        if run>=2 and last in cands and len(cands)>1:
            cands=[L for L in cands if L!=last]
        L=rng.choice(cands)
        rem[L]-=1; seq.append(L)
        run=run+1 if L==last else 1
        last=L
    return seq
def process(tag, base, name):
    p=os.path.join(base,name)
    if tag=='quiz':
        with open(p, newline='', encoding='utf-8') as f:
            raw=f.read().split('\n')
        head=[]; data=[]
        for ln in raw:
            if not data and (not ln.strip() or ln.startswith('#') or ln.startswith('ID,')): head.append(ln)
            else: data.append(ln)
        rows=[next(csv.reader([ln])) for ln in data if ln.strip()]
        def lvl(r): return r[7].strip()
        def group_of(r): return (r[8] or '').strip()
        def letter(r): return r[6].strip()
        def islocked(r, need):
            cur=letter(r)
            if cur not in LET: return True
            a,b=r[2].strip().lower(), r[3].strip().lower()
            if {a,b}=={'true','false'} and a and b: return False
            return ascending_numeric([r[2+i] for i in range(need)])
        def applymove(r,target):
            cur=letter(r)
            if cur not in LET or cur==target: return False
            li,ti=LET.index(cur),LET.index(target)
            a,b=r[2].strip().lower(), r[3].strip().lower()
            if {a,b}=={'true','false'} and a and b:
                r[2+ti],r[2+li]=r[2+li],r[2+ti]
            else:
                r[2+ti],r[2+li]=r[2+li],r[2+ti]
            r[6]=target; return True
        def save():
            out=io.StringIO(); w=csv.writer(out, lineterminator='\n')
            for k,r in enumerate(rows,1):
                clean=[str(c).replace('"','').strip() for c in r]; clean[0]=str(k)
                w.writerow(clean)
            open(p,'w',encoding='utf-8',newline='').write('\n'.join(head).rstrip('\n')+'\n'+out.getvalue().rstrip('\n')+'\n')
    else:
        with open(p, newline='', encoding='utf-8') as f:
            raw=f.readlines()
        head=''.join(raw[:2])
        rows=list(csv.DictReader(raw[2:]))
        def lvl(r): return r['level']
        def group_of(r): return r['subject']
        def letter(r): return (re.match(r'^([A-D])', r['answer'] or '') or [None,'A'])[1]
        def islocked(r, need):
            m=re.match(r'^([A-D])\.\s*(.+)$', r['answer'] or '')
            if not m: return True
            if not (r['option'+m.group(1)] or '').strip(): return True
            return ascending_numeric([(r['option'+X] or '') for X in LET[:need]])
        def applymove(r,target):
            m=re.match(r'^([A-D])\.\s*(.+)$', r['answer'])
            cur,text=m.group(1),m.group(2).strip()
            if cur==target: return False
            li,ti=LET.index(cur),LET.index(target)
            opts=[(r['option'+L] or '') for L in LET]
            opts[ti],opts[li]=opts[li],opts[ti]
            for k,L in enumerate(LET): r['option'+L]=opts[k]
            r['answer']=f'{target}. {text}'; return True
        def save():
            out=io.StringIO(); w=csv.writer(out, lineterminator='\n', quoting=csv.QUOTE_ALL)
            w.writerow(['#','question','optionA','optionB','optionC','optionD','answer','level','subject','hint','explanation','status'])
            for k,r in enumerate(rows,1):
                w.writerow([str(k)]+[r[c] for c in ['question','optionA','optionB','optionC','optionD','answer','level','subject','hint','explanation','status']])
            open(p,'w',encoding='utf-8',newline='').write(head+out.getvalue().rstrip('\n')+'\n')
    needm={'easy':2,'medium':3,'hard':4}
    if tag=='quiz': needm={'easy':2,'medium':2,'hard':3,'expert':4}
    groups=collections.OrderedDict()
    for r in rows:
        L=lvl(r)
        if L=='extreme' or (tag=='riddle' and L=='expert'): continue
        groups.setdefault((group_of(r),L),[]).append(r)
    queues=collections.OrderedDict()
    for gkey,glist in groups.items():
        need=needm[gkey[1]]
        rng=rng_for(name+'|'+gkey[0]+'|'+gkey[1])
        lockedrows=[]; free=[]
        for r in glist:
            (lockedrows if islocked(r,need) else free).append(r)
        counts=ideal_counts(len(glist),need)
        for r in lockedrows: counts[letter(r)]-=1
        for L in LET: counts[L]=max(0,counts[L])
        slack=len(free)-sum(counts.values())
        for _ in range(max(0,slack)):
            L=min(LET, key=lambda L: counts[L]); counts[L]+=1
        queues[gkey]=deal(counts, rng)
    last1=last2=None
    moved=0
    ptr=collections.Counter()
    for r in rows:
        L=lvl(r)
        if L=='extreme' or (tag=='riddle' and L=='expert'): continue
        key=(group_of(r),L)
        q=queues[key]
        if not q: continue
        h=q[0]
        if last1==last2==h and len(q)>1 and q[1]!=h:
            q[0],q[1]=q[1],q[0]
        target=q.pop(0)
        if applymove(r,target): moved+=1
        last2,last1=last1,target
    save()
    print(f'{tag} {name}: moved {moved}')
for tag, base in [('quiz','quiz-csv'), ('riddle','plan/imports/riddle-mcq')]:
    for name in sorted(f for f in os.listdir(base) if f.endswith('.csv') and not f.startswith('.tmp')):
        process(tag, base, name)
print('queue-merge placement applied to all 22 files')
