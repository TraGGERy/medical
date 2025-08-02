import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test data for saving a report
    const testReportData = {
      title: 'Test Health Analysis - ' + new Date().toLocaleDateString(),
      symptoms: ['headache', 'fatigue'],
      aiAnalysis: 'This is a test analysis to verify the save functionality is working correctly.',
      urgencyLevel: 'low',
      confidence: 85,
      recommendations: ['Get adequate rest', 'Stay hydrated'],
      followUpRequired: false,
      doctorRecommended: false
    };

    // Call the save API
    const saveResponse = await fetch(`${request.nextUrl.origin}/api/health-reports/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify(testReportData),
    });

    if (!saveResponse.ok) {
      const errorData = await saveResponse.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json({ 
        success: false, 
        error: errorData.error,
        status: saveResponse.status 
      });
    }

    const result = await saveResponse.json();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test report saved successfully',
      reportId: result.reportId,
      redirectUrl: `/reports/${result.reportId}`
    });

  } catch (error) {
    console.error('Error in test save:', error);
    return NextResponse.json(
      { success: false, error: 'Test failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}