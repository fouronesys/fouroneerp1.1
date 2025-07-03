import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isReconnecting?: boolean;
  reconnectAttempts?: number;
  maxAttempts?: number;
}

export function ConnectionStatus({ 
  isReconnecting = false, 
  reconnectAttempts = 0, 
  maxAttempts = 5 
}: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || isReconnecting) {
      setShowStatus(true);
    } else {
      // Hide status after 2 seconds when connection is restored
      const timer = setTimeout(() => setShowStatus(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isReconnecting]);

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        message: 'Sin conexión a internet',
        className: 'bg-red-500',
        textColor: 'text-white'
      };
    } else if (isReconnecting) {
      return {
        icon: RefreshCw,
        message: `Reconectando... (${reconnectAttempts}/${maxAttempts})`,
        className: 'bg-yellow-500',
        textColor: 'text-white'
      };
    } else {
      return {
        icon: Wifi,
        message: 'Conexión restaurada',
        className: 'bg-green-500',
        textColor: 'text-white'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50"
        >
          <div
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg',
              statusInfo.className,
              statusInfo.textColor
            )}
          >
            <IconComponent 
              className={cn(
                'w-4 h-4',
                isReconnecting && 'animate-spin'
              )} 
            />
            <span className="text-sm font-medium">
              {statusInfo.message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}