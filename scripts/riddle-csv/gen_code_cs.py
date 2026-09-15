#!/usr/bin/env python3
"""Regenerate ONLY Code-Breaking (100) and Crime Scene (100) into data-json, keeping Who Did It."""
import random, json, pathlib
random.seed(4242)
CODE, CS = [], []
SEEN = set()
def ok(subj, q):
    k = (subj.lower(), " ".join(q.split()).lower())
    if k in SEEN: return False
    SEEN.add(k); return True
def mc(ans, wrong):
    s = [ans]
    for w in wrong:
        if w != ans and w not in s: s.append(w)
        if len(s) == 4: break
    i = 0
    fill = ["TRAIN", "PLANT", "STONE", "PAPER"]
    while len(s) < 4:
        if fill[i % 4] not in s and fill[i % 4] != ans: s.append(fill[i % 4])
        i += 1
    o = s[:]; random.shuffle(o)
    return o, o.index(ans)

def enc(w, k): return "".join(chr((ord(c) - 65 + k) % 26 + 65) for c in w)
WORDS = ["TABLE", "CHAIR", "LIGHT", "SMILE", "BREAD", "CLOUD", "PAPER", "TRAIN", "GHOST", "LEMON",
         "TIGER", "MUSIC", "PLANT", "STONE", "WATER", "SUGAR", "QUEEN", "BRUSH", "CANDLE", "PLANET",
         "SILVER", "GARDEN", "MARKET", "FLOWER", "CIRCLE", "ORANGE", "BOTTLE", "ISLAND", "GUITAR", "WINTER"]
code = []
combos = [(w, k) for w in WORDS for k in (1, 2, 3)]
random.shuffle(combos)
for w, k in combos[:59]:
    cipher = enc(w, k)
    q = "Decode the Caesar cipher: " + cipher + " (each letter was shifted forward by " + str(k) + "). What is the word?"
    if not ok("Code-Breaking", q): continue
    o4, ci = mc(w, [enc(w, (k + 1) % 26), enc(w, (k - 1) % 26), w[::-1]])
    code.append({"question": q, "options": o4, "correctIndex": ci, "level": "easy" if k == 1 else ("medium" if k == 2 else "hard"),
                 "subject": "Code-Breaking", "hint": "Shift each letter BACK by " + str(k) + ".",
                 "explanation": "Shifting each letter back " + str(k) + " spells " + w + "."})
A1 = ["CAB", "BAD", "FACE", "DEAF", "BABE", "EGGS", "ACID", "FADE", "BEEF", "CAGE", "EDGE", "DEED", "FEED",
      "HEAD", "DECADE", "CABIN", "BADGE", "DAB", "FED", "ACE", "BADGE? no", "BEAD", "FADE? no"]
A1 = [w for w in dict.fromkeys(A1) if "?" not in w]
random.shuffle(A1)
for w in A1[:25]:
    nums = "-".join(str(ord(c) - 64) for c in w)
    q = "A1Z26 code: " + nums + " (A=1, B=2 ... Z=26). Decode the word."
    if not ok("Code-Breaking", q): continue
    pool = [x for x in A1 if x != w and len(x) == len(w)]
    others = (pool + ["CAFE", "BEAD", "DEAF", "FACE", "CAGE"])[:3]
    o4, ci = mc(w, others)
    code.append({"question": q, "options": o4, "correctIndex": ci, "level": "medium",
                 "subject": "Code-Breaking", "hint": "Convert each number to its alphabet letter.",
                 "explanation": nums + " spells " + w + "."})
REVW = [w for w in WORDS if len(w) >= 4]
random.shuffle(REVW)
for w in REVW[:20]:
    rev = w[::-1]
    q = "The code word " + rev + " is written backwards. What is the real word?"
    if not ok("Code-Breaking", q): continue
    o4, ci = mc(w, [w[:-1], w[0] + w[2:], enc(w, 1)])
    code.append({"question": q, "options": o4, "correctIndex": ci, "level": "hard",
                 "subject": "Code-Breaking", "hint": "Read it from right to left.",
                 "explanation": rev + " reversed spells " + w + "."})
print("code:", len(code))

# ---------- Crime Scene (100) ----------
CS = []
TPL = [
    "A detective studies {place}: a tipped {obj}, a wet umbrella by the door, and mud tracks leading OUT. Whoever left arrived before the rain started. Which detail proves the visit began in dry weather?",
    "{place} shows a strange scene: a half-eaten {obj}, an open window, and swaying curtains. There is no broken glass and no forced lock. How did the visitor get in?",
    "At {place}, the detective finds a cold {obj}, a stopped desk fan, and a diary whose last entry is at 3 PM. The power was cut at 2 PM. What does the diary's final entry time prove?",
    "A {obj} sits on the desk at {place} beside two teacups: one empty, one full and cold. Only one chair is pulled out. What does the second teacup suggest?",
]
OBJS = ["teacup", "biscuit tin", "cardboard box", "board game", "picnic basket", "potted fern"]
PLACES = ["the study", "the boathouse", "the garden room", "the attic loft", "the tea shop", "the scout hut"]
ANS = [
    ("The mud tracks show the visit began in dry weather", "The mud proves rain during the visit", "The umbrella proves heavy rain", "The tipped object proves a struggle",
     "Dry-weather mud stays inside the door; rain mud tracks out.", "Tracks leading out through the door show the ground was dry when the visitor arrived."),
    ("Through the open window", "By picking the lock", "With a spare key", "Down the chimney",
     "No forced entry means an invited or open path.", "The open window with swaying curtains was the easy way in."),
    ("The entries stopped when the power failed", "The fan was very old", "The desk was used at night", "The diary was borrowed",
     "The diary outlasted the power cut by an hour.", "A 3 PM entry after a 2 PM outage proves the writer stayed."),
    ("Two people shared the room", "The visitor left in a hurry", "The tea was freshly made", "The room was empty",
     "One cup busy, one cup abandoned.", "The second cold teacup shows a companion sat there and left it."),
]
combos = [(t, o, p) for t in TPL for o in OBJS for p in PLACES]
random.shuffle(combos)
lv_cycle = ["easy", "medium", "hard", "medium"]
i = 0
while len(CS) < 100 and combos:
    t, obj, pl = combos.pop()
    qi = TPL.index(t)
    ans, w1, w2, w3 = ANS[qi][0], ANS[qi][1], ANS[qi][2], ANS[qi][3]
    q = t.format(obj=obj, place=pl)
    if not ok("Crime Scene", q): continue
    o4, ci = mc(ans, [w1, w2, w3])
    CS.append({"question": q, "options": o4, "correctIndex": ci, "level": lv_cycle[len(CS) % 4],
               "subject": "Crime Scene", "hint": "Compare each detail against the timeline.",
               "explanation": ans + "."})
    i += 1
print("cs:", len(CS))

# merge: keep existing Who Did It from previous shard files
old = []
for f in sorted(pathlib.Path("data-json").glob("detective-mystery-*.json")):
    old += [r for r in json.load(open(f, encoding="utf-8"))["riddles"] if r["subject"] == "Who Did It?"]
old = old[:100]
for f in pathlib.Path("data-json").glob("detective-mystery-*.json"):
    f.unlink()
ALL = old + code + CS
random.shuffle(ALL)

part = 0
for i in range(0, len(ALL), 100):
    part += 1
    json.dump({"category": "Detective & Mystery", "riddles": ALL[i:i+100]},
              open("data-json/detective-mystery-%d.json" % part, "w", encoding="utf-8"), indent=0)
print("detective:", len(ALL), "| subjects:", {s: sum(1 for r in ALL if r["subject"] == s) for s in ["Who Did It?", "Crime Scene", "Code-Breaking"]})
