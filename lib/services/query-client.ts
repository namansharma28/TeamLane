/**
 * React Query Client Configuration
 * Based on Gravitas performance patterns
 */

import { QueryClient } from '@tanstack/react-query';

// Stale times - how long data is considered fresh
export const STALE_TIME = {
  short: 1000 * 30,        // 30 seconds - frequently changing (tasks, activity)
  medium: 1000 * 60 * 2,   // 2 minutes - board details
  long: 1000 * 60 * 5,     // 5 minutes - team details
  veryLong: 1000 * 60 * 10 // 10 minutes - user profiles
} as const;

// Cache times - how long to keep unused data
export const CACHE_TIME = {
  short: 1000 * 60 * 5,    // 5 minutes
  medium: 1000 * 60 * 10,  // 10 minutes
  long: 1000 * 60 * 30,    // 30 minutes
  veryLong: 1000 * 60 * 60 // 1 hour
} as const;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME.medium,
        gcTime: CACHE_TIME.medium,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: false,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        networkMode: 'online',
      },
      mutations: {
        retry: 1,
        networkMode: 'online',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return createQueryClient();
  } else {
    if (!browserQueryClient) {
      browserQueryClient = createQueryClient();
    }
    return browserQueryClient;
  }
}

// Query key factories
export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    composite: () => ['dashboard', 'composite'] as const,
  },
  team: {
    all: ['teams'] as const,
    detail: (teamId: string) => ['teams', 'detail', teamId] as const,
    composite: (teamId: string) => ['teams', 'composite', teamId] as const,
    members: (teamId: string) => ['teams', 'detail', teamId, 'members'] as const,
    boards: (teamId: string) => ['teams', 'detail', teamId, 'boards'] as const,
  },
  board: {
    all: ['boards'] as const,
    detail: (boardId: string) => ['boards', 'detail', boardId] as const,
    composite: (boardId: string) => ['boards', 'composite', boardId] as const,
    tasks: (boardId: string) => ['boards', 'detail', boardId, 'tasks'] as const,
  },
  task: {
    all: ['tasks'] as const,
    detail: (taskId: string) => ['tasks', 'detail', taskId] as const,
  },
} as const;

// Cache invalidation helpers
export const invalidateQueries = {
  dashboard: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  },
  team: (queryClient: QueryClient, teamId?: string) => {
    if (teamId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.team.composite(teamId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
    }
  },
  board: (queryClient: QueryClient, boardId?: string) => {
    if (boardId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.board.detail(boardId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.board.composite(boardId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.board.all });
    }
  },
} as const;
