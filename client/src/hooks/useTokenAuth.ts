import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  companyId?: number;
  companyName?: string;
}

interface SessionInfo {
  authenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  extendSession: () => Promise<boolean>;
}

/**
 * Hook para gestión de autenticación basada en tokens (estilo WhatsApp)
 */
export function useTokenAuth(): SessionInfo {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar estado de autenticación al cargar
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login con email y contraseña
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        return { 
          success: false, 
          message: data.message || 'Error de autenticación' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'Error de conexión. Intente nuevamente.' 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, []);

  // Extender sesión (como WhatsApp pregunta si quieres seguir conectado)
  const extendSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/extend-session', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      return response.ok && data.success;
    } catch (error) {
      console.error('Extend session error:', error);
      return false;
    }
  }, []);

  // Verificar autenticación al montar el componente
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Auto-renovación de sesión cada 25 minutos (antes del timeout de 30 min)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          // Sesión expirada, hacer logout
          setUser(null);
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    }, 25 * 60 * 1000); // 25 minutos

    return () => clearInterval(interval);
  }, [user]);

  return {
    authenticated: !!user,
    user,
    loading,
    login,
    logout,
    extendSession
  };
}