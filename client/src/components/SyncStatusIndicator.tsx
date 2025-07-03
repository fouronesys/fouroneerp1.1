import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, RefreshCw, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { offlineStorage } from "@/lib/offlineStorage";
import { toast } from "@/hooks/use-toast";

interface SyncStatus {
  pending: number;
  offline: boolean;
}

export default function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ pending: 0, offline: !navigator.onLine });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateSyncStatus();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      updateSyncStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Actualizar estado inicial
    updateSyncStatus();

    // Actualizar cada 30 segundos
    const interval = setInterval(updateSyncStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updateSyncStatus = async () => {
    try {
      const status = await offlineStorage.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  };

  const handleExportData = async () => {
    setIsRefreshing(true);
    try {
      const data = await offlineStorage.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `four-one-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup creado",
        description: "Los datos se han exportado correctamente",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el backup",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return "bg-red-500";
    if (syncStatus.pending > 0) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusText = () => {
    if (!isOnline) return "Sin conexión";
    if (syncStatus.pending > 0) return `${syncStatus.pending} pendientes`;
    return "Sincronizado";
  };

  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
      <AnimatePresence>
        {(!isOnline || syncStatus.pending > 0) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-3"
          >
            {/* Indicador de estado */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                syncStatus.pending > 0 ? (
                  <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
                ) : (
                  <Wifi className="w-4 h-4 text-green-600" />
                )
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getStatusText()}
              </span>
            </div>

            {/* Badge de estado */}
            <Badge 
              variant={isOnline ? (syncStatus.pending > 0 ? "default" : "secondary") : "destructive"}
              className={`${getStatusColor()} text-white`}
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            </Badge>

            {/* Botón de exportar datos (solo cuando hay datos pendientes o sin conexión) */}
            {(!isOnline || syncStatus.pending > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportData}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
                title="Exportar backup de datos"
              >
                {isRefreshing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador mínimo cuando todo está sincronizado */}
      {isOnline && syncStatus.pending === 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-3 h-3 rounded-full bg-green-500 shadow-sm"
          title="Sistema sincronizado"
        />
      )}

      {/* Mensaje de alerta para datos importantes sin sincronizar */}
      <AnimatePresence>
        {!isOnline && syncStatus.pending > 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-full mt-2 right-0 bg-orange-100 dark:bg-orange-900 border border-orange-300 dark:border-orange-700 rounded-lg p-3 max-w-xs"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Datos sin sincronizar
                </p>
                <p className="text-orange-700 dark:text-orange-300 mt-1">
                  Tienes {syncStatus.pending} cambios pendientes. Se sincronizarán automáticamente cuando se restaure la conexión.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="mt-2 text-orange-800 border-orange-300 hover:bg-orange-50"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Crear backup
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}