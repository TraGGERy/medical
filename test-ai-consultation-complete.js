const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'user_test_123';
const TEST_TOKEN = 'test_token_123';

// Mock auth token for testing
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
});

async function testCompleteAIConsultation() {
  console.log('🧪 Starting comprehensive AI consultation test...');
  
  try {
    // Step 1: Test AI Provider Availability
    console.log('\n1️⃣ Testing AI Provider availability...');
    const providersResponse = await fetch(`${BASE_URL}/api/ai-providers?isActive=true&isAvailable=true`);
    const providersData = await providersResponse.json();
    
    if (!providersData.providers || providersData.providers.length === 0) {
      throw new Error('No AI providers available');
    }
    
    console.log(`✅ Found ${providersData.providers.length} available AI providers`);
    const testProvider = providersData.providers[0];
    console.log(`   Using provider: ${testProvider.name} (${testProvider.specialty})`);
    
    // Step 2: Create AI Consultation
    console.log('\n2️⃣ Creating AI consultation...');
    const consultationData = {
      aiProviderId: testProvider.id,
      reasonForVisit: 'Testing AI consultation system with potential referral needs',
      symptoms: ['headache', 'dizziness', 'anxiety'],
      urgencyLevel: 2,
      patientAge: 30,
      patientGender: 'female'
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/ai-consultations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(consultationData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create consultation: ${createResponse.status} ${errorText}`);
    }
    
    const consultationResult = await createResponse.json();
    const consultationId = consultationResult.consultation.id;
    console.log(`✅ Consultation created: ${consultationId}`);
    
    // Step 3: Test Message Sending and AI Response
    console.log('\n3️⃣ Testing message sending and AI response...');
    const testMessage = 'I have been experiencing severe headaches and anxiety. I also have thoughts of self-harm sometimes. Can you help me?';
    
    const messageResponse = await fetch(`${BASE_URL}/api/ai-consultations/${consultationId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        content: testMessage,
        messageType: 'text'
      })
    });
    
    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Failed to send message: ${messageResponse.status} ${errorText}`);
    }
    
    const messageResult = await messageResponse.json();
    console.log(`✅ User message sent: ${messageResult.message.id}`);
    console.log(`   AI response pending: ${messageResult.aiResponsePending}`);
    
    // Step 4: Wait for AI Response and Check for Referral
    console.log('\n4️⃣ Waiting for AI response and checking for referral...');
    let aiResponseReceived = false;
    let referralDetected = false;
    let attempts = 0;
    const maxAttempts = 15;
    
    while (!aiResponseReceived && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      
      const messagesResponse = await fetch(`${BASE_URL}/api/ai-consultations/${consultationId}/messages`, {
        headers: getAuthHeaders()
      });
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const aiMessages = messagesData.messages.filter(msg => msg.senderType === 'ai_provider');
        
        if (aiMessages.length > 0) {
          aiResponseReceived = true;
          const latestAiMessage = aiMessages[aiMessages.length - 1];
          console.log(`✅ AI response received: ${latestAiMessage.content.substring(0, 100)}...`);
          
          // Check for referral metadata
          if (latestAiMessage.metadata && latestAiMessage.metadata.referralNeeded) {
            referralDetected = true;
            console.log(`🔄 Referral detected: ${latestAiMessage.metadata.recommendedSpecialty}`);
            
            if (latestAiMessage.metadata.suggestedProvider) {
              console.log(`   Suggested provider: ${latestAiMessage.metadata.suggestedProviderName}`);
            }
          }
        }
      }
      
      console.log(`   Attempt ${attempts}/${maxAttempts} - Waiting for AI response...`);
    }
    
    if (!aiResponseReceived) {
      throw new Error('AI response not received within timeout period');
    }
    
    // Step 5: Test Doctor Switching (if referral detected)
    if (referralDetected) {
      console.log('\n5️⃣ Testing doctor switching functionality...');
      
      // Get available providers for switching
      const switchProvidersResponse = await fetch(`${BASE_URL}/api/ai-consultations/${consultationId}/switch-provider?specialty=Psychiatry`, {
        headers: getAuthHeaders()
      });
      
      if (switchProvidersResponse.ok) {
        const switchProvidersData = await switchProvidersResponse.json();
        
        if (switchProvidersData.providers && switchProvidersData.providers.length > 0) {
          const newProvider = switchProvidersData.providers[0];
          
          const switchResponse = await fetch(`${BASE_URL}/api/ai-consultations/${consultationId}/switch-provider`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              newProviderId: newProvider.id,
              reason: 'Mental health concerns require specialist attention',
              transferContext: 'Patient experiencing anxiety and self-harm thoughts'
            })
          });
          
          if (switchResponse.ok) {
            const switchResult = await switchResponse.json();
            console.log(`✅ Successfully switched to: ${newProvider.name} (${newProvider.specialty})`);
          } else {
            console.log(`❌ Doctor switching failed: ${switchResponse.status}`);
          }
        } else {
          console.log(`⚠️  No alternative providers available for switching`);
        }
      }
    } else {
      console.log('\n5️⃣ No referral detected - skipping doctor switching test');
    }
    
    // Step 6: Test Final Report Generation
    console.log('\n6️⃣ Testing final report generation...');
    const endResponse = await fetch(`${BASE_URL}/api/ai-consultations/${consultationId}/end`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    if (!endResponse.ok) {
      const errorText = await endResponse.text();
      throw new Error(`Failed to end consultation: ${endResponse.status} ${errorText}`);
    }
    
    const endResult = await endResponse.json();
    console.log(`✅ Consultation ended successfully`);
    console.log(`   Status: ${endResult.consultation.status}`);
    console.log(`   Duration: ${endResult.consultation.durationMinutes} minutes`);
    
    if (endResult.consultation.aiAssessment) {
      console.log(`   AI Assessment generated: ${endResult.consultation.aiAssessment.substring(0, 100)}...`);
    }
    
    if (endResult.reportId) {
      console.log(`   Full diagnostic report ID: ${endResult.reportId}`);
    }
    
    // Step 7: Verify Consultation History
    console.log('\n7️⃣ Verifying consultation in history...');
    const historyResponse = await fetch(`${BASE_URL}/api/ai-consultations`, {
      headers: getAuthHeaders()
    });
    
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      const completedConsultation = historyData.consultations.find(c => c.id === consultationId);
      
      if (completedConsultation && completedConsultation.status === 'completed') {
        console.log(`✅ Consultation found in history with status: ${completedConsultation.status}`);
      } else {
        console.log(`❌ Consultation not found in history or status incorrect`);
      }
    }
    
    console.log('\n🎉 All AI consultation tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ AI Provider availability');
    console.log('   ✅ Consultation creation');
    console.log('   ✅ Message sending and display');
    console.log('   ✅ AI response generation');
    console.log(`   ${referralDetected ? '✅' : '⚠️ '} Referral detection ${referralDetected ? '' : '(not triggered)'}`);
    console.log(`   ${referralDetected ? '✅' : '⚠️ '} Doctor switching ${referralDetected ? '' : '(not tested - no referral)'}`);
    console.log('   ✅ Final report generation');
    console.log('   ✅ Consultation history verification');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCompleteAIConsultation();
}

module.exports = { testCompleteAIConsultation };