import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, LayoutGrid, List, Plus } from "lucide-react";
import { Task } from "@/lib/models/task";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BoardProps {
  board: {
    title: string;
    description?: string;
    isStarred?: boolean;
    category?: string;
    members?: Array<{
      id: string;
      name: string;
      avatar?: string;
      initials: string;
    }>;
    tasks?: Task[];
    completedTasks?: number;
    totalTasks?: number;
  };
  isAdmin: boolean;
  viewMode: 'board' | 'list';
  onViewModeChange: (mode: 'board' | 'list') => void;
  onUpdate: (board: any) => void;
  // New props for merged controls
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onAddTask?: () => void;
}

export function BoardHeader({ 
  board, 
  isAdmin, 
  viewMode, 
  onViewModeChange, 
  onUpdate,
  activeTab = "all",
  onTabChange,
  onAddTask
}: BoardProps) {
  
  const tasksCount = {
    total: board.tasks?.length || 0,
    completed: board.tasks?.filter((task: Task) => task.status === 'done').length || 0
  };

  const completionPercentage = tasksCount.total > 0 
    ? Math.round((tasksCount.completed / tasksCount.total) * 100) 
    : 0;

  return (
    <div className="bg-background rounded-xl shadow-lg border">
      {/* Main Header Row */}
      <div className="p-3 sm:p-4 border-b">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Board Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight truncate">
                  {board.title}
                </h1>
                {board.isStarred && (
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                )}
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {board.category || "General"}
                </Badge>
              </div>
              {board.description && (
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 truncate">
                  {board.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: View Toggle & Add Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'board' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('board')}
                className="h-7 px-2"
              >
                <LayoutGrid className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline text-xs">Board</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="h-7 px-2"
              >
                <List className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline text-xs">List</span>
              </Button>
            </div>
            
            {onAddTask && (
              <Button 
                onClick={onAddTask}
                size="sm"
                className="h-7"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline text-xs">Add Task</span>
                <span className="sm:hidden text-xs">Add</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Stats & Tabs */}
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Progress & Team */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium whitespace-nowrap">
                Progress: {completionPercentage}%
              </div>
              <div className="w-24 sm:w-32 h-1.5">
                <Progress value={completionPercentage} className="h-1.5" />
              </div>
            </div>
            
            {/* Team Members */}
            {board.members && board.members.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="text-xs font-medium">Team:</div>
                <div className="flex -space-x-2">
                  {board.members.slice(0, 3).map((member) => (
                    <Avatar key={member.id} className="border-2 border-background h-6 w-6">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-[10px]">{member.initials}</AvatarFallback>
                    </Avatar>
                  ))}
                  {board.members.length > 3 && (
                    <div className="flex items-center justify-center bg-muted text-muted-foreground border-2 border-background rounded-full h-6 w-6 text-[10px]">
                      +{board.members.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Tabs (for list view) */}
          {viewMode === 'list' && onTabChange && (
            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full sm:w-auto my-2">
              <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex h-8">
                <TabsTrigger value="all" className="text-xs h-7">All</TabsTrigger>
                <TabsTrigger value="todo" className="text-xs h-7">To Do</TabsTrigger>
                <TabsTrigger value="in-progress" className="text-xs h-7">In Progress</TabsTrigger>
                <TabsTrigger value="done" className="text-xs h-7">Done</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-2 pt-2 border-t text-[10px] text-muted-foreground hidden lg:flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">Alt+N</kbd>
            New task
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono">Alt+V</kbd>
            Toggle view
          </span>
        </div>
      </div>
    </div>
  );
} 
