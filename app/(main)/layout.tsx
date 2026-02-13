import { SiteHeader } from "@/components/site-header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center">
      <SiteHeader />
      <main className="flex-1 pt-16 w-full">
        <div className="container mx-auto py-6">
          {children}
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 TeamLane. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}