const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const { spawn } = require('child_process');
const Database = require('better-sqlite3');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;
let serverProcess;
let db;

// SQLite database initialization
function initializeDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'four-one-solutions.db');
  
  console.log('Database path:', dbPath);
  
  // Create database connection
  db = new Database(dbPath);
  
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  
  // Create tables for offline functionality
  const createTables = `
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
      owner_id TEXT NOT NULL
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

    -- POS Sales table
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
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    -- POS Sale Items table
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

    -- Cart items for persistence
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
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Sync queue for offline operations
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      data TEXT NOT NULL,
      priority INTEGER DEFAULT 1,
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  // Execute table creation
  db.exec(createTables);
  
  console.log('SQLite database initialized successfully');
  return db;
}

// Start the Express server for Electron
function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, '..', 'server', 'index.ts');
    
    serverProcess = spawn('tsx', [serverPath], {
      env: {
        ...process.env,
        NODE_ENV: 'electron',
        ELECTRON_MODE: 'true',
        DATABASE_URL: `sqlite:${path.join(app.getPath('userData'), 'four-one-solutions.db')}`,
        PORT: '3001'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
      if (data.toString().includes('serving on port')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      resolve(); // Continue even if server doesn't start properly
    }, 10000);
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'assets', 'icon.png'), // Will create this
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('http://localhost:3001');
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event handlers
app.whenReady().then(async () => {
  console.log('Electron app ready, initializing...');
  
  // Initialize SQLite database
  try {
    initializeDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    dialog.showErrorBox('Database Error', 'Failed to initialize local database. The application may not work properly offline.');
  }
  
  // Start server in production mode
  if (!isDev) {
    try {
      await startServer();
      console.log('Express server started');
    } catch (error) {
      console.error('Failed to start server:', error);
    }
  }
  
  // Create main window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Kill server process if it exists
    if (serverProcess) {
      serverProcess.kill();
    }
    
    // Close database connection
    if (db) {
      db.close();
    }
    
    app.quit();
  }
});

app.on('before-quit', () => {
  // Kill server process
  if (serverProcess) {
    serverProcess.kill();
  }
  
  // Close database connection
  if (db) {
    db.close();
  }
});

// IPC handlers for database operations
ipcMain.handle('db-query', async (event, sql, params = []) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const stmt = db.prepare(sql);
    if (sql.trim().toLowerCase().startsWith('select')) {
      return stmt.all(params);
    } else {
      return stmt.run(params);
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
});

// Export database for use in other modules
module.exports = { db };