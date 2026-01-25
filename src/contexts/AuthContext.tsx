import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, agentApi } from '@/lib/api';
import type { User, Agent } from '@/types';

interface AuthContextType {
  user: User | null;
  agents: Agent[];
  currentAgent: Agent | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchAgent: (agentId: string) => Promise<void>;
  refreshAgents: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
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
    await refreshAgents();
  };

  const register = async (email: string, password: string) => {
    await authApi.register(email, password);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setAgents([]);
      setCurrentAgent(null);
      localStorage.removeItem('agent_id');
      localStorage.removeItem('user');
    }
  };

  const refreshAgents = async () => {
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
        login,
        register,
        logout,
        switchAgent,
        refreshAgents,
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
