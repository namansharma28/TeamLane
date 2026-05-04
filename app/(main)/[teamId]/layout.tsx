"use client";

import { BreadcrumbWrapper } from "@/components/breadcrumb-wrapper";

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <BreadcrumbWrapper />
      <div className="py-1 mx-0 md:mx-5">
        {children}
      </div>
    </div>
  );
} 