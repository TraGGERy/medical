import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userPrivacySettings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch user privacy settings
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get privacy settings or create default ones
    let settings = await db.select().from(userPrivacySettings).where(eq(userPrivacySettings.userId, userId)).limit(1);
    
    if (settings.length === 0) {
      // Create default privacy settings
      const defaultSettings = {
        userId,
        dataEncryption: true,
        shareWithDoctors: false,
        anonymousAnalytics: true,
        emailNotifications: true,
        smsNotifications: false,
        dataRetention: '2-years',
        thirdPartySharing: false,
        twoFactorEnabled: false,
      };
      
      const newSettings = await db.insert(userPrivacySettings).values(defaultSettings).returning();
      settings = newSettings;
    }

    return NextResponse.json({ 
      success: true, 
      settings: settings[0] 
    });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch privacy settings' 
    }, { status: 500 });
  }
}

// PUT - Update user privacy settings
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/privacy-settings - Starting request');
    
    const { userId } = await auth();
    console.log('User ID from auth:', userId);
    
    if (!userId) {
      console.log('No user ID found - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const {
      dataEncryption,
      shareWithDoctors,
      anonymousAnalytics,
      emailNotifications,
      smsNotifications,
      dataRetention,
      thirdPartySharing,
      twoFactorEnabled
    } = body;

    // Validate data retention value
    const validRetentionValues = ['6-months', '1-year', '2-years', '5-years', 'indefinite'];
    if (dataRetention && !validRetentionValues.includes(dataRetention)) {
      console.log('Invalid data retention value:', dataRetention);
      return NextResponse.json({ 
        error: 'Invalid data retention value' 
      }, { status: 400 });
    }

    console.log('Checking for existing settings...');
    // Check if settings exist
    const existingSettings = await db.select().from(userPrivacySettings).where(eq(userPrivacySettings.userId, userId)).limit(1);
    console.log('Existing settings found:', existingSettings.length > 0);
    
    const updateData = {
      dataEncryption: dataEncryption ?? true,
      shareWithDoctors: shareWithDoctors ?? false,
      anonymousAnalytics: anonymousAnalytics ?? true,
      emailNotifications: emailNotifications ?? true,
      smsNotifications: smsNotifications ?? false,
      dataRetention: dataRetention ?? '2-years',
      thirdPartySharing: thirdPartySharing ?? false,
      twoFactorEnabled: twoFactorEnabled ?? false,
      updatedAt: new Date(),
    };
    
    console.log('Update data prepared:', updateData);

    let updatedSettings;
    
    if (existingSettings.length === 0) {
      console.log('Creating new settings...');
      // Create new settings
      updatedSettings = await db.insert(userPrivacySettings).values({
        userId,
        ...updateData,
      }).returning();
      console.log('New settings created:', updatedSettings);
    } else {
      console.log('Updating existing settings...');
      // Update existing settings
      updatedSettings = await db.update(userPrivacySettings)
        .set(updateData)
        .where(eq(userPrivacySettings.userId, userId))
        .returning();
      console.log('Settings updated:', updatedSettings);
    }

    console.log('Returning success response');
    return NextResponse.json({ 
      success: true, 
      settings: updatedSettings[0] 
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Failed to update privacy settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}