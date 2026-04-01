// Check users in database
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
    const result = await pool.query('SELECT id, email, name, password, role FROM users');
    console.log('\n📋 Users in database:');
    console.log('='.repeat(80));
    result.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Password: [REDACTED - ${user.password?.length || 0} chars]`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id}`);
    });
    console.log('\n' + '='.repeat(80));
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkUsers();


