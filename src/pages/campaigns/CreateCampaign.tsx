import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Phone, Mail, FileSpreadsheet, Database } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { campaignApi } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const campaignSchema = z.object({
  campaign_name: z.string().min(1, 'Campaign name is required').max(100),
  campaign_type: z.enum(['CRM', 'EXCEL']),
  communication_type: z.enum(['CALL', 'EMAIL']),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  campaign_prompt: z.string().optional(),
  vapi_voice_id: z.string().optional(),
  vapi_model: z.string().optional(),
  agent_name: z.string().optional(),
  logged_in_user_email: z.string().email().optional().or(z.literal('')),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

const voiceModels = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaign_name: '',
      campaign_type: 'EXCEL',
      communication_type: 'CALL',
      start_time: '09:00',
      end_time: '17:00',
      campaign_prompt: '',
      vapi_voice_id: '',
      vapi_model: 'gpt-4',
      agent_name: 'Sarah',
      logged_in_user_email: '',
    },
  });

  const communicationType = form.watch('communication_type');
  const campaignType = form.watch('campaign_type');

  const onSubmit = async (data: CampaignFormData) => {
    setIsLoading(true);
    try {
      const response = await campaignApi.create({
        campaign_name: data.campaign_name,
        campaign_type: data.campaign_type,
        communication_type: data.communication_type,
        start_time: data.start_time,
        end_time: data.end_time,
        campaign_prompt: data.campaign_prompt,
        vapi_voice_id: data.vapi_voice_id,
        vapi_model: data.vapi_model,
        agent_name: data.agent_name,
        logged_in_user_email: data.logged_in_user_email || undefined,
      });
      toast.success('Campaign created successfully');
      navigate(`/campaigns/${response.campaign_id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout title="Create Campaign">
      <div className="mx-auto max-w-3xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/campaigns')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>Configure your campaign settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="campaign_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Q1 Outbound Campaign" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campaign Type Selection */}
                <FormField
                  control={form.control}
                  name="campaign_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Source</FormLabel>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => field.onChange('EXCEL')}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all',
                            field.value === 'EXCEL'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <FileSpreadsheet className="h-6 w-6 text-success" />
                          <div>
                            <div className="font-medium">Excel Upload</div>
                            <div className="text-sm text-muted-foreground">
                              Upload leads from Excel file
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange('CRM')}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all',
                            field.value === 'CRM'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <Database className="h-6 w-6 text-primary" />
                          <div>
                            <div className="font-medium">CRM Integration</div>
                            <div className="text-sm text-muted-foreground">
                              Import from connected CRM
                            </div>
                          </div>
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Communication Type Selection */}
                <FormField
                  control={form.control}
                  name="communication_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Communication Type</FormLabel>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => field.onChange('CALL')}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all',
                            field.value === 'CALL'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <Phone className="h-6 w-6 text-primary" />
                          <div>
                            <div className="font-medium">Voice Calls</div>
                            <div className="text-sm text-muted-foreground">
                              AI-powered voice outreach
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange('EMAIL')}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all',
                            field.value === 'EMAIL'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <Mail className="h-6 w-6 text-success" />
                          <div>
                            <div className="font-medium">Email Campaign</div>
                            <div className="text-sm text-muted-foreground">
                              Automated email sequences
                            </div>
                          </div>
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Set when the campaign should run</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Settings (for calls) */}
            {communicationType === 'CALL' && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Voice Settings</CardTitle>
                  <CardDescription>Configure the AI voice agent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="agent_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Sarah" {...field} />
                        </FormControl>
                        <FormDescription>
                          The name the AI agent will introduce itself as
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vapi_model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Model</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {voiceModels.map((model) => (
                              <SelectItem key={model.value} value={model.value}>
                                {model.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vapi_voice_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voice ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="voice-id-from-vapi" {...field} />
                        </FormControl>
                        <FormDescription>
                          VAPI voice ID for custom voice selection
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Campaign Prompt */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Instructions</CardTitle>
                <CardDescription>
                  Provide instructions for the AI agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="campaign_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="You are calling to schedule a demo of our enterprise software solution. Be friendly and professional. Ask about their current pain points..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This prompt will be used for all leads in this campaign
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Email Settings */}
            {communicationType === 'EMAIL' && (
              <Card>
                <CardHeader>
                  <CardTitle>Email Settings</CardTitle>
                  <CardDescription>Configure email sender details</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="logged_in_user_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@company.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Email address for sending and receiving replies
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/campaigns')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </div>
                ) : (
                  'Create Campaign'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
