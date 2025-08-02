import { db } from './index';
import { 
  users, 
  symptoms, 
  medicalConditions, 
  subscriptionPlans 
} from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Seed subscription plans
    await db.insert(subscriptionPlans).values([
      {
        id: 'free',
        name: 'Free Plan',
        description: 'Get started with 3 free health reports per month',
        price: '0.00',
        currency: 'USD',
        features: ['3 free health reports per month', 'Basic AI analysis', 'Email support'],
        maxReports: 3,
        isActive: true,
      },
      {
        id: 'pro',
        name: 'Pro Plan',
        description: 'Unlimited reports with advanced features',
        price: '19.00',
        currency: 'USD',
        features: [
          'Unlimited health reports',
          'Advanced AI analysis',
          'Priority support',
          'Detailed recommendations',
          'Export reports to PDF',
          'Health trend tracking',
        ],
        maxReports: null,
        isActive: true,
      },
      {
        id: 'family',
        name: 'Family Plan',
        description: 'Pro features for up to 6 family members',
        price: '39.00',
        currency: 'USD',
        features: [
          'Everything in Pro Plan',
          'Up to 6 family members',
          'Family health dashboard',
          'Shared health insights',
          'Family health history',
          'Dedicated family support',
        ],
        maxReports: null,
        isActive: true,
      },
    ]);

    // Seed common symptoms
    await db.insert(symptoms).values([
      {
        name: 'Headache',
        category: 'neurological',
        description: 'Pain in the head or upper neck',
        commonCauses: ['tension', 'migraine', 'dehydration', 'stress'],
        severity: 2,
      },
      {
        name: 'Fever',
        category: 'general',
        description: 'Elevated body temperature',
        commonCauses: ['infection', 'inflammation', 'heat exhaustion'],
        severity: 3,
      },
      {
        name: 'Chest Pain',
        category: 'cardiovascular',
        description: 'Pain or discomfort in the chest area',
        commonCauses: ['heart problems', 'lung issues', 'muscle strain'],
        severity: 4,
      },
      {
        name: 'Shortness of Breath',
        category: 'respiratory',
        description: 'Difficulty breathing or feeling breathless',
        commonCauses: ['asthma', 'heart problems', 'anxiety', 'lung disease'],
        severity: 4,
      },
      {
        name: 'Fatigue',
        category: 'general',
        description: 'Extreme tiredness or lack of energy',
        commonCauses: ['sleep deprivation', 'stress', 'medical conditions'],
        severity: 2,
      },
      {
        name: 'Nausea',
        category: 'gastrointestinal',
        description: 'Feeling of sickness with urge to vomit',
        commonCauses: ['food poisoning', 'motion sickness', 'pregnancy'],
        severity: 2,
      },
      {
        name: 'Dizziness',
        category: 'neurological',
        description: 'Feeling lightheaded or unsteady',
        commonCauses: ['dehydration', 'low blood pressure', 'inner ear problems'],
        severity: 3,
      },
      {
        name: 'Abdominal Pain',
        category: 'gastrointestinal',
        description: 'Pain in the stomach or belly area',
        commonCauses: ['indigestion', 'appendicitis', 'gastritis'],
        severity: 3,
      },
    ]);

    // Seed common medical conditions
    await db.insert(medicalConditions).values([
      {
        name: 'Common Cold',
        category: 'respiratory',
        description: 'Viral infection of the upper respiratory tract',
        symptoms: ['runny nose', 'sneezing', 'cough', 'sore throat'],
        severity: 'mild',
        treatmentOptions: ['rest', 'fluids', 'over-the-counter medications'],
      },
      {
        name: 'Migraine',
        category: 'neurological',
        description: 'Severe recurring headache with additional symptoms',
        symptoms: ['severe headache', 'nausea', 'light sensitivity'],
        severity: 'moderate',
        treatmentOptions: ['pain medication', 'rest in dark room', 'hydration'],
      },
      {
        name: 'Hypertension',
        category: 'cardiovascular',
        description: 'High blood pressure',
        symptoms: ['headache', 'dizziness', 'chest pain'],
        severity: 'moderate',
        treatmentOptions: ['lifestyle changes', 'medication', 'regular monitoring'],
      },
      {
        name: 'Anxiety Disorder',
        category: 'mental_health',
        description: 'Excessive worry and fear',
        symptoms: ['restlessness', 'rapid heartbeat', 'sweating'],
        severity: 'moderate',
        treatmentOptions: ['therapy', 'medication', 'relaxation techniques'],
      },
    ]);

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('🎉 Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });