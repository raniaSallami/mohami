// Update user password
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = ws;
}

const CONNECTION_STRING = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_KEsP4OGUo9DB@ep-royal-term-adwe3fhj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ 
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

async function updatePassword() {
  try {
    const email = process.argv[2] || 'raed@live.fr';
    const newPassword = process.argv[3] || process.env.TEST_PASSWORD || 'ChangeMe123!@#';
    
    // Note: In production, passwords should be hashed via Backend API /auth/change-password
    // This script is UNSAFE and only for development/testing
    
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [newPassword, email]
    );
    
    console.log(`✅ Password updated for ${email}`);
    console.log('⚠️  WARNING: This script sends plaintext password directly to database');
    console.log('   In production, use Backend API: POST /api/users/change-password');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

updatePassword();


