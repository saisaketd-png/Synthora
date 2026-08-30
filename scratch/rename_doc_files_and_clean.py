import os
import re

repo_root = r"d:\Saisaket\Synthora"
docs_dir = os.path.join(repo_root, "docs")

# 1. Rename files in docs/
for root, dirs, files in os.walk(docs_dir):
    for f in files:
        if "synthora" in f.lower():
            old_path = os.path.join(root, f)
            new_name = re.sub(r"Synthora", "KemKendra", f, flags=re.IGNORECASE)
            new_path = os.path.join(root, new_name)
            os.rename(old_path, new_path)
            print(f"Renamed file: {f} -> {new_name}")

# 2. Fix specific markdown doc lines
doc_files_to_clean = [
    os.path.join(docs_dir, "DATABASE_BACKUP_AND_DISASTER_RECOVERY.md"),
    os.path.join(docs_dir, "DEPLOYMENT_RUNBOOK.md"),
    os.path.join(docs_dir, "PRODUCTION_DEPLOYMENT_CHECKLIST.md"),
    os.path.join(docs_dir, "RENDER_DEPLOYMENT.md"),
    os.path.join(docs_dir, "RENDER_STAGING_SMOKE_TEST.md"),
]

for doc_path in doc_files_to_clean:
    if os.path.exists(doc_path):
        with open(doc_path, "r", encoding="utf-8", errors="ignore") as h:
            c = h.read()
        c = re.sub(r"synthora_backup_", "kemkendra_backup_", c)
        c = re.sub(r"synthora_db_", "kemkendra_db_", c)
        c = re.sub(r"synthora_user", "kemkendra_user", c)
        c = re.sub(r"SynthoraApplication", "KemKendraApplication", c)
        with open(doc_path, "w", encoding="utf-8") as h:
            h.write(c)
        print(f"Cleaned {doc_path}")

print("Completed doc renaming and cleaning.")
