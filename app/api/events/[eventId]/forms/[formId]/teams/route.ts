import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/events/[eventId]/forms/[formId]/teams
 * Get all teams that have registered for this event through the form
 * Direct database access - no need to call Gravitas API
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string; formId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { db } = await connectToDatabase();

    // Verify form exists
    if (!ObjectId.isValid(resolvedParams.formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    const form = await db.collection('forms').findOne({
      _id: new ObjectId(resolvedParams.formId),
      eventId: resolvedParams.eventId
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Get all form responses
    const responses = await db.collection('formResponses')
      .find({ formId: new ObjectId(resolvedParams.formId) })
      .toArray();

    console.log('[TeamLane Teams API] Found responses:', responses.length);

    // Extract team IDs from responses
    const teamIds = new Set<string>();
    const teamToResponseMap = new Map<string, any>();
    
    responses.forEach(response => {
      response.answers.forEach((answer: any) => {
        const field = form.fields.find((f: any) => f.id === answer.fieldId && f.type === 'team');
        if (field && answer.value) {
          const teamId = answer.value.toString();
          teamIds.add(teamId);
          teamToResponseMap.set(teamId, {
            responseId: response._id.toString(),
            shortlisted: response.shortlisted || false,
            checkedIn: response.checkedIn || false
          });
        }
      });
    });

    console.log('[TeamLane Teams API] Extracted team IDs:', Array.from(teamIds));

    // Fetch team details
    const teams = await db.collection('teams')
      .find({
        _id: { $in: Array.from(teamIds).map(id => new ObjectId(id)) }
      })
      .toArray();

    // Get user details for team members
    const userEmails = teams.flatMap(team => team.members?.map((m: any) => m.email) || []);
    const users = await db.collection('users')
      .find({ email: { $in: userEmails } })
      .toArray();

    // Transform teams with member details
    const transformedTeams = teams.map(team => {
      const members = (team.members || []).map((member: any) => {
        const user = users.find(u => u.email === member.email);
        return {
          email: member.email,
          name: user?.name || member.email.split('@')[0],
          image: user?.image,
          role: member.role,
          joinedAt: member.joinedAt
        };
      });

      const teamId = team._id.toString();
      const responseData = teamToResponseMap.get(teamId);

      return {
        id: teamId,
        name: team.name,
        description: team.description,
        memberCount: members.length,
        members,
        linkedCommunityId: team.linkedCommunityId,
        linkedCommunityHandle: team.linkedCommunityHandle,
        createdAt: team.createdAt,
        responseId: responseData?.responseId,
        shortlisted: responseData?.shortlisted || false,
        checkedIn: responseData?.checkedIn || false
      };
    });

    return NextResponse.json({ teams: transformedTeams });
  } catch (error) {
    console.error('[TeamLane Teams API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}
