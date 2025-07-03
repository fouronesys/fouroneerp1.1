const { ipcMain } = require('electron');
const SQLiteAdapter = require('./sqlite-adapter');

class SyncService {
  constructor() {
    this.isOnline = false;
    this.syncInProgress = false;
    this.syncInterval = null;
    this.sqliteAdapter = new SQLiteAdapter();
    
    this.setupIpcHandlers();
    this.startPeriodicSync();
  }

  setupIpcHandlers() {
    // Check online status
    ipcMain.handle('sync-get-status', () => {
      const status = this.sqliteAdapter.getOfflineStatus();
      return {
        ...status,
        syncInProgress: this.syncInProgress
      };
    });

    // Force sync
    ipcMain.handle('sync-force', async () => {
      return await this.performSync();
    });

    // Get pending sync count
    ipcMain.handle('sync-pending-count', () => {
      const queue = this.sqliteAdapter.getSyncQueue();
      return queue.length;
    });
  }

  startPeriodicSync() {
    // Check for internet connection and sync every 30 seconds
    this.syncInterval = setInterval(async () => {
      if (await this.checkInternetConnection()) {
        await this.performSync();
      }
    }, 30000);
  }

  async checkInternetConnection() {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        timeout: 5000
      });
      
      const wasOnline = this.isOnline;
      this.isOnline = response.ok;
      
      // Update offline status in database
      this.sqliteAdapter.updateOfflineStatus(this.isOnline);
      
      // If we just came back online, trigger immediate sync
      if (!wasOnline && this.isOnline) {
        console.log('[Sync] Back online, starting immediate sync');
        setTimeout(() => this.performSync(), 1000);
      }
      
      return this.isOnline;
    } catch (error) {
      this.isOnline = false;
      this.sqliteAdapter.updateOfflineStatus(false);
      return false;
    }
  }

  async performSync() {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, reason: 'Sync in progress or offline' };
    }

    this.syncInProgress = true;
    console.log('[Sync] Starting synchronization...');

    try {
      const pendingOperations = this.sqliteAdapter.getSyncQueue(50);
      const results = {
        processed: 0,
        errors: 0,
        successful: 0
      };

      for (const operation of pendingOperations) {
        try {
          await this.syncOperation(operation);
          this.sqliteAdapter.markSyncCompleted(operation.id);
          results.successful++;
        } catch (error) {
          console.error('[Sync] Operation failed:', operation.id, error);
          this.sqliteAdapter.markSyncFailed(operation.id, error.message);
          results.errors++;
        }
        results.processed++;
      }

      console.log('[Sync] Completed:', results);
      return { success: true, results };

    } catch (error) {
      console.error('[Sync] Sync failed:', error);
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncOperation(operation) {
    const { table_name, operation: op, data } = operation;
    const parsedData = JSON.parse(data);

    const baseUrl = process.env.SYNC_URL || 'http://localhost:5000';
    
    switch (table_name) {
      case 'pos_sales':
        return await this.syncPOSSale(op, parsedData);
      
      case 'pos_cart_items':
        return await this.syncCartItem(op, parsedData);
      
      case 'products':
        return await this.syncProduct(op, parsedData);
      
      case 'customers':
        return await this.syncCustomer(op, parsedData);
      
      default:
        throw new Error(`Unknown table for sync: ${table_name}`);
    }
  }

  async syncPOSSale(operation, data) {
    const url = 'http://localhost:5000/api/pos/sales';
    
    switch (operation) {
      case 'INSERT':
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Update local record with server ID
        if (result.id && data.id !== result.id) {
          const db = this.sqliteAdapter.db;
          const stmt = db.prepare('UPDATE pos_sales SET id = ? WHERE id = ?');
          stmt.run(result.id, data.id);
        }
        
        return result;
      
      case 'UPDATE':
        // Implementation for updates
        break;
      
      case 'DELETE':
        // Implementation for deletes
        break;
    }
  }

  async syncCartItem(operation, data) {
    const url = `http://localhost:5000/api/pos/cart${operation === 'DELETE' ? `/${data.id}` : ''}`;
    
    switch (operation) {
      case 'INSERT':
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      
      case 'UPDATE':
        const updateResponse = await fetch(`${url}/${data.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!updateResponse.ok) {
          throw new Error(`HTTP ${updateResponse.status}: ${updateResponse.statusText}`);
        }
        
        return await updateResponse.json();
      
      case 'DELETE':
        const deleteResponse = await fetch(url, {
          method: 'DELETE'
        });
        
        if (!deleteResponse.ok) {
          throw new Error(`HTTP ${deleteResponse.status}: ${deleteResponse.statusText}`);
        }
        
        return { success: true };
    }
  }

  async syncProduct(operation, data) {
    // Implementation for product sync
    console.log('[Sync] Product sync not implemented yet');
  }

  async syncCustomer(operation, data) {
    // Implementation for customer sync
    console.log('[Sync] Customer sync not implemented yet');
  }

  // Download data from server to local database
  async downloadDataFromServer() {
    if (!this.isOnline) {
      throw new Error('No internet connection');
    }

    try {
      console.log('[Sync] Downloading data from server...');
      
      // Download products
      const productsResponse = await fetch('http://localhost:5000/api/products');
      if (productsResponse.ok) {
        const products = await productsResponse.json();
        await this.updateLocalProducts(products);
      }

      // Download customers
      const customersResponse = await fetch('http://localhost:5000/api/customers');
      if (customersResponse.ok) {
        const customers = await customersResponse.json();
        await this.updateLocalCustomers(customers);
      }

      console.log('[Sync] Data download completed');
      
    } catch (error) {
      console.error('[Sync] Download failed:', error);
      throw error;
    }
  }

  async updateLocalProducts(products) {
    const db = this.sqliteAdapter.db;
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO products 
      (id, code, name, description, price, cost, stock, company_id, is_active, last_sync_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const transaction = db.transaction((products) => {
      for (const product of products) {
        stmt.run(
          product.id,
          product.code,
          product.name,
          product.description,
          product.price,
          product.cost,
          product.stock,
          product.companyId,
          product.isActive ? 1 : 0
        );
      }
    });

    transaction(products);
    console.log(`[Sync] Updated ${products.length} products locally`);
  }

  async updateLocalCustomers(customers) {
    const db = this.sqliteAdapter.db;
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO customers 
      (id, name, email, phone, address, rnc, company_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((customers) => {
      for (const customer of customers) {
        stmt.run(
          customer.id,
          customer.name,
          customer.email,
          customer.phone,
          customer.address,
          customer.rnc,
          customer.companyId,
          customer.isActive ? 1 : 0
        );
      }
    });

    transaction(customers);
    console.log(`[Sync] Updated ${customers.length} customers locally`);
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

module.exports = SyncService;