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
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-primary" />
              Team Members
            </DialogTitle>
            <DialogDescription>
              Manage your team members and invitations
            </DialogDescription>
          </DialogHeader>

          {isAdmin && (
            <div className="space-y-6 py-4 border-b">
              <div className="space-y-3">
                <Label htmlFor="teamCode" className="text-sm font-medium">Team Join Code</Label>
                <div className="flex items-center space-x-3">
                  <Input
                    id="teamCode"
                    value={joinCode}
                    readOnly
                    className="flex-1 font-mono text-center text-lg tracking-widest bg-muted"
                  />
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="outline" 
                    onClick={handleCopyCode}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this code with others to let them join your team
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="inviteEmail" className="text-sm font-medium">Add by Email</Label>
                <div className="flex items-center space-x-3">
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    size="icon" 
                    onClick={handleInvite}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <Loading />
                <p className="text-sm text-muted-foreground mt-2">Loading team members...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Administrators */}
                {adminMembers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <h3 className="text-sm font-semibold">
                        Administrators ({adminMembers.length})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {adminMembers.map((member) => (
                        <div
                          key={member.email}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -top-1 -right-1 h-5 w-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Crown className="h-2.5 w-2.5 text-white" />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{member.name || member.email}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          {isAdmin && member.email !== session?.user?.email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(member.email)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <UserMinus className="h-4 w-4" />
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
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">
                        Members ({regularMembers.length})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {regularMembers.map((member) => (
                        <div
                          key={member.email}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.name || member.email}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(member.email)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <UserMinus className="h-4 w-4" />
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

          <DialogFooter className="flex justify-between items-center border-t pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setLeaveConfirmOpen(true)}
              className="text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Team
            </Button>
            <Button 
              type="button" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Are you sure you want to leave this team?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to all team resources and will need to be invited again to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLeaveTeam} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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