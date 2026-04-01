from app.config import settings
s = settings.database_url
print(f"URL length: {len(s)}")
for i, c in enumerate(s):
    print(f"{i:3d}: {ord(c):3d} {repr(c)}")
