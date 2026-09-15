#!/usr/bin/env python3
"""Patch all generators: seen-set dedupe, expanded banks, combo fixes."""
import io, re

def patch(path, pairs):
    s = io.open(path, encoding="utf-8").read()
    for old, new in pairs:
        assert old in s, path + ": NOT FOUND: " + old[:70]
        s = s.replace(old, new)
    io.open(path, "w", encoding="utf-8").write(s)
    print("patched", path)

# ---------- math ----------
patch("gen_math.py", [
    ("OUT = []\ndef add(q, opts, ci, lv, subj, h, e): OUT.append((q, opts, ci, lv, subj, h, e))",
     "OUT = []\nSEEN = set()\ndef norm(q): return ' '.join(q.split())\ndef add(q, opts, ci, lv, subj, h, e):\n    k = (subj.lower(), norm(q).lower())\n    if k in SEEN: return\n    SEEN.add(k)\n    OUT.append((q, opts, ci, lv, subj, h, e))"),
    ("gens = [digit_riddle, sum_riddle, square_riddle, half_riddle, digit3_riddle, remain_riddle]\nrandom.shuffle(gens)\nwhile n < 120:\n    for g in gens:\n        if n >= 120: break\n        r = g()\n        if r: add(*r); n += 1",
     "gens = [digit_riddle, sum_riddle, square_riddle, half_riddle, digit3_riddle, remain_riddle]\nrandom.shuffle(gens)\nattempts = 0\nwhile n < 120 and attempts < 5000:\n    attempts += 1\n    before = len(OUT)\n    g = random.choice(gens)\n    r = g()\n    if r and len(OUT) > before: n += 1"),
    ("random.shuffle(g2)\nn2 = 0\nwhile n2 < 90:\n    for g in g2:\n        if n2 >= 90: break\n        r = g()\n        if r: add(*r); n2 += 1",
     "random.shuffle(g2)\nn2 = 0\nattempts = 0\nwhile n2 < 90 and attempts < 5000:\n    attempts += 1\n    before = len(OUT)\n    g = random.choice(g2)\n    r = g()\n    if r and len(OUT) > before: n2 += 1"),
    ("random.shuffle(g3)\nn3 = 0\nwhile n3 < 90:\n    for g in g3:\n        if n3 >= 90: break\n        r = g()\n        if r: add(*r); n3 += 1",
     "random.shuffle(g3)\nn3 = 0\nattempts = 0\nwhile n3 < 90 and attempts < 5000:\n    attempts += 1\n    before = len(OUT)\n    g = random.choice(g3)\n    r = g()\n    if r and len(OUT) > before: n3 += 1"),
])

# ---------- words ----------
patch("gen_words.py", [
    ("OUT = []  # dicts\ndef add(q, opts, ci, lv, subj, h, e): OUT.append({\"question\": q, \"options\": opts, \"correctIndex\": ci, \"level\": lv, \"subject\": subj, \"hint\": h, \"explanation\": e})",
     "OUT = []  # dicts\nSEEN = set()\ndef norm(q): return ' '.join(q.split())\ndef add(q, opts, ci, lv, subj, h, e):\n    k = (subj.lower(), norm(q).lower())\n    if k in SEEN: return\n    SEEN.add(k)\n    OUT.append({\"question\": q, \"options\": opts, \"correctIndex\": ci, \"level\": lv, \"subject\": subj, \"hint\": h, \"explanation\": e})"),
    ("""pals = [("level", "leveL"), ("radar", "radaR"), ("civic", "civIc"), ("kayak", "kayak"), ("madam", "madaM"), ("rotator", "rotatoR"), ("refer", "refer")]""",
     """pals = [("level", "level"), ("radar", "radar"), ("civic", "civic"), ("kayak", "kayak"), ("madam", "madam"), ("rotator", "rotator"), ("refer", "refer"),
            ("noon", "noon"), ("deed", "deed"), ("peep", "peep"), ("sees", "sees"), ("stats", "stats"), ("tenet", "tenet")]"""),
    ("""    others = [p[0] for p in pals if p[0] != w][:3]
    o4, ci = mc(w, others)
    return (q, o4, ci, "easy", "Wordplay", "Try reading each option backwards.", "'" + w + "' is a palindrome.")""",
     """    pool = ["piano", "guitar", "planet", "circle", "window", "shovel", "brick", "cloud", "spoon", "maple", "crayon", "velvet"]
    others = [p[0] for p in pals if p[0] != w][:1] + random.sample([x for x in pool if x not in pals], 2)
    o4, ci = mc(w, others)
    return (q, o4, ci, "easy", "Wordplay", "Try reading each option backwards.", "'" + w + "' is a palindrome.")"""),
    ("""def gen_letter_start():
    starts = [("What three-letter word becomes? no", "")]
    pairs = [("Which word starts with E and is full of stories? no", "")][:0]
    pairs = [("Which word begins with B and rings for dinner?", "bell", ["ball", "bill", "bull"]),
             ("Which word begins with S and lights the night sky?", "star", ["scar", "spar", "stir"]),
             ("Which word begins with H and lives on your farm?", "horse", ["house", "horde", "hose"])]""",
     """def gen_letter_start():
    pairs = [("Which word begins with B and rings for dinner?", "bell", ["ball", "bill", "bull"]),
             ("Which word begins with S and lights the night sky?", "star", ["scar", "spar", "stir"]),
             ("Which word begins with H and lives on your farm?", "horse", ["house", "horde", "hose"]),
             ("Which word begins with C and carries passengers underground?", "car? no", "", ""),
             ("Which word begins with M and tells the months?", "calendar? no", "", ""),
             ("Which word begins with W and falls from clouds?", "water? no", "", "")]"""),
    ("""    words = ["balloon", "coffee", "puppy", "letter", "summer", "ribbon", "dinner", "hammer", "puddle", "carrot", "monkey", "glasses"]""",
     """    words = ["balloon", "coffee", "puppy", "letter", "summer", "ribbon", "dinner", "hammer", "puddle", "carrot", "monkey", "glasses",
             "muffin", "kettle", "pillow", "pepper", "dollar", "carpet", "jacket", "cotton", "soccer", "pebble", "gutter", "dinner"]"""),
    ("""random.shuffle(g_wp)
n = 0
while n < 120:
    for g in g_wp:
        if n >= 120: break
        r = g()
        if r: add(*r); n += 1""",
     """random.shuffle(g_wp)
n = 0
attempts = 0
while n < 120 and attempts < 8000:
    attempts += 1
    before = len(OUT)
    g = random.choice(g_wp)
    r = g()
    if r and len(OUT) > before: n += 1"""),
    ("""random.shuffle(g_al)
n = 0
while n < 90:
    for g in g_al:
        if n >= 90: break
        r = g()
        if r: add(*r); n += 1""",
     """random.shuffle(g_al)
n = 0
attempts = 0
while n < 90 and attempts < 8000:
    attempts += 1
    before = len(OUT)
    g = random.choice(g_al)
    r = g()
    if r and len(OUT) > before: n += 1"""),
    ("""n = 0; idx = 0
while n < 90:
    big, small = HIDDEN[idx % len(HIDDEN)]
    idx += 1
    if small not in big: continue
    if small in [h.split()[-1] for h in []]: continue""",
     """n = 0; idx = 0
seen_pairs = set()
while n < 90 and idx < len(HIDDEN) * 3:
    big, small = HIDDEN[idx % len(HIDDEN)]
    idx += 1
    if small not in big: continue
    if (big, small) in seen_pairs: continue
    seen_pairs.add((big, small))"""),
])

# ---------- detective/trick ----------
patch("gen_detective_trick.py", [
    ("DET, TRK = [], []",
     "DET, TRK = [], []\nSEEN_D, SEEN_T = set(), set()\ndef seen_check(SEEN, subj, q):\n    k = (subj.lower(), ' '.join(q.split()).lower())\n    if k in SEEN: return False\n    SEEN.add(k)\n    return True"),
    ("def dadd(q, opts, ci, lv, subj, h, e): DET.append({\"question\": q, \"options\": opts, \"correctIndex\": ci, \"level\": lv, \"subject\": subj, \"hint\": h, \"explanation\": e})",
     "def dadd(q, opts, ci, lv, subj, h, e):\n    if not seen_check(SEEN_D, subj, q): return\n    DET.append({\"question\": q, \"options\": opts, \"correctIndex\": ci, \"level\": lv, \"subject\": subj, \"hint\": h, \"explanation\": e})"),
    ("def tadd(q, opts, ci, lv, subj, h, e): TRK.append({\"question\": q, \"options\": opts, \"correctIndex\": ci, \"level\": lv, \"subject\": subj, \"hint\": h, \"explanation\": e})",
     "def tadd(q, opts, ci, lv, subj, h, e):\n    if not seen_check(SEEN_T, subj, q): return\n    TRK.append({\"question\": q, \"options\": opts, \"correctIndex\": ci, \"level\": lv, \"subject\": subj, \"hint\": h, \"explanation\": e})"),
    ("n = 0\nwhile n < 40:\n    w, k = random.choice(words)\n    code = enc(w, k)",
     "n = 0\nattempts = 0\nwhile n < 40 and attempts < 3000:\n    attempts += 1\n    w, k = random.choice(words)\n    if seen_check(SEEN_D, \"Code-Breaking\", \"caesar:\" + w + str(k)): pass\n    else: continue\n    code = enc(w, k)"),
    ("while n < 70:\n    w, L = random.choice(words2)\n    nums = \"-\".join(str(ord(c) - 64) for c in w)",
     "attempts = 0\nwhile n < 70 and attempts < 3000:\n    attempts += 1\n    w, L = random.choice(words2)\n    if not seen_check(SEEN_D, \"Code-Breaking\", \"a1z26:\" + w): continue\n    nums = \"-\".join(str(ord(c) - 64) for c in w)"),
    ("n = 0\nwhile n < 30:\n    w = random.choice(words)[0]\n    if len(w) < 4: continue\n    rev = w[::-1]",
     "attempts = 0\nwhile n < 30 and attempts < 3000:\n    attempts += 1\n    w = random.choice(words)[0]\n    if len(w) < 4: continue\n    if not seen_check(SEEN_D, \"Code-Breaking\", \"rev:\" + w): continue\n    rev = w[::-1]"),
    ("n = 0\nwho_tpl = 0\nwhile n < 60:", "n = 0\nwho_tpl = 0\nwhile n < 60:"),
    ("n = 0\nwhile n < 100:\n    t = CS_T[n % len(CS_T)]", "n = 0\nattempts = 0\nwhile n < 100 and attempts < 4000:\n    attempts += 1\n    t = CS_T[n % len(CS_T)]"),
    ("while n < 50:\n    w, L = random.choice(LETTER_WORDS)", "attempts = 0\nwhile n < 50 and attempts < 3000:\n    attempts += 1\n    w, L = random.choice(LETTER_WORDS)\n    if not seen_check(SEEN_T, \"Gotchas\", \"letters:\" + w): continue"),
    ("while n < 60:\n    a = random.randint(3, 9); b = random.randint(2, 6)\n    total = a * b",
     "attempts = 0\nwhile n < 60 and attempts < 3000:\n    attempts += 1\n    a = random.randint(3, 9); b = random.randint(2, 6)\n    if not seen_check(SEEN_T, \"Common-Sense Traps\", \"buns:%d-%d\" % (a, b)): continue\n    total = a * b"),
    ("n = 0\nwhile n < 160:\n    m = MYTHS[n % len(MYTHS)]", "n = 0\nattempts = 0\nwhile n < 160 and attempts < 4000:\n    attempts += 1\n    m = MYTHS[n % len(MYTHS)]\n    if not seen_check(SEEN_T, \"Common-Sense Traps\", \"myth:%d:%d\" % (MYTHS.index(m), n // len(MYTHS) % 2)): continue"),
    ("while n < 180:\n    w, L = random.choice(LETTER_WORDS)\n    q = \"How many letters does the word \" + w + \" contain?\"",
     "attempts = 0\nwhile n < 180 and attempts < 3000:\n    attempts += 1\n    w, L = random.choice(LETTER_WORDS)\n    q = \"How many letters does the word \" + w + \" contain?\"\n    if not seen_check(SEEN_T, \"Common-Sense Traps\", \"letters2:\" + w): continue"),
])

# ---------- kids/objects ----------
patch("gen_kids_objects.py", [
    ("""COMBOS = [(0, 1), (1, 2), (2, 0), (0, 2)]""",
     """COMBOS = [(0, 1), (1, 0), (0, 1), (1, 0)]"""),
])
print("all patched")
