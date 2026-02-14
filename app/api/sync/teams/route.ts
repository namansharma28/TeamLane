import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { headers } from "next/headers";

const SYNC_SECRET = process.env.SYNC_SECRET || 'your-sync-secret-key';

// Middleware to verify sync requests
function verifySyncRequest(request: Request): boolean {
  const syncSecret = request.headers.get('X-Sync-Secret');
  return syncSecret === SYNC_SECRET;
}

/**
 * POST /api/sync/teams
 * Create a team linked to a Gravitas community
 * Called by Gravitas when a community is created
 */
export async function POST(request: Request) {
  try {
    // Verify this is an internal sync request
    if (!verifySyncRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, linkedCommunityId, linkedCommunityHandle, members } = await request.json();

    if (!name || !linkedCommunityId || !linkedCommunityHandle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if team already exists for this community
    const existingTeam = await db.collection("teams").findOne({
      linkedCommunityId
    });

    if (existingTeam) {
      return NextResponse.json({
        teamId: existingTeam._id.toString(),
        message: "Team already exists"
      });
    }

    // Create the team
    const result = await db.collection("teams").insertOne({
      name,
      description: description || '',
      linkedCommunityId,
      linkedCommunityHandle,
      members: members.map((m: any) => ({
        email: m.email,
        role: m.role,
        joinedAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      teamId: result.insertedId.toString(),
      message: "Team created successfully"
    });
  } catch (error) {
    console.error("Error creating linked team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
