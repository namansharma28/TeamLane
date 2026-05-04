"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Home, 
  ChevronRight,
  LayoutDashboard,
  LayoutGrid,
  Users,
  Settings,
  MessageSquare,
  FileText,
  CheckSquare
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItemData {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProviderProps {
  className?: string;
  teamData?: {
    id: string;
    name: string;
  };
  boardData?: {
    id: string;
    title: string;
  };
}

export function BreadcrumbProvider({ 
  className,
  teamData,
  boardData
}: BreadcrumbProviderProps) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItemData[]>([]);
  const prevPathnameRef = useRef<string>('');
  const prevBreadcrumbsRef = useRef<BreadcrumbItemData[]>([]);

  // Memoize the breadcrumb generation function
  const generateBreadcrumbs = useMemo(() => {
    return (): BreadcrumbItemData[] => {
      if (!pathname) return [];
      
      const segments = pathname.split('/').filter(Boolean);
      const items: BreadcrumbItemData[] = [];

      // Handle different route patterns
      if (segments.length === 0) {
        return []; // Home page, no breadcrumbs needed
      }

      // Team selection page
      if (segments[0] === 'team-selection') {
        items.push({ label: "Teams", icon: Users });
        return items;
      }

      // Team routes
      const teamId = segments[0];
      const section = segments[1];

      if (teamId && teamId !== 'team-selection') {
        // Add team breadcrumb
        const teamName = teamData?.name || `Team ${teamId.substring(0, 6)}...`;
        items.push({ 
          label: teamName, 
          href: `/${teamId}/dashboard`,
          icon: Users 
        });

        // Add section breadcrumb
        if (section) {
          switch (section) {
            case 'dashboard':
              items.push({ 
                label: "Dashboard", 
                icon: LayoutDashboard 
              });
              break;

            case 'boards':
              items.push({ 
                label: "Boards", 
                href: `/${teamId}/boards`,
                icon: LayoutGrid 
              });

              // Add board breadcrumb if on specific board
              if (segments[2]) {
                const boardTitle = boardData?.title || `Board ${segments[2].substring(0, 6)}...`;
                items.push({ 
                  label: boardTitle,
                  href: `/${teamId}/boards/${segments[2]}`
                });
              }
              break;

            case 'team':
              items.push({ 
                label: "Team Members", 
                icon: Users 
              });
              break;

            case 'chat':
              items.push({ 
                label: "Chat", 
                icon: MessageSquare 
              });
              break;

            case 'notes':
              items.push({ 
                label: "Notes", 
                icon: FileText 
              });
              break;

            case 'tasks':
              items.push({ 
                label: "Tasks", 
                icon: CheckSquare 
              });
              break;

            case 'settings':
              items.push({ 
                label: "Settings", 
                icon: Settings 
              });
              break;

            default:
              // Capitalize first letter
              const label = section.charAt(0).toUpperCase() + section.slice(1);
              items.push({ label });
          }
        }
      }

      return items;
    };
  }, [pathname, teamData, boardData]);

  useEffect(() => {
    if (!pathname) return;
    
    const newBreadcrumbs = generateBreadcrumbs();
    
    // Only update if breadcrumbs actually changed
    // This prevents unnecessary re-renders when navigating within the same page
    const breadcrumbsChanged = 
      prevBreadcrumbsRef.current.length !== newBreadcrumbs.length ||
      prevBreadcrumbsRef.current.some((item, index) => 
        item.label !== newBreadcrumbs[index]?.label ||
        item.href !== newBreadcrumbs[index]?.href
      );

    if (breadcrumbsChanged || prevPathnameRef.current !== pathname) {
      setBreadcrumbs(newBreadcrumbs);
      prevBreadcrumbsRef.current = newBreadcrumbs;
      prevPathnameRef.current = pathname;
    }
  }, [pathname, generateBreadcrumbs]);

  // Don't render breadcrumbs if there are none or if it's the home page
  if (breadcrumbs.length === 0 || pathname === '/' || !pathname) {
    return null;
  }

  return (
    <div className="mx-4 mb-4 px-4 py-4 bg-background rounded-xl shadow-lg border">
      <Breadcrumb>
        <BreadcrumbList>
          {/* Home link */}
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link 
                href="/team-selection" 
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only">Teams</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {/* Dynamic breadcrumbs */}
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const Icon = item.icon;

            return (
              <div key={`${item.label}-${index}`} className="flex items-center">
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </BreadcrumbSeparator>

                <BreadcrumbItem>
                  {isLast || !item.href ? (
                    <BreadcrumbPage className="flex items-center gap-2 text-foreground font-medium">
                      {Icon && <Icon className="h-4 w-4" />}
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link 
                        href={item.href} 
                        className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
