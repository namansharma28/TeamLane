"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

interface TeamInfo {
  _id: string;
  name: string;
}

export function TeamBreadcrumb() {
  const params = useParams() || {};
  const pathname = usePathname();
  const teamId = params.teamId as string;
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get current section from pathname
  const getCurrentSection = () => {
    if (!teamId) return "";
    
    const path = pathname?.replace(`/${teamId}/`, "");
    // Handle nested paths
    const section = path?.split("/")[0];
    
    // Capitalize first letter and format
    if (!section) return "";
    return section.charAt(0).toUpperCase() + section.slice(1);
  };
  
  useEffect(() => {
    const fetchTeamInfo = async () => {
      if (!teamId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/teams/${teamId}`);
        if (response.ok) {
          const data = await response.json();
          setTeamInfo(data);
        }
      } catch (error) {
        console.error("Error fetching team info:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeamInfo();
  }, [teamId]);
  
  if (!teamId) return null;
  
  const currentSection = getCurrentSection();
  
  return (
    <div className="mx-4 mb-4 px-6 py-4 bg-background rounded-xl shadow-lg border">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/team-selection" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                <Home className="h-4 w-4" />
                <span className="sr-only">Teams</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </BreadcrumbSeparator>
          
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${teamId}/dashboard`} className="text-foreground hover:text-primary transition-colors">
                {isLoading ? "Loading..." : teamInfo?.name || `Team ${teamId.substring(0, 6)}...`}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {currentSection && (
            <>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-medium">
                  {currentSection}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}