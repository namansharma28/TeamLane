import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const userEmail = session.user.email;

    // 1. Fetch user's teams with projection
    const teams = await db.collection('teams')
      .find({ 'members.email': userEmail })
      .project({ name: 1, description: 1, members: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    if (teams.length === 0) {
      return NextResponse.json({
        teams: [],
        recentActivity: [],
        meta: {
          fetchedAt: new Date().toISOString(),
          userId: userEmail,
          teamCount: 0,
        },
      });
    }

    const teamIdObjs = teams.map(t => t._id);
    const teamIdStrs = teams.map(t => t._id.toString());
    const allTeamIdMatches = [...teamIdObjs, ...teamIdStrs];

    // 2. Fetch boards and board counts in parallel safely matching string or ObjectId teamId
    const [boards, boardCounts] = await Promise.all([
      db.collection('boards')
        .find({ teamId: { $in: allTeamIdMatches } })
        .project({ name: 1, teamId: 1 })
        .toArray(),
      db.collection('boards')
        .aggregate([
          { $match: { teamId: { $in: allTeamIdMatches } } },
          { $group: { _id: '$teamId', count: { $sum: 1 } } }
        ])
        .toArray()
    ]);

    const boardMap = new Map(boards.map(b => [b._id ? b._id.toString() : '', b]));
    const boardCountMap = new Map();
    boardCounts.forEach(bc => {
      if (bc._id) {
        boardCountMap.set(bc._id.toString(), bc.count);
      }
    });

    const teamMap = new Map();
    teams.forEach(t => {
      if (t._id) {
        teamMap.set(t._id.toString(), t.name);
      }
    });

    const boardIdObjs = boards.map(b => b._id);
    const boardIdStrs = boards.map(b => b._id.toString());
    const allBoardIdMatches = [...boardIdObjs, ...boardIdStrs];

    // 3. Fetch recent 10 tasks across user boards
    let recentActivity: any[] = [];
    if (allBoardIdMatches.length > 0) {
      const recentTasks = await db.collection('tasks')
        .find({ boardId: { $in: allBoardIdMatches } })
        .sort({ updatedAt: -1 })
        .limit(10)
        .toArray();

      recentActivity = recentTasks.map(task => {
        const bIdStr = task.boardId ? task.boardId.toString() : '';
        const board = boardMap.get(bIdStr);
        const tIdStr = board?.teamId ? board.teamId.toString() : '';
        const teamName = teamMap.get(tIdStr) || '';
        return {
          teamName,
          boardName: board?.name || '',
          taskTitle: task.title || '',
          taskStatus: task.status || '',
          updatedAt: task.updatedAt || new Date().toISOString(),
        };
      });
    }

    // Enrich teams with board counts
    const enrichedTeams = teams.map(team => {
      const idStr = team._id ? team._id.toString() : '';
      return {
        ...team,
        boardCount: boardCountMap.get(idStr) || 0
      };
    });

    return NextResponse.json({
      teams: enrichedTeams,
      recentActivity: recentActivity.filter(a => a.taskTitle), // Filter out empty activities
      meta: {
        fetchedAt: new Date().toISOString(),
        userId: userEmail,
        teamCount: teams.length,
      },
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
        'X-API-Version': 'composite-v1',
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard composite:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}
