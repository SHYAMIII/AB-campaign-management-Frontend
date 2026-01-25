import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Users, Shield, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { agentApi } from '@/lib/api';
import { toast } from 'sonner';

const createAgentSchema = z.object({
  agent_name: z.string().min(1, 'Agent name is required').max(50),
});

type CreateAgentFormData = z.infer<typeof createAgentSchema>;

export default function Settings() {
  const { user, agents, currentAgent, switchAgent, refreshAgents } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<CreateAgentFormData>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      agent_name: '',
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCreateAgent = async (data: CreateAgentFormData) => {
    if (!user?.email) return;
    setIsCreating(true);
    try {
      await agentApi.create(data.agent_name, user.email);
      toast.success('Agent created successfully');
      setShowCreateDialog(false);
      form.reset();
      await refreshAgents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create agent');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchAgent = async (agentId: string) => {
    try {
      await switchAgent(agentId);
      toast.success('Switched agent successfully');
    } catch (error) {
      toast.error('Failed to switch agent');
    }
  };

  return (
    <AppLayout title="Settings">
      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="gradient-primary text-primary-foreground text-xl">
                  {getInitials(user?.email || 'U')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{user?.email}</div>
                <div className="text-sm text-muted-foreground">
                  {user?.can_manage_agents ? 'Administrator' : 'User'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Agents</CardTitle>
              <CardDescription>Manage your AI agents for different campaigns</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Agent
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.agent_id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    agent.agent_id === currentAgent?.agent_id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {getInitials(agent.agent_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{agent.agent_name}</span>
                        {agent.agent_id === currentAgent?.agent_id && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created {new Date(agent.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {agent.agent_id !== currentAgent?.agent_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchAgent(agent.agent_id)}
                    >
                      Switch
                    </Button>
                  )}
                </div>
              ))}
              {agents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No agents yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">Session Management</div>
                  <div className="text-sm text-muted-foreground">
                    Sessions expire after 30 days of inactivity
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Agent Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>
              Create a new agent to organize your campaigns separately
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateAgent)} className="space-y-4">
              <FormField
                control={form.control}
                name="agent_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Sales Team East" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Agent'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
