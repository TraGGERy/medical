const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testAPIRequest() {
  try {
    const testData = {
      aiProviderId: 'dcbc5280-f541-441f-8c1d-28e5586eba90', // Dr. Sarah Chen
      reasonForVisit: 'Test consultation for debugging',
      symptoms: ['headache', 'fatigue'],
      urgencyLevel: 1,
      patientAge: 30,
      patientGender: 'male'
    };
    
    console.log('Making request to POST /api/ai-consultations...');
    console.log('Request data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/ai-consultations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This test won't work without proper authentication
        // but it will help us see the exact error
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log('\nResponse status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response body:', responseText);
    
    if (!response.ok) {
      console.log('\n❌ Request failed with status:', response.status);
    } else {
      console.log('\n✅ Request successful!');
    }
    
  } catch (error) {
    console.error('❌ Error making request:', error.message);
  }
}

testAPIRequest();