import os
import re

repo_root = r"d:\Saisaket\Synthora"

def fix_file(file_path):
    if "db\\migration" in file_path or "db/migration" in file_path:
        return
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as h:
            content = h.read()
        
        new_content = content
        new_content = re.sub(r"com\.synthora", "com.kemkendra", new_content)
        new_content = re.sub(r"synthora-backend", "kemkendra-backend", new_content)
        new_content = re.sub(r"synthora-frontend", "kemkendra-frontend", new_content)
        new_content = re.sub(r"synthora-postgres", "kemkendra-postgres", new_content)
        new_content = re.sub(r"synthora-pgadmin", "kemkendra-pgadmin", new_content)
        new_content = re.sub(r"synthora-network", "kemkendra-network", new_content)
        new_content = re.sub(r"synthora-prod", "kemkendra-prod", new_content)
        new_content = re.sub(r"synthora_token", "kemkendra_token", new_content)
        new_content = re.sub(r"SYNTHORA_CORS", "KEMKENDRA_CORS", new_content)
        new_content = re.sub(r"SYNTHORA_JWT", "KEMKENDRA_JWT", new_content)
        new_content = re.sub(r"SYNTHORA_DB", "KEMKENDRA_DB", new_content)
        new_content = re.sub(r"synthora\.mail", "kemkendra.mail", new_content)
        new_content = re.sub(r"synthora\.storage", "kemkendra.storage", new_content)
        new_content = re.sub(r"synthora\.app", "kemkendra.app", new_content)
        new_content = re.sub(r"synthora\.rate-limit", "kemkendra.rate-limit", new_content)
        new_content = re.sub(r"synthora\.com", "kemkendra.com", new_content)
        new_content = re.sub(r"synthora_admin", "kemkendra_admin", new_content)
        new_content = re.sub(r"synthora_password", "kemkendra_password", new_content)
        new_content = re.sub(r"SynthoraDevSecretKeyForJwtSigning2026!", "KemKendraDevSecretKeyForJwtSigning2026!", new_content)
        new_content = re.sub(r"SynthoraSuperSecretKeyForJwtSigningMustBeAtLeast256BitsLong!", "KemKendraSuperSecretKeyForJwtSigningMustBeAtLeast256BitsLong!", new_content)
        new_content = re.sub(r"\bSynthora\b", "KemKendra", new_content)
        new_content = re.sub(r"\bSYNTHORA\b", "KEMKENDRA", new_content)
        new_content = re.sub(r"\bsynthora\b", "kemkendra", new_content)

        if new_content != content:
            with open(file_path, "w", encoding="utf-8") as h:
                h.write(new_content)
            print(f"Fixed: {file_path}")
    except Exception as e:
        print(f"Error on {file_path}: {e}")

EXCLUDED_DIRS = {".git", ".idea", "node_modules", "target", ".next", "dist", "out", "graphify-out", ".planning", "scratch"}

for root, dirs, files in os.walk(repo_root):
    dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
    for f in files:
        if f.endswith((".png", ".jpg", ".jpeg", ".ico", ".pdf", ".zip", ".tar", ".gz")):
            continue
        fix_file(os.path.join(root, f))

print("All remaining files fixed.")
