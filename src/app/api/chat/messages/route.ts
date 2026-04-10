import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { chatMessages, conversations, messageAttachments } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { geminiHealthService } from '@/lib/services/geminiService';
import { UploadedFile } from '@/lib/services/geminiService';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns the conversation
    const conversation = await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conversationId, content, messageType = 'text', attachments = [] } = body;

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'Conversation ID and content are required' },
        { status: 400 }
      );
    }

    // Verify user owns the conversation
    const conversation = await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Create the message
    const newMessage = await db
      .insert(chatMessages)
      .values({
        conversationId,
        senderId: userId,
        senderType: 'user',
        content,
        messageType,
        hasAttachments: attachments.length > 0,
        isRead: false,
      })
      .returning();

    // Save attachments if any
    const savedAttachments = [];
    if (attachments.length > 0) {
      for (const attachment of attachments) {
        const savedAttachment = await db
          .insert(messageAttachments)
          .values({
            messageId: newMessage[0].id,
            fileName: attachment.fileName,
            originalName: attachment.originalName,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            fileUrl: attachment.fileUrl,
            thumbnailUrl: attachment.thumbnailUrl,
            isPrescription: attachment.isPrescription || false,
            metadata: attachment.metadata || {},
          })
          .returning();
        savedAttachments.push(savedAttachment[0]);
      }
    }

    // Update conversation's last message timestamp
    await db
      .update(conversations)
      .set({ 
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));

    // Generate AI response using Gemini
    setTimeout(async () => {
      try {
        // Get user's medical history from conversation or user profile
        const userMedicalHistory = conversation[0].notes || undefined;
        
        let aiResponse: string;
        
        // If there are attachments, use full diagnostic analysis
        if (attachments.length > 0) {
          // Convert attachments to UploadedFile format for Gemini
          const uploadedFiles: UploadedFile[] = attachments.map((att: any) => ({
            name: att.originalName,
            type: att.fileType,
            size: att.fileSize,
            content: att.fileUrl, // This would be the file content in a real implementation
            isImage: att.fileType.startsWith('image/'),
            base64: att.base64Data // This would contain the base64 data
          }));
          
          // Use full diagnostic analysis for images
          const diagnosticResult = await geminiHealthService.analyzeFullDiagnostic({
            symptoms: content ? [content] : [],
            additionalInfo: content,
            uploadedFiles
          });
          
          // Format the response
          aiResponse = `**Analysis Complete**\n\n${diagnosticResult.analysis}\n\n`;
          
          if (diagnosticResult.possibleConditions.length > 0) {
            aiResponse += `**Possible Conditions:**\n${diagnosticResult.possibleConditions.map(c => `• ${c}`).join('\n')}\n\n`;
          }
          
          if (diagnosticResult.recommendations.length > 0) {
            aiResponse += `**Recommendations:**\n${diagnosticResult.recommendations.map(r => `• ${r}`).join('\n')}\n\n`;
          }
          
          if (diagnosticResult.documentAnalysis) {
            aiResponse += `**Document Analysis:**\n${diagnosticResult.documentAnalysis}\n\n`;
          }
          
          aiResponse += `**⚠️ Important:** ${diagnosticResult.disclaimer}`;
          
          // Update attachment analysis status
          for (const attachment of savedAttachments) {
            await db
              .update(messageAttachments)
              .set({
                analysisStatus: 'completed',
                analysisResult: {
                  analysis: diagnosticResult.analysis,
                  conditions: diagnosticResult.possibleConditions,
                  recommendations: diagnosticResult.recommendations,
                  urgencyLevel: diagnosticResult.urgencyLevel
                }
              })
              .where(eq(messageAttachments.id, attachment.id));
          }
        } else {
          // Regular chat response for text-only messages
          aiResponse = await geminiHealthService.chatWithAssistant(
            content,
            userMedicalHistory
          );
        }
        
        await db
          .insert(chatMessages)
          .values({
            conversationId,
            senderId: conversation[0].doctorId,
            senderType: 'doctor',
            content: aiResponse,
            messageType: 'text',
            isRead: false,
          });

        await db
          .update(conversations)
          .set({ 
            lastMessageAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(conversations.id, conversationId));
      } catch (error) {
        console.error('Error generating AI response:', error);
        // Fallback to a generic response if AI fails
        const fallbackResponse = "I'm having trouble processing your message right now. Please try again, and if the issue persists, consider consulting with a healthcare professional.";
        
        await db
          .insert(chatMessages)
          .values({
            conversationId,
            senderId: conversation[0].doctorId,
            senderType: 'doctor',
            content: fallbackResponse,
            messageType: 'text',
            isRead: false,
          });
      }
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds

    return NextResponse.json({ message: newMessage[0] }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}