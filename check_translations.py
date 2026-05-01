import re, json

with open('c:/Users/USER/mohami/pages/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

keys = set(re.findall(r'window\.__t\("([^"]+)"\)', content))

with open('c:/Users/USER/mohami/locales/fr.json', 'r', encoding='utf-8') as f:
    fr = json.load(f)

missing = []
for k in sorted(keys):
    if k not in fr:
        missing.append(k)

with open('c:/Users/USER/mohami/missing_keys.json', 'w', encoding='utf-8') as f:
    json.dump(missing, f, ensure_ascii=False, indent=2)

print(f'Total keys: {len(keys)}')
print(f'Missing: {len(missing)}')
print('Saved to missing_keys.json')
