import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Megaphone,
  PhoneCall,
  Users,
  CalendarCheck,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/common/StatsCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { campaignApi, queueApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Campaign, QueueStats, CampaignStatus, CampaignType, CommunicationType } from '@/types';

// Demo data
const DEMO_CAMPAIGNS: Campaign[] = [
  {
    campaign_id: 'demo-campaign-1',
    campaign_name: 'Q1 Enterprise Outreach',
    campaign_type: 'CRM' as CampaignType,
    communication_type: 'CALL' as CommunicationType,
    status: 'ACTIVE' as CampaignStatus,
    start_time: '09:00',
    end_time: '17:00',
    timezone: 'America/New_York',
    campaign_prompt: 'Schedule product demos',
    agent_name: 'Sarah',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    campaign_id: 'demo-campaign-2',
    campaign_name: 'Product Launch Email',
    campaign_type: 'EXCEL' as CampaignType,
    communication_type: 'EMAIL' as CommunicationType,
    status: 'PAUSED' as CampaignStatus,
    start_time: '08:00',
    end_time: '18:00',
    timezone: 'America/Los_Angeles',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    campaign_id: 'demo-campaign-3',
    campaign_name: 'SMB Follow-up Calls',
    campaign_type: 'EXCEL' as CampaignType,
    communication_type: 'CALL' as CommunicationType,
    status: 'DRAFT' as CampaignStatus,
    start_time: '10:00',
    end_time: '16:00',
    timezone: 'America/Chicago',
    created_at: new Date().toISOString(),
  },
];

const DEMO_QUEUE_STATS: QueueStats = {
  total: 1250,
  queued: 380,
  in_progress: 5,
  done: 820,
  failed: 45,
};

export default function Dashboard() {
  const { isDemoMode } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  const loadData = async () => {
    if (isDemoMode) {
      setCampaigns(DEMO_CAMPAIGNS);
      setQueueStats(DEMO_QUEUE_STATS);
      setIsLoading(false);
      return;
    }
    
    try {
      const [campaignsRes, queueRes] = await Promise.all([
        campaignApi.list(),
        queueApi.getStats(),
      ]);
      setCampaigns(campaignsRes.campaigns || []);
      setQueueStats(queueRes);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
  const totalLeads = queueStats?.total || 0;
  const completedCalls = queueStats?.done || 0;
  const pendingCalls = queueStats?.queued || 0;

  const recentCampaigns = campaigns.slice(0, 5);

  if (isLoading) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Here's your campaign overview
            </p>
          </div>
          <Button asChild>
            <Link to="/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Active Campaigns"
            value={activeCampaigns}
            subtitle={`${campaigns.length} total`}
            icon={Megaphone}
          />
          <StatsCard
            title="Total Leads"
            value={totalLeads.toLocaleString()}
            subtitle="All campaigns"
            icon={Users}
          />
          <StatsCard
            title="Completed Calls"
            value={completedCalls.toLocaleString()}
            subtitle={`${pendingCalls} pending`}
            icon={PhoneCall}
          />
          <StatsCard
            title="In Progress"
            value={queueStats?.in_progress || 0}
            subtitle="Currently processing"
            icon={Clock}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          {/* Queue Overview */}
          <Card className="lg:col-span-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Queue Overview</CardTitle>
                <CardDescription>Current call queue status</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/calls">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {completedCalls} / {totalLeads}
                    </span>
                  </div>
                  <Progress value={totalLeads > 0 ? (completedCalls / totalLeads) * 100 : 0} />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-xl font-semibold">{queueStats?.queued || 0}</div>
                    <div className="text-xs text-muted-foreground">Queued</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-xl font-semibold">{queueStats?.in_progress || 0}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-xl font-semibold">{queueStats?.done || 0}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-xl font-semibold">{queueStats?.failed || 0}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Campaigns */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>Your latest campaigns</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/campaigns">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentCampaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Megaphone className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No campaigns yet</p>
                  <Button variant="link" asChild className="mt-1">
                    <Link to="/campaigns/new">Create your first campaign</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentCampaigns.map((campaign) => (
                    <Link
                      key={campaign.campaign_id}
                      to={`/campaigns/${campaign.campaign_id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                          {campaign.communication_type === 'CALL' ? (
                            <PhoneCall className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{campaign.campaign_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.communication_type} • {campaign.campaign_type}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={campaign.status} className="ml-3 shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                <Link to="/campaigns/new">
                  <Megaphone className="h-5 w-5" />
                  <span className="text-sm">Create Campaign</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                <Link to="/leads">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">View Leads</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                <Link to="/integrations">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm">Setup CRM</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                <Link to="/calls">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-sm">Call History</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
