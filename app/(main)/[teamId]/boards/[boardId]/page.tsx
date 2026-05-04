"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BoardHeader } from "@/components/boards/board-header";
import { BoardProps } from "@/components/boards/boards-list";
import { TaskList } from "@/components/boards/task-list";
import { CreateTaskDialog } from "@/components/boards/create-task-dialog";
import { useSession } from "next-auth/react";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "react-hot-toast";
import { KanbanBoard } from '@/components/boards/kanban-board';
import { BoardSkeleton } from '@/components/boards/board-skeleton';
import { Task } from "@/lib/models/task";

export default function BoardPage() {
  const params = useParams() || {};
  const teamId = params.teamId as string;
  const boardId = params.boardId as string;
  const { data: session } = useSession();
  const { socket, status: socketStatus, emitEvent, EVENTS } = useSocket(boardId);
  
  const [board, setBoard] = useState<{
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
  } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Optimized: Single API call to fetch both board and tasks
  const fetchBoardAndTasks = async () => {
    try {
      if (!session?.user?.email) {
        return;
      }

      setLoading(true);
      
      // Single composite API call instead of two separate calls
      const response = await fetch(`/api/teams/${teamId}/boards/${boardId}/composite`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load board data');
      }
      
      const data = await response.json();
      
      // Set all data at once
      setBoard(data.board);
      setTasks(data.tasks);
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error('Error in fetchBoardAndTasks:', error);
      toast.error(error instanceof Error ? error.message : "Failed to load board data");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (session) {
      fetchBoardAndTasks();
    }
  }, [teamId, boardId, session]);

  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        setCreateTaskOpen(true);
      }
      
      if (e.altKey && e.key === 'v') {
        e.preventDefault();
        setViewMode(viewMode === 'board' ? 'list' : 'board');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (data: { task: Task, boardId: string }) => {
      if (data.boardId === boardId) {
        setTasks(current => {
          if (current.some(task => task._id === data.task._id)) {
            return current;
          }
          return [...current, data.task];
        });
        
        if (data.task.createdBy?.email !== session?.user?.email) {
          toast.success(`${data.task.createdBy?.name || 'Someone'} added: ${data.task.title}`);
        }
      }
    };

    const handleTaskUpdated = (data: { task: Task, boardId: string }) => {
      if (data.boardId === boardId) {
        // Update task in state (this will update other clients and sync current client with server)
        setTasks(current => 
          current.map(task => task._id === data.task._id ? data.task : task)
        );
        
        // Only show toast for updates from other users
        const isOwnUpdate = data.task.updatedBy?.email === session?.user?.email;
        if (!isOwnUpdate) {
          toast.success(`${data.task.updatedBy?.name || 'Someone'} updated: ${data.task.title}`);
        }
      }
    };

    const handleTaskDeleted = (data: { taskId: string, boardId: string, task: Task }) => {
      if (data.boardId === boardId) {
        setTasks(current => current.filter(task => task._id !== data.taskId));
        
        if (data.task.updatedBy?.email !== session?.user?.email) {
          toast.success(`Task removed: ${data.task.title}`);
        }
      }
    };

    const handleBoardUpdated = (data: { board: BoardProps }) => {
      setBoard(data.board);
    };

    socket.on(EVENTS.TASK_CREATED, handleTaskCreated);
    socket.on(EVENTS.TASK_UPDATED, handleTaskUpdated);
    socket.on(EVENTS.TASK_DELETED, handleTaskDeleted);
    socket.on(EVENTS.BOARD_UPDATED, handleBoardUpdated);

    return () => {
      socket.off(EVENTS.TASK_CREATED, handleTaskCreated);
      socket.off(EVENTS.TASK_UPDATED, handleTaskUpdated);
      socket.off(EVENTS.TASK_DELETED, handleTaskDeleted);
      socket.off(EVENTS.BOARD_UPDATED, handleBoardUpdated);
    };
  }, [socket, boardId, EVENTS, session?.user?.email]);

  // Load view preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`boardView_${teamId}`);
      if (saved === 'board' || saved === 'list') {
        setViewMode(saved);
      }
    }
  }, [teamId]);

  // Recalculate board stats when tasks change
  useEffect(() => {
    if (board && tasks.length > 0) {
      const completedCount = tasks.filter(task => task.status === 'done').length;
      const totalCount = tasks.length;
      
      // Only update if stats have changed
      if (board.completedTasks !== completedCount || board.totalTasks !== totalCount) {
        setBoard(prev => prev ? {
          ...prev,
          completedTasks: completedCount,
          totalTasks: totalCount
        } : null);
      }
    }
  }, [tasks, board]);

  const handleCreateTask = async (newTask: Omit<Task, '_id' | 'createdAt'>) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/boards/${boardId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }
      
      const data = await response.json();
      setTasks([...tasks, data.task]);
      setCreateTaskOpen(false);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error("Failed to create task");
    }
  };

  const handleTaskUpdate = async (taskId: string, updatedTask: Partial<Task>) => {
    // Optimistic update - update UI immediately
    const previousTasks = tasks;
    setTasks(current => 
      current.map(task => 
        task._id === taskId 
          ? { ...task, ...updatedTask } 
          : task
      )
    );

    // Make API call to persist the change
    try {
      const response = await fetch(`/api/teams/${teamId}/boards/${boardId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      // Socket event will update other clients
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      
      // Revert optimistic update on error
      setTasks(previousTasks);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    // Optimistic update - remove from UI immediately
    const previousTasks = tasks;
    setTasks(current => current.filter(task => task._id !== taskId));

    // Make API call to persist the deletion
    try {
      const response = await fetch(`/api/teams/${teamId}/boards/${boardId}/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }

      toast.success('Task deleted successfully');
      // Socket event will update other clients
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      
      // Revert optimistic update on error
      setTasks(previousTasks);
    }
  };

  const filteredTasks = activeTab === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === activeTab);

  const handleToggleView = (mode: 'board' | 'list') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`boardView_${teamId}`, mode);
    }
  };

  if (loading) return <BoardSkeleton />;
  if (!board) return <div className="p-6 text-center text-muted-foreground">Board not found</div>;

  return (
    <div className="flex flex-col space-y-4 sm:space-y-6 min-h-screen p-3 sm:p-4 md:p-6 pt-0">
      {/* Compact Board Header with Merged Controls */}
      <BoardHeader 
        board={{
          ...board,
          tasks: tasks // Pass the current tasks array for progress calculation
        }} 
        isAdmin={isAdmin}
        viewMode={viewMode}
        onViewModeChange={handleToggleView}
        onUpdate={(updatedBoard) => setBoard(updatedBoard)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddTask={() => setCreateTaskOpen(true)}
      />

      {/* Main Content */}
      <div className="bg-background rounded-xl shadow-lg border p-3 sm:p-4 md:p-6">
        {viewMode === 'board' ? (
          <KanbanBoard 
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            activeTab={activeTab}
            isAdmin={isAdmin}
          />
        ) : (
          <TaskList 
            tasks={filteredTasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            activeTab={activeTab}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onCreateTask={handleCreateTask}
        boardId={boardId}
        teamId={teamId}
      />
    </div>
  );
}
