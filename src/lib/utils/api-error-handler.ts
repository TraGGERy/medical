import { NextResponse } from 'next/server';

/**
 * Centralized error handler for API routes that handles common database errors
 * including Neon quota exceeded errors
 */
export function handleApiError(error: unknown, context: string = 'API operation') {
  console.error(`❌ Error in ${context}:`, error);
  
  // Check if it's a Neon database quota error
  if (error instanceof Error && error.message.includes('exceeded the data transfer quota')) {
    console.warn('⚠️ Database quota exceeded - returning graceful fallback');
    return NextResponse.json(
      { 
        error: 'Service temporarily unavailable due to high usage. Please try again later.',
        isQuotaError: true,
        retryAfter: 300 // Suggest retry after 5 minutes
      },
      { 
        status: 503,
        headers: {
          'Retry-After': '300'
        }
      }
    );
  }
  
  // Check for other common database errors
  if (error instanceof Error) {
    // Connection timeout
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return NextResponse.json(
        { 
          error: 'Database connection timeout. Please try again.',
          isTemporary: true
        },
        { status: 503 }
      );
    }
    
    // Connection refused
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connection refused')) {
      return NextResponse.json(
        { 
          error: 'Database service unavailable. Please try again later.',
          isTemporary: true
        },
        { status: 503 }
      );
    }
    
    // Rate limiting
    if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please wait before trying again.',
          isRateLimit: true
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        }
      );
    }
  }
  
  // Generic server error for unknown issues
  return NextResponse.json(
    { error: `Failed to complete ${context}` },
    { status: 500 }
  );
}

/**
 * Wrapper function to execute database operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string = 'database operation'
): Promise<T | NextResponse> {
  try {
    return await operation();
  } catch (error) {
    return handleApiError(error, context);
  }
}