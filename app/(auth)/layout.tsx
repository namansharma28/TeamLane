import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { LayoutDashboard, FileText, MessageSquare } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="hidden md:flex bg-muted h-full flex-col justify-between p-10">
        <div>
          <Link href="/" className="flex items-center space-x-2">
            <ImageWithFallback 
              src="/teamlane.svg" 
              fallbackSrc="/teamlane.png" 
              alt="TeamLane Logo" 
              className="h-8 w-auto" 
            />
            <span className="text-2xl font-bold">TeamLane</span>
          </Link>
        </div>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">
            Collaborate with your team, all in one space
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage tasks, take notes, and communicate with your team in real-time.
            Boost productivity and streamline your workflow.
          </p>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </div>
              <div className="font-medium">Kanban boards for visual task management</div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="font-medium">Real-time collaborative notes</div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="font-medium">Team chat for instant communication</div>
            </div>
          </div>
        </div>
        <div className="text-muted-foreground text-sm">
          © 2025 TeamLane. All rights reserved.
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-md space-y-6">{children}</div>
      </div>
    </div>
  );
}
