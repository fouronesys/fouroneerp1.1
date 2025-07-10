#!/usr/bin/env tsx
/**
 * Database Initialization Script
 * Creates all necessary tables and initializes the super admin user
 */

import { db, pool } from './db';
import { eq } from 'drizzle-orm';
import { 
  users, 
  companies, 
  systemModules, 
  systemConfig, 
  warehouses,
  accounts,
  accountTypes,
  journals,
  ncfSequences
} from '@shared/schema';
import { hashPassword } from './auth';

// Check if table exists
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      )`
    );
    return result.rows[0]?.exists === true;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

// Initialize super admin user
async function initializeSuperAdmin() {
  try {
    // Check if super admin already exists
    const existingAdmin = await db.select()
      .from(users)
      .where(eq(users.email, 'admin@fourone.com.do'))
      .limit(1);

    if (existingAdmin.length > 0) {
      // Update existing admin to ensure super_admin role
      await db.update(users)
        .set({
          role: 'super_admin',
          isActive: true,
          paymentConfirmed: true,
          subscriptionPlan: 'enterprise',
          subscriptionExpiry: new Date('2125-07-10'),
        })
        .where(eq(users.email, 'admin@fourone.com.do'));
      
      console.log('✓ Super admin user updated with correct permissions');
      return existingAdmin[0];
    }

    // Create new super admin
    const hashedPassword = await hashPassword('PSzorro99**');
    const newAdmin = await db.insert(users).values({
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: 'admin@fourone.com.do',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      isActive: true,
      paymentConfirmed: true,
      subscriptionPlan: 'enterprise',
      subscriptionStartDate: new Date(),
      subscriptionExpiry: new Date('2125-07-10'),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('✓ Super admin user created successfully');
    return newAdmin[0];
  } catch (error) {
    console.error('Error initializing super admin:', error);
    throw error;
  }
}

// Initialize main company
async function initializeMainCompany(adminUserId: string) {
  try {
    const existingCompany = await db.select()
      .from(companies)
      .where(eq(companies.ownerId, adminUserId))
      .limit(1);

    if (existingCompany.length > 0) {
      console.log('✓ Main company already exists');
      return existingCompany[0];
    }

    const newCompany = await db.insert(companies).values({
      name: 'Four One Solutions',
      rnc: '132123456',
      address: 'Av. Winston Churchill, Santo Domingo',
      phone: '8293519324',
      email: 'jesus@fourone.com',
      website: 'https://fourone.com.do',
      ownerId: adminUserId,
      paymentConfirmed: true,
      paymentStatus: 'confirmed',
      subscriptionPlan: 'enterprise',
      subscriptionStartDate: new Date(),
      subscriptionExpiry: new Date('2125-07-10'),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('✓ Main company created successfully');
    return newCompany[0];
  } catch (error) {
    console.error('Error initializing company:', error);
    throw error;
  }
}

// Initialize system modules
async function initializeSystemModules() {
  try {
    const existingModules = await db.select().from(systemModules);
    if (existingModules.length > 0) {
      console.log('✓ System modules already exist');
      return;
    }

    const modules = [
      { name: 'Gestión de Usuarios', description: 'Administración de usuarios y permisos', isActive: true },
      { name: 'Configuración de Empresa', description: 'Configuración de datos empresariales', isActive: true },
      { name: 'Sistema POS', description: 'Punto de venta integrado', isActive: true },
      { name: 'Gestión de Inventario', description: 'Control de inventarios y almacenes', isActive: true },
      { name: 'Módulo de Contabilidad', description: 'Sistema contable integrado', isActive: true },
      { name: 'Reportes y Analytics', description: 'Reportes empresariales y análisis', isActive: true },
      { name: 'Recursos Humanos', description: 'Gestión de empleados y nómina', isActive: true },
      { name: 'Chat Interno', description: 'Sistema de comunicación interna', isActive: true },
      { name: 'Asistente IA', description: 'Asistente con inteligencia artificial', isActive: true },
      { name: 'Cumplimiento Fiscal DGII', description: 'Reportes fiscales para DGII', isActive: true },
      { name: 'Aplicación Móvil', description: 'Aplicación móvil empresarial', isActive: true },
      { name: 'Respaldo y Restauración', description: 'Sistema de backup automático', isActive: true },
    ];

    await db.insert(systemModules).values(modules);
    console.log('✓ System modules created successfully');
  } catch (error) {
    console.error('Error initializing system modules:', error);
    throw error;
  }
}

// Initialize system configuration
async function initializeSystemConfig() {
  try {
    const configs = [
      { category: 'system', key: 'name', value: 'Four One Solutions ERP', description: 'System name' },
      { category: 'system', key: 'version', value: '1.0.0', description: 'System version' },
      { category: 'system', key: 'currency', value: 'DOP', description: 'Default currency' },
      { category: 'system', key: 'timezone', value: 'America/Santo_Domingo', description: 'System timezone' },
      { category: 'subscription', key: 'monthly_price', value: '2500', description: 'Monthly subscription price' },
      { category: 'subscription', key: 'annual_price', value: '25000', description: 'Annual subscription price' },
      { category: 'dgii', key: 'auto_update', value: 'true', description: 'Auto update DGII data' },
      { category: 'security', key: 'session_timeout', value: '1800', description: 'Session timeout in seconds' },
      { category: 'pos', key: 'default_tax_rate', value: '18', description: 'Default ITBIS rate' },
      { category: 'pos', key: 'tip_rate', value: '10', description: 'Default tip percentage' },
      { category: 'ai', key: 'enabled', value: 'true', description: 'AI features enabled' },
      { category: 'backup', key: 'auto_enabled', value: 'true', description: 'Auto backup enabled' },
      { category: 'backup', key: 'frequency_hours', value: '24', description: 'Backup frequency in hours' },
    ];

    for (const config of configs) {
      await db.insert(systemConfig)
        .values(config)
        .onConflictDoUpdate({
          target: [systemConfig.category, systemConfig.key],
          set: { value: config.value, updatedAt: new Date() }
        });
    }

    console.log('✓ System configuration initialized');
  } catch (error) {
    console.error('Error initializing system config:', error);
    throw error;
  }
}

// Initialize default warehouse
async function initializeDefaultWarehouse(companyId: number) {
  try {
    const existingWarehouse = await db.select()
      .from(warehouses)
      .where(eq(warehouses.companyId, companyId))
      .limit(1);

    if (existingWarehouse.length > 0) {
      console.log('✓ Default warehouse already exists');
      return existingWarehouse[0];
    }

    const newWarehouse = await db.insert(warehouses).values({
      name: 'Almacén Principal',
      location: 'Santo Domingo',
      companyId: companyId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('✓ Default warehouse created successfully');
    return newWarehouse[0];
  } catch (error) {
    console.error('Error initializing warehouse:', error);
    throw error;
  }
}

// Initialize chart of accounts
async function initializeChartOfAccounts(companyId: number, userId: string) {
  try {
    // Check if accounts already exist
    const existingAccounts = await db.select()
      .from(accounts)
      .where(eq(accounts.companyId, companyId))
      .limit(1);

    if (existingAccounts.length > 0) {
      console.log('✓ Chart of accounts already exists');
      return;
    }

    // Create basic account structure for Dominican Republic
    const accountsData = [
      { code: '1010', name: 'Caja General', type: 'asset', balance: 15000 },
      { code: '1020', name: 'Banco Popular', type: 'asset', balance: 45000 },
      { code: '1110', name: 'Cuentas por Cobrar', type: 'asset', balance: 25000 },
      { code: '1210', name: 'Inventario', type: 'asset', balance: 35000 },
      { code: '1310', name: 'Equipos de Oficina', type: 'asset', balance: 20000 },
      { code: '2010', name: 'Cuentas por Pagar', type: 'liability', balance: -18000 },
      { code: '2110', name: 'ITBIS por Pagar', type: 'liability', balance: -5270 },
      { code: '2210', name: 'Préstamos por Pagar', type: 'liability', balance: -25000 },
      { code: '3010', name: 'Capital Social', type: 'equity', balance: -50000 },
      { code: '3110', name: 'Utilidades Retenidas', type: 'equity', balance: -41730 },
      { code: '4010', name: 'Ventas', type: 'revenue', balance: -1500 },
      { code: '5010', name: 'Costo de Ventas', type: 'expense', balance: 750 },
      { code: '6010', name: 'Gastos Administrativos', type: 'expense', balance: 400 },
      { code: '6020', name: 'Gastos de Venta', type: 'expense', balance: 0 },
    ];

    for (const account of accountsData) {
      await db.insert(accounts).values({
        code: account.code,
        name: account.name,
        type: account.type as any,
        balance: account.balance,
        companyId: companyId,
        isActive: true,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log('✓ Chart of accounts initialized');
  } catch (error) {
    console.error('Error initializing chart of accounts:', error);
    throw error;
  }
}

// Initialize NCF sequences for Dominican Republic
async function initializeNCFSequences(companyId: number, userId: string) {
  try {
    const existingSequences = await db.select()
      .from(ncfSequences)
      .where(eq(ncfSequences.companyId, companyId))
      .limit(1);

    if (existingSequences.length > 0) {
      console.log('✓ NCF sequences already exist');
      return;
    }

    const sequences = [
      {
        ncfType: 'B01',
        prefix: 'B01',
        currentNumber: 1,
        endNumber: 1000,
        status: 'active' as const,
        companyId,
        createdBy: userId,
      },
      {
        ncfType: 'B02',
        prefix: 'B02',
        currentNumber: 1,
        endNumber: 1000,
        status: 'active' as const,
        companyId,
        createdBy: userId,
      },
      {
        ncfType: 'B14',
        prefix: 'B14',
        currentNumber: 1,
        endNumber: 1000,
        status: 'active' as const,
        companyId,
        createdBy: userId,
      },
      {
        ncfType: 'B15',
        prefix: 'B15',
        currentNumber: 1,
        endNumber: 1000,
        status: 'active' as const,
        companyId,
        createdBy: userId,
      },
    ];

    await db.insert(ncfSequences).values(sequences);
    console.log('✓ NCF sequences initialized');
  } catch (error) {
    console.error('Error initializing NCF sequences:', error);
    throw error;
  }
}

// Main initialization function
async function initializeDatabase() {
  console.log('🚀 Starting database initialization...\n');

  try {
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✓ Database connection successful\n');

    // Check critical tables
    const criticalTables = ['users', 'companies', 'systemModules', 'systemConfig'];
    const missingTables = [];

    for (const table of criticalTables) {
      const exists = await tableExists(table);
      if (!exists) {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      console.log('⚠️  Missing tables detected:', missingTables.join(', '));
      console.log('💡 Run "npm run db:push" to create all database tables first\n');
      process.exit(1);
    }

    console.log('✓ All required tables exist\n');

    // Initialize components
    const admin = await initializeSuperAdmin();
    const company = await initializeMainCompany(admin.id);
    await initializeSystemModules();
    await initializeSystemConfig();
    await initializeDefaultWarehouse(company.id);
    await initializeChartOfAccounts(company.id, admin.id);
    await initializeNCFSequences(company.id, admin.id);

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Super Admin: admin@fourone.com.do (role: super_admin)`);
    console.log(`   • Company: ${company.name} (ID: ${company.id})`);
    console.log(`   • Modules: 12 system modules enabled`);
    console.log(`   • Config: 13 system configurations set`);
    console.log(`   • Accounting: Chart of accounts with opening balances`);
    console.log(`   • NCF: Dominican Republic fiscal sequences ready`);
    
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export { initializeDatabase };