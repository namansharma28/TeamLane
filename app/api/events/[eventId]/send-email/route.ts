import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendTeamEmail } from '@/lib/email';

/**
 * POST /api/events/[eventId]/send-email
 * Send email to team members
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('[TeamLane Email API] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { recipients, subject, message } = await request.json();

    console.log('[TeamLane Email API] Request:', {
      eventId: resolvedParams.eventId,
      userId: session.user.id,
      recipientCount: recipients?.length
    });

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients are required' }, { status: 400 });
    }

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Verify user has permission (event creator or community admin)
    // Try both with and without ObjectId conversion for eventId
    let event = null;
    if (ObjectId.isValid(resolvedParams.eventId)) {
      event = await db.collection('events').findOne({
        _id: new ObjectId(resolvedParams.eventId)
      });
    }
    
    // If not found, try as string ID
    if (!event) {
      event = await db.collection('events').findOne({
        _id: resolvedParams.eventId as any
      });
    }

    if (!event) {
      console.log('[TeamLane Email API] Event not found:', resolvedParams.eventId);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    console.log('[TeamLane Email API] Event found:', {
      eventId: event._id,
      creatorId: event.creatorId,
      communityId: event.communityId
    });

    const community = await db.collection('communities').findOne({
      _id: new ObjectId(event.communityId)
    });

    const isAuthorized = 
      event.creatorId === session.user.id ||
      event.creatorId?.toString() === session.user.id ||
      (community && community.admins && (
        community.admins.includes(session.user.id) ||
        community.admins.some((admin: any) => admin.toString() === session.user.id)
      ));

    console.log('[TeamLane Email API] Authorization check:', {
      eventCreatorId: event.creatorId,
      sessionUserId: session.user.id,
      communityAdmins: community?.admins,
      isAuthorized
    });

    if (!isAuthorized) {
      return NextResponse.json({ 
        error: 'Forbidden - You do not have permission to manage this event' 
      }, { status: 403 });
    }

    // Send email
    await sendTeamEmail(recipients, subject, message, event.name);

    console.log('[TeamLane Email API] ✅ Sent email to', recipients.length, 'recipients');

    return NextResponse.json({ 
      success: true,
      message: `Email sent to ${recipients.length} recipient(s)`
    });
  } catch (error) {
    console.error('[TeamLane Email API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
