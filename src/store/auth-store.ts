import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Tenant, Role } from '@/types';
import api from '@/lib/axios';
import { api as customApi } from '@/lib/api';

type AuthState = {
  user: User | null;
  tenant: Tenant | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  isSuperAdmin: boolean;
  
  // Actions
  login: (email: string, password: string, tenant?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  setInfluencerAuth: (token: string, user: User, role: Role) => void;
  logout: () => void;
  loadUserData: () => Promise<void>;
  clearError: () => void;
};

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  domain: string;
  subdomain: string;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      token: null,
      isSuperAdmin: false,

      clearError: () => {
        set({ error: null });
      },

      login: async (email: string, password: string, tenantSubdomain?: string) => {
        const state = get();
        if (state.isLoading) return;

        try {
          set({ isLoading: true, error: null });
          const response = await api.post<{
            token: string;
            user: User;
            tenant: Tenant;
            role: Role;
          }>('/auth/login', { email, password, tenant: tenantSubdomain });
          const { token, user, tenant, role } = response.data;
          
          localStorage.setItem('token', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          customApi.setToken(token);
          
          set({
            user,
            tenant,
            role,
            token,
            isAuthenticated: true,
            isSuperAdmin: user?.email === 'zopkit@gmail.com',
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        const state = get();
        if (state.isLoading) return;

        try {
          set({ isLoading: true, error: null });
          const response = await api.post('/auth/register', data);
          const { token, user, tenant, role } = response.data;
          
          localStorage.setItem('token', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          customApi.setToken(token);
          
          set({
            user,
            tenant,
            role,
            token,
            isAuthenticated: true,
            isSuperAdmin: user?.email === 'zopkit@gmail.com',
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        customApi.clearToken();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        set({
          user: null,
          tenant: null,
          role: null,
          token: null,
          isAuthenticated: false,
          isSuperAdmin: false,
          error: null,
        });
      },

      loadUserData: async () => {
        const state = get();
        if (state.isLoading) return;

        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          set({ isLoading: true });
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          customApi.setToken(storedToken);
          
          const response = await api.get('/auth/me');
          const { user, tenant, role } = response.data;
          
          set({
            user,
            tenant,
            role,
            token: storedToken,
            isAuthenticated: true,
            isSuperAdmin: user?.email === 'zopkit@gmail.com',
            isLoading: false,
          });
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          set({
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load user data',
          });
        }
      },

      setInfluencerAuth: (token: string, user: User, role: Role) => {
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        customApi.setToken(token);
        
        set({
          user,
          tenant: null, // Influencers don't have tenants initially
          role,
          token,
          isAuthenticated: true,
          isSuperAdmin: user?.email === 'zopkit@gmail.com',
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'auth-store',
      getStorage: () => localStorage,
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          customApi.setToken(state.token);
        }
      },
    }
  )
);