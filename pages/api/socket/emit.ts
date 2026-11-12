import { NextApiRequest } from 'next';
import { initSocketServer, NextApiResponseWithSocket, SOCKET_EVENTS } from '@/lib/socket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// This API route is used to emit socket events from server-side code
export default async function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify caller: either via internal secret or user session
    const internalSecret = process.env.NEXTAUTH_SECRET || 'teamlane-internal-secret';
    const isInternalCall = req.headers['x-internal-secret'] === internalSecret;

    if (!isInternalCall) {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }

    // Initialize socket server if not already initialized
    const io = initSocketServer(req, res);
    
    // Get event data from request body
    const { event, data, room } = req.body;
    
    if (!event) {
      return res.status(400).json({ message: 'Missing event name' });
    }
    
    // Validate that the event is a known socket event
    const validEvents = Object.values(SOCKET_EVENTS);
    if (!validEvents.includes(event)) {
      console.warn(`Warning: Unknown event type: "${event}". Expected one of: ${validEvents.join(', ')}`);
    }
    
    // Emit to a specific room if provided, otherwise emit globally
    if (room) {
      console.log(`Emitting event "${event}" to room "${room}"`);
      io.to(room).emit(event, data);
    } else {
      console.log(`Emitting global event "${event}"`);
      io.emit(event, data);
    }
    
    res.status(200).json({ message: 'Event emitted successfully' });
  } catch (error) {
    console.error('Error emitting socket event:', error);
    res.status(500).json({ message: 'Failed to emit event', error: String(error) });
  }
} 