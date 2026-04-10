// Manual user sync script using direct SQL
// This script will insert the missing user record directly into the database

const { Client } = require('pg');
require('dotenv').config();

async function syncUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // The user ID from the error message
    const userId = 'user_30YE3G7Wimt7RPSbs5Dy0tN0fBX';
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ User already exists in database:', userId);
      return;
    }

    // Insert user record
    await client.query(`
      INSERT INTO users (id, email, first_name, last_name, image_url, subscription_plan, subscription_status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    `, [userId, 'user@example.com', null, null, null, 'free', 'active']);

    console.log('✅ User created successfully:', userId);

    // Insert medical history record
    await client.query(`
      INSERT INTO user_medical_history (id, user_id, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, NOW(), NOW())
    `, [userId]);

    console.log('✅ Medical history created for user:', userId);
    
  } catch (error) {
    console.error('❌ Error syncing user:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

syncUser();