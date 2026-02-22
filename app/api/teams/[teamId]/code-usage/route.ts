import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/teams/[teamId]/code-usage
 * Get list of users who joined using the team code
 * Only accessible by team admins
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Check if user is admin of this team
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(params.teamId),
      "members.email": session.user.email,
      "members.role": "admin"
    });

    if (!team) {
      return NextResponse.json(
        { error: "Not authorized or team not found" },
        { status: 403 }
      );
    }

    // Get code usage history
    const usageHistory = await db.collection("teamCodeUsage")
      .find({ teamId: params.teamId })
      .sort({ joinedAt: -1 })
      .toArray();

    return NextResponse.json({
      usage: usageHistory.map(record => ({
        userId: record.userId,
        userEmail: record.userEmail,
        userName: record.userName,
        code: record.code,
        joinedAt: record.joinedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching code usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch code usage" },
      { status: 500 }
    );
  }
}
