import os
import re

repo_root = r"d:\Saisaket\Synthora"

categories = {
    "HISTORICAL FLYWAY": [],
    "GIT METADATA": [],
    "GENERATED FILE / BUILD ARTIFACT": [],
    "SCRATCH SCRIPTS": [],
    "EXTERNAL / TEST DATA / EXCLUDED": [],
    "ACTIVE JAVA CODE": [],
    "ACTIVE CONFIGURATION": [],
    "ACTIVE FRONTEND": [],
    "ACTIVE DOCKER / INFRASTRUCTURE": [],
    "ACTIVE DOCUMENTATION": [],
}

EXCLUDED_DIRS = {".git", ".idea", "node_modules", "target", ".next", "dist", "out", "graphify-out", ".planning"}

for root, dirs, files in os.walk(repo_root):
    # Skip excluded directories in walk
    dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
    for f in files:
        if f.endswith((".png", ".jpg", ".jpeg", ".ico", ".pdf", ".zip", ".tar", ".gz")):
            continue
        
        file_path = os.path.join(root, f)
        rel_path = os.path.relpath(file_path, repo_root)

        # Classify by path
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as handle:
                lines = handle.readlines()
        except Exception:
            continue

        for idx, line in enumerate(lines, 1):
            if re.search(r"synthora", line, re.IGNORECASE):
                entry = f"{rel_path}:{idx}: {line.strip()}"

                if "db\\migration" in rel_path or "db/migration" in rel_path:
                    categories["HISTORICAL FLYWAY"].append(entry)
                elif rel_path.startswith(".git"):
                    categories["GIT METADATA"].append(entry)
                elif "target" in rel_path or ".next" in rel_path or "dist" in rel_path:
                    categories["GENERATED FILE / BUILD ARTIFACT"].append(entry)
                elif rel_path.startswith("scratch"):
                    categories["SCRATCH SCRIPTS"].append(entry)
                elif rel_path.startswith("backend\\src\\main\\java") or rel_path.startswith("backend/src/main/java"):
                    categories["ACTIVE JAVA CODE"].append(entry)
                elif rel_path.startswith("backend\\src\\test\\java") or rel_path.startswith("backend/src/test/java"):
                    categories["ACTIVE JAVA CODE"].append(entry)
                elif rel_path.endswith((".yml", ".yaml", ".properties", ".env", ".env.example", ".env.local", ".env.production")):
                    categories["ACTIVE CONFIGURATION"].append(entry)
                elif rel_path.startswith("frontend\\src") or rel_path.startswith("frontend/src") or rel_path.startswith("frontend\\public") or rel_path.startswith("frontend/public"):
                    categories["ACTIVE FRONTEND"].append(entry)
                elif rel_path.startswith("infrastructure") or "docker-compose" in rel_path or "Dockerfile" in rel_path:
                    categories["ACTIVE DOCKER / INFRASTRUCTURE"].append(entry)
                elif rel_path.endswith(".md") or rel_path.startswith("docs"):
                    categories["ACTIVE DOCUMENTATION"].append(entry)
                else:
                    categories["EXTERNAL / TEST DATA / EXCLUDED"].append(entry)

print("="*80)
print("COMPREHENSIVE FINAL AUDIT INVENTORY REPORT")
print("="*80)
for cat, items in categories.items():
    print(f"{cat}: {len(items)}")

print("\n" + "="*80)
print("DETAILS FOR NON-FLYWAY AND NON-SCRATCH MATCHES:")
print("="*80)
for cat in ["ACTIVE JAVA CODE", "ACTIVE CONFIGURATION", "ACTIVE FRONTEND", "ACTIVE DOCKER / INFRASTRUCTURE", "ACTIVE DOCUMENTATION", "EXTERNAL / TEST DATA / EXCLUDED"]:
    items = categories[cat]
    print(f"\n--- {cat} ({len(items)} items) ---")
    for item in items[:30]:
        print(item)
    if len(items) > 30:
        print(f"... and {len(items) - 30} more")
