import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS, getSocketInstance } from '@/lib/socketClient';
import { toast } from '@/components/ui/use-toast';

type SocketStatus = 'connecting' | 'connected' | 'disconnected';

// Make sure this hook is only used in client components
export function useSocket(boardId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('disconnected');

  // Initialize the socket on the client side only
  useEffect(() => {
    // Safeguard to ensure this only runs on client
    if (typeof window === 'undefined') {
      console.warn('useSocket hook should only be used in client components');
      return;
    }
    
    let socketInstance: Socket;
    
    try {
      socketInstance = getSocketInstance();
      setSocket(socketInstance);
      
      // Set initial status based on current connection state
      setStatus(socketInstance.connected ? 'connected' : 'connecting');
      
      // Set up event listeners
      const onConnect = () => {
        setStatus('connected');
        console.log('Socket connected');
      };
      
      const onDisconnect = () => {
        setStatus('disconnected');
        console.log('Socket disconnected');
      };
      
      const onConnectError = (err: Error) => {
        console.warn('Socket connection error:', err.message);
        setStatus('disconnected');
      };
      
      socketInstance.on('connect', onConnect);
      socketInstance.on('disconnect', onDisconnect);
      socketInstance.on('connect_error', onConnectError);
      
      return () => {
        socketInstance.off('connect', onConnect);
        socketInstance.off('disconnect', onDisconnect);
        socketInstance.off('connect_error', onConnectError);
      };
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      return undefined;
    }
  }, []);
  
  // Join board-specific room when boardId changes
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server-side rendering
    if (!socket || !socket.connected || !boardId) return;
    
    // Join the board-specific room
    socket.emit('join-board', boardId);
    console.log(`Joined board room: board-${boardId}`);
    
    return () => {
      if (socket && socket.connected && boardId) {
        socket.emit('leave-board', boardId);
        console.log(`Left board room: board-${boardId}`);
      }
    };
  }, [socket, boardId, status]);
  
  // Helper to emit events
  const emitEvent = useCallback((event: string, data: any) => {
    if (!socket || !socket.connected) {
      console.warn('Socket not connected, cannot emit event:', event);
      return;
    }
    
    socket.emit(event, data);
  }, [socket]);
  
  return {
    socket,
    status,
    emitEvent,
    EVENTS: SOCKET_EVENTS // Export the events so components can use them
  };
} 