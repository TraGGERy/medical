const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testAIConsultation() {
  try {
    console.log('🧪 Testing AI consultation creation...');
    
    // First, get AI providers
    console.log('📋 Fetching AI providers...');
    const providersResponse = await fetch('http://localhost:3000/api/ai-providers?isActive=true&isAvailable=true');
    
    if (!providersResponse.ok) {
      console.error('❌ Failed to fetch AI providers:', providersResponse.status);
      return;
    }
    
    const providersData = await providersResponse.json();
    console.log('✅ AI Providers fetched:', providersData.providers?.length || 0);
    
    // Find an AI provider
    const aiProvider = providersData.providers?.[0];
    
    if (!aiProvider) {
      console.error('❌ No AI provider found');
      console.log('Available providers:', providersData.providers?.map(p => ({ name: p.name, type: p.type })));
      return;
    }
    
    console.log('🤖 Found AI provider:', aiProvider.name);
    
    // Test AI consultation creation
    console.log('🚀 Creating AI consultation...');
    const consultationResponse = await fetch('http://localhost:3000/api/ai-consultations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real app, this would include authentication headers
      },
      body: JSON.stringify({
        aiProviderId: aiProvider.id,
        reasonForVisit: 'Test consultation for debugging',
        symptoms: ['headache'],
        urgencyLevel: 1
      })
    });
    
    console.log('📊 Response status:', consultationResponse.status);
    
    if (!consultationResponse.ok) {
      const errorData = await consultationResponse.text();
      console.error('❌ Failed to create consultation:', errorData);
      return;
    }
    
    const consultationData = await consultationResponse.json();
    console.log('✅ Consultation created successfully!');
    console.log('📝 Consultation ID:', consultationData.consultation?.id);
    console.log('👨‍⚕️ Provider:', consultationData.provider?.name);
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testAIConsultation();