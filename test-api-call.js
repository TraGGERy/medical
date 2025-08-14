const fetch = require('node-fetch');

// Test the AI consultation API endpoint directly
async function testConsultationAPI() {
  console.log('🧪 Testing AI consultation API endpoint...');
  
  const consultationId = '5f5f383b-2bbc-46a0-8d79-2f07b293b24e';
  const apiUrl = `http://localhost:3000/api/ai-consultations/${consultationId}`;
  
  console.log(`📞 Calling: ${apiUrl}`);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real app, this would include Clerk auth token
        'Authorization': 'Bearer fake-token-for-testing'
      }
    });
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log(`📊 Response body:`, responseText);
    
    if (response.ok) {
      console.log('✅ API call successful!');
    } else {
      console.log('❌ API call failed!');
    }
    
  } catch (error) {
    console.error('💥 Error calling API:', error.message);
  }
}

testConsultationAPI();