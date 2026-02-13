"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, Users, ArrowLeftRight } from "lucide-react";
import { TeamMembersDialog } from "@/components/TeamMembersDialog";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { toast } from "react-hot-toast";

export function UserNav() {
  const params = useParams() || {};
  const router = useRouter();
  const { data: session } = useSession();
  const currentTeamId = params?.teamId as string;
  const [lastTeamId, setLastTeamId] = useState<string | null>(null);
  const [isTeamMembersOpen, setIsTeamMembersOpen] = useState(false);
  
  // Save and retrieve the last visited teamId
  useEffect(() => {
    if (currentTeamId) {
      localStorage.setItem('lastVisitedTeamId', currentTeamId);
      setLastTeamId(currentTeamId);
    } else if (typeof window !== 'undefined') {
      const savedTeamId = localStorage.getItem('lastVisitedTeamId');
      setLastTeamId(savedTeamId);
    }
  }, [currentTeamId]);
  
  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("lastVisitedTeamId");
      
      // Sign out from NextAuth with redirect
      await signOut({ 
        redirect: true,
        callbackUrl: "/"
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");
    }
  };
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return 'U';
    return session.user.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
  };
  
  const teamIdToUse = currentTeamId || lastTeamId;
  
  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-purple-50 dark:hover:bg-purple-950/50">
          <Avatar className="h-8 w-8 border-2 border-purple-200 dark:border-purple-800">
            <AvatarImage 
              src={session?.user?.image || ''} 
              alt={session?.user?.name || 'User'} 
            />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border-purple-200/50 dark:border-purple-800/50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-purple-700 dark:text-purple-300">{session?.user?.name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session?.user?.email || ''}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-purple-200/50 dark:bg-purple-800/50" />
        <DropdownMenuGroup>
            {teamIdToUse && (
              <>
                <DropdownMenuItem onClick={() => router.push('/team-selection')} className="hover:bg-purple-50 dark:hover:bg-purple-950/50">
                  <ArrowLeftRight className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span>Switch Team</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault();
                  setIsTeamMembersOpen(true);
                }} className="hover:bg-purple-50 dark:hover:bg-purple-950/50">
                  <Users className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span>Manage Team</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${teamIdToUse}/settings`} className="hover:bg-purple-50 dark:hover:bg-purple-950/50">
                    <Settings className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>Team Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-200/50 dark:bg-purple-800/50" />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/settings" className="hover:bg-indigo-50 dark:hover:bg-indigo-950/50">
                <User className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Profile Settings</span>
              </Link>
            </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-purple-200/50 dark:bg-purple-800/50" />
        <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
      
      {/* Team Members Dialog */}
      {teamIdToUse && (
        <TeamMembersDialog 
          open={isTeamMembersOpen}
          onOpenChange={setIsTeamMembersOpen}
          teamId={teamIdToUse}
        />
      )}
    </>
  );
}