#!/usr/bin/env python3
import os
import json

root = os.path.abspath(os.path.dirname(__file__))
image_dir = os.path.join(root, 'image')
index = {}

for dirpath, dirnames, filenames in os.walk(image_dir):
    rel_dir = os.path.relpath(dirpath, image_dir)
    if rel_dir == '.':
        rel_dir = ''
    webps = [f for f in filenames if f.lower().endswith('.webp')]
    if not webps:
        continue
    # Sort by numeric if names are numbers, else lexicographically
    def keyfn(n):
        name = os.path.splitext(n)[0]
        try:
            return (0, int(name))
        except Exception:
            return (1, name)
    webps.sort(key=keyfn)
    # Build relative paths like 'la comarca/41.webp' or 'nosotros/1.webp'
    rel_paths = [os.path.join(rel_dir, f).replace('\\','/') if rel_dir else f for f in webps]
    index[rel_dir if rel_dir else '/'] = rel_paths

out_path = os.path.join(root, 'images_index.json')
with open(out_path, 'w', encoding='utf-8') as fh:
    json.dump(index, fh, ensure_ascii=False, indent=2)

print(f"Wrote images_index.json with {sum(len(v) for v in index.values())} entries across {len(index)} folders to {out_path}")
