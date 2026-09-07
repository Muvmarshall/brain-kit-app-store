#!/usr/bin/env python3
"""Phase 1 verify: reading skills CSV parses into the schema."""
import csv
from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / "data" / "reading-skills-sample.csv"
with path.open(newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

assert len(rows) >= 20, f"expected at least 20 skills, got {len(rows)}"
ids = [r["skill_id"] for r in rows]
assert len(ids) == len(set(ids)), "duplicate skill ids"
published = [r for r in rows if r["status"] == "published"]
draft = [r for r in rows if r["status"] == "draft"]
assert len(draft) == 1
assert draft[0]["skill_id"] == "read-draft-6-media"
assert len(published) == len(rows) - 1

for r in rows:
    qs = [r.get(f"q{n}_prompt") for n in range(1, 9) if r.get(f"q{n}_prompt")]
    assert len(qs) >= 3, f"{r['skill_id']} needs questions"
    assert r["standard_code"]
    assert r["grade_band"] in {"K-2", "3-5", "6-8", "9-12"}
    assert r["subject"] == "Reading"

print("PHASE1_OK", {"skills": len(rows), "published": len(published), "draft": len(draft)})
