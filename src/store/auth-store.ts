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
  isSuperAdmin: boolean;
  
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
      isSuperAdmin: false,

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
              token: null,
              isSuperAdmin: false
            }));
            return;
          }
          
          // Only make the API call if we have a token and no user data
          if (!get().user || !get().tenant || !get().role) {
            const response = await api.get('/auth/me');
            let { user, tenant, role } = response.data;
            // Normalize tenant
            if (tenant && !tenant.tenantName && tenant.name) {
              tenant = { ...tenant, tenantName: tenant.name };
            }
            
            console.log('User data loaded successfully:', { user, tenant, role });
            
            set((state) => ({
              ...state,
              user: {
                ...user,
                role: role?.name // Ensure role is set on user object
              },
              tenant,
              role,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              token,
              isSuperAdmin: user.email === 'zopkit@gmail.com'
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
            token: null,
            isSuperAdmin: false
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

          let { token, user, tenant, role } = response.data;
          // Normalize tenant
          if (tenant && !tenant.tenantName && tenant.name) {
            tenant = { ...tenant, tenantName: tenant.name };
          }
          localStorage.setItem('token', token);
          set((state) => ({
            ...state,
            user: {
              ...user,
              role: role?.name // Ensure role is set on user object
            },
            tenant,
            role,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            token,
            isSuperAdmin: email === 'zopkit@gmail.com'
          }));
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : "An error occurred during login",
            isLoading: false,
            isAuthenticated: false,
            user: null,
            tenant: null,
            role: null,
            isSuperAdmin: false
          }));
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', data);
          let { token, user, tenant, role } = response.data;
          // Normalize tenant
          if (tenant && !tenant.tenantName && tenant.name) {
            tenant = { ...tenant, tenantName: tenant.name };
          }
          localStorage.setItem('token', token);
          set((state) => ({
            ...state,
            user: {
              ...user,
              role: role?.name // Ensure role is set on user object
            },
            tenant,
            role,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            token,
            isSuperAdmin: data.email === 'zopkit@gmail.com'
          }));
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : "An error occurred during registration",
            isLoading: false,
            isAuthenticated: false,
            user: null,
            tenant: null,
            role: null,
            isSuperAdmin: false
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
            token: null,
            isSuperAdmin: false
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
        isSuperAdmin: state.isSuperAdmin
      }),
    }
  )
);