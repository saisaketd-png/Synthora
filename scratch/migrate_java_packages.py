import os
import shutil
import re

backend_root = r"d:\Saisaket\Synthora\backend"
main_java = os.path.join(backend_root, "src", "main", "java")
test_java = os.path.join(backend_root, "src", "test", "java")

synthora_main = os.path.join(main_java, "com", "synthora")
kemkendra_main = os.path.join(main_java, "com", "kemkendra")

synthora_test = os.path.join(test_java, "com", "synthora")
kemkendra_test = os.path.join(test_java, "com", "kemkendra")

# 1. Ensure target directories exist
os.makedirs(kemkendra_main, exist_ok=True)
os.makedirs(kemkendra_test, exist_ok=True)

# 2. Move main java files
if os.path.exists(synthora_main):
    for item in os.listdir(synthora_main):
        src_item = os.path.join(synthora_main, item)
        dst_item = os.path.join(kemkendra_main, item)
        if item == "SynthoraApplication.java":
            dst_item = os.path.join(kemkendra_main, "KemKendraApplication.java")
        shutil.move(src_item, dst_item)
    shutil.rmtree(synthora_main, ignore_errors=True)

# 3. Move test java files
if os.path.exists(synthora_test):
    for item in os.listdir(synthora_test):
        src_item = os.path.join(synthora_test, item)
        dst_item = os.path.join(kemkendra_test, item)
        shutil.move(src_item, dst_item)
    shutil.rmtree(synthora_test, ignore_errors=True)

# 4. Perform content replacements across all Java files
for base_dir in [main_java, test_java]:
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith(".java"):
                file_path = os.path.join(root, f)
                with open(file_path, "r", encoding="utf-8") as handle:
                    content = handle.read()

                new_content = content
                # Package and imports
                new_content = re.sub(r"\bpackage com\.synthora\b", "package com.kemkendra", new_content)
                new_content = re.sub(r"\bimport com\.synthora\b", "import com.kemkendra", new_content)
                new_content = re.sub(r"\bcom\.synthora\b", "com.kemkendra", new_content)
                new_content = re.sub(r"\bSynthoraApplication\b", "KemKendraApplication", new_content)

                # Spring custom config prefix
                new_content = re.sub(r"@Value\(\"\$\{synthora\.", '@Value("${kemkendra.', new_content)
                new_content = re.sub(r"@ConfigurationProperties\(prefix = \"synthora", '@ConfigurationProperties(prefix = "kemkendra', new_content)
                new_content = re.sub(r"synthora\.mail", "kemkendra.mail", new_content)
                new_content = re.sub(r"synthora\.storage", "kemkendra.storage", new_content)
                new_content = re.sub(r"synthora\.documents", "kemkendra.documents", new_content)
                new_content = re.sub(r"synthora\.cors", "kemkendra.cors", new_content)
                new_content = re.sub(r"synthora\.app", "kemkendra.app", new_content)
                new_content = re.sub(r"synthora\.rate-limit", "kemkendra.rate-limit", new_content)

                # Test emails and secrets
                new_content = re.sub(r"@synthora\.com", "@kemkendra.com", new_content)
                new_content = re.sub(r"@synthora-test\.com", "@kemkendra-test.com", new_content)
                new_content = re.sub(r"marketplace\.synthora\.com", "marketplace.kemkendra.com", new_content)
                new_content = re.sub(r"app\.synthora\.com", "app.kemkendra.com", new_content)
                new_content = re.sub(r"SynthoraDevSecretKeyForJwtSigning2026!", "KemKendraDevSecretKeyForJwtSigning2026!", new_content)

                # Brand in class/method names or comments where appropriate
                new_content = re.sub(r"\bSynthora\b", "KemKendra", new_content)
                new_content = re.sub(r"\bSYNTHORA\b", "KEMKENDRA", new_content)

                if new_content != content:
                    with open(file_path, "w", encoding="utf-8") as handle:
                        handle.write(new_content)

print("Java package and directory migration complete.")
