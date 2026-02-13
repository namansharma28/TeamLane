import React from "react";
import { Task } from "@/lib/models/task";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trash, Clock, CalendarIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface KanbanTaskProps {
  task: Task;
  onUpdate: (updatedTask: Partial<Task>) => void;
  onDelete: () => void;
  isAdmin: boolean;
  isFocused?: boolean;
  isDragging?: boolean;
}

export function KanbanTask({
  task,
  onUpdate,
  onDelete,
  isAdmin,
  isFocused = false,
  isDragging = false,
}: KanbanTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    low: "bg-blue-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
  };

  const handleStatusChange = (newStatus: "todo" | "in-progress" | "done") => {
    onUpdate({ status: newStatus });
  };

  const formattedDate = task.dueDate
    ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })
    : null;

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${isFocused ? 'ring-2 ring-primary' : ''} cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow`}
    >
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
        {task.description && (
          <div className="text-xs text-muted-foreground mt-1">{task.description}</div>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-2 items-center">
          {task.priority && (
            <Badge variant="outline" className="text-xs">
              <div
                className={`w-2 h-2 rounded-full mr-1 ${
                  priorityColors[task.priority as keyof typeof priorityColors]
                }`}
              ></div>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
          )}
          
          {formattedDate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {formattedDate}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        {task.assignee ? (
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.assignee.avatar} />
            <AvatarFallback className="text-xs">{task.assignee.initials}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-6 w-6"></div>  
        )}
        
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7">
              <Trash className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 