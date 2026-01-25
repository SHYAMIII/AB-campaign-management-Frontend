import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CampaignStatus, CampaignLeadStatus } from '@/types';

interface StatusBadgeProps {
  status: CampaignStatus | CampaignLeadStatus | string;
  className?: string;
}

const statusVariants: Record<string, { className: string; label: string }> = {
  DRAFT: { className: 'bg-muted text-muted-foreground hover:bg-muted/80', label: 'Draft' },
  ACTIVE: { className: 'bg-success text-success-foreground hover:bg-success/80', label: 'Active' },
  PAUSED: { className: 'bg-warning text-warning-foreground hover:bg-warning/80', label: 'Paused' },
  STOPPED: { className: 'bg-destructive text-destructive-foreground hover:bg-destructive/80', label: 'Stopped' },
  COMPLETED: { className: 'bg-primary text-primary-foreground hover:bg-primary/80', label: 'Completed' },
  QUEUED: { className: 'bg-info text-info-foreground hover:bg-info/80', label: 'Queued' },
  CALLED: { className: 'bg-success text-success-foreground hover:bg-success/80', label: 'Called' },
  FAILED: { className: 'bg-destructive text-destructive-foreground hover:bg-destructive/80', label: 'Failed' },
  NO_ANSWER: { className: 'bg-warning text-warning-foreground hover:bg-warning/80', label: 'No Answer' },
  IN_PROGRESS: { className: 'bg-info text-info-foreground hover:bg-info/80', label: 'In Progress' },
  DONE: { className: 'bg-success text-success-foreground hover:bg-success/80', label: 'Done' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusVariants[status] || { className: 'bg-muted text-muted-foreground', label: status };

  return (
    <Badge className={cn(variant.className, className)}>
      {variant.label}
    </Badge>
  );
}
