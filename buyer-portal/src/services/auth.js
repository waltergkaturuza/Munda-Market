import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Get API base URL from environment variable, fallback to localhost for development
// Support both REACT_APP_API_URL (from vercel.json) and REACT_APP_API_BASE_URL
// Fallback to Render URL if custom domain not configured
const API_BASE = process.env.REACT_APP_API_BASE_URL || 
                 process.env.REACT_APP_API_URL || 
                 (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('mundamarket.co.zw') 
                   ? 'https://munda-market.onrender.com' 
                   : 'http://localhost:8000');
const API_BASE_URL = API_BASE.endsWith('/api/v1') ? API_BASE : `${API_BASE}/api/v1`;

// Debug logging (only in development or if explicitly enabled)
if (process.env.NODE_ENV === 'development' || window.location.search.includes('debug=api')) {
  console.log('API Configuration:', {
    REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    hostname: window.location.hostname,
    API_BASE,
    API_BASE_URL
  });
}

// Create axios instance with base URL
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth context
const AuthContext = createContext();

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLoggingInRef = useRef(false);

  // Set up axios interceptors (only once)
  useEffect(() => {
    // Add token to requests
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        // Always read fresh from localStorage (in case token was just updated)
        const token = localStorage.getItem('token');
        if (token && token.trim().length > 0) {
          // Ensure Authorization header is set correctly
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token.trim()}`;
          
          // Debug logging for /auth/me requests
          if (config.url?.includes('/auth/me')) {
            console.log('Adding token to /auth/me request:', token.substring(0, 20) + '...');
          }
        } else if (config.url?.includes('/auth/me')) {
          console.warn('No token found for /auth/me request');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle auth errors - don't auto-logout, let components handle errors
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Only log errors, don't auto-logout
        // Components should handle 401 errors appropriately
        if (error.response?.status === 401) {
          console.warn('401 Unauthorized:', error.response?.data?.detail || 'Authentication failed');
          // Don't auto-logout - let the component handle it
          // This prevents logout loops during profile updates and other operations
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Load user from token on mount
  useEffect(() => {
    const loadUserOnMount = async () => {
      const token = localStorage.getItem('token');
      if (token && token.trim().length > 0) {
        // Small delay to ensure interceptors are set up
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadUser();
      } else {
        setLoading(false);
      }
    };
    
    loadUserOnMount();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Validate token format (JWT tokens have 3 parts separated by dots)
      if (!token.includes('.')) {
        console.warn('Invalid token format, clearing');
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return;
      }
      
      const response = await api.get('/auth/me');
      setUser(response.data);
      console.log('User loaded successfully');
    } catch (error) {
      // Silently handle 401 errors on page load (token expired/invalid)
      if (error.response?.status === 401) {
        console.log('Token expired or invalid, clearing');
        localStorage.removeItem('token');
        setUser(null);
      } else {
        // Only log other errors
        console.error('Failed to load user:', error.response?.status || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    isLoggingInRef.current = true;
    try {
      // Send JSON body to match FastAPI Pydantic schema
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      const { access_token, user: userData } = response.data;
      
      // Validate token format
      if (!access_token || typeof access_token !== 'string') {
        console.error('Invalid token format received:', access_token);
        throw new Error('Invalid token received from server');
      }
      
      // Store token FIRST
      localStorage.setItem('token', access_token.trim());
      console.log('Token stored successfully');
      
      // Set user immediately from login response (we already have all the data we need)
      setUser(userData);
      
      // Mark login as complete
      isLoggingInRef.current = false;
      
      // Don't call /auth/me immediately after login - we already have user data
      // The /auth/me endpoint will be called on page refresh if needed
      
      return { success: true };
    } catch (error) {
      isLoggingInRef.current = false;
      console.error('Login failed:', error);
      
      // Handle different error formats
      let errorMessage = 'Login failed';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Handle validation errors (array format)
        if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map(err => err.msg || err.message || 'Validation error').join(', ');
        }
        // Handle single error message
        else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        }
        // Handle other error formats
        else if (data.message) {
          errorMessage = data.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Handle different error formats
      let errorMessage = 'Registration failed';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Handle validation errors (array format)
        if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map(err => err.msg || err.message || 'Validation error').join(', ');
        }
        // Handle single error message
        else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        }
        // Handle other error formats
        else if (data.message) {
          errorMessage = data.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    refreshUser,
    api, // Expose configured axios instance
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
