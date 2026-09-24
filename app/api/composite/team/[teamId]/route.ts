import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;
    const { db } = await connectToDatabase();
    const userEmail = session.user.email;

    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    const team = await db.collection('teams').findOne({
      _id: new ObjectId(teamId),
      'members.email': userEmail
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    // Parallel fetch boards, notes count, messages count
    const [boards, notesCount, messagesCount] = await Promise.all([
      db.collection('boards')
        .find({ teamId: teamId })
        .project({ title: 1, description: 1, category: 1, createdAt: 1, updatedAt: 1 })
        .sort({ updatedAt: -1 })
        .toArray(),
      db.collection('notes').countDocuments({ teamId: new ObjectId(teamId) }),
      db.collection('messages').countDocuments({ teamId: new ObjectId(teamId) })
    ]);

    const boardIdsStr = boards.map(b => b._id.toString());
    const boardMap = new Map(boards.map(b => [b._id.toString(), b.title]));

    let totalStats = { total: 0, completed: 0, inProgress: 0, todo: 0 };
    let boardStatsMap = new Map<string, { total: number; completed: number }>();
    let recentActivity: any[] = [];

    if (boardIdsStr.length > 0) {
      // Direct indexed task aggregation
      const taskAggregation = await db.collection('tasks').aggregate([
        { $match: { boardId: { $in: boardIdsStr } } },
        {
          $group: {
            _id: '$boardId',
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] }
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
            },
            todo: {
              $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] }
            }
          }
        }
      ]).toArray();

      taskAggregation.forEach(stat => {
        boardStatsMap.set(stat._id, { total: stat.total, completed: stat.completed });
        totalStats.total += stat.total;
        totalStats.completed += stat.completed;
        totalStats.inProgress += stat.inProgress;
        totalStats.todo += stat.todo;
      });

      // Recent activity
      const recentTasks = await db.collection('tasks')
        .find({ boardId: { $in: boardIdsStr } })
        .sort({ updatedAt: -1 })
        .limit(10)
        .toArray();

      recentActivity = recentTasks.map(activity => ({
        id: activity._id.toString(),
        user: {
          name: activity.assignedTo || 'Unknown',
          initials: (activity.assignedTo || 'U')[0].toUpperCase()
        },
        action: 'updated',
        target: activity.title,
        time: activity.updatedAt || new Date().toISOString(),
        board: boardMap.get(activity.boardId) || 'Board'
      }));
    }

    return NextResponse.json({
      team: {
        _id: team._id,
        name: team.name,
        description: team.description,
        members: team.members,
        createdAt: team.createdAt
      },
      boards: boards.map(board => ({
        _id: board._id,
        title: board.title,
        description: board.description,
        category: board.category || 'General',
        createdAt: board.createdAt,
        updatedAt: board.updatedAt
      })),
      stats: {
        tasks: {
          total: totalStats.total,
          completed: totalStats.completed,
          inProgress: totalStats.inProgress,
          todo: totalStats.todo,
          overdue: 0
        },
        notes: {
          total: notesCount,
          updatedToday: 0
        },
        messages: {
          total: messagesCount,
          conversations: 0
        }
      },
      boardStats: boards.map(board => {
        const stats = boardStatsMap.get(board._id.toString()) || { total: 0, completed: 0 };
        return {
          id: board._id.toString(),
          title: board.title,
          totalTasks: stats.total,
          completedTasks: stats.completed
        };
      }),
      recentActivity,
      meta: {
        fetchedAt: new Date().toISOString(),
        userId: userEmail,
        boardCount: boards.length,
        memberCount: team.members.length
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60',
        'X-API-Version': 'composite-v1'
      }
    });
  } catch (error: any) {
    console.error('Error fetching team composite:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch team data' },
      { status: 500 }
    );
  }
}
