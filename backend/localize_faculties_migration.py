#!/usr/bin/env python3
"""
Migration script to localize faculties table with name_ar and name_fr.
Fixed for Windows encoding.
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")

async def migrate():
    # Force IPv4 for local resolution to avoid gaierror on Windows
    import socket
    orig_getaddrinfo = socket.getaddrinfo
    def ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
        return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
    socket.getaddrinfo = ipv4_getaddrinfo

    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("Adding name_ar and name_fr columns to faculties table...")
        
        # Check if name column exists to migrate data
        cols = await conn.fetch("SELECT column_name FROM information_schema.columns WHERE table_name = 'faculties'")
        col_names = [c['column_name'] for c in cols]
        
        if 'name' in col_names and 'name_ar' not in col_names:
            await conn.execute("ALTER TABLE faculties ADD COLUMN name_ar VARCHAR(255)")
            await conn.execute("UPDATE faculties SET name_ar = name")
            print("Migrated 'name' to 'name_ar'")
        elif 'name_ar' not in col_names:
             await conn.execute("ALTER TABLE faculties ADD COLUMN name_ar VARCHAR(255)")
             print("Added 'name_ar'")

        if 'name_fr' not in col_names:
            await conn.execute("ALTER TABLE faculties ADD COLUMN name_fr VARCHAR(255)")
            print("Added 'name_fr'")
        
        # Update indexes
        await conn.execute("DROP INDEX IF EXISTS idx_faculties_name")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_faculties_name_ar ON faculties(name_ar)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_faculties_name_fr ON faculties(name_fr)")
        print("Updated indexes")

        # Update descriptions/names with provided data
        faculties_data = [
            (1, 'كلية الحقوق والعلوم السياسية بتونس', 'Faculté de Droit et des Sciences Politiques de Tunis'),
            (2, 'قسم القانونية والسياسية والاجتماعية بتونس', 'Faculté des Sciences Juridiques, Politiques et Sociales de Tunis'),
            (3, 'كلية الحقوق والعلوم السياسية بسوسة', 'Faculté de Droit et des Sciences Politiques de Sousse'),
            (4, 'كلية القانونية والاقتصادية والتصرف بجندوبة', 'Faculté des Sciences Juridiques, Économiques et de Gestion de Jendouba'),
            (5, 'المعهد الأعلى للقضاء', 'Institut Supérieur de la Magistrature'),
            (6, 'المعهد الأعلى للمحاماة', 'Institut Supérieur de la Profession d’Avocat'),
            (7, 'المعهد العالي للعلوم القانونية والسياسية بتونس', 'Institut Supérieur des Sciences Juridiques et Politiques de Tunis'),
            (8, 'المدرسة الوطنية للإدارة', 'École Nationale d’Administration'),
            (9, 'كلية العلوم القانونية والاقتصادية والتصرف (خاصة)', 'Faculté Privée des Sciences Juridiques, Économiques et de Gestion'),
            (10, 'جامعة ابن خلدون الخاصة – كلية العلوم القانونية', 'Université Privée Ibn Khaldoun – Faculté de Droit'),
            (11, 'المعهد العالي الخاص للعلوم القانونية', 'Institut Supérieur Privé des Sciences Juridiques'),
            (12, 'المدرسة العليا الخاصة للقانون والأعمال', 'École Supérieure Privée de Droit et des Affaires'),
        ]

        print("Updating faculty records with bilingual names...")
        for fid, name_ar, name_fr in faculties_data:
            await conn.execute('''
                UPDATE faculties 
                SET name_ar = $1, name_fr = $2, updated_at = NOW()
                WHERE id = $3
            ''', name_ar, name_fr, fid)
        
        # Remove old name column if everything is okay
        if 'name' in col_names:
            await conn.execute("ALTER TABLE faculties DROP COLUMN name")
            print("Dropped old 'name' column")

        print("SUCCESS: Migration completed successfully!")
        
    except Exception as e:
        print(f"FAILED: Migration failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
