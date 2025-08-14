const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testConsultation() {
  try {
    console.log('🔍 Testing consultation lookup...');
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found');
      return;
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Check if AI providers exist
    console.log('\n📋 Checking AI providers...');
    const providers = await sql`SELECT id, name FROM ai_providers LIMIT 5`;
    console.log('AI Providers found:', providers.length);
    providers.forEach(p => console.log(`  - ${p.name} (${p.id})`));
    
    // Check consultations
    console.log('\n🔍 Checking AI consultations...');
    const consultations = await sql`
      SELECT 
        c.id, 
        c.patient_id, 
        c.ai_provider_id, 
        c.status,
        p.name as provider_name
      FROM ai_consultations c
      LEFT JOIN ai_providers p ON c.ai_provider_id = p.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `;
    
    console.log('Consultations found:', consultations.length);
    consultations.forEach(c => {
      console.log(`  - ${c.id} | Patient: ${c.patient_id} | Provider: ${c.provider_name || 'NULL'} | Status: ${c.status}`);
    });
    
    // Test specific consultation ID from logs
    const testId = '5f5f383b-2bbc-46a0-8d79-2f07b293b24e';
    console.log(`\n🎯 Testing specific consultation: ${testId}`);
    
    const specificConsultation = await sql`
      SELECT 
        c.*,
        p.name as provider_name,
        p.specialty as provider_specialty
      FROM ai_consultations c
      LEFT JOIN ai_providers p ON c.ai_provider_id = p.id
      WHERE c.id = ${testId}
    `;
    
    if (specificConsultation.length > 0) {
      console.log('✅ Consultation found:', {
        id: specificConsultation[0].id,
        patientId: specificConsultation[0].patient_id,
        providerName: specificConsultation[0].provider_name,
        status: specificConsultation[0].status
      });
    } else {
      console.log('❌ Consultation not found');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testConsultation();