#!/usr/bin/env python3
"""Riddle CSV repair (BUG-023, BUG-024, BUG-026).

1. Replaces the 93 bare-letter answers on expert (open-ended) rows with the
   real answer text, authored from each riddle's explanation.
2. Rewrites the 30 cloned detective 'triple-refutation' rows so the clues
   refute ONLY the guilty suspect's alibi and confirm the other two, with the
   premise line changed to 'only one of them lied' — making the marked answer
   logically sound. Activities are rotated per row to break the verbatim clone.
   Also restores the missing 'the' before vanished items file-wide.
3. Rebalances MCQ (easy/medium/hard) answer letters within each level's
   displayed slice across all 10 category files, rewriting the answer column.
4. Dedups within file ('?'/whitespace-insensitive), renumbers '#'.
"""
import csv, io, re, os, sys

RD = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                  "plan", "imports", "riddle-mcq")
FILES = ["brain-teasers.csv", "detective-mystery.csv", "everyday-objects.csv",
         "funny-riddles.csv", "kids-family.csv", "lateral-thinking.csv",
         "logic-deduction.csv", "math-numbers.csv", "trick-questions.csv",
         "words-letters.csv"]
LETTERS = "ABCD"
SLICE = {"easy": 2, "medium": 3, "hard": 4}

ANSWERS = {
    ("brain-teasers.csv", "47"): "snow",
    ("brain-teasers.csv", "48"): "a sandstorm",
    ("brain-teasers.csv", "49"): "ivy",
    ("brain-teasers.csv", "50"): "an oak",
    ("brain-teasers.csv", "71"): "honey",
    ("brain-teasers.csv", "72"): "charcoal",
    ("brain-teasers.csv", "73"): "static electricity",
    ("brain-teasers.csv", "74"): "amber",
    ("brain-teasers.csv", "75"): "a sparkler",
    ("brain-teasers.csv", "93"): "the moon",
    ("brain-teasers.csv", "94"): "a glacier",
    ("brain-teasers.csv", "95"): "moss",
    ("brain-teasers.csv", "123"): "a lighthouse",
    ("brain-teasers.csv", "124"): "a volcano",
    ("brain-teasers.csv", "125"): "a snail",
    ("brain-teasers.csv", "146"): "armor",
    ("brain-teasers.csv", "147"): "braille",
    ("brain-teasers.csv", "148"): "a firefly",
    ("brain-teasers.csv", "149"): "lightning",
    ("brain-teasers.csv", "222"): "a contract",
    ("brain-teasers.csv", "223"): "reply all",
    ("brain-teasers.csv", "224"): "alt tab",
    ("brain-teasers.csv", "245"): "sleep",
    ("brain-teasers.csv", "249"): "a pay rise",
    ("brain-teasers.csv", "292"): "the family plan",
    ("brain-teasers.csv", "300"): "the winter draft",
    ("lateral-thinking.csv", "21"): "the hidden writing",
    ("lateral-thinking.csv", "22"): "the Olympic flame",
    ("lateral-thinking.csv", "23"): "microchips",
    ("lateral-thinking.csv", "24"): "hair",
    ("lateral-thinking.csv", "25"): "a cello",
    ("lateral-thinking.csv", "51"): "a broom",
    ("lateral-thinking.csv", "52"): "an umbrella",
    ("lateral-thinking.csv", "53"): "a cello",
    ("lateral-thinking.csv", "54"): "stone",
    ("lateral-thinking.csv", "75"): "the music",
    ("lateral-thinking.csv", "76"): "the border",
    ("lateral-thinking.csv", "77"): "steps",
    ("lateral-thinking.csv", "78"): "the ferry",
    ("lateral-thinking.csv", "79"): "seeds",
    ("lateral-thinking.csv", "100"): "applause",
    ("lateral-thinking.csv", "101"): "the pace setter",
    ("lateral-thinking.csv", "102"): "an alibi",
    ("lateral-thinking.csv", "103"): "the day's catch",
    ("lateral-thinking.csv", "104"): "a knitted sweater",
    ("lateral-thinking.csv", "125"): "gold",
    ("lateral-thinking.csv", "126"): "saffron",
    ("lateral-thinking.csv", "127"): "glass bottles",
    ("lateral-thinking.csv", "128"): "a wave",
    ("lateral-thinking.csv", "129"): "mood",
    ("lateral-thinking.csv", "150"): "weeds",
    ("lateral-thinking.csv", "151"): "a loaf of bread",
    ("lateral-thinking.csv", "154"): "broken things",
    ("lateral-thinking.csv", "173"): "insulin",
    ("lateral-thinking.csv", "174"): "a snowman",
    ("lateral-thinking.csv", "175"): "a lamb was being born",
    ("lateral-thinking.csv", "176"): "a pumpkin",
    ("lateral-thinking.csv", "177"): "the storm",
    ("lateral-thinking.csv", "196"): "the falling roof ice",
    ("lateral-thinking.csv", "197"): "her grandmother",
    ("lateral-thinking.csv", "198"): "his daughter",
    ("lateral-thinking.csv", "199"): "the water level",
    ("lateral-thinking.csv", "200"): "nothing",
    ("lateral-thinking.csv", "201"): "a dented bumper",
    ("lateral-thinking.csv", "202"): "a bicycle",
    ("lateral-thinking.csv", "221"): "typos",
    ("lateral-thinking.csv", "222"): "a raised arm",
    ("lateral-thinking.csv", "223"): "the babies",
    ("lateral-thinking.csv", "224"): "students",
    ("lateral-thinking.csv", "225"): "a frozen lake",
    ("lateral-thinking.csv", "226"): "breakfast",
    ("lateral-thinking.csv", "227"): "rubbish",
    ("lateral-thinking.csv", "246"): "bats",
    ("lateral-thinking.csv", "247"): "mold",
    ("lateral-thinking.csv", "248"): "the hollow",
    ("lateral-thinking.csv", "249"): "objections",
    ("lateral-thinking.csv", "250"): "backpacks",
    ("lateral-thinking.csv", "251"): "a lamp",
    ("lateral-thinking.csv", "252"): "books",
    ("lateral-thinking.csv", "271"): "a tree",
    ("lateral-thinking.csv", "272"): "an apology",
    ("lateral-thinking.csv", "273"): "drowned villages",
    ("lateral-thinking.csv", "274"): "salad greens",
    ("lateral-thinking.csv", "275"): "returns it to its owner",
    ("lateral-thinking.csv", "276"): "an exercise bike",
    ("lateral-thinking.csv", "277"): "bedroom windows",
    ("lateral-thinking.csv", "294"): "the school bus",
    ("lateral-thinking.csv", "295"): "cider",
    ("lateral-thinking.csv", "296"): "its clothes",
    ("lateral-thinking.csv", "297"): "a cannon",
    ("lateral-thinking.csv", "298"): "bowling pins",
    ("lateral-thinking.csv", "299"): "the coast path",
    ("lateral-thinking.csv", "300"): "the stations",
}

ACT = ["claims they were watering plants", "says they were baking bread",
       "insists they never left the reading room"]
# refutation of the guilty suspect's alibi + confirmation of the other two
CLUES = {
    0: "The flowerbeds are bone dry, the kitchen still smells of fresh bread, and the librarian remembers exactly who sat reading all evening.",
    1: "The kitchen clock shows the oven was never lit, the flowerbeds are freshly watered, and the librarian remembers exactly who sat reading all evening.",
    2: "The reading room was closed for repairs all evening, the flowerbeds are freshly watered, and the kitchen still smells of fresh bread.",
}
ROW_RE = re.compile(
    r"^At the (?P<place>[^,]+), (?P<item>[a-z][a-z -]*?) vanished\. "
    r"(?P<s1>\w+) claims they were watering plants, (?P<s2>\w+) says they were baking bread, and (?P<s3>\w+) insists they never left the reading room\. "
    r"(?P<clues>The plants are bone dry.*?enter)\. "
    r"Only one person told the truth about being elsewhere (?P<dashes>[—-]+) who took the (?P<item2>[^?]+)\?$")


def read_rows(path):
    with open(path, newline="", encoding="utf-8") as f:
        raw_lines = f.readlines()
    head = []
    data = []
    for ln in raw_lines:
        s = ln.strip()
        if not data and (not s or (s.startswith("#") and "," not in s)):
            head.append(ln)
        else:
            data.append(ln)
    return list(csv.DictReader(data)), "".join(head)


def fix_detective_template(fname, rows, report):
    for r in rows:
        m = ROW_RE.match(r["question"])
        if not m:
            continue
        report["detective_fixed"] += 1
        suspects = [m.group("s1"), m.group("s2"), m.group("s3")]
        rot = int(r["#"]) % 3
        acts = [ACT[(i + rot) % 3] for i in range(3)]
        m_ans = re.match(r"^([A-D])\.\s*(.+)$", r["answer"])
        assert m_ans, r["answer"]
        ans_name = m_ans.group(2).strip()
        gi = suspects.index(ans_name)  # raises if the marked answer is not a named suspect
        # suspect at position gi holds alibi slot (gi + rot) % 3
        clue = CLUES[(gi + rot) % 3]
        r["question"] = (
            f"At the {m.group('place')}, the {m.group('item')} vanished. "
            f"{suspects[0]} {acts[0]}, {suspects[1]} {acts[1]}, and {suspects[2]} {acts[2]}. "
            f"{clue} "
            f"Only one of them lied about being elsewhere — who took the {m.group('item')}?"
        )


def fix_article(fname, rows, report):
    """Restore the missing 'the' before '<item> vanished' after a comma."""
    for r in rows:
        q = r["question"]
        q2 = re.sub(r"(?<!the )(?<=, )([a-z][a-z -]*?) vanished", r"the \1 vanished", q)
        if q2 != q:
            r["question"] = q2


def main():
    grand = {}
    for fname in FILES:
        path = os.path.join(RD, fname)
        rows, head = read_rows(path)
        report = {"rows": len(rows), "answers_authored": 0, "detective_fixed": 0,
                  "article_fixed": 0, "dup_in": 0, "perm": 0, "numeric_kept": 0}

        if fname == "detective-mystery.csv":
            fix_detective_template(fname, rows, report)
        # authored answers for bare-letter open-ended rows
        for r in rows:
            key = (fname, r["#"])
            if r["level"] == "expert" and re.fullmatch(r"[A-Da-d]", (r["answer"] or "").strip()):
                assert key in ANSWERS, (fname, r["#"], r["question"][:60])
                r["answer"] = ANSWERS[key]
                report["answers_authored"] += 1
        # article repair on vanished items (all detective rows)
        if fname == "detective-mystery.csv":
            before = [r["question"] for r in rows]
            fix_article(fname, rows, report)
            report["article_fixed"] = sum(1 for a, b in zip(before, [r["question"] for r in rows]) if a != b)

        # dedup within file (report-only unless identical)
        seen, seen_rows = set(), []
        for r in rows:
            k = re.sub(r"\s+", " ", r["question"].strip().lower()).rstrip("?").strip()
            if k in seen:
                report["dup_in"] += 1
                continue
            seen.add(k)
            seen_rows.append(r)
        rows = seen_rows

        # rebalance MCQ letters
        counters = {}
        for r in rows:
            if r["level"] == "expert":
                continue
            m = re.match(r"^([A-D])\.\s*(.+)$", r["answer"])
            assert m, (fname, r["#"], r["answer"][:40])
            letter, text = m.group(1), m.group(2).strip()
            need = SLICE[r["level"]]
            opts = [(r[f"option{L}"] or "").strip() for L in LETTERS]
            counters.setdefault(r["level"], 0)
            target = LETTERS[counters[r["level"]] % need]
            counters[r["level"]] += 1
            if target == letter:
                continue
            ti, li = LETTERS.index(target), LETTERS.index(letter)
            quad = [o.lower().rstrip(".") for o in opts]
            if quad[li] and all(re.fullmatch(r"[\d,.]+", x) for x in quad if x):
                report["numeric_kept"] += 1
                continue
            opts[ti], opts[li] = opts[li], opts[ti]
            for i, L in enumerate(LETTERS):
                r[f"option{L}"] = opts[i]
            r["answer"] = f"{target}. {text}"
            report["perm"] += 1

        out = io.StringIO()
        w = csv.writer(out, lineterminator="\n", quoting=csv.QUOTE_ALL)
        w.writerow(["#", "question", "optionA", "optionB", "optionC", "optionD",
                    "answer", "level", "subject", "hint", "explanation", "status"])
        for i, r in enumerate(rows, 1):
            w.writerow([str(i)] + [r[c] for c in ["question", "optionA", "optionB",
                        "optionC", "optionD", "answer", "level", "subject", "hint",
                        "explanation", "status"]])
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(head.rstrip("\n") + "\n" + out.getvalue().rstrip("\n") + "\n")
        grand[fname] = report
        print(fname, report)

    print("\nTOTAL answers authored:", sum(r["answers_authored"] for r in grand.values()),
          "| detective rows rewritten:", sum(r["detective_fixed"] for r in grand.values()))


if __name__ == "__main__":
    main()
