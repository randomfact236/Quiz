#!/usr/bin/env python3
"""One-shot repair of quiz-csv/sports.csv (BUG-022).

Fixes, in order:
  1. row-shape repairs: 7-field rows (IDs 1-200) get their two empty Option C/D
     slots restored; 10-field rows (IDs 601-800) get the stray empty Correct
     Answer cell removed
  2. within-file duplicate questions dropped (first occurrence kept)
  3. answer-letter rebalance within each level's displayed slice
     (True/False rows may swap option order; numeric-sorted options are left
     untouched)
  4. missing '?' added to extreme open-ended rows that are interrogatives
  5. IDs renumbered sequentially

Run:  python scripts/repair-sports.py
"""
import csv, io, re, sys

PATH = "quiz-csv/sports.csv"
LETTERS = "ABCD"
LEVEL_SLICE = {"easy": 2, "medium": 2, "hard": 3, "expert": 4}
VALID_LEVELS = {"easy", "medium", "hard", "expert", "extreme"}
INTERROG = re.compile(r"^(who|what|when|where|which|how|why|whose|whom|in which|on which|at what|name)\b", re.I)

with open(PATH, newline="", encoding="utf-8") as f:
    raw = f.read()

lines = raw.splitlines()
head, data = [], []
for ln in lines:
    if not data and (not ln.strip() or ln.lstrip().startswith("#") or ln.startswith("ID,")):
        head.append(ln)
    else:
        data.append(ln)

rows = [next(csv.reader([ln])) for ln in data if ln.strip()]
report = {"shape7": 0, "shape10": 0, "kept": 0, "dropped": 0, "qmark": 0,
          "tf_flip": 0, "mcq_perm": 0, "numeric_kept": 0}

repaired = []
for r in rows:
    n = len(r)
    if n == 7:
        # id,Q,optA,optB,letter,level,chapter -> insert empty C/D slots
        letter, level = r[4].strip(), r[5].strip()
        assert letter in ("A", "B") and r[2].strip() and r[3].strip(), r
        r = [r[0], r[1], r[2], r[3], "", "", letter, level, r[6]]
        report["shape7"] += 1
    elif n == 10:
        # id,Q,A,B,C,D,'',letter,level,chapter -> drop the empty cell at index 6
        assert r[6].strip() == "" and r[7].strip() in LETTERS, r
        assert r[8].strip() in VALID_LEVELS, r
        r = r[:6] + [r[7], r[8], r[9]]
        report["shape10"] += 1
    else:
        assert n == 9, f"unexpected shape {n}: {r}"
    assert r[7].strip() in VALID_LEVELS, r
    repaired.append(r)

# ---- dedup within file (first occurrence wins) ----
seen, deduped = set(), []
for r in repaired:
    key = re.sub(r"\s+", " ", r[1].strip().lower())
    if key in seen:
        report["dropped"] += 1
        continue
    seen.add(key)
    deduped.append(r)
repaired = deduped

# ---- letter rebalance within each level's displayed slice ----
counters = {}
for r in repaired:
    q, level = r[1].strip(), r[7].strip()
    letter = r[6].strip()
    if level == "extreme":
        if q and not q.endswith("?") and INTERROG.match(q):
            r[1] = q + "?"
            report["qmark"] += 1
        continue
    opts = r[2:6]
    need = LEVEL_SLICE[level]
    counters.setdefault(level, 0)
    target = LETTERS[counters[level] % need]
    counters[level] += 1
    if target == letter:
        continue
    ti, li = LETTERS.index(target), LETTERS.index(letter)
    if opts[li].strip().lower() in ("true", "false") and all(
        opts[i].strip().lower() in ("true", "false") for i in range(need)
    ):
        opts[ti], opts[li] = opts[li], opts[ti]
        r[6] = target
        report["tf_flip"] += 1
        continue
    lo, hi = min(ti, li), max(ti, li)
    quad = [opts[i].strip().lower().rstrip(".") for i in range(need)]
    numeric = all(re.fullmatch(r"[\d,.]+", x) for x in quad if x)
    if numeric:
        report["numeric_kept"] += 1
        continue
    opts[ti], opts[li] = opts[li], opts[ti]
    r[6] = target
    report["mcq_perm"] += 1

# ---- renumber and write ----
out = io.StringIO()
w = csv.writer(out, lineterminator="\n")
for i, r in enumerate(repaired, 1):
    clean = [str(c).replace('"', "").strip() for c in r]
    clean[0] = str(i)
    w.writerow(clean)

body = out.getvalue().rstrip("\n")
with open(PATH, "w", encoding="utf-8", newline="") as f:
    f.write("\n".join(head).rstrip("\n") + "\n" + body + "\n")

print("sports.csv repair:", report)
print("rows now:", len(repaired))
by_level = {}
for r in repaired:
    by_level[r[7]] = by_level.get(r[7], 0) + 1
print("levels:", dict(sorted(by_level.items())))
by_letter = {}
for r in repaired:
    if r[7] != "extreme":
        by_letter[r[6]] = by_letter.get(r[6], 0) + 1
print("letters (MCQ only):", dict(sorted(by_letter.items())))
