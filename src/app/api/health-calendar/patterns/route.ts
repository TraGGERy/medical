import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { healthEvents, dailyCheckins, healthPatterns } from '@/drizzle/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

// Type definitions
type HealthEvent = {
  id: string;
  userId: string;
  eventType: string;
  title: string;
  description: string | null;
  severity: number | null;
  startDate: string;
  endDate: string | null;
  isOngoing: boolean;
  frequency: string | null;
  dosage: string | null;
  unit: string | null;
  tags: string;
  metadata: string;
  createdAt: string;
  updatedAt: string;
};

type DailyCheckin = {
  id: string;
  userId: string;
  checkinDate: string;
  mood: number | null;
  energy: number | null;
  sleepQuality: number | null;
  sleepHours: number | null;
  stressLevel: number | null;
  notes: string | null;
  symptoms: string;
  medications: string;
  createdAt: string;
  updatedAt: string;
};

type CorrelationData = {
  type: string;
  correlation: number;
  description: string;
  strength: string;
};

type TrendData = {
  type: string;
  title?: string;
  week?: string;
  count?: number;
  trend?: string;
  average?: number;
  dataPoints?: number;
};

type SeverityData = {
  symptoms: Array<{ date: string; severity: number; title: string }>;
  mood: Array<{ date: string; value: number }>;
  energy: Array<{ date: string; value: number }>;
  sleep: Array<{ date: string; value: number }>;
};

const patternAnalysisSchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  eventTypes: z.array(z.string()).optional(),
  includeCheckins: z.boolean().default(true),
  analysisType: z.enum(['correlation', 'trend', 'frequency', 'severity']).default('trend')
});

const createPatternSchema = z.object({
  patternType: z.enum(['correlation', 'trend', 'frequency', 'seasonal']),
  title: z.string().min(1),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  timeframe: z.string(),
  dataPoints: z.array(z.record(z.any())),
  insights: z.array(z.string()),
  recommendations: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

// POST - Analyze health patterns
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = patternAnalysisSchema.parse(body);

    const timeframeDays = getTimeframeDays(validatedData.timeframe);
    const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000).toISOString();

    // Fetch health events
    let eventConditions = [eq(healthEvents.userId, userId), gte(healthEvents.startDate, startDate)];
    if (validatedData.eventTypes && validatedData.eventTypes.length > 0) {
      eventConditions.push(sql`${healthEvents.eventType} = ANY(${validatedData.eventTypes})`);
    }

    const events = await db
      .select()
      .from(healthEvents)
      .where(and(...eventConditions))
      .orderBy(desc(healthEvents.startDate));

    // Fetch daily check-ins if requested
    let checkins: DailyCheckin[] = [];
    if (validatedData.includeCheckins) {
      checkins = await db
        .select()
        .from(dailyCheckins)
        .where(
          and(
            eq(dailyCheckins.userId, userId),
            gte(dailyCheckins.checkinDate, startDate)
          )
        )
        .orderBy(desc(dailyCheckins.checkinDate));
    }

    // Perform analysis based on type
    let analysisResult;
    switch (validatedData.analysisType) {
      case 'correlation':
        analysisResult = await analyzeCorrelations(events, checkins);
        break;
      case 'trend':
        analysisResult = await analyzeTrends(events, checkins);
        break;
      case 'frequency':
        analysisResult = await analyzeFrequency(events, checkins);
        break;
      case 'severity':
        analysisResult = await analyzeSeverity(events, checkins);
        break;
      default:
        analysisResult = await analyzeTrends(events, checkins);
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      timeframe: validatedData.timeframe,
      dataPoints: {
        events: events.length,
        checkins: checkins.length
      }
    });
  } catch (error) {
    console.error('Error analyzing health patterns:', error);
    return NextResponse.json(
      { error: 'Failed to analyze health patterns' },
      { status: 500 }
    );
  }
}

// GET - Retrieve saved health patterns
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patternType = searchParams.get('patternType');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereConditions = [eq(healthPatterns.userId, userId)];
    if (patternType) {
      whereConditions.push(eq(healthPatterns.patternType, patternType));
    }

    const patterns = await db
      .select()
      .from(healthPatterns)
      .where(and(...whereConditions))
      .orderBy(desc(healthPatterns.createdAt))
      .limit(limit)
      .offset(offset);

    // Parse JSON fields
    const patternsWithParsedData = patterns.map(pattern => ({
      ...pattern,
      dataPoints: pattern.dataPoints ? JSON.parse(pattern.dataPoints as string) : [],
      insights: pattern.insights ? JSON.parse(pattern.insights as string) : [],
      recommendations: pattern.recommendations ? JSON.parse(pattern.recommendations as string) : [],
      metadata: pattern.metadata ? JSON.parse(pattern.metadata as string) : {}
    }));

    return NextResponse.json({ patterns: patternsWithParsedData });
  } catch (error) {
    console.error('Error fetching health patterns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health patterns' },
      { status: 500 }
    );
  }
}

// PUT - Save analyzed pattern
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPatternSchema.parse(body);

    const [newPattern] = await db
      .insert(healthPatterns)
      .values({
        userId,
        patternType: validatedData.patternType,
        title: validatedData.title,
        description: validatedData.description,
        confidence: validatedData.confidence,
        timeframe: validatedData.timeframe,
        dataPoints: JSON.stringify(validatedData.dataPoints),
        insights: JSON.stringify(validatedData.insights),
        recommendations: validatedData.recommendations ? JSON.stringify(validatedData.recommendations) : null,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null
      })
      .returning();

    return NextResponse.json({ success: true, pattern: newPattern });
  } catch (error) {
    console.error('Error saving health pattern:', error);
    return NextResponse.json(
      { error: 'Failed to save health pattern' },
      { status: 500 }
    );
  }
}

// Helper functions for analysis
function getTimeframeDays(timeframe: string): number {
  switch (timeframe) {
    case 'week': return 7;
    case 'month': return 30;
    case 'quarter': return 90;
    case 'year': return 365;
    default: return 30;
  }
}

async function analyzeCorrelations(events: HealthEvent[], checkins: DailyCheckin[]) {
  const correlations = [];
  
  // Analyze correlation between mood and symptoms
  const moodSymptomCorrelation = calculateMoodSymptomCorrelation(events, checkins);
  if (moodSymptomCorrelation.correlation !== 0) {
    correlations.push({
      type: 'mood_symptom',
      correlation: moodSymptomCorrelation.correlation,
      description: `Mood and symptom severity correlation: ${moodSymptomCorrelation.correlation.toFixed(2)}`,
      strength: Math.abs(moodSymptomCorrelation.correlation) > 0.5 ? 'strong' : 'moderate'
    });
  }

  // Analyze sleep-energy correlation
  const sleepEnergyCorrelation = calculateSleepEnergyCorrelation(checkins);
  if (sleepEnergyCorrelation.correlation !== 0) {
    correlations.push({
      type: 'sleep_energy',
      correlation: sleepEnergyCorrelation.correlation,
      description: `Sleep quality and energy level correlation: ${sleepEnergyCorrelation.correlation.toFixed(2)}`,
      strength: Math.abs(sleepEnergyCorrelation.correlation) > 0.5 ? 'strong' : 'moderate'
    });
  }

  return {
    type: 'correlation',
    correlations,
    insights: generateCorrelationInsights(correlations)
  };
}

async function analyzeTrends(events: HealthEvent[], checkins: DailyCheckin[]) {
  const trends = [];
  
  // Symptom frequency trends
  const symptomTrends = calculateSymptomTrends(events);
  trends.push(...symptomTrends);
  
  // Mood trends
  const moodTrends = calculateMoodTrends(checkins);
  trends.push(...moodTrends);
  
  return {
    type: 'trend',
    trends,
    insights: generateTrendInsights(trends)
  };
}

async function analyzeFrequency(events: HealthEvent[], checkins: DailyCheckin[]) {
  const frequencies = {};
  
  // Event type frequencies
  events.forEach(event => {
    const key = `${event.eventType}_${event.title}`;
    frequencies[key] = (frequencies[key] || 0) + 1;
  });
  
  // Check-in frequencies
  const checkinFreq = checkins.length;
  
  return {
    type: 'frequency',
    eventFrequencies: frequencies,
    checkinFrequency: checkinFreq,
    insights: generateFrequencyInsights(frequencies, checkinFreq)
  };
}

async function analyzeSeverity(events: HealthEvent[], checkins: DailyCheckin[]) {
  const severityData = {
    symptoms: [],
    mood: [],
    energy: [],
    sleep: []
  };
  
  // Analyze symptom severity
  events.filter(e => e.eventType === 'symptom' && e.severity)
    .forEach(event => {
      severityData.symptoms.push({
        date: event.startDate,
        severity: event.severity,
        title: event.title
      });
    });
  
  // Analyze check-in metrics
  checkins.forEach(checkin => {
    if (checkin.mood) severityData.mood.push({ date: checkin.checkinDate, value: checkin.mood });
    if (checkin.energy) severityData.energy.push({ date: checkin.checkinDate, value: checkin.energy });
    if (checkin.sleepQuality) severityData.sleep.push({ date: checkin.checkinDate, value: checkin.sleepQuality });
  });
  
  return {
    type: 'severity',
    data: severityData,
    insights: generateSeverityInsights(severityData)
  };
}

// Helper calculation functions
function calculateMoodSymptomCorrelation(events: HealthEvent[], checkins: DailyCheckin[]) {
  // Simplified correlation calculation
  const symptomDays = events.filter(e => e.eventType === 'symptom').map(e => e.startDate.split('T')[0]);
  const moodData = checkins.filter(c => c.mood).map(c => ({ date: c.checkinDate.split('T')[0], mood: c.mood }));
  
  // Calculate correlation between symptom presence and mood
  let correlation = 0;
  if (moodData.length > 0) {
    const avgMoodWithSymptoms = moodData.filter(m => symptomDays.includes(m.date)).reduce((sum, m) => sum + m.mood, 0) / Math.max(1, moodData.filter(m => symptomDays.includes(m.date)).length);
    const avgMoodWithoutSymptoms = moodData.filter(m => !symptomDays.includes(m.date)).reduce((sum, m) => sum + m.mood, 0) / Math.max(1, moodData.filter(m => !symptomDays.includes(m.date)).length);
    correlation = (avgMoodWithoutSymptoms - avgMoodWithSymptoms) / 5; // Normalize to -1 to 1
  }
  
  return { correlation };
}

function calculateSleepEnergyCorrelation(checkins: DailyCheckin[]) {
  const validCheckins = checkins.filter(c => c.sleepQuality && c.energy);
  if (validCheckins.length < 2) return { correlation: 0 };
  
  // Simple correlation calculation
  const n = validCheckins.length;
  const sumSleep = validCheckins.reduce((sum, c) => sum + c.sleepQuality, 0);
  const sumEnergy = validCheckins.reduce((sum, c) => sum + c.energy, 0);
  const sumSleepEnergy = validCheckins.reduce((sum, c) => sum + (c.sleepQuality * c.energy), 0);
  const sumSleepSq = validCheckins.reduce((sum, c) => sum + (c.sleepQuality * c.sleepQuality), 0);
  const sumEnergySq = validCheckins.reduce((sum, c) => sum + (c.energy * c.energy), 0);
  
  const correlation = (n * sumSleepEnergy - sumSleep * sumEnergy) / 
    Math.sqrt((n * sumSleepSq - sumSleep * sumSleep) * (n * sumEnergySq - sumEnergy * sumEnergy));
  
  return { correlation: isNaN(correlation) ? 0 : correlation };
}

function calculateSymptomTrends(events: HealthEvent[]) {
  const symptoms = events.filter(e => e.eventType === 'symptom');
  const symptomCounts = {};
  
  symptoms.forEach(symptom => {
    const week = getWeekNumber(new Date(symptom.startDate));
    const key = `${symptom.title}_${week}`;
    symptomCounts[key] = (symptomCounts[key] || 0) + 1;
  });
  
  return Object.entries(symptomCounts).map(([key, count]) => ({
    type: 'symptom_frequency',
    title: key.split('_')[0],
    week: key.split('_')[1],
    count,
    trend: 'stable' // Simplified - would need more complex calculation
  }));
}

function calculateMoodTrends(checkins: DailyCheckin[]) {
  const moodData = checkins.filter(c => c.mood).map(c => ({
    date: c.checkinDate,
    mood: c.mood
  }));
  
  if (moodData.length < 2) return [];
  
  const avgMood = moodData.reduce((sum, m) => sum + m.mood, 0) / moodData.length;
  const trend = moodData[0].mood > avgMood ? 'improving' : 'declining';
  
  return [{
    type: 'mood_trend',
    average: avgMood,
    trend,
    dataPoints: moodData.length
  }];
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function generateCorrelationInsights(correlations: CorrelationData[]): string[] {
  const insights = [];
  
  correlations.forEach(corr => {
    if (corr.type === 'mood_symptom' && Math.abs(corr.correlation) > 0.3) {
      insights.push(`There's a ${corr.strength} correlation between your mood and symptom severity.`);
    }
    if (corr.type === 'sleep_energy' && corr.correlation > 0.5) {
      insights.push('Better sleep quality is strongly associated with higher energy levels.');
    }
  });
  
  return insights;
}

function generateTrendInsights(trends: TrendData[]): string[] {
  const insights = [];
  
  trends.forEach(trend => {
    if (trend.type === 'mood_trend') {
      insights.push(`Your average mood is ${trend.average.toFixed(1)}/5 with a ${trend.trend} trend.`);
    }
  });
  
  return insights;
}

function generateFrequencyInsights(frequencies: Record<string, number>, checkinFreq: number): string[] {
  const insights = [];
  
  const mostFrequent = Object.entries(frequencies)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];
  
  if (mostFrequent) {
    insights.push(`Your most frequent health event is "${mostFrequent[0].split('_').slice(1).join('_')}" occurring ${mostFrequent[1]} times.`);
  }
  
  insights.push(`You've completed ${checkinFreq} daily check-ins in this period.`);
  
  return insights;
}

function generateSeverityInsights(severityData: SeverityData): string[] {
  const insights = [];
  
  if (severityData.symptoms.length > 0) {
    const avgSeverity = severityData.symptoms.reduce((sum, s) => sum + s.severity, 0) / severityData.symptoms.length;
    insights.push(`Average symptom severity is ${avgSeverity.toFixed(1)}/10.`);
  }
  
  if (severityData.mood.length > 0) {
    const avgMood = severityData.mood.reduce((sum, m) => sum + m.value, 0) / severityData.mood.length;
    insights.push(`Average mood rating is ${avgMood.toFixed(1)}/5.`);
  }
  
  return insights;
}