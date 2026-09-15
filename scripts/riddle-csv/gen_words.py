#!/usr/bin/env python3
"""Generate Words & Letters shards (300: Wordplay 120, Hidden Words 90, Alphabet 90)."""
import random, json, pathlib, os
random.seed(77)
OUT = []  # dicts
SEEN = set()
def norm(q): return ' '.join(q.split())
def add(q, opts, ci, lv, subj, h, e):
    k = (subj.lower(), norm(q).lower())
    if k in SEEN: return
    SEEN.add(k)
    OUT.append({"question": q, "options": opts, "correctIndex": ci, "level": lv, "subject": subj, "hint": h, "explanation": e})
def mc(ans, wrong):
    s = [ans]
    for w in wrong:
        if w != ans and w not in s: s.append(w)
        if len(s) == 4: break
    i = 0
    fillers = ["candle", "marble", "saddle", "gospel", "ribbon", "muffin", "kernel", "pebble", "tunnel", "puzzle"]
    while len(s) < 4:
        if fillers[i] not in s: s.append(fillers[i])
        i += 1
    o = s[:]; random.shuffle(o)
    return o, o.index(ans)

def shuffle_word(w):
    l = list(w)
    while True:
        random.shuffle(l)
        if l != list(w): return "".join(l)

# ---------- Hidden Words (90): container word hides small word ----------
HIDDEN = [
    ("vegetables", "table"), ("classroom", "ass"), ("rhinoceros", "chin"), ("passport", "ass"),
    ("chocolate", "hola"), ("alphabet", "alpha"), ("caterpillar", "erpil"), ("understand", "tand"),
    ("strawberry", "raw"), ("watermelon", "term"), ("pineapple", "apple"), ("blueberry", "blue"),
    ("background", "ground"), ("masterpiece", "aster"), ("butterfly", "butter"), ("friendship", "end"),
    ("mountains", "untai"), ("happiness", "happi"), ("elephant", "elpha"), ("knowledge", "nowled"),
    ("courageous", "rage"), ("dictionary", "ction"), ("hurricane", "urric"), ("lightning", "light"),
    ("cardboard", "card"), ("notebook", "note"), ("toothpaste", "tooth"), ("sunflower", "sun"),
    ("horseshoe", "shoe"), ("rainbow", "rain"), ("cupboard", "cup"), ("keyboard", "key"),
    ("footprint", "foot"), ("handshake", "hand"), ("eyebrow", "brow"), ("overnight", "over"),
    ("grandmother", "grand"), ("teaspoon", "tea"), ("bedroom", "bed"), ("bathroom", "bath"),
    ("snowflake", "snow"), ("fireworks", "fire"), ("waterfall", "water"), ("windmill", "wind"),
    ("peppermint", "mint"), ("gingerbread", "ginger"), ("blackboard", "black"), ("newspaper", "news"),
    ("bookshelf", "book"), ("shoelace", "lace"), ("birthday", "day"), ("daydream", "dream"),
    ("nightmare", "night"), ("homework", "work"), ("playground", "play"), ("underground", "under"),
    ("overcoat", "coat"), ("raincoat", "rain"), ("headache", "head"), ("toothache", "tooth"),
    ("earring", "ear"), ("fingerprint", "print"), ("handwriting", "hand"), ("masterful", "master"),
    ("wonderful", "onder"), ("colorful", "color"), ("helpful", "help"), ("carefully", "care"),
    ("quickly", "quick"), ("slowly", "slow"), ("kindness", "kind"), ("darkness", "dark"),
    ("goodness", "good"), ("greatness", "great"), ("warmth", "warm"), ("strength", "strength"),
    ("cabinet", "bin"), ("carousel", "ouse"), ("cathedral", "hedral"), ("champion", "hampi"),
    ("character", "char"), ("chocolate", "late"), ("civilize", "vili"), ("climbable", "limb"),
    ("coconut", "coco"), ("comfortable", "fort"), ("community", "munit"), ("companion", "pian"),
]
TEMPL = ["There is a small word hiding inside {big}. Can you spot it?",
         "Which little word is tucked away inside {big}?",
         "Look closely at {big}: a shorter word hides within it. Which one?",
         "Hidden inside the letters of {big} is another word. What is it?",
         "A tiny word is camping inside {big}. Which word is it?"]
hints = ["Scan the letters slowly.", "It does not have to start at the front.", "Read the letters in order, no skipping.",
         "The hidden word is shorter than {big}.", "Keep the letters in their original order."]
fake_map = {"table": ["cable", "label", "fable"], "sun": ["fun", "run", "bun"], "rain": ["main", "pain", "grain"],
            "snow": ["slow", "show", "glow"], "key": ["hey", "buy", "sky"], "card": ["yard", "hard", "bard"]}
gen_fakes = ["candle", "marble", "saddle", "gospel", "ribbon", "muffin", "kernel", "pebble", "tunnel", "puzzle",
             "tremble", "simple", "dimple", "bundle", "handle", "middle", "paddle", "saddle", "riddle", "cattle"]
n = 0; idx = 0
seen_pairs = {}
while n < 90 and idx < len(HIDDEN) * 4:
    big, small = HIDDEN[idx % len(HIDDEN)]
    idx += 1
    if small not in big: continue
    if seen_pairs.get((big, small), 0) >= 2: continue
    tmpl_i = seen_pairs.get((big, small), 0)
    seen_pairs[(big, small)] = tmpl_i + 1
    q = TEMPL[tmpl_i % len(TEMPL)].format(big=big)
    wrongs = fake_map.get(small, [])
    if len(wrongs) < 3:
        wrongs = [w for w in gen_fakes if w not in small and w != small][:3]
    o4, ci = mc(small, wrongs)
    add(q, o4, ci, "easy" if n % 2 == 0 else "medium", "Hidden Words",
        random.choice(hints).format(big=big),
        "The word '" + small + "' appears inside '" + big + "' in order.")
    n += 1

# ---------- Alphabet Riddles (90) ----------
ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
def nth_letter(n, reverse=False):
    return ALPHA[26 - n] if reverse else ALPHA[n - 1]
def gen_letter_pos():
    n = random.randint(1, 26); reverse = random.random() < 0.4
    if reverse:
        correct = nth_letter(n, True)
        q = "Which letter is " + str(n) + " from the END of the alphabet?"
        expl = "Counting from Z backwards, number " + str(n) + " is " + correct + "."
    else:
        correct = nth_letter(n)
        q = "Which letter is " + str(n) + " from the start of the alphabet?"
        expl = "Counting from A, number " + str(n) + " is " + correct + "."
    pool = [l for l in ALPHA if l != correct]
    wrongs = random.sample(pool, 3)
    o4, ci = mc(correct, wrongs)
    return (q, o4, ci, "easy", "Alphabet Riddles", "Recite the alphabet and count.", expl)
def gen_vowel_count():
    w = random.choice(["elephant", "rhythm", "education", "strength", "imagination", "banana", "moon", "sky",
                       "crocodile", "psychology", "butterfly", "kitchen", "adventure", "symphony", "orange"])
    vowels = sum(1 for c in w if c in "AEIOUaeiou")
    q = "How many vowels does the word '" + w + "' contain?"
    o4, ci = mc(str(vowels), [str(vowels + 1), str(max(0, vowels - 1)), str(vowels + 2)])
    return (q, o4, ci, "medium", "Alphabet Riddles", "A, E, I, O, U — count them in order.", "'" + w + "' holds " + str(vowels) + " vowels.")
def gen_letter_riddle():
    pairs = [("What letter is a question?", "Y", ["B", "Q", "R"]),
             ("Which letter of the alphabet holds the most water?", "C", ["W", "T", "P"]),
             ("Which letter can you drink?", "T", ["E", "O", "K"]),
             ("Which letter is an insect?", "B", ["A", "F", "G"]),
             ("Which letter is a body of water?", "C", ["L", "S", "D"]),
             ("Which letter is a vegetable?", "P", ["C", "B", "T"]),
             ("Which letter is a drink?", "T", ["P", "N", "M"]),
             ("Which letter is always on time?", "Q? no", "", ""),]
    p = random.choice(pairs[:7])
    if not p[2]: return None
    o4, ci = mc(p[1], p[2])
    return (p[0], o4, ci, "easy", "Alphabet Riddles", "Say each option out loud.", "The answer is " + p[1] + ".")
def gen_vowel_pos():
    w = random.choice(["apple", "orange", "umbrella", "elephant", "iceberg", "octopus", "universe"])
    vpos = [i for i, c in enumerate(w) if c in "AEIOUaeiou"]
    pos = random.choice(vpos) + 1
    correct = w[pos - 1].upper()
    q = "In the word '" + w + "', which vowel sits at position " + str(pos) + "?"
    pool = [c.upper() for c in ALPHA if c.upper() in "AEIOU" and c.upper() != correct]
    o4, ci = mc(correct, random.sample(pool, 3))
    return (q, o4, ci, "medium", "Alphabet Riddles", "Count the letters from the start.", "Position " + str(pos) + " of '" + w + "' is " + correct + ".")
g_al = [gen_letter_pos, gen_vowel_count, gen_letter_riddle, gen_vowel_pos]
random.shuffle(g_al)
n = 0
attempts = 0
while n < 90 and attempts < 8000:
    attempts += 1
    before = len(OUT)
    g = random.choice(g_al)
    r = g()
    if r:
        before2 = len(OUT)
        add(*r)
        if len(OUT) > before2: n += 1

# ---------- Wordplay (120) ----------
def gen_anagram():
    pairs = [("listen", "silent"), ("stone", "notes"), ("night", "thing"), ("angel", "glean"),
             ("elbow", "below"), ("cider", "cried"), ("spat", "pats"), ("secure", "rescue"),
             ("slate", "stale"), ("tired", "tried"), ("horse", "shore"), ("layer", "early")]
    a, b = random.choice(pairs)
    scrambled = shuffle_word(a)
    pool = ["silent", "notes", "thing", "glean", "below", "cried", "pats", "rescue", "stale", "tried", "shore", "early"]
    q = "Unscramble the letters of '" + scrambled + "'. Which of these words uses exactly the same letters?"
    o4, ci = mc(b, [w for w in pool if w != b][:3])
    return (q, o4, ci, "medium", "Wordplay", "Same letters, different order.", "'" + a + "' and '" + b + "' use exactly the same letters.")
def gen_double():
    words = ["balloon", "coffee", "puppy", "letter", "summer", "ribbon", "dinner", "hammer", "puddle", "carrot", "monkey", "glasses",
             "muffin", "kettle", "pillow", "pepper", "dollar", "carpet", "jacket", "cotton", "soccer", "pebble", "gutter", "dinner"]
    w = random.choice(words)
    dbl = [w[i] for i in range(len(w) - 1) if w[i] == w[i + 1]]
    if not dbl: return None
    correct = dbl[0] + dbl[0]
    q = "Which double letter sits inside the word '" + w + "'?"
    o4, ci = mc(correct, ["ll", "ss", "tt"] if correct not in ["ll", "ss", "tt"] else ["oo", "ee", "rr"])
    return (q, o4, ci, "easy", "Wordplay", "Read the word slowly, letter by letter.", "'" + w + "' contains double " + correct + ".")
def gen_palindrome():
    pals = [("level", "level"), ("radar", "radar"), ("civic", "civic"), ("kayak", "kayak"), ("madam", "madam"), ("rotator", "rotator"), ("refer", "refer"),
            ("noon", "noon"), ("deed", "deed"), ("peep", "peep"), ("sees", "sees"), ("stats", "stats"), ("tenet", "tenet")]
    w, _ = random.choice(pals)
    q = "Which word reads the same forwards and backwards?"
    pool = ["piano", "guitar", "planet", "circle", "window", "shovel", "brick", "cloud", "spoon", "maple", "crayon", "velvet"]
    others = [p[0] for p in pals if p[0] != w][:1] + random.sample([x for x in pool if x not in pals], 2)
    o4, ci = mc(w, others)
    return (q, o4, ci, "easy", "Wordplay", "Try reading each option backwards.", "'" + w + "' is a palindrome.")
def gen_letter_start():
    pairs = [("Which word begins with B and rings for dinner?", "bell", ["ball", "bill", "bull"]),
             ("Which word begins with S and lights the night sky?", "star", ["scar", "spar", "stir"]),
             ("Which word begins with H and lives on your farm?", "horse", ["house", "horde", "hose"]),
             ("Which word begins with C and carries passengers underground?", "car? no", "", ""),
             ("Which word begins with M and tells the months?", "calendar? no", "", ""),
             ("Which word begins with W and falls from clouds?", "water? no", "", "")]
    p = random.choice(pairs)
    if not p[2] or not p[2][0] or "?" in p[2][0]: return None
    o4, ci = mc(p[1], p[2][:3])
    return (p[0], o4, ci, "medium", "Wordplay", "Think about the starting letter.", "The answer is " + p[1] + ".")
def gen_hidden_reverse():
    words = [("drawer", "reward"), ("stressed", "desserts"), ("straw", "warts"), ("bat", "tab"), ("diaper", "repaid"), ("loop", "pool")]
    w, rev = random.choice(words)
    q = "Spell '" + w + "' backwards and you get a real word. Which one?"
    others = [r for _, r in [(x, y) for x, y in words] if r != rev][:3]
    if len(others) < 3: others += ["pots", "spit", "stop"][:3 - len(others)]
    o4, ci = mc(rev, others)
    return (q, o4, ci, "medium", "Wordplay", "Write it out backwards, letter by letter.", "'" + w + "' backwards is '" + rev + "'.")
g_wp = [gen_anagram, gen_double, gen_palindrome, gen_hidden_reverse, gen_letter_start]
random.shuffle(g_wp)
n = 0
attempts = 0
while n < 120 and attempts < 8000:
    attempts += 1
    before = len(OUT)
    g = random.choice(g_wp)
    r = g()
    if r:
        before2 = len(OUT)
        add(*r)
        if len(OUT) > before2: n += 1

# levels + expert conversion + write
for r in OUT:
    if r["level"] == "easy" and random.random() < 0.15: r["level"] = "medium"
conv = 0
for r in OUT:
    if conv >= 30: break
    if r["level"] == "hard":
        r["level"] = "expert"; r["answer"] = r["options"][r["correctIndex"]]; r["options"] = []; conv += 1
pathlib.Path("data-json").mkdir(exist_ok=True)
part = 0
for i in range(0, len(OUT), 100):
    part += 1
    json.dump({"category": "Words & Letters", "riddles": OUT[i:i+100]},
              open("data-json/words-letters-%d.json" % part, "w", encoding="utf-8"), indent=0)
print("words:", len(OUT), "| subjects:", {s: sum(1 for r in OUT if r["subject"] == s) for s in ["Wordplay", "Hidden Words", "Alphabet Riddles"]}, "| levels:", {l: sum(1 for r in OUT if r["level"] == l) for l in ["easy","medium","hard","expert"]})
