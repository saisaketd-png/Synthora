import os
import re

root_dir = r"d:\Saisaket\Synthora"

ignored_dirs = {".git", ".next", "target", "node_modules", ".system_generated", "dist"}

findings = {
    "user_facing_ui_text": [],
    "java_package_namespace": [],
    "flyway_migrations": [],
    "database_name_and_local_urls": [],
    "spring_config_namespace": [],
    "legacy_auth_fallback": [],
    "documentation_and_skills": [],
    "other": []
}

pattern = re.compile(r"synthora", re.IGNORECASE)

for root, dirs, files in os.walk(root_dir):
    # Skip ignored dirs in-place
    dirs[:] = [d for d in dirs if d not in ignored_dirs]
    for f in files:
        if f.endswith((".png", ".jpg", ".jpeg", ".ico", ".svg", ".log", ".class", ".jar")):
            continue
        file_path = os.path.join(root, f)
        rel_path = os.path.relpath(file_path, root_dir)
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as handle:
                lines = handle.readlines()
                for idx, line in enumerate(lines, 1):
                    if pattern.search(line):
                        entry = (rel_path, idx, line.strip())
                        if "db\\migration" in rel_path or "db/migration" in rel_path:
                            findings["flyway_migrations"].append(entry)
                        elif "package com.synthora" in line or "import com.synthora" in line or "groupId>com.synthora" in line or "SynthoraApplication" in line:
                            findings["java_package_namespace"].append(entry)
                        elif "synthora_token" in line:
                            findings["legacy_auth_fallback"].append(entry)
                        elif "synthora.mail" in line or "synthora.app" in line or "synthora.storage" in line or "synthora.rate-limit" in line or "synthora.documents" in line or "synthora.cors" in line or "@Value(\"${synthora." in line or "SYNTHORA_CORS" in line:
                            findings["spring_config_namespace"].append(entry)
                        elif "jdbc:postgresql:" in line or "synthora_admin" in line or "POSTGRES_DB" in line:
                            findings["database_name_and_local_urls"].append(entry)
                        elif rel_path.startswith("docs") or rel_path.startswith(".agents") or rel_path.startswith("scratch"):
                            findings["documentation_and_skills"].append(entry)
                        elif rel_path.startswith("frontend\\src") or rel_path.startswith("frontend/src"):
                            findings["user_facing_ui_text"].append(entry)
                        else:
                            findings["other"].append(entry)
        except Exception as e:
            pass

print("=== REBRANDING AUDIT INVENTORY SUMMARY ===")
for category, items in findings.items():
    print(f"[{category}]: {len(items)} references")

if len(findings["user_facing_ui_text"]) > 0:
    print("\n[ATTENTION] Remaining frontend occurrences:")
    for path, line_no, content in findings["user_facing_ui_text"]:
        print(f"  {path}:{line_no} -> {content}")
