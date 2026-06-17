import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch profile and addresses on boot if token is present
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const res = await API.get('/auth/profile');
          setUser(res.data.user);
          setAddresses(res.data.addresses || []);
        } catch (error) {
          console.error('Invalid token, logging out...');
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      const { token: userToken, user: userData } = res.data;
      
      localStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);
      
      // Fetch fresh addresses for this user
      const profileRes = await API.get('/auth/profile');
      setAddresses(profileRes.data.addresses || []);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await API.post('/auth/register', { name, email, password });
      const { token: userToken, user: userData } = res.data;
      
      localStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);
      setAddresses([]);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setAddresses([]);
  };

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const res = await API.get('/orders/addresses');
      setAddresses(res.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const addAddress = async (addressData) => {
    try {
      const res = await API.post('/orders/addresses', addressData);
      setAddresses((prev) => [res.data, ...prev]);
      return { success: true, address: res.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save address.'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        addresses,
        loading,
        login,
        register,
        logout,
        addAddress,
        fetchAddresses
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
