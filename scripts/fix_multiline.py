import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = re.compile(r'window\.__t\("((?:[^"\\]|\\.)*)"\)')
    def replacer(match):
        inner = match.group(1)
        if '\n' in inner:
            inner_escaped = inner.replace('`', '\\`')
            return f'window.__t(`{inner_escaped}`)'
        return match.group(0)

    new_content = pattern.sub(replacer, content)
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

for d in ['components', 'pages', '.']:
    for root, dirs, files in os.walk(d):
        for f in files:
            if f.endswith('.tsx'):
                fix_file(os.path.join(root, f))
print('Done.')
