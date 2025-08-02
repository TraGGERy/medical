import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, healthReports, userMedicalHistory, userPrivacySettings, chatSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Export all user data
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data
    const [
      userData,
      reportsData,
      medicalHistoryData,
      privacySettingsData,
      chatSessionsData
    ] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1),
      db.select().from(healthReports).where(eq(healthReports.userId, userId)),
      db.select().from(userMedicalHistory).where(eq(userMedicalHistory.userId, userId)).limit(1),
      db.select().from(userPrivacySettings).where(eq(userPrivacySettings.userId, userId)).limit(1),
      db.select().from(chatSessions).where(eq(chatSessions.userId, userId))
    ]);

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        profile: userData[0] || null,
        medicalHistory: medicalHistoryData[0] || null,
        privacySettings: privacySettingsData[0] || null,
      },
      healthReports: reportsData,
      chatSessions: chatSessionsData.map(session => ({
        ...session,
        // Remove sensitive data if needed
        messages: session.messages
      })),
      metadata: {
        totalReports: reportsData.length,
        totalChatSessions: chatSessionsData.length,
        accountCreated: userData[0]?.createdAt,
        lastUpdated: userData[0]?.updatedAt,
      }
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="diagnogenie-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json({ 
      error: 'Failed to export user data' 
    }, { status: 500 });
  }
}