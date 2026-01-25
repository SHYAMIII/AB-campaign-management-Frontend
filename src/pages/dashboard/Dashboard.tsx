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
        <div className="relative overflow-hidden rounded-xl gradient-primary p-6 text-primary-foreground">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Welcome back! 👋</h2>
              <p className="mt-1 text-primary-foreground/80">
                Here's what's happening with your campaigns today
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Button variant="secondary" asChild className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-0">
                <Link to="/campaigns/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Campaign
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Active Campaigns"
            value={activeCampaigns}
            subtitle={`${campaigns.length} total campaigns`}
            icon={Megaphone}
            variant="primary"
            trend={campaigns.length > 0 ? { value: 12, isPositive: true } : undefined}
          />
          <StatsCard
            title="Total Leads"
            value={totalLeads.toLocaleString()}
            subtitle="Across all campaigns"
            icon={Users}
            variant="success"
            trend={totalLeads > 0 ? { value: 8, isPositive: true } : undefined}
          />
          <StatsCard
            title="Completed Calls"
            value={completedCalls.toLocaleString()}
            subtitle={`${pendingCalls} pending`}
            icon={PhoneCall}
            variant="default"
          />
          <StatsCard
            title="Queue Status"
            value={queueStats?.in_progress || 0}
            subtitle="Currently processing"
            icon={Clock}
            variant="warning"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          {/* Queue Overview */}
          <Card className="lg:col-span-4 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Queue Overview
                </CardTitle>
                <CardDescription>Current call queue status</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/calls">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Queue Progress</span>
                    <span className="font-semibold">
                      {completedCalls} / {totalLeads} calls
                    </span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                    <div 
                      className="h-full rounded-full gradient-primary transition-all duration-500"
                      style={{ width: `${totalLeads > 0 ? (completedCalls / totalLeads) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="group rounded-xl border bg-card p-4 text-center transition-all hover:border-info/50 hover:shadow-sm">
                    <div className="text-2xl font-bold text-info">{queueStats?.queued || 0}</div>
                    <div className="text-xs text-muted-foreground">Queued</div>
                  </div>
                  <div className="group rounded-xl border bg-card p-4 text-center transition-all hover:border-warning/50 hover:shadow-sm">
                    <div className="text-2xl font-bold text-warning">{queueStats?.in_progress || 0}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div className="group rounded-xl border bg-card p-4 text-center transition-all hover:border-success/50 hover:shadow-sm">
                    <div className="text-2xl font-bold text-success">{queueStats?.done || 0}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="group rounded-xl border bg-card p-4 text-center transition-all hover:border-destructive/50 hover:shadow-sm">
                    <div className="text-2xl font-bold text-destructive">{queueStats?.failed || 0}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Campaigns */}
          <Card className="lg:col-span-3 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  Recent Campaigns
                </CardTitle>
                <CardDescription>Your latest campaigns</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/campaigns">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {recentCampaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Megaphone className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No campaigns yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/campaigns/new">Create your first campaign</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentCampaigns.map((campaign, index) => (
                    <Link
                      key={campaign.campaign_id}
                      to={`/campaigns/${campaign.campaign_id}`}
                      className="flex items-center justify-between rounded-xl border p-4 transition-all hover:bg-muted/50 hover:shadow-sm hover:-translate-y-0.5"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          campaign.communication_type === 'CALL' ? 'bg-primary/10' : 'bg-success/10'
                        }`}>
                          {campaign.communication_type === 'CALL' ? (
                            <PhoneCall className="h-4 w-4 text-primary" />
                          ) : (
                            <CalendarCheck className="h-4 w-4 text-success" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{campaign.campaign_name}</p>
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
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="group h-auto flex-col gap-3 p-6 hover:border-primary/50 hover:bg-primary/5 transition-all" asChild>
                <Link to="/campaigns/new">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                    <Megaphone className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-medium">Create Campaign</span>
                </Link>
              </Button>
              <Button variant="outline" className="group h-auto flex-col gap-3 p-6 hover:border-success/50 hover:bg-success/5 transition-all" asChild>
                <Link to="/leads">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 transition-transform group-hover:scale-110">
                    <Users className="h-6 w-6 text-success" />
                  </div>
                  <span className="font-medium">View Leads</span>
                </Link>
              </Button>
              <Button variant="outline" className="group h-auto flex-col gap-3 p-6 hover:border-warning/50 hover:bg-warning/5 transition-all" asChild>
                <Link to="/integrations">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 transition-transform group-hover:scale-110">
                    <TrendingUp className="h-6 w-6 text-warning" />
                  </div>
                  <span className="font-medium">Setup CRM</span>
                </Link>
              </Button>
              <Button variant="outline" className="group h-auto flex-col gap-3 p-6 hover:border-info/50 hover:bg-info/5 transition-all" asChild>
                <Link to="/calls">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10 transition-transform group-hover:scale-110">
                    <BarChart3 className="h-6 w-6 text-info" />
                  </div>
                  <span className="font-medium">Call History</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
