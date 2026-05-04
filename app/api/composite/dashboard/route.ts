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

    // Fetch all dashboard data in parallel for maximum performance
    const [teams, recentActivity] = await Promise.all([
      // User's teams with member count
      db.collection('teams')
        .find({
          'members.email': userEmail
        })
        .project({ 
          name: 1, 
          description: 1, 
          members: 1, 
          createdAt: 1 
        })
        .sort({ createdAt: -1 })
        .toArray(),

      // Recent activity across all user's teams (last 10 activities)
      db.collection('teams')
        .aggregate([
          {
            $match: {
              'members.email': userEmail
            }
          },
          {
            $lookup: {
              from: 'boards',
              localField: '_id',
              foreignField: 'teamId',
              as: 'boards'
            }
          },
          {
            $unwind: {
              path: '$boards',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'tasks',
              localField: 'boards._id',
              foreignField: 'boardId',
              as: 'tasks'
            }
          },
          {
            $unwind: {
              path: '$tasks',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $sort: { 'tasks.updatedAt': -1 }
          },
          {
            $limit: 10
          },
          {
            $project: {
              teamName: '$name',
              boardName: '$boards.name',
              taskTitle: '$tasks.title',
              taskStatus: '$tasks.status',
              updatedAt: '$tasks.updatedAt'
            }
          }
        ])
        .toArray()
    ]);

    // Get board counts for each team
    const teamIds = teams.map(team => team._id);
    const boardCounts = await db.collection('boards')
      .aggregate([
        {
          $match: {
            teamId: { $in: teamIds }
          }
        },
        {
          $group: {
            _id: '$teamId',
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();

    // Map board counts to teams
    const boardCountMap = new Map(
      boardCounts.map(bc => [bc._id.toString(), bc.count])
    );

    // Enrich teams with board counts
    const enrichedTeams = teams.map(team => ({
      ...team,
      boardCount: boardCountMap.get(team._id.toString()) || 0
    }));

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
