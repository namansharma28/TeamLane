import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { ObjectId } from 'mongodb';

interface RouteContext {
  params: Promise<{
    teamId: string;
    boardId: string;
  }>;
}

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

    const { db } = await connectToDatabase();
    
    // Verify user is member of team and fetch board + tasks in parallel
    const [team, board, tasks] = await Promise.all([
      db.collection("teams").findOne({
        _id: new ObjectId(params.teamId),
        "members.email": session.user.email
      }),
      db.collection("boards").findOne({
        _id: new ObjectId(params.boardId)
      }),
      db.collection("tasks")
        .find({ boardId: params.boardId })
        .sort({ createdAt: -1 })
        .toArray()
    ]);

    if (!team) {
      return NextResponse.json({ error: "Team not found or access denied" }, { status: 404 });
    }

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Verify board belongs to this team
    if (board.teamId !== params.teamId) {
      return NextResponse.json({ 
        error: "Board not found in this team",
        details: {
          boardTeamId: board.teamId,
          requestedTeamId: params.teamId
        }
      }, { status: 404 });
    }

    // Convert MongoDB _id to string for board
    const boardWithStringId = {
      ...board,
      _id: board._id.toString()
    };

    // Convert MongoDB _id to string for tasks
    const tasksWithStringId = tasks.map(task => ({
      ...task,
      _id: task._id.toString()
    }));

    return NextResponse.json({
      board: boardWithStringId,
      tasks: tasksWithStringId,
      isAdmin: board.createdBy?.email === session.user.email
    }, {
      headers: {
        'Cache-Control': 'private, max-age=10', // Cache for 10 seconds
      }
    });
  } catch (error) {
    console.error("Error fetching board composite:", error);
    return NextResponse.json(
      { error: "Failed to fetch board data" },
      { status: 500 }
    );
  }
}
