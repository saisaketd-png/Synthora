import os
import re

repo_root = r"d:\Saisaket\Synthora"

categories = {
    "ACTIVE JAVA CODE": [],
    "ACTIVE CONFIGURATION": [],
    "ACTIVE FRONTEND": [],
    "ACTIVE JAVA PACKAGES": [],
    "ACTIVE FILE/DIRECTORY NAMES": [],
    "ACTIVE DOCKER / INFRASTRUCTURE": [],
    "ACTIVE DOCUMENTATION": [],
    "ACTIVE TEST REFERENCES": [],
    "ACTIVE ENV CONFIG": [],
    "ACTIVE JWT REFERENCES": [],
    "ACTIVE STORAGE KEY REFERENCES": [],
    "HISTORICAL FLYWAY REFERENCES": [],
}

EXCLUDED_DIRS = {".git", ".idea", "node_modules", "target", ".next", "dist", "out", "graphify-out", ".planning", "scratch"}

for root, dirs, files in os.walk(repo_root):
    dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
    for d in dirs:
        if re.search(r"synthora", d, re.IGNORECASE):
            categories["ACTIVE FILE/DIRECTORY NAMES"].append(os.path.join(root, d))

    for f in files:
        if re.search(r"synthora", f, re.IGNORECASE):
            if "db\\migration" not in root and "db/migration" not in root:
                categories["ACTIVE FILE/DIRECTORY NAMES"].append(os.path.join(root, f))

        if f.endswith((".png", ".jpg", ".jpeg", ".ico", ".pdf", ".zip", ".tar", ".gz")):
            continue

        file_path = os.path.join(root, f)
        rel_path = os.path.relpath(file_path, repo_root)

        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as handle:
                lines = handle.readlines()
        except Exception:
            continue

        for idx, line in enumerate(lines, 1):
            if re.search(r"synthora", line, re.IGNORECASE):
                entry = f"{rel_path}:{idx}: {line.strip()}"

                if "db\\migration" in rel_path or "db/migration" in rel_path:
                    categories["HISTORICAL FLYWAY REFERENCES"].append(entry)
                elif "package com.synthora" in line or "import com.synthora" in line:
                    categories["ACTIVE JAVA PACKAGES"].append(entry)
                elif "synthora_token" in line:
                    categories["ACTIVE STORAGE KEY REFERENCES"].append(entry)
                elif rel_path.startswith("backend\\src\\test") or rel_path.startswith("backend/src/test"):
                    categories["ACTIVE TEST REFERENCES"].append(entry)
                elif rel_path.startswith("backend\\src\\main\\java") or rel_path.startswith("backend/src/main/java"):
                    categories["ACTIVE JAVA CODE"].append(entry)
                elif rel_path.startswith("frontend\\src") or rel_path.startswith("frontend/src") or rel_path.startswith("frontend\\public") or rel_path.startswith("frontend/public"):
                    categories["ACTIVE FRONTEND"].append(entry)
                elif rel_path.endswith((".env", ".env.example", ".env.local", ".env.production")):
                    categories["ACTIVE ENV CONFIG"].append(entry)
                elif rel_path.endswith((".yml", ".yaml", ".properties")):
                    categories["ACTIVE CONFIGURATION"].append(entry)
                elif rel_path.startswith("infrastructure") or "docker-compose" in rel_path or "Dockerfile" in rel_path:
                    categories["ACTIVE DOCKER / INFRASTRUCTURE"].append(entry)
                elif rel_path.endswith(".md") or rel_path.startswith("docs"):
                    categories["ACTIVE DOCUMENTATION"].append(entry)

print("="*80)
print("FINAL REBRANDING COMPLIANCE MATRIX")
print("="*80)
for cat, items in categories.items():
    print(f"{cat:<35} {len(items)}")
