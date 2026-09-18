#!/usr/bin/env python3
"""Generic quiz subject repair — the per-file recipe used after sports (BUG-022/025/026).

Usage: python scripts/repair-quiz-subject.py <file.csv>

Steps:
  1. shape repair: 7-field rows get empty Option C/D slots restored; 10-field
     rows with an empty Correct-Answer cell get the stray cell removed
  2. '?' restored on interrogative rows (MCQ + extreme open-ended)
  3. duplicate questions dropped — within the file, and against every file
     EARLIER in ORDER (ordered corpus keeps exactly one copy repo-wide;
     trailing '?' ignored in the key so MCQ/open-ended twins collapse)
  4. answer-letter rebalance within each level's displayed slice
     (True/False rows may swap; numeric-sorted options are left untouched;
     if a numeric row's letter still falls outside its slice it is reported)
  5. IDs renumbered sequentially
"""
import csv, io, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUIZ_DIR = os.path.join(ROOT, "quiz-csv")
ORDER = ["sports.csv", "science-nature.csv", "business.csv", "food-cooking.csv",
         "general-knowledge.csv", "geography.csv", "history.csv", "movies-tv.csv",
         "music.csv", "technology-video-games.csv", "pop-culture-celebrities.csv",
         "animals.csv"]
LETTERS = "ABCD"
LEVEL_SLICE = {"easy": 2, "medium": 2, "hard": 3, "expert": 4}
VALID_LEVELS = {"easy", "medium", "hard", "expert", "extreme"}
INTERROG = re.compile(r"^(who|what|when|where|which|how|why|whose|whom|name|in (what|which)|from (which|what)|at which|near which|on (what|which)|by (what|which)|of (what|which))\b", re.I)
INTERROG_MID = re.compile(r"^in .+\b(what|who|which|where|when)\b", re.I)
INTERROG_END = re.compile(r"\b(what|who|which)$", re.I)
NUMERIC = re.compile(r"[\d,.]+$")


def dup_key(q):
    v = re.sub(r"\s+", " ", (q or "").strip().lower())
    return v.rstrip("?").strip()


def corpus_keys(name):
    """Keys of every file earlier in ORDER (their already-repaired on-disk state)."""
    keys = set()
    for earlier in ORDER[:ORDER.index(name)]:
        p = os.path.join(QUIZ_DIR, earlier)
        if not os.path.exists(p):
            continue
        with open(p, newline="", encoding="utf-8-sig") as f:
            lines = [ln for ln in f if ln.strip()
                     and not (ln.lstrip().startswith("#") and "," not in ln)]
        for r in csv.DictReader(lines):
            keys.add(dup_key(r.get("Question")))
    return keys


def main(name):
    path = os.path.join(QUIZ_DIR, name)
    with open(path, newline="", encoding="utf-8") as f:
        raw = f.read()
    lines = raw.splitlines()
    head, data = [], []
    for ln in lines:
        if not data and (not ln.strip() or ln.lstrip().startswith("#") or ln.startswith("ID,")):
            head.append(ln)
        else:
            data.append(ln)
    rows = [next(csv.reader([ln])) for ln in data if ln.strip()]

    report = {"in": len(rows), "shape7": 0, "shape10": 0, "qmark": 0,
              "dup_in": 0, "dup_cross": 0, "tf_flip": 0, "mcq_perm": 0,
              "numeric_kept": 0, "still_unwinnable": []}

    repaired = []
    for r in rows:
        n = len(r)
        if n == 7:
            letter, level = r[4].strip(), r[5].strip()
            assert letter in ("A", "B") and r[2].strip() and r[3].strip(), r
            r = [r[0], r[1], r[2], r[3], "", "", letter, level, r[6]]
            report["shape7"] += 1
        elif n == 10:
            assert r[6].strip() == "" and r[7].strip() in LETTERS, r
            assert r[8].strip() in VALID_LEVELS, r
            r = r[:6] + [r[7], r[8], r[9]]
            report["shape10"] += 1
        else:
            assert n == 9, f"unexpected shape {n}: {r}"
        assert r[7].strip() in VALID_LEVELS, r
        repaired.append(r)

    # '?' on interrogatives (both MCQ and extreme open-ended); True/False
    # statements stay as they are
    for r in repaired:
        q = r[1].strip()
        a, b = r[2].strip().lower(), r[3].strip().lower()
        is_tf = {a, b} == {"true", "false"} and a and b
        if q and not q.endswith("?") and not is_tf and (
                INTERROG.match(q) or INTERROG_MID.match(q) or INTERROG_END.search(q)):
            r[1] = q + "?"
            report["qmark"] += 1

    # dedup: within file first, then against earlier files in ORDER
    cross = corpus_keys(name) if ORDER.index(name) > 0 else set()
    seen, deduped = set(), []
    for r in repaired:
        k = dup_key(r[1])
        if k in seen:
            report["dup_in"] += 1
            continue
        if k in cross:
            report["dup_cross"] += 1
            continue
        seen.add(k)
        deduped.append(r)
    repaired = deduped

    # letter rebalance within each level's displayed slice
    counters = {}
    for r in repaired:
        q, level = r[1].strip(), r[7].strip()
        letter = r[6].strip()
        if level == "extreme":
            continue
        opts = r[2:6]
        need = LEVEL_SLICE[level]
        counters.setdefault(level, 0)
        target = LETTERS[counters[level] % need]
        counters[level] += 1
        if target == letter:
            continue
        ti, li = LETTERS.index(target), LETTERS.index(letter)
        low = [r[2].strip().lower(), r[3].strip().lower()]
        if set(x for x in low if x) <= {"true", "false"} and r[2 + li].strip():
            r[2 + ti], r[2 + li] = r[2 + li], r[2 + ti]
            r[6] = target
            report["tf_flip"] += 1
            continue
        quad = [r[2 + i].strip().lower().rstrip(".") for i in range(4)]
        if quad[li] and all(NUMERIC.match(x) for x in quad if x):
            report["numeric_kept"] += 1
            if LETTERS.index(letter) >= need:
                report["still_unwinnable"].append((q[:60], letter, level))
            continue
        r[2 + ti], r[2 + li] = r[2 + li], r[2 + ti]
        r[6] = target
        report["mcq_perm"] += 1

    out = io.StringIO()
    w = csv.writer(out, lineterminator="\n")
    for i, r in enumerate(repaired, 1):
        clean = [str(c).replace('"', "").strip() for c in r]
        clean[0] = str(i)
        w.writerow(clean)
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write("\n".join(head).rstrip("\n") + "\n" + out.getvalue().rstrip("\n") + "\n")

    by_level, by_letter = {}, {}
    for r in repaired:
        by_level[r[7]] = by_level.get(r[7], 0) + 1
        if r[7] != "extreme":
            by_letter[r[6]] = by_letter.get(r[6], 0) + 1
    print(f"{name}: {report}")
    print(f"  rows {len(repaired)} | levels {dict(sorted(by_level.items()))}")
    print(f"  MCQ letters {dict(sorted(by_letter.items()))}")
    if report["still_unwinnable"]:
        print("  STILL UNWINNABLE (numeric rows):", report["still_unwinnable"])


if __name__ == "__main__":
    main(sys.argv[1])
