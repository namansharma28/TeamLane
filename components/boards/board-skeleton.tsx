import { Skeleton } from "@/components/ui/skeleton";

export function BoardSkeleton() {
  return (
    <div className="flex flex-col space-y-4 sm:space-y-6 min-h-screen p-3 sm:p-4 md:p-6 pt-0">
      {/* Header Skeleton */}
      <div className="bg-background rounded-xl shadow-lg border p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </div>

      {/* Controls Bar Skeleton */}
      <div className="bg-background rounded-xl shadow-lg border p-3 sm:p-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Kanban Board Skeleton */}
      <div className="bg-background rounded-xl shadow-lg border p-3 sm:p-4 md:p-6">
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3].map((col) => (
            <div key={col} className="flex-1 min-w-[280px]">
              <div className="bg-muted/50 rounded-lg p-3">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((task) => (
                    <div key={task} className="bg-background rounded-lg p-3 border">
                      <Skeleton className="h-5 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-3" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
