#!/usr/bin/env python3
"""Generate Logic & Deduction (300: Logic Puzzles 150, Sequences & Patterns 150)."""
import random, json, pathlib
random.seed(1212)
OUT = []
SEEN = set()
def norm(q): return " ".join(q.split()).lower()
def add(q, opts, ci, lv, subj, h, e):
    k = (subj.lower(), norm(q))
    if k in SEEN: return
    SEEN.add(k)
    OUT.append({"question": q, "options": opts, "correctIndex": ci, "level": lv, "subject": subj, "hint": h, "explanation": e})
def mc(ans, wrong):
    s = [ans]
    for w in wrong:
        if w != ans and w not in s: s.append(w)
        if len(s) == 4: break
    i = 1
    base = int(ans) if ans.isdigit() else 100
    while len(s) < 4:
        v = str(base + i * (3 if i % 2 else 7)) if ans.isdigit() else chr(65 + (ord(ans) - 65 + i) % 26)
        if v not in s: s.append(v)
        i += 1
    o = s[:]; random.shuffle(o)
    return o, o.index(ans)

NAMES = ["Anna", "Ben", "Clara", "David", "Elena", "Felix", "Grace", "Henry", "Isla", "Jonas"]
TRAITS = [("tallest", "height", "shorter"), ("oldest", "age", "younger"), ("fastest", "speed", "slower")]
def ordering():
    a, b, c, d = random.sample(NAMES, 4)
    trait, dim, less = random.choice(TRAITS)
    order = [a, b, c, d]; random.shuffle(order)
    chain = " ".join(order[i] + " is " + less + " than " + order[i + 1] + ". " for i in range(3))
    q = chain + "Who is the " + trait + "?"
    top = order[3]
    wrongs = [order[0], order[1], order[2]]
    o4, ci = mc(top, wrongs)
    e = "Ordering from " + less + " to greatest: " + " < ".join([order[0], order[1], order[2], order[3]]) + ". So " + top + " is the " + trait + "."
    return (q, o4, ci, "easy", "Logic Puzzles", "Line the comparisons up in a chain.", e)
def between():
    a, b, c, d = random.sample(NAMES, 4)
    trait, dim, less = random.choice(TRAITS)
    order = [a, b, c, d]; random.shuffle(order)
    q = (order[0] + " is " + less + " than " + order[1] + ". " + order[2] + " is " + less + " than " + order[0] + ". " +
         order[3] + " is between " + order[0] + " and " + order[1] + " in " + dim + ". Who is the " + trait + "?")
    top = order[1]
    o4, ci = mc(top, [order[0], order[2], order[3]])
    e = "From the clues: " + " < ".join([order[2], order[0], order[3], order[1]]) + " (with " + order[3] + " in the middle). So " + top + " is " + trait + "."
    return (q, o4, ci, "hard", "Logic Puzzles", "Sketch the order, then slot in the middle one.", e)
def truth_liar():
    a, b = random.sample(NAMES, 2)
    q = (a + " says: " + b + " always lies. " + b + " says: " + a + " always lies. Exactly one of them is a liar by nature. Who tells the truth?")
    correct = a
    o4, ci = mc(correct, [b, "Both lie", "Both tell the truth"])
    e = "They contradict each other, so exactly one lies — and it must be " + b + ", making " + a + " the truth-teller."
    return (q, o4, ci, "hard", "Logic Puzzles", "Assume one lies and test both cases.", e)
def positional():
    a, b, c = random.sample(NAMES, 3)
    places = ["the red house", "the blue house", "the green house"]
    random.shuffle(places)
    q = (a + " does not live in " + places[0] + " or " + places[1] + ". " + b + " lives in " + places[1] + ". Where does " + a + " live?")
    correct = places[2]
    o4, ci = mc(correct, [places[0], places[1], "Next to " + b])
    e = a + " cannot live in " + places[0] + " or " + places[1] + ", so " + a + " lives in " + places[2] + "."
    return (q, o4, ci, "medium", "Logic Puzzles", "Eliminate the impossible houses.", e)
g1 = [ordering, between, truth_liar, positional]
n = 0; attempts = 0
while n < 150 and attempts < 8000:
    attempts += 1
    before = len(OUT)
    r = random.choice(g1)()
    if r:
        before2 = len(OUT); add(*r)
        if len(OUT) > before2: n += 1

def seq_arith():
    start = random.randint(2, 30); step = random.randint(2, 12)
    seq = [start + step * i for i in range(4)]
    q = "What comes next: " + ", ".join(map(str, seq)) + ", ...?"
    ans = start + step * 4
    o4, ci = mc(str(ans), [str(ans + step), str(ans - 1), str(seq[-1] + step * 2)])
    return (q, o4, ci, "easy", "Sequences & Patterns", "Check the gap between terms.", "Add " + str(step) + " each time: next is " + str(ans) + ".")
def seq_geo():
    start = random.randint(1, 4); ratio = random.choice([2, 3])
    seq = [start * ratio ** i for i in range(4)]
    ans = start * ratio ** 4
    q = "What comes next: " + ", ".join(map(str, seq)) + ", ...?"
    o4, ci = mc(str(ans), [str(ans + start), str(seq[-1] + ratio), str(ans * 2)])
    return (q, o4, ci, "medium", "Sequences & Patterns", "Check the multiplier.", "Multiply by " + str(ratio) + " each time: next is " + str(ans) + ".")
def seq_alt():
    a = random.randint(3, 15); b = a + random.randint(5, 20)
    seq = []
    for i in range(5): seq.append(a if i % 2 == 0 else b)
    ans = a
    q = "What comes next: " + ", ".join(map(str, seq)) + ", ...?"
    o4, ci = mc(str(ans), [str(b), str(a + 1), str(b + 1)])
    return (q, o4, ci, "medium", "Sequences & Patterns", "Two values take turns.", "The pattern alternates " + str(a) + " and " + str(b) + "; next is " + str(a) + ".")
def seq_fib():
    a = random.randint(1, 5); b = random.randint(2, 6)
    seq = [a, b, a + b, a + 2 * b, 2 * a + 3 * b]
    ans = 3 * a + 5 * b
    q = "Each term is the sum of the previous two: " + ", ".join(map(str, seq)) + ", ...? What comes next?"
    o4, ci = mc(str(ans), [str(ans + 1), str(seq[-1] + b), str(ans - 1)])
    return (q, o4, ci, "hard", "Sequences & Patterns", "Add the last two terms.", str(seq[-2]) + " + " + str(seq[-1]) + " = " + str(ans) + ".")
def seq_letters():
    n = random.randint(1, 20)
    step = random.choice([2, 3])
    letters = []
    pos = n
    for i in range(3):
        letters.append(chr(64 + ((pos - 1) % 26) + 1)); pos += step
    ans = chr(64 + ((pos - 1) % 26) + 1)
    q = "Which letter comes next: " + ", ".join(letters) + ", ...?"
    wrongs = [chr(64 + ((ord(ans) - 64 + step - 1) % 26) + 1), chr(64 + ((ord(ans) - 64 + 1) % 26) + 1), chr(64 + ((ord(ans) - 64 - 1) % 26) + 1)]
    o4, ci = mc(ans, wrongs)
    return (q, o4, ci, "medium", "Sequences & Patterns", "Convert letters to positions, then back.", "Every step moves " + str(step) + " letters forward: next is " + ans + ".")
g2 = [seq_arith, seq_geo, seq_alt, seq_fib, seq_letters]
n = 0; attempts = 0
while n < 150 and attempts < 8000:
    attempts += 1
    before = len(OUT)
    r = random.choice(g2)()
    if r:
        before2 = len(OUT); add(*r)
        if len(OUT) > before2: n += 1

for r in OUT:
    if r["level"] == "easy" and random.random() < 0.2: r["level"] = "medium"
conv = 0
for r in OUT:
    if conv >= 25: break
    if r["level"] == "hard":
        r["level"] = "expert"; r["answer"] = r["options"][r["correctIndex"]]; r["options"] = []; conv += 1
pathlib.Path("data-json").mkdir(exist_ok=True)
part = 0
for i in range(0, len(OUT), 100):
    part += 1
    json.dump({"category": "Logic & Deduction", "riddles": OUT[i:i+100]}, open("data-json/logic-deduction-%d.json" % part, "w", encoding="utf-8"), indent=0)
print("logic:", len(OUT), "| subjects:", {s: sum(1 for r in OUT if r["subject"] == s) for s in ["Logic Puzzles", "Sequences & Patterns"]}, "| levels:", {l: sum(1 for r in OUT if r["level"] == l) for l in ["easy","medium","hard","expert"]})
