import os
import re

frontend_src = r"d:\Saisaket\Synthora\frontend\src"

# Define replacement mappings for text and metadata
replacements = [
    # Metadata and URL defaults
    (r"https://synthora\.com", r"https://kemkendra.com"),
    (r"suppliers@synthora\.com", r"suppliers@kemkendra.com"),
    (r"contact@synthora\.com", r"contact@kemkendra.com"),
    (r"support@synthora\.com", r"support@kemkendra.com"),
    (r"security@synthora\.com", r"security@kemkendra.com"),
    (r"notifications@synthora\.com", r"notifications@kemkendra.com"),

    # Visible user-facing strings
    (r"\bSynthora B2B Marketplace Platform\b", r"KemKendra B2B Marketplace Platform"),
    (r"\bSynthora B2B Marketplace\b", r"KemKendra B2B Marketplace"),
    (r"\bSynthora B2B chemical marketplace\b", r"KemKendra B2B chemical marketplace"),
    (r"\bSynthora Master Catalog System\b", r"KemKendra Master Catalog System"),
    (r"\bSynthora Master Catalog\b", r"KemKendra Master Catalog"),
    (r"\bSynthora Verification Team\b", r"KemKendra Verification Team"),
    (r"\bSynthora Admin\b", r"KemKendra Admin"),
    (r"\bSynthora marketplace\b", r"KemKendra marketplace"),
    (r"\bSynthora Enterprise B2B Marketplace Inc\.\b", r"KemKendra Enterprise B2B Marketplace Inc."),
    (r"\bSynthora account\b", r"KemKendra account"),
    (r"\bSynthora workspace\b", r"KemKendra workspace"),
    (r"\bSynthora platform\b", r"KemKendra platform"),
    (r"\bSynthora\b", r"KemKendra"),
    (r"\bSYNTHORA\b", r"KEMKENDRA"),
]

modified_files = []

for root, dirs, files in os.walk(frontend_src):
    for f in files:
        if f.endswith((".ts", ".tsx", ".js", ".jsx", ".css", ".html")):
            file_path = os.path.join(root, f)
            with open(file_path, "r", encoding="utf-8") as file_in:
                content = file_in.read()

            new_content = content
            # Skip modifying the legacy token constant definition
            for pattern, repl in replacements:
                # Avoid touching LEGACY_TOKEN_KEY
                new_content = re.sub(pattern, repl, new_content)

            # Preserve SynthoraUI / SynthoraLogo internal import paths if necessary
            # or keep aliases
            if new_content != content:
                with open(file_path, "w", encoding="utf-8") as file_out:
                    file_out.write(new_content)
                modified_files.append(file_path)

print(f"Updated {len(modified_files)} frontend files.")
