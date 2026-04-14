import os
import re

directories = ['pages', 'components']

replacements = [
    (r'\bml-(\d+|auto|px)\b', r'ms-\1'),
    (r'\bmr-(\d+|auto|px)\b', r'me-\1'),
    (r'\bpl-(\d+|auto|px)\b', r'ps-\1'),
    (r'\bpr-(\d+|auto|px)\b', r'pe-\1'),
    (r'\btext-left\b', r'text-start'),
    (r'\btext-right\b', r'text-end'),
    (r'\bleft-(\d+|auto|px|1/2|full)\b', r'start-\1'),
    (r'\bright-(\d+|auto|px|1/2|full)\b', r'end-\1'),
    (r'\bborder-l\b', r'border-s'),
    (r'\bborder-r\b', r'border-e'),
    (r'\bborder-l-(\d+)\b', r'border-s-\1'),
    (r'\bborder-r-(\d+)\b', r'border-e-\1'),
]

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.scss'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original = content
                for pattern, repl in replacements:
                    content = re.sub(pattern, repl, content)
                
                if original != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated {filepath}")
print("Finished replacing directional tailwind classes.")
