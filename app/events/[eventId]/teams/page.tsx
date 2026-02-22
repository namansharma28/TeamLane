'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Calendar, ArrowLeft } from "lucide-react";
import { LoadingPage } from '@/components/ui/loading-page';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface TeamMember {
  email: string;
  name: string;
  image?: string;
  role: string;
  joinedAt: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  members: TeamMember[];
  linkedCommunityId: string;
  linkedCommunityHandle: string;
  createdAt: string;
}

export default function EventTeamsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params?.eventId as string;
  const formId = searchParams?.get('formId');
  const eventName = searchParams?.get('eventName');
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!eventId || !formId) return;
      
      try {
        // Call Gravitas API to get registered teams
        const gravitasUrl = process.env.NODE_ENV === 'production' 
          ? 'https://gravitas.grafene.in' 
          : 'http://localhost:3001';
          
        const response = await fetch(
          `${gravitasUrl}/api/events/${eventId}/forms/${formId}/teams`,
          {
            credentials: 'include'
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch teams');
        }
        
        const data = await response.json();
        setTeams(data.teams || []);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [eventId, formId]);

  if (loading) return <LoadingPage />;
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="text-red-500 mb-4">Error: {error}</div>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Registered Teams
            </h1>
            {eventName && (
              <p className="text-muted-foreground mt-1">
                {decodeURIComponent(eventName)}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teams.length}</p>
                  <p className="text-sm text-muted-foreground">Total Teams</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {teams.reduce((sum, team) => sum + team.memberCount, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Participants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {teams.length > 0 
                      ? Math.round(teams.reduce((sum, team) => sum + team.memberCount, 0) / teams.length)
                      : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Team Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teams List */}
        {teams.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Teams Registered Yet</h3>
              <p className="text-muted-foreground">
                Teams will appear here once they register for this event
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{team.name}</CardTitle>
                      {team.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Team Members */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team Members
                      </h4>
                      <div className="space-y-2">
                        {team.members.map((member, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                                alt={member.name}
                              />
                              <AvatarFallback>
                                {member.name[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {member.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.email}
                              </p>
                            </div>
                            {member.role === 'admin' && (
                              <Crown className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                      </div>
                      {team.linkedCommunityHandle && (
                        <Badge variant="outline" className="text-xs">
                          @{team.linkedCommunityHandle}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
