import { useEffect, useState } from 'react';
import { Search, Users, Upload, Download, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
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
import { queueApi, campaignApi } from '@/lib/api';
import { toast } from 'sonner';

interface QueuedCall {
  id: number;
  lead_id: string;
  lead_name: string;
  contact_number: string;
  status: string;
  campaign_id: string;
  created_at: string;
}

interface CampaignOption {
  campaign_id: string;
  campaign_name: string;
}

export default function LeadList() {
  const [calls, setCalls] = useState<QueuedCall[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [statusFilter, campaignFilter]);

  const loadData = async () => {
    try {
      const [callsRes, campaignsRes] = await Promise.all([
        queueApi.getCalls({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          campaign_id: campaignFilter !== 'all' ? campaignFilter : undefined,
          limit: 100,
        }),
        campaignApi.getNames(),
      ]);
      setCalls(callsRes.calls || []);
      setCampaigns(campaignsRes.campaigns || []);
    } catch (error) {
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCalls = calls.filter((call) =>
    call.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.contact_number?.includes(searchQuery)
  );

  const getCampaignName = (campaignId: string) => {
    return campaigns.find(c => c.campaign_id === campaignId)?.campaign_name || campaignId;
  };

  if (isLoading) {
    return (
      <AppLayout title="Leads">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Leads">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Queue</CardTitle>
            <CardDescription>View and manage leads across all campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
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
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                      {campaign.campaign_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        {filteredCalls.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads found"
            description={
              searchQuery || statusFilter !== 'all' || campaignFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload leads to a campaign to get started'
            }
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.lead_name || 'Unknown'}</TableCell>
                      <TableCell>{call.contact_number}</TableCell>
                      <TableCell>
                        <span className="max-w-[200px] truncate">
                          {getCampaignName(call.campaign_id)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={call.status} />
                      </TableCell>
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
    </AppLayout>
  );
}
