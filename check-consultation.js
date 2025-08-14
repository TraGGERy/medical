const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { db } = require('./src/lib/db');
const { aiConsultations } = require('./src/lib/db/schema');
const { eq } = require('drizzle-orm');

async function checkConsultation() {
  try {
    console.log('🔍 Checking consultation: f80de441-677c-4c6a-8279-99e69e9b1841');
    
    const consultation = await db
      .select()
      .from(aiConsultations)
      .where(eq(aiConsultations.id, 'f80de441-677c-4c6a-8279-99e69e9b1841'));
    
    console.log('Consultation found:', consultation.length > 0 ? 'YES' : 'NO');
    
    if (consultation.length > 0) {
      console.log('Consultation details:');
      console.log('- ID:', consultation[0].id);
      console.log('- Patient ID:', consultation[0].patientId);
      console.log('- AI Provider ID:', consultation[0].aiProviderId);
      console.log('- Status:', consultation[0].status);
      console.log('- Reason:', consultation[0].reasonForVisit);
      console.log('- Created:', consultation[0].createdAt);
    } else {
      console.log('❌ No consultation found with this ID');
      
      // Check if there are any consultations at all
      const allConsultations = await db.select().from(aiConsultations).limit(5);
      console.log('\n📊 Recent consultations in database:');
      allConsultations.forEach((c, i) => {
        console.log(`${i + 1}. ID: ${c.id}, Patient: ${c.patientId}, Status: ${c.status}`);
      });
    }
  } catch (error) {
    console.error('💥 Database query error:', error);
  }
  
  process.exit(0);
}

checkConsultation();