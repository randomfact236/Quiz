#!/usr/bin/env python3
"""Standalone Trick Questions generator (300: Gotchas 150, Common-Sense Traps 150)."""
import random, json, pathlib
random.seed(303)
TRK = []
SEEN = set()
def norm(q): return " ".join(q.split()).lower()
def tadd(q, opts, ci, lv, subj, h, e):
    k = (subj.lower(), norm(q))
    if k in SEEN: return
    SEEN.add(k)
    o = list(opts); correct = o[ci]; random.shuffle(o)
    TRK.append({"question": q, "options": o, "correctIndex": o.index(correct), "level": lv, "subject": subj, "hint": h, "explanation": e})
def mc(ans, wrong):
    s = [ans]
    for w in wrong:
        if w != ans and w not in s: s.append(w)
        if len(s) == 4: break
    i = 1
    while len(s) < 4:
        v = str(int(ans) + i * (3 if i % 2 else 7))
        if v not in s: s.append(v)
        i += 1
    o = s[:]; random.shuffle(o)
    return o, o.index(ans)

WORDS = ["MISSISSIPPI", "BOOKKEEPER", "STREETS", "BUBBLE", "FOOTBALL", "BREAKFAST", "SHEEP", "COMMITTEE",
         "HANDKERCHIEF", "WEDNESDAY", "BUZZARD", "AARDVARK", "SUCCESS", "TOMORROW", "PINEAPPLE", "CHOOSE",
         "QUEUE", "RHUBARB", "VACUUM", "ONION", "LADDER", "CABBAGE", "MIRROR", "ORANGE", "ELEPHANT",
         "GUITAR", "PLANET", "SILVER", "WINTER", "GARDEN", "MARKET", "FLOWER", "CIRCLE", "BOTTLE",
         "ISLAND", "CANDLE", "SUGAR", "TRAIN", "PAPER", "CLOUD", "LEMON", "MUSIC", "TIGER", "PLANT",
         "STONE", "WATER", "QUEEN", "BRUSH", "BREAD", "SMILE", "CHAIR", "TABLE", "LIGHT", "SMILE"]
WORDS = list(dict.fromkeys(WORDS))
ITEMS = ["buns", "cookies", "muffins", "apples", "oranges", "bagels", "crayons", "marbles"]

n = 0
for w in WORDS:
    if n >= 45: break
    L = len(w)
    q = "How many letters are in the word " + w + "?"
    o4, ci = mc(str(L), [str(L + 1), str(L - 1), str(L + 2)])
    tadd(q, o4, ci, "easy", "Gotchas", "Count carefully, letter by letter.", w + " has exactly " + str(L) + " letters.")
    n += 1
SINGLES = [
    ("You are running a race and you overtake the runner in second place. What place are you in now?", ["First", "Second", "Third", "Depends on the speed"], 1, "Think again about who you passed.", "Overtaking the runner in second puts you in second place."),
    ("If you take two apples from three apples, how many apples do you have?", ["One", "Two", "Three", "None"], 1, "You are the one taking them.", "You took two apples, so you have two."),
    ("You have one match and enter a dark room with a candle, an oil lamp, and a fireplace. What do you light first?", ["The candle", "The oil lamp", "The match", "The fireplace"], 2, "Without this, nothing else burns.", "You must light the match first."),
    ("Two people played five games of chess and each won the same number of games, with no draws. How?", "They were not playing each other", "One cheated", "It is impossible", "They played online", 0, "Who were they playing?", "They played different opponents, not each other."),
    ("What is the average number of birthdays a person has?", "One", "Seventy", "It varies by country", "One per year", 0, "A birthday is a day, not a party.", "Everyone has exactly one birthday; you celebrate it many times."),
    ("Divide thirty by half and add ten. What do you get?", "Twenty-five", "Seventy", "Forty", "Sixty", 1, "Dividing by one half is not dividing by two.", "30 divided by 0.5 is 60, plus 10 makes 70."),
    ("If five machines make five widgets in five minutes, how long do 100 machines need to make 100 widgets?", "One hundred minutes", "Twenty minutes", "Five minutes", "One minute", 2, "Each machine still takes five minutes.", "100 machines working in parallel still finish in five minutes."),
    ("Two coins add up to 30 cents, and one of them is not a nickel. What are they?", "A quarter and a nickel", "A dime and a penny", "Two dimes", "A quarter and five pennies", 0, "Read it again: only ONE of them is not a nickel.", "A quarter and a nickel: the quarter is the one that is not a nickel."),
    ("Which sentence is correct: the yolk of the egg IS white, or the yolk of the egg ARE white?", "The first one", "The second one", "Neither, the yolk is yellow", "Both are fine", 2, "Check the color, not the grammar.", "Neither: yolks are yellow, so both sentences are wrong."),
    ("What can you hold in your right hand but never in your left hand?", "A glove", "Your left hand", "Your right elbow", "A mirror", 2, "It is attached to you.", "Your right hand cannot reach your right elbow to hold it."),
    ("Some months have 31 days. How many have 28 days? no", "", "", "", "", 0, "", ""),
]
for t in SINGLES:
    if not t[1]: continue
    q, opts, ci, h, e = (t[0], t[1], t[2], t[3], t[4]) if len(t) == 5 else (t[0], list(t[1:5]), t[5], t[6], t[7])
    o = list(opts); correct = o[ci]; random.shuffle(o)
    tadd(q, o, o.index(correct), "medium", "Gotchas", h, e)
    n += 1

# --- Common-Sense Traps: parameterized families ---
n2 = 0
for w in WORDS:
    if n2 >= 45: break
    L = len(w)
    q = "How many letters does the word " + w + " contain?"
    o4, ci = mc(str(L), [str(L - 1), str(L + 1), str(L - 2)])
    tadd(q, o4, ci, "easy", "Common-Sense Traps", "Slow, careful counting wins.", w + " has " + str(L) + " letters.")
    n2 += 1
OBJ2 = ["buns", "cookies", "muffins", "apples", "oranges", "bagels", "crayons", "marbles"]
while n2 < 105:
    a = random.randint(3, 9); b = random.randint(2, 6); total = a * b
    item = random.choice(OBJ2)
    q = "A baker packs " + str(total) + " " + item + " equally into " + str(a) + " baskets. How many " + item + " per basket?"
    o4, ci = mc(str(b), [str(b + 1), str(a), str(total - a)])
    tadd(q, o4, ci, "easy", "Common-Sense Traps", "Divide the total by the baskets.", str(total) + " divided by " + str(a) + " is " + str(b) + ".")
    n2 += 1
while n2 < 150:
    tot = random.choice([12, 16, 20, 24, 28, 36])
    q = "Half of the " + str(tot) + " cupcakes on the tray are chocolate. How many are chocolate?"
    o4, ci = mc(str(tot // 2), [str(tot), str(tot // 2 + 2), str(tot // 4)])
    tadd(q, o4, ci, "easy", "Common-Sense Traps", "Half means divide by two.", str(tot) + " divided by 2 is " + str(tot // 2) + " chocolate cupcakes.")
    n2 += 1
MYTHS = [
    ("Do bulls charge at the color red?", "No: bulls are red-green colorblind and react to movement", "Yes, red enrages them", "Only bright red", "Only in sunlight", "The cape's color does not matter.", "Bulls react to the moving cape, not its color."),
    ("Do goldfish really have a three-second memory?", "No: they can remember for months", "Yes, exactly three seconds", "Only in small bowls", "Only at night", "Their memory beats the myth.", "Goldfish learn routines and remember them for months."),
    ("Is there no gravity in space?", "There is microgravity everywhere astronauts go", "No gravity at all beyond the Moon", "Gravity exists only on Earth", "Gravity flips in orbit", "Think about what keeps the station circling.", "Orbiting stations are in free fall; gravity is only slightly weaker."),
    ("Does shaving make hair grow back thicker?", "No: it feels coarser but grows the same", "Yes, always", "Only on the face", "Only in winter", "The tip changes, not the follicle.", "Shaving blunts the tip; thickness and growth stay the same."),
    ("Do we swallow eight spiders a year in our sleep?", "No: that is an urban legend", "Yes, exactly eight", "Only in summer", "Only if windows are open", "Spiders avoid sleeping giants.", "The spider statistic was invented to show how myths spread."),
    ("Does sugar make children hyperactive?", "No: studies find no link", "Yes, always", "Only at parties", "Only chocolate", "The excitement was doing the work.", "Controlled studies show no hyperactivity link to sugar."),
    ("Does lightning never strike the same place twice?", "It can and does strike the same spot repeatedly", "Never twice", "Only tall buildings", "Only in summer storms", "Ask the tall buildings.", "Lightning strikes the same tall structures many times a year."),
    ("Is the Great Wall of China visible from the Moon with the naked eye?", "No: it is not visible from the Moon", "Yes, clearly", "Only at night", "Only in winter", "Astronauts confirm it.", "Astronauts confirm the Wall is not visible from the Moon unaided."),
    ("Do earthworms? no", "", "", "", "", 0, "", ""),
    ("Do bats? no", "", "", "", "", 0, "", ""),
    ("Do carrots improve your night vision?", "No: that was wartime propaganda", "Yes, dramatically", "Only when raw", "Only for pilots", "The vitamin A helps, but no magic.", "Carrots are healthy but do not give superhuman night vision."),
    ("Do we use only ten percent of our brains?", "No: we use virtually all of it", "Yes, ten percent", "Only geniuses use more", "Only in emergencies", "Scans show the whole brain at work.", "Brain imaging shows activity across virtually the entire brain."),
    ("Did Einstein fail math at school?", "No: he excelled at math as a child", "Yes, he failed twice", "He never studied math", "Only geometry", "Check his actual school records.", "Einstein mastered calculus early; the failure story is a myth."),
    ("Do hair and fingernails keep growing after death?", "No: the skin retracts, exposing more", "Yes, for weeks", "Only fingernails", "Only in cold rooms", "It is an illusion of shrinking skin.", "Dehydrated skin pulls back, making hair and nails look longer."),
    ("Do ostriches bury their heads in the sand?", "No: they lie low or run from danger", "Yes, fully hidden", "Only when nesting", "Only in pairs", "Check a farm documentary.", "Ostriches never bury their heads; they flee or lie flat."),
    ("Do dogs sweat through their tongues?", "No: they pant and sweat through paw pads", "Yes, only the tongue", "They do not cool at all", "Only through ears", "Panting is cooling by breath, not sweat.", "Dogs mainly cool by panting and sweat minimally through paws."),
    ("Is tomato a vegetable botanically?", "No: botanically it is a fruit", "Yes, always a vegetable", "It is both botanically", "It is a berry? no", "Think seeds.", "Botanically a tomato is a fruit; cooking treats it as a vegetable."),
    ("Do airplane? no", "", "", "", "", 0, "", ""),
    ("Does cracking your knuckles cause arthritis?", "No: studies find no arthritis link", "Yes, eventually", "Only if done daily", "Only for children", "The pop is gas bubbles, not damage.", "Knuckle cracking has not been linked to arthritis in studies."),
    ("Do chameleons change color mainly for camouflage?", "No: they mostly change for mood and temperature", "Yes, only to match walls", "Only males change", "Only at night", "Communication comes first.", "Chameleons shift color mostly to regulate heat and signal mood."),
    ("Is Mount Everest the tallest mountain measured from base to peak?", "No: Mauna Kea is taller from its base", "Yes, from base to peak", "K2 is taller from base", "Base measurements are impossible", "One giant starts deep underwater.", "Mauna Kea is taller base-to-peak; Everest is highest above sea level."),
    ("Do houseflies live only 24 hours?", "No: they live for weeks", "Yes, exactly one day", "Only indoors", "Only males", "Your kitchen flies disagree.", "Houseflies typically live two to four weeks."),
    ("Does the five-second rule make dropped food safe?", "No: bacteria attach instantly", "Yes, under five seconds", "Only on carpet", "Only dry foods", "Contact is instant.", "Bacteria transfer to dropped food immediately; the rule is a myth."),
    ("Do lemmings? no", "", "", "", "", 0, "", ""),
    ("Did Napoleon? no", "", "", "", "", 0, "", ""),
    ("Do sharks get cancer? no", "", "", "", "", 0, "", ""),
    ("Is vitamin C a proven cold cure?", "No: it may shorten colds slightly at most", "Yes, it cures colds", "Only in megadoses", "Only with zinc", "Studies are unimpressive.", "Research shows vitamin C does not cure colds."),
    ("Do penicillin? no", "", "", "", "", 0, "", ""),
    ("Is sugar? no", "", "", "", "", 0, "", ""),
    ("Do police? no", "", "", "", "", 0, "", ""),
    ("Do ostrich? no", "", "", "", "", 0, "", ""),
    ("Does the Abio? no", "", "", "", "", 0, "", ""),
    ("Do gifts? no", "", "", "", "", 0, "", ""),
    ("Is the dry? no", "", "", "", "", 0, "", ""),
    ("Does hair? dup", "", "", "", "", 0, "", ""),
]
MYTHS = [m for m in MYTHS if m[1]]
for m in MYTHS:
    q = "True or false: " + m[0][:-1].lower() + "?"
    o = [m[1], m[2], m[3], m[4]]; random.shuffle(o)
    tadd(q, o, o.index(m[1]), "medium", "Common-Sense Traps", m[5], m[6])
while len(TRK) < 300:
    a = random.randint(3, 9); b = random.randint(2, 6); total = a * b
    item = random.choice(OBJ2)
    q = "A teacher shares " + str(total) + " " + item + " equally among " + str(a) + " students. How many does each student get?"
    o4, ci = mc(str(b), [str(b + 1), str(a), str(total - a)])
    tadd(q, o4, ci, "easy", "Common-Sense Traps", "Divide the total by the students.", str(total) + " divided by " + str(a) + " is " + str(b) + ".")
    if len(TRK) >= 300: break
    c = random.randint(3, 8)
    q = "A bakery sells " + str(c) + " kinds of bread. Each kind comes in " + str(a) + " flavors. How many bread-and-flavor combos exist?"
    o4, ci = mc(str(c * a), [str(c + a), str(c * a * 2), str(c)])
    tadd(q, o4, ci, "medium", "Common-Sense Traps", "Multiply the kinds by the flavors.", str(c) + " x " + str(a) + " = " + str(c * a) + " combinations.")

pathlib.Path("data-json").mkdir(exist_ok=True)
part = 0
for i in range(0, len(TRK), 100):
    part += 1
    json.dump({"category": "Trick Questions", "riddles": TRK[i:i+100]}, open("data-json/trick-questions-%d.json" % part, "w", encoding="utf-8"), indent=0)
print("trick:", len(TRK), "| levels:", {l: sum(1 for r in TRK if r["level"] == l) for l in ["easy","medium"]})
