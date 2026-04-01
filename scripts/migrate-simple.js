// Simple Database Migration Script
// This script can be run directly with Node.js
// Run with: node scripts/migrate-simple.js

import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Node.js environment
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = ws;
}

const CONNECTION_STRING = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_KEsP4OGUo9DB@ep-royal-term-adwe3fhj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ 
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('🚀 Starting database migration...\n');
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Neon Tech database successfully\n');
    
    // Users Table
    console.log('Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        subscription_plan TEXT DEFAULT 'basic',
        subscription_status TEXT DEFAULT 'active',
        avatar TEXT
      );
    `);
    console.log('  ✅ users table ready');

    // Cases Table
    console.log('Creating cases table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        client_name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        date_created TEXT NOT NULL,
        documents JSONB DEFAULT '[]',
        analysis TEXT,
        user_id TEXT,
        chat_history JSONB DEFAULT '[]'
      );
    `);
    console.log('  ✅ cases table ready');

    // Contracts Table
    console.log('Creating contracts table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        parties TEXT NOT NULL,
        content TEXT NOT NULL,
        date_created TEXT NOT NULL,
        user_id TEXT
      );
    `);
    console.log('  ✅ contracts table ready');

    // Calendar Events Table
    console.log('Creating events table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        user_id TEXT,
        case_id TEXT
      );
    `);
    console.log('  ✅ events table ready');

    // Invoices Table
    console.log('Creating invoices table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        status TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        user_id TEXT,
        receipt_data TEXT
      );
    `);
    console.log('  ✅ invoices table ready');

    // Notifications Table
    console.log('Creating notifications table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TEXT NOT NULL,
        link TEXT,
        metadata JSONB DEFAULT '{}'
      );
    `);
    console.log('  ✅ notifications table ready');

    // Create indexes for notifications
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read)');
      console.log('  ✅ notifications indexes created');
    } catch (e) {
      console.log('  ⚠️  Indexes might already exist');
    }

    // System Settings Table
    console.log('Creating system_settings table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    console.log('  ✅ system_settings table ready');

    // Initialize default settings
    console.log('Initializing default settings...');
    const pricingCheck = await pool.query("SELECT * FROM system_settings WHERE key = 'pricing'");
    if (pricingCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, $3)`,
        ['pricing', JSON.stringify({ pro: 59, enterprise: 199 }), new Date().toISOString()]
      );
      console.log('  ✅ Default pricing created');
    }

    const limitsCheck = await pool.query("SELECT * FROM system_settings WHERE key = 'plan_limits'");
    if (limitsCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, $3)`,
        ['plan_limits', JSON.stringify({ basic: { cases: 5, contracts: 2 }, pro: { cases: 50, contracts: 100 }, enterprise: { cases: 9999, contracts: 9999 } }), new Date().toISOString()]
      );
      console.log('  ✅ Default plan limits created');
    }

    // Verify all tables exist
    console.log('\n📊 Verifying tables...');
    const tables = ['users', 'cases', 'contracts', 'events', 'invoices', 'notifications', 'system_settings'];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);
        
        if (result.rows[0].exists) {
          const count = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`  ✅ ${table}: exists (${count.rows[0].count} rows)`);
        } else {
          console.log(`  ❌ ${table}: missing`);
        }
      } catch (e) {
        console.log(`  ⚠️  ${table}: Error - ${e.message}`);
      }
    }

    // Create default admin if not exists
    console.log('\n👤 Checking for default admin...');
    const adminCheck = await pool.query("SELECT * FROM users WHERE email = 'admin@admin.com'");
    if (adminCheck.rows.length === 0) {
      // Get admin password from env or use secured default
      const adminPassword = process.env.ADMIN_PASSWORD || 'AdminDefault123!@#';
      
      // Note: This script stores plaintext password directly
      // In production, use Backend API with bcrypt hashing
      console.log('⚠️  WARNING: Admin password stored as plaintext (for development only)');
      
      await pool.query(`
        INSERT INTO users (id, email, name, password, role, subscription_plan, subscription_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['admin-1', 'admin@admin.com', 'Admin System', adminPassword, 'ADMIN', 'enterprise', 'active']);
      console.log(`  ✅ Default admin created (email: admin@admin.com)`);
      console.log('  📝 Password: Check ADMIN_PASSWORD env variable');
    } else {
      console.log('  ✅ Default admin already exists');
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (e) {
      // Ignore errors when closing pool
    }
  }
}

migrate();

