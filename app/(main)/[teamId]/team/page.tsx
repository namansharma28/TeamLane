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
    <div className="flex flex-col space-y-6 min-h-screen p-6">
      {/* Header Card */}
      <div className="bg-background rounded-xl shadow-lg border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {team.name}
              </h1>
              <p className="text-muted-foreground">
                {team.members.length} team member{team.members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button onClick={() => setIsTeamMembersOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Manage Team
          </Button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{team.members.length}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Crown className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adminMembers.length}</p>
                <p className="text-sm text-muted-foreground">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{regularMembers.length}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <div className="space-y-6">
        {/* Administrators */}
        {adminMembers.length > 0 && (
          <div className="bg-background rounded-xl shadow-lg border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="h-5 w-5 text-yellow-600" />
              <h2 className="text-xl font-semibold">
                Administrators ({adminMembers.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminMembers.map((member) => (
                <Card key={member._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-4 pb-3">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage 
                          src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || member.email || '')}&background=random`} 
                          alt={member.name || member.email || 'User'} 
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {(member.name || member.email || '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-1 -right-1 h-6 w-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Crown className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        {member.name || member.email?.split('@')[0] || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="px-2 py-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs rounded-full font-medium">
                          Administrator
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
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
          <div className="bg-background rounded-xl shadow-lg border p-6">
            <div className="flex items-center gap-3 mb-6">
              <UserCheck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">
                Members ({regularMembers.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularMembers.map((member) => (
                <Card key={member._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-4 pb-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage 
                        src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || member.email || '')}&background=random`} 
                        alt={member.name || member.email || 'User'} 
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {(member.name || member.email || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        {member.name || member.email?.split('@')[0] || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                          Member
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
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