'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, STALE_TIME, CACHE_TIME } from '../query-client';

interface TeamMember {
  email: string;
  role: string;
  joinedAt: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt: string;
  boardCount: number;
}

interface RecentActivity {
  teamName: string;
  boardName: string;
  taskTitle: string;
  taskStatus: string;
  updatedAt: string;
}

interface DashboardData {
  teams: Team[];
  recentActivity: RecentActivity[];
  meta: {
    fetchedAt: string;
    userId: string;
    teamCount: number;
  };
}

async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch('/api/composite/dashboard');
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard');
  }
  
  return response.json();
}

export function useDashboard(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.dashboard.composite(),
    queryFn: fetchDashboard,
    enabled: options?.enabled !== false,
    staleTime: STALE_TIME.short, // Dashboard changes frequently (30 seconds)
    gcTime: CACHE_TIME.short, // Keep in cache for 5 minutes
  });
}
