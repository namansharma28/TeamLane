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
  Settings,
  Menu,
  Grid,
  ExternalLink,
  Briefcase,
  Users as UsersIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

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

export function MobileNav() {
  const pathname = usePathname();
  const params = useParams() || {};
  const currentTeamId = params.teamId as string;
  const [lastTeamId, setLastTeamId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  
  const isProduction = process.env.NODE_ENV === 'production';
  const gravitasUrl = isProduction ? 'https://gravitas.grafene.in' : 'http://localhost:3000';
  const teamlaneUrl = isProduction ? 'https://teamlane.grafene.in' : 'http://localhost:3001';
  
  // Save the current teamId in localStorage when it changes
  useEffect(() => {
    if (currentTeamId) {
      localStorage.setItem('lastVisitedTeamId', currentTeamId);
      setLastTeamId(currentTeamId);
    } else if (typeof window !== 'undefined') {
      const savedTeamId = localStorage.getItem('lastVisitedTeamId');
      setLastTeamId(savedTeamId);
    }
  }, [currentTeamId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col gap-4 mt-6">
          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const teamIdToUse = currentTeamId || lastTeamId;
              
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
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          <Separator />

          {/* App Switcher Section */}
          <div className="flex flex-col gap-2">
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Switch Application
            </div>
            
            <a 
              href={gravitasUrl}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
            >
              <UsersIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">Gravitas</div>
                <div className="text-xs text-muted-foreground">Communities & Events</div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            
            <a 
              href={teamlaneUrl}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
            >
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">TeamLane</div>
                <div className="text-xs text-muted-foreground">Team Collaboration</div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
