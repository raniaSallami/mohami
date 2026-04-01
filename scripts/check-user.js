// Check specific user in database
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
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\n👤 User found:');
      console.log('='.repeat(80));
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Password: [REDACTED - ${user.password?.length || 0} chars]`);
      console.log(`Role: ${user.role}`);
      console.log(`ID: ${user.id}`);
      console.log('='.repeat(80));
      
      // Test login query
      console.log('\n🔐 Testing login query...');
      const loginResult = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND password = $2',
        [email, 'passpass90']
      );
      console.log(`Login query result: ${loginResult.rows.length} rows found`);
      
      if (loginResult.rows.length === 0) {
        console.log('\n❌ Authentication test: test password did not match');
      } else {
        console.log('✅ Authentication test passed!');
      }
    } else {
      console.log(`\n❌ User with email ${email} not found!`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkUser();


