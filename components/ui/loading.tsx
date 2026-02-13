"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loading({ size = "md", className = "" }: LoadingProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  // Determine the actual theme being used
  const currentTheme = theme === "system" ? systemTheme : theme;
  const logoSrc = mounted && currentTheme === "dark" 
    ? "/teamlane.svg" 
    : "/teamlane_light_mode.svg";

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 animate-spin">
          {mounted ? (
            <Image
              src={logoSrc}
              alt="Loading..."
              width={size === "sm" ? 24 : size === "md" ? 32 : 48}
              height={size === "sm" ? 24 : size === "md" ? 32 : 48}
              className="h-full w-full"
            />
          ) : (
            <div className="h-full w-full bg-muted rounded-md animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
} 