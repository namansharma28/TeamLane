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

    // Fetch all team-related data in parallel
    const [team, boards, dashboardData] = await Promise.all([
      // Team details with members
      db.collection('teams').findOne({
        _id: new ObjectId(teamId),
        'members.email': userEmail
      }),

      // All boards for this team
      db.collection('boards')
        .find({ teamId: teamId }) // Changed from ObjectId to string
        .project({ title: 1, description: 1, category: 1, createdAt: 1, updatedAt: 1 })
        .sort({ updatedAt: -1 })
        .toArray(),

      // Dashboard stats
      db.collection('boards')
        .aggregate([
          { $match: { teamId: teamId } }, // Changed from ObjectId to string
          {
            $addFields: {
              boardIdString: { $toString: '$_id' }
            }
          },
          {
            $lookup: {
              from: 'tasks',
              localField: 'boardIdString',
              foreignField: 'boardId',
              as: 'tasks'
            }
          },
          {
            $project: {
              title: 1,
              tasks: 1,
              totalTasks: { $size: '$tasks' },
              completedTasks: {
                $size: {
                  $filter: {
                    input: '$tasks',
                    as: 'task',
                    cond: { $eq: ['$$task.status', 'done'] }
                  }
                }
              },
              inProgressTasks: {
                $size: {
                  $filter: {
                    input: '$tasks',
                    as: 'task',
                    cond: { $eq: ['$$task.status', 'in-progress'] }
                  }
                }
              },
              todoTasks: {
                $size: {
                  $filter: {
                    input: '$tasks',
                    as: 'task',
                    cond: { $eq: ['$$task.status', 'todo'] }
                  }
                }
              }
            }
          }
        ])
        .toArray()
    ]);

    if (!team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    // Calculate total stats
    const totalStats = dashboardData.reduce((acc, board) => ({
      total: acc.total + board.totalTasks,
      completed: acc.completed + board.completedTasks,
      inProgress: acc.inProgress + board.inProgressTasks,
      todo: acc.todo + board.todoTasks
    }), { total: 0, completed: 0, inProgress: 0, todo: 0 });

    // Get recent activity (last 10 task updates)
    const recentActivity = await db.collection('tasks')
      .aggregate([
        {
          $match: {
            boardId: { $in: boards.map(b => b._id.toString()) }
          }
        },
        { $sort: { updatedAt: -1 } },
        { $limit: 10 },
        {
          $addFields: {
            boardIdObj: { $toObjectId: '$boardId' }
          }
        },
        {
          $lookup: {
            from: 'boards',
            localField: 'boardIdObj',
            foreignField: '_id',
            as: 'board'
          }
        },
        {
          $unwind: '$board'
        },
        {
          $project: {
            title: 1,
            status: 1,
            assignedTo: 1,
            updatedAt: 1,
            boardName: '$board.title'
          }
        }
      ])
      .toArray();

    // Get notes count
    const notesCount = await db.collection('notes')
      .countDocuments({ teamId: new ObjectId(teamId) });

    // Get messages count
    const messagesCount = await db.collection('messages')
      .countDocuments({ teamId: new ObjectId(teamId) });

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
          overdue: 0 // TODO: Calculate overdue tasks
        },
        notes: {
          total: notesCount,
          updatedToday: 0 // TODO: Calculate notes updated today
        },
        messages: {
          total: messagesCount,
          conversations: 0 // TODO: Calculate unique conversations
        }
      },
      boardStats: dashboardData.map(board => ({
        id: board._id.toString(),
        title: board.title,
        totalTasks: board.totalTasks,
        completedTasks: board.completedTasks
      })),
      recentActivity: recentActivity.map(activity => ({
        id: activity._id.toString(),
        user: {
          name: activity.assignedTo || 'Unknown',
          initials: (activity.assignedTo || 'U')[0].toUpperCase()
        },
        action: 'updated',
        target: activity.title,
        time: activity.updatedAt,
        board: activity.boardName
      })),
      meta: {
        fetchedAt: new Date().toISOString(),
        userId: userEmail,
        boardCount: boards.length,
        memberCount: team.members.length
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
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
