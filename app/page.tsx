'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ArrowRight, CheckCircle, LayoutDashboard, MessageSquare, FileText, Users, Settings, BarChart3 } from "lucide-react";
import { AppSwitcher } from "@/components/app-switcher";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = status === "authenticated";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;
  const logoSrc = mounted && currentTheme === "dark" 
    ? "/teamlane.svg" 
    : "/teamlane_light_mode.svg";

  const features = [
    {
      title: "Kanban Boards",
      description: "Visualize your workflow and move tasks through different stages effortlessly",
      icon: LayoutDashboard,
    },
    {
      title: "Shared Notes",
      description: "Create and edit notes together in real-time with your entire team",
      icon: FileText,
    },
    {
      title: "Team Chat",
      description: "Communicate instantly with direct messages and group chats",
      icon: MessageSquare,
    },
    {
      title: "Team Management",
      description: "Create teams, manage members, and assign roles with flexible permissions",
      icon: Settings,
    },
    {
      title: "Dashboard & Analytics",
      description: "Get insights into team performance with visual analytics and activity feeds",
      icon: BarChart3,
    },
    {
      title: "Real-time Sync",
      description: "All changes sync instantly so your team always sees the latest updates",
      icon: Users,
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut({ redirect: false });
      toast.success("Logged out successfully!");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/team-selection');
    } else {
      router.push('/auth/signup');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className={`fixed top-4 left-4 right-4 z-50 border bg-background/95 backdrop-blur rounded-xl shadow-lg transition-all ${scrolled ? 'shadow-xl' : ''}`}>
        <div className="flex h-14 items-center px-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                {mounted ? (
                  <Image 
                    src={logoSrc}
                    alt="TeamLane Logo" 
                    width={32}
                    height={32}
                    className="h-8 w-8"
                  />
                ) : (
                  <div className="h-8 w-8 bg-muted rounded-md animate-pulse" />
                )}
                <span className="font-bold text-xl">TeamLane</span>
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/#features" className="transition-colors hover:text-primary">
                Features
              </Link>
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground">{session?.user?.email}</span>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/auth/signin" className="transition-colors hover:text-primary">
                  Login
                </Link>
              )}
            </nav>
            
            <div className="flex items-center gap-2">
              <AppSwitcher />
              <ThemeToggle />
              <Button onClick={handleGetStarted}>
                <span className="hidden sm:inline">{isAuthenticated ? 'Go to Teams' : 'Get Started'}</span>
                <ArrowRight className="h-4 w-4 sm:ml-2" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <div className="w-6 h-5 flex flex-col justify-between">
                  <div className={`w-full h-0.5 bg-current transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
                  <div className={`w-full h-0.5 bg-current transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></div>
                  <div className={`w-full h-0.5 bg-current transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
                </div>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t">
            <div className="py-4 px-4 space-y-4">
              <Link href="#features" className="block px-2 py-1 hover:bg-accent rounded-md">
                Features
              </Link>
              {isAuthenticated ? (
                <>
                  <div className="border-t pt-2 mt-2 flex flex-col space-y-2">
                    <span className="text-sm text-muted-foreground px-2">{session?.user?.email}</span>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <Link href="/auth/signin" className="block px-2 py-1 hover:bg-accent rounded-md">
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
      
      {/* Add padding to account for fixed header */}
      <div className="h-20"></div>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-10 md:py-0 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center px-3 py-1 bg-primary/10 rounded-full border">
                  <CheckCircle className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm font-medium">Modern Team Collaboration</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
                  Collaborate with your team, all in one space
                </h1>
                <p className="text-xl text-muted-foreground">
                  Manage tasks, take notes, and communicate with your team in real-time. Boost productivity and streamline your workflow.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" onClick={handleGetStarted}>
                    {isAuthenticated ? 'Go to Teams' : 'Start Free Trial'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/#features">Explore Features</Link>
                  </Button>
                </div>
                
                {/* Stats */}
                <div className="flex gap-8 pt-8 border-t">
                  <div>
                    <div className="text-3xl font-bold text-primary">10K+</div>
                    <div className="text-sm text-muted-foreground">Active Teams</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">50K+</div>
                    <div className="text-sm text-muted-foreground">Tasks Completed</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                </div>
              </div>
              
              {/* Abstract Teamwork Illustration */}
              <div className="relative">
                <div className="relative aspect-square">
                  {/* SVG Abstract Teamwork Illustration */}
                  <svg viewBox="0 0 400 400" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {/* Background circles */}
                    <circle cx="200" cy="200" r="180" fill="hsl(var(--primary) / 0.05)" />
                    <circle cx="200" cy="200" r="140" fill="hsl(var(--primary) / 0.08)" />
                    <circle cx="200" cy="200" r="100" fill="hsl(var(--primary) / 0.1)" />
                    
                    {/* Connection lines representing collaboration */}
                    <line x1="200" y1="80" x2="280" y2="160" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.3" />
                    <line x1="200" y1="80" x2="120" y2="160" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.3" />
                    <line x1="280" y1="160" x2="320" y2="240" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.3" />
                    <line x1="120" y1="160" x2="80" y2="240" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.3" />
                    <line x1="320" y1="240" x2="200" y2="320" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.3" />
                    <line x1="80" y1="240" x2="200" y2="320" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.3" />
                    <line x1="280" y1="160" x2="120" y2="160" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.2" />
                    <line x1="320" y1="240" x2="80" y2="240" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.2" />
                    
                    {/* Team member nodes */}
                    {/* Top center - Leader */}
                    <circle cx="200" cy="80" r="20" fill="hsl(var(--primary))" />
                    <circle cx="200" cy="80" r="16" fill="hsl(var(--background))" />
                    <Users className="h-6 w-6" style={{ transform: 'translate(188px, 68px)' }} />
                    
                    {/* Top right */}
                    <circle cx="280" cy="160" r="18" fill="hsl(var(--primary) / 0.8)" />
                    <circle cx="280" cy="160" r="14" fill="hsl(var(--background))" />
                    
                    {/* Top left */}
                    <circle cx="120" cy="160" r="18" fill="hsl(var(--primary) / 0.8)" />
                    <circle cx="120" cy="160" r="14" fill="hsl(var(--background))" />
                    
                    {/* Middle right */}
                    <circle cx="320" cy="240" r="18" fill="hsl(var(--primary) / 0.7)" />
                    <circle cx="320" cy="240" r="14" fill="hsl(var(--background))" />
                    
                    {/* Middle left */}
                    <circle cx="80" cy="240" r="18" fill="hsl(var(--primary) / 0.7)" />
                    <circle cx="80" cy="240" r="14" fill="hsl(var(--background))" />
                    
                    {/* Bottom center - Goal */}
                    <circle cx="200" cy="320" r="22" fill="hsl(var(--primary))" />
                    <circle cx="200" cy="320" r="18" fill="hsl(var(--background))" />
                    <circle cx="200" cy="320" r="8" fill="hsl(var(--primary))" />
                    
                    {/* Floating elements representing ideas/tasks */}
                    <rect x="150" y="120" width="30" height="30" rx="6" fill="hsl(var(--primary) / 0.2)" transform="rotate(15 165 135)" />
                    <rect x="220" y="200" width="25" height="25" rx="5" fill="hsl(var(--primary) / 0.2)" transform="rotate(-20 232.5 212.5)" />
                    <circle cx="140" cy="280" r="12" fill="hsl(var(--primary) / 0.2)" />
                    <circle cx="260" cy="100" r="10" fill="hsl(var(--primary) / 0.2)" />
                  </svg>
                  
                  {/* Floating cards */}
                  <div className="absolute top-10 right-0 animate-float">
                    <Card className="shadow-lg w-32 bg-background/80 backdrop-blur">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-xs font-medium">Task Done</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="absolute bottom-10 left-0 animate-float-delayed">
                    <Card className="shadow-lg w-36 bg-background/80 backdrop-blur">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-xs font-medium">New Message</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="absolute top-1/2 right-0 animate-float-slow">
                    <Card className="shadow-lg w-28 bg-background/80 backdrop-blur">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-xs font-medium">3 Notes</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/30 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-3 py-1 bg-primary/10 rounded-full border mb-4">
                <span className="text-sm font-medium">Features</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Everything you need to collaborate
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                TeamLane provides all the tools your team needs to work efficiently together
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* How it works section */}
        <section className="py-20">
          <div className="container px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-3 py-1 bg-primary/10 rounded-full border mb-4">
                <span className="text-sm font-medium">How It Works</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Get started in minutes
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Simple steps to transform your team collaboration
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold">Create Your Team</h3>
                <p className="text-muted-foreground">
                  Sign up and create your team workspace in seconds. Invite members via email or share a join code.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold">Organize Tasks</h3>
                <p className="text-muted-foreground">
                  Create boards, add tasks, and organize your workflow with our intuitive Kanban interface.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold">Collaborate & Succeed</h3>
                <p className="text-muted-foreground">
                  Chat in real-time, share notes, and watch your team productivity soar.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20">
          <div className="container px-4">
            <Card className="shadow-2xl">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to transform your team&apos;s workflow?</h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Get started with TeamLane today and experience the future of team collaboration.
                </p>
                <Button size="lg" onClick={handleGetStarted}>
                  {isAuthenticated ? 'Go to Teams' : 'Get Started Free'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-8">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 TeamLane. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/legal/terms" className="text-muted-foreground hover:text-primary">
                Terms
              </Link>
              <Link href="/legal/privacy" className="text-muted-foreground hover:text-primary">
                Privacy
              </Link>
              <Link href="/legal/security" className="text-muted-foreground hover:text-primary">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 