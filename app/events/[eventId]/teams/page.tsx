'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Calendar, ArrowLeft, CheckCircle, Star, UserCheck, Download, Search, Filter, Mail } from "lucide-react";
import { LoadingPage } from '@/components/ui/loading-page';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  responseId?: string;
  shortlisted?: boolean;
  checkedIn?: boolean;
}

export default function EventTeamsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const eventId = params?.eventId as string;
  const formId = searchParams?.get('formId');
  const eventName = searchParams?.get('eventName');
  const communityHandle = searchParams?.get('communityHandle');
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'shortlisted' | 'checked-in' | 'pending'>('all');
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (status === 'loading') return;
      
      if (!session?.user) {
        setError('Please sign in to view this page');
        setLoading(false);
        return;
      }

      if (!eventId || !formId) {
        console.log('[EventTeams] Missing eventId or formId:', { eventId, formId });
        setLoading(false);
        return;
      }

      try {
        // Check if user is member of the community conducting this event
        const authResponse = await fetch(`/api/events/${eventId}/check-access`, {
          credentials: 'include',
        });

        if (!authResponse.ok) {
          setError('You do not have permission to view this page. You must be a member of the community conducting this event.');
          setAuthorized(false);
          setLoading(false);
          return;
        }

        setAuthorized(true);

        // Fetch teams data
        const url = `/api/events/${eventId}/forms/${formId}/teams`;
        console.log('[EventTeams] Fetching from TeamLane API:', url);
          
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[EventTeams] Error response:', errorText.substring(0, 500));
          throw new Error(`Failed to fetch teams (${response.status})`);
        }
        
        const data = await response.json();
        console.log('[EventTeams] ✅ Success! Received', data.teams?.length || 0, 'teams');
        setTeams(data.teams || []);
        setFilteredTeams(data.teams || []);
      } catch (error) {
        console.error('[EventTeams] ❌ Error:', error);
        setError(error instanceof Error ? error.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [eventId, formId, session, status]);

  // Filter teams based on search and status
  useEffect(() => {
    let filtered = teams;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(team =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.members.some(m => 
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(team => {
        if (statusFilter === 'shortlisted') return team.shortlisted;
        if (statusFilter === 'checked-in') return team.checkedIn;
        if (statusFilter === 'pending') return !team.shortlisted && !team.checkedIn;
        return true;
      });
    }

    setFilteredTeams(filtered);
  }, [teams, searchQuery, statusFilter]);

  const handleShortlist = async (teamId: string, responseId: string, currentStatus: boolean) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/events/${eventId}/forms/${formId}/responses/${responseId}/shortlist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ shortlisted: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to update shortlist status');

      // Update both teams and filteredTeams state
      const updateTeam = (team: Team) => 
        team.id === teamId ? { ...team, shortlisted: !currentStatus } : team;
      
      setTeams(prevTeams => prevTeams.map(updateTeam));
      setFilteredTeams(prevFiltered => prevFiltered.map(updateTeam));

      toast({
        title: !currentStatus ? "Team Shortlisted" : "Removed from Shortlist",
        description: !currentStatus 
          ? "Team has been added to the shortlist" 
          : "Team has been removed from the shortlist"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update shortlist status",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCheckIn = async (teamId: string, responseId: string, currentStatus: boolean) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/events/${eventId}/forms/${formId}/responses/${responseId}/checkin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ checkedIn: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to update check-in status');

      // Update both teams and filteredTeams state
      const updateTeam = (team: Team) => 
        team.id === teamId ? { ...team, checkedIn: !currentStatus } : team;
      
      setTeams(prevTeams => prevTeams.map(updateTeam));
      setFilteredTeams(prevFiltered => prevFiltered.map(updateTeam));

      toast({
        title: !currentStatus ? "Team Checked In" : "Check-in Removed",
        description: !currentStatus 
          ? "Team has been checked in" 
          : "Team check-in has been removed"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update check-in status",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkShortlist = async (shortlist: boolean) => {
    if (selectedTeams.size === 0) return;

    setIsUpdating(true);
    try {
      const selectedTeamsList = teams.filter(t => selectedTeams.has(t.id));
      
      await Promise.all(
        selectedTeamsList.map(team =>
          fetch(`/api/events/${eventId}/forms/${formId}/responses/${team.responseId}/shortlist`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ shortlisted: shortlist })
          })
        )
      );

      // Update both teams and filteredTeams state
      const updateTeam = (team: Team) => 
        selectedTeams.has(team.id) ? { ...team, shortlisted: shortlist } : team;
      
      setTeams(prevTeams => prevTeams.map(updateTeam));
      setFilteredTeams(prevFiltered => prevFiltered.map(updateTeam));

      setSelectedTeams(new Set());

      toast({
        title: shortlist ? "Teams Shortlisted" : "Removed from Shortlist",
        description: `${selectedTeams.size} team(s) updated successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update teams",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openEmailDialog = (recipients: string[]) => {
    setEmailRecipients(recipients);
    setEmailSubject('');
    setEmailMessage('');
    setShowEmailDialog(true);
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage) {
      toast({
        title: "Error",
        description: "Please fill in subject and message",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/events/${eventId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipients: emailRecipients,
          subject: emailSubject,
          message: emailMessage
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      toast({
        title: "Email Sent",
        description: `Email sent to ${emailRecipients.length} recipient(s)`
      });

      setShowEmailDialog(false);
      setEmailSubject('');
      setEmailMessage('');
      setEmailRecipients([]);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkEmail = () => {
    if (selectedTeams.size === 0) return;
    
    const selectedTeamsList = teams.filter(t => selectedTeams.has(t.id));
    const allEmails = selectedTeamsList.flatMap(team => team.members.map(m => m.email));
    openEmailDialog(allEmails);
  };

  const handleSelectTeam = (teamId: string, checked: boolean) => {
    const newSelected = new Set(selectedTeams);
    if (checked) {
      newSelected.add(teamId);
    } else {
      newSelected.delete(teamId);
    }
    setSelectedTeams(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTeams(new Set(filteredTeams.map(t => t.id)));
    } else {
      setSelectedTeams(new Set());
    }
  };

  const exportTeams = () => {
    const csv = [
      ['Team Name', 'Description', 'Members', 'Status', 'Shortlisted', 'Checked In', 'Created'],
      ...filteredTeams.map(team => [
        team.name,
        team.description || '',
        team.memberCount.toString(),
        team.checkedIn ? 'Checked In' : team.shortlisted ? 'Shortlisted' : 'Registered',
        team.shortlisted ? 'Yes' : 'No',
        team.checkedIn ? 'Yes' : 'No',
        new Date(team.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teams-${eventName || 'event'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredTeams.length} team(s) to CSV`
    });
  };

  if (loading || status === 'loading') return <LoadingPage />;
  
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to view this page</p>
        </div>
        <Button asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (!authorized && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
        </div>
        <div className="flex gap-2">
          {communityHandle && (
            <Button asChild>
              <Link href={`/communities/${communityHandle}`}>Go to Community</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="text-red-500 mb-4">Error: {error}</div>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );

  const shortlistedCount = teams.filter(t => t.shortlisted).length;
  const checkedInCount = teams.filter(t => t.checkedIn).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Navigate to community page if handle is available, otherwise go back
              if (communityHandle) {
                router.push(`/communities/${communityHandle}`);
              } else {
                router.back();
              }
            }}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Registered Teams
            </h1>
            {eventName && (
              <p className="text-muted-foreground mt-1 text-sm sm:text-base truncate">
                {decodeURIComponent(eventName)}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportTeams}
            disabled={filteredTeams.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams, members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="checked-in">Checked In</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedTeams.size > 0 && (
          <Card className="mb-6 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedTeams.size === filteredTeams.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="font-medium">
                    {selectedTeams.size} team(s) selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkShortlist(true)}
                    disabled={isUpdating}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Shortlist
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkShortlist(false)}
                    disabled={isUpdating}
                  >
                    Remove Shortlist
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkEmail}
                    disabled={isUpdating}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedTeams(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{teams.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
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
                  <p className="text-xs sm:text-sm text-muted-foreground">Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{shortlistedCount}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Shortlisted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{checkedInCount}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Checked In</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">
                    {teams.length > 0 
                      ? Math.round(teams.reduce((sum, team) => sum + team.memberCount, 0) / teams.length)
                      : 0}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Avg Size</p>
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
            {filteredTeams.map((team) => (
              <Card key={team.id} className="shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedTeams.has(team.id)}
                      onCheckedChange={(checked) => handleSelectTeam(team.id, !!checked)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-lg sm:text-xl truncate">{team.name}</CardTitle>
                        <div className="flex gap-1 shrink-0">
                          {team.shortlisted && (
                            <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Shortlisted
                            </Badge>
                          )}
                          {team.checkedIn && (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Checked In
                            </Badge>
                          )}
                        </div>
                      </div>
                      {team.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
                          {team.description}
                        </p>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                      </Badge>
                    </div>
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
                    <div className="pt-2 sm:pt-3 border-t space-y-3">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
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

                      {/* Action Buttons */}
                      {team.responseId && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={team.shortlisted ? "default" : "outline"}
                            className={team.shortlisted ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                            onClick={() => handleShortlist(team.id, team.responseId!, team.shortlisted || false)}
                            disabled={isUpdating}
                          >
                            <Star className={`h-3 w-3 mr-1 ${team.shortlisted ? 'fill-current' : ''}`} />
                            {team.shortlisted ? 'Shortlisted' : 'Shortlist'}
                          </Button>
                          <Button
                            size="sm"
                            variant={team.checkedIn ? "default" : "outline"}
                            className={team.checkedIn ? "bg-green-500 hover:bg-green-600" : ""}
                            onClick={() => handleCheckIn(team.id, team.responseId!, team.checkedIn || false)}
                            disabled={isUpdating}
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {team.checkedIn ? 'Checked In' : 'Check In'}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Mail className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Contact Team</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {team.members.map((member, idx) => (
                                <DropdownMenuItem 
                                  key={idx}
                                  onClick={() => openEmailDialog([member.email])}
                                >
                                  {member.name}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => openEmailDialog(team.members.map(m => m.email))}
                              >
                                Email All Members
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send an email to {emailRecipients.length} recipient(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Input
                id="subject"
                placeholder="Enter email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="message"
                placeholder="Enter your message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Recipients: {emailRecipients.join(', ')}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isUpdating || !emailSubject || !emailMessage}
            >
              {isUpdating ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
