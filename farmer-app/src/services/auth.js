import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Create axios instance with base URL
export const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
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
        const token = localStorage.getItem('token');
        if (token && token.trim().length > 0) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token.trim()}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle auth errors
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('401 Unauthorized:', error.response?.data?.detail || 'Authentication failed');
        }
        return Promise.reject(error);
      }
    );

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
      if (error.response?.status === 401) {
        console.log('Token expired or invalid, clearing');
        localStorage.removeItem('token');
        setUser(null);
      } else {
        console.error('Failed to load user:', error.response?.status || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    isLoggingInRef.current = true;
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      const { access_token, user: userData } = response.data;
      
      if (!access_token || typeof access_token !== 'string') {
        console.error('Invalid token format received:', access_token);
        throw new Error('Invalid token received from server');
      }
      
      localStorage.setItem('token', access_token.trim());
      console.log('Token stored successfully');
      
      setUser(userData);
      isLoggingInRef.current = false;
      
      return { success: true };
    } catch (error) {
      isLoggingInRef.current = false;
      console.error('Login failed:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map(err => err.msg || err.message || 'Validation error').join(', ');
        }
        else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        }
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
      // Set role to FARMER for farmer app registration
      const farmerData = { ...userData, role: 'FARMER' };
      const response = await api.post('/auth/register', farmerData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration failed:', error);
      
      let errorMessage = 'Registration failed';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map(err => err.msg || err.message || 'Validation error').join(', ');
        }
        else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        }
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
    api,
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

