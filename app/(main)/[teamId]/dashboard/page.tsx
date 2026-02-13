'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LoadingPage } from "@/components/ui/loading-page";
import { TrendingUp, Activity, Target, Users, BarChart3 } from "lucide-react";

interface DashboardData {
  stats: {
    tasks: {
      total: number;
      completed: number;
      todo: number;
      inProgress: number;
      overdue: number;
    };
    notes: {
      total: number;
      updatedToday: number;
    };
    messages: {
      total: number;
      conversations: number;
    };
  };
  overview: {
    name: string;
    completed: number;
    inProgress: number;
    pending: number;
  }[];
  recentActivity: {
    id: string;
    user: {
      name: string;
      avatar?: string;
      initials: string;
    };
    action: string;
    target: string;
    time: string;
    board: string;
  }[];
  boardStats: {
    id: string;
    title: string;
    totalTasks: number;
    completedTasks: number;
  }[];
  team: any;
}

export default function DashboardPage() {
  const params = useParams();
  const teamId = params?.teamId as string;
  const [teamData, setTeamData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}/dashboard`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch team data');
        }
        const data = await response.json();
        setTeamData(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  if (loading) return <LoadingPage />;
  if (!teamData) return <div className="p-6 text-center text-muted-foreground">No dashboard data available.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s an overview of your workspace.</p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <DashboardStats stats={teamData.stats} />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Task Insights */}
        <Card className="lg:col-span-4 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Task Insights
            </CardTitle>
            <CardDescription>Task distribution and status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Distribution */}
            <div>
              <h4 className="text-sm font-medium mb-3">Status Distribution</h4>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                {teamData.stats.tasks.total > 0 ? (
                  <>
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${(teamData.stats.tasks.completed / teamData.stats.tasks.total) * 100}%` }}
                      title={`Completed: ${teamData.stats.tasks.completed}`}
                    />
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${(teamData.stats.tasks.inProgress / teamData.stats.tasks.total) * 100}%` }}
                      title={`In Progress: ${teamData.stats.tasks.inProgress}`}
                    />
                    <div 
                      className="h-full bg-muted-foreground" 
                      style={{ width: `${(teamData.stats.tasks.todo / teamData.stats.tasks.total) * 100}%` }}
                      title={`Todo: ${teamData.stats.tasks.todo}`}
                    />
                  </>
                ) : <div className="text-xs text-center w-full">No tasks</div>}
              </div>
              <div className="flex justify-between mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Completed ({teamData.stats.tasks.completed})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span>In Progress ({teamData.stats.tasks.inProgress})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                  <span>Todo ({teamData.stats.tasks.todo})</span>
                </div>
              </div>
            </div>
            
            {/* Overdue Tasks */}
            <div>
              <h4 className="text-sm font-medium mb-3">Overdue Tasks</h4>
              <div className="flex items-center gap-3">
                <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                  {teamData.stats.tasks.total > 0 && (
                    <div 
                      className="h-full bg-destructive" 
                      style={{ width: `${(teamData.stats.tasks.overdue / teamData.stats.tasks.total) * 100}%` }}
                    />
                  )}
                </div>
                <div className="text-sm font-medium min-w-20 text-right">
                  {teamData.stats.tasks.overdue} / {teamData.stats.tasks.total}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {teamData.stats.tasks.overdue === 0 
                  ? "No overdue tasks - great job! 🎉" 
                  : `${teamData.stats.tasks.overdue} tasks past their due date`}
              </p>
            </div>
            
            {/* Completion Trend */}
            <div>
              <h4 className="text-sm font-medium mb-3">Completion Trend (Last 7 Days)</h4>
              <div className="flex items-end h-24 w-full gap-2">
                {teamData.overview.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex justify-center">
                      <div 
                        className="w-full bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
                        style={{ height: `${Math.max(day.completed * 4, 4)}px` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">{day.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Most Active Boards */}
            <div>
              <h4 className="text-sm font-medium mb-3">Most Active Boards</h4>
              <div className="space-y-2">
                {teamData.boardStats.slice(0, 3).map((board) => (
                  <div key={board.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm font-medium truncate">{board.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {board.totalTasks} tasks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates from your team</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity activities={teamData.recentActivity} />
          </CardContent>
        </Card>
      </div>
      
      {/* Board Task Breakdown */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Task Breakdown by Board
          </CardTitle>
          <CardDescription>Task completion status for each board</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamData.boardStats.map((board) => (
              <div 
                key={board.id} 
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{board.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {board.completedTasks} of {board.totalTasks} tasks completed
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300" 
                      style={{ width: `${board.totalTasks ? (board.completedTasks / board.totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="w-16 text-right font-semibold text-sm">
                    {board.totalTasks ? `${Math.round((board.completedTasks / board.totalTasks) * 100)}%` : '0%'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
