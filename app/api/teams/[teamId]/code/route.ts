import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { ObjectId } from 'mongodb';

// Helper function to generate a random code
function generateTeamCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Track who joined using the code
async function trackCodeUsage(db: any, teamId: string, userId: string, userEmail: string) {
  await db.collection('teamCodeUsage').insertOne({
    teamId,
    userId,
    userEmail,
    joinedAt: new Date()
  });
}

interface RouteContext {
  params: Promise<{
    teamId: string;
  }>;
}

// GET /api/teams/[teamId]/code - Get team join code
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate teamId
    if (!ObjectId.isValid(params.teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Check if user is an admin of the team
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(params.teamId),
      "members.email": session.user.email
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found or you're not a member" }, { status: 404 });
    }

    // Check user's role
    const currentUser = team.members.find((member: any) => member.email === session?.user?.email);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: "Only admins can access the join code" }, { status: 403 });
    }

    // If the team doesn't have a code yet, generate one
    if (!team.code) {
      const code = generateTeamCode();
      await db.collection("teams").updateOne(
        { _id: new ObjectId(params.teamId) },
        { $set: { code } }
      );
      return NextResponse.json({ code });
    }

    return NextResponse.json({ code: team.code });
  } catch (error) {
    console.error("Error fetching team code:", error);
    return NextResponse.json(
      { error: "Failed to fetch team code" },
      { status: 500 }
    );
  }
}

// POST /api/teams/[teamId]/code - Regenerate team join code
export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate teamId
    if (!ObjectId.isValid(params.teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Check if user is an admin of the team
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(params.teamId),
      "members.email": session.user.email
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found or you're not a member" }, { status: 404 });
    }

    // Check user's role
    const currentUser = team.members.find((member: any) => member.email === session?.user?.email);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: "Only admins can regenerate the join code" }, { status: 403 });
    }

    // Generate a new code
    const code = generateTeamCode();
    const result = await db.collection("teams").updateOne(
      { _id: new ObjectId(params.teamId) },
      { $set: { code } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update team code" }, { status: 500 });
    }

    return NextResponse.json({ code });
  } catch (error) {
    console.error("Error regenerating team code:", error);
    return NextResponse.json(
      { error: "Failed to regenerate team code" },
      { status: 500 }
    );
  }
} 