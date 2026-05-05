import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * PATCH /api/events/[eventId]/forms/[formId]/responses/[responseId]/shortlist
 * Update shortlist status - Direct database access
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string; formId: string; responseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('[TeamLane Shortlist API] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { shortlisted } = await request.json();

    console.log('[TeamLane Shortlist API] Request:', {
      eventId: resolvedParams.eventId,
      formId: resolvedParams.formId,
      responseId: resolvedParams.responseId,
      userId: session.user.id,
      shortlisted
    });

    if (typeof shortlisted !== 'boolean') {
      return NextResponse.json({ error: 'Invalid shortlisted value' }, { status: 400 });
    }

    if (!ObjectId.isValid(resolvedParams.responseId)) {
      return NextResponse.json({ error: 'Invalid response ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Check if user is a member of the community conducting this event
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
      console.log('[TeamLane Shortlist API] Event not found:', resolvedParams.eventId);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

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

    const isAdmin = community.admins && (
      community.admins.includes(session.user.id) ||
      community.admins.some((admin: any) => admin.toString() === session.user.id)
    );

    const isCreator = event.creatorId === session.user.id || 
                      event.creatorId?.toString() === session.user.id;

    const hasAccess = isMember || isAdmin || isCreator;

    console.log('[TeamLane Shortlist API] Authorization:', {
      userId: session.user.id,
      isMember,
      isAdmin,
      isCreator,
      hasAccess
    });

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Forbidden - You must be a member of the community to perform this action' 
      }, { status: 403 });
    }

    console.log('[TeamLane Shortlist API] ✅ User authorized, proceeding with shortlist');

    // Update the response
    const result = await db.collection('formResponses').updateOne(
      { _id: new ObjectId(resolvedParams.responseId) },
      { 
        $set: { 
          shortlisted,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    console.log('[TeamLane Shortlist API] ✅ Updated response:', resolvedParams.responseId, 'shortlisted:', shortlisted);

    return NextResponse.json({ 
      success: true,
      shortlisted,
      message: shortlisted ? 'Response shortlisted' : 'Removed from shortlist'
    });
  } catch (error) {
    console.error('[TeamLane Shortlist API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update shortlist status' },
      { status: 500 }
    );
  }
}
