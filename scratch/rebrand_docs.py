import os
import re

root_dir = r"d:\Saisaket\Synthora"

target_dirs = [
    os.path.join(root_dir, "docs"),
    os.path.join(root_dir, "frontend", "docs"),
    os.path.join(root_dir, "infrastructure"),
]

target_files = [
    os.path.join(root_dir, "README.md"),
    os.path.join(root_dir, "LICENSE"),
]

# Collect all md and conf files
all_files = []
for d in target_dirs:
    if os.path.exists(d):
        for root, dirs, files in os.walk(d):
            for f in files:
                if f.endswith((".md", ".conf", ".sh", ".sql", ".txt")):
                    all_files.append(os.path.join(root, f))

all_files.extend([f for f in target_files if os.path.exists(f)])

# Also include root phase reports
for f in os.listdir(root_dir):
    if f.endswith(".md"):
        all_files.append(os.path.join(root_dir, f))

count = 0
for file_path in all_files:
    # Skip flyway migrations
    if "db\\migration" in file_path or "db/migration" in file_path:
        continue
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as handle:
            content = handle.read()

        new_content = content
        new_content = re.sub(r"com\.synthora", "com.kemkendra", new_content)
        new_content = re.sub(r"synthora-backend", "kemkendra-backend", new_content)
        new_content = re.sub(r"synthora-frontend", "kemkendra-frontend", new_content)
        new_content = re.sub(r"synthora-prod", "kemkendra-prod", new_content)
        new_content = re.sub(r"synthora_token", "kemkendra_token", new_content)
        new_content = re.sub(r"SYNTHORA_CORS", "KEMKENDRA_CORS", new_content)
        new_content = re.sub(r"synthora\.mail", "kemkendra.mail", new_content)
        new_content = re.sub(r"synthora\.storage", "kemkendra.storage", new_content)
        new_content = re.sub(r"synthora\.app", "kemkendra.app", new_content)
        new_content = re.sub(r"synthora\.rate-limit", "kemkendra.rate-limit", new_content)
        new_content = re.sub(r"synthora\.com", "kemkendra.com", new_content)
        new_content = re.sub(r"synthora_admin", "kemkendra_admin", new_content)
        new_content = re.sub(r"\bSynthora\b", "KemKendra", new_content)
        new_content = re.sub(r"\bSYNTHORA\b", "KEMKENDRA", new_content)
        new_content = re.sub(r"\bsynthora\b", "kemkendra", new_content)

        if new_content != content:
            with open(file_path, "w", encoding="utf-8") as handle:
                handle.write(new_content)
            count += 1
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

print(f"Updated {count} documentation/infrastructure files.")
