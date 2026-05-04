import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { ObjectId } from 'mongodb';
import { SOCKET_EVENTS, emitSocketEvent } from '@/lib/socket'; 

interface RouteContext {
  params: Promise<{
    teamId: string;
    boardId: string;
    taskId: string;
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
    
    // Verify user is member of team
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(params.teamId),
      "members.email": session.user.email
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Fetch the specific task
    const task = await db.collection("tasks").findOne({
      _id: new ObjectId(params.taskId),
      boardId: params.boardId // String comparison
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Convert MongoDB _id to string
    const taskWithStringId = {
      ...task,
      _id: task._id.toString()
    };

    return NextResponse.json({ task: taskWithStringId });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    
    // Verify user is member of team
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(params.teamId),
      "members.email": session.user.email
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get the existing task for status tracking
    const existingTask = await db.collection("tasks").findOne({
      _id: new ObjectId(params.taskId),
      boardId: params.boardId // String comparison
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get update data from request
    const updateData = await request.json();
    
    // Remove immutable fields that shouldn't be updated
    const { _id, createdAt, createdBy, boardId, ...safeUpdateData } = updateData;
    
    // Update the task
    const result = await db.collection("tasks").updateOne(
      { _id: new ObjectId(params.taskId), boardId: params.boardId }, // String comparison
      { 
        $set: {
          ...safeUpdateData,
          updatedAt: new Date().toISOString(),
          updatedBy: {
            email: session.user.email,
            name: session.user.name || session.user.email
          }
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Track if board stats were updated
    let boardUpdated = false;

    // Update board completion stats if status changed
    if (safeUpdateData.status && safeUpdateData.status !== existingTask.status) {
      boardUpdated = true;
      // Task was moved to "done"
      if (safeUpdateData.status === "done") {
        await db.collection("boards").updateOne(
          { _id: new ObjectId(params.boardId) }, // Use ObjectId for boards collection
          { $inc: { completedTasks: 1 } }
        );
      }
      // Task was moved from "done"
      else if (existingTask.status === "done") {
        await db.collection("boards").updateOne(
          { _id: new ObjectId(params.boardId) }, // Use ObjectId for boards collection
          { $inc: { completedTasks: -1 } }
        );
      }
    }

    // Fetch the updated task
    const updatedTask = await db.collection("tasks").findOne({
      _id: new ObjectId(params.taskId)
    });

    // Convert MongoDB _id to string
    const taskWithStringId = {
      ...updatedTask,
      _id: updatedTask?._id.toString()
    };

    // Emit socket event for task update
    await emitSocketEvent(
      request,
      SOCKET_EVENTS.TASK_UPDATED,
      { task: taskWithStringId, boardId: params.boardId },
      `board-${params.boardId}`
    );

    // If board stats were updated, emit board update event
    if (boardUpdated) {
      // Fetch updated board
      const updatedBoard = await db.collection("boards").findOne({
        _id: new ObjectId(params.boardId)
      });

      // Convert MongoDB _id to string
      const boardWithStringId = {
        ...updatedBoard,
        _id: updatedBoard?._id.toString()
      };

      await emitSocketEvent(
        request,
        SOCKET_EVENTS.BOARD_UPDATED,
        { board: boardWithStringId },
        `board-${params.boardId}`
      );
    }

    return NextResponse.json({ 
      message: "Task updated successfully", 
      task: taskWithStringId 
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    // Verify user is member of team
    const team = await db.collection("teams").findOne({
      _id: new ObjectId(params.teamId),
      "members.email": session.user.email
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get the task to check its status
    const task = await db.collection("tasks").findOne({
      _id: new ObjectId(params.taskId),
      boardId: params.boardId // String comparison
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Save task data before deletion for the socket event
    const deletedTask = {
      ...task,
      _id: task._id.toString()
    };

    // Delete the task
    const result = await db.collection("tasks").deleteOne({
      _id: new ObjectId(params.taskId),
      boardId: params.boardId // String comparison
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Update board stats
    await db.collection("boards").updateOne(
      { _id: new ObjectId(params.boardId) },
      { $inc: { totalTasks: -1 } }
    );

    // If the deleted task was completed, decrement completedTasks
    if (task.status === "done") {
      await db.collection("boards").updateOne(
        { _id: new ObjectId(params.boardId) },
        { $inc: { completedTasks: -1 } }
      );
    }

    // Fetch updated board data
    const updatedBoard = await db.collection("boards").findOne({
      _id: new ObjectId(params.boardId)
    });

    // Convert MongoDB _id to string
    const boardWithStringId = {
      ...updatedBoard,
      _id: updatedBoard?._id.toString()
    };

    // Emit socket events
    await emitSocketEvent(
      request,
      SOCKET_EVENTS.TASK_DELETED,
      { 
        taskId: params.taskId, 
        boardId: params.boardId,
        task: deletedTask
      },
      `board-${params.boardId}`
    );

    await emitSocketEvent(
      request,
      SOCKET_EVENTS.BOARD_UPDATED,
      { board: boardWithStringId },
      `board-${params.boardId}`
    );

    return NextResponse.json({ 
      message: "Task deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
} 