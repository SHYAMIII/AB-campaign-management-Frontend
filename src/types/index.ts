// Enums
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  COMPLETED = 'COMPLETED'
}

export enum CampaignType {
  CRM = 'CRM',
  EXCEL = 'EXCEL'
}

export enum CommunicationType {
  CALL = 'CALL',
  EMAIL = 'EMAIL'
}

export enum CampaignLeadStatus {
  QUEUED = 'QUEUED',
  CALLED = 'CALLED',
  FAILED = 'FAILED',
  NO_ANSWER = 'NO_ANSWER',
  COMPLETED = 'COMPLETED'
}

export enum IntegrationMode {
  REST = 'REST',
  ZAPIER = 'ZAPIER'
}

export enum CRMType {
  HUBSPOT = 'HUBSPOT',
  SALESFORCE = 'SALESFORCE',
  DYNAMICS = 'DYNAMICS',
  ZOHO = 'ZOHO'
}

// Interfaces
export interface User {
  email: string;
  agent_id: string;
  can_manage_agents: boolean;
}

export interface Agent {
  agent_id: string;
  agent_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  campaign_id: string;
  campaign_name: string;
  campaign_type: CampaignType;
  communication_type: CommunicationType;
  status: CampaignStatus;
  start_time: string;
  end_time: string;
  timezone: string;
  campaign_prompt?: string;
  vapi_voice_id?: string;
  vapi_model?: string;
  agent_name?: string;
  logged_in_user_email?: string;
  created_at: string;
}

export interface CampaignStats {
  campaign_id: string;
  campaign_name: string;
  status: CampaignStatus;
  total_leads: number;
  queued: number;
  called: number;
  failed: number;
  no_answer: number;
  completed: number;
  completion_percentage: number;
  meetings_scheduled_count: number;
}

export interface Lead {
  id: number;
  campaign_id: string;
  lead_id: string;
  name: string;
  contact_number: string;
  email_address?: string;
  record_prompt?: string;
  company?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  call_status?: string;
  call_summary?: string;
  created_at: string;
}

export interface CallHistory {
  id: number;
  call_session_id: string;
  campaign_id: string;
  lead_id: string;
  call_datetime: string;
  call_status: string;
  call_summary?: string;
  call_transcript?: string;
  call_duration?: number;
  sentiment_score?: number;
  reason_for_interest?: string;
  meeting_scheduled?: boolean;
  meeting_date?: string;
  crm_sync_status?: string;
  created_at: string;
}

export interface QueueStats {
  total: number;
  queued: number;
  in_progress: number;
  done: number;
  failed: number;
  by_campaign?: Record<string, {
    total: number;
    queued: number;
    done: number;
    failed: number;
  }>;
}

export interface IntegrationConfig {
  integration_mode: IntegrationMode;
  crm_type: CRMType;
  fetch_leads_url?: string;
  field_mappings?: Record<string, string>;
  is_configured: boolean;
  has_oauth_credentials: boolean;
  has_zapier_credentials: boolean;
}

export interface EmailStats {
  campaign_id: string;
  total_emails_sent: number;
  successful: number;
  failed: number;
  total_replies: number;
  reply_rate: number;
  meetings_scheduled: number;
}

export interface ErrorLog {
  id: number;
  email: string;
  lead_id?: string;
  step: string;
  error_message: string;
  status_code: number;
  created_at: string;
}
