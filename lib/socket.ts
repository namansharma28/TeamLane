// WARNING: THIS FILE SHOULD ONLY BE IMPORTED ON THE SERVER SIDE
// For client-side socket.io code, use socketClient.ts instead

import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

// Socket event types - must match client-side events

export const SOCKET_EVENTS = {
  TASK_CREATED: 'task-created',
  TASK_UPDATED: 'task-updated',
  TASK_DELETED: 'task-deleted',
  BOARD_UPDATED: 'board-updated',
};

export async function emitSocketEvent(req: Request, event: string, data: any, room: string) {
  try {
    const socketEmitUrl = new URL('/api/socket/emit', req.url).toString();
    const cookieHeader = req.headers.get('cookie') || '';
    const internalSecret = process.env.NEXTAUTH_SECRET || 'teamlane-internal-secret';
    await fetch(socketEmitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        'x-internal-secret': internalSecret,
      },
      body: JSON.stringify({
        event,
        data,
        room,
      }),
    });
  } catch (error) {
    console.error('Failed to emit socket event:', error);
  }
}


// Initialize a socket.io server
export const initSocketServer = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.io server...");
    
    // Create new socket.io server
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket/io',
      addTrailingSlash: false,
    });
    
    // Store io instance on the server object
    res.socket.server.io = io;
    
    // Set up socket event handlers
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Handle joining board-specific rooms
      socket.on('join-board', (boardId: string) => {
        socket.join(`board-${boardId}`);
        console.log(`Socket ${socket.id} joined board-${boardId}`);
      });
      
      // Handle leaving board-specific rooms
      socket.on('leave-board', (boardId: string) => {
        socket.leave(`board-${boardId}`);
        console.log(`Socket ${socket.id} left board-${boardId}`);
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
    
    console.log("Socket.io server initialized");
  } else {
    console.log("Using existing Socket.io server");
  }
  
  return res.socket.server.io;
}; 
