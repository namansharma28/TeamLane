import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * PATCH /api/events/[eventId]/forms/[formId]/responses/[responseId]/checkin
 * Update check-in status - Direct database access
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
    const { checkedIn } = await request.json();

    if (typeof checkedIn !== 'boolean') {
      return NextResponse.json({ error: 'Invalid checkedIn value' }, { status: 400 });
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
    const updateData: any = { 
      checkedIn,
      updatedAt: new Date()
    };

    // If checking in, set the checkedInAt timestamp
    if (checkedIn) {
      updateData.checkedInAt = new Date();
    } else {
      // If unchecking, remove the timestamp
      updateData.checkedInAt = null;
    }

    const result = await db.collection('formResponses').updateOne(
      { _id: new ObjectId(resolvedParams.responseId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    console.log('[TeamLane CheckIn API] Updated response:', resolvedParams.responseId, 'checkedIn:', checkedIn);

    return NextResponse.json({ 
      success: true,
      checkedIn,
      message: checkedIn ? 'Checked in successfully' : 'Check-in removed'
    });
  } catch (error) {
    console.error('[TeamLane CheckIn API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update check-in status' },
      { status: 500 }
    );
  }
}
