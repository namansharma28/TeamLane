'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useSession } from 'next-auth/react';
import { TeamMembersDialog } from "@/components/TeamMembersDialog";
import { LoadingPage } from '@/components/ui/loading-page';
interface TeamData {
  _id: string;
  name: string;
  description: string;
  creator: {
    email: string;
    name: string;
  };
  members: Array<{
    email: string;
    name: string;
    role: 'admin' | 'member';
  }>;
  settings: {
    notifications: boolean;
    defaultBoardView: 'list' | 'board';
  };
  createdAt: string;
}

export default function TeamSettingsPage() {
  const params = useParams();
  const teamId = params?.teamId as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notifications: true,
  });

  // Check if user is admin
  const isAdmin = teamData?.members?.some(
    member => member.email === session?.user?.email && member.role === 'admin'
  );

  // Check if user is the team creator
  const isCreator = teamData?.creator?.email === session?.user?.email;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveSettings = async () => {
    if (!isAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only team admins can update team settings',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const requestBody = {
        name: formData.name,
        description: formData.description,
        settings: {
          notifications: formData.notifications,
        }
      };

      const requestUrl = `/api/teams/${teamId}`;
      console.log('Making PATCH request to URL:', window.location.origin + requestUrl);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(requestUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('Response received:');
      console.log('- Status:', response.status, response.statusText);
      console.log('- Headers:', {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length'),
        'cache-control': response.headers.get('cache-control')
      });
      
      // If the status code is 304 (Not Modified), treat it as a success
      if (response.status === 304) {
        console.log('Received 304 Not Modified, treating as success');
        toast({
          title: 'Success',
          description: 'Team settings are already up to date',
        });
        return;
      }
      
      // Clone the response to read it multiple times
      const responseClone = response.clone();
      
      // Try to get the raw response text first
      let rawText = '';
      try {
        rawText = await responseClone.text();
        console.log('Raw response text:', rawText);
      } catch (textError) {
        console.error('Error reading response text:', textError);
      }

      if (!response.ok) {
        let errorMessage = 'Failed to update team settings';
        try {
          // Only try to parse JSON if the raw text looks like JSON
          if (rawText && (rawText.startsWith('{') || rawText.startsWith('['))) {
            const errorData = JSON.parse(rawText);
            console.error('Parsed error data:', errorData);
            errorMessage = errorData.error || errorMessage;
            if (errorData.details) {
              console.error('Error details:', errorData.details);
            }
          } else {
            console.error('Response is not JSON:', rawText);
          }
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
        }
        throw new Error(errorMessage);
      }

      toast({
        title: 'Success',
        description: 'Team settings updated successfully',
      });
      
      // Refresh the team data
      try {
        // Only try to parse JSON if the raw text looks like JSON
        let updatedTeam;
        if (rawText && (rawText.startsWith('{') || rawText.startsWith('['))) {
          updatedTeam = JSON.parse(rawText);
          setTeamData(updatedTeam);
        } else {
          console.log('Refreshing team data with a new request');
          const refreshResponse = await fetch(`/api/teams/${teamId}`);
          if (refreshResponse.ok) {
            const refreshedData = await refreshResponse.json();
            setTeamData(refreshedData);
          }
        }
      } catch (jsonError) {
        console.error('Error parsing success response:', jsonError);
        // Refresh the data by fetching it again if parsing fails
        console.log('Refreshing team data with a new request after error');
        const refreshResponse = await fetch(`/api/teams/${teamId}`);
        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json();
          setTeamData(refreshedData);
        }
      }
      
    } catch (error) {
      console.error('Error saving team settings:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update team settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save settings with keyboard shortcut
      if (isAdmin && ((e.ctrlKey || e.metaKey) && e.key === 's' || (e.altKey && e.key === 's'))) {
        e.preventDefault();
        handleSaveSettings();
      }
      
      // Switch tabs with Alt+[number]
      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab("general");
          document.querySelector('[data-value="general"]')?.dispatchEvent(
            new MouseEvent('click', { bubbles: true })
          );
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab("members");
          document.querySelector('[data-value="members"]')?.dispatchEvent(
            new MouseEvent('click', { bubbles: true })
          );
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab("danger");
          document.querySelector('[data-value="danger"]')?.dispatchEvent(
            new MouseEvent('click', { bubbles: true })
          );
        }
        // Show members dialog with Alt+M
        else if (e.key === 'm') {
          e.preventDefault();
          setMembersDialogOpen(true);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, activeTab, handleSaveSettings, formData, teamId]);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch team data');
        }
        const data = await response.json();
        setTeamData(data);
        setFormData({
          name: data.name,
          description: data.description || '',
          notifications: data.settings?.notifications ?? true,
        });
      } catch (error) {
        console.error('Error fetching team data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load team settings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  const handleDeleteTeam = async () => {
    if (!isCreator) {
      toast({
        title: 'Permission Denied',
        description: 'Only the team creator can delete the team',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      toast({
        title: 'Success',
        description: 'Team deleted successfully',
      });
      
      // Redirect to team selection page
      router.push('/team-selection');
      
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete team',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleLeaveTeam = async () => {
    try {
      if (!session?.user?.email) return;
      
      const response = await fetch(`/api/teams/${teamId}/members/${encodeURIComponent(session.user.email)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to leave team');
      }

      toast({
        title: 'Success',
        description: 'You have left the team',
      });
      
      // Redirect to team selection page
      router.push('/team-selection');
      
    } catch (error: any) {
      console.error('Error leaving team:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to leave team',
        variant: 'destructive',
      });
    } finally {
      setLeaveDialogOpen(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">
      <LoadingPage />
    </div>;
  }

  if (!teamData) {
    return <div className="flex items-center justify-center h-full">Team not found or you don&apos;t have access</div>;
  }

  return (
    <div className="container max-w-4xl py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6 px-3 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Team Settings</h1>
        {!isAdmin && (
          <div className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 sm:px-3 py-1 rounded-md">
            Read-only view (Admin access required)
          </div>
        )}
        {isAdmin && (
          <div className="text-xs sm:text-sm text-muted-foreground hidden md:block">
            <kbd className="px-2 py-1 bg-muted rounded">Ctrl+S</kbd> Save changes
          </div>
        )}
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-3 sm:mb-4 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="general" data-value="general" className="text-xs sm:text-sm">
            <span className="sm:hidden">General</span>
            <span className="hidden sm:inline">General</span>
            <kbd className="ml-2 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              Alt+1
            </kbd>
          </TabsTrigger>
          <TabsTrigger value="members" data-value="members" className="text-xs sm:text-sm">
            <span className="sm:hidden">Members</span>
            <span className="hidden sm:inline">Members</span>
            <kbd className="ml-2 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              Alt+2
            </kbd>
          </TabsTrigger>
          <TabsTrigger value="danger" data-value="danger" className="text-xs sm:text-sm">
            <span className="sm:hidden">Danger</span>
            <span className="hidden sm:inline">Danger Zone</span>
            <kbd className="ml-2 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              Alt+3
            </kbd>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-base sm:text-lg md:text-xl">Team Information</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Basic information about your team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm">Team Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  disabled={!isAdmin}
                  className="text-xs sm:text-sm"
                />
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  rows={3} 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  placeholder="Describe the purpose of this team..." 
                  disabled={!isAdmin}
                  className="text-xs sm:text-sm"
                />
              </div>
              
              {isAdmin && (
                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} disabled={isSaving} className="text-xs sm:text-sm">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                    <kbd className="ml-2 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                      Alt+S
                    </kbd>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="members" className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-base sm:text-lg md:text-xl">Team Members</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage who has access to this team</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="flex flex-col space-y-3 sm:space-y-4">
                <div className="text-xs sm:text-sm">
                  <p>Currently <strong>{teamData.members.length}</strong> members in this team</p>
                  <p className="text-muted-foreground">Created by {teamData.creator?.name || "Unknown"} on {new Date(teamData.createdAt).toLocaleDateString()}</p>
                </div>
                
                <Button onClick={() => setMembersDialogOpen(true)} className="text-xs sm:text-sm">
                  Manage Team Members
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="danger" className="space-y-3 sm:space-y-4">
          <Card className="border-red-200">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-red-500 text-base sm:text-lg md:text-xl">Danger Zone</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Actions here can&apos;t be undone. Be careful.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-sm sm:text-base">Leave Team</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    You will lose access to all team resources
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setLeaveDialogOpen(true)}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  Leave Team
                </Button>
              </div>
              
              {isCreator && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 sm:pt-4 border-t gap-3">
                  <div>
                    <h3 className="font-medium text-red-500 text-sm sm:text-base">Delete Team</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      This will permanently delete the team and all its data
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-xs sm:text-sm w-full sm:w-auto"
                  >
                    Delete Team
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialogs */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team &quot;{teamData.name}&quot; and all of its data including boards, tasks, and notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeam} className="bg-red-500 hover:bg-red-600">
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this team?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to all team resources and will need to be invited again to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveTeam}>
              Leave Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <TeamMembersDialog
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        teamId={teamId}
      />
    </div>
  );
} 