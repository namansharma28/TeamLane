"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Grid, Users, Briefcase, ExternalLink } from "lucide-react";

export function AppSwitcher() {
  const isProduction = process.env.NODE_ENV === 'production';
  const gravitasUrl = isProduction ? 'https://gravitas.grafene.in' : 'http://localhost:3000';
  const teamlaneUrl = isProduction ? 'https://teamlane.grafene.in' : 'http://localhost:3001';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Grid className="h-4 w-4" />
          <span className="hidden sm:inline">Apps</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Application</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a 
            href={gravitasUrl}
            className="flex items-center cursor-pointer"
          >
            <Users className="mr-2 h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">Gravitas</div>
              <div className="text-xs text-muted-foreground">Communities & Events</div>
            </div>
            <ExternalLink className="h-3 w-3 ml-2 text-muted-foreground" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a 
            href={teamlaneUrl}
            className="flex items-center cursor-pointer"
          >
            <Briefcase className="mr-2 h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">TeamLane</div>
              <div className="text-xs text-muted-foreground">Team Collaboration</div>
            </div>
            <ExternalLink className="h-3 w-3 ml-2 text-muted-foreground" />
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
