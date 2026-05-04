'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { useParams } from 'next/navigation';
import { LoadingPage } from "@/components/ui/loading-page";
import { TrendingUp, Activity, Target, BarChart3 } from "lucide-react";
import { useTeam } from "@/lib/services/client";
import { useSocket } from "@/hooks/useSocket";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/services/query-client";

export default function DashboardPage() {
  const params = useParams();
  const teamId = params?.teamId as string;
  const queryClient = useQueryClient();
  
  const { data: teamData, isLoading: loading, error } = useTeam(teamId);
  const { socket, EVENTS } = useSocket(teamId);

  // Listen for task updates and invalidate team data to refetch
  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdate = () => {
      // Invalidate and refetch team data when any task is updated
      queryClient.invalidateQueries({ queryKey: queryKeys.team.composite(teamId) });
    };

    // Listen to all task-related events
    socket.on(EVENTS.TASK_CREATED, handleTaskUpdate);
    socket.on(EVENTS.TASK_UPDATED, handleTaskUpdate);
    socket.on(EVENTS.TASK_DELETED, handleTaskUpdate);

    return () => {
      socket.off(EVENTS.TASK_CREATED, handleTaskUpdate);
      socket.off(EVENTS.TASK_UPDATED, handleTaskUpdate);
      socket.off(EVENTS.TASK_DELETED, handleTaskUpdate);
    };
  }, [socket, EVENTS, teamId, queryClient]);

  if (loading) return <LoadingPage />;
  if (error || !teamData) return <div className="p-6 text-center text-muted-foreground">No dashboard data available.</div>;

  // Calculate overview data (last 7 days mock data - you can enhance this)
  const overview = [
    { name: 'Mon', completed: 5, inProgress: 3, pending: 2 },
    { name: 'Tue', completed: 8, inProgress: 2, pending: 1 },
    { name: 'Wed', completed: 6, inProgress: 4, pending: 3 },
    { name: 'Thu', completed: 10, inProgress: 1, pending: 2 },
    { name: 'Fri', completed: 7, inProgress: 3, pending: 1 },
    { name: 'Sat', completed: 4, inProgress: 2, pending: 1 },
    { name: 'Sun', completed: 3, inProgress: 1, pending: 2 }
  ];

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 mx-2">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base">Welcome back! Here&apos;s an overview of your workspace.</p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <DashboardStats stats={teamData.stats} />

      {/* Main Content Grid */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Task Insights */}
        <Card className="lg:col-span-4 shadow-lg">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              Task Insights
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Task distribution and status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 pt-0">
            {/* Status Distribution */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Status Distribution</h4>
              <div className="flex h-2 sm:h-2.5 md:h-3 w-full overflow-hidden rounded-full bg-muted">
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
              <div className="flex flex-wrap justify-between gap-2 mt-2 sm:mt-3 text-[10px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full"></div>
                  <span className="hidden sm:inline">Completed ({teamData.stats.tasks.completed})</span>
                  <span className="sm:hidden">Done ({teamData.stats.tasks.completed})</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-primary rounded-full"></div>
                  <span className="hidden sm:inline">In Progress ({teamData.stats.tasks.inProgress})</span>
                  <span className="sm:hidden">Active ({teamData.stats.tasks.inProgress})</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-muted-foreground rounded-full"></div>
                  <span>Todo ({teamData.stats.tasks.todo})</span>
                </div>
              </div>
            </div>
            
            {/* Overdue Tasks */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Overdue Tasks</h4>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-full bg-muted h-2 sm:h-2.5 md:h-3 rounded-full overflow-hidden">
                  {teamData.stats.tasks.total > 0 && (
                    <div 
                      className="h-full bg-destructive" 
                      style={{ width: `${(teamData.stats.tasks.overdue / teamData.stats.tasks.total) * 100}%` }}
                    />
                  )}
                </div>
                <div className="text-xs sm:text-sm font-medium min-w-12 sm:min-w-16 md:min-w-20 text-right">
                  {teamData.stats.tasks.overdue} / {teamData.stats.tasks.total}
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
                {teamData.stats.tasks.overdue === 0 
                  ? "No overdue tasks - great job! 🎉" 
                  : `${teamData.stats.tasks.overdue} tasks past their due date`}
              </p>
            </div>
            
            {/* Completion Trend */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Completion Trend (Last 7 Days)</h4>
              <div className="flex items-end h-16 sm:h-20 md:h-24 w-full gap-1 sm:gap-1.5 md:gap-2">
                {overview.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2">
                    <div className="relative w-full flex justify-center">
                      <div 
                        className="w-full bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
                        style={{ height: `${Math.max(day.completed * 4, 4)}px` }}
                      ></div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium">{day.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Most Active Boards */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Most Active Boards</h4>
              <div className="space-y-1.5 sm:space-y-2">
                {teamData.boardStats.slice(0, 3).map((board) => (
                  <div key={board.id} className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full flex-shrink-0"></div>
                      <span className="text-xs sm:text-sm font-medium truncate">{board.title}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0 ml-2">
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
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Latest updates from your team</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <RecentActivity activities={teamData.recentActivity} />
          </CardContent>
        </Card>
      </div>
      
      {/* Board Task Breakdown */}
      <Card className="shadow-lg">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
            Task Breakdown by Board
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Task completion status for each board</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
            {teamData.boardStats.map((board) => (
              <div 
                key={board.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 md:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-2 sm:gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-xs sm:text-sm md:text-base truncate">{board.title}</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                    {board.completedTasks} of {board.totalTasks} tasks completed
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="w-full sm:w-24 md:w-32 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300" 
                      style={{ width: `${board.totalTasks ? (board.completedTasks / board.totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="w-10 sm:w-12 md:w-16 text-right font-semibold text-xs sm:text-sm">
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
