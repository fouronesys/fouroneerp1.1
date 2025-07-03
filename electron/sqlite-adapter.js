const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class SQLiteAdapter {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return this.db;

    const dbPath = path.join(app.getPath('userData'), 'four-one-solutions.db');
    console.log('Initializing SQLite at:', dbPath);

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 1000');
    this.db.pragma('temp_store = memory');

    this.createTables();
    this.isInitialized = true;
    
    return this.db;
  }

  createTables() {
    const schema = `
      -- Users table for offline auth
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        role TEXT DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        is_online BOOLEAN DEFAULT false,
        last_seen DATETIME,
        last_login_at DATETIME,
        job_title TEXT,
        department TEXT,
        phone_number TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Sessions table
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire DATETIME NOT NULL
      );

      -- Companies table
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        business_name TEXT,
        rnc TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        logo_url TEXT,
        industry TEXT,
        employees_count INTEGER DEFAULT 0,
        annual_revenue TEXT,
        tax_regime TEXT DEFAULT 'general',
        fiscal_year_start TEXT DEFAULT '01-01',
        currency TEXT DEFAULT 'DOP',
        timezone TEXT DEFAULT 'America/Santo_Domingo',
        is_active BOOLEAN DEFAULT true,
        subscription_plan TEXT DEFAULT 'basic',
        subscription_status TEXT DEFAULT 'active',
        trial_ends_at DATETIME,
        last_sync_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        owner_id TEXT NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      );

      -- Products table
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        cost DECIMAL(10,2),
        stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        max_stock INTEGER,
        unit TEXT DEFAULT 'unit',
        barcode TEXT,
        sku TEXT,
        weight DECIMAL(8,2),
        dimensions TEXT,
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        is_taxable BOOLEAN DEFAULT true,
        tax_rate DECIMAL(5,2) DEFAULT 18.00,
        category_id INTEGER,
        supplier_id INTEGER,
        warehouse_id INTEGER,
        company_id INTEGER NOT NULL,
        last_sync_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      );

      -- POS Cart Items
      CREATE TABLE IF NOT EXISTS pos_cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      -- POS Sales
      CREATE TABLE IF NOT EXISTS pos_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        customer_id INTEGER,
        sale_number TEXT NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        itbis DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        payment_method TEXT NOT NULL,
        cash_received DECIMAL(10,2),
        cash_change DECIMAL(10,2),
        customer_name TEXT,
        customer_phone TEXT,
        customer_rnc TEXT,
        ncf TEXT,
        ncf_type TEXT,
        ncf_sequence INTEGER,
        fiscal_period TEXT,
        notes TEXT,
        status TEXT DEFAULT 'completed',
        order_type TEXT DEFAULT 'dine_in',
        table_number TEXT,
        kitchen_status TEXT DEFAULT 'pending',
        preparation_notes TEXT,
        synced BOOLEAN DEFAULT false,
        created_by TEXT NOT NULL,
        last_sync_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- POS Sale Items
      CREATE TABLE IF NOT EXISTS pos_sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        product_code TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES pos_sales(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      -- Customers
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        rnc TEXT,
        cedula TEXT,
        type TEXT DEFAULT 'individual',
        is_active BOOLEAN DEFAULT true,
        company_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      );

      -- Sync Queue for offline operations
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
        record_id TEXT NOT NULL,
        data TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 5,
        last_error TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Offline status tracking
      CREATE TABLE IF NOT EXISTS offline_status (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        is_online BOOLEAN DEFAULT false,
        last_sync_at DATETIME,
        pending_sync_count INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Insert default offline status
      INSERT OR IGNORE INTO offline_status (id, is_online) VALUES (1, false);

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_pos_cart_company_user ON pos_cart_items(company_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_pos_sales_company ON pos_sales(company_id);
      CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, priority);
      CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);
    `;

    try {
      this.db.exec(schema);
      console.log('SQLite schema created successfully');
    } catch (error) {
      console.error('Error creating SQLite schema:', error);
      throw error;
    }
  }

  // Sync operations
  addToSyncQueue(tableName, operation, recordId, data, priority = 1) {
    const stmt = this.db.prepare(`
      INSERT INTO sync_queue (table_name, operation, record_id, data, priority)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    return stmt.run(tableName, operation, recordId, JSON.stringify(data), priority);
  }

  getSyncQueue(limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM sync_queue 
      WHERE status = 'pending' 
      ORDER BY priority DESC, created_at ASC 
      LIMIT ?
    `);
    
    return stmt.all(limit);
  }

  markSyncCompleted(syncId) {
    const stmt = this.db.prepare(`
      UPDATE sync_queue 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    return stmt.run(syncId);
  }

  markSyncFailed(syncId, error) {
    const stmt = this.db.prepare(`
      UPDATE sync_queue 
      SET status = 'failed', last_error = ?, retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    return stmt.run(error, syncId);
  }

  updateOfflineStatus(isOnline) {
    const stmt = this.db.prepare(`
      UPDATE offline_status 
      SET is_online = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `);
    
    return stmt.run(isOnline);
  }

  getOfflineStatus() {
    const stmt = this.db.prepare('SELECT * FROM offline_status WHERE id = 1');
    return stmt.get();
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

module.exports = SQLiteAdapter;