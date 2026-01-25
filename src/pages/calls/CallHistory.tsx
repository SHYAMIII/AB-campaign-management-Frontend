import { useEffect, useState } from 'react';
import {
  Search,
  PhoneCall,
  Clock,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Minus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/common/StatsCard';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { queueApi } from '@/lib/api';
import { toast } from 'sonner';
import type { QueueStats } from '@/types';

interface QueuedCall {
  id: number;
  lead_id: string;
  lead_name: string;
  contact_number: string;
  status: string;
  campaign_id: string;
  created_at: string;
  call_summary?: string;
  call_transcript?: string;
  call_duration?: number;
  sentiment_score?: number;
}

export default function CallHistory() {
  const [calls, setCalls] = useState<QueuedCall[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<QueuedCall | null>(null);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      const [callsRes, statsRes] = await Promise.all([
        queueApi.getCalls({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          limit: 100,
        }),
        queueApi.getStats(),
      ]);
      setCalls(callsRes.calls || []);
      setStats(statsRes);
    } catch (error) {
      toast.error('Failed to load call history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFailed = async () => {
    try {
      const result = await queueApi.resetFailed();
      toast.success(result.message);
      loadData();
    } catch (error) {
      toast.error('Failed to reset calls');
    }
  };

  const handleClearQueue = async (status: string) => {
    try {
      const result = await queueApi.clear(status);
      toast.success(result.message);
      loadData();
    } catch (error) {
      toast.error('Failed to clear queue');
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentIcon = (score?: number) => {
    if (score === undefined) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (score >= 0.6) return <ThumbsUp className="h-4 w-4 text-success" />;
    if (score <= 0.4) return <ThumbsDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-warning" />;
  };

  const filteredCalls = calls.filter((call) =>
    call.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.contact_number?.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <AppLayout title="Call History">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Call History">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Calls"
            value={stats?.total || 0}
            icon={PhoneCall}
            variant="primary"
          />
          <StatsCard
            title="Queued"
            value={stats?.queued || 0}
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Completed"
            value={stats?.done || 0}
            icon={Calendar}
            variant="success"
          />
          <StatsCard
            title="Failed"
            value={stats?.failed || 0}
            icon={PhoneCall}
            variant="destructive"
          />
        </div>

        {/* Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Queue Management</CardTitle>
              <CardDescription>Manage the call queue</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleResetFailed}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Failed
              </Button>
              <Button variant="outline" onClick={() => handleClearQueue('DONE')}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Completed
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="QUEUED">Queued</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calls Table */}
        {filteredCalls.length === 0 ? (
          <EmptyState
            icon={PhoneCall}
            title="No calls found"
            description="Calls will appear here once campaigns start processing"
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call) => (
                    <TableRow
                      key={call.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedCall(call)}
                    >
                      <TableCell className="font-medium">{call.lead_name || 'Unknown'}</TableCell>
                      <TableCell>{call.contact_number}</TableCell>
                      <TableCell>
                        <StatusBadge status={call.status} />
                      </TableCell>
                      <TableCell>{formatDuration(call.call_duration)}</TableCell>
                      <TableCell>{getSentimentIcon(call.sentiment_score)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(call.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Call Detail Dialog */}
      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCall?.lead_name || 'Call Details'}</DialogTitle>
            <DialogDescription>{selectedCall?.contact_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <StatusBadge status={selectedCall?.status || ''} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Duration</div>
                <div className="font-medium">{formatDuration(selectedCall?.call_duration)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Sentiment</div>
                <div className="flex items-center gap-2">
                  {getSentimentIcon(selectedCall?.sentiment_score)}
                  <span className="font-medium">
                    {selectedCall?.sentiment_score !== undefined
                      ? `${(selectedCall.sentiment_score * 100).toFixed(0)}%`
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
            {selectedCall?.call_summary && (
              <div>
                <div className="mb-2 text-sm font-medium">Summary</div>
                <p className="rounded-lg bg-muted p-3 text-sm">{selectedCall.call_summary}</p>
              </div>
            )}
            {selectedCall?.call_transcript && (
              <div>
                <div className="mb-2 text-sm font-medium">Transcript</div>
                <ScrollArea className="h-[200px] rounded-lg border p-3">
                  <pre className="whitespace-pre-wrap text-sm">{selectedCall.call_transcript}</pre>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
