"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function TeamSelectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isJoinTeamOpen, setIsJoinTeamOpen] = useState(false);

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
    router.push(`/${teamId}/dashboard`);
  };

  const getUserRole = (team: Team, userEmail?: string) => {
    if (!userEmail) return 'member';
    const member = team.members.find(m => m.email === userEmail);
    return member?.role || 'member';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col gap-8 mb-8">
          <Button
            variant="ghost"
            className="w-fit"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Your Teams</h1>
                <p className="text-muted-foreground text-lg">
                  Choose a workspace to continue collaborating
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setIsJoinTeamOpen(true)} 
                variant="outline"
              >
                <Users className="mr-2 h-4 w-4" />
                Join Team
              </Button>
              <Button onClick={() => setIsCreateTeamOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </div>
          </div>
        </div>

        <div className="relative">
          <LoadingOverlay isLoading={loading} />
          
          {!loading && teams.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center mb-6">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No teams yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Create your first team to start collaborating with your colleagues, or join an existing team with an invite code.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => setIsCreateTeamOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Team
                  </Button>
                  <Button onClick={() => setIsJoinTeamOpen(true)} variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Join Existing Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Card 
                  key={team._id}
                  className="cursor-pointer hover:shadow-lg transition-shadow shadow-md"
                  onClick={() => handleTeamClick(team._id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl">{team.name}</CardTitle>
                      {getUserRole(team) === 'admin' && (
                        <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                          <Crown className="h-3 w-3 text-primary" />
                          <span className="text-xs font-medium">Admin</span>
                        </div>
                      )}
                    </div>
                    {team.description && (
                      <CardDescription className="line-clamp-2">
                        {team.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(team.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex -space-x-2">
                        {team.members.slice(0, 4).map((member, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded-full bg-primary border-2 border-background flex items-center justify-center text-primary-foreground text-xs font-semibold"
                          >
                            {member.email[0].toUpperCase()}
                          </div>
                        ))}
                        {team.members.length > 4 && (
                          <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-muted-foreground text-xs font-semibold">
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
        />

        <JoinTeamDialog
          open={isJoinTeamOpen}
          onOpenChange={setIsJoinTeamOpen}
        />
      </div>
    </div>
  );
}
