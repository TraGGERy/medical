const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function checkAIProviders() {
  try {
    console.log('🔍 Checking AI providers in database...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in environment variables');
      return;
    }

    const sql = neon(process.env.DATABASE_URL);

    // First, check the table schema
    console.log('\n🔍 Checking ai_providers table schema...');
    const schema = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'ai_providers' 
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Table Schema:');
    schema.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if ai_providers table exists and get all providers
    const providers = await sql`SELECT * FROM ai_providers ORDER BY created_at DESC`;
    
    console.log(`\n📊 Found ${providers.length} AI providers in database:`);
    
    if (providers.length === 0) {
      console.log('❌ No AI providers found! This is likely the cause of the error.');
      console.log('💡 Need to seed the database with AI providers.');
    } else {
      console.log('\n✅ AI Providers found:');
      providers.forEach((provider, index) => {
        console.log(`${index + 1}. ID: ${provider.id}`);
        console.log(`   Name: ${provider.name}`);
        console.log(`   Specialty: ${provider.specialty}`);
        console.log(`   Active: ${provider.is_active}`);
        console.log(`   Available: ${provider.is_available}`);
        console.log(`   Total Consultations: ${provider.total_consultations}`);
        console.log('   All fields:', JSON.stringify(provider, null, 2));
        console.log('   ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking AI providers:', error.message);
    console.error('Full error:', error);
  }
}

checkAIProviders();