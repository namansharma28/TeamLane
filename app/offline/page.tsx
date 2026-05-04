'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">You're Offline</h1>
          <p className="text-muted-foreground">
            It looks like you've lost your internet connection. Please check your network and try again.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={handleRetry}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <p className="text-sm text-muted-foreground">
            Some features may still be available offline
          </p>
        </div>

        {/* Tips */}
        <div className="pt-6 border-t">
          <h3 className="font-semibold mb-3 text-sm">Troubleshooting Tips:</h3>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Check if your WiFi or mobile data is turned on</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Try turning airplane mode off</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Check if other apps can connect to the internet</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
