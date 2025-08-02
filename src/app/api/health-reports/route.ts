import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { healthReports } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query conditions
    const whereConditions = eq(healthReports.userId, userId);

    // Fetch health reports from database
    const reports = await db
      .select()
      .from(healthReports)
      .where(whereConditions)
      .orderBy(desc(healthReports.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    // Transform the data to match the frontend interface
    const transformedReports = reports.map(report => {
      // Parse JSON fields safely
      const symptoms = Array.isArray(report.symptoms) ? report.symptoms : [];
      const aiAnalysis = typeof report.aiAnalysis === 'object' ? report.aiAnalysis : {};
      const recommendations = Array.isArray(report.recommendations) ? report.recommendations : [];

      // Determine status based on urgency level and risk level
      let status = 'Normal';
      if (report.urgencyLevel >= 4 || report.riskLevel === 'critical') {
        status = 'Urgent';
      } else if (report.urgencyLevel >= 2 || report.riskLevel === 'high' || report.riskLevel === 'medium') {
        status = 'Attention';
      }

      // Create a summary from the AI analysis
      const summaryValue = typeof aiAnalysis === 'object' && aiAnalysis !== null 
        ? (aiAnalysis as Record<string, unknown>).analysis || (aiAnalysis as Record<string, unknown>).summary || 'Health analysis completed'
        : 'Health analysis completed';
      const summary = typeof summaryValue === 'string' ? summaryValue : 'Health analysis completed';

      return {
        id: report.id,
        date: report.createdAt.toISOString().split('T')[0],
        time: report.createdAt.toTimeString().split(' ')[0].substring(0, 5),
        condition: report.title,
        status: status as 'Normal' | 'Attention' | 'Urgent',
        riskLevel: report.riskLevel === 'critical' ? 'High' : 
                  report.riskLevel === 'high' ? 'High' :
                  report.riskLevel === 'medium' ? 'Medium' : 'Low',
        summary: summary.length > 150 ? summary.substring(0, 150) + '...' : summary,
        confidence: Math.round(parseFloat(report.confidence || '0')),
        symptoms,
        aiAnalysis,
        recommendations,
        urgencyLevel: report.urgencyLevel,
        followUpRequired: report.followUpRequired,
        doctorRecommended: report.doctorRecommended,
        fullReport: report
      };
    });

    // Filter by search term if provided
    let filteredReports = transformedReports;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReports = transformedReports.filter(report => 
        report.condition.toLowerCase().includes(searchLower) ||
        report.summary.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      filteredReports = filteredReports.filter(report => 
        report.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Get total count for pagination
    const totalReports = await db
      .select({ count: healthReports.id })
      .from(healthReports)
      .where(eq(healthReports.userId, userId));

    return NextResponse.json({
      reports: filteredReports,
      pagination: {
        page,
        limit,
        total: totalReports.length,
        totalPages: Math.ceil(totalReports.length / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching health reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health reports' },
      { status: 500 }
    );
  }
}