#!/usr/bin/env python3
"""Read-only quality audit of quiz MCQ (quiz-csv/*.csv) and riddle MCQ
(plan/imports/riddle-mcq/*.csv) authoring files. Writes a report, changes nothing."""
import csv, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUIZ_DIR = os.path.join(ROOT, "quiz-csv")
RIDDLE_DIR = os.path.join(ROOT, "plan", "imports", "riddle-mcq")

# UI display spec (AnswerOptions.tsx BUG-016): options are sliced A..count
# Quiz 'extreme' rows are OPEN-ENDED (typed answer, graded against correctAnswer
# text — quiz-mcq-scoring.ts) and Riddle 'expert' rows are OPEN-ENDED
# (riddle-scoring.ts difficulty==='expert' → text compare vs answer column).
QUIZ_COUNTS = {"easy": 2, "medium": 2, "hard": 3, "expert": 4}
RIDDLE_COUNTS = {"easy": 2, "medium": 3, "hard": 4, "expert": 4}
LETTERS = ["A", "B", "C", "D"]
VALID_LEVELS = {"easy", "medium", "hard", "expert", "extreme"}

issues = collections.defaultdict(list)   # issue class -> list of (file, rowdesc, detail)
stats = {}

def add(cls, file, row, detail, cap=400):
    if len(issues[cls]) < cap:
        issues[cls].append((file, row, detail))

def norm(s):
    v = re.sub(r"\s+", " ", (s or "").strip()).lower()
    return v.rstrip("?").strip()

def read_csv(path):
    # skip blank lines and '# Subject:'/'# Category:' comment lines, but keep
    # the riddle header line which itself starts with '#' (it contains commas)
    with open(path, newline="", encoding="utf-8-sig") as f:
        lines = [ln for ln in f
                 if ln.strip() and not (ln.lstrip().startswith("#") and "," not in ln)]
    return list(csv.DictReader(lines))

# ---------------- quiz ----------------
quiz_rows = []
for name in sorted(os.listdir(QUIZ_DIR)):
    if not name.endswith(".csv") or name.startswith(".tmp"):
        continue  # .tmp-sports-*.csv are raw shard fragments, not canonical
    rows = read_csv(os.path.join(QUIZ_DIR, name))
    stats[f"quiz:{name}"] = len(rows)
    seen_local = {}
    for r in rows:
        rid = (r.get("ID") or "").strip()
        q = (r.get("Question") or "").strip()
        opts = {L: (r.get(f"Option {L}") or "").strip() for L in LETTERS}
        ans = (r.get("Correct Answer") or "").strip().upper()
        lvl = (r.get("Level") or "").strip().lower()
        ch = (r.get("Chapter") or "").strip()
        rowdesc = f"ID {rid}"
        key = norm(q)
        if not q:
            add("quiz: empty question", name, rowdesc, "")
        if key in seen_local:
            add("quiz: duplicate question (within file)", name, rowdesc, f"dup of ID {seen_local[key]}")
        else:
            seen_local[key] = rid
        quiz_rows.append(dict(file=name, rid=rid, q=q, key=key, opts=opts, ans=ans, lvl=lvl, ch=ch))
        if lvl not in VALID_LEVELS:
            add("quiz: invalid level", name, rowdesc, repr(lvl))
        if lvl == "extreme":
            # open-ended tier: graded on correctAnswer TEXT, options unused.
            # One-character answers are valid here (digits, chemical symbols).
            if not ans:
                add("quiz: open-ended without answer text", name, rowdesc, "")
            if q and not q.endswith("?"):
                add("quiz: open-ended question lacks ?", name, rowdesc, q[:90])
            continue
        if ans not in LETTERS:
            add("quiz: bad correct-letter", name, rowdesc, repr(r.get("Correct Answer")))
            continue
        need = QUIZ_COUNTS.get(lvl, 4)
        nonempty = [L for L in LETTERS[:need] if opts[L]]
        # winnability: correct letter must be displayed AND have text; enough options to show
        if not opts[ans]:
            add("quiz: correct option EMPTY", name, rowdesc, f"correct={ans} has no text")
        if LETTERS.index(ans) >= need:
            add("quiz: UNWINNABLE correct letter outside displayed slice", name, rowdesc,
                f"level={lvl} shows {need} options (A-{LETTERS[need-1]}) but correct={ans}")
        if len(nonempty) < need and opts[ans]:
            add("quiz: too few displayed options", name, rowdesc,
                f"level={lvl} needs {need}, has {len(nonempty)} non-empty")
        texts = [opts[L] for L in LETTERS if opts[L]]
        low = [t for t in texts if norm(t)]
        if len(low) != len(set(low)):
            add("quiz: duplicate options within question", name, rowdesc, "; ".join(texts))
        if ans in LETTERS and opts[ans]:
            for L, t in opts.items():
                if L != ans and t and (norm(t) in norm(opts[ans]) or norm(opts[ans]) in norm(t)):
                    add("quiz: option contained in correct answer (or vice versa)", name, rowdesc,
                        f"{L}='{t}' vs {ans}='{opts[ans]}'")
                    break
        if {opts["A"].lower(), opts["B"].lower()} == {"true", "false"}:
            pass  # True/False pair in any order — statement phrasing is fine
        elif q and not q.endswith("?"):
            add("quiz: statement without ?", name, rowdesc, q[:90])
        if q and len(q) < 12:
            add("quiz: very short question", name, rowdesc, q)
        if "____" in q or "___" in q:
            add("quiz: fill-in-blank style", name, rowdesc, q[:90])
        for L, t in opts.items():
            if re.search(r"\b(all|none) of the above\b|\bboth a and b\b", t, re.I):
                add("quiz: above-referencing option (breaks slicing)", name, rowdesc, f"{L}='{t}'")
        if ans in LETTERS and opts[ans] and norm(q).find(norm(opts[ans])) >= 0 and len(norm(opts[ans])) > 3:
            add("quiz: answer text appears in question", name, rowdesc, q[:90])

# cross-file quiz duplicates
byq = collections.defaultdict(list)
for r in quiz_rows:
    if r["key"]:
        byq[r["key"]].append(r)
cross = {k: v for k, v in byq.items() if len({(x["file"], x["rid"]) for x in v}) > 1
         and len({x["file"] for x in v}) > 1}
for k, v in list(cross.items())[:400]:
    add("quiz: duplicate question across files", v[0]["file"], v[0]["rid"],
        f"also in {[(x['file'], x['rid']) for x in v[1:]][:2]}: {v[0]['q'][:80]}")

# quiz aggregates
qa = collections.Counter()
for r in quiz_rows:
    qa[("level", r["lvl"])] += 1
    if r["ans"] in LETTERS:
        qa[("letter", r["ans"])] += 1
    qa[("tf", "yes" if r["opts"]["A"].lower() == "true" and r["opts"]["B"].lower() == "false" else "no")] += 1
    qa[("chapter", r["ch"])] += 1
stats["quiz: total rows"] = len(quiz_rows)

# ---------------- riddles ----------------
riddle_rows = []
for name in sorted(os.listdir(RIDDLE_DIR)):
    if not name.endswith(".csv"):
        continue
    rows = read_csv(os.path.join(RIDDLE_DIR, name))
    stats[f"riddle:{name}"] = len(rows)
    seen_local = {}
    for i, r in enumerate(rows, start=3):
        rid = (r.get("#") or "").strip()
        q = (r.get("question") or "").strip()
        opts = {L: (r.get(f"option{L}") or "").strip() for L in LETTERS}
        ansraw = (r.get("answer") or "").strip()
        lvl = (r.get("level") or "").strip().lower()
        subj = (r.get("subject") or "").strip()
        hint = (r.get("hint") or "").strip()
        expl = (r.get("explanation") or "").strip()
        status = (r.get("status") or "").strip().lower()
        rowdesc = f"line {i} (#{rid})"
        key = norm(q)
        if not q:
            add("riddle: empty question", name, rowdesc, "")
        if key in seen_local:
            add("riddle: duplicate question (within file)", name, rowdesc, f"dup of #{seen_local[key]}")
        else:
            seen_local[key] = rid
        riddle_rows.append(dict(file=name, rid=rid, q=q, key=key, opts=opts, ansraw=ansraw,
                                lvl=lvl, subj=subj, hint=hint, expl=expl, status=status))
        if lvl not in VALID_LEVELS:
            add("riddle: invalid level", name, rowdesc, repr(lvl))
        if lvl == "expert":
            # open-ended tier: graded on answer TEXT (riddle-scoring.ts), options unused
            if not ansraw:
                add("riddle: open-ended without answer text", name, rowdesc, "")
            elif re.fullmatch(r"[A-Da-d]", ansraw):
                add("riddle: open-ended answer is a bare letter", name, rowdesc, repr(ansraw))
            if not expl:
                add("riddle: missing explanation", name, rowdesc, "")
            if not hint:
                add("riddle: missing hint", name, rowdesc, "")
            if status != "published":
                add("riddle: status not published", name, rowdesc, repr(status))
            continue
        # MCQ riddle rows must use the importer's 'X. text' form (dot required,
        # import-riddle-csv.ts: /^([A-D])\.\s*(.*)$/i)
        m = re.match(r"^([A-D])\.\s*(.+)$", ansraw)
        if not m:
            add("riddle: answer not in 'X. text' form", name, rowdesc, repr(ansraw[:60]))
            continue
        ans = m.group(1).upper()
        anstext = m.group(2).strip()
        need = RIDDLE_COUNTS.get(lvl, 4)
        nonempty = [L for L in LETTERS[:need] if opts[L]]
        if not opts[ans]:
            add("riddle: correct option EMPTY", name, rowdesc, f"correct={ans} has no text")
        if LETTERS.index(ans) >= need:
            add("riddle: UNWINNABLE correct letter outside displayed slice", name, rowdesc,
                f"level={lvl} shows {need} options (A-{LETTERS[need-1]}) but correct={ans}")
        if len(nonempty) < need and opts[ans]:
            add("riddle: too few displayed options", name, rowdesc,
                f"level={lvl} needs {need}, has {len(nonempty)} non-empty")
        if anstext and norm(anstext) != norm(opts[ans]):
            add("riddle: answer text mismatch with option", name, rowdesc,
                f"answer says '{anstext[:50]}' vs option{ans}='{opts[ans][:50]}'")
        texts = [opts[L] for L in LETTERS if opts[L]]
        low = [norm(t) for t in texts if norm(t)]
        if len(low) != len(set(low)):
            add("riddle: duplicate options within question", name, rowdesc, "; ".join(texts))
        if opts[ans]:
            for L, t in opts.items():
                if L != ans and t and (norm(t) in norm(opts[ans]) or norm(opts[ans]) in norm(t)):
                    add("riddle: option contained in correct answer (or vice versa)", name, rowdesc,
                        f"{L}='{t}' vs {ans}='{opts[ans]}'")
                    break
        if ans in LETTERS and opts[ans] and len(norm(opts[ans])) > 3 and norm(opts[ans]) in norm(q):
            add("riddle: answer text appears in question", name, rowdesc, q[:90])
        for L, t in opts.items():
            if re.search(r"\b(all|none) of the above\b|\bboth a and b\b", t, re.I):
                add("riddle: above-referencing option (breaks slicing)", name, rowdesc, f"{L}='{t}'")
        if not hint:
            add("riddle: missing hint", name, rowdesc, "")
        if not expl:
            add("riddle: missing explanation", name, rowdesc, "")
        if status != "published":
            add("riddle: status not published", name, rowdesc, repr(status))
        if len(q) > 220:
            add("riddle: very long question", name, rowdesc, f"{len(q)} chars")

byqr = collections.defaultdict(list)
for r in riddle_rows:
    if r["key"]:
        byqr[r["key"]].append(r)
crossr = {k: v for k, v in byqr.items() if len({x["file"] for x in v}) > 1}
for k, v in list(crossr.items())[:400]:
    add("riddle: duplicate question across files", v[0]["file"], v[0]["rid"],
        f"also in {[(x['file'], x['rid']) for x in v[1:]][:2]}: {v[0]['q'][:80]}")

ra = collections.Counter()
for r in riddle_rows:
    ra[("level", r["lvl"])] += 1
    if r["lvl"] != "expert":
        m = re.match(r"^([A-D])\.", r["ansraw"])
        if m:
            ra[("letter", m.group(1).upper())] += 1
    ra[("subject", r["subj"])] += 1
stats["riddle: total rows"] = len(riddle_rows)

# ---------------- report ----------------
out = []
out.append("=" * 70)
out.append("CSV CONTENT QUALITY AUDIT (read-only)")
out.append("=" * 70)
out.append("\n--- row counts ---")
for k, v in sorted(stats.items()):
    out.append(f"{k}: {v}")

out.append("\n--- aggregate distributions ---")
for tag, c, keys in [("QUIZ", qa, [("level",), ("letter",), ("tf",)])]:
    for kk in keys:
        tot = sum(v for (t, _), v in c.items() if t == kk[0])
        parts = ", ".join(f"{k}={v} ({v*100//max(tot,1)}%)" for (t, k), v in sorted(c.items()) if t == kk[0])
        out.append(f"{tag} {kk[0]}: {parts}")
tot = sum(v for (t, _), v in ra.items() if t == "level")
out.append("RIDDLE level: " + ", ".join(f"{k}={v} ({v*100//max(tot,1)}%)" for (t, k), v in sorted(ra.items()) if t == "level"))
tot = sum(v for (t, _), v in ra.items() if t == "letter")
out.append("RIDDLE letter: " + ", ".join(f"{k}={v} ({v*100//max(tot,1)}%)" for (t, k), v in sorted(ra.items()) if t == "letter"))
out.append("RIDDLE subjects: " + ", ".join(f"{k}={v}" for (t, k), v in sorted(ra.items()) if t == "subject"))

out.append("\n--- issue counts ---")
order = sorted(issues.items(), key=lambda kv: -len(kv[1]))
for cls, lst in order:
    out.append(f"{cls}: {len(lst)}")

for cls, lst in order:
    out.append(f"\n--- examples: {cls} (showing up to 12 of {len(lst)}) ---")
    for file, row, detail in lst[:12]:
        out.append(f"  [{file} | {row}] {detail}")

# letter-bias per file
out.append("\n--- correct-letter distribution per file (bias check) ---")
per = collections.defaultdict(collections.Counter)
for r in quiz_rows:
    if r["ans"] in LETTERS:
        per["quiz " + r["file"]][r["ans"]] += 1
for r in riddle_rows:
    if r["lvl"] == "expert":
        continue  # open-ended rows have no letter
    m = re.match(r"^([A-D])\.", r["ansraw"])
    if m:
        per["riddle " + r["file"]][m.group(1).upper()] += 1
for f in sorted(per):
    c = per[f]
    tot = sum(c.values())
    out.append(f"{f}: " + " ".join(f"{L}={c[L]*100//max(tot,1)}%" for L in LETTERS))

report = "\n".join(out)
with open(os.path.join(ROOT, "scripts", "csv-quality-report.txt"), "w", encoding="utf-8") as f:
    f.write(report)
print(report[:6000])
print(f"\n[full report: scripts/csv-quality-report.txt, {len(report)} chars]")
