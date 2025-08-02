import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { healthReports, userMedicalHistory, userPrivacySettings, chatSessions, userAnalytics } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

// DELETE - Delete user data
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, reportIds } = body;

    if (type === 'all') {
      // Delete all user data except the user account itself
      await Promise.all([
        db.delete(healthReports).where(eq(healthReports.userId, userId)),
        db.delete(userMedicalHistory).where(eq(userMedicalHistory.userId, userId)),
        db.delete(chatSessions).where(eq(chatSessions.userId, userId)),
        db.delete(userAnalytics).where(eq(userAnalytics.userId, userId)),
        // Keep privacy settings and user profile
      ]);

      return NextResponse.json({ 
        success: true, 
        message: 'All user data deleted successfully' 
      });
    } else if (type === 'reports' && reportIds && Array.isArray(reportIds)) {
      // Delete specific reports
      if (reportIds.length === 0) {
        return NextResponse.json({ 
          error: 'No report IDs provided' 
        }, { status: 400 });
      }

      // Verify that all reports belong to the user
      const userReports = await db.select({ id: healthReports.id })
        .from(healthReports)
        .where(eq(healthReports.userId, userId));
      
      const userReportIds = userReports.map(r => r.id);
      const invalidIds = reportIds.filter(id => !userReportIds.includes(id));
      
      if (invalidIds.length > 0) {
        return NextResponse.json({ 
          error: 'Some report IDs do not belong to this user' 
        }, { status: 403 });
      }

      // Delete the specified reports
      await db.delete(healthReports)
        .where(inArray(healthReports.id, reportIds));

      return NextResponse.json({ 
        success: true, 
        message: `${reportIds.length} reports deleted successfully` 
      });
    } else {
      return NextResponse.json({ 
        error: 'Invalid deletion type or missing parameters' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error deleting user data:', error);
    return NextResponse.json({ 
      error: 'Failed to delete user data' 
    }, { status: 500 });
  }
}