'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, STALE_TIME, CACHE_TIME } from '../query-client';

export interface TeamMember {
  email: string;
  role: string;
  joinedAt: string;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt: string;
  boardCount?: number;
  code?: string;
}

async function fetchTeams(): Promise<Team[]> {
  const response = await fetch('/api/teams', {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch teams');
  }

  return response.json();
}

export function useTeams(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.team.all,
    queryFn: fetchTeams,
    enabled: options?.enabled !== false,
    staleTime: STALE_TIME.long, // 5 minutes
    gcTime: CACHE_TIME.long,    // 30 minutes
    retry: 1,
  });
}

