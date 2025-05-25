import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Tenant, Role } from '@/types';
import { api } from '@/lib/api';

type AuthState = {
  user: User | null;
  tenant: Tenant | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  
  // Actions
  login: (credentials: { email: string; password: string; tenant?: string; remember?: boolean }) => Promise<{ success: boolean }>;
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
            api.setToken(token);
            const response = await api.get('/api/auth/me');
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
          api.clearToken();
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

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          // Only include tenant in request if it's provided
          const loginData = {
            email: credentials.email,
            password: credentials.password,
            remember: credentials.remember
          };
          
          if (credentials.tenant) {
            Object.assign(loginData, { tenant: credentials.tenant });
          }
          
          const response = await api.post('/api/auth/login', loginData);
          
          // The response contains token, user, tenant, and role directly
          const { token, user, tenant, role } = response.data;
          
          if (token) {
            localStorage.setItem('token', token);
            api.setToken(token);
            
            set({
              isAuthenticated: true,
              user,
              tenant,
              role,
              token,
              isLoading: false,
              error: null
            });
            
            return { success: true };
          } else {
            throw new Error('No token received from server');
          }
        } catch (error) {
          let errorMessage = 'Invalid email or password';
          
          if (error instanceof Error) {
            if (error.message.includes('tenant')) {
              errorMessage = 'Please specify your tenant subdomain';
            } else if (error.message.includes('temporary password')) {
              errorMessage = 'Please change your temporary password';
            }
          }
          
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/api/auth/register', data);
          const { token, user, tenant, role } = response.data;
          api.setToken(token);
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
        try {
          const token = localStorage.getItem('token');
          
          // Try to call the logout endpoint, but don't fail if it doesn't exist
          try {
            if (token) {
              await api.post('/api/auth/logout', {}, { 
                headers: { Authorization: `Bearer ${token}` } 
              });
            }
          } catch (error) {
            // Log but don't throw the error if the endpoint doesn't exist
            console.log('Logout endpoint not available:', error);
          }
          
          // Always clear local state and tokens
          localStorage.removeItem('token');
          api.clearToken();
          
          set({
            isAuthenticated: false,
            user: null,
            tenant: null,
            role: null,
            token: null,
            error: null
          });

          // Return to login page
          window.location.href = '/login';
        } catch (error) {
          console.error('Error during logout cleanup:', error);
          // Still try to clear everything even if there's an error
          localStorage.removeItem('token');
          api.clearToken();
          set({
            isAuthenticated: false,
            user: null,
            tenant: null,
            role: null,
            token: null,
            error: null
          });
          window.location.href = '/login';
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
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          console.log('Rehydrating token from storage:', state.token);
          api.setToken(state.token);
        } else {
          console.log('No token found in storage during rehydration');
        }
      },
    }
  )
);