import os
import shutil
import re

agents_skills = r"d:\Saisaket\Synthora\.agents\skills"
old_skill = os.path.join(agents_skills, "synthora-development")
new_skill = os.path.join(agents_skills, "kemkendra-development")

if os.path.exists(old_skill):
    if os.path.exists(new_skill):
        shutil.rmtree(new_skill)
    shutil.move(old_skill, new_skill)
    print("Renamed synthora-development -> kemkendra-development")

skill_md = os.path.join(new_skill, "SKILL.md")
if os.path.exists(skill_md):
    with open(skill_md, "r", encoding="utf-8") as handle:
        content = handle.read()

    new_content = re.sub(r"synthora-development", "kemkendra-development", content)
    new_content = re.sub(r"com\.synthora", "com.kemkendra", new_content)
    new_content = re.sub(r"Synthora", "KemKendra", new_content)
    new_content = re.sub(r"synthora", "kemkendra", new_content)

    with open(skill_md, "w", encoding="utf-8") as handle:
        handle.write(new_content)
    print("Updated SKILL.md for kemkendra-development")
