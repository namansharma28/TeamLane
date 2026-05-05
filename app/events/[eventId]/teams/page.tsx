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
      if (!eventId || !formId) {
        console.log('[EventTeams] Missing eventId or formId:', { eventId, formId });
        return;
      }
      
      try {
        // Call Gravitas API to get registered teams
        const gravitasUrl = process.env.NODE_ENV === 'production' 
          ? 'https://gravitas.grafene.in' 
          : 'http://localhost:3000';
        
        const url = `${gravitasUrl}/api/events/${eventId}/forms/${formId}/teams`;
        console.log('[EventTeams] Fetching from:', url);
          
        const response = await fetch(url, {
          credentials: 'include'
        });
        
        console.log('[EventTeams] Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[EventTeams] Error response:', errorText);
          throw new Error('Failed to fetch teams');
        }
        
        const data = await response.json();
        console.log('[EventTeams] Received data:', data);
        setTeams(data.teams || []);
      } catch (error) {
        console.error('[EventTeams] Error:', error);
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Registered Teams
            </h1>
            {eventName && (
              <p className="text-muted-foreground mt-1 text-sm sm:text-base truncate">
                {decodeURIComponent(eventName)}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{teams.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Teams</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">
                    {teams.reduce((sum, team) => sum + team.memberCount, 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Participants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">
                    {teams.length > 0 
                      ? Math.round(teams.reduce((sum, team) => sum + team.memberCount, 0) / teams.length)
                      : 0}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Avg Team Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teams List */}
        {teams.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">No Teams Registered Yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                Teams will appear here once they register for this event
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl mb-1 sm:mb-2 truncate">{team.name}</CardTitle>
                      {team.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                      {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Team Members */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-muted-foreground">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        Team Members
                      </h4>
                      <div className="space-y-1.5 sm:space-y-2">
                        {team.members.map((member, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                              <AvatarImage 
                                src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                                alt={member.name}
                              />
                              <AvatarFallback className="text-xs">
                                {member.name[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium truncate">
                                {member.name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                {member.email}
                              </p>
                            </div>
                            {member.role === 'admin' && (
                              <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="pt-2 sm:pt-3 border-t flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                      </div>
                      {team.linkedCommunityHandle && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
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
