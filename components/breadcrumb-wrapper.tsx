"use client";

import { BreadcrumbProvider } from "./breadcrumb-provider";
import { useBreadcrumbData } from "@/hooks/use-breadcrumb-data";

interface BreadcrumbWrapperProps {
  className?: string;
}

export function BreadcrumbWrapper({ className }: BreadcrumbWrapperProps) {
  const breadcrumbData = useBreadcrumbData();

  return (
    <BreadcrumbProvider 
      className={className}
      {...breadcrumbData}
    />
  );
}
