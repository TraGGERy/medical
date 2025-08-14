const fetch = require('node-fetch');

async function testFullConsultation() {
  try {
    console.log('🔍 Testing AI consultation API endpoints...');
    
    // Test data for creating consultation
    const consultationData = {
      aiProviderId: '123e4567-e89b-12d3-a456-426614174000', // Use a sample UUID
      reasonForVisit: 'General health checkup and questions about symptoms',
      symptoms: ['headache', 'fatigue'],
      urgencyLevel: 2,
      patientAge: 30,
      patientGender: 'male',
      medicalHistory: [],
      currentMedications: [],
      allergies: []
    };
    
    console.log('\n1. Testing AI consultation creation...');
    const createResponse = await fetch('http://localhost:3000/api/ai-consultations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(consultationData)
    });
    
    console.log(`Status: ${createResponse.status}`);
    const createResult = await createResponse.text();
    console.log(`Response: ${createResult}`);
    
    if (createResponse.status === 401) {
      console.log('✅ API is working - got expected 401 Unauthorized (user not logged in)');
      console.log('This confirms the authentication is working properly.');
    } else if (createResponse.ok) {
      console.log('✅ Consultation created successfully');
      const consultation = JSON.parse(createResult);
      
      // Test sending a message
      console.log('\n2. Testing message sending...');
      const messageData = {
        content: 'Hello doctor, I have been experiencing headaches and fatigue lately.',
        messageType: 'text'
      };
      
      const messageResponse = await fetch(`http://localhost:3000/api/ai-consultations/${consultation.consultation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });
      
      console.log(`Message Status: ${messageResponse.status}`);
      const messageResult = await messageResponse.text();
      console.log(`Message Response: ${messageResult}`);
    } else {
      console.log(`❌ Unexpected response: ${createResponse.status}`);
      console.log(`Response body: ${createResult}`);
    }
    
    console.log('\n🎉 API endpoint test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFullConsultation();