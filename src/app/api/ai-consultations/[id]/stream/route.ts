import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { aiConsultations, consultationMessages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const { id: consultationId } = await params;
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify consultation belongs to user
    const consultation = await db.select().from(aiConsultations)
      .where(eq(aiConsultations.id, consultationId))
      .limit(1);
    
    const consultationRecord = consultation[0];
    if (!consultationRecord || consultationRecord.patientId !== userId) {
      return new NextResponse('Consultation not found', { status: 404 });
    }



    // Set up Server-Sent Events
    const encoder = new TextEncoder();
    let lastMessageCount = 0;
    let isConnected = true;

    // Get initial message count
    const initialMessages = await db.select().from(consultationMessages)
      .where(eq(consultationMessages.consultationId, consultationId))
      .orderBy(desc(consultationMessages.createdAt));
    
    lastMessageCount = initialMessages.length;
    console.log('📡 SSE connection established for consultation:', consultationId, 'Initial message count:', lastMessageCount);

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const data = `data: ${JSON.stringify({ type: 'connected', messageCount: lastMessageCount })}\n\n`;
        controller.enqueue(encoder.encode(data));

        // Send initial heartbeat
        const heartbeatData = `data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        })}\n\n`;
        controller.enqueue(encoder.encode(heartbeatData));

        // Poll for new messages every 2 seconds
        const pollInterval = setInterval(async () => {
          if (!isConnected) {
            clearInterval(pollInterval);
            return;
          }

          try {
            // Check for new messages
            const currentMessages = await db.select().from(consultationMessages)
              .where(eq(consultationMessages.consultationId, consultationId))
              .orderBy(desc(consultationMessages.createdAt));

            const currentMessageCount = currentMessages.length;

            if (currentMessageCount > lastMessageCount) {
              console.log('📨 New messages detected via SSE:', currentMessageCount - lastMessageCount);
              
              // Get the latest messages
              const newMessages = currentMessages.slice(0, currentMessageCount - lastMessageCount);
              
              // Check if any new message is from AI
              const hasAiResponse = newMessages.some(msg => 
                msg.senderType === 'ai' || msg.senderType === 'ai_provider'
              );

              if (hasAiResponse) {
                const data = `data: ${JSON.stringify({ 
                  type: 'ai_response', 
                  messageCount: currentMessageCount,
                  newMessages: newMessages.length
                })}\n\n`;
                controller.enqueue(encoder.encode(data));
              } else {
                const data = `data: ${JSON.stringify({ 
                  type: 'new_message', 
                  messageCount: currentMessageCount,
                  newMessages: newMessages.length
                })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }

              lastMessageCount = currentMessageCount;
            }
          } catch (error: unknown) {
            console.error('❌ Error polling for messages in SSE:', error);
            // Send error event
            const data = `data: ${JSON.stringify({ type: 'error', message: 'Polling error' })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }, 2000);

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (!isConnected) {
            clearInterval(heartbeatInterval);
            return;
          }
          
          try {
            const heartbeatData = `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`;
            controller.enqueue(encoder.encode(heartbeatData));
          } catch (error: unknown) {
            console.error('❌ Error sending heartbeat:', error);
            clearInterval(heartbeatInterval);
          }
        }, 30000);

        // Clean up on close
        const cleanup = () => {
          console.log('🔌 SSE connection closed for consultation:', consultationId);
          isConnected = false;
          clearInterval(pollInterval);
          clearInterval(heartbeatInterval);
          try {
            controller.close();
          } catch (error: unknown) {
            console.error('❌ Error closing controller:', error);
          }
        };

        request.signal.addEventListener('abort', cleanup);
      },
      
      cancel() {
        console.log('🔌 SSE stream cancelled for consultation:', consultationId);
        isConnected = false;
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error: unknown) {
    console.error('❌ Error in SSE endpoint:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';