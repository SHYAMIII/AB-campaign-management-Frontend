import { useAuth } from '@/contexts/AuthContext';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function DemoBanner() {
  const { isDemoMode } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!isDemoMode || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-muted border-b border-border">
      <div className="flex items-center justify-between gap-4 px-4 py-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Info className="h-4 w-4" />
          <span className="font-medium text-foreground">Demo Mode</span>
          <span className="hidden sm:inline">— Exploring with sample data</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
