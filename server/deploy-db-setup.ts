import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './db-schema';

export async function setupDatabaseForDeploy() {
  console.log('🚀 Starting database setup for deployment...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for deployment');
  }

  try {
    // Create connection for migrations
    const migrationClient = postgres(databaseUrl, { max: 1 });
    const migrationDb = drizzle(migrationClient);

    // Run migrations to create tables
    console.log('📦 Running database migrations...');
    await migrate(migrationDb, { migrationsFolder: './migrations' });
    
    // Close migration connection
    await migrationClient.end();

    // Create regular connection for schema operations
    const client = postgres(databaseUrl);
    const db = drizzle(client, { schema });

    // Check if tables exist and create them if they don't
    console.log('🔍 Checking and creating tables if needed...');
    
    // Create tables using Drizzle push equivalent
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
      `CREATE INDEX IF NOT EXISTS "idx_suppliers_rnc" ON "suppliers" ("rnc")`
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

    // Close connection
    await client.end();

    console.log('🎉 Database setup completed successfully for deployment!');
    return true;

  } catch (error) {
    console.error('❌ Database setup failed:', error);
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