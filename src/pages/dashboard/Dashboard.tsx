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
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/common/StatsCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { campaignApi, queueApi } from '@/lib/api';
import type { Campaign, QueueStats } from '@/types';

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Active Campaigns"
            value={activeCampaigns}
            subtitle={`${campaigns.length} total campaigns`}
            icon={Megaphone}
            variant="primary"
          />
          <StatsCard
            title="Total Leads"
            value={totalLeads.toLocaleString()}
            subtitle="Across all campaigns"
            icon={Users}
            variant="success"
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
          <Card className="lg:col-span-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Queue Overview</CardTitle>
                <CardDescription>Current call queue status</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/calls">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Queue Progress</span>
                    <span className="font-medium">
                      {completedCalls} / {totalLeads} calls
                    </span>
                  </div>
                  <Progress value={totalLeads > 0 ? (completedCalls / totalLeads) * 100 : 0} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-info">{queueStats?.queued || 0}</div>
                    <div className="text-xs text-muted-foreground">Queued</div>
                  </div>
                  <div className="rounded-lg border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-warning">{queueStats?.in_progress || 0}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div className="rounded-lg border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-success">{queueStats?.done || 0}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="rounded-lg border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-destructive">{queueStats?.failed || 0}</div>
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
                  <Megaphone className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No campaigns yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/campaigns/new">Create your first campaign</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCampaigns.map((campaign) => (
                    <Link
                      key={campaign.campaign_id}
                      to={`/campaigns/${campaign.campaign_id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{campaign.campaign_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.communication_type} • {campaign.campaign_type}
                        </p>
                      </div>
                      <StatusBadge status={campaign.status} className="ml-4" />
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
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                <Link to="/campaigns/new">
                  <Megaphone className="h-6 w-6" />
                  <span>Create Campaign</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                <Link to="/leads">
                  <Users className="h-6 w-6" />
                  <span>Upload Leads</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                <Link to="/integrations">
                  <TrendingUp className="h-6 w-6" />
                  <span>Setup CRM</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                <Link to="/calls">
                  <BarChart3 className="h-6 w-6" />
                  <span>View Analytics</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
