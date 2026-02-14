import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const SYNC_SECRET = process.env.SYNC_SECRET || 'your-sync-secret-key';

function verifySyncRequest(request: Request): boolean {
  const syncSecret = request.headers.get('X-Sync-Secret');
  return syncSecret === SYNC_SECRET;
}

/**
 * DELETE /api/sync/teams/[teamId]
 * Delete a team when its linked community is deleted
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    if (!verifySyncRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await context.params;

    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const result = await db.collection("teams").deleteOne({
      _id: new ObjectId(teamId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Error deleting linked team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
