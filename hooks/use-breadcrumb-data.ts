"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTeam } from "@/lib/services/client";

interface BreadcrumbData {
  teamData?: {
    id: string;
    name: string;
  };
  boardData?: {
    id: string;
    title: string;
  };
}

export function useBreadcrumbData(): BreadcrumbData {
  const pathname = usePathname();
  const [data, setData] = useState<BreadcrumbData>({});
  const prevDataRef = useRef<BreadcrumbData>({});

  // Parse URL segments - handle null pathname
  const segments = pathname ? pathname.split('/').filter(Boolean) : [];
  const teamId = segments[0];
  const section = segments[1];
  const boardId = section === 'boards' ? segments[2] : undefined;

  // Use cached team data from React Query
  const { data: teamData } = useTeam(teamId, { enabled: !!teamId });

  useEffect(() => {
    const fetchData = async () => {
      const newData: BreadcrumbData = {};

      // Use cached team data if available
      if (teamData?.team) {
        newData.teamData = {
          id: teamData.team._id,
          name: teamData.team.name
        };
      }

      // Fetch board data if needed (and not already cached in team data)
      if (boardId && teamData?.boards) {
        const board = teamData.boards.find(b => b._id === boardId);
        if (board) {
          newData.boardData = {
            id: board._id,
            title: board.title
          };
        }
      }

      // Only update if data actually changed
      const dataChanged = 
        prevDataRef.current.teamData?.id !== newData.teamData?.id ||
        prevDataRef.current.teamData?.name !== newData.teamData?.name ||
        prevDataRef.current.boardData?.id !== newData.boardData?.id ||
        prevDataRef.current.boardData?.title !== newData.boardData?.title;

      if (dataChanged) {
        setData(newData);
        prevDataRef.current = newData;
      }
    };

    fetchData();
  }, [pathname, teamData, boardId]);

  return data;
}
