import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginService, register as registerService, logout as logoutService, getCurrentUser } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        try {
          setToken(storedToken);
          const response = await getCurrentUser(storedToken);
          
          if (response.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            // 토큰이 유효하지 않음
            localStorage.removeItem('token');
            setToken('');
          }
        } catch (error) {
          console.error('사용자 정보 가져오기 오류:', error);
          localStorage.removeItem('token');
          setToken('');
        }
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await loginService(email, password);
      
      if (response.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (error) {
      console.error('로그인 오류:', error);
      return { success: false, message: '로그인 중 오류가 발생했습니다.' };
    }
  };

  const register = async (username, email, password, fullName = '') => {
    try {
      const response = await registerService(username, email, password, fullName);
      
      if (response.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (error) {
      console.error('회원가입 오류:', error);
      return { success: false, message: '회원가입 중 오류가 발생했습니다.' };
    }
  };

  const logout = async () => {
    try {
      await logoutService(token);
    } catch (error) {
      console.error('로그아웃 오류:', error);
    } finally {
      localStorage.removeItem('token');
      setToken('');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUserInfo = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      token,
      login,
      register,
      logout,
      updateUserInfo
    }}>
      {children}
    </AuthContext.Provider>
  );
};
