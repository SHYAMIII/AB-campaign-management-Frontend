const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const agentId = localStorage.getItem('agent_id');
  const authToken = localStorage.getItem('session_token') || localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(agentId && { 'X-Agent-ID': agentId }),
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...options.headers,
  };

  // DEBUG: log auth token and outgoing headers to verify Authorization is sent
  // Remove these logs after verification
  // eslint-disable-next-line no-console
  console.log('apiRequest authToken:', authToken);
  // eslint-disable-next-line no-console
  console.log('apiRequest headers:', headers);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('agent_id');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (response.status === 403) {
    throw new Error('Access denied');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Request failed' }));

    // Normalize error message for UI — handle arrays (e.g. validation errors), objects, and strings
    let message = 'Request failed';

    if (errorBody) {
      if (typeof errorBody === 'string') {
        message = errorBody;
      } else if (errorBody.detail) {
        if (Array.isArray(errorBody.detail)) {
          message = errorBody.detail
            .map((d: any) => {
              if (typeof d === 'string') return d;
              const msg = d.msg || d.message;
              if (msg) {
                if (d.loc && Array.isArray(d.loc)) {
                  return `${d.loc.join('.')}: ${msg}`;
                }
                return msg;
              }
              return JSON.stringify(d);
            })
            .join('; ');
        } else if (typeof errorBody.detail === 'string') {
          message = errorBody.detail;
        } else {
          message = JSON.stringify(errorBody.detail);
        }
      } else if (errorBody.message) {
        message = errorBody.message;
      } else {
        message = JSON.stringify(errorBody);
      }
    }

    throw new Error(message);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ message: string; email: string; agent_id: string; can_manage_agents: boolean }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    apiRequest<{ message: string; email: string }>('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiRequest<{ message: string }>('/logout', { method: 'POST' }),

  health: () =>
    apiRequest<{ status: string; database: string; timestamp: string }>('/health'),
};

// Campaign API
export const campaignApi = {
  list: () =>
    apiRequest<{ campaigns: any[] }>('/list-campaigns'),

  get: (campaignId: string) =>
    apiRequest<any>(`/get-campaigns/${campaignId}`),

  getStatus: (campaignId: string) =>
    apiRequest<any>(`/campaign-status/${campaignId}`),

  create: (data: {
    campaign_name: string;
    campaign_type: string;
    communication_type: string;
    start_time: string;
    end_time: string;
    timezone: string;
    campaign_prompt?: string;
    vapi_voice_id?: string;
    vapi_model?: string;
    agent_name?: string;
    logged_in_user_email?: string;
  }) => {
    const payload = {
      campaign_name: data.campaign_name,
      campaign_type: data.campaign_type,
      communication_type: data.communication_type,
      metadata: {
        start_time: data.start_time,
      },
      end_time: data.end_time,
      timezone: data.timezone,
      campaign_prompt: data.campaign_prompt,
      vapi_voice_id: data.vapi_voice_id,
      vapi_model: data.vapi_model,
      agent_name: data.agent_name,
      logged_in_user_email: data.logged_in_user_email,
    };
    return apiRequest<{ message: string; campaign_id: string }>('/create-campaign', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update: (campaignId: string, data: Partial<any>) =>
    apiRequest<{ message: string }>(`/update-campaign/${campaignId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (campaignId: string) =>
    apiRequest<{ message: string }>(`/remove-campaign/${campaignId}`, {
      method: 'DELETE',
    }),

  activate: (campaignId: string) =>
    apiRequest<{ message: string }>('/activate-campaign', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: campaignId }),
    }),

  pause: (campaignId: string) =>
    apiRequest<{ message: string }>('/pause-campaign', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: campaignId }),
    }),

  resume: (campaignId: string) =>
    apiRequest<{ message: string }>('/resume-campaign', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: campaignId }),
    }),

  getCallHistoryStats: (campaignId: string) =>
    apiRequest<any>(`/campaigns/${campaignId}/call-history/stats/`),

  getNames: () =>
    apiRequest<{ campaigns: { campaign_id: string; campaign_name: string }[] }>('/campaigns/names'),
};

// Queue API
export const queueApi = {
  getStats: () =>
    apiRequest<any>('/queue/stats'),

  getCalls: (params?: { status?: string; campaign_id?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.campaign_id) searchParams.append('campaign_id', params.campaign_id);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    return apiRequest<{ calls: any[]; total: number; filtered: number }>(
      `/queue/calls?${searchParams.toString()}`
    );
  },

  resetFailed: (campaignId?: string) =>
    apiRequest<{ message: string }>('/queue/reset-failed', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: campaignId }),
    }),

  clear: (status: string, campaignId?: string) => {
    const searchParams = new URLSearchParams({ status });
    if (campaignId) searchParams.append('campaign_id', campaignId);
    return apiRequest<{ message: string }>(`/queue/clear?${searchParams.toString()}`, {
      method: 'DELETE',
    });
  },

  processNext: () =>
    apiRequest<{ message: string; call_id?: number }>('/queue/process-next', {
      method: 'POST',
    }),
};

// Integration API
export const integrationApi = {
  checkSetup: () =>
    apiRequest<any>('/check-integration-setup'),

  getConfig: () =>
    apiRequest<any>('/get-integration-config'),

  saveConfig: (config: any) =>
    apiRequest<{ message: string }>('/save-integration-config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  getOAuthUrl: (crmType: string) =>
    apiRequest<{ auth_url: string }>(`/get_oauth_url?crm_type=${crmType}`),

  saveOAuthCredentials: (credentials: any) =>
    apiRequest<{ message: string }>('/auth_cred', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getCredentials: () =>
    apiRequest<any>('/get_cred'),

  saveZapierCredentials: (credentials: { api_key: string; secret_token: string }) =>
    apiRequest<{ message: string }>('/save-zapier-credentials', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  deleteZapierCredentials: () =>
    apiRequest<{ message: string }>('/delete-zapier-credentials', {
      method: 'DELETE',
    }),
};

// Agent API
export const agentApi = {
  list: () =>
    apiRequest<{ agents: any[] }>('/my-agents'),

  create: (agentName: string, email: string) =>
    apiRequest<{ message: string; agent_id: string; agent_name: string }>('/create-agent', {
      method: 'POST',
      body: JSON.stringify({ agent_name: agentName, email }),
    }),

  switch: (agentId: string) =>
    apiRequest<{ message: string; agent_id: string; agent_name: string }>('/switch-agent', {
      method: 'POST',
      body: JSON.stringify({ agent_id: agentId }),
    }),
};

// Excel API
export const excelApi = {
  upload: async (campaignId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const agentId = localStorage.getItem('agent_id');
    const authToken = localStorage.getItem('session_token') || localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/upload-campaign-excel/${campaignId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(agentId && { 'X-Agent-ID': agentId }),
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail);
    }

    return response.json();
  },

  downloadTemplate: (campaignId: string) =>
    `${API_BASE_URL}/download-campaign-excel/${campaignId}`,

  getUploadHistory: (campaignId: string) =>
    apiRequest<{ uploads: any[] }>(`/excel-upload-history/${campaignId}`),
};

// Error API
export const errorApi = {
  getErrors: (params?: { limit?: number; lead_id?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.lead_id) searchParams.append('lead_id', params.lead_id);
    return apiRequest<{ errors: any[]; total: number }>(`/errors?${searchParams.toString()}`);
  },
};

// CRM API
export const crmApi = {
  fetchLeadIds: (campaignId: string) =>
    apiRequest<{ message: string; lead_count: number }>(`/fetch-lead-ids?campaign_id=${campaignId}`),

  fetchLeadDetails: (leadId: string) =>
    apiRequest<any>(`/fetch-lead-details/${leadId}`),
};

// Token API
export const tokenApi = {
  getStatus: () =>
    apiRequest<{ is_expired: boolean; expires_at?: string; crm_type?: string }>('/token/status'),

  refresh: () =>
    apiRequest<{ message: string; expires_at: string }>('/token/refresh', {
      method: 'POST',
    }),
};
