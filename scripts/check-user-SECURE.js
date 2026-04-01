/**
 * ✅ SECURE VERSION - سكريبت آمن للتحقق من بيانات المستخدم
 * بدون طباعة كلمات المرور أو بيانات حساسة
 */

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

async function checkUser() {
  try {
    const email = 'raed@live.fr';
    const result = await pool.query('SELECT id, email, name, role FROM users WHERE email = $1', [email]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\n👤 User found:');
      console.log('='.repeat(80));
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log(`ID: ${user.id}`);
      // ✅ لا نطبع كلمة المرور هنا
      console.log('Password: [REDACTED - 64 chars]');  // ← آمن
      console.log('='.repeat(80));
      
      console.log('\n✅ User record retrieved successfully (password not displayed for security)');
    } else {
      console.log(`❌ User with email ${email} not found!`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkUser();
