#!/usr/bin/env node
/**
 * ✅ SECURE VERSION - طباعة آمنة لجميع المستخدمين
 * بدون الكشف عن كلمات المرور
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

async function checkUsers() {
  try {
    // ✅ لا تطلب كلمة المرور من الـ SELECT
    const result = await pool.query(
      'SELECT id, email, name, role, subscription_plan, created_at FROM users'
    );
    
    console.log('\n📋 Users in database (SECURE VIEW):');
    console.log('='.repeat(100));
    
    result.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. User`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Plan: ${user.subscription_plan}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.created_at}`);
      // ✅ Password not displayed - masked for security
      console.log(`   Password: [REDACTED]`);
    });
    
    console.log('\n' + '='.repeat(100));
    console.log(`✅ Total users: ${result.rows.length}`);
    console.log('⚠️  Password hashes are never displayed for security reasons\n');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkUsers();
