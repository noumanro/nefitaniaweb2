#!/usr/bin/env python3
"""
Sync image/skin/skins.json from a Google Sheet.

Usage (PowerShell):
  python update_skins_from_sheet.py --url "https://docs.google.com/spreadsheets/d/<ID>/edit?usp=sharing" [--gid 0] [--range A1:B] [--file-col file] [--name-col name]

Notes:
  - Downloads CSV from the sheet and maps rows to [{"file": "X.webp|png", "name": "Player"}]
  - Filters to files that actually exist under image/skin to avoid 404s in the carousel.
  - If name is empty, keeps it empty; you can fill later in the sheet.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from typing import List, Dict

ROOT = os.path.dirname(os.path.abspath(__file__))
SKIN_DIR = os.path.join(ROOT, "image", "skin")
OUT_JSON = os.path.join(SKIN_DIR, "skins.json")


def extract_id_and_gid(url: str):
    # Expecting https://docs.google.com/spreadsheets/d/<ID>/...
    m = re.search(r"/spreadsheets/d/([a-zA-Z0-9_-]+)", url)
    sheet_id = m.group(1) if m else None
    # Try to capture gid if present as a query param or fragment
    gid_match = re.search(r"[?&#]gid=(\d+)", url)
    gid = gid_match.group(1) if gid_match else None
    return sheet_id, gid


def build_csv_url(sheet_url: str, gid: str | None, range_a1: str | None, sheet_name: str | None = None) -> str:
    sheet_id, gid_from_url = extract_id_and_gid(sheet_url)
    if not sheet_id:
        raise ValueError("Could not extract spreadsheet ID from URL")
    gid_final = gid or gid_from_url or "0"

    base = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid_final}"
    if range_a1:
        base += f"&range={urllib.parse.quote(range_a1)}"
    return base


def download_csv(url: str) -> List[List[str]]:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = resp.read().decode("utf-8", errors="replace")
    rows = list(csv.reader(data.splitlines()))
    return rows


def scan_existing_files() -> set[str]:
    existing = set()
    if not os.path.isdir(SKIN_DIR):
        return existing
    for name in os.listdir(SKIN_DIR):
        lower = name.lower()
        if lower.endswith(".png") or lower.endswith(".webp"):
            existing.add(name)
    return existing


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True, help="Google Sheets share URL")
    parser.add_argument("--gid", help="Worksheet gid (defaults to 0 if not provided)")
    parser.add_argument("--range", dest="range_a1", help="Optional A1 range, e.g. A1:B100")
    parser.add_argument("--file-col", default="file", help="Column header for file name (default: file)")
    parser.add_argument("--name-col", default="name", help="Column header for display name (default: name)")
    args = parser.parse_args(argv)

    csv_url = build_csv_url(args.url, args.gid, args.range_a1)
    print(f"Fetching CSV: {csv_url}")
    rows = download_csv(csv_url)
    if not rows:
        print("No rows returned from sheet", file=sys.stderr)
        return 2

    headers = [h.strip() for h in rows[0]]
    data_rows = rows[1:]

    # Find columns by header name, but also allow column letters (A, B)
    def resolve_col(col_spec: str) -> int | None:
        col_spec = col_spec.strip()
        # If letter(s), convert A->0, B->1 ...
        if re.fullmatch(r"[A-Za-z]+", col_spec):
            col_index = 0
            for ch in col_spec.upper():
                col_index = col_index * 26 + (ord(ch) - ord('A') + 1)
            return col_index - 1
        # Else, look by header name
        try:
            return headers.index(col_spec)
        except ValueError:
            return None

    file_ix = resolve_col(args.file_col)
    name_ix = resolve_col(args.name_col)
    if file_ix is None:
        print(f"File column '{args.file_col}' not found in headers: {headers}", file=sys.stderr)
        return 3
    if name_ix is None:
        print(f"Name column '{args.name_col}' not found in headers: {headers}", file=sys.stderr)
        return 3

    existing = scan_existing_files()
    print(f"Found {len(existing)} existing skin files in image/skin")

    out: List[Dict[str, str]] = []
    for r in data_rows:
        if file_ix >= len(r):
            continue
        file_val = (r[file_ix] or "").strip()
        if not file_val:
            continue
        # Normalize encoding of spaces etc.
        file_norm = file_val.replace("\\", "/")
        file_norm = os.path.basename(file_norm)
        # Keep only simple filenames no subpaths
        if "/" in file_norm or ".." in file_norm:
            continue

        # If extension missing, try .webp then .png
        if not re.search(r"\.(png|webp)$", file_norm, re.IGNORECASE):
            base = file_norm
            cand_webp = base + ".webp"
            cand_png = base + ".png"
            if cand_webp in existing:
                file_norm = cand_webp
            elif cand_png in existing:
                file_norm = cand_png
            else:
                # Keep as-is with .webp by default
                file_norm = base + ".webp"

        # Filter to existing files to avoid 404s
        if file_norm not in existing:
            # Skip non-existing files to keep carousel clean
            continue

        name_val = (r[name_ix] if name_ix < len(r) else "").strip()
        out.append({"file": file_norm, "name": name_val})

    if not out:
        print("No valid rows to write", file=sys.stderr)
        return 4

    os.makedirs(SKIN_DIR, exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(out)} entries to {OUT_JSON}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
