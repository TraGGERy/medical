import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createOrUpdateUser } from '@/lib/services/userService';

export async function POST() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await createOrUpdateUser(user);
    
    return NextResponse.json({ 
      success: true, 
      user: dbUser 
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' }, 
      { status: 500 }
    );
  }
}