import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('[Teams API] No session or email found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('[Teams API] Fetching teams for user:', session.user.email);
    
    const { db } = await connectToDatabase();
    const teams = await db.collection("teams").find({
      "members.email": session.user.email
    }).toArray();

    console.log('[Teams API] Found teams:', teams.length);
    return NextResponse.json(teams);
  } catch (error) {
    console.error("[Teams API] Error fetching teams:", error);
    console.error("[Teams API] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        hasMongoUri: !!process.env.MONGODB_URI,
        hasMongoDb: !!process.env.MONGODB_DB,
      }
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch teams",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const result = await db.collection("teams").insertOne({
      name,
      members: [{
        email: session.user.email,
        role: "admin",
        joinedAt: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      _id: result.insertedId,
      name,
      members: [{
        email: session.user.email,
        role: "admin",
        joinedAt: new Date().toISOString()
      }]
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}