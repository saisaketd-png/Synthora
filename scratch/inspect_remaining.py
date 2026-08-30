import os
import re

repo_root = r"d:\Saisaket\Synthora"
EXCLUDED_DIRS = {".git", ".idea", "node_modules", "target", ".next", "dist", "out", "graphify-out", ".planning", "scratch"}

print("--- FILE / DIRECTORY NAMES ---")
for root, dirs, files in os.walk(repo_root):
    dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
    for d in dirs:
        if "synthora" in d.lower():
            print("Dir:", os.path.relpath(os.path.join(root, d), repo_root))
    for f in files:
        if "synthora" in f.lower() and "db\\migration" not in root and "db/migration" not in root:
            print("File:", os.path.relpath(os.path.join(root, f), repo_root))

print("\n--- ACTIVE DOCUMENTATION ---")
for root, dirs, files in os.walk(repo_root):
    dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
    for f in files:
        if (f.endswith(".md") or root.startswith(os.path.join(repo_root, "docs"))) and not f.endswith((".png", ".jpg", ".zip")):
            fp = os.path.join(root, f)
            try:
                with open(fp, "r", encoding="utf-8", errors="ignore") as h:
                    for i, l in enumerate(h, 1):
                        if "synthora" in l.lower():
                            print(f"{os.path.relpath(fp, repo_root)}:{i}: {l.strip()[:100]}")
            except Exception:
                pass
