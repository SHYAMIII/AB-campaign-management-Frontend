import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function DemoBanner() {
  const { isDemoMode } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!isDemoMode || dismissed) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary to-chart-4 text-primary-foreground">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)]" />
      <div className="relative flex items-center justify-between gap-4 px-4 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">Demo Mode</span>
          <span className="hidden sm:inline text-primary-foreground/80">— Exploring with sample data. No backend required!</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
