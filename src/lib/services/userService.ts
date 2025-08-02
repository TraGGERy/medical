import { db } from '@/lib/db';
import { users, userMedicalHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@clerk/nextjs/server';

export async function createOrUpdateUser(clerkUser: User) {
  try {
    const userData = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      updatedAt: new Date(),
    };

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, clerkUser.id))
      .limit(1);

    if (existingUser.length === 0) {
      // Create new user
      await db.insert(users).values({
        ...userData,
        createdAt: new Date(),
      });

      // Create empty medical history for new user
      await db.insert(userMedicalHistory).values({
        userId: clerkUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ New user created:', clerkUser.id);
    } else {
      // Update existing user
      await db
        .update(users)
        .set(userData)
        .where(eq(users.id, clerkUser.id));

      console.log('✅ User updated:', clerkUser.id);
    }

    return userData;
  } catch (error) {
    console.error('❌ Error creating/updating user:', error);
    throw error;
  }
}

export async function getUserById(userId: string) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user[0] || null;
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    throw error;
  }
}

export async function getUserMedicalHistory(userId: string) {
  try {
    const history = await db
      .select()
      .from(userMedicalHistory)
      .where(eq(userMedicalHistory.userId, userId))
      .limit(1);

    return history[0] || null;
  } catch (error) {
    console.error('❌ Error fetching medical history:', error);
    throw error;
  }
}

export async function updateUserMedicalHistory(userId: string, data: any) {
  try {
    const existingHistory = await getUserMedicalHistory(userId);

    if (existingHistory) {
      await db
        .update(userMedicalHistory)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(userMedicalHistory.userId, userId));
    } else {
      await db.insert(userMedicalHistory).values({
        userId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log('✅ Medical history updated for user:', userId);
  } catch (error) {
    console.error('❌ Error updating medical history:', error);
    throw error;
  }
}