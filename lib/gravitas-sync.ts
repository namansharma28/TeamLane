// Utility for syncing data between TeamLane and Gravitas
import { ObjectId } from 'mongodb';

const GRAVITAS_API_URL = process.env.GRAVITAS_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://gravitas.grafene.in' 
    : 'http://localhost:3001');

// Shared secret for internal API calls between apps
const SYNC_SECRET = process.env.SYNC_SECRET || 'your-sync-secret-key';

interface SyncMemberPayload {
  communityId: string;
  userId: string;
  email: string;
  role: 'admin' | 'member';
  action: 'add' | 'remove' | 'promote' | 'demote';
}

/**
 * Sync member changes to Gravitas community
 */
export async function syncCommunityMember(payload: SyncMemberPayload): Promise<boolean> {
  try {
    const response = await fetch(`${GRAVITAS_API_URL}/api/sync/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Secret': SYNC_SECRET,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to sync community member:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error syncing community member:', error);
    return false;
  }
}
