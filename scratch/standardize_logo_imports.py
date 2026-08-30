import os
import re

frontend_src = r"d:\Saisaket\Synthora\frontend\src"

for root, dirs, files in os.walk(frontend_src):
    for f in files:
        if f.endswith((".ts", ".tsx")):
            file_path = os.path.join(root, f)
            with open(file_path, "r", encoding="utf-8") as handle:
                content = handle.read()

            new_content = re.sub(r"@/shared/components/KemKendraLogo", "@/shared/components/KemkendraLogo", content)
            if new_content != content:
                with open(file_path, "w", encoding="utf-8") as handle:
                    handle.write(new_content)

print("Standardized logo imports to @/shared/components/KemkendraLogo")
