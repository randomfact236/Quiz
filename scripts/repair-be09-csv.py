#!/usr/bin/env python3
"""One-shot targeted repair of quiz-csv/pop-culture-celebrities.csv and
quiz-csv/food-cooking.csv (QA-FINDINGS TASK-03 / audit BE-09).

Fixes exactly ten cells, all verified hand-authoring defects:
  - pop-culture-celebrities.csv rows 26, 151, 341, 389, 575, 644, 744, 821:
    CJK mojibake (曾经的/保存/范畴/相关的) and/or literal " none skip" fragments
    inside a distractor option
  - pop-culture-celebrities.csv row 719: mojibake inside the question text
  - food-cooking.csv row 378: answer-in-question leak ("Gouda ... Gouda"),
    question reworded, options/answer letter unchanged

Safety properties:
  - targeted: every fix matches on row ID AND the exact expected old cell text;
    unexpected cell content (or a missing row) is reported as a MISMATCH and
    aborts the run without writing that file
  - line-splice write: all untouched lines are copied through byte-identical,
    so quoted rows elsewhere in the file cannot shift
  - atomic: output goes to a temp file in the same directory, then os.replace
  - idempotent: on a second run every fix reports already-ok and the file is
    left untouched (no rewrite)

Run:  python scripts/repair-be09-csv.py
"""
import csv, io, os, sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# file -> list of (row_id, column_index, column_label, old_text, new_text)
FIXES = {
    "pop-culture-celebrities.csv": [
        ("26", 5, "Option D", "Annes保存 none skip", "Annes royal foundation"),
        ("151", 5, "Option D", "Shirish sanskar none skip", "Shirish Sanskar analyst"),
        ("341", 3, "Option B", "Mackenzie Davis none skip", "Mackenzie Davis guest star"),
        ("389", 2, "Option A", "Idra none skip", "Idris Elba Heimdall"),
        ("575", 4, "Option C", "Odessa Young none skip", "Odessa Young cameo"),
        ("644", 4, "Option C", "Michael Massee相关的 none skip", "Michael Massee curse rumor"),
        ("719", 1, "Question", "Who is known as Jelena曾经的 pair?", "Who is known as Jelena?"),
        ("744", 3, "Option B", "Marc Onetto operations none skip", "Marc Onetto operations lead"),
        ("821", 5, "Option D", "Zen范畴 none skip", "Zachary Levi cameo"),
    ],
    "food-cooking.csv": [
        ("378", 1, "Question", "Gouda cheese is named after which Dutch city?",
         "Which Dutch city gave its name to the cheese named after it?"),
    ],
}


def splice_row(line: str, col: int, new_text: str) -> str:
    """Rebuild one already-parsed CSV data line with a single cell replaced."""
    row = next(csv.reader([line]))
    row[col] = new_text
    buf = io.StringIO()
    csv.writer(buf, lineterminator="").writerow(row)
    return buf.getvalue()


def repair_file(name: str, fixes):
    """Apply fixes to one file. Returns (fixed_now, already_ok, results, mismatched)."""
    path = os.path.join(REPO, "quiz-csv", name)
    with open(path, newline="", encoding="utf-8") as f:
        lines = f.read().splitlines()

    # fix identity is (row_id, column); a rewrite only fires when the current
    # cell still holds the exact expected old text
    specs = {(rid, col): (label, old, new) for rid, col, label, old, new in fixes}
    results = []  # (rid, label, status, before, after)
    hits = {}     # (row_id, col) -> new_text to splice
    reported = set()

    for ln in lines:
        if not ln.strip():
            continue
        row = next(csv.reader([ln]))
        rid = row[0].strip()
        for col in range(1, len(row)):
            if (rid, col) in specs:
                label, old, new = specs[(rid, col)]
                cell = row[col].strip()
                reported.add((rid, col))
                if cell == old:
                    results.append((rid, label, "FIXED", old, new))
                    hits[(rid, col)] = new
                elif cell == new:
                    results.append((rid, label, "already-ok", new, new))
                else:
                    results.append((rid, label, "MISMATCH (unexpected cell content)", old, cell))

    for key in sorted(set(specs) - reported):
        rid, col = key
        label, old, new = specs[key]
        results.append((rid, label, "MISMATCH (row not found)", old, new))

    mismatched = any(status.startswith("MISMATCH") for _, _, status, _, _ in results)
    if hits and not mismatched:
        out_lines = []
        for ln in lines:
            if not ln.strip():
                out_lines.append(ln)
                continue
            row = next(csv.reader([ln]))
            rid = row[0].strip()
            hit = next(((rid, c) for c in range(1, len(row)) if (rid, c) in hits), None)
            out_lines.append(splice_row(ln, hit[1], hits[hit]) if hit else ln)
        tmp = path + ".tmp-be09"
        with open(tmp, "w", encoding="utf-8", newline="") as f:
            f.write("\n".join(out_lines) + "\n")
        os.replace(tmp, path)

    fixed_now = sum(1 for r in results if r[2] == "FIXED")
    already = sum(1 for r in results if r[2] == "already-ok")
    return fixed_now, already, results, mismatched


def main() -> None:
    total_fixed = total_ok = 0
    any_mismatch = False
    print("BE-09 targeted CSV repair (pop-culture-celebrities + food-cooking)")
    for name, fixes in FIXES.items():
        fixed_now, already, results, mismatched = repair_file(name, fixes)
        total_fixed += fixed_now
        total_ok += already
        any_mismatch = any_mismatch or mismatched
        print(f"\n{name}: fixed-now={fixed_now}, already-ok={already}, mismatch={mismatched}")
        for rid, label, status, before, after in results:
            print(f"  row {rid:>4} {label}: [{status}]")
            print(f"        before: {before}")
            print(f"        after : {after}")
    print(f"\ntotal: fixed-now={total_fixed}, already-ok={total_ok}")
    if any_mismatch:
        print("RESULT: FAILED - unexpected cell content, file left unchanged")
        sys.exit(1)
    print("RESULT: OK" + (" (no changes needed this run)" if total_fixed == 0 else ""))


if __name__ == "__main__":
    main()
