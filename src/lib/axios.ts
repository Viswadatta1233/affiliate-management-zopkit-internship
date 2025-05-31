import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token and CSRF tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('Request interceptor - token:', token ? token.substring(0, 20) + '...' : 'none');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Add CSRF tokens (using the JWT token as the session token for simplicity in development)
    config.headers['x-csrf-token'] = token;
    config.headers['x-session-token'] = token;
  }
  
  console.log('Request headers:', config.headers);
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export default api; 