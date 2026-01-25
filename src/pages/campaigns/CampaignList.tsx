import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Megaphone, Phone, Mail, MoreHorizontal, Play, Pause, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { campaignApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Campaign } from '@/types';

export default function CampaignList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await campaignApi.list();
      setCampaigns(response.campaigns || []);
    } catch (error) {
      toast.error('Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (campaignId: string) => {
    try {
      await campaignApi.activate(campaignId);
      toast.success('Campaign activated');
      loadCampaigns();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to activate campaign');
    }
  };

  const handlePause = async (campaignId: string) => {
    try {
      await campaignApi.pause(campaignId);
      toast.success('Campaign paused');
      loadCampaigns();
    } catch (error) {
      toast.error('Failed to pause campaign');
    }
  };

  const handleResume = async (campaignId: string) => {
    try {
      await campaignApi.resume(campaignId);
      toast.success('Campaign resumed');
      loadCampaigns();
    } catch (error) {
      toast.error('Failed to resume campaign');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await campaignApi.delete(deleteId);
      toast.success('Campaign deleted');
      setDeleteId(null);
      loadCampaigns();
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.campaign_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <AppLayout title="Campaigns">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Campaigns">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => navigate('/campaigns/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>

        {/* Campaign Grid */}
        {filteredCampaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No campaigns found"
            description={
              searchQuery
                ? 'Try adjusting your search query'
                : 'Create your first campaign to start reaching out to leads'
            }
            action={
              !searchQuery
                ? {
                    label: 'Create Campaign',
                    onClick: () => navigate('/campaigns/new'),
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.campaign_id} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-0">
                  <Link to={`/campaigns/${campaign.campaign_id}`} className="block p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          campaign.communication_type === 'CALL' ? 'bg-primary/10' : 'bg-success/10'
                        }`}>
                          {campaign.communication_type === 'CALL' ? (
                            <Phone className={`h-5 w-5 ${
                              campaign.communication_type === 'CALL' ? 'text-primary' : 'text-success'
                            }`} />
                          ) : (
                            <Mail className="h-5 w-5 text-success" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{campaign.campaign_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {campaign.campaign_type} • {campaign.communication_type}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{campaign.start_time} - {campaign.end_time}</span>
                      <span>•</span>
                      <span>{campaign.timezone}</span>
                    </div>
                  </Link>
                  <div className="border-t px-5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(campaign.created_at).toLocaleDateString()}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {campaign.status === 'DRAFT' && (
                            <DropdownMenuItem onClick={() => handleActivate(campaign.campaign_id)}>
                              <Play className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'ACTIVE' && (
                            <DropdownMenuItem onClick={() => handlePause(campaign.campaign_id)}>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'PAUSED' && (
                            <DropdownMenuItem onClick={() => handleResume(campaign.campaign_id)}>
                              <Play className="mr-2 h-4 w-4" />
                              Resume
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(campaign.campaign_id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone and will remove all associated leads and call history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
