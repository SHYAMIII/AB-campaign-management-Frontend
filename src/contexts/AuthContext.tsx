import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, agentApi } from '@/lib/api';
import type { User, Agent } from '@/types';

interface AuthContextType {
  user: User | null;
  agents: Agent[];
  currentAgent: Agent | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchAgent: (agentId: string) => Promise<void>;
  refreshAgents: () => Promise<void>;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo data for preview mode
const DEMO_USER: User = {
  email: 'demo@example.com',
  agent_id: 'demo-agent-001',
  can_manage_agents: true,
};

const DEMO_AGENTS: Agent[] = [
  {
    agent_id: 'demo-agent-001',
    agent_name: 'Sales Team East',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    agent_id: 'demo-agent-002',
    agent_name: 'Sales Team West',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check for demo mode first
      const demoMode = localStorage.getItem('demo_mode');
      if (demoMode === 'true') {
        setIsDemoMode(true);
        setUser(DEMO_USER);
        setAgents(DEMO_AGENTS);
        setCurrentAgent(DEMO_AGENTS[0]);
        setIsLoading(false);
        return;
      }

      const agentId = localStorage.getItem('agent_id');
      if (agentId) {
        await refreshAgents();
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (error) {
      localStorage.removeItem('agent_id');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const enterDemoMode = () => {
    localStorage.setItem('demo_mode', 'true');
    setIsDemoMode(true);
    setUser(DEMO_USER);
    setAgents(DEMO_AGENTS);
    setCurrentAgent(DEMO_AGENTS[0]);
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const userData: User = {
      email: response.email,
      agent_id: response.agent_id,
      can_manage_agents: response.can_manage_agents,
    };
    setUser(userData);
    localStorage.setItem('agent_id', response.agent_id);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.removeItem('demo_mode');
    setIsDemoMode(false);
    await refreshAgents();
  };

  const register = async (email: string, password: string) => {
    await authApi.register(email, password);
  };

  const logout = async () => {
    try {
      if (!isDemoMode) {
        await authApi.logout();
      }
    } finally {
      setUser(null);
      setAgents([]);
      setCurrentAgent(null);
      setIsDemoMode(false);
      localStorage.removeItem('agent_id');
      localStorage.removeItem('user');
      localStorage.removeItem('demo_mode');
    }
  };

  const refreshAgents = async () => {
    if (isDemoMode) {
      setAgents(DEMO_AGENTS);
      setCurrentAgent(DEMO_AGENTS[0]);
      return;
    }
    try {
      const response = await agentApi.list();
      setAgents(response.agents);
      const agentId = localStorage.getItem('agent_id');
      const current = response.agents.find((a: Agent) => a.agent_id === agentId);
      setCurrentAgent(current || null);
    } catch (error) {
      console.error('Failed to refresh agents:', error);
    }
  };

  const switchAgent = async (agentId: string) => {
    if (isDemoMode) {
      const agent = DEMO_AGENTS.find(a => a.agent_id === agentId);
      setCurrentAgent(agent || null);
      return;
    }
    const response = await agentApi.switch(agentId);
    localStorage.setItem('agent_id', agentId);
    const agent = agents.find(a => a.agent_id === agentId);
    setCurrentAgent(agent || null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        agents,
        currentAgent,
        isLoading,
        isAuthenticated,
        isDemoMode,
        login,
        register,
        logout,
        switchAgent,
        refreshAgents,
        enterDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
