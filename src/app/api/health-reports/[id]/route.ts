import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { healthReports } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = params.id;

    // Fetch the specific health report
    const report = await db
      .select()
      .from(healthReports)
      .where(and(
        eq(healthReports.id, reportId),
        eq(healthReports.userId, userId)
      ))
      .limit(1);

    if (report.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const healthReport = report[0];

    // Parse JSON fields safely
    const symptoms = Array.isArray(healthReport.symptoms) ? healthReport.symptoms : [];
    const aiAnalysis = typeof healthReport.aiAnalysis === 'object' ? healthReport.aiAnalysis : {};
    const recommendations = Array.isArray(healthReport.recommendations) ? healthReport.recommendations : [];

    // Determine status based on urgency level and risk level
    let status = 'Normal';
    if (healthReport.urgencyLevel >= 4 || healthReport.riskLevel === 'critical') {
      status = 'Urgent';
    } else if (healthReport.urgencyLevel >= 2 || healthReport.riskLevel === 'high' || healthReport.riskLevel === 'medium') {
      status = 'Attention';
    }

    // Transform the data for the frontend
    const transformedReport = {
      id: healthReport.id,
      title: healthReport.title,
      date: healthReport.createdAt.toISOString().split('T')[0],
      time: healthReport.createdAt.toTimeString().split(' ')[0].substring(0, 5),
      status: status as 'Normal' | 'Attention' | 'Urgent',
      riskLevel: healthReport.riskLevel === 'critical' ? 'High' : 
                healthReport.riskLevel === 'high' ? 'High' :
                healthReport.riskLevel === 'medium' ? 'Medium' : 'Low',
      confidence: Math.round(parseFloat(healthReport.confidence || '0')),
      urgencyLevel: healthReport.urgencyLevel,
      followUpRequired: healthReport.followUpRequired,
      doctorRecommended: healthReport.doctorRecommended,
      symptoms,
      aiAnalysis,
      recommendations,
      createdAt: healthReport.createdAt,
      updatedAt: healthReport.updatedAt
    };

    return NextResponse.json({ report: transformedReport });

  } catch (error) {
    console.error('Error fetching health report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health report' },
      { status: 500 }
    );
  }
}