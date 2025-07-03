import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

interface SessionPersistenceOptions {
  heartbeatInterval?: number;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export function useSessionPersistence(options: SessionPersistenceOptions = {}) {
  const {
    heartbeatInterval = 30000, // 30 seconds
    reconnectAttempts = 5,
    reconnectDelay = 2000 // 2 seconds
  } = options;

  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectCount = useRef(0);
  const isReconnecting = useRef(false);

  // Heartbeat function to keep session alive
  const sendHeartbeat = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/auth/heartbeat', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        reconnectCount.current = 0;
        isReconnecting.current = false;
      } else if (response.status === 401) {
        // Session expired, trigger re-authentication
        handleSessionLoss();
      }
    } catch (error) {
      console.warn('Heartbeat failed:', error);
      handleConnectionLoss();
    }
  };

  // Handle session loss (401 responses)
  const handleSessionLoss = () => {
    console.log('Session lost, invalidating cache');
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    queryClient.clear();
  };

  // Handle connection loss (network errors)
  const handleConnectionLoss = async () => {
    if (isReconnecting.current || reconnectCount.current >= reconnectAttempts) {
      return;
    }

    isReconnecting.current = true;
    reconnectCount.current++;

    console.log(`Connection lost, attempting reconnect ${reconnectCount.current}/${reconnectAttempts}`);

    setTimeout(() => {
      sendHeartbeat();
    }, reconnectDelay * reconnectCount.current);
  };

  // Start heartbeat when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Clear any existing timer
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current);
      }

      // Start heartbeat
      heartbeatTimer.current = setInterval(sendHeartbeat, heartbeatInterval);

      // Send initial heartbeat
      sendHeartbeat();

      return () => {
        if (heartbeatTimer.current) {
          clearInterval(heartbeatTimer.current);
          heartbeatTimer.current = null;
        }
      };
    }
  }, [isAuthenticated, user, heartbeatInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current);
      }
    };
  }, []);

  // Listen for page visibility changes to resume heartbeat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Resume heartbeat when page becomes visible
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  return {
    isReconnecting: isReconnecting.current,
    reconnectAttempts: reconnectCount.current,
  };
}