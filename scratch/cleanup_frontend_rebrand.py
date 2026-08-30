import os
import re

frontend_src = r"d:\Saisaket\Synthora\frontend\src"
shared_dir = os.path.join(frontend_src, "shared", "components")
ui_dir = os.path.join(shared_dir, "ui")

synthora_ui_path = os.path.join(ui_dir, "SynthoraUI.tsx")
kemkendra_ui_path = os.path.join(ui_dir, "KemkendraUI.tsx")

synthora_logo_path = os.path.join(shared_dir, "SynthoraLogo.tsx")
kemkendra_logo_path = os.path.join(shared_dir, "KemKendraLogo.tsx")

# 1. Update KemkendraUI.tsx with the full implementation from SynthoraUI.tsx
if os.path.exists(synthora_ui_path):
    with open(synthora_ui_path, "r", encoding="utf-8") as handle:
        ui_content = handle.read()
    with open(kemkendra_ui_path, "w", encoding="utf-8") as handle:
        handle.write(ui_content)
    os.remove(synthora_ui_path)
    print("Migrated SynthoraUI.tsx -> KemkendraUI.tsx and deleted SynthoraUI.tsx")

# 2. Update KemKendraLogo.tsx with the full implementation
if os.path.exists(synthora_logo_path):
    with open(synthora_logo_path, "r", encoding="utf-8") as handle:
        logo_content = handle.read()

    # Make KemKendraLogo canonical
    canonical_logo = logo_content
    canonical_logo = re.sub(r"\bSynthoraLogoProps\b", "KemKendraLogoProps", canonical_logo)
    canonical_logo = re.sub(r"\bSynthoraLogoMark\b", "KemKendraLogoMark", canonical_logo)
    canonical_logo = re.sub(r"\bSynthoraLogo\b", "KemKendraLogo", canonical_logo)
    canonical_logo = re.sub(r"export interface KemkendraLogoProps extends [^\n]+\n", "", canonical_logo)
    canonical_logo = re.sub(r"export type KemKendraLogoProps = \{", "export interface KemKendraLogoProps {", canonical_logo)
    canonical_logo = re.sub(r"export const KemkendraLogoMark = [^\n]+\n", "", canonical_logo)
    canonical_logo = re.sub(r"export const KemkendraLogo = [^\n]+\n", "", canonical_logo)

    with open(kemkendra_logo_path, "w", encoding="utf-8") as handle:
        handle.write(canonical_logo)
    os.remove(synthora_logo_path)
    print("Migrated SynthoraLogo.tsx -> KemKendraLogo.tsx and deleted SynthoraLogo.tsx")

# 3. Update KemkendraLogo.tsx re-export
with open(os.path.join(shared_dir, "KemkendraLogo.tsx"), "w", encoding="utf-8") as handle:
    handle.write('export * from "./KemKendraLogo";\n')

# 4. Clean globals.css to remove --color-synthora-*
globals_css_path = os.path.join(frontend_src, "app", "globals.css")
if os.path.exists(globals_css_path):
    with open(globals_css_path, "r", encoding="utf-8") as handle:
        css_content = handle.read()
    # Remove lines containing --color-synthora-
    lines = [line for line in css_content.splitlines() if "--color-synthora-" not in line]
    with open(globals_css_path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")
    print("Cleaned globals.css to remove --color-synthora-*")

# 5. Clean auth.ts to remove LEGACY_TOKEN_KEY and fallback logic
auth_ts_path = os.path.join(frontend_src, "features", "auth", "api", "auth.ts")
if os.path.exists(auth_ts_path):
    with open(auth_ts_path, "r", encoding="utf-8") as handle:
        auth_content = handle.read()

    clean_auth_token_block = """const TOKEN_KEY = "kemkendra_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}"""
    auth_content = re.sub(
        r'const TOKEN_KEY = "kemkendra_token";[\s\S]*?export function removeAuthToken\(\): void \{[\s\S]*?\}',
        clean_auth_token_block,
        auth_content
    )
    with open(auth_ts_path, "w", encoding="utf-8") as handle:
        handle.write(auth_content)
    print("Cleaned auth.ts to remove legacy token fallback")

# 6. Global replacement in frontend/src
for root, dirs, files in os.walk(frontend_src):
    for f in files:
        if f.endswith((".ts", ".tsx", ".css")):
            file_path = os.path.join(root, f)
            with open(file_path, "r", encoding="utf-8") as handle:
                content = handle.read()

            new_content = content
            new_content = re.sub(r"@/shared/components/SynthoraLogo", "@/shared/components/KemKendraLogo", new_content)
            new_content = re.sub(r"\bSynthoraLogoMark\b", "KemKendraLogoMark", new_content)
            new_content = re.sub(r"\bSynthoraLogo\b", "KemKendraLogo", new_content)
            new_content = re.sub(r"@/shared/components/ui/SynthoraUI", "@/shared/components/ui/KemkendraUI", new_content)
            new_content = re.sub(r"--color-synthora-", "--color-kemkendra-", new_content)

            if new_content != content:
                with open(file_path, "w", encoding="utf-8") as handle:
                    handle.write(new_content)

print("Frontend rebranding cleanup complete.")
