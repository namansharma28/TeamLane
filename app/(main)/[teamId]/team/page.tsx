'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TeamMembersDialog } from "@/components/TeamMembersDialog";
import { Users, Crown, UserCheck, Calendar } from "lucide-react";
import { LoadingPage } from '@/components/ui/loading-page';

interface TeamMember {
  email: string;
  role: string;
  joinedAt: string;
  _id: string;
  name?: string;
  image?: string;
}

interface Team {
  _id: string;
  name: string;
  members: TeamMember[];
  code?: string;
}

export default function TeamPage() {
  const params = useParams();
  const teamId = params?.teamId as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTeamMembersOpen, setIsTeamMembersOpen] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) return;
      
      try {
        const response = await fetch(`/api/teams/${teamId}/team`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch team data');
        }
        const data = await response.json();
        setTeam(data);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  if (!teamId) return <div>Invalid team ID</div>;
  if (loading) return <div>
    <LoadingPage />
  </div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!team) return <div>Team not found</div>;
  if (!team.members || team.members.length === 0) return <div>No members found</div>;

  const adminMembers = team.members.filter(member => member.role === 'admin');
  const regularMembers = team.members.filter(member => member.role === 'member');

  return (
    <div className="flex flex-col space-y-3 sm:space-y-4 md:space-y-6 min-h-screen p-3 sm:p-4 md:p-6">
      {/* Header Card */}
      <div className="bg-background rounded-xl shadow-lg border p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                {team.name}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                {team.members.length} team member{team.members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button onClick={() => setIsTeamMembersOpen(true)} className="w-full sm:w-auto text-xs sm:text-sm">
            <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Manage Team
          </Button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card className="shadow-lg">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{team.members.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{adminMembers.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{regularMembers.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* Administrators */}
        {adminMembers.length > 0 && (
          <div className="bg-background rounded-xl shadow-lg border p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold">
                Administrators ({adminMembers.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {adminMembers.map((member) => (
                <Card key={member._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-2 sm:gap-3 md:gap-4 pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                    <div className="relative">
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16">
                        <AvatarImage 
                          src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || member.email || '')}&background=random`} 
                          alt={member.name || member.email || 'User'} 
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-base md:text-lg">
                          {(member.name || member.email || '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 h-5 w-5 sm:h-6 sm:w-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold truncate">
                        {member.name || member.email?.split('@')[0] || 'Unknown User'}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{member.email}</p>
                      <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                        <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-[10px] sm:text-xs rounded-full font-medium">
                          Administrator
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 p-3 sm:p-4 md:p-6">
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Members */}
        {regularMembers.length > 0 && (
          <div className="bg-background rounded-xl shadow-lg border p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold">
                Members ({regularMembers.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {regularMembers.map((member) => (
                <Card key={member._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-2 sm:gap-3 md:gap-4 pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                    <Avatar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16">
                      <AvatarImage 
                        src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || member.email || '')}&background=random`} 
                        alt={member.name || member.email || 'User'} 
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-base md:text-lg">
                        {(member.name || member.email || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold truncate">
                        {member.name || member.email?.split('@')[0] || 'Unknown User'}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{member.email}</p>
                      <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                        <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary/10 text-primary text-[10px] sm:text-xs rounded-full font-medium">
                          Member
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 p-3 sm:p-4 md:p-6">
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Team Members Dialog */}
      <TeamMembersDialog 
        open={isTeamMembersOpen}
        onOpenChange={setIsTeamMembersOpen}
        teamId={teamId}
        teamCode={team.code}
      />
    </div>
  );
}