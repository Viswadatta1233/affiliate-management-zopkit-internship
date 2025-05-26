import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Tenant, Role } from '@/types';
import api from '@/lib/axios';

type AuthState = {
  user: User | null;
  tenant: Tenant | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    domain: string;
    subdomain: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  loadUserData: () => Promise<void>;
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

      loadUserData: async () => {
        // Don't load if already loading
        if (get().isLoading) {
          console.log('Already loading user data, skipping');
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const token = localStorage.getItem('token');
          console.log('Loading user data with token:', token ? token.substring(0, 10) + '...' : 'none');
          
          if (!token) {
            console.log('No token found, clearing auth state');
            set((state) => ({
              ...state,
              user: null,
              tenant: null,
              role: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              token: null
            }));
            return;
          }
          
          // Only make the API call if we have a token and no user data
          if (!get().user || !get().tenant || !get().role) {
            const response = await api.get('/auth/me');
            const { user, tenant, role } = response.data;
            
            console.log('User data loaded successfully:', { user, tenant, role });
            
            set((state) => ({
              ...state,
              user,
              tenant,
              role,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              token
            }));
          } else {
            console.log('User data already exists, skipping API call');
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          // Clear invalid token
          localStorage.removeItem('token');
          
          set((state) => ({
            ...state,
            user: null,
            tenant: null,
            role: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : "Failed to load user data",
            token: null
          }));
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', {
            email,
            password,
          });

          const { token, user, tenant, role } = response.data;
          localStorage.setItem('token', token);
          set((state) => ({
            ...state,
            user,
            tenant,
            role,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            token
          }));
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : "An error occurred during login",
            isLoading: false,
            isAuthenticated: false,
            user: null,
            tenant: null,
            role: null
          }));
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', data);
          const { token, user, tenant, role } = response.data;
          localStorage.setItem('token', token);
          set((state) => ({
            ...state,
            user,
            tenant,
            role,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            token
          }));
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : "An error occurred during registration",
            isLoading: false,
            isAuthenticated: false,
            user: null,
            tenant: null,
            role: null
          }));
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          localStorage.removeItem('token');
          set((state) => ({
            ...state,
            user: null,
            tenant: null,
            role: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            token: null
          }));
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : "An error occurred during logout",
            isLoading: false
          }));
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
);