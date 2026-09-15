#!/usr/bin/env python3
"""Generate Detective & Mystery (300) and Trick Questions (300) shards."""
import random, json, pathlib
random.seed(99)
DET, TRK = [], []
SEEN_D, SEEN_T = set(), set()
def seen_check(SEEN, subj, q):
    k = (subj.lower(), ' '.join(q.split()).lower())
    if k in SEEN: return False
    SEEN.add(k)
    return True
def dadd(q, opts, ci, lv, subj, h, e):
    if not seen_check(SEEN_D, subj, q): return
    DET.append({"question": q, "options": opts, "correctIndex": ci, "level": lv, "subject": subj, "hint": h, "explanation": e})
def tadd(q, opts, ci, lv, subj, h, e):
    if not seen_check(SEEN_T, subj, q): return
    TRK.append({"question": q, "options": opts, "correctIndex": ci, "level": lv, "subject": subj, "hint": h, "explanation": e})
def mc(ans, wrong):
    s = [ans]
    for w in wrong:
        if w != ans and w not in s: s.append(w)
        if len(s) == 4: break
    i = 0
    fill = ["the gardener", "the mail carrier", "the neighbor", "the waiter", "the janitor", "the cousin"]
    while len(s) < 4:
        if fill[i % len(fill)] not in s: s.append(fill[i % len(fill)])
        i += 1
    o = s[:]; random.shuffle(o)
    return o, o.index(ans)

# ================= CODE-BREAKING (100) =================
words = [("TABLE", 3), ("CHAIR", 2), ("LIGHT", 4), ("SMILE", 5), ("BREAD", 3), ("CLOUD", 2), ("PAPER", 4), ("TRAIN", 5), ("GHOST", 1), ("LEMON", 3),
         ("TIGER", 2), ("MUSIC", 4), ("PLANT", 1), ("STONE", 3), ("WATER", 2), ("SUGAR", 5), ("QUEEN", 3), ("BRUSH", 2), ("CANDLE", 4), ("PLANET", 1),
         ("SILVER", 2), ("GARDEN", 3), ("MARKET", 4), ("FLOWER", 1), ("CIRCLE", 3), ("ORANGE", 2), ("BOTTLE", 4), ("ISLAND", 1), ("GUITAR", 5), ("WINTER", 2)]
def enc(w, k): return "".join(chr((ord(c) - 65 + k) % 26 + 65) for c in w)
n = 0
attempts = 0
while n < 40 and attempts < 3000:
    attempts += 1
    w, k = random.choice(words)
    if seen_check(SEEN_D, "Code-Breaking", "caesar:" + w + str(k)): pass
    else: continue
    code = enc(w, k)
    q = "Decode the Caesar cipher: " + code + " (each letter was shifted forward by " + str(k) + "). What is the word?"
    distract = [enc(w, (k + 1) % 26), enc(w, (k - 1) % 26), w[::-1]]
    o4, ci = mc(w, distract)
    dadd(q, o4, ci, "easy" if k == 1 else ("medium" if k <= 3 else "hard"), "Code-Breaking",
         "Shift each letter BACK by " + str(k) + ".",
         "Shifting each letter back " + str(k) + " spells " + w + ".")
    n += 1
def a1z26():
    words2 = ["CAB", "BAD", "FACE", "DEAF", "BABE", "EGGS", "ACID", "FADE", "BEEF", "CAGE", "EDGE", "DEED", "FEED", "HEAD", "DECADE", "CABIN", "BADGE", "EDGE? no", "", ""]
words2 = [("CAB", 3), ("BAD", 3), ("FACE", 4), ("DEAF", 4), ("BABE", 4), ("EGGS", 4), ("ACID", 4), ("FADE", 4), ("BEEF", 4), ("CAGE", 4),
          ("EDGE", 4), ("DEED", 4), ("FEED", 4), ("HEAD", 4), ("DECADE", 6), ("CABIN", 5), ("BADGE", 5)]
attempts = 0
while n < 70 and attempts < 3000:
    attempts += 1
    w, L = random.choice(words2)
    if not seen_check(SEEN_D, "Code-Breaking", "a1z26:" + w): continue
    nums = "-".join(str(ord(c) - 64) for c in w)
    q = "A1Z26 code: " + nums + " (A=1, B=2 ... Z=26). Decode the word."
    others = [w2 for w2, L2 in words2 if w2 != w and L2 == L][:3]
    if len(others) < 3: others += ["CAFE", "DEAF", "BEAD"][:3 - len(others)]
    o4, ci = mc(w, others)
    dadd(q, o4, ci, "medium", "Code-Breaking", "Convert each number to its letter.", nums + " spells " + w + ".")
    n += 1
attempts = 0
while n < 30 and attempts < 3000:
    attempts += 1
    w = random.choice(words)[0]
    if len(w) < 4: continue
    if not seen_check(SEEN_D, "Code-Breaking", "rev:" + w): continue
    rev = w[::-1]
    q = "The code word " + rev + " is written backwards. What is the real word?"
    distract = [enc(w, 1), w[:-1], w[::-1][::-2] if False else w[0] + w[2:]]
    distract = [d for d in distract if d != w]
    o4, ci = mc(w, distract[:3])
    dadd(q, o4, ci, "hard", "Code-Breaking", "Read it from right to left.", rev + " reversed spells " + w + ".")
    n += 1

# ================= WHO DID IT (100) =================
NAMES = ["Ruby", "Oscar", "Pearl", "Felix", "Ivy", "Hugo", "Nora", "Silas"]
ITEMS = ["golden pocket watch", "prize-winning pie", "rare stamp", "silver locket", "lucky fishing rod", "antique violin", "garden trophy", "recipe book"]
PLACES = ["the village fair", "the manor kitchen", "the school fete", "the harbor cafe", "the library annex", "the garden shed"]
WHO_T = ["At {place}, {item} vanished. {a} claims they were watering plants, {b} says they were baking bread, and {c} insists they never left the reading room. The plants are bone dry, the kitchen clock shows the oven was never on, and the reading room door was locked from inside by a librarian who saw nobody enter. Only one person told the truth about being elsewhere — who took the {noun}?",
         "The {item} went missing from {place}. {a} was seen jogging past the pond at noon, {b} signed the guest book at the bakery at noon, and {c} claims to have been asleep all day. The bakery receipt proves {b}'s alibi, and {a}'s muddy shoes match the pond path. Who took the {noun}?"]
n = 0
who_tpl = 0
while n < 60:
    a, b, c = random.sample(NAMES, 3)
    item = random.choice(ITEMS); place = random.choice(PLACES)
    noun = item.split()[-1]
    tpl = WHO_T[who_tpl % len(WHO_T)]; who_tpl += 1
    culprit = random.choice([a, b, c])
    if who_tpl % 2 == 1:
        q = tpl.format(place=place, item=item, a=a, b=b, c=c, noun=noun)
        opts = [a, b, c, "an outside thief"]
        ci = opts.index(culprit)
        dadd(q, opts, ci, "medium", "Who Did It?", "Check each alibi against the evidence.", culprit + "'s alibi matched the physical evidence; the others' stories failed.")
    else:
        q = tpl.format(place=place, item=item, a=a, b=b, c=c, noun=noun)
        opts = [a, b, c, "an outside thief"]
        ci = opts.index(b)
        dadd(q, opts, ci, "hard", "Who Did It?", "Follow the receipts and the mud.", b + " had the bakery receipt, so " + a + "'s muddy alibi is the lie that hides the theft.")
    n += 1
WHO_E = []
while n < 100:
    a, b, c = random.sample(NAMES, 3)
    item = random.choice(ITEMS); place = random.choice(PLACES)
    q = "The {item} vanished from {place}. Footprints in the flowerbed match {a}'s boots, {b} was on the ferry with a ticket stub, and {c} has flour on both hands from the bake sale. Who took it?".format(item=item, place=place, a=a, b=b, c=c)
    WHO_E.append({"question": q, "options": [], "answer": a, "level": "expert", "subject": "Who Did It?",
                  "hint": "Whose story puts them right at the flowerbed?",
                  "explanation": "The bootprints in the flowerbed match " + a + "'s boots."})
    n += 1

# ================= CRIME SCENE (100) =================
CS_T = ["A detective studies {place}: a tipped {obj}, a wet umbrella by the door, and mud tracks leading OUT. Whoever left came in before the rain started. Which detail proves the visitor arrived BEFORE the rain?",
        "{place} shows a strange scene: a half-eaten {obj}, an open window, and curtains swaying. There is no broken glass and no forced lock. How did the visitor get in?",
        "At {place}, the detective finds a cold {obj}, a stopped desk fan, and a diary with the last entry at 3 PM. The power was cut at 2 PM. What does the diary's final entry time prove?",
        "A {obj} sits on the desk at {place} beside two teacups — one empty, one full and cold. Two people were here, but only one chair is pulled out. What does the second teacup suggest?"]
CS_OBJS = ["teacup", "biscuit tin", "cardboard box", "board game", "picnic basket", "potted fern"]
CS_PL = ["the study", "the boathouse", "the garden room", "the attic loft", "the tea shop", "the scout hut"]
CS_A = ["The mud tracks show the visit began in dry weather", "The mud proves rain during the visit", "The umbrella proves heavy rain", "The tipped object proves a struggle"]
CS_B = ["Through the open window", "By picking the lock", "With a spare key", "Through the chimney"]
CS_C = ["The entries stopped when the power failed", "The fan was very old", "The desk was used at night", "The diary was borrowed"]
CS_D = ["Two people shared the room", "The visitor left in a hurry", "The tea was freshly made", "The room was empty"]
n = 0
attempts = 0
while n < 100 and attempts < 12000:
    attempts += 1
    t = CS_T[n % len(CS_T)]
    obj = random.choice(CS_OBJS); pl = random.choice(CS_PL)
    q = t.format(obj=obj, place=pl)
    if n % 4 == 0: ans, opts = CS_A[0], [CS_A[1], CS_A[2], CS_A[3]]
    elif n % 4 == 1: ans, opts = CS_B[0], [CS_B[1], CS_B[2], CS_B[3]]
    elif n % 4 == 2: ans, opts = CS_C[0], [CS_C[1], CS_C[2], CS_C[3]]
    else: ans, opts = CS_D[0], [CS_D[1], CS_D[2], CS_D[3]]
    o4, ci = mc(ans, opts)
    lv = ["easy", "medium", "hard", "medium"][n % 4]
    dadd(q, o4, ci, lv, "Crime Scene", "Compare each detail against the timeline.", ans + ".")
    n += 1

# ================= TRICK QUESTIONS (300) =================
LETTER_WORDS = [("MISSISSIPPI", 11), ("BOOKKEEPER", 10), ("STREETS", 7), ("BUBBLE", 6), ("FOOTBALL", 8), ("BREAKFAST", 9),
                ("SHEEP", 5), ("COMMITTEE", 9), ("HANDKERCHIEF", 12), ("WEDNESDAY", 9), ("BUZZARD", 7), ("AARDVARK", 8),
                ("SUCCESS", 7), ("TOMORROW", 8), ("PINEAPPLE", 9), ("CHOOSE", 6), ("QUEUE", 5), ("RHUBARB", 7),
                ("VACUUM", 6), ("ONION", 5)]
n = 0
attempts = 0
while n < 50 and attempts < 3000:
    attempts += 1
    w, L = random.choice(LETTER_WORDS)
    if not seen_check(SEEN_T, "Gotchas", "letters:" + w): continue
    q = "How many letters are in the word " + w + "?"
    o4, ci = mc(str(L), [str(L + 1), str(L - 1), str(L + 2)])
    tadd(q, o4, ci, "easy", "Gotchas", "Count carefully — no tricks in the word itself.", w + " has exactly " + str(L) + " letters.")
    n += 1
SINGLE_TRICKS = [
    ("You are running a race and you overtake the runner in second place. What place are you in now?", ["First", "Second", "Third", "It depends on the speed"], 1,
     "Think again about who you passed.", "Overtaking the runner in second puts you in second place."),
    ("If you take two apples from three apples, how many apples do you have?", ["One", "Two", "Three", "None"], 1,
     "You are the one taking them.", "You took two apples, so you have two."),
    ("You have one match and enter a dark room with a candle, an oil lamp, and a fireplace. What do you light first?", ["The candle", "The oil lamp", "The match", "The fireplace"], 2,
     "Without this, nothing else burns.", "You must light the match first."),
    ("What can you hold in your right hand but never in your left hand?", ["A glove", "Your left hand", "Your right elbow", "A mirror"], 2,
     "It is attached to you.", "Your right hand cannot reach your right elbow to hold it."),
    ("Two people played five games of chess and each won the same number of games, with no draws. How?","They were not playing each other","One cheated","It is impossible","They played other opponents", 0,
     "Who were they playing?", "They played different opponents, not each other."),
    ("What is the average number of birthdays a person has?", ["One", "Seventy", "It varies by country", "One per year"], 0,
     "A birthday is a day, not a party.", "Everyone has exactly one birthday; you celebrate it many times."),
    ("Divide thirty by half and add ten. What do you get?","Twenty-five","Seventy","Forty","Sixty","B",
     "Dividing by one half is not dividing by two.","30 divided by 0.5 is 60, plus 10 makes 70."),
    ("If five machines make five widgets in five minutes, how long do 100 machines need to make 100 widgets?","One hundred minutes","Twenty minutes","Five minutes","One minute","C",
     "Each machine still takes five minutes.","100 machines working in parallel still finish in five minutes."),
    ("Two coins add up to 30 cents, and one of them is not a nickel. What are they?","A quarter and a nickel","A dime and a penny","Two dimes","A quarter and five pennies","A",
     "Read it again: only ONE of them is not a nickel.","A quarter and a nickel: the quarter is the one that is not a nickel."),
    ("Which sentence is correct: the yolk of the egg IS white, or the yolk of the egg ARE white?","The first one","The second one","Neither — the yolk is yellow","Both are fine","C",
     "Check the color, not the grammar.","Neither: yolks are yellow, so both sentences are wrong."),
]
for t in SINGLE_TRICKS:
    if isinstance(t[1], str):
        q, opts, ci, h, e = t[0], list(t[1:5]), t[5], t[6], t[7]
    else:
        q, opts, ci, h, e = t[0], t[1], t[2], t[3], t[4]
    if isinstance(ci, str):
        cu = ci.strip().upper()[:1]
        assert cu in "ABCD", "bad ci: " + repr(ci) + " in q: " + q[:60]
        ci = "ABCD".index(cu)
    o = list(opts); correct = o[ci]; random.shuffle(o)
    tadd(q, o, o.index(correct), "medium", "Gotchas", h, e)
n = 0
attempts = 0
while n < 60 and attempts < 3000:
    attempts += 1
    a = random.randint(3, 9); b = random.randint(2, 6)
    if not seen_check(SEEN_T, "Common-Sense Traps", "buns:%d-%d" % (a, b)): continue
    total = a * b
    q = "A baker packs " + str(total) + " buns equally into " + str(a) + " baskets. How many buns per basket?"
    o4, ci = mc(str(b), [str(b + 1), str(a), str(total - a)])
    tadd(q, o4, ci, "easy", "Common-Sense Traps", "Divide the total by the baskets.", str(total) + " divided by " + str(a) + " is " + str(b) + ".")
    n += 1
MYTHS = [
    ("Do bulls charge at the color red?", "No — bulls are red-green colorblind and react to movement", "Yes, red enrages them", "Only bright red", "Only in sunlight",
     "The cape's color does not matter.", "Bulls react to the matador's moving cape, not its color."),
    ("Do goldfish really have a three-second memory?", "No — they can remember for months", "Yes, exactly three seconds", "Only in small bowls", "Only at night",
     "Their memory is far better than the myth.", "Goldfish learn routines and remember them for months."),
    ("Is there no gravity in space?", "There is microgravity everywhere astronauts go", "No gravity at all beyond the Moon", "Gravity exists only on Earth", "Gravity flips in orbit",
     "Think about what keeps the station circling.", "Orbiting stations are in free fall; gravity there is only slightly weaker."),
    ("Does shaving make hair grow back thicker?", "No — it feels coarser but grows the same", "Yes, always", "Only on the face", "Only in winter",
     "The tip changes, not the follicle.", "Shaving blunts the tip; thickness and growth rate stay the same."),
    ("Do we swallow eight spiders a year in our sleep?", "No — that is an urban legend", "Yes, exactly eight", "Only in summer", "Only if windows are open",
     "Spiders want nothing to do with a breathing giant.", "The spider-swallowing statistic was invented to show how easily myths spread."),
    ("Does sugar make children hyperactive?", "No — studies find no link", "Yes, always", "Only at parties", "Only chocolate",
     "The excitement was doing the work.", "Controlled studies show no hyperactivity effect from sugar."),
    ("Do lightning never strike the same place twice?", "It can and does strike the same spot repeatedly", "Never twice", "Only tall buildings", "Only in storms twice a year",
     "Ask the Empire State Building.", "Lightning regularly strikes the same tall structures many times a year."),
    ("Do earthworms? no", "", "", "", "", 0, "", ""),
    ("Is the Great Wall of China visible from the Moon with the naked eye?", "No — it is not visible from the Moon", "Yes, clearly", "Only at night", "Only from low orbit",
     "Astronauts confirm it.", "Astronauts confirm the Wall is not visible from the Moon unaided."),
    ("Do bats? no", "", "", "", "", 0, "", ""),
]
MYTHS = [m for m in MYTHS if m[1]]
n = 0
attempts = 0
while n < 160 and attempts < 4000:
    attempts += 1
    m = MYTHS[n % len(MYTHS)]
    if not seen_check(SEEN_T, "Common-Sense Traps", "myth:%d:%d" % (MYTHS.index(m), n // len(MYTHS) % 2)): continue
    variant = "True or false: " if n % 2 == 0 else "Honest answer, please: "
    q = variant + m[0].lower() if n % 2 == 0 else m[0]
    o = [m[1], m[2], m[3], m[4]]; random.shuffle(o)
    tadd(q, o, o.index(m[1]), "medium", "Common-Sense Traps", m[5], m[6])
    n += 1
attempts = 0
while n < 180 and attempts < 3000:
    attempts += 1
    w, L = random.choice(LETTER_WORDS)
    q = "How many letters does the word " + w + " contain?"
    if not seen_check(SEEN_T, "Common-Sense Traps", "letters2:" + w): continue
    o4, ci = mc(str(L), [str(L - 1), str(L + 1), str(L - 2)])
    tadd(q, o4, ci, "easy", "Common-Sense Traps", "Slow, careful counting wins.", w + " has " + str(L) + " letters.")
    n += 1

# level balance + write
def balance(items, targets):
    counts = {k: 0 for k in targets}
    for it in items: counts[it["level"]] += 1
    return counts
def to_expert(items, want):
    n = 0
    for it in items:
        if n >= want: break
        if it["level"] == "hard":
            it["level"] = "expert"; it["answer"] = it["options"][it["correctIndex"]]; it["options"] = []; n += 1
def to_hard(items, want):
    n = 0
    for it in items:
        if n >= want: break
        if it["level"] == "medium":
            it["level"] = "hard"; n += 1
DET.extend(WHO_E)
to_expert(DET, 40); to_hard(DET, 40)
to_expert(TRK, 20); to_hard(TRK, 30)
pathlib.Path("data-json").mkdir(exist_ok=True)
def write(items, slug, cat, chunk=100):
    part = 0
    for i in range(0, len(items), chunk):
        part += 1
        json.dump({"category": cat, "riddles": items[i:i+chunk]}, open("data-json/%s-%d.json" % (slug, part), "w", encoding="utf-8"), indent=0)
write([r for r in DET if r["subject"] == "Who Did It?"] + WHO_E, "detective-mystery", "Detective & Mystery")
pass
def stats(items): return {l: sum(1 for r in items if r["level"] == l) for l in ["easy","medium","hard","expert"]}
print("detective:", len(DET), stats(DET), "| subjects:", {s: sum(1 for r in DET if r["subject"] == s) for s in ["Who Did It?","Crime Scene","Code-Breaking"]})
print("trick:", len(TRK), stats(TRK), "| subjects:", {s: sum(1 for r in TRK if r["subject"] == s) for s in ["Gotchas","Common-Sense Traps"]})
