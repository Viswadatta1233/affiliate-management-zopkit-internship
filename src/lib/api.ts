// API client for backend services
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Initialize token from localStorage on client creation
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    console.log('API client setToken called:', token);
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('Making authenticated request to:', endpoint, 'with token:', this.token.substring(0, 10) + '...');
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

// Add more API endpoints as needed