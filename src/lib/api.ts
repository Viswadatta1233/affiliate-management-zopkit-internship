// API client for backend services
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Initialize token from localStorage on client creation
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
      console.log('API client initialized with token:', this.token ? `${this.token.substring(0, 10)}...` : 'none');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    console.log('API client setToken called:', token ? `${token.substring(0, 10)}...` : 'none');
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    console.log('API client token cleared');
  }

  async request(method: string, endpoint: string, data?: any, options: RequestInit = {}) {
    console.log(`Making ${method} request to ${endpoint}`, data);
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add any custom headers from options
      if (options.headers) {
        Object.assign(headers, options.headers);
      }

      console.log('Request headers:', headers);

      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      console.log(`Response status for ${endpoint}:`, response.status);
      
      const responseData = await response.json().catch(() => null);
      console.log(`Response data for ${endpoint}:`, responseData);

      if (!response.ok) {
        const error = new Error(responseData?.error || 'API request failed');
        (error as any).status = response.status;
        (error as any).data = responseData;
        throw error;
      }

      return {
        data: responseData,
        status: response.status,
      };
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  async get(endpoint: string, options: RequestInit = {}) {
    return this.request('GET', endpoint, undefined, options);
  }

  async post(endpoint: string, data: any, options: RequestInit = {}) {
    return this.request('POST', endpoint, data, options);
  }

  async put(endpoint: string, data: any, options: RequestInit = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  async delete(endpoint: string, options: RequestInit = {}) {
    return this.request('DELETE', endpoint, undefined, options);
  }
}

export const api = new ApiClient();

// Auth endpoints
export const apiAuth = {
  login: (email: string, password: string, tenant?: string) => {
    const endpoint = tenant 
      ? `/api/auth/login?tenant=${encodeURIComponent(tenant)}`
      : '/api/auth/login';
      
    return api.post(endpoint, { email, password });
  },
  
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    domain: string;
    subdomain: string;
  }) => {
    return api.post('/api/auth/register', data);
  },
  
  logout: () => {
    api.clearToken();
  },
};

// Affiliate endpoints
export const apiAffiliates = {
  getAll: () => {
    return api.get('/api/affiliates');
  },

  create: (data: any) => {
    return api.post('/api/affiliates', data);
  },

  update: (id: string, data: any) => {
    return api.put(`/api/affiliates/${id}`, data);
  },

  delete: (id: string) => {
    return api.delete(`/api/affiliates/${id}`);
  },
  
  invite: (data: {
    email: string;
    firstName?: string;
    lastName?: string;
    initialTier?: string;
    commissionRate?: number;
    productCommissions?: Array<{
      productId: string;
      commissionRate: number;
      commissionType: 'percentage' | 'fixed';
    }>;
  }) => {
    return api.post('/api/affiliates/invite', data);
  },
};

// Campaign endpoints
export const apiCampaigns = {
  getAll: () => {
    return api.get('/api/campaigns');
  },

  getById: (id: string) => {
    return api.get(`/api/campaigns/${id}`);
  },

  optIn: (id: string) => {
    return api.post(`/api/campaigns/${id}/opt-in`, {});
  },

  getMetrics: (id: string) => {
    return api.get(`/api/campaigns/${id}/metrics`);
  }
};

// Add more API endpoints as needed