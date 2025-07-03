// Cliente de consultas con soporte offline integrado
import { useQuery, useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { offlineStorage } from "./offlineStorage";
import { apiRequest } from "./queryClient";
import { toast } from "@/hooks/use-toast";

interface OfflineQueryOptions {
  queryKey: QueryKey;
  tableName: string;
  endpoint?: string;
  enabled?: boolean;
}

interface OfflineMutationOptions {
  tableName: string;
  endpoint: string;
  invalidateKeys?: QueryKey[];
  operation?: 'CREATE' | 'UPDATE' | 'DELETE';
}

// Hook personalizado para consultas con soporte offline
export function useOfflineQuery<T = any>({ queryKey, tableName, endpoint, enabled = true }: OfflineQueryOptions) {
  const queryClient = useQueryClient();

  return useQuery<T>({
    queryKey,
    enabled,
    queryFn: async () => {
      try {
        // Intentar obtener datos del servidor si estamos online
        if (navigator.onLine && endpoint) {
          const response = await fetch(endpoint, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Guardar datos en almacenamiento offline
            if (Array.isArray(data)) {
              for (const item of data) {
                await offlineStorage.saveEntity(tableName, item, 'UPDATE');
              }
            } else {
              await offlineStorage.saveEntity(tableName, data, 'UPDATE');
            }
            
            return data;
          }
        }
        
        // Si no hay conexión o falla la consulta, usar datos offline
        const offlineData = await offlineStorage.getEntities(tableName);
        
        if (offlineData.length === 0 && navigator.onLine) {
          throw new Error('No se pudieron obtener los datos del servidor');
        }
        
        return offlineData;
        
      } catch (error) {
        // En caso de error, intentar usar datos offline
        const offlineData = await offlineStorage.getEntities(tableName);
        
        if (offlineData.length > 0) {
          if (!navigator.onLine) {
            toast({
              title: "Modo offline",
              description: "Mostrando datos guardados localmente",
              variant: "default",
            });
          }
          return offlineData;
        }
        
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error) => {
      // Solo reintentar si estamos online
      return navigator.onLine && failureCount < 3;
    }
  });
}

// Hook para mutaciones con soporte offline
export function useOfflineMutation<TData = any, TVariables = any>({
  tableName,
  endpoint,
  invalidateKeys = [],
  operation = 'CREATE'
}: OfflineMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      // Guardar inmediatamente en almacenamiento offline
      await offlineStorage.saveEntity(tableName, variables, operation);
      
      try {
        if (navigator.onLine) {
          // Intentar sincronizar con el servidor
          let method = 'POST';
          let url = endpoint;
          
          if (operation === 'UPDATE') {
            method = 'PUT';
            url = `${endpoint}/${(variables as any).id}`;
          } else if (operation === 'DELETE') {
            method = 'DELETE';
            url = `${endpoint}/${(variables as any).id}`;
          }
          
          const response = await apiRequest(method as any, url, operation !== 'DELETE' ? variables : undefined);
          const data = await response.json();
          
          // Actualizar almacenamiento offline con datos del servidor
          if (operation !== 'DELETE') {
            await offlineStorage.saveEntity(tableName, data, 'UPDATE');
          } else {
            await offlineStorage.deleteEntity(tableName, (variables as any).id);
          }
          
          return data;
        } else {
          // Si estamos offline, devolver los datos guardados localmente
          toast({
            title: "Guardado offline",
            description: "Los datos se sincronizarán cuando se restaure la conexión",
            variant: "default",
          });
          
          return variables as TData;
        }
      } catch (error) {
        // Si falla la sincronización pero ya guardamos offline, mostrar mensaje
        if (!navigator.onLine) {
          toast({
            title: "Guardado offline",
            description: "Los datos se sincronizarán automáticamente cuando vuelva la conexión",
            variant: "default",
          });
          return variables as TData;
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar cachés relacionados
      invalidateKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la operación",
        variant: "destructive",
      });
    }
  });
}

// Hook para obtener el estado de sincronización
export function useSyncStatus() {
  return useQuery({
    queryKey: ['syncStatus'],
    queryFn: () => offlineStorage.getSyncStatus(),
    refetchInterval: 10000, // Actualizar cada 10 segundos
  });
}

// Hook para exportar datos
export function useDataExport() {
  return useMutation({
    mutationFn: async () => {
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
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Backup creado",
        description: "Los datos se han exportado correctamente",
        variant: "default",
      });
    }
  });
}

// Utilidades para trabajar con datos offline
export const offlineUtils = {
  // Verificar si una entidad está sincronizada
  isEntitySynced: (entity: any): boolean => {
    return entity._synced !== false;
  },
  
  // Obtener ID real de una entidad (puede ser local o del servidor)
  getEntityId: (entity: any): string => {
    return entity.id || entity._localId;
  },
  
  // Verificar si una entidad es local (no sincronizada)
  isLocalEntity: (entity: any): boolean => {
    return entity._localId && !entity.id;
  },
  
  // Filtrar solo entidades sincronizadas
  filterSyncedEntities: <T>(entities: T[]): T[] => {
    return entities.filter((entity: any) => offlineUtils.isEntitySynced(entity));
  },
  
  // Filtrar solo entidades pendientes de sincronización
  filterPendingEntities: <T>(entities: T[]): T[] => {
    return entities.filter((entity: any) => !offlineUtils.isEntitySynced(entity));
  }
};

// Hook de estado de conexión
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
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
  
  return isOnline;
}