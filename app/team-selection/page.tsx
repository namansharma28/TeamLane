"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Users, ArrowLeft, Crown, Calendar, Building2 } from "lucide-react";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { JoinTeamDialog } from "@/components/teams/join-team-dialog";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

interface Team {
  _id: string;
  name: string;
  description?: string;
  members: Array<{
    email: string;
    role: string;
    joinedAt: string;
  }>;
  createdAt: string;
}

function TeamSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isJoinTeamOpen, setIsJoinTeamOpen] = useState(false);
  
  // Get returnTo URL from query params
  const returnTo = searchParams?.get('returnTo');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
        if (!response.ok) {
          throw new Error('Failed to fetch teams');
        }
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast({
          title: "Error",
          description: "Failed to load teams. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [toast]);

  const handleTeamClick = (teamId: string) => {
    // If there's a returnTo URL, redirect there instead of dashboard
    if (returnTo) {
      window.location.href = returnTo;
    } else {
      router.push(`/${teamId}/dashboard`);
    }
  };

  const getUserRole = (team: Team, userEmail?: string) => {
    if (!userEmail) return 'member';
    const member = team.members.find(m => m.email === userEmail);
    return member?.role || 'member';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 md:py-12">
        <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8">
          <Button
            variant="ghost"
            className="w-fit text-xs sm:text-sm"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Back to Home
          </Button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 md:gap-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Your Teams</h1>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg">
                  Choose a workspace to continue collaborating
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button 
                onClick={() => setIsJoinTeamOpen(true)} 
                variant="outline"
                className="text-xs sm:text-sm"
              >
                <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Join Team
              </Button>
              <Button onClick={() => setIsCreateTeamOpen(true)} className="text-xs sm:text-sm">
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Create Team
              </Button>
            </div>
          </div>
        </div>

        <div className="relative">
          <LoadingOverlay isLoading={loading} />
          
          {!loading && teams.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 text-center px-3 sm:px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg bg-muted flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-muted-foreground" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2">No teams yet</h3>
                <p className="text-muted-foreground mb-4 sm:mb-6 max-w-md text-xs sm:text-sm md:text-base">
                  Create your first team to start collaborating with your colleagues, or join an existing team with an invite code.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button onClick={() => setIsCreateTeamOpen(true)} className="text-xs sm:text-sm">
                    <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Create Your First Team
                  </Button>
                  <Button onClick={() => setIsJoinTeamOpen(true)} variant="outline" className="text-xs sm:text-sm">
                    <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Join Existing Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {teams.map((team) => (
                <Card 
                  key={team._id}
                  className="cursor-pointer hover:shadow-lg transition-shadow shadow-md"
                  onClick={() => handleTeamClick(team._id)}
                >
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-start justify-between mb-1 sm:mb-2">
                      <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl">{team.name}</CardTitle>
                      {getUserRole(team) === 'admin' && (
                        <div className="flex items-center gap-1 bg-primary/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                          <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                          <span className="text-[10px] sm:text-xs font-medium">Admin</span>
                        </div>
                      )}
                    </div>
                    {team.description && (
                      <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                        {team.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">{new Date(team.createdAt).toLocaleDateString()}</span>
                          <span className="sm:hidden">{new Date(team.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      
                      <div className="flex -space-x-2">
                        {team.members.slice(0, 4).map((member, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-primary border-2 border-background flex items-center justify-center text-primary-foreground text-[10px] sm:text-xs font-semibold"
                          >
                            {member.email[0].toUpperCase()}
                          </div>
                        ))}
                        {team.members.length > 4 && (
                          <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-muted-foreground text-[10px] sm:text-xs font-semibold">
                            +{team.members.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <CreateTeamDialog 
          open={isCreateTeamOpen}
          onOpenChange={setIsCreateTeamOpen}
          returnTo={returnTo}
        />

        <JoinTeamDialog
          open={isJoinTeamOpen}
          onOpenChange={setIsJoinTeamOpen}
          returnTo={returnTo}
        />
      </div>
    </div>
  );
}

export default function TeamSelectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <TeamSelectionContent />
    </Suspense>
  );
}
