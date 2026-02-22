import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * POST /api/teams/join
 * Join a team using a join code
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Join code is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find team with this code
    const team = await db.collection("teams").findOne({
      code: code.toUpperCase()
    });

    if (!team) {
      return NextResponse.json(
        { error: "Invalid join code" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const isMember = team.members.some(
      (m: any) => m.email === session.user.email
    );

    if (isMember) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 400 }
      );
    }

    // Add user to team
    await db.collection("teams").updateOne(
      { _id: team._id },
      {
        $push: {
          members: {
            email: session.user.email,
            role: "member",
            joinedAt: new Date().toISOString()
          }
        } as any,
        $set: {
          updatedAt: new Date().toISOString()
        }
      }
    );

    // Track code usage
    await db.collection("teamCodeUsage").insertOne({
      teamId: team._id.toString(),
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      code: code.toUpperCase(),
      joinedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      teamId: team._id.toString(),
      teamName: team.name,
      message: `Successfully joined ${team.name}`
    });
  } catch (error) {
    console.error("Error joining team:", error);
    return NextResponse.json(
      { error: "Failed to join team" },
      { status: 500 }
    );
  }
}
