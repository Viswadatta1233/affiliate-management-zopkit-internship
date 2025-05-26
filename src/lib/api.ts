// API client for backend services
const API_URL ='http://localhost:3000';

class ApiClient {
  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Making authenticated request to:', endpoint, 'with token:', token.substring(0, 10) + '...');
    } else {
      console.log('Making unauthenticated request to:', endpoint);
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
        console.error('API Error:', {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data }; // Wrap the response in a data property
    } catch (error) {
      console.error('API Request Failed:', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async get(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();

// Auth endpoints
export const apiAuth = {
  login: (email: string, password: string, tenant?: string) => {
    return api.post('/api/auth/login', { email, password, tenant });
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

// Product endpoints
export const apiProducts = {
  getAll: () => {
    return api.get('/api/products');
  },

  getById: (id: string) => {
    return api.get(`/api/products/${id}`);
  },

  create: (data: {
    name: string;
    description?: string;
    price: number;
    sku: string;
    commission_percent: number;
    status: 'active' | 'inactive';
  }) => {
    return api.post('/api/products', data);
  },

  update: (id: string, data: {
    name?: string;
    description?: string;
    price?: number;
    sku?: string;
    commission_percent?: number;
    status?: 'active' | 'inactive';
  }) => {
    return api.put(`/api/products/${id}`, data);
  },

  delete: (id: string) => {
    return api.delete(`/api/products/${id}`);
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

// Commission Tiers endpoints
export const apiCommissionTiers = {
  getAll: () => api.get('/api/commissions/tiers'),
  create: (data: { tier_name: string; commission_percent: number; min_sales: number }) =>
    api.post('/api/commissions/tiers', data),
  update: (id: string, data: { tier_name?: string; commission_percent?: number; min_sales?: number }) =>
    api.put(`/api/commissions/tiers/${id}`, data),
  delete: (id: string) => api.delete(`/api/commissions/tiers/${id}`),
};

// Product Commissions endpoints
export const apiProductCommissions = {
  getAll: () => api.get('/api/commissions/products'),
  update: (id: string, data: { commissionPercent: number }) =>
    api.put(`/api/commissions/products/${id}`, data),
};

// Commission Rules endpoints
export const apiCommissionRules = {
  getAll: () => api.get('/api/commissions/rules'),
  create: (data: any) => api.post('/api/commissions/rules', data),
  update: (id: string, data: any) => api.put(`/api/commissions/rules/${id}`, data),
  delete: (id: string) => api.delete(`/api/commissions/rules/${id}`),
};
