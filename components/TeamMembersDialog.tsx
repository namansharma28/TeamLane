"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, UserMinus, UserPlus, LogOut, Users, Crown, Mail, Calendar } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loading } from "./ui/loading";

interface TeamMember {
  userId?: string;
  email: string;
  name?: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

interface TeamMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamCode?: string;
}

export function TeamMembersDialog({
  open,
  onOpenChange,
  teamId,
  teamCode = ""
}: TeamMembersDialogProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [joinCode, setJoinCode] = useState(teamCode);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, teamId]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }
      const data = await response.json();
      setMembers(data.members);
      
      // Check if current user is admin
      const currentUserEmail = session?.user?.email;
      const currentUser = data.members.find((member: TeamMember) => member.email === currentUserEmail);
      setIsAdmin(currentUser?.role === 'admin');
      
      // Get join code if admin
      if (currentUser?.role === 'admin' && !joinCode) {
        const codeResponse = await fetch(`/api/teams/${teamId}/code`);
        if (codeResponse.ok) {
          const codeData = await codeResponse.json();
          setJoinCode(codeData.code);
        }
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to load team members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to invite member");
      }

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      fetchMembers();
    } catch (error) {
      console.error("Error inviting member:", error);
      toast.error(error instanceof Error ? error.message : "Failed to invite member");
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!isAdmin) {
      toast.error("Only admins can remove members");
      return;
    }

    // Cannot remove yourself if you're the only admin
    if (email === session?.user?.email) {
      const adminCount = members.filter(m => m.role === 'admin').length;
      if (adminCount <= 1) {
        toast.error("Cannot remove yourself as you are the only admin");
        return;
      }
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove member");
      }

      toast.success("Member removed successfully");
      fetchMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    }
  };

  const handleCopyCode = () => {
    if (joinCode) {
      navigator.clipboard.writeText(joinCode);
      setIsCopied(true);
      toast.success("Team code copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLeaveTeam = async () => {
    if (!session?.user?.email) return;
    
    // Check if user is the only admin
    if (isAdmin) {
      const adminCount = members.filter(m => m.role === 'admin').length;
      if (adminCount <= 1) {
        toast.error("Cannot leave the team as you are the only admin. Please promote another member to admin first.");
        return;
      }
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${encodeURIComponent(session.user.email)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave team");
      }

      toast.success("You have left the team");
      onOpenChange(false);
      // Redirect to team selection page
      router.push('/team-selection');
    } catch (error) {
      console.error("Error leaving team:", error);
      toast.error(error instanceof Error ? error.message : "Failed to leave team");
    }
  };

  const adminMembers = members.filter(member => member.role === 'admin');
  const regularMembers = members.filter(member => member.role === 'member');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[calc(100dvh-2rem)] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-xl">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Team Members
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Manage your team members and invitations
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            {isAdmin && (
              <div className="space-y-4 sm:space-y-6 py-3 sm:py-4 border-b">
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="teamCode" className="text-xs sm:text-sm font-medium">Team Join Code</Label>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Input
                      id="teamCode"
                      value={joinCode}
                      readOnly
                      className="flex-1 font-mono text-center text-sm sm:text-lg tracking-widest bg-muted h-10 sm:h-auto"
                    />
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="outline" 
                      onClick={handleCopyCode}
                      className="h-10 w-10 flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Share this code with others to let them join your team
                  </p>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="inviteEmail" className="text-xs sm:text-sm font-medium">Add by Email</Label>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Input
                      id="inviteEmail"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 text-sm h-10"
                    />
                    <Button 
                      type="button" 
                      size="icon" 
                      onClick={handleInvite}
                      className="h-10 w-10 flex-shrink-0"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loading />
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">Loading team members...</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* Administrators */}
                  {adminMembers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                        <h3 className="text-xs sm:text-sm font-semibold">
                          Administrators ({adminMembers.length})
                        </h3>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        {adminMembers.map((member) => (
                          <div
                            key={member.email}
                            className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-muted/50"
                          >
                            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                              <div className="relative flex-shrink-0">
                                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs sm:text-sm">
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                  <Crown className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium truncate">{member.name || member.email}</p>
                                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                  <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                  <span className="truncate">{member.email}</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                  <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                  <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            {isAdmin && member.email !== session?.user?.email && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMember(member.email)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                              >
                                <UserMinus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regular Members */}
                  {regularMembers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        <h3 className="text-xs sm:text-sm font-semibold">
                          Members ({regularMembers.length})
                        </h3>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        {regularMembers.map((member) => (
                          <div
                            key={member.email}
                            className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-muted/50"
                          >
                            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs sm:text-sm">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium truncate">{member.name || member.email}</p>
                                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                  <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                  <span className="truncate">{member.email}</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                  <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                  <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMember(member.email)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                              >
                                <UserMinus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center border-t pt-3 sm:pt-4 gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setLeaveConfirmOpen(true)}
              className="text-destructive hover:bg-destructive/10 w-full sm:w-auto text-sm"
              size="sm"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Leave Team
            </Button>
            <Button 
              type="button" 
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto text-sm"
              size="sm"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive text-sm sm:text-base">
              Are you sure you want to leave this team?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              You will lose access to all team resources and will need to be invited again to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto m-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLeaveTeam} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground w-full sm:w-auto m-0"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Leave Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}