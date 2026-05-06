'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, User, Trash2, Save, AlertTriangle, Download, Smartphone } from "lucide-react";
import { LoadingPage } from "@/components/ui/loading-page";
import { motion } from "framer-motion";

interface UserSettings {
  name: string;
  email: string;
  image: string;
}

export default function UserSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lastTeamId, setLastTeamId] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // Simplified form data - only name
  const [name, setName] = useState('');

  // Get last visited team ID from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTeamId = localStorage.getItem('lastVisitedTeamId');
      setLastTeamId(savedTeamId);
    }
  }, []);

  // PWA Install functionality
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('[PWA] Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.email) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/user/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        setUserData(data);
        setName(data.name || session?.user?.name || '');
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user settings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  const handleSaveSettings = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Name cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user settings');
      }

      // Get the updated user data from the response
      const updatedData = await response.json();

      // Update the session with new user information
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: updatedData.name || name,
        },
      });

      toast({
        title: 'Success',
        description: 'Your name has been updated',
      });
      
      // Update local state
      setUserData(updatedData);
      
      // Force a reload to update the UI everywhere
      router.refresh();
      
    } catch (error) {
      console.error('Error saving user settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted',
      });
      
      // Sign out and redirect to home page
      router.push('/auth/signout?callbackUrl=/');
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleBackToTeam = () => {
    if (lastTeamId) {
      router.push(`/${lastTeamId}/dashboard`);
    } else {
      router.push('/team-selection');
    }
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      // If no deferred prompt, show instructions
      toast({
        title: 'Install TeamLane',
        description: 'To install the app, use your browser\'s menu and select "Install App" or "Add to Home Screen"',
      });
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`[PWA] User response: ${outcome}`);
      
      if (outcome === 'accepted') {
        toast({
          title: 'Success!',
          description: 'TeamLane is being installed...',
        });
        setIsInstallable(false);
        setDeferredPrompt(null);
      } else {
        toast({
          title: 'Installation Cancelled',
          description: 'You can install the app later from Settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[PWA] Install error:', error);
      toast({
        title: 'Installation Failed',
        description: 'Please try again or use your browser\'s install option',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">
      <LoadingPage />
    </div>;
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-lg">Please sign in to view your settings</p>
          <Button 
            onClick={() => router.push('/auth/signin')}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container max-w-4xl py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6 px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Profile Settings
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                Manage your personal account settings
              </p>
            </div>
          </div>
          {lastTeamId && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackToTeam}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Back to Team
            </Button>
          )}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-3 sm:mb-4 md:mb-6 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
              <TabsTrigger value="profile" className="text-xs sm:text-sm">
                Profile
              </TabsTrigger>
              <TabsTrigger value="app" className="text-xs sm:text-sm">
                App
              </TabsTrigger>
              <TabsTrigger value="account" className="text-xs sm:text-sm">
                Account
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-3 sm:space-y-4 md:space-y-6">
              <Card className="shadow-lg">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl">
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 pt-0">
                  <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6 p-3 sm:p-4 bg-muted/50 rounded-lg border">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 shadow-lg">
                      <AvatarImage src={session.user.image || ''} alt={session.user.name || 'User'} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-base sm:text-lg md:text-xl font-semibold">
                        {session.user.name?.split(' ').map(name => name[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm sm:text-base md:text-lg font-semibold">
                        {session.user.name || 'User'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{session.user.email || ''}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                        Profile picture is managed by your Google account
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="name" className="text-xs sm:text-sm">Full Name</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Your name"
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="email" className="text-xs sm:text-sm">Email Address</Label>
                    <Input 
                      id="email" 
                      value={session.user.email || ''} 
                      disabled 
                      placeholder="Your email address"
                      className="bg-muted text-xs sm:text-sm"
                    />
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Email address cannot be changed as it's linked to your Google account
                    </p>
                  </div>
                  
                  <div className="flex justify-end pt-2 sm:pt-3 md:pt-4">
                    <Button 
                      onClick={handleSaveSettings} 
                      disabled={isSaving}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-primary-foreground mr-1 sm:mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="app" className="space-y-3 sm:space-y-4 md:space-y-6">
              <Card className="shadow-lg">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    <div>
                      <CardTitle className="text-base sm:text-lg md:text-xl">
                        Install TeamLane App
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Install TeamLane as a native app on your device
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-3 sm:space-y-4">
                  {isInstalled ? (
                    <div className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-green-500/50 rounded-lg bg-green-50 dark:bg-green-950/20">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-3 sm:mb-4">
                        <Download className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-green-700 dark:text-green-300 mb-1 sm:mb-2">
                        App Already Installed
                      </h3>
                      <p className="text-xs sm:text-sm text-center text-green-600 dark:text-green-400">
                        TeamLane is already installed on your device
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed rounded-lg bg-muted/50">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                          <Smartphone className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">
                          Install TeamLane
                        </h3>
                        <p className="text-xs sm:text-sm text-center text-muted-foreground mb-4 sm:mb-6 max-w-md">
                          Get the full app experience with offline access, push notifications, and faster performance
                        </p>
                        <Button 
                          onClick={handleInstallApp}
                          size="lg"
                          className="w-full sm:w-auto"
                        >
                          <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          Install App
                        </Button>
                      </div>

                      <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-medium text-sm sm:text-base text-blue-900 dark:text-blue-100">
                          Benefits of Installing:
                        </h4>
                        <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
                            <span>Works offline - access your teams even without internet</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
                            <span>Faster loading - instant access to your workspace</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
                            <span>Native app experience - runs like a regular app</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
                            <span>Push notifications - stay updated on team activities</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
                            <span>No app store required - install directly from browser</span>
                          </li>
                        </ul>
                      </div>

                      {!isInstallable && (
                        <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <h4 className="font-medium text-sm sm:text-base text-amber-900 dark:text-amber-100 mb-2">
                            Manual Installation:
                          </h4>
                          <div className="space-y-2 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                            <p className="font-medium">On Chrome/Edge (Android/Desktop):</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Tap the menu (⋮) in the top right</li>
                              <li>Select "Install app" or "Add to Home screen"</li>
                              <li>Follow the prompts to install</li>
                            </ol>
                            
                            <p className="font-medium mt-3">On Safari (iOS):</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Tap the Share button (□↑)</li>
                              <li>Scroll down and tap "Add to Home Screen"</li>
                              <li>Tap "Add" to confirm</li>
                            </ol>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account" className="space-y-3 sm:space-y-4 md:space-y-6">
              <Card className="shadow-lg border-destructive/50">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                    <div>
                      <CardTitle className="text-destructive text-base sm:text-lg md:text-xl">Danger Zone</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Actions here cannot be undone. Be careful.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-destructive/50 rounded-lg bg-destructive/5 gap-3">
                    <div>
                      <h3 className="font-medium text-destructive flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        Delete Account
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        This will permanently remove your account and all associated data
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
        
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all of your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteAccount} 
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}