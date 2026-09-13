#!/usr/bin/env python3
"""Build riddle-mcq import CSVs from per-category JSON shard files.

Input:  scripts/riddle-csv/data/*.json  -> shards: {"category": str, "riddles": [...]}
        (several shards may belong to the same category; totals are checked)
Output: plan/imports/riddle-mcq/<category-slug>.csv  (ImportModal-compatible)

Each riddle object:
  MCQ rows:    {question, options: [4 strings], correctIndex: 0-3, level, subject, hint, explanation}
  Expert rows: {question, options: [], answer: "short text", level: "expert", subject, hint, explanation}

Validation mirrors the site's frontend parser (csv-parser.ts) and backend
import rules (riddle-mcq-import.service.ts):
  - MCQ rows need 4 distinct options and a correct option
  - expert rows need empty options + plain-text answer
  - question text unique per subject (backend duplicate guard is subjectId + hash)
  - no double quotes / newlines in any field (site parser cannot escape them)
"""

import csv
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(__file__).resolve().parent / "data"
OUT_DIR = ROOT / "plan" / "imports" / "riddle-mcq"

VALID_LEVELS = {"easy", "medium", "hard", "expert"}
HEADER = "#,question,optionA,optionB,optionC,optionD,answer,level,subject,hint,explanation,status"
EXPECTED_PER_CATEGORY = 300
LETTERS = "ABCD"


def norm(q: str) -> str:
    return re.sub(r"\s+", " ", q.strip().lower())


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s


def validate_shard(path: Path, seen_questions: dict, errors: list):
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append(f"{path.name}: invalid JSON — {e}")
        return None

    category = (payload.get("category") or "").strip()
    riddles = payload.get("riddles")
    if not category:
        errors.append(f"{path.name}: missing 'category'")
        return None
    if not isinstance(riddles, list) or not riddles:
        errors.append(f"{path.name}: 'riddles' must be a non-empty list")
        return None

    rows = []
    for i, r in enumerate(riddles, start=1):
        where = f"{path.name} riddle #{i}"
        question = (r.get("question") or "").strip()
        options = r.get("options")
        level = (r.get("level") or "").strip()
        subject = (r.get("subject") or "").strip()
        hint = (r.get("hint") or "").strip()
        explanation = (r.get("explanation") or "").strip()

        for field_name, val in [("question", question), ("subject", subject), ("hint", hint), ("explanation", explanation)]:
            if not val:
                errors.append(f"{where}: empty {field_name}")
            if '"' in val or "\n" in val or "\r" in val:
                errors.append(f"{where}: {field_name} contains a double quote or newline")

        if not (10 <= len(question) <= 240):
            errors.append(f"{where}: question length {len(question)} out of range")

        if level not in VALID_LEVELS:
            errors.append(f"{where}: invalid level '{level}'")
            continue

        if level == "expert":
            if options:
                errors.append(f"{where}: expert row must have empty options")
            answer = (r.get("answer") or "").strip()
            if not answer or '"' in answer or "\n" in answer:
                errors.append(f"{where}: expert row needs a plain-text answer")
            if len(answer) > 60:
                errors.append(f"{where}: expert answer too long ({len(answer)} chars) — keep 1-3 words")
            answer_cell = answer
            options = ["", "", "", ""]
        else:
            if not isinstance(options, list) or len(options) != 4 or any(not (o or "").strip() for o in options):
                errors.append(f"{where}: MCQ rows need exactly 4 non-empty options")
                continue
            options = [(o or "").strip() for o in options]
            if len({norm(o) for o in options}) != 4:
                errors.append(f"{where}: duplicate options — {question[:60]}")
                continue
            ci = r.get("correctIndex")
            if not isinstance(ci, int) or not (0 <= ci <= 3):
                errors.append(f"{where}: correctIndex must be 0-3")
                continue
            answer_cell = f"{LETTERS[ci]}. {options[ci]}"

        key = (subject.lower(), norm(question))
        if key in seen_questions:
            errors.append(f"{where}: duplicate question within subject — {question[:70]}")
        seen_questions[key] = where

        rows.append({
            "category": category,
            "cells": [question, options[0], options[1], options[2], options[3],
                      answer_cell, level, subject, hint, explanation, "published"],
            "level": level,
            "subject": subject,
            "correct_index": r.get("correctIndex") if level != "expert" else None,
        })

    return rows


def simulate_site_parser(csv_path: Path, errors: list):
    """Re-parse the generated CSV exactly like the site and verify each row imports."""
    lines = [l for l in csv_path.read_text(encoding="utf-8").splitlines() if l.strip()]
    if not lines[0].startswith("# Category:"):
        errors.append(f"{csv_path.name}: missing '# Category:' first line")
        return 0
    headers = [h.lower().strip() for h in parse_site_row(lines[1])]
    count = 0
    for raw in lines[2:]:
        if raw.startswith("#"):
            continue
        values = parse_site_row(raw)

        def get(col: str) -> str:
            idx = headers.index(col) if col in headers else -1
            return values[idx].strip() if idx >= 0 and len(values) > idx else ""

        question, level = get("question"), get("level")
        if not question:
            errors.append(f"{csv_path.name}: site parser would DROP a row (empty question)")
            continue
        options = [get(f"option{c}") for c in "abcd"]
        options = [o for o in options if o]
        answer_raw = get("answer")
        m = re.match(r"^([A-D])\.\s*(.*)$", answer_raw, re.IGNORECASE)
        if level == "expert":
            if m:
                errors.append(f"{csv_path.name}: expert row has letter-prefixed answer: {answer_raw[:40]}")
            if not answer_raw:
                errors.append(f"{csv_path.name}: expert row without text answer — backend needs it")
        else:
            if not m:
                errors.append(f"{csv_path.name}: MCQ row answer lacks 'X. ' prefix — backend would reject: {answer_raw[:40]}")
            elif len(options) < 2:
                errors.append(f"{csv_path.name}: MCQ row with <2 options")
            elif "abcd".index(m.group(1).lower()) >= len(options):
                errors.append(f"{csv_path.name}: answer letter out of option range")
        count += 1
    return count


def parse_site_row(row: str):
    """Port of parseCSVRow in apps/frontend/src/features/riddle-mcq/modals/csv-parser.ts."""
    result, current, in_quotes = [], "", False
    for char in row:
        if char == '"':
            in_quotes = not in_quotes
        elif char == "," and not in_quotes:
            result.append(current.strip())
            current = ""
        else:
            current += char
    result.append(current.strip())
    return result


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(DATA_DIR.glob("*.json"))
    if not files:
        print(f"No JSON shard files found in {DATA_DIR}")
        sys.exit(1)

    errors: list = []
    seen_questions: dict = {}
    by_category: dict = defaultdict(list)

    for path in files:
        rows = validate_shard(path, seen_questions, errors)
        if rows:
            by_category[rows[0]["category"]].extend(rows)

    total = 0
    for category, rows in by_category.items():
        if len(rows) != EXPECTED_PER_CATEGORY:
            errors.append(f"Category '{category}': expected {EXPECTED_PER_CATEGORY} riddles total, got {len(rows)}")

        level_counts = Counter(r["level"] for r in rows)
        subject_counts = Counter(r["subject"] for r in rows)
        pos = Counter(r["correct_index"] for r in rows if r["correct_index"] is not None)
        pos_total = sum(pos.values())
        for ci, n in pos.items():
            if pos_total and n / pos_total > 0.40:
                errors.append(f"Category '{category}': answer position {LETTERS[ci]} used {n}/{pos_total} times — spread answers across A-D")

        out = OUT_DIR / f"{slugify(category)}.csv"
        with out.open("w", encoding="utf-8", newline="") as f:
            f.write(f"# Category: {category}\n\n")
            f.write(HEADER + "\n")
            writer = csv.writer(f, quoting=csv.QUOTE_ALL, lineterminator="\n")
            for i, r in enumerate(rows, start=1):
                writer.writerow([str(i)] + r["cells"])
        parsed = simulate_site_parser(out, errors)
        lc = ", ".join(f"{k}={v}" for k, v in sorted(level_counts.items()))
        sc = ", ".join(f"{k}={v}" for k, v in sorted(subject_counts.items()))
        print(f"{out.name}: {len(rows)} rows written ({parsed} parse OK) | levels: {lc} | subjects: {sc}")
        total += len(rows)

    print(f"\nTotal: {total} riddles across {len(by_category)} categories -> {OUT_DIR}")

    if errors:
        print(f"\n{len(errors)} VALIDATION ERROR(S):")
        for e in errors[:80]:
            print(f"  - {e}")
        if len(errors) > 80:
            print(f"  ...and {len(errors) - 80} more")
        sys.exit(2)
    print("All validation checks passed.")


if __name__ == "__main__":
    main()
