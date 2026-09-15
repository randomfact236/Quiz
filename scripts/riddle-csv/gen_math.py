#!/usr/bin/env python3
"""Generate Math & Numbers riddle shards (300: Number Riddles 120, Age & Time 90, Counting 90)."""
import random
random.seed(42)
OUT = []
SEEN = set()
def norm(q): return ' '.join(q.split())
def add(q, opts, ci, lv, subj, h, e):
    k = (subj.lower(), norm(q).lower())
    if k in SEEN: return
    SEEN.add(k)
    OUT.append((q, opts, ci, lv, subj, h, e))
def mc(ans, wrong):
    s = {ans}
    for w in wrong:
        if w != ans and w not in s: s.add(w)
        if len(s) == 4: break
    base = int(ans) if ans.isdigit() else 100
    i = 1
    while len(s) < 4:
        v = str(base + i * (3 if i % 2 else 7))
        if v not in s and v != ans: s.add(v)
        i += 1
    o = list(s); random.shuffle(o)
    return o, o.index(ans)

openers = ["I am a number with a secret.", "Solve my riddle, if you dare.", "Numbers whisper my name.",
           "Crack my numeric code.", "I hide inside the digits.", "A puzzle in plain arithmetic."]
n = 0
# ---- Number Riddles: 120 (digit riddles, halves/doubles, squares, remainders) ----
def digit_riddle():
    t = random.randint(2, 9); o = random.randint(0, 9)
    if t * 2 + o > 18: o = random.randint(0, max(0, 18 - t * 2))
    num = t * 10 + o
    if num < 20 or o >= t: return None
    q = random.choice(openers) + " My tens digit is double my ones digit, and our digits add up to " + str(t + o) + ". What number am I?"
    o4, ci = mc(str(num), [str(num + 11), str(num - 9), str(t * 11)])
    return (q, o4, ci, "easy" if random.random() < .5 else "medium", "Number Riddles",
            "Work out the tens digit first.", "Tens digit " + str(t) + " is double the ones digit " + str(o) + ", and together they sum to " + str(t + o) + ".")
def sum_riddle():
    a = random.randint(11, 49)
    q = "I am a number: double me and add 7, and you land on " + str(2 * a + 7) + ". What am I?"
    o4, ci = mc(str(a), [str(a + 7), str((2 * a + 7) // 2 + 1), str(a - 4)])
    return (q, o4, ci, "medium", "Number Riddles", "Work backwards from the total.", "Subtract 7 to get " + str(2 * a) + ", then halve: " + str(a) + ".")
def square_riddle():
    s = random.randint(4, 15); sq = s * s
    q = "I am a perfect square. Multiply my square root by itself and you get " + str(sq) + ". What is my square root?"
    o4, ci = mc(str(s), [str(s + 1), str(s - 1), str(s + 2)])
    return (q, o4, ci, "easy", "Number Riddles", "Which number times itself gives " + str(sq) + "?", str(s) + " times " + str(s) + " equals " + str(sq) + ".")
def half_riddle():
    a = random.randint(20, 90)
    if a % 2: a += 1
    q = "Half of me is " + str(a // 2) + ". What number am I?"
    o4, ci = mc(str(a), [str(a // 2), str(a + 2), str(a * 2)])
    return (q, o4, ci, "easy", "Number Riddles", "Double the clue.", "Twice " + str(a // 2) + " is " + str(a) + ".")
def digit3_riddle():
    h = random.randint(2, 9); t = random.randint(0, 8); o = random.randint(1, 9)
    num = h * 100 + t * 10 + o
    q = "I am a three-digit number. My hundreds digit is " + str(h) + ", my tens digit is " + str(t) + ", and my ones digit is " + str(o) + ". My digits add up to what?"
    o4, ci = mc(str(h + t + o), [str(h + t + o + 1), str(h * t + o), str(h + t * o)])
    return (q, o4, ci, "medium", "Number Riddles", "Just add the three digits.", str(h) + " + " + str(t) + " + " + str(o) + " = " + str(h + t + o) + ".")
def remain_riddle():
    d = random.choice([3, 4, 5, 6]); q0 = random.randint(3, 12); r = random.randint(1, d - 1)
    n = d * q0 + r
    q = "Divide me by " + str(d) + " and you get " + str(q0) + " with a remainder of " + str(r) + ". What am I?"
    o4, ci = mc(str(n), [str(n + d), str(n - 1), str(d * q0)])
    return (q, o4, ci, "hard", "Number Riddles", "Multiply, then add the leftover.", str(d) + " x " + str(q0) + " + " + str(r) + " = " + str(n) + ".")
gens = [digit_riddle, sum_riddle, square_riddle, half_riddle, digit3_riddle, remain_riddle]
random.shuffle(gens)
attempts = 0
while n < 120 and attempts < 5000:
    attempts += 1
    before = len(OUT)
    g = random.choice(gens)
    r = g()
    if r:
        before2 = len(OUT)
        add(*r)
        if len(OUT) > before2: n += 1

# ---- Age & Time Puzzles: 90 ----
def age_riddle():
    x = random.randint(4, 30); age = random.choice([x // 2, x * 2])
    if x % 2: return None
    age = x * 2
    now = random.randint(30, 70)
    q = "When I was " + str(x) + ", my sister was half my age. Now I am " + str(now) + ". How old is my sister?"
    o4, ci = mc(str(now - x // 2), [str(now // 2), str(x // 2), str(now - x)])
    return (q, o4, ci, "medium", "Age & Time Puzzles", "The age gap never changes.", "The gap was " + str(x // 2) + " years, so she is " + str(now - x // 2) + " now.")
def age_double():
    c = random.randint(8, 20); p = c * 2 + random.randint(4, 20)
    years = p - 2 * c
    if years <= 0: return None
    q = "A father is " + str(p) + " and his child is " + str(c) + ". In how many years will the father be exactly twice as old?"
    o4, ci = mc(str(years), [str(years + 2), str(years - 1 if years > 1 else years + 3), str(c)])
    return (q, o4, ci, "hard", "Age & Time Puzzles", "Try the gap between them.", "In " + str(years) + " years: " + str(p + years) + " is double " + str(c + years) + ".")
def clock_angle():
    h = random.randint(1, 12); m = random.choice([0, 15, 30, 45])
    ang = abs(30 * (h % 12) - 5.5 * m); ang = min(ang, 360 - ang)
    if ang != int(ang): return None
    ang = int(ang)
    q = "It is exactly " + str(h) + ":" + str(m).zfill(2) + " on an analog clock. How many degrees between the hour and minute hands?"
    o4, ci = mc(str(ang), [str((ang + 30) % 360), str(abs(ang - 30)), str(ang + 15)])
    return (q, o4, ci, "hard", "Age & Time Puzzles", "Each minute, the minute hand moves 6 degrees.", "The hands are " + str(ang) + " degrees apart at " + str(h) + ":" + str(m).zfill(2) + ".")
def days_total():
    d = random.randint(20, 90)
    w, r = divmod(d, 7)
    q = "A trip lasts " + str(d) + " days. How many full weeks is that, and how many days are left over?"
    o4, ci = mc(str(w) + " weeks and " + str(r) + " days", [str(w + 1) + " weeks", str(w) + " weeks and " + str(7 - r if r else 0) + " days", str(w - 1) + " weeks and " + str(r + 7) + " days"])
    return (q, o4, ci, "easy", "Age & Time Puzzles", "Divide by seven.", str(d) + " divided by 7 is " + str(w) + " weeks remainder " + str(r) + ".")
def minutes_riddle():
    h = random.randint(2, 5); m = random.choice([10, 20, 25, 40])
    tot = h * 60 + m
    q = "A film runs " + str(h) + " hours and " + str(m) + " minutes. How many minutes long is it in total?"
    o4, ci = mc(str(tot), [str(tot + h), str(tot - m), str(h * 60 * m if m else tot)])
    return (q, o4, ci, "easy", "Age & Time Puzzles", "Convert the hours first.", str(h) + " hours is " + str(h * 60) + " minutes, plus " + str(m) + " = " + str(tot) + ".")
g2 = [age_riddle, age_double, clock_angle, days_total, minutes_riddle]
random.shuffle(g2)
n2 = 0
attempts = 0
while n2 < 90 and attempts < 5000:
    attempts += 1
    before = len(OUT)
    g = random.choice(g2)
    r = g()
    if r:
        before2 = len(OUT)
        add(*r)
        if len(OUT) > before2: n2 += 1

# ---- Counting Tricks: 90 ----
def cuts():
    cuts = random.randint(2, 8)
    pieces = cuts + 1
    q = "A carpenter saws a wooden plank " + str(cuts) + " times, straight across. How many pieces does he end up with?"
    o4, ci = mc(str(pieces), [str(cuts), str(cuts * 2), str(pieces + 1)])
    return (q, o4, ci, "medium", "Counting Tricks", "Each cut adds one piece.", str(cuts) + " cuts make " + str(pieces) + " pieces.")
def legs():
    ch = random.randint(2, 6); ducks = random.randint(3, 9)
    tot = ch * 2 + ducks * 2
    q = "A farmyard has " + str(ch) + " chickens and " + str(ducks) + " ducks. How many legs in total?"
    o4, ci = mc(str(tot), [str(tot + 4), str(ch + ducks), str(tot - 2)])
    return (q, o4, ci, "easy", "Counting Tricks", "Both birds have two legs.", str(ch + ducks) + " birds x 2 legs = " + str(tot) + ".")
def money_combo():
    f = random.randint(2, 9); t = random.randint(3, 9)
    tot = f * 5 + t
    q = "You have " + str(f) + " five-dollar bills and " + str(t) + " one-dollar coins. How much money in total?"
    o4, ci = mc(str(tot), [str(f + t), str(tot + 5), str(f * t)])
    return (q, o4, ci, "easy", "Counting Tricks", "Multiply, then add.", str(f) + " x 5 + " + str(t) + " = " + str(tot) + ".")
def fence_posts():
    n = random.randint(3, 12)
    q = "A straight fence is built from " + str(n) + " sections, end to end in a line. How many fence posts hold it up?"
    o4, ci = mc(str(n + 1), [str(n), str(n * 2), str(n - 1)])
    return (q, o4, ci, "hard", "Counting Tricks", "A line needs a post at both ends.", str(n) + " sections in a line need " + str(n + 1) + " posts.")
def handshakes_circle():
    n = random.randint(3, 9)
    q = str(n) + " friends each wave to every other friend exactly once. How many waves in total?"
    tot = n * (n - 1) // 2
    o4, ci = mc(str(tot), [str(n * (n - 1)), str(n * n), str(n - 1)])
    return (q, o4, ci, "hard", "Counting Tricks", "Each pair counts once, not twice.", str(n) + " friends form " + str(tot) + " unique pairs.")
def pages():
    p = random.randint(40, 90)
    q = "A printer prints one page every 2 seconds. How long to print " + str(p) + " pages?"
    sec = p * 2
    o4, ci = mc(str(sec) + " seconds", [str(p) + " seconds", str(sec // 2) + " seconds", str(sec * 2) + " seconds"])
    return (q, o4, ci, "easy", "Counting Tricks", "Multiply pages by seconds per page.", str(p) + " x 2 = " + str(sec) + " seconds.")
def slices_pizza():
    guests = random.randint(3, 8); sl = guests * 3
    q = "Each of " + str(guests) + " guests eats exactly 3 slices. How many slices must the pizza order contain?"
    o4, ci = mc(str(sl), [str(guests + 3), str(sl + 3), str(guests * 2)])
    return (q, o4, ci, "easy", "Counting Tricks", "Multiply guests by slices each.", str(guests) + " x 3 = " + str(sl) + " slices.")
g3 = [cuts, legs, money_combo, fence_posts, handshakes_circle, pages, slices_pizza]
random.shuffle(g3)
n3 = 0
attempts = 0
while n3 < 90 and attempts < 5000:
    attempts += 1
    before = len(OUT)
    g = random.choice(g3)
    r = g()
    if r:
        before2 = len(OUT)
        add(*r)
        if len(OUT) > before2: n3 += 1

# ---- Write shards ----
import collections
cat = collections.defaultdict(list)
for row in OUT: cat[row[4]].append(row)
SUBJ_FILE = {"Number Riddles": ("math-numbers", "Math & Numbers"),
             "Age & Time Puzzles": ("math-numbers", "Math & Numbers"),
             "Counting Tricks": ("math-numbers", "Math & Numbers")}
import json, pathlib
pathlib.Path("data-json").mkdir(exist_ok=True)
by_file = collections.defaultdict(list)
for subj, rows in cat.items():
    slug = SUBJ_FILE[subj][0]
    for q, opts, ci, lv, s, h, e in rows:
        r = {"question": q, "options": opts, "correctIndex": ci, "level": lv, "subject": s, "hint": h, "explanation": e}
        by_file[slug].append(r)
# merge with existing math shard content? none. write split into parts of 100:
part = 0
items = list(by_file["math-numbers"])
random.shuffle(items)
for i in range(0, len(items), 100):
    part += 1
    json.dump({"category": "Math & Numbers", "riddles": items[i:i+100]},
              open("data-json/math-numbers-%d.json" % part, "w", encoding="utf-8"), ensure_ascii=True, indent=0)
print("math total:", len(items), "| levels:", {l: sum(1 for x in items if x["level"] == l) for l in ["easy","medium","hard","expert"]})
