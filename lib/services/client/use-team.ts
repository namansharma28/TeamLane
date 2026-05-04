'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, STALE_TIME, CACHE_TIME } from '../query-client';

interface TeamMember {
  email: string;
  role: string;
  joinedAt: string;
  name?: string;
  image?: string;
}

interface Board {
  _id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamData {
  team: {
    _id: string;
    name: string;
    description?: string;
    members: TeamMember[];
    createdAt: string;
  };
  boards: Board[];
  stats: {
    tasks: {
      total: number;
      completed: number;
      inProgress: number;
      todo: number;
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
  boardStats: Array<{
    id: string;
    title: string;
    totalTasks: number;
    completedTasks: number;
  }>;
  recentActivity: Array<{
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
  }>;
  meta: {
    fetchedAt: string;
    userId: string;
    boardCount: number;
    memberCount: number;
  };
}

async function fetchTeam(teamId: string): Promise<TeamData> {
  const response = await fetch(`/api/composite/team/${teamId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch team data');
  }
  
  return response.json();
}

export function useTeam(teamId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.team.composite(teamId),
    queryFn: () => fetchTeam(teamId),
    enabled: options?.enabled !== false && !!teamId,
    staleTime: STALE_TIME.medium, // 2 minutes
    gcTime: CACHE_TIME.medium, // 10 minutes
  });
}
