import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface UpdateNotificationProps {
  show?: boolean;
  onDismiss?: () => void;
}

export function UpdateNotification({ show = false, onDismiss }: UpdateNotificationProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (show && !isDismissed) {
      // Simulate update progress
      const interval = setInterval(() => {
        setUpdateProgress(prev => {
          if (prev >= 100) {
            setIsComplete(true);
            clearInterval(interval);
            // Auto-dismiss after 3 seconds when complete
            setTimeout(() => {
              handleDismiss();
            }, 3000);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [show, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <AnimatePresence>
      {show && !isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <Card className="border-blue-200 bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Download className="w-5 h-5 text-blue-500 animate-pulse" />
                  )}
                  <h4 className="font-semibold text-gray-900">
                    {isComplete ? 'Actualización Completa' : 'Actualizando Sistema'}
                  </h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {isComplete 
                    ? 'La actualización se ha aplicado exitosamente. Tu sesión se mantendrá activa.'
                    : 'Estamos aplicando mejoras al sistema. Tu sesión permanecerá activa durante el proceso.'
                  }
                </p>
                
                {!isComplete && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${updateProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {updateProgress}% completado
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}