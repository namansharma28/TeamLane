"use client";

import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { AppSwitcher } from "@/components/app-switcher";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determine the actual theme being used
  const currentTheme = theme === "system" ? systemTheme : theme;
  const logoSrc = mounted && currentTheme === "dark" 
    ? "/teamlane.svg" 
    : "/teamlane_light_mode.svg";
  
  return (
    <header className="fixed top-4 left-4 right-4 z-50 border bg-background/95 backdrop-blur rounded-xl shadow-lg">
      <div className="flex h-14 items-center px-4">
        <div className="flex w-full items-center justify-between">
          <div className="hidden sm:flex items-center gap-2">
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
              <span className="hidden font-bold md:inline-block">TeamLane</span>
            </Link>
          </div>
          
          <div className="flex items-center justify-center flex-1 sm:mx-6">
            <MainNav />
          </div>
          
          <div className="flex items-center gap-0.5 sm:gap-1">
            <div className="hidden md:block">
              <AppSwitcher />
            </div>
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  );
}