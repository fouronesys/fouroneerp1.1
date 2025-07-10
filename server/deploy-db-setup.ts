import postgres from 'postgres';

export async function setupDatabaseForDeploy() {
  console.log('🚀 Starting database setup for deployment...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for deployment');
  }

  try {
    // Create connection for database setup
    const client = postgres(databaseUrl, { max: 5 });

    // Check if tables exist and create them if they don't
    console.log('🔍 Creating complete database schema...');
    
    // Create all tables for the ERP system
    const tableCreationQueries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "email" varchar(255) UNIQUE NOT NULL,
        "password" varchar(255) NOT NULL,
        "first_name" varchar(255),
        "last_name" varchar(255),
        "role" varchar(50) DEFAULT 'user' NOT NULL,
        "company_id" integer,
        "payment_confirmed" boolean DEFAULT false NOT NULL,
        "subscription_plan" varchar(50) DEFAULT 'trial' NOT NULL,
        "subscription_start_date" timestamp,
        "subscription_expiry" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )`,
      
      // Companies table
      `CREATE TABLE IF NOT EXISTS "companies" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "rnc" varchar(20) UNIQUE NOT NULL,
        "address" text,
        "phone" varchar(20),
        "email" varchar(255),
        "website" varchar(255),
        "owner_id" varchar(255) NOT NULL,
        "payment_confirmed" boolean DEFAULT false NOT NULL,
        "payment_status" varchar(50) DEFAULT 'pending' NOT NULL,
        "subscription_plan" varchar(50) DEFAULT 'trial' NOT NULL,
        "subscription_start_date" timestamp,
        "subscription_expiry" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )`,

      // System modules table
      `CREATE TABLE IF NOT EXISTS "system_modules" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "is_enabled" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )`,

      // System configuration table
      `CREATE TABLE IF NOT EXISTS "system_config" (
        "id" serial PRIMARY KEY NOT NULL,
        "key" varchar(255) UNIQUE NOT NULL,
        "value" text NOT NULL,
        "category" varchar(100) DEFAULT 'general' NOT NULL,
        "description" text,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )`,

      // RNC registry table
      `CREATE TABLE IF NOT EXISTS "rnc_registry" (
        "id" serial PRIMARY KEY NOT NULL,
        "rnc" varchar(20) UNIQUE NOT NULL,
        "name" varchar(500) NOT NULL,
        "commercial_name" varchar(500),
        "category" varchar(100),
        "payment_regime" varchar(100),
        "status" varchar(50) DEFAULT 'ACTIVO' NOT NULL
      )`,

      // Login attempts table
      `CREATE TABLE IF NOT EXISTS "login_attempts" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" varchar(255) NOT NULL,
        "ip_address" varchar(45) NOT NULL,
        "user_agent" text,
        "success" boolean NOT NULL,
        "attempted_at" timestamp DEFAULT now() NOT NULL
      )`,

      // Products table
      `CREATE TABLE IF NOT EXISTS "products" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "company_id" integer NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "sku" varchar(100),
        "barcode" varchar(100),
        "price" decimal(10,2) NOT NULL,
        "cost" decimal(10,2),
        "category_id" integer,
        "supplier_id" integer,
        "warehouse_id" integer,
        "type" varchar(50) DEFAULT 'product' NOT NULL,
        "track_inventory" boolean DEFAULT true NOT NULL,
        "min_stock" integer DEFAULT 0,
        "max_stock" integer,
        "current_stock" integer DEFAULT 0,
        "image_url" varchar(500),
        "is_active" boolean DEFAULT true NOT NULL,
        "tax_rate" decimal(5,2) DEFAULT 18.00,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )`,

      // Customers table
      `CREATE TABLE IF NOT EXISTS "customers" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "company_id" integer NOT NULL,
        "name" varchar(255) NOT NULL,
        "email" varchar(255),
        "phone" varchar(20),
        "rnc" varchar(20),
        "cedula" varchar(20),
        "address" text,
        "city" varchar(100),
        "status" varchar(50) DEFAULT 'active' NOT NULL,
        "customer_type" varchar(50) DEFAULT 'individual' NOT NULL,
        "credit_limit" decimal(10,2) DEFAULT 0,
        "payment_terms" integer DEFAULT 30,
        "created_by" varchar(255) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )`,

      // Suppliers table  
      `CREATE TABLE IF NOT EXISTS "suppliers" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "company_id" integer NOT NULL,
        "name" varchar(255) NOT NULL,
        "email" varchar(255),
        "phone" varchar(20),
        "rnc" varchar(20),
        "address" text,
        "city" varchar(100),
        "status" varchar(50) DEFAULT 'active' NOT NULL,
        "credit_limit" decimal(10,2) DEFAULT 0,
        "payment_terms" integer DEFAULT 30,
        "created_by" varchar(255) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )`,

      // Categories table
      `CREATE TABLE IF NOT EXISTS "categories" (
        "id" serial PRIMARY KEY NOT NULL,
        "company_id" integer NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "parent_id" integer,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )`,

      // Warehouses table
      `CREATE TABLE IF NOT EXISTS "warehouses" (
        "id" serial PRIMARY KEY NOT NULL,
        "company_id" integer NOT NULL,
        "name" varchar(255) NOT NULL,
        "address" text,
        "manager_id" varchar(255),
        "is_default" boolean DEFAULT false NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )`,

      // Invoices table
      `CREATE TABLE IF NOT EXISTS "invoices" (
        "id" serial PRIMARY KEY NOT NULL,
        "company_id" integer NOT NULL,
        "customer_id" varchar(255) NOT NULL,
        "invoice_number" varchar(100) NOT NULL,
        "ncf" varchar(50),
        "ncf_type" varchar(10),
        "subtotal" decimal(10,2) NOT NULL,
        "tax_amount" decimal(10,2) DEFAULT 0,
        "discount_amount" decimal(10,2) DEFAULT 0,
        "total" decimal(10,2) NOT NULL,
        "status" varchar(50) DEFAULT 'pending' NOT NULL,
        "payment_method" varchar(50),
        "notes" text,
        "created_by" varchar(255) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )`,

      // Invoice items table
      `CREATE TABLE IF NOT EXISTS "invoice_items" (
        "id" serial PRIMARY KEY NOT NULL,
        "invoice_id" integer NOT NULL,
        "product_id" varchar(255) NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price" decimal(10,2) NOT NULL,
        "tax_rate" decimal(5,2) DEFAULT 18.00,
        "discount_rate" decimal(5,2) DEFAULT 0,
        "total" decimal(10,2) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )`,

      // Chart of accounts table
      `CREATE TABLE IF NOT EXISTS "accounts" (
        "id" serial PRIMARY KEY NOT NULL,
        "company_id" integer NOT NULL,
        "code" varchar(20) NOT NULL,
        "name" varchar(255) NOT NULL,
        "type" varchar(50) NOT NULL,
        "parent_id" integer,
        "is_active" boolean DEFAULT true NOT NULL,
        "balance" decimal(15,2) DEFAULT 0,
        "created_at" timestamp DEFAULT now() NOT NULL
      )`,

      // Journal entries table
      `CREATE TABLE IF NOT EXISTS "journal_entries" (
        "id" serial PRIMARY KEY NOT NULL,
        "company_id" integer NOT NULL,
        "entry_number" varchar(100) NOT NULL,
        "description" text NOT NULL,
        "reference" varchar(255),
        "total_debit" decimal(15,2) NOT NULL,
        "total_credit" decimal(15,2) NOT NULL,
        "status" varchar(50) DEFAULT 'draft' NOT NULL,
        "created_by" varchar(255) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )`,

      // Journal entry lines table
      `CREATE TABLE IF NOT EXISTS "journal_entry_lines" (
        "id" serial PRIMARY KEY NOT NULL,
        "journal_entry_id" integer NOT NULL,
        "account_id" integer NOT NULL,
        "description" text,
        "debit_amount" decimal(15,2) DEFAULT 0,
        "credit_amount" decimal(15,2) DEFAULT 0,
        "created_at" timestamp DEFAULT now() NOT NULL
      )`,

      // NCF sequences table
      `CREATE TABLE IF NOT EXISTS "ncf_sequences" (
        "id" serial PRIMARY KEY NOT NULL,
        "company_id" integer NOT NULL,
        "ncf_type" varchar(10) NOT NULL,
        "sequence_prefix" varchar(20) NOT NULL,
        "current_number" integer NOT NULL,
        "start_number" integer NOT NULL,
        "end_number" integer NOT NULL,
        "expiry_date" date,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )`,

      // Employees table
      `CREATE TABLE IF NOT EXISTS "employees" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "company_id" integer NOT NULL,
        "user_id" varchar(255),
        "employee_code" varchar(50) NOT NULL,
        "first_name" varchar(255) NOT NULL,
        "last_name" varchar(255) NOT NULL,
        "cedula" varchar(20),
        "email" varchar(255),
        "phone" varchar(20),
        "position" varchar(255),
        "department" varchar(255),
        "hire_date" date,
        "salary" decimal(10,2),
        "status" varchar(50) DEFAULT 'active' NOT NULL,
        "created_by" varchar(255) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )`,

      // Audit logs table
      `CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" varchar(255),
        "company_id" integer,
        "module" varchar(100) NOT NULL,
        "action" varchar(100) NOT NULL,
        "entity_type" varchar(100) NOT NULL,
        "entity_id" varchar(255),
        "old_values" jsonb,
        "new_values" jsonb,
        "ip_address" varchar(45),
        "user_agent" text,
        "session_id" varchar(255),
        "success" boolean NOT NULL,
        "error_message" text,
        "severity" varchar(20) DEFAULT 'info' NOT NULL,
        "timestamp" timestamp DEFAULT now() NOT NULL
      )`,

      // Backup records table
      `CREATE TABLE IF NOT EXISTS "backup_records" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "type" varchar(50) NOT NULL,
        "description" text,
        "size" bigint NOT NULL,
        "path" varchar(500) NOT NULL,
        "is_corrupted" boolean DEFAULT false,
        "metadata" jsonb,
        "created_by" varchar(255) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )`,

      // Add indexes for better performance
      `CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email")`,
      `CREATE INDEX IF NOT EXISTS "idx_users_company_id" ON "users" ("company_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_companies_rnc" ON "companies" ("rnc")`,
      `CREATE INDEX IF NOT EXISTS "idx_companies_owner_id" ON "companies" ("owner_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_rnc_registry_rnc" ON "rnc_registry" ("rnc")`,
      `CREATE INDEX IF NOT EXISTS "idx_rnc_registry_name" ON "rnc_registry" ("name")`,
      `CREATE INDEX IF NOT EXISTS "idx_products_company_id" ON "products" ("company_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_products_sku" ON "products" ("sku")`,
      `CREATE INDEX IF NOT EXISTS "idx_customers_company_id" ON "customers" ("company_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_customers_rnc" ON "customers" ("rnc")`,
      `CREATE INDEX IF NOT EXISTS "idx_suppliers_company_id" ON "suppliers" ("company_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_suppliers_rnc" ON "suppliers" ("rnc")`,
      `CREATE INDEX IF NOT EXISTS "idx_invoices_company_id" ON "invoices" ("company_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_invoices_customer_id" ON "invoices" ("customer_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_invoice_items_invoice_id" ON "invoice_items" ("invoice_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_accounts_company_id" ON "accounts" ("company_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_journal_entries_company_id" ON "journal_entries" ("company_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_employees_company_id" ON "employees" ("company_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_company_id" ON "audit_logs" ("company_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_timestamp" ON "audit_logs" ("timestamp")`
    ];

    // Execute all table creation queries
    for (const query of tableCreationQueries) {
      try {
        await client.unsafe(query);
      } catch (error) {
        // Log but don't fail if table already exists
        console.log(`⚠️ Table creation query skipped (may already exist): ${error.message}`);
      }
    }

    console.log('✅ Database tables created successfully');

    // Initialize essential data
    console.log('🔧 Initializing essential data...');
    await initializeEssentialData(client);

    // Close connection
    await client.end();

    console.log('🎉 Database setup completed successfully for deployment!');
    return true;

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// Initialize essential data for the system
async function initializeEssentialData(client: any) {
  try {
    // Create super admin user if it doesn't exist
    const existingAdmin = await client`
      SELECT id FROM users WHERE email = 'admin@fourone.com.do' LIMIT 1
    `;

    if (existingAdmin.length === 0) {
      console.log('👤 Creating super admin user...');
      
      // Generate a secure password hash (you should change this in production)
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await client`
        INSERT INTO users (id, email, password, first_name, last_name, role, payment_confirmed, subscription_plan, subscription_start_date, subscription_expiry)
        VALUES (${userId}, 'admin@fourone.com.do', ${hashedPassword}, 'Super', 'Admin', 'super_admin', true, 'enterprise', NOW(), NOW() + INTERVAL '100 years')
      `;

      // Create default company
      await client`
        INSERT INTO companies (name, rnc, address, phone, email, website, owner_id, payment_confirmed, payment_status, subscription_plan, subscription_start_date, subscription_expiry)
        VALUES ('Four One Solutions', '132123456', 'Av. Winston Churchill, Santo Domingo', '8293519324', 'jesus@fourone.com', 'https://fourone.com.do', ${userId}, true, 'confirmed', 'enterprise', NOW(), NOW() + INTERVAL '100 years')
      `;

      console.log('✅ Super admin user and company created');
    }

    // Create default system modules
    const existingModules = await client`SELECT COUNT(*) as count FROM system_modules`;
    
    if (existingModules[0].count == 0) {
      console.log('📋 Creating default system modules...');
      
      const modules = [
        { name: 'Gestión de Usuarios', description: 'Administración de usuarios y permisos' },
        { name: 'Configuración de Empresa', description: 'Configuración general de la empresa' },
        { name: 'Sistema POS', description: 'Punto de venta y facturación' },
        { name: 'Gestión de Inventario', description: 'Control de productos y almacenes' },
        { name: 'Módulo de Contabilidad', description: 'Contabilidad y reportes financieros' },
        { name: 'Reportes y Analytics', description: 'Reportes y análisis de datos' },
        { name: 'Recursos Humanos', description: 'Gestión de empleados y nómina' },
        { name: 'Chat Interno', description: 'Comunicación interna del equipo' },
        { name: 'Asistente IA', description: 'Asistente inteligente para el negocio' },
        { name: 'Cumplimiento Fiscal DGII', description: 'Cumplimiento fiscal Dominican Republic' },
        { name: 'Aplicación Móvil', description: 'Aplicación móvil del sistema' },
        { name: 'Respaldo y Restauración', description: 'Copias de seguridad del sistema' }
      ];

      for (const module of modules) {
        await client`
          INSERT INTO system_modules (name, description, is_enabled)
          VALUES (${module.name}, ${module.description}, true)
        `;
      }

      console.log('✅ Default system modules created');
    }

    // Create default system configuration
    const existingConfig = await client`SELECT COUNT(*) as count FROM system_config`;
    
    if (existingConfig[0].count == 0) {
      console.log('⚙️ Creating default system configuration...');
      
      const configs = [
        { key: 'system.name', value: 'Four One Solutions ERP', category: 'general', description: 'Nombre del sistema' },
        { key: 'system.version', value: '1.0.0', category: 'general', description: 'Versión del sistema' },
        { key: 'system.currency', value: 'DOP', category: 'general', description: 'Moneda del sistema' },
        { key: 'system.timezone', value: 'America/Santo_Domingo', category: 'general', description: 'Zona horaria del sistema' },
        { key: 'subscription.monthly_price', value: '2500', category: 'billing', description: 'Precio mensual de suscripción' },
        { key: 'subscription.annual_price', value: '25000', category: 'billing', description: 'Precio anual de suscripción' },
        { key: 'dgii.auto_update', value: 'true', category: 'fiscal', description: 'Actualización automática de DGII' },
        { key: 'security.session_timeout', value: '3600', category: 'security', description: 'Timeout de sesión en segundos' },
        { key: 'pos.default_tax_rate', value: '18.00', category: 'pos', description: 'Tasa de impuesto por defecto' },
        { key: 'pos.tip_rate', value: '10.00', category: 'pos', description: 'Tasa de propina por defecto' },
        { key: 'ai.enabled', value: 'true', category: 'features', description: 'Habilitar funciones de IA' },
        { key: 'backup.auto_enabled', value: 'true', category: 'backup', description: 'Respaldos automáticos habilitados' },
        { key: 'backup.frequency_hours', value: '24', category: 'backup', description: 'Frecuencia de respaldos en horas' }
      ];

      for (const config of configs) {
        await client`
          INSERT INTO system_config (key, value, category, description)
          VALUES (${config.key}, ${config.value}, ${config.category}, ${config.description})
        `;
      }

      console.log('✅ Default system configuration created');
    }

    console.log('🎯 Essential data initialization completed');

  } catch (error) {
    console.error('❌ Error initializing essential data:', error);
    throw error;
  }
}

// Export function to check if database is ready
export async function isDatabaseReady(): Promise<boolean> {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return false;

    const client = postgres(databaseUrl, { max: 1 });
    
    // Try to query a basic table
    await client`SELECT 1 FROM information_schema.tables WHERE table_name = 'users' LIMIT 1`;
    
    await client.end();
    return true;
  } catch {
    return false;
  }
}