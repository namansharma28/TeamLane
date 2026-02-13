"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutGrid, 
  ListTodo, 
  FileText, 
  MessageSquare, 
  Users, 
  Settings
} from "lucide-react";

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    title: "Boards",
    href: "/boards",
    icon: ListTodo,
  },
  {
    title: "Notes",
    href: "/notes",
    icon: FileText,
  },
  {
    title: "Chat",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Team",
    href: "/team",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    teamSettings: true,
  },
];

export function MainNav() {
  const pathname = usePathname();
  const params = useParams() || {};
  const currentTeamId = params.teamId as string;
  const [lastTeamId, setLastTeamId] = useState<string | null>(null);
  
  // Save the current teamId in localStorage when it changes
  useEffect(() => {
    if (currentTeamId) {
      localStorage.setItem('lastVisitedTeamId', currentTeamId);
      setLastTeamId(currentTeamId);
    } else if (typeof window !== 'undefined') {
      // Try to get the last visited teamId from localStorage
      const savedTeamId = localStorage.getItem('lastVisitedTeamId');
      setLastTeamId(savedTeamId);
    }
  }, [currentTeamId]);

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {mainNavItems.map((item) => {
        const Icon = item.icon;
        
        // If we have a current teamId, use it; otherwise try to use the last visited teamId
        const teamIdToUse = currentTeamId || lastTeamId;
        
        // For team settings, we want to go to the team settings page, not user settings
        let href;
        if (item.teamSettings) {
          href = teamIdToUse ? `/${teamIdToUse}/settings` : "/team-selection";
        } else {
          href = teamIdToUse ? `/${teamIdToUse}${item.href}` : "/team-selection";
        }
        
        const isActive = pathname === href || pathname?.startsWith(`${href}/`);
        
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-purple-600 dark:hover:text-purple-400 relative group",
              isActive
                ? "text-purple-600 dark:text-purple-400"
                : "text-muted-foreground"
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span className="hidden md:inline-block">{item.title}</span>
            {isActive && (
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}