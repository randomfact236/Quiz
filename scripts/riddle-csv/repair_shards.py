#!/usr/bin/env python3
"""Repair txt shards: missing headers, merged lines, and answer-position balance."""
import io, re, glob, os
from collections import Counter

D = os.path.dirname(os.path.abspath(__file__)) + "/data-txt"
CAT = "Brain Teasers"

# 1) prepend missing category headers
for f in glob.glob(D + "/*.txt"):
    lines = io.open(f, encoding="utf-8").read().splitlines()
    if lines and not lines[0].startswith("#category:"):
        lines.insert(0, "#category: " + CAT)
        io.open(f, "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")
        print("header fixed:", os.path.basename(f))

# 2) split merged lines: a period immediately followed by a capital letter never occurs in prose
for f in glob.glob(D + "/*.txt"):
    t = io.open(f, encoding="utf-8").read()
    fixed = re.sub(r"\.([A-Z])", r".\n\1", t)
    if fixed != t:
        io.open(f, "w", encoding="utf-8", newline="\n").write(fixed)
        print("split merged lines:", os.path.basename(f))

# 3) rebalance correct-answer positions across A-D for every MCQ line
total = Counter()
for f in sorted(glob.glob(D + "/*.txt")):
    lines = io.open(f, encoding="utf-8").read().splitlines()
    seq = 0
    out = []
    for line in lines:
        parts = line.split("~")
        if len(parts) == 10 and parts[6] in ("easy", "medium", "hard") and parts[5] in "ABCD":
            ci = "ABCD".index(parts[5])
            opts = parts[1:5]
            correct = opts[ci]
            target = (ci + seq) % 4
            opts[ci], opts[target] = opts[target], opts[ci]
            parts[1:5] = opts
            parts[5] = "ABCD"[target]
            seq += 1
            total[parts[5]] += 1
        out.append("~".join(parts))
    io.open(f, "w", encoding="utf-8", newline="\n").write("\n".join(out) + "\n")
print("answer positions now:", dict(total))
