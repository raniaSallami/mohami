#!/usr/bin/env python3
"""
Migration script to add Faculty table and link it to UserProfile
Adds faculties table with all Tunisian legal institutions
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
    """Execute migration to add faculties and update user_profiles"""
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Create faculties table
        print("Creating faculties table...")
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS faculties (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                type VARCHAR(50) NOT NULL,
                domain VARCHAR(100) NOT NULL,
                specialities TEXT[] NOT NULL DEFAULT '{}',
                university VARCHAR(255),
                city VARCHAR(100) NOT NULL,
                country VARCHAR(100) NOT NULL DEFAULT 'Tunisie',
                public BOOLEAN NOT NULL DEFAULT TRUE,
                level TEXT[] NOT NULL DEFAULT '{}',
                description TEXT,
                website_url VARCHAR(500),
                phone VARCHAR(50),
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ''')
        print("✓ Faculties table created")
        
        # Create indexes on faculties
        print("Creating indexes on faculties table...")
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_faculties_name ON faculties(name)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_faculties_slug ON faculties(slug)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_faculties_type ON faculties(type)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_faculties_city ON faculties(city)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_faculties_university ON faculties(university)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_faculties_public ON faculties(public)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_faculties_domain ON faculties(domain)')
        print("✓ Indexes created")
        
        # Add faculty_id column to user_profiles if it doesn't exist
        print("Adding faculty_id column to user_profiles...")
        await conn.execute('''
            ALTER TABLE user_profiles
            ADD COLUMN IF NOT EXISTS faculty_id INTEGER REFERENCES faculties(id) ON DELETE SET NULL
        ''')
        print("✓ Faculty_id column added to user_profiles")
        
        # Create index on faculty_id
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_user_profiles_faculty_id ON user_profiles(faculty_id)')
        print("✓ Index created on faculty_id")
        
        # Insert faculties data (8 public + 4 private)
        print("\nInserting Tunisian faculties data...")
        faculties_data = [
            # PUBLIC INSTITUTIONS
            (1, 'كلية الحقوق والعلوم السياسية بتونس', 'fdsp-tunis', 'faculte', 'droit', 
             ['دroit public', 'droit privé'], 'جامعة تونس', 'تونس', 'Tunisie', True, 
             ['licence', 'master', 'doctorat'], None, None, None, None),
             
            (2, 'كلية العلوم القانونية والسياسية والاجتماعية بتونس', 'fscjps-tunis', 'faculte', 'droit',
             ['droit public', 'droit privé'], 'جامعة قرطاج', 'تونس', 'Tunisie', True,
             ['licence', 'master', 'doctorat'], None, None, None, None),
             
            (3, 'كلية الحقوق والعلوم السياسية بسوسة', 'fdsp-sousse', 'faculte', 'droit',
             ['droit public', 'droit privé'], 'جامعة سوسة', 'سوسة', 'Tunisie', True,
             ['licence', 'master', 'doctorat'], None, None, None, None),
             
            (4, 'كلية العلوم القانونية والاقتصادية والتصرف بجندوبة', 'fsjegd-jendouba', 'faculte', 'droit',
             ['droit public', 'droit privé', 'gestion'], 'جامعة جندوبة', 'جندوبة', 'Tunisie', True,
             ['licence', 'master'], None, None, None, None),
             
            (5, 'المعهد الأعلى للقضاء', 'ism-tunisia', 'institut', 'droit',
             ['magistrature'], None, 'تونس', 'Tunisie', True,
             ['formation professionnelle'], None, None, None, None),
             
            (6, 'المعهد الأعلى للمحاماة', 'isa-tunisia', 'institut', 'droit',
             ['avocat'], None, 'تونس', 'Tunisie', True,
             ['formation professionnelle'], None, None, None, None),
             
            (7, 'المعهد العالي للعلوم القانونية والسياسية بتونس', 'isjps-tunis', 'institut', 'droit',
             ['droit public'], 'جامعة تونس', 'تونس', 'Tunisie', True,
             ['licence'], None, None, None, None),
             
            (8, 'المدرسة الوطنية للإدارة', 'ena-tunisie', 'ecole', 'droit',
             ['administration publique', 'droit administratif'], None, 'تونس', 'Tunisie', True,
             ['formation supérieure'], None, None, None, None),
             
            # PRIVATE INSTITUTIONS
            (9, 'الكلية الخاصة للعلوم القانونية والاقتصادية والتصرف', 'fac-privee-droit-gestion', 'faculte', 'droit',
             ['droit privé', 'droit des affaires'], None, 'تونس', 'Tunisie', False,
             ['licence', 'master'], None, None, None, None),
             
            (10, 'جامعة ابن خلدون الخاصة – كلية العلوم القانونية', 'ibn-khaldoun-law-school', 'faculte', 'droit',
             ['droit privé', 'droit des affaires'], None, 'تونس', 'Tunisie', False,
             ['licence', 'master'], None, None, None, None),
             
            (11, 'المعهد العالي الخاص للعلوم القانونية', 'private-law-institute', 'institut', 'droit',
             ['droit privé'], None, 'تونس', 'Tunisie', False,
             ['licence'], None, None, None, None),
             
            (12, 'المدرسة العليا الخاصة للقانون والأعمال', 'law-business-school', 'ecole', 'droit',
             ['droit des affaires'], None, 'تونس', 'Tunisie', False,
             ['licence', 'master'], None, None, None, None),
        ]
        
        for fac in faculties_data:
            await conn.execute('''
                INSERT INTO faculties 
                (id, name, slug, type, domain, specialities, university, city, country, public, level, description, website_url, phone, email, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    slug = EXCLUDED.slug,
                    type = EXCLUDED.type,
                    domain = EXCLUDED.domain,
                    specialities = EXCLUDED.specialities,
                    university = EXCLUDED.university,
                    city = EXCLUDED.city,
                    country = EXCLUDED.country,
                    public = EXCLUDED.public,
                    level = EXCLUDED.level,
                    updated_at = NOW()
            ''', *fac)
        
        print("✓ Inserted/updated all 12 faculties")
        
        # Verify the data
        count = await conn.fetchval('SELECT COUNT(*) FROM faculties')
        public_count = await conn.fetchval("SELECT COUNT(*) FROM faculties WHERE public = true")
        private_count = await conn.fetchval("SELECT COUNT(*) FROM faculties WHERE public = false")
        print(f"\n✓ Total faculties: {count}")
        print(f"  - Public: {public_count}")
        print(f"  - Private: {private_count}")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(migrate())
