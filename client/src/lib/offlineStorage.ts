// Sistema de almacenamiento offline para Four One Solutions
import { toast } from "@/hooks/use-toast";

interface StorageItem {
  id: string;
  data: any;
  timestamp: number;
  synced: boolean;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
}

interface PendingSync {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineStorageManager {
  private dbName = 'FourOneSystemDB';
  private version = 1;
  private db: IDBDatabase | null = null;
  private isOnline = navigator.onLine;
  private syncQueue: PendingSync[] = [];
  private maxRetries = 3;

  constructor() {
    this.initDB();
    this.setupNetworkListeners();
    this.loadSyncQueue();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Almacén para datos de entidades
        if (!db.objectStoreNames.contains('entities')) {
          const entityStore = db.createObjectStore('entities', { keyPath: 'id' });
          entityStore.createIndex('table', 'table', { unique: false });
          entityStore.createIndex('synced', 'synced', { unique: false });
        }

        // Almacén para cola de sincronización
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }

        // Almacén para configuración del usuario
        if (!db.objectStoreNames.contains('userConfig')) {
          db.createObjectStore('userConfig', { keyPath: 'key' });
        }

        // Almacén para datos de sesión
        if (!db.objectStoreNames.contains('sessionData')) {
          db.createObjectStore('sessionData', { keyPath: 'key' });
        }
      };
    });
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      toast({
        title: "Conexión restaurada",
        description: "Sincronizando datos pendientes...",
        variant: "default",
      });
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast({
        title: "Sin conexión",
        description: "Los datos se guardarán localmente y se sincronizarán cuando se restaure la conexión.",
        variant: "destructive",
      });
    });
  }

  // Guardar datos localmente
  async saveEntity(table: string, data: any, operation: 'CREATE' | 'UPDATE' | 'DELETE' = 'CREATE'): Promise<void> {
    if (!this.db) await this.initDB();

    const item: StorageItem = {
      id: data.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data,
      timestamp: Date.now(),
      synced: this.isOnline,
      operation,
      table
    };

    const transaction = this.db!.transaction(['entities'], 'readwrite');
    const store = transaction.objectStore('entities');
    await store.put(item);

    // Si estamos offline, agregar a la cola de sincronización
    if (!this.isOnline) {
      await this.addToSyncQueue(table, data, operation);
    } else {
      // Intentar sincronizar inmediatamente si estamos online
      await this.syncEntity(item);
    }
  }

  // Obtener datos locales
  async getEntities(table: string): Promise<any[]> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['entities'], 'readonly');
    const store = transaction.objectStore('entities');
    const index = store.index('table');
    const request = index.getAll(table);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = request.result.map((item: StorageItem) => ({
          ...item.data,
          _localId: item.id,
          _synced: item.synced,
          _operation: item.operation
        }));
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Obtener una entidad específica
  async getEntity(table: string, id: string): Promise<any | null> {
    const entities = await this.getEntities(table);
    return entities.find(entity => entity.id === id || entity._localId === id) || null;
  }

  // Eliminar entidad local
  async deleteEntity(table: string, id: string): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['entities'], 'readwrite');
    const store = transaction.objectStore('entities');

    // Buscar la entidad por ID o localId
    const entities = await this.getEntities(table);
    const entity = entities.find(e => e.id === id || e._localId === id);

    if (entity) {
      await store.delete(entity._localId);
      
      // Si estamos offline, marcar para eliminación
      if (!this.isOnline && entity._synced) {
        await this.addToSyncQueue(table, { id: entity.id }, 'DELETE');
      }
    }
  }

  // Agregar a la cola de sincronización
  private async addToSyncQueue(table: string, data: any, operation: 'CREATE' | 'UPDATE' | 'DELETE'): Promise<void> {
    const syncItem: PendingSync = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      endpoint: this.getEndpointForTable(table),
      method: this.getMethodForOperation(operation),
      data,
      timestamp: Date.now(),
      retries: 0
    };

    this.syncQueue.push(syncItem);
    await this.saveSyncQueue();
  }

  // Obtener endpoint para tabla
  private getEndpointForTable(table: string): string {
    const endpoints: { [key: string]: string } = {
      'customers': '/api/customers',
      'products': '/api/products',
      'invoices': '/api/invoices',
      'orders': '/api/orders',
      'productionOrders': '/api/production-orders',
      'chat': '/api/chat/messages',
      'companies': '/api/companies'
    };
    return endpoints[table] || `/api/${table}`;
  }

  // Obtener método HTTP para operación
  private getMethodForOperation(operation: 'CREATE' | 'UPDATE' | 'DELETE'): 'POST' | 'PUT' | 'DELETE' {
    switch (operation) {
      case 'CREATE': return 'POST';
      case 'UPDATE': return 'PUT';
      case 'DELETE': return 'DELETE';
    }
  }

  // Procesar cola de sincronización
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const itemsToProcess = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of itemsToProcess) {
      try {
        await this.syncQueueItem(item);
        toast({
          title: "Sincronización exitosa",
          description: `Datos de ${item.endpoint} sincronizados correctamente.`,
          variant: "default",
        });
      } catch (error) {
        item.retries++;
        if (item.retries < this.maxRetries) {
          this.syncQueue.push(item);
        } else {
          console.error(`Failed to sync item after ${this.maxRetries} retries:`, item);
          toast({
            title: "Error de sincronización",
            description: `No se pudieron sincronizar algunos datos después de ${this.maxRetries} intentos.`,
            variant: "destructive",
          });
        }
      }
    }

    await this.saveSyncQueue();
  }

  // Sincronizar un elemento de la cola
  private async syncQueueItem(item: PendingSync): Promise<void> {
    const url = item.endpoint + (item.method !== 'POST' ? `/${item.data.id}` : '');
    
    const response = await fetch(url, {
      method: item.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: item.method !== 'DELETE' ? JSON.stringify(item.data) : undefined,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Marcar como sincronizado en el almacén local
    await this.markAsSynced(item.data.id || item.data._localId);
  }

  // Sincronizar entidad individual
  private async syncEntity(item: StorageItem): Promise<void> {
    if (this.isOnline) {
      try {
        const endpoint = this.getEndpointForTable(item.table);
        const method = this.getMethodForOperation(item.operation);
        const url = endpoint + (method !== 'POST' ? `/${item.data.id}` : '');

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: method !== 'DELETE' ? JSON.stringify(item.data) : undefined,
          credentials: 'include'
        });

        if (response.ok) {
          await this.markAsSynced(item.id);
        }
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
  }

  // Marcar como sincronizado
  private async markAsSynced(localId: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['entities'], 'readwrite');
    const store = transaction.objectStore('entities');
    const request = store.get(localId);

    request.onsuccess = () => {
      const item = request.result;
      if (item) {
        item.synced = true;
        store.put(item);
      }
    };
  }

  // Guardar cola de sincronización
  private async saveSyncQueue(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    await store.clear();

    for (const item of this.syncQueue) {
      await store.add(item);
    }
  }

  // Cargar cola de sincronización
  private async loadSyncQueue(): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();

    request.onsuccess = () => {
      this.syncQueue = request.result || [];
    };
  }

  // Obtener estado de sincronización
  async getSyncStatus(): Promise<{ pending: number; offline: boolean }> {
    return {
      pending: this.syncQueue.length,
      offline: !this.isOnline
    };
  }

  // Limpiar datos antiguos (más de 30 días)
  async cleanOldData(): Promise<void> {
    if (!this.db) return;

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const transaction = this.db.transaction(['entities'], 'readwrite');
    const store = transaction.objectStore('entities');
    const request = store.getAll();

    request.onsuccess = () => {
      const items = request.result;
      items.forEach((item: StorageItem) => {
        if (item.timestamp < thirtyDaysAgo && item.synced) {
          store.delete(item.id);
        }
      });
    };
  }

  // Exportar datos para backup
  async exportData(): Promise<any> {
    const entities = await this.getAllEntities();
    return {
      entities,
      syncQueue: this.syncQueue,
      timestamp: Date.now(),
      version: this.version
    };
  }

  // Obtener todas las entidades
  private async getAllEntities(): Promise<StorageItem[]> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['entities'], 'readonly');
    const store = transaction.objectStore('entities');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Instancia global del gestor de almacenamiento offline
export const offlineStorage = new OfflineStorageManager();

// Hook para usar almacenamiento offline
export function useOfflineStorage() {
  return {
    saveEntity: offlineStorage.saveEntity.bind(offlineStorage),
    getEntities: offlineStorage.getEntities.bind(offlineStorage),
    getEntity: offlineStorage.getEntity.bind(offlineStorage),
    deleteEntity: offlineStorage.deleteEntity.bind(offlineStorage),
    getSyncStatus: offlineStorage.getSyncStatus.bind(offlineStorage),
    exportData: offlineStorage.exportData.bind(offlineStorage),
    isOnline: navigator.onLine
  };
}