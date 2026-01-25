import { useEffect, useState } from 'react';
import {
  Plug,
  CheckCircle,
  XCircle,
  ExternalLink,
  Settings,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { integrationApi, tokenApi } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { IntegrationConfig } from '@/types';

const crmOptions: { value: string; label: string; icon: string; description: string }[] = [
  {
    value: 'HUBSPOT',
    label: 'HubSpot',
    icon: '🟠',
    description: 'Connect your HubSpot CRM to sync leads',
  },
  {
    value: 'SALESFORCE',
    label: 'Salesforce',
    icon: '☁️',
    description: 'Connect your Salesforce instance',
  },
  {
    value: 'DYNAMICS',
    label: 'Microsoft Dynamics',
    icon: '🔷',
    description: 'Connect Microsoft Dynamics 365',
  },
  {
    value: 'ZOHO',
    label: 'Zoho CRM',
    icon: '🔴',
    description: 'Connect your Zoho CRM account',
  },
];

export default function Integrations() {
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationConfig | null>(null);
  const [tokenStatus, setTokenStatus] = useState<{ is_expired: boolean; crm_type?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCrmDialog, setShowCrmDialog] = useState(false);
  const [showZapierDialog, setShowZapierDialog] = useState(false);
  const [selectedCrm, setSelectedCrm] = useState<string | null>(null);
  const [zapierCredentials, setZapierCredentials] = useState({ api_key: '', secret_token: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  const loadIntegrationStatus = async () => {
    try {
      const [integrationRes, tokenRes] = await Promise.all([
        integrationApi.checkSetup().catch(() => null),
        tokenApi.getStatus().catch(() => null),
      ]);
      setIntegrationStatus(integrationRes);
      setTokenStatus(tokenRes);
    } catch (error) {
      console.error('Failed to load integration status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectCrm = async () => {
    if (!selectedCrm) return;
    try {
      const response = await integrationApi.getOAuthUrl(selectedCrm);
      window.location.href = response.auth_url;
    } catch (error) {
      toast.error('Failed to initiate OAuth flow');
    }
  };

  const handleSaveZapier = async () => {
    if (!zapierCredentials.api_key || !zapierCredentials.secret_token) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSaving(true);
    try {
      await integrationApi.saveZapierCredentials(zapierCredentials);
      toast.success('Zapier credentials saved');
      setShowZapierDialog(false);
      setZapierCredentials({ api_key: '', secret_token: '' });
      loadIntegrationStatus();
    } catch (error) {
      toast.error('Failed to save Zapier credentials');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteZapier = async () => {
    try {
      await integrationApi.deleteZapierCredentials();
      toast.success('Zapier credentials deleted');
      loadIntegrationStatus();
    } catch (error) {
      toast.error('Failed to delete Zapier credentials');
    }
  };

  const handleRefreshToken = async () => {
    try {
      await tokenApi.refresh();
      toast.success('Token refreshed successfully');
      loadIntegrationStatus();
    } catch (error) {
      toast.error('Failed to refresh token');
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Integrations">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Integrations">
      <div className="space-y-6">
        {/* CRM Integration Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>CRM Integration</CardTitle>
              <CardDescription>Connect your CRM to automatically sync leads</CardDescription>
            </div>
            {integrationStatus?.has_oauth_credentials ? (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Not Connected</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {integrationStatus?.has_oauth_credentials ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {crmOptions.find(c => c.value === integrationStatus.crm_type)?.icon || '🔗'}
                    </div>
                    <div>
                      <div className="font-medium">
                        {crmOptions.find(c => c.value === integrationStatus.crm_type)?.label || integrationStatus.crm_type}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Mode: {integrationStatus.integration_mode}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tokenStatus?.is_expired && (
                      <Button variant="outline" size="sm" onClick={handleRefreshToken}>
                        Refresh Token
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setShowCrmDialog(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                  </div>
                </div>
                {tokenStatus?.is_expired && (
                  <div className="rounded-lg border border-warning bg-warning/10 p-3 text-sm text-warning">
                    Your OAuth token has expired. Please refresh or reconnect.
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {crmOptions.map((crm) => (
                  <button
                    key={crm.value}
                    onClick={() => {
                      setSelectedCrm(crm.value);
                      setShowCrmDialog(true);
                    }}
                    className="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="text-2xl">{crm.icon}</div>
                    <div>
                      <div className="font-medium">{crm.label}</div>
                      <div className="text-sm text-muted-foreground">{crm.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Zapier Integration */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Zapier Integration</CardTitle>
              <CardDescription>Connect via Zapier webhooks for custom workflows</CardDescription>
            </div>
            {integrationStatus?.has_zapier_credentials ? (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Not Connected</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {integrationStatus?.has_zapier_credentials ? (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">⚡</div>
                  <div>
                    <div className="font-medium">Zapier Webhook</div>
                    <div className="text-sm text-muted-foreground">Webhook credentials configured</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDeleteZapier}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowZapierDialog(true)}>
                <Plug className="mr-2 h-4 w-4" />
                Connect Zapier
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CRM OAuth Dialog */}
      <Dialog open={showCrmDialog} onOpenChange={setShowCrmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect CRM</DialogTitle>
            <DialogDescription>
              Select a CRM to connect and authorize access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select CRM</Label>
              <Select value={selectedCrm || ''} onValueChange={(value) => setSelectedCrm(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a CRM" />
                </SelectTrigger>
                <SelectContent>
                  {crmOptions.map((crm) => (
                    <SelectItem key={crm.value} value={crm.value}>
                      <span className="flex items-center gap-2">
                        <span>{crm.icon}</span>
                        <span>{crm.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCrmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectCrm} disabled={!selectedCrm}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zapier Dialog */}
      <Dialog open={showZapierDialog} onOpenChange={setShowZapierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Zapier</DialogTitle>
            <DialogDescription>
              Enter your Zapier webhook credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={zapierCredentials.api_key}
                onChange={(e) => setZapierCredentials(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="Enter your Zapier API key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-token">Secret Token</Label>
              <Input
                id="secret-token"
                type="password"
                value={zapierCredentials.secret_token}
                onChange={(e) => setZapierCredentials(prev => ({ ...prev, secret_token: e.target.value }))}
                placeholder="Enter your webhook secret token"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowZapierDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveZapier} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Credentials'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
