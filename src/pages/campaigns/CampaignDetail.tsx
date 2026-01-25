import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  Upload,
  Download,
  Phone,
  Mail,
  Users,
  CalendarCheck,
  TrendingUp,
  Clock,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/common/StatsCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { campaignApi, excelApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Campaign, CampaignStats } from '@/types';

export default function CampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const loadCampaign = useCallback(async () => {
    if (!campaignId) return;
    try {
      const [campaignRes, statsRes] = await Promise.all([
        campaignApi.get(campaignId),
        campaignApi.getStatus(campaignId),
      ]);
      setCampaign(campaignRes);
      setStats(statsRes);
    } catch (error) {
      toast.error('Failed to load campaign');
      navigate('/campaigns');
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, navigate]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  const handleActivate = async () => {
    if (!campaignId) return;
    try {
      await campaignApi.activate(campaignId);
      toast.success('Campaign activated');
      loadCampaign();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to activate campaign');
    }
  };

  const handlePause = async () => {
    if (!campaignId) return;
    try {
      await campaignApi.pause(campaignId);
      toast.success('Campaign paused');
      loadCampaign();
    } catch (error) {
      toast.error('Failed to pause campaign');
    }
  };

  const handleResume = async () => {
    if (!campaignId) return;
    try {
      await campaignApi.resume(campaignId);
      toast.success('Campaign resumed');
      loadCampaign();
    } catch (error) {
      toast.error('Failed to resume campaign');
    }
  };

  const handleDelete = async () => {
    if (!campaignId) return;
    try {
      await campaignApi.delete(campaignId);
      toast.success('Campaign deleted');
      navigate('/campaigns');
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !campaignId) return;

    setIsUploading(true);
    try {
      const result = await excelApi.upload(campaignId, file);
      toast.success(`Uploaded ${result.successful_rows} leads successfully`);
      if (result.failed_rows > 0) {
        toast.warning(`${result.failed_rows} rows failed to import`);
      }
      loadCampaign();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  if (isLoading || !campaign) {
    return (
      <AppLayout title="Campaign Details">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  const completionPercentage = stats?.completion_percentage || 0;

  return (
    <AppLayout title={campaign.campaign_name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{campaign.campaign_name}</h1>
                <StatusBadge status={campaign.status} />
              </div>
              <p className="text-muted-foreground">
                {campaign.communication_type} • {campaign.campaign_type} • {campaign.timezone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {campaign.status === 'DRAFT' && (
              <Button onClick={handleActivate}>
                <Play className="mr-2 h-4 w-4" />
                Activate
              </Button>
            )}
            {campaign.status === 'ACTIVE' && (
              <Button variant="outline" onClick={handlePause}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {campaign.status === 'PAUSED' && (
              <Button onClick={handleResume}>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Leads"
            value={stats?.total_leads || 0}
            icon={Users}
            variant="primary"
          />
          <StatsCard
            title="Completed"
            value={stats?.called || 0}
            subtitle={`${stats?.queued || 0} queued`}
            icon={campaign.communication_type === 'CALL' ? Phone : Mail}
            variant="success"
          />
          <StatsCard
            title="Meetings Scheduled"
            value={stats?.meetings_scheduled_count || 0}
            icon={CalendarCheck}
            variant="warning"
          />
          <StatsCard
            title="Success Rate"
            value={`${completionPercentage.toFixed(1)}%`}
            icon={TrendingUp}
            variant="default"
          />
        </div>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Progress</CardTitle>
            <CardDescription>
              {stats?.called || 0} of {stats?.total_leads || 0} leads processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={completionPercentage} className="h-3" />
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.queued || 0}</div>
                <div className="text-xs text-muted-foreground">Queued</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{stats?.called || 0}</div>
                <div className="text-xs text-muted-foreground">Called</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{stats?.no_answer || 0}</div>
                <div className="text-xs text-muted-foreground">No Answer</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{stats?.failed || 0}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats?.completed || 0}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-4">
            {campaign.campaign_type === 'EXCEL' && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Leads</CardTitle>
                  <CardDescription>Import leads from an Excel file</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <Label htmlFor="excel-upload" className="sr-only">
                        Upload Excel
                      </Label>
                      <Input
                        id="excel-upload"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </div>
                    <Button variant="outline" asChild>
                      <a
                        href={excelApi.downloadTemplate(campaignId!)}
                        download
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Template
                      </a>
                    </Button>
                  </div>
                  {isUploading && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Uploading...
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Settings</CardTitle>
                <CardDescription>View campaign configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Schedule</Label>
                    <p className="font-medium">
                      {campaign.start_time} - {campaign.end_time}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Timezone</Label>
                    <p className="font-medium">{campaign.timezone}</p>
                  </div>
                  {campaign.communication_type === 'CALL' && (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Agent Name</Label>
                        <p className="font-medium">{campaign.agent_name || 'David'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">AI Model</Label>
                        <p className="font-medium">{campaign.vapi_model || 'gpt-4'}</p>
                      </div>
                    </>
                  )}
                </div>
                {campaign.campaign_prompt && (
                  <div>
                    <Label className="text-muted-foreground">Campaign Prompt</Label>
                    <p className="mt-1 rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
                      {campaign.campaign_prompt}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{campaign.campaign_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
