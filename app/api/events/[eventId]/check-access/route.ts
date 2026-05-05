import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/events/[eventId]/check-access
 * Check if user has access to view event teams
 * User must be a member of the community conducting the event
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { db } = await connectToDatabase();

    // Find the event
    let event = null;
    if (ObjectId.isValid(resolvedParams.eventId)) {
      event = await db.collection('events').findOne({
        _id: new ObjectId(resolvedParams.eventId)
      });
    }
    
    if (!event) {
      event = await db.collection('events').findOne({
        _id: resolvedParams.eventId as any
      });
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Find the community
    const community = await db.collection('communities').findOne({
      _id: new ObjectId(event.communityId)
    });

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    // Check if user is a member of the community
    const isMember = community.members && (
      community.members.includes(session.user.id) ||
      community.members.some((member: any) => member.toString() === session.user.id)
    );

    // Check if user is an admin
    const isAdmin = community.admins && (
      community.admins.includes(session.user.id) ||
      community.admins.some((admin: any) => admin.toString() === session.user.id)
    );

    // Check if user is the event creator
    const isCreator = event.creatorId === session.user.id || 
                      event.creatorId?.toString() === session.user.id;

    const hasAccess = isMember || isAdmin || isCreator;

    console.log('[TeamLane Access Check]', {
      eventId: event._id,
      userId: session.user.id,
      communityId: community._id,
      isMember,
      isAdmin,
      isCreator,
      hasAccess
    });

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Forbidden - You must be a member of the community to view this page',
        communityHandle: community.handle
      }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true,
      communityHandle: community.handle,
      communityName: community.name
    });
  } catch (error) {
    console.error('[TeamLane Access Check] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    );
  }
}
