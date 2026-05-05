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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { shortlisted } = await request.json();

    if (typeof shortlisted !== 'boolean') {
      return NextResponse.json({ error: 'Invalid shortlisted value' }, { status: 400 });
    }

    if (!ObjectId.isValid(resolvedParams.responseId)) {
      return NextResponse.json({ error: 'Invalid response ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Verify user has permission (event creator or community admin)
    const event = await db.collection('events').findOne({
      _id: new ObjectId(resolvedParams.eventId)
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const community = await db.collection('communities').findOne({
      _id: new ObjectId(event.communityId)
    });

    const isAuthorized = 
      event.creatorId === session.user.id ||
      (community && community.admins && community.admins.includes(session.user.id));

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    console.log('[TeamLane Shortlist API] Updated response:', resolvedParams.responseId, 'shortlisted:', shortlisted);

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
