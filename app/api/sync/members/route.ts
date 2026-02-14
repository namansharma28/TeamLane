import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const SYNC_SECRET = process.env.SYNC_SECRET || 'your-sync-secret-key';

function verifySyncRequest(request: Request): boolean {
  const syncSecret = request.headers.get('X-Sync-Secret');
  return syncSecret === SYNC_SECRET;
}

/**
 * POST /api/sync/members
 * Sync member changes from Gravitas to TeamLane
 */
export async function POST(request: Request) {
  try {
    if (!verifySyncRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, email, role, action } = await request.json();

    if (!teamId || !email || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const team = await db.collection("teams").findOne({
      _id: new ObjectId(teamId)
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    switch (action) {
      case 'add':
        // Add new member
        await db.collection("teams").updateOne(
          { _id: new ObjectId(teamId) },
          {
            $addToSet: {
              members: {
                email,
                role: role || 'member',
                joinedAt: new Date().toISOString()
              }
            },
            $set: { updatedAt: new Date().toISOString() }
          }
        );
        break;

      case 'remove':
        // Remove member
        await db.collection("teams").updateOne(
          { _id: new ObjectId(teamId) },
          {
            $pull: {
              members: { email } as any
            },
            $set: { updatedAt: new Date().toISOString() }
          }
        );
        break;

      case 'update':
        // Update member role
        await db.collection("teams").updateOne(
          { _id: new ObjectId(teamId), "members.email": email },
          {
            $set: {
              "members.$.role": role,
              updatedAt: new Date().toISOString()
            }
          }
        );
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ message: "Member synced successfully" });
  } catch (error) {
    console.error("Error syncing team member:", error);
    return NextResponse.json(
      { error: "Failed to sync member" },
      { status: 500 }
    );
  }
}
