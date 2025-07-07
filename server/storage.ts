import {
  users,
  companies,
  companyUsers,
  warehouses,
  customers,
  suppliers,
  products,
  invoices,
  invoiceItems,
  productionOrders,
  billOfMaterials,
  bomItems,
  recipes,
  inventoryMovements,
  posSales,
  posSaleItems,
  posPrintSettings,
  posCashSessions,
  posEmployees,
  posStations,
  posCustomers,
  stockReservations,
  ncfSequences,
  aiChatMessages,
  notifications,
  notificationSettings,
  employees,
  payrollPeriods,
  payrollEntries,
  timeTracking,
  leaves,
  comprobantes605,
  comprobantes606,
  rncRegistry,
  dgiiReports,
  passwordResetTokens,
  apiDevelopers,
  apiRequests,
  posCartItems,
  chatChannels,
  chatChannelMembers,
  chatMessages,
  messageReactions,
  userRoles,
  userPermissions,
  activityLogs,
  userRoleAssignments,
  accounts,
  accountTypes,
  journalEntries,
  journalEntryLines,
  journals,
  paymentSubmissions,
  exchangeRates,
  systemModules,
  companyModules,
  systemConfig,
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type Account,
  type JournalEntry,
  type ChatChannel,
  type InsertChatChannel,
  type ChatMessage,
  type InsertChatMessage,
  type UserRole,
  type InsertUserRole,
  type UserPermission,
  type InsertUserPermission,
  type ActivityLog,
  type InsertActivityLog,
  type POSCartItem,
  type InsertPOSCartItem,
  type Notification,
  type InsertNotification,
  type Employee,
  type InsertEmployee,
  type PayrollPeriod,
  type InsertPayrollPeriod,
  type PayrollEntry,
  type InsertPayrollEntry,
  type TimeTracking,
  type InsertTimeTracking,
  type Leave,
  type InsertLeave,
  type CompanyUser,
  type InsertCompanyUser,
  type Warehouse,
  type InsertWarehouse,
  type Customer,
  type InsertCustomer,
  // Supplier types moved to purchases module
  type Product,
  type InsertProduct,
  type SystemModule,
  type InsertSystemModule,
  type CompanyModule,
  type InsertCompanyModule,
  type SystemConfig,
  type InsertSystemConfig,
  type Invoice,
  type InsertInvoice,
  type ProductionOrder,
  type InsertProductionOrder,
  type BillOfMaterials,
  type InsertBillOfMaterials,
  type BOMItem,
  type InsertBOMItem,
  type POSSale,
  type InsertPOSSale,
  type POSSaleItem,
  type InsertPOSSaleItem,
  type POSPrintSettings,
  type InsertPOSPrintSettings,
  type POSCashSession,
  type InsertPOSCashSession,
  type POSEmployee,
  type InsertPOSEmployee,
  type POSStation,
  type InsertPOSStation,
  type POSCustomer,
  type InsertPOSCustomer,
  type StockReservation,
  type InsertStockReservation,
  type NCFSequence,
  type InsertNCFSequence,
  type Comprobante605,
  type InsertComprobante605,
  type Comprobante606,
  type InsertComprobante606,
  type RNCRegistry,
  type InsertRNCRegistry,
  type AIChatMessage,
  type InsertAIChatMessage,
  type ExchangeRate,
  type InsertExchangeRate,
  type ApiDeveloper,
  type InsertApiDeveloper,
  type ApiRequest,
  type InsertApiRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, lt, count, sum, isNull, like, or, asc, inArray, ilike } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";

const PostgresSessionStore = connectPg(session);
const MemStoreSession = MemoryStore(session);

// Interface for storage operations
export interface IStorage {
  sessionStore: session.Store;
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isActive?: boolean;
  }): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  updateUserPassword(id: string, password: string): Promise<void>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  logLoginAttempt(attempt: {
    email: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    failureReason?: string;
  }): Promise<void>;
  getRecentLoginAttempts(email: string, minutes: number): Promise<Array<{
    email: string;
    success: boolean;
    attemptedAt: Date;
  }>>;
  
  // Company operations
  createCompany(company: InsertCompany & { ownerId: string }): Promise<Company>;
  getCompanyByUserId(userId: string): Promise<Company | undefined>;
  getCompanyById(id: number): Promise<Company | undefined>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: number): Promise<void>;
  
  // Super Admin operations
  getAllCompanies(): Promise<Company[]>;
  getAllCompaniesWithDetails(): Promise<any[]>;
  getCompany(id: number): Promise<Company | undefined>;
  updateCompanyStatus(id: number, isActive: boolean, notes?: string): Promise<Company>;
  createCompanyForUser(company: InsertCompany, userId: string): Promise<Company>;
  getUserCompanies(userId: string): Promise<Company[]>;
  
  // Company User operations
  addUserToCompany(userId: string, companyId: number, role: string): Promise<CompanyUser>;
  getUserRole(userId: string, companyId?: number): Promise<string | null>;
  isUserSuperAdmin(userId: string): Promise<boolean>;
  
  // Warehouse operations
  getWarehouses(companyId: number): Promise<Warehouse[]>;
  getDefaultWarehouse(companyId: number): Promise<Warehouse>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>, companyId: number): Promise<Warehouse | undefined>;
  deleteWarehouse(id: number, companyId: number): Promise<void>;
  
  // Customer operations
  getCustomers(companyId: number): Promise<Customer[]>;
  getCustomer(id: number, companyId: number): Promise<Customer | undefined>;
  getCustomerByRNC(companyId: number, rnc: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>, companyId: number): Promise<Customer | undefined>;
  deleteCustomer(id: number, companyId: number): Promise<void>;
  getCustomerById(id: number, companyId: number): Promise<Customer | undefined>;
  
  // Supplier operations
  getSuppliers(companyId: number): Promise<any[]>;
  getSupplier(id: number, companyId: number): Promise<any | null>;
  createSupplier(supplier: any): Promise<any>;
  updateSupplier(id: number, supplier: any): Promise<any>;
  deleteSupplier(id: number, companyId: number): Promise<void>;
  
  // Purchase Orders operations
  getPurchaseOrders(companyId: number): Promise<any[]>;
  createPurchaseOrder(order: any): Promise<any>;
  
  // Purchase Invoices operations
  getPurchaseInvoices(companyId: number): Promise<any[]>;
  createPurchaseInvoice(invoice: any): Promise<any>;
  
  // Purchase Stats
  getPurchasesStats(companyId: number): Promise<any>;
  
  // Product operations
  getProducts(companyId: number): Promise<Product[]>;
  getProduct(id: number, companyId: number): Promise<Product | undefined>;
  getProductsWithoutImages(companyId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>, companyId: number): Promise<Product | undefined>;
  deleteProduct(id: number, companyId: number): Promise<void>;
  
  // Inventory Movement operations
  getInventoryMovements(companyId: number): Promise<any[]>;
  createInventoryMovement(movement: any): Promise<any>;
  
  // Invoice operations
  getInvoices(companyId: number): Promise<Invoice[]>;
  getInvoicesByPeriod(companyId: number, period: string): Promise<Invoice[]>;
  getInvoice(id: number, companyId: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>, companyId: number): Promise<Invoice | undefined>;
  updateInvoiceStatus(id: number, status: string, companyId: number): Promise<boolean>;
  deleteInvoice(id: number, companyId: number): Promise<void>;
  
  // Production Order operations
  getProductionOrders(companyId: number): Promise<ProductionOrder[]>;
  createProductionOrder(order: InsertProductionOrder): Promise<ProductionOrder>;
  
  // BOM operations
  getBOMByProduct(productId: number, companyId: number): Promise<any[]>;
  createBOMItem(bomItem: any): Promise<any>;
  updateBOMItem(id: number, bomItem: any, companyId: number): Promise<any>;
  deleteBOMItem(id: number, companyId: number): Promise<void>;
  
  // POS operations
  getPOSSales(companyId: number): Promise<POSSale[]>;
  getPOSSale(id: number, companyId: number): Promise<POSSale | undefined>;
  createPOSSale(sale: InsertPOSSale): Promise<POSSale>;
  getPOSSaleItems(saleId: number): Promise<POSSaleItem[]>;
  verifySaleById(saleId: number): Promise<{sale: POSSale, company: Company, items: POSSaleItem[]} | null>;
  createPOSSaleItem(item: InsertPOSSaleItem): Promise<POSSaleItem>;
  getPOSPrintSettings(companyId: number): Promise<POSPrintSettings | undefined>;
  upsertPOSPrintSettings(settings: InsertPOSPrintSettings): Promise<POSPrintSettings>;
  
  // POS Cart operations
  getPOSCartItems(companyId: number, userId: string): Promise<any[]>;
  getPOSCartItem(cartId: number): Promise<POSCartItem | undefined>;
  addToPOSCart(cartItem: InsertPOSCartItem): Promise<POSCartItem>;
  updatePOSCartItem(cartId: number, quantity: number): Promise<POSCartItem | undefined>;
  removePOSCartItem(cartId: number): Promise<void>;
  clearPOSCart(companyId: number, userId: string): Promise<void>;
  
  // Dashboard metrics
  getDashboardMetrics(companyId: number): Promise<{
    monthSales: string;
    pendingInvoices: number;
    productsInStock: number;
    productionOrders: number;
  }>;
  
  // Notification operations
  getNotifications(userId: string, companyId: number): Promise<Notification[]>;
  createNotification(notification: typeof notifications.$inferInsert): Promise<Notification>;
  markNotificationAsRead(id: number, userId: string): Promise<void>;
  deleteNotification(id: number, userId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string, companyId: number): Promise<void>;
  clearAllNotifications(userId: string, companyId: number): Promise<void>;
  
  // Employee operations
  getEmployees(companyId: number): Promise<Employee[]>;
  getEmployeesWithUsers(companyId: number): Promise<any[]>;
  getEmployee(id: number, companyId: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>, companyId: number): Promise<Employee | undefined>;
  deleteEmployee(id: number, companyId: number): Promise<void>;
  
  // Company User operations  
  getCompanyUsers(companyId: number): Promise<any[]>;
  getUserByEmail(email: string): Promise<any | undefined>;
  
  // Payroll Period operations
  getPayrollPeriods(companyId: number): Promise<PayrollPeriod[]>;
  getPayrollPeriod(id: number, companyId: number): Promise<PayrollPeriod | undefined>;
  createPayrollPeriod(period: InsertPayrollPeriod): Promise<PayrollPeriod>;
  updatePayrollPeriod(id: number, period: Partial<InsertPayrollPeriod>, companyId: number): Promise<PayrollPeriod | undefined>;
  deletePayrollPeriod(id: number, companyId: number): Promise<void>;
  
  // Payroll Entry operations
  getPayrollEntries(companyId: number, periodId?: number): Promise<PayrollEntry[]>;
  getPayrollEntry(id: number, companyId: number): Promise<PayrollEntry | undefined>;
  createPayrollEntry(entry: InsertPayrollEntry): Promise<PayrollEntry>;
  updatePayrollEntry(id: number, entry: Partial<InsertPayrollEntry>, companyId: number): Promise<PayrollEntry | undefined>;
  deletePayrollEntry(id: number, companyId: number): Promise<void>;
  
  // Time Tracking operations
  getTimeTracking(companyId: number, employeeId?: number): Promise<TimeTracking[]>;
  getTimeTrackingEntry(id: number, companyId: number): Promise<TimeTracking | undefined>;
  createTimeTracking(timeEntry: InsertTimeTracking): Promise<TimeTracking>;
  updateTimeTracking(id: number, timeEntry: Partial<InsertTimeTracking>, companyId: number): Promise<TimeTracking | undefined>;
  deleteTimeTracking(id: number, companyId: number): Promise<void>;
  
  // Leave operations
  getLeaves(companyId: number, employeeId?: number): Promise<Leave[]>;
  getLeave(id: number, companyId: number): Promise<Leave | undefined>;
  createLeave(leave: InsertLeave): Promise<Leave>;
  updateLeave(id: number, leave: Partial<InsertLeave>, companyId: number): Promise<Leave | undefined>;
  deleteLeave(id: number, companyId: number): Promise<void>;

  // RNC Registry operations
  searchRNC(rnc: string): Promise<RNCRegistry | undefined>;
  createRNCRegistry(rncData: InsertRNCRegistry): Promise<RNCRegistry>;
  bulkCreateRNCRegistry(records: InsertRNCRegistry[]): Promise<{ inserted: number; skipped: number }>;
  getRNCRegistryCount(): Promise<number>;
  clearRNCRegistry(): Promise<void>;
  deleteRNCRecordsChunk(chunkSize: number): Promise<{ deleted: number }>;

  // Exchange Rate operations for Multi-Currency
  getExchangeRate(currency: string): Promise<ExchangeRate | undefined>;
  getAllExchangeRates(): Promise<ExchangeRate[]>;
  upsertExchangeRate(rateData: InsertExchangeRate): Promise<ExchangeRate>;
  deleteExchangeRate(currency: string): Promise<void>;

  // Period-based data operations for fiscal reports
  getPOSSalesByPeriod(companyId: number, startDate: Date, endDate: Date): Promise<POSSale[]>;
  getPurchasesByPeriod(companyId: number, startDate: Date, endDate: Date): Promise<any[]>;

  // NCF Sequence operations for Fiscal Receipts
  getNextNCF(companyId: number, ncfType: string): Promise<string | null>;
  getNCFSequences(companyId: number): Promise<NCFSequence[]>;
  getNCFSequenceById(id: number): Promise<NCFSequence | undefined>;
  createNCFSequence(ncfData: InsertNCFSequence): Promise<NCFSequence>;
  updateNCFSequence(id: number, updateData: Partial<InsertNCFSequence>): Promise<NCFSequence | undefined>;
  deleteNCFSequence(id: number): Promise<void>;
  incrementNCFSequence(companyId: number, ncfType: string): Promise<void>;

  // POS Multi-Station operations
  // Employee management
  getPOSEmployees(companyId: number): Promise<POSEmployee[]>;
  getPOSEmployee(id: number, companyId: number): Promise<POSEmployee | undefined>;
  createPOSEmployee(employee: InsertPOSEmployee): Promise<POSEmployee>;
  updatePOSEmployee(id: number, employee: Partial<InsertPOSEmployee>, companyId: number): Promise<POSEmployee | undefined>;
  deletePOSEmployee(id: number, companyId: number): Promise<void>;
  authenticatePOSEmployee(employeeCode: string, pin: string, companyId: number): Promise<POSEmployee | null>;
  
  // Station management
  getPOSStations(companyId: number): Promise<POSStation[]>;
  getPOSStation(id: number, companyId: number): Promise<POSStation | undefined>;
  createPOSStation(station: InsertPOSStation): Promise<POSStation>;
  updatePOSStation(id: number, station: Partial<InsertPOSStation>, companyId: number): Promise<POSStation | undefined>;
  deletePOSStation(id: number, companyId: number): Promise<void>;
  
  // Cash session management
  getPOSCashSessions(companyId: number, stationId?: number): Promise<POSCashSession[]>;
  getPOSCashSession(id: number, companyId: number): Promise<POSCashSession | undefined>;
  createPOSCashSession(session: InsertPOSCashSession): Promise<POSCashSession>;
  updatePOSCashSession(id: number, session: Partial<InsertPOSCashSession>, companyId: number): Promise<POSCashSession | undefined>;
  closePOSCashSession(id: number, closingData: any, companyId: number): Promise<POSCashSession | undefined>;
  
  // Customer management with RNC validation
  getPOSCustomers(companyId: number): Promise<POSCustomer[]>;
  getPOSCustomer(id: number, companyId: number): Promise<POSCustomer | undefined>;
  createPOSCustomer(customer: InsertPOSCustomer): Promise<POSCustomer>;
  updatePOSCustomer(id: number, customer: Partial<InsertPOSCustomer>, companyId: number): Promise<POSCustomer | undefined>;
  deletePOSCustomer(id: number, companyId: number): Promise<void>;
  validateCustomerRNC(rnc: string, companyId: number): Promise<{ valid: boolean; data?: any }>;
  
  // RNC Registry operations
  getRNCFromRegistry(rnc: string): Promise<RNCRegistry | undefined>;
  searchRNCByName(query: string, limit?: number): Promise<RNCRegistry[]>;
  searchRNCRegistry(searchTerm: string, limit?: number): Promise<RNCRegistry[]>;

  // Stock Reservation operations for cart synchronization
  createStockReservation(reservationData: InsertStockReservation): Promise<StockReservation>;
  releaseStockReservations(sessionId: string): Promise<void>;
  getStockReservations(productId: number): Promise<StockReservation[]>;
  cleanExpiredReservations(): Promise<void>;

  // Manufacturing Module operations
  getProductionOrders(companyId: number): Promise<ProductionOrder[]>;
  createProductionOrder(orderData: InsertProductionOrder): Promise<ProductionOrder>;
  updateProductionOrder(orderId: number, updateData: any, companyId: number): Promise<ProductionOrder>;
  deleteProductionOrder(orderId: number, companyId: number): Promise<void>;
  
  // Legacy BOM operations (to be migrated)
  getBOMByProduct(productId: number, companyId: number): Promise<any[]>;
  createBOMItem(bomData: any): Promise<any>;
  updateBOMItem(bomId: number, updateData: any, companyId: number): Promise<any>;
  deleteBOMItem(bomId: number, companyId: number): Promise<void>;
  
  // Manufacturing cost calculation
  calculateManufacturingCosts(productId: number, quantity: number, companyId: number): Promise<any>;
  
  // Profile and Settings operations
  getUserById(userId: string): Promise<User | undefined>;
  updateUser(userId: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  getCompanySettings(companyId: number): Promise<any>;
  updateCompanySettings(companyId: number, settings: any): Promise<any>;

  // Module Management operations
  getSystemModules(): Promise<SystemModule[]>;
  getSystemModule(id: number): Promise<SystemModule | undefined>;
  createSystemModule(module: InsertSystemModule): Promise<SystemModule>;
  updateSystemModule(id: number, updates: Partial<InsertSystemModule>): Promise<SystemModule | undefined>;
  deleteSystemModule(id: number): Promise<void>;
  
  // Company Module operations
  getCompanyModules(companyId: number): Promise<(CompanyModule & { module: SystemModule })[]>;
  getCompanyModule(companyId: number, moduleId: number): Promise<CompanyModule | undefined>;
  enableCompanyModule(companyId: number, moduleId: number, enabledBy: string): Promise<CompanyModule>;
  disableCompanyModule(companyId: number, moduleId: number, disabledBy: string): Promise<CompanyModule>;
  updateCompanyModuleSettings(companyId: number, moduleId: number, settings: any): Promise<CompanyModule | undefined>;
  
  // System Configuration operations
  getSystemConfigs(category?: string): Promise<SystemConfig[]>;
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  upsertSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  deleteSystemConfig(key: string): Promise<void>;

  // API Developer operations
  createApiDeveloper(developer: InsertApiDeveloper): Promise<ApiDeveloper>;
  getApiDeveloperByKey(apiKey: string): Promise<ApiDeveloper | undefined>;
  getApiDeveloperByEmail(email: string): Promise<ApiDeveloper | undefined>;
  updateApiDeveloper(id: number, updates: Partial<InsertApiDeveloper>): Promise<ApiDeveloper | undefined>;
  logApiRequest(request: InsertApiRequest): Promise<ApiRequest>;
  getApiDeveloperStats(developerId: number): Promise<{ requestsCount: number; lastRequestAt: Date | null }>;

  // Manufacturing and BOM operations
  calculateManufacturedProductCost(productId: number, companyId: number): Promise<number>;
  checkMaterialAvailability(productId: number, quantity: number, companyId: number): Promise<{ available: boolean; missing: Array<{ materialId: number; required: number; available: number }> }>;
  processManufacturedProductSale(productId: number, quantity: number, companyId: number, userId: string): Promise<void>;
  getBOMForProduct(productId: number, companyId: number): Promise<Array<{ materialId: number; quantity: number; material: Product }>>;

  // NCF Sequence Management
  getNextNCF(companyId: number, ncfType: string): Promise<string | null>;
  incrementNCFSequence(companyId: number, ncfType: string): Promise<void>;
  createNCFSequence(sequenceData: any): Promise<any>;
  getNCFSequences(companyId: number): Promise<any[]>;
  getNCFSequenceById(id: number): Promise<any>;
  updateNCFSequence(id: number, updateData: any): Promise<any>;
  deleteNCFSequence(id: number): Promise<void>;

  // POS Cart operations
  clearPOSCart(companyId: number, userId: string): Promise<void>;
  addToPOSCart(cartData: any): Promise<any>;
  getPOSCartItems(companyId: number, userId: string): Promise<any[]>;

  // Recipe operations
  getRecipes(companyId: number): Promise<any[]>;
  getRecipe(id: number, companyId: number): Promise<any | undefined>;
  createRecipe(recipeData: any): Promise<any>;
  updateRecipe(id: number, updateData: any, companyId: number): Promise<any>;
  deleteRecipe(id: number, companyId: number): Promise<void>;

  // Fiscal operations
  getFiscal606Data(companyId: number, period: string): Promise<any[]>;
  getFiscal607Data(companyId: number, period: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Use memory store for better development stability
    this.sessionStore = new MemStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Company operations
  async createCompany(companyData: InsertCompany & { ownerId: string }): Promise<Company> {
    try {
      console.log('=== CREATE COMPANY STORAGE ===');
      console.log('Input data:', JSON.stringify(companyData, null, 2));
      
      // Validate company name uniqueness
      console.log('Checking company name uniqueness...');
      const existingCompanyByName = await db
        .select()
        .from(companies)
        .where(eq(companies.name, companyData.name))
        .limit(1);
      
      if (existingCompanyByName.length > 0) {
        throw new Error(`Ya existe una empresa registrada con el nombre "${companyData.name}"`);
      }

      // Validate RNC uniqueness if provided
      if (companyData.rnc && companyData.rnc.trim() !== '') {
        console.log('Checking RNC uniqueness...');
        const existingCompanyByRNC = await db
          .select()
          .from(companies)
          .where(eq(companies.rnc, companyData.rnc))
          .limit(1);
        
        if (existingCompanyByRNC.length > 0) {
          throw new Error(`Ya existe una empresa registrada con el RNC "${companyData.rnc}"`);
        }

        // Validate RNC format (Dominican Republic format: 9 or 11 digits)
        const rncPattern = /^[0-9]{9}$|^[0-9]{11}$/;
        if (!rncPattern.test(companyData.rnc)) {
          throw new Error('El RNC debe tener 9 o 11 dígitos');
        }
      }

      // Set subscription dates based on plan
      console.log('Preparing data for insertion...');
      const dataToInsert = { 
        ...companyData,
        rnc: companyData.rnc?.trim() || null // Store null if empty
      };
      
      if (!companyData.subscriptionExpiry) {
        const { calculateSubscriptionExpiry } = await import('./subscription-service');
        const now = new Date();
        dataToInsert.subscriptionStartDate = now;
        dataToInsert.subscriptionExpiry = calculateSubscriptionExpiry(
          companyData.subscriptionPlan || 'enterprise', 
          now
        );
        console.log(`[Registration] Setting ${companyData.subscriptionPlan || 'enterprise'} plan expiry to:`, dataToInsert.subscriptionExpiry);
      }
      
      console.log('Final data to insert:', JSON.stringify(dataToInsert, null, 2));
      
      const [company] = await db
        .insert(companies)
        .values({
          ...dataToInsert,
          ownerId: companyData.ownerId
        })
        .returning();
        
      console.log('Company insertion successful:', company.id);
      return company;
    } catch (error) {
      console.error('=== CREATE COMPANY ERROR ===');
      console.error('Error details:', error);
      throw error;
    }
  }

  async createCompanyWithInvitation(companyData: Omit<InsertCompany, 'ownerId'> & { 
    ownerEmail: string;
    invitationToken: string;
    invitationExpiresAt: Date;
  }): Promise<Company> {
    // Validate company name uniqueness
    const existingCompanyByName = await db
      .select()
      .from(companies)
      .where(eq(companies.name, companyData.name))
      .limit(1);
    
    if (existingCompanyByName.length > 0) {
      throw new Error(`Ya existe una empresa registrada con el nombre "${companyData.name}"`);
    }

    // Validate email uniqueness
    const existingUserByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, companyData.ownerEmail))
      .limit(1);
    
    if (existingUserByEmail.length > 0) {
      throw new Error(`Ya existe un usuario registrado con el email "${companyData.ownerEmail}"`);
    }

    // Validate RNC uniqueness if provided
    if (companyData.rnc && companyData.rnc.trim() !== '') {
      const existingCompanyByRNC = await db
        .select()
        .from(companies)
        .where(eq(companies.rnc, companyData.rnc))
        .limit(1);
      
      if (existingCompanyByRNC.length > 0) {
        throw new Error(`Ya existe una empresa registrada con el RNC "${companyData.rnc}"`);
      }

      // Validate RNC format (Dominican Republic format: 9 or 11 digits)
      const rncPattern = /^[0-9]{9}$|^[0-9]{11}$/;
      if (!rncPattern.test(companyData.rnc)) {
        throw new Error('El RNC debe tener 9 o 11 dígitos');
      }
    }

    // Create temporary user for the company owner
    const tempUserId = `temp_${Math.random().toString(36).substr(2, 9)}`;
    
    const [tempUser] = await db
      .insert(users)
      .values({
        id: tempUserId,
        email: companyData.ownerEmail,
        firstName: 'Pendiente',
        lastName: 'Registro',
        password: '', // Will be set during registration
        isActive: false, // Inactive until registration is completed
      })
      .returning();

    const [company] = await db
      .insert(companies)
      .values({
        ...companyData,
        rnc: companyData.rnc?.trim() || null, // Store null if empty
        ownerId: tempUser.id,
        registrationStatus: 'pending',
        invitationToken: companyData.invitationToken,
        invitationSentAt: new Date(),
        invitationExpiresAt: companyData.invitationExpiresAt,
      })
      .returning();
    
    return company;
  }

  async getCompanyByInvitationToken(token: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.invitationToken, token),
        eq(companies.registrationStatus, 'pending'),
        sql`${companies.invitationExpiresAt} > NOW()`
      ))
      .limit(1);
    return company;
  }

  async completeCompanyRegistration(
    token: string, 
    userData: { 
      firstName: string; 
      lastName: string; 
      password: string; 
    }
  ): Promise<{ company: Company; user: User } | null> {
    const company = await this.getCompanyByInvitationToken(token);
    if (!company) return null;

    // Update the temporary user with real data
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, company.ownerId))
      .returning();

    // Update company registration status
    const [updatedCompany] = await db
      .update(companies)
      .set({
        registrationStatus: 'completed',
        invitationToken: null, // Clear the token
        updatedAt: new Date(),
      })
      .where(eq(companies.id, company.id))
      .returning();

    return { company: updatedCompany, user: updatedUser };
  }

  async updateCompanyInvitationStatus(companyId: number, status: 'pending' | 'completed' | 'expired'): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({
        registrationStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId))
      .returning();
    return company;
  }

  async getCompanyByRNC(rnc: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.rnc, rnc))
      .limit(1);
    return company;
  }

  async getCompanyByUserId(userId: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.ownerId, userId));
    return company;
  }

  async getCompanyById(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async updateCompany(id: number, companyData: Partial<InsertCompany>): Promise<Company> {
    const [company] = await db
      .update(companies)
      .set({ ...companyData, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }



  // Super Admin operations
  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }



  async createCompanyForUser(companyData: InsertCompany, userId: string): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values({ ...companyData, ownerId: userId })
      .returning();
    
    // Agregar al usuario como admin de la empresa
    await db.insert(companyUsers).values({
      userId,
      companyId: company.id,
      role: "company_admin",
      permissions: ["manage_company", "manage_users", "view_reports"],
    });
    
    return company;
  }

  async getUserCompanies(userId: string): Promise<Company[]> {
    const userCompanies = await db
      .select({ company: companies })
      .from(companyUsers)
      .innerJoin(companies, eq(companyUsers.companyId, companies.id))
      .where(and(eq(companyUsers.userId, userId), eq(companyUsers.isActive, true)));
    
    return userCompanies.map(uc => uc.company);
  }

  async addUserToCompany(userId: string, companyId: number, role: string): Promise<CompanyUser> {
    const [companyUser] = await db
      .insert(companyUsers)
      .values({
        userId,
        companyId,
        role,
        permissions: role === "company_admin" ? ["manage_company", "manage_users"] : ["basic_access"],
      })
      .returning();
    return companyUser;
  }

  async getUserRole(userId: string, companyId?: number): Promise<string | null> {
    // Verificar si es super admin
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user?.role === "super_admin") {
      return "super_admin";
    }

    if (companyId) {
      const [companyUser] = await db
        .select()
        .from(companyUsers)
        .where(and(
          eq(companyUsers.userId, userId),
          eq(companyUsers.companyId, companyId),
          eq(companyUsers.isActive, true)
        ));
      return companyUser?.role || null;
    }

    return user?.role || null;
  }

  async isUserSuperAdmin(userId: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.role === "super_admin";
  }

  // Warehouse operations
  async getWarehouses(companyId: number): Promise<Warehouse[]> {
    return await db.select().from(warehouses).where(eq(warehouses.companyId, companyId));
  }

  async getDefaultWarehouse(companyId: number): Promise<Warehouse> {
    // First try to find an existing warehouse
    const existingWarehouses = await db.select().from(warehouses)
      .where(eq(warehouses.companyId, companyId))
      .limit(1);
    
    if (existingWarehouses.length > 0) {
      return existingWarehouses[0];
    }
    
    // If no warehouse exists, create a default one
    const defaultWarehouse: InsertWarehouse = {
      companyId,
      code: "DEFAULT",
      name: "Almacén Principal",
      location: "Ubicación principal",
      type: "general",
      isActive: true,
      temperatureControlled: false,
      maxCapacity: null,
      address: null,
      phone: null,
      email: null,
      manager: null,
      minTemperature: null,
      maxTemperature: null,
      notes: "Almacén creado automáticamente como predeterminado"
    };
    
    const [warehouse] = await db
      .insert(warehouses)
      .values(defaultWarehouse)
      .returning();
    
    return warehouse;
  }

  async createWarehouse(warehouseData: InsertWarehouse): Promise<Warehouse> {
    const [warehouse] = await db
      .insert(warehouses)
      .values(warehouseData)
      .returning();
    return warehouse;
  }

  async updateWarehouse(id: number, warehouseData: Partial<InsertWarehouse>, companyId: number): Promise<Warehouse | undefined> {
    const [warehouse] = await db
      .update(warehouses)
      .set({ ...warehouseData, updatedAt: new Date() })
      .where(and(eq(warehouses.id, id), eq(warehouses.companyId, companyId)))
      .returning();
    return warehouse;
  }

  async deleteWarehouse(id: number, companyId: number): Promise<void> {
    await db
      .delete(warehouses)
      .where(and(eq(warehouses.id, id), eq(warehouses.companyId, companyId)));
  }

  // Customer operations
  async getCustomers(companyId: number): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.companyId, companyId))
      .orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number, companyId: number): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(customerData)
      .returning();
    return customer;
  }

  async updateCustomer(id: number, customerData: Partial<InsertCustomer>, companyId: number): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.companyId, companyId)))
      .returning();
    return customer;
  }

  async getCustomerById(id: number, companyId: number): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
    return customer;
  }



  async deleteCustomer(id: number, companyId: number): Promise<void> {
    await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
  }

  async getCustomerByRNC(companyId: number, rnc: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.companyId, companyId), eq(customers.rnc, rnc)));
    return customer;
  }

  // Supplier operations moved to purchases module

  // Product operations
  async getProducts(companyId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.companyId, companyId))
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: number, companyId: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.companyId, companyId)));
    return product;
  }

  async getProductsWithoutImages(companyId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(
        eq(products.companyId, companyId),
        or(
          isNull(products.imageUrl),
          eq(products.imageUrl, "")
        )
      ))
      .orderBy(products.name);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    // Generate automatic image URL if not provided
    const imageUrl = productData.imageUrl || this.generateProductImageUrl(productData.name);
    const resolvedImageUrl = typeof imageUrl === 'string' ? imageUrl : await imageUrl;
    
    // Force manufactured products to be consumables
    let finalProductData = {
      ...productData,
      imageUrl: resolvedImageUrl
    };
    
    if (finalProductData.isManufactured) {
      finalProductData.isConsumable = true;
      finalProductData.productType = 'consumable';
    }
    
    const [product] = await db
      .insert(products)
      .values(finalProductData)
      .returning();
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>, companyId: number): Promise<Product | undefined> {
    // Force manufactured products to be consumables
    let finalProductData = { ...productData, updatedAt: new Date() };
    
    if (finalProductData.isManufactured) {
      finalProductData.isConsumable = true;
      finalProductData.productType = 'consumable';
    }
    
    const [product] = await db
      .update(products)
      .set(finalProductData)
      .where(and(eq(products.id, id), eq(products.companyId, companyId)))
      .returning();
    return product;
  }

  async deleteProduct(id: number, companyId: number): Promise<void> {
    await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.companyId, companyId)));
  }

  // Invoice operations
  async getInvoices(companyId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.companyId, companyId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByPeriod(companyId: number, period: string): Promise<Invoice[]> {
    const [year, month] = period.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    
    return await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, companyId),
          sql`${invoices.date} >= ${startDate.toISOString().split('T')[0]}`,
          sql`${invoices.date} <= ${endDate.toISOString().split('T')[0]}`
        )
      )
      .orderBy(desc(invoices.date));
  }

  async getInvoice(id: number, companyId: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)));
    return invoice;
  }

  async getInvoiceItems(invoiceId: number): Promise<any[]> {
    try {
      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoiceId));
      return items;
    } catch (error) {
      console.error("Error fetching invoice items:", error);
      return [];
    }
  }

  async createInvoiceItem(itemData: any): Promise<any> {
    try {
      const [item] = await db
        .insert(invoiceItems)
        .values(itemData)
        .returning();
      return item;
    } catch (error) {
      console.error("Error creating invoice item:", error);
      throw error;
    }
  }

  async getSalesChartData(companyId: number): Promise<any[]> {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Get invoice sales data
      const invoiceSales = await db
        .select({
          date: sql<string>`DATE(${invoices.createdAt})`,
          amount: sql<number>`SUM(CAST(${invoices.total} AS DECIMAL))`,
          type: sql<string>`'invoice'`
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.companyId, companyId),
            sql`${invoices.createdAt} >= ${sixMonthsAgo.toISOString()}`
          )
        )
        .groupBy(sql`DATE(${invoices.createdAt})`)
        .orderBy(sql`DATE(${invoices.createdAt})`);

      // Get POS sales data
      const posData = await db
        .select({
          date: sql<string>`DATE(${posSales.createdAt})`,
          amount: sql<number>`SUM(CAST(${posSales.total} AS DECIMAL))`,
          type: sql<string>`'pos'`
        })
        .from(posSales)
        .where(
          and(
            eq(posSales.companyId, companyId),
            sql`${posSales.createdAt} >= ${sixMonthsAgo.toISOString()}`
          )
        )
        .groupBy(sql`DATE(${posSales.createdAt})`)
        .orderBy(sql`DATE(${posSales.createdAt})`);

      // Combine and format data for chart
      const salesByDate = new Map();
      
      [...invoiceSales, ...posData].forEach(sale => {
        const dateKey = sale.date;
        if (!salesByDate.has(dateKey)) {
          salesByDate.set(dateKey, { date: dateKey, invoices: 0, pos: 0, total: 0 });
        }
        const entry = salesByDate.get(dateKey);
        if (sale.type === 'invoice') {
          entry.invoices += sale.amount || 0;
        } else {
          entry.pos += sale.amount || 0;
        }
        entry.total = entry.invoices + entry.pos;
      });

      return Array.from(salesByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error("Error getting sales chart data:", error);
      return [];
    }
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    // Generate automatic invoice number if not provided
    if (!invoiceData.number || invoiceData.number.trim() === '') {
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Get the highest invoice number for this company and year
      const lastInvoice = await db
        .select({ number: invoices.number })
        .from(invoices)
        .where(and(
          eq(invoices.companyId, invoiceData.companyId),
          like(invoices.number, `INV-${currentYear}${currentMonth}-%`)
        ))
        .orderBy(desc(invoices.number))
        .limit(1);

      let nextSequence = 1;
      if (lastInvoice.length > 0) {
        const lastNumber = lastInvoice[0].number;
        const sequencePart = lastNumber.split('-')[2];
        if (sequencePart) {
          nextSequence = parseInt(sequencePart) + 1;
        }
      }

      // Generate new invoice number: INV-YYYYMM-XXXX
      const sequenceStr = String(nextSequence).padStart(4, '0');
      invoiceData.number = `INV-${currentYear}${currentMonth}-${sequenceStr}`;
    }

    const [invoice] = await db
      .insert(invoices)
      .values({
        ...invoiceData,
        number: invoiceData.number!, // Non-null assertion since we ensure it exists above
      })
      .returning();
    return invoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>, companyId: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...invoiceData, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: number, companyId: number): Promise<void> {
    await db
      .delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)));
  }

  async updateInvoiceStatus(id: number, status: string, companyId: number): Promise<boolean> {
    const result = await db
      .update(invoices)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)))
      .returning({ id: invoices.id });
    
    return result.length > 0;
  }

  // POS operations
  async getPOSSales(companyId: number): Promise<POSSale[]> {
    return await db
      .select()
      .from(posSales)
      .where(eq(posSales.companyId, companyId))
      .orderBy(desc(posSales.createdAt));
  }

  async getPOSSale(id: number, companyId: number): Promise<POSSale | undefined> {
    const [sale] = await db
      .select()
      .from(posSales)
      .where(and(eq(posSales.id, id), eq(posSales.companyId, companyId)));
    return sale;
  }

  async createPOSSale(saleData: InsertPOSSale): Promise<POSSale> {
    const [sale] = await db
      .insert(posSales)
      .values(saleData)
      .returning();
    return sale;
  }

  async getPOSSaleItems(saleId: number): Promise<POSSaleItem[]> {
    return await db
      .select()
      .from(posSaleItems)
      .where(eq(posSaleItems.saleId, saleId))
      .orderBy(posSaleItems.id);
  }

  async createPOSSaleItem(itemData: InsertPOSSaleItem): Promise<POSSaleItem> {
    // Get product info to include name
    const [currentProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, itemData.productId));
    
    // Include product name in the item data
    const itemWithName = {
      ...itemData,
      productName: currentProduct?.name || `Producto #${itemData.productId}`,
      productCode: currentProduct?.code || `CODE-${itemData.productId}`
    };
    
    const [item] = await db
      .insert(posSaleItems)
      .values(itemWithName)
      .returning();
    
    const quantity = parseInt(itemData.quantity);
    
    if (currentProduct && quantity > 0) {
      // Skip stock tracking for services and non-inventoriable products
      const isStockless = currentProduct.productType === 'service' || 
                         currentProduct.productType === 'non_inventoriable' || 
                         currentProduct.trackInventory === false;

      if (isStockless) {
        // For services and non-inventoriable products, just log the sale without stock deduction
        console.log(`Service/Non-inventoriable product sold: ${currentProduct.name} (${currentProduct.productType})`);
      } else if (currentProduct.isManufactured && currentProduct.isConsumable) {
        // Handle manufactured/consumable products
        await this.processManufacturedProductSale(
          itemData.productId, 
          quantity, 
          currentProduct.companyId, 
          itemData.saleId?.toString() || "system"
        );
      } else {
        // Handle regular products with stock tracking
        if (currentProduct.stock >= quantity) {
          const newStock = currentProduct.stock - quantity;
          await db
            .update(products)
            .set({ 
              stock: newStock,
              updatedAt: new Date() 
            })
            .where(eq(products.id, itemData.productId));
          
          // Register inventory movement
          await db
            .insert(inventoryMovements)
            .values({
              productId: itemData.productId,
              type: "OUT",
              quantity: -quantity,
              reason: "POS Sale",
              notes: `Venta POS #${itemData.saleId} - Stock reducido automáticamente`,
              companyId: currentProduct.companyId,
              createdBy: itemData.saleId?.toString() || "system",
            });
        } else {
          console.warn(`Insufficient stock for product ${itemData.productId}. Available: ${currentProduct.stock}, Requested: ${quantity}`);
        }
      }
    }
    
    return item;
  }

  async getPOSPrintSettings(companyId: number): Promise<POSPrintSettings | undefined> {
    const [settings] = await db
      .select()
      .from(posPrintSettings)
      .where(eq(posPrintSettings.companyId, companyId));
    return settings;
  }

  async upsertPOSPrintSettings(settingsData: InsertPOSPrintSettings): Promise<POSPrintSettings> {
    const [settings] = await db
      .insert(posPrintSettings)
      .values(settingsData)
      .onConflictDoUpdate({
        target: posPrintSettings.companyId,
        set: {
          ...settingsData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return settings;
  }

  // Dashboard metrics
  async getDashboardMetrics(companyId: number): Promise<{
    monthSales: string;
    pendingInvoices: number;
    productsInStock: number;
    productionOrders: number;
  }> {
    try {
      // Get current month POS sales (primary sales data)
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const [posResult] = await db
        .select({ total: sql<string>`COALESCE(SUM(CAST(${posSales.total} AS DECIMAL)), 0)` })
        .from(posSales)
        .where(
          and(
            eq(posSales.companyId, companyId),
            sql`${posSales.createdAt} >= ${firstDayOfMonth.toISOString()}`
          )
        );

      // Get pending invoices count
      const [pendingResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(invoices)
        .where(
          and(
            eq(invoices.companyId, companyId),
            eq(invoices.status, "pending")
          )
        );

      // Get products in stock count
      const [stockResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(products)
        .where(
          and(
            eq(products.companyId, companyId),
            sql`${products.stock} > 0`
          )
        );

      // Get active production orders count
      const [productionResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(productionOrders)
        .where(
          and(
            eq(productionOrders.companyId, companyId),
            sql`${productionOrders.status} IN ('planned', 'in_progress')`
          )
        );

      return {
        monthSales: posResult?.total || "0",
        pendingInvoices: pendingResult?.count || 0,
        productsInStock: stockResult?.count || 0,
        productionOrders: productionResult?.count || 0,
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      return {
        monthSales: "0",
        pendingInvoices: 0,
        productsInStock: 0,
        productionOrders: 0,
      };
    }
  }

  // Notification operations
  async getNotifications(userId: string, companyId: number): Promise<Notification[]> {
    const notificationsList = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.companyId, companyId)
        )
      )
      .orderBy(desc(notifications.createdAt));
    return notificationsList;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true, updatedAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId)
        )
      );
  }

  async deleteNotification(id: number, userId: string): Promise<void> {
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, userId)
        )
      );
  }

  async markAllNotificationsAsRead(userId: string, companyId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true, updatedAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.companyId, companyId)
        )
      );
  }

  async clearAllNotifications(userId: string, companyId: number): Promise<void> {
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.companyId, companyId)
        )
      );
  }

  // Employee operations
  async getEmployees(companyId: number): Promise<Employee[]> {
    const employeeList = await db
      .select()
      .from(employees)
      .where(eq(employees.companyId, companyId))
      .orderBy(employees.firstName, employees.lastName);
    return employeeList;
  }

  async getEmployeesWithUsers(companyId: number): Promise<any[]> {
    return await db
      .select({
        id: employees.id,
        employeeId: employees.employeeId,
        firstName: employees.firstName,
        lastName: employees.lastName,
        email: employees.email,
        phone: employees.phone,
        address: employees.address,
        position: employees.position,
        department: employees.department,
        hireDate: employees.hireDate,
        salary: employees.salary,
        salaryType: employees.salaryType,
        status: employees.status,
        cedula: employees.cedula,
        tss: employees.tss,
        bankAccount: employees.bankAccount,
        bankName: employees.bankName,
        userId: employees.userId,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive
        }
      })
      .from(employees)
      .leftJoin(users, eq(employees.userId, users.id))
      .where(eq(employees.companyId, companyId))
      .orderBy(employees.firstName, employees.lastName);
  }

  async getCompanyUsers(companyId: number): Promise<any[]> {
    return await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: companyUsers.role,
        isActive: users.isActive,
        permissions: companyUsers.permissions,
        companyId: companyUsers.companyId
      })
      .from(users)
      .innerJoin(companyUsers, eq(users.id, companyUsers.userId))
      .where(eq(companyUsers.companyId, companyId))
      .orderBy(users.firstName, users.lastName);
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async getEmployee(id: number, companyId: number): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, id), eq(employees.companyId, companyId)));
    return employee;
  }

  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(employeeData)
      .returning();
    return employee;
  }

  async updateEmployee(id: number, employeeData: Partial<InsertEmployee>, companyId: number): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set(employeeData)
      .where(and(eq(employees.id, id), eq(employees.companyId, companyId)))
      .returning();
    return employee;
  }

  async deleteEmployee(id: number, companyId: number): Promise<void> {
    await db
      .delete(employees)
      .where(and(eq(employees.id, id), eq(employees.companyId, companyId)));
  }

  // Payroll Period operations
  async getPayrollPeriods(companyId: number): Promise<PayrollPeriod[]> {
    const periods = await db
      .select()
      .from(payrollPeriods)
      .where(eq(payrollPeriods.companyId, companyId))
      .orderBy(desc(payrollPeriods.startDate));
    return periods;
  }

  async getPayrollPeriod(id: number, companyId: number): Promise<PayrollPeriod | undefined> {
    const [period] = await db
      .select()
      .from(payrollPeriods)
      .where(and(eq(payrollPeriods.id, id), eq(payrollPeriods.companyId, companyId)));
    return period;
  }

  async createPayrollPeriod(periodData: InsertPayrollPeriod): Promise<PayrollPeriod> {
    const [period] = await db
      .insert(payrollPeriods)
      .values(periodData)
      .returning();
    return period;
  }

  async updatePayrollPeriod(id: number, periodData: Partial<InsertPayrollPeriod>, companyId: number): Promise<PayrollPeriod | undefined> {
    const [period] = await db
      .update(payrollPeriods)
      .set({ ...periodData, updatedAt: new Date() })
      .where(and(eq(payrollPeriods.id, id), eq(payrollPeriods.companyId, companyId)))
      .returning();
    return period;
  }

  async deletePayrollPeriod(id: number, companyId: number): Promise<void> {
    await db
      .delete(payrollPeriods)
      .where(and(eq(payrollPeriods.id, id), eq(payrollPeriods.companyId, companyId)));
  }

  // Payroll Entry operations
  async getPayrollEntries(companyId: number, periodId?: number): Promise<PayrollEntry[]> {
    const whereConditions = periodId 
      ? and(eq(payrollEntries.companyId, companyId), eq(payrollEntries.periodId, periodId))
      : eq(payrollEntries.companyId, companyId);
    
    return await db
      .select()
      .from(payrollEntries)
      .where(whereConditions)
      .orderBy(payrollEntries.id);
  }

  async getPayrollEntry(id: number, companyId: number): Promise<PayrollEntry | undefined> {
    const [entry] = await db
      .select()
      .from(payrollEntries)
      .where(and(eq(payrollEntries.id, id), eq(payrollEntries.companyId, companyId)));
    return entry;
  }

  async createPayrollEntry(entryData: InsertPayrollEntry): Promise<PayrollEntry> {
    const [entry] = await db
      .insert(payrollEntries)
      .values(entryData)
      .returning();
    return entry;
  }

  async updatePayrollEntry(id: number, entryData: Partial<InsertPayrollEntry>, companyId: number): Promise<PayrollEntry | undefined> {
    const [entry] = await db
      .update(payrollEntries)
      .set({ ...entryData, updatedAt: new Date() })
      .where(and(eq(payrollEntries.id, id), eq(payrollEntries.companyId, companyId)))
      .returning();
    return entry;
  }

  async deletePayrollEntry(id: number, companyId: number): Promise<void> {
    await db
      .delete(payrollEntries)
      .where(and(eq(payrollEntries.id, id), eq(payrollEntries.companyId, companyId)));
  }

  // Time Tracking operations
  async getTimeTracking(companyId: number, employeeId?: number): Promise<TimeTracking[]> {
    const whereConditions = employeeId 
      ? and(eq(timeTracking.companyId, companyId), eq(timeTracking.employeeId, employeeId))
      : eq(timeTracking.companyId, companyId);
    
    return await db
      .select()
      .from(timeTracking)
      .where(whereConditions)
      .orderBy(desc(timeTracking.date));
  }

  async getTimeTrackingEntry(id: number, companyId: number): Promise<TimeTracking | undefined> {
    const [entry] = await db
      .select()
      .from(timeTracking)
      .where(and(eq(timeTracking.id, id), eq(timeTracking.companyId, companyId)));
    return entry;
  }

  async createTimeTracking(timeEntryData: InsertTimeTracking): Promise<TimeTracking> {
    const [entry] = await db
      .insert(timeTracking)
      .values(timeEntryData)
      .returning();
    return entry;
  }

  async updateTimeTracking(id: number, timeEntryData: Partial<InsertTimeTracking>, companyId: number): Promise<TimeTracking | undefined> {
    const [entry] = await db
      .update(timeTracking)
      .set({ ...timeEntryData, updatedAt: new Date() })
      .where(and(eq(timeTracking.id, id), eq(timeTracking.companyId, companyId)))
      .returning();
    return entry;
  }

  async deleteTimeTracking(id: number, companyId: number): Promise<void> {
    await db
      .delete(timeTracking)
      .where(and(eq(timeTracking.id, id), eq(timeTracking.companyId, companyId)));
  }

  // Leave operations
  async getLeaves(companyId: number, employeeId?: number): Promise<any[]> {
    const whereConditions = employeeId 
      ? and(eq(leaves.companyId, companyId), eq(leaves.employeeId, employeeId))
      : eq(leaves.companyId, companyId);
    
    return await db
      .select({
        id: leaves.id,
        companyId: leaves.companyId,
        employeeId: leaves.employeeId,
        leaveType: leaves.leaveType,
        startDate: leaves.startDate,
        endDate: leaves.endDate,
        days: leaves.days,
        reason: leaves.reason,
        status: leaves.status,
        approvedBy: leaves.approvedBy,
        approvedAt: leaves.approvedAt,
        createdAt: leaves.createdAt,
        updatedAt: leaves.updatedAt,
        employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
      })
      .from(leaves)
      .leftJoin(employees, eq(leaves.employeeId, employees.id))
      .where(whereConditions)
      .orderBy(desc(leaves.startDate));
  }

  async getLeave(id: number, companyId: number): Promise<Leave | undefined> {
    const [leave] = await db
      .select()
      .from(leaves)
      .where(and(eq(leaves.id, id), eq(leaves.companyId, companyId)));
    return leave;
  }

  async createLeave(leaveData: InsertLeave): Promise<Leave> {
    const [leave] = await db
      .insert(leaves)
      .values(leaveData)
      .returning();
    return leave;
  }

  async updateLeave(id: number, leaveData: Partial<InsertLeave>, companyId: number): Promise<Leave | undefined> {
    const [leave] = await db
      .update(leaves)
      .set({ ...leaveData, updatedAt: new Date() })
      .where(and(eq(leaves.id, id), eq(leaves.companyId, companyId)))
      .returning();
    return leave;
  }

  async deleteLeave(id: number, companyId: number): Promise<void> {
    await db
      .delete(leaves)
      .where(and(eq(leaves.id, id), eq(leaves.companyId, companyId)));
  }
  
  // Function to generate product image URL using specified API source
  async generateProductImageUrl(productName: string, productCode?: string, description?: string, source?: string): Promise<string> {
    try {
      // Build comprehensive search query using all available context
      let searchTerms: string[] = [];
      
      // Add product name terms
      if (productName) {
        const nameTerms = productName.toLowerCase()
          .replace(/[^a-záéíóúñü\s]/g, '') // Keep Spanish characters and spaces
          .trim()
          .split(' ')
          .filter(term => term.length > 2); // Filter out short words
        searchTerms.push(...nameTerms);
      }

      // Add description terms if available
      if (description) {
        const descTerms = description.toLowerCase()
          .replace(/[^a-záéíóúñü\s]/g, '')
          .trim()
          .split(' ')
          .filter(term => term.length > 3) // Only meaningful words from description
          .slice(0, 2); // Max 2 terms from description
        searchTerms.push(...descTerms);
      }

      // Add barcode-derived context if available
      if (productCode) {
        // Try to extract brand or category hints from product codes
        const codeHints = this.extractBrandFromCode(productCode);
        if (codeHints) {
          searchTerms.unshift(codeHints); // Prioritize brand hints
        }
      }

      // Enhanced Spanish-to-English translation mapping with brand-specific searches
      const translationMap: { [key: string]: string } = {
        // Dominican rum brands - specific searches for better results
        "ron": "dominican rum bottle",
        "barceló": "Barcelo Dominican rum bottle",
        "brugal": "Brugal Dominican rum bottle", 
        "bermúdez": "Bermudez Dominican rum bottle",
        "mama": "Mama Juana Dominican rum",
        
        // Beer brands
        "cerveza": "beer bottle",
        "presidente": "Presidente Dominican beer bottle",
        "brahma": "Brahma beer bottle",
        "corona": "Corona beer bottle",
        
        // Spirits
        "whisky": "whiskey bottle",
        "vodka": "vodka bottle",
        "brandy": "brandy bottle",
        "gin": "gin bottle",
        
        // Wine and champagne
        "vino": "wine bottle",
        "champagne": "champagne bottle",
        "prosecco": "prosecco bottle",
        
        // Fruits - specific varieties when possible
        "manzana": "red apple fruit",
        "banana": "fresh banana",
        "plátano": "plantain banana",
        "naranja": "orange fruit",
        "limón": "lime lemon",
        "pera": "pear fruit",
        "aguacate": "avocado fruit",
        "mango": "tropical mango",
        "piña": "pineapple fruit",
        "papaya": "papaya fruit",
        "chinola": "passion fruit",
        
        // Meat and protein
        "pollo": "chicken meat",
        "carne": "beef meat",
        "cerdo": "pork meat",
        "pescado": "fresh fish",
        "camarones": "shrimp seafood",
        "langosta": "lobster seafood",
        
        // Dairy and eggs
        "leche": "milk carton",
        "queso": "cheese block",
        "huevos": "eggs carton",
        "yogurt": "yogurt container",
        
        // Grains and staples
        "arroz": "rice bag",
        "frijoles": "beans bag",
        "habichuelas": "red beans",
        "pan": "bread loaf",
        "pasta": "pasta package",
        "espaguetis": "spaghetti pasta",
        
        // Beverages non-alcoholic
        "café": "coffee beans",
        "té": "tea bag",
        "agua": "water bottle",
        "jugo": "fruit juice bottle",
        "refresco": "soda bottle",
        "cola": "cola soda",
        
        // Snacks and sweets
        "chocolate": "chocolate bar",
        "galletas": "cookies package",
        "dulces": "candy sweets",
        "helado": "ice cream",
        
        // Electronics
        "teléfono": "smartphone device",
        "laptop": "laptop computer",
        "tablet": "tablet device",
        "auriculares": "headphones audio",
        "televisor": "television screen",
        "radio": "radio device",
        
        // Personal care
        "champú": "shampoo bottle",
        "jabón": "soap bar",
        "pastadental": "toothpaste tube",
        "crema": "face cream jar",
        "perfume": "perfume bottle",
        "desodorante": "deodorant stick",
        "cepillo": "toothbrush",
        
        // Household items
        "detergente": "laundry detergent",
        "limpiador": "cleaning product",
        "papel": "toilet paper",
        "toalla": "towel fabric",
        "servilletas": "napkins package"
      };

      // Translate terms and prioritize brand-specific searches
      const translatedTerms = searchTerms.map(term => {
        const translated = translationMap[term];
        return translated || term;
      });

      // Create multiple search queries with different priorities
      const searchQueries = [];
      
      // Primary query: Most specific with brand if available
      if (translatedTerms.length > 0) {
        searchQueries.push(translatedTerms.slice(0, 2).join(' ')); // Top 2 most relevant terms
      }
      
      // Secondary query: Just the main product name translated
      if (productName) {
        const mainTerm = productName.toLowerCase().split(' ')[0];
        const mainTranslated = translationMap[mainTerm] || mainTerm;
        if (mainTranslated && !searchQueries.includes(mainTranslated)) {
          searchQueries.push(mainTranslated);
        }
      }
      
      // Tertiary query: Generic fallback
      if (translatedTerms.length > 0) {
        const fallback = translatedTerms[0];
        if (fallback && !searchQueries.includes(fallback)) {
          searchQueries.push(fallback);
        }
      }
      
      // Use specific API based on source parameter
      if (source === 'google' && process.env.GOOGLE_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
        // Try Google Custom Search API only
        for (const query of searchQueries) {
          if (query && query.trim()) {
            try {
              const googleQuery = `${query} product image`;
              const response = await fetch(
                `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(googleQuery)}&searchType=image&num=3&imgSize=medium&safe=active&fileType=jpg,png`,
              );

              if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                  // Return the first image result
                  return data.items[0].link;
                }
              } else {
                console.error(`Google API Error: ${response.status} - ${await response.text()}`);
              }
            } catch (error) {
              console.error(`Error with Google search query "${query}":`, error);
              continue; // Try next query
            }
          }
        }
        
        // If Google API fails, try Pexels as alternative
        if (process.env.PEXELS_API_KEY) {
          for (const query of searchQueries) {
            if (query && query.trim()) {
              try {
                const response = await fetch(
                  `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=square`,
                  {
                    headers: {
                      'Authorization': process.env.PEXELS_API_KEY
                    }
                  }
                );

                if (response.ok) {
                  const data = await response.json();
                  if (data.photos && data.photos.length > 0) {
                    return data.photos[0].src.medium;
                  }
                }
              } catch (error) {
                console.error(`Error with Pexels query "${query}":`, error);
                continue;
              }
            }
          }
        }
      } else if (source === 'unsplash' && process.env.UNSPLASH_ACCESS_KEY) {
        // Try Unsplash API only
        for (const query of searchQueries) {
          if (query && query.trim()) {
            try {
              const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=squarish`,
                {
                  headers: {
                    'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
                  }
                }
              );

              if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                  // Return the first good result (highest relevance score)
                  return data.results[0].urls.regular;
                }
              }
            } catch (error) {
              console.error(`Error with Unsplash query "${query}":`, error);
              continue; // Try next query
            }
          }
        }
      } else {
        // Default behavior - try Google first, then Unsplash
        if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
          for (const query of searchQueries) {
            if (query && query.trim()) {
              try {
                const googleQuery = `${query} product image`;
                const response = await fetch(
                  `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(googleQuery)}&searchType=image&num=3&imgSize=medium&safe=active`,
                );

                if (response.ok) {
                  const data = await response.json();
                  if (data.items && data.items.length > 0) {
                    return data.items[0].link;
                  }
                }
              } catch (error) {
                console.error(`Error with Google search query "${query}":`, error);
                continue;
              }
            }
          }
        }

        // Fallback to Unsplash if Google fails
        if (process.env.UNSPLASH_ACCESS_KEY) {
          for (const query of searchQueries) {
            if (query && query.trim()) {
              try {
                const response = await fetch(
                  `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=squarish`,
                  {
                    headers: {
                      'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
                    }
                  }
                );

                if (response.ok) {
                  const data = await response.json();
                  if (data.results && data.results.length > 0) {
                    return data.results[0].urls.regular;
                  }
                }
              } catch (error) {
                console.error(`Error with Unsplash query "${query}":`, error);
                continue;
              }
            }
          }
        }
      }

      // Fallback to a placeholder service if Unsplash fails
      return `https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=${encodeURIComponent(productName)}`;
    } catch (error) {
      console.error('Error generating product image:', error);
      // Return placeholder on error
      return `https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=${encodeURIComponent(productName)}`;
    }
  }

  // Helper function to extract brand hints from product codes
  private extractBrandFromCode(productCode: string): string | null {
    const code = productCode.toLowerCase();
    
    // Enhanced brand patterns for Dominican Republic
    const brandPatterns: { [key: string]: string } = {
      // Rum brands - more specific patterns
      "barc": "Barcelo Dominican rum bottle",
      "brug": "Brugal Dominican rum bottle", 
      "berm": "Bermudez Dominican rum bottle",
      "maca": "Macorix Dominican rum bottle",
      
      // Beer brands
      "pres": "Presidente Dominican beer bottle",
      "brah": "Brahma beer bottle",
      "coro": "Corona beer bottle",
      "hein": "Heineken beer bottle",
      
      // Food and consumer brands
      "goya": "Goya food product",
      "maggi": "Maggi seasoning",
      "nest": "Nestle product",
      "coca": "Coca Cola bottle",
      "peps": "Pepsi bottle",
      "fant": "Fanta orange soda",
      
      // Local Dominican brands
      "rica": "Rica product Dominican",
      "cibao": "Cibao product Dominican",
      "yuca": "Yuca product Dominican",
      
      // Volume indicators for better context
      "750ml": "750ml bottle",
      "355ml": "355ml can",
      "500ml": "500ml bottle",
      "1lt": "1 liter bottle",
      "2lt": "2 liter bottle"
    };

    for (const [pattern, brand] of Object.entries(brandPatterns)) {
      if (code.includes(pattern)) {
        return brand;
      }
    }

    return null;
  }





  // Comprobantes 605 (Compras)
  async getComprobantes605(companyId: number, period: string): Promise<Comprobante605[]> {
    return await db
      .select()
      .from(comprobantes605)
      .where(and(
        eq(comprobantes605.companyId, companyId),
        eq(comprobantes605.period, period)
      ));
  }

  async createComprobante605(data: InsertComprobante605): Promise<Comprobante605> {
    const [comprobante] = await db
      .insert(comprobantes605)
      .values(data)
      .returning();
    return comprobante;
  }

  async generateComprobantes605(companyId: number, period: string): Promise<Comprobante605[]> {
    // Generate 605 from invoices (purchases) for the period
    const startDate = new Date(`${period}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const invoicesData = await db
      .select({
        invoice: invoices,
        customer: customers
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(
        eq(invoices.companyId, companyId),
        gte(invoices.createdAt, startDate),
        lte(invoices.createdAt, endDate)
      ));

    const comprobantes: InsertComprobante605[] = [];

    for (const { invoice, customer } of invoicesData) {
      if (customer) {
        comprobantes.push({
          companyId,
          period,
          rncCedula: customer.rnc || "00000000000",
          tipoIdentificacion: customer.rnc ? "1" : "2",
          tipoComprobante: "01", // Factura
          ncf: invoice.ncf,
          fechaComprobante: invoice.createdAt || new Date(),
          montoFacturado: invoice.subtotal,
          itbisFacturado: invoice.itbis,
          montoTotal: invoice.total,
        });
      }
    }

    // Insert all comprobantes
    const results: Comprobante605[] = [];
    for (const comprobante of comprobantes) {
      const result = await this.createComprobante605(comprobante);
      results.push(result);
    }

    return results;
  }

  // RNC Registry operations
  async getRNCFromRegistry(rnc: string): Promise<RNCRegistry | undefined> {
    // First try exact match
    let [rncData] = await db
      .select()
      .from(rncRegistry)
      .where(eq(rncRegistry.rnc, rnc))
      .limit(1);
    
    // If not found and RNC is 9 digits, try with "00" prefix (common DGII format)
    if (!rncData && rnc.length === 9) {
      const paddedRnc = "00" + rnc;
      [rncData] = await db
        .select()
        .from(rncRegistry)
        .where(eq(rncRegistry.rnc, paddedRnc))
        .limit(1);
    }
    
    // If still not found and RNC is 11 digits with "00" prefix, try without prefix
    if (!rncData && rnc.length === 11 && rnc.startsWith("00")) {
      const unpaddedRnc = rnc.substring(2);
      [rncData] = await db
        .select()
        .from(rncRegistry)
        .where(eq(rncRegistry.rnc, unpaddedRnc))
        .limit(1);
    }
    
    return rncData;
  }

  async searchRNCByName(query: string, limit: number = 10): Promise<RNCRegistry[]> {
    return await db
      .select()
      .from(rncRegistry)
      .where(ilike(rncRegistry.razonSocial, `%${query}%`))
      .limit(limit)
      .orderBy(rncRegistry.razonSocial);
  }

  async searchRNCRegistry(searchTerm: string, limit: number = 10): Promise<RNCRegistry[]> {
    return await db
      .select()
      .from(rncRegistry)
      .where(
        or(
          ilike(rncRegistry.razonSocial, `%${searchTerm}%`),
          ilike(rncRegistry.nombreComercial, `%${searchTerm}%`),
          like(rncRegistry.rnc, `%${searchTerm}%`)
        )
      )
      .limit(limit)
      .orderBy(rncRegistry.razonSocial);
  }

  async getRNCRegistryCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rncRegistry);
    return result.count;
  }



  // Comprobantes 606 (Ventas)
  async getComprobantes606(companyId: number, period: string): Promise<Comprobante606[]> {
    return await db
      .select()
      .from(comprobantes606)
      .where(and(
        eq(comprobantes606.companyId, companyId),
        eq(comprobantes606.period, period)
      ));
  }

  async createComprobante606(data: InsertComprobante606): Promise<Comprobante606> {
    const [comprobante] = await db
      .insert(comprobantes606)
      .values(data)
      .returning();
    return comprobante;
  }

  async generateComprobantes606(companyId: number, period: string): Promise<Comprobante606[]> {
    // Generate 606 from POS sales for the period
    const startDate = new Date(`${period}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const salesData = await db
      .select()
      .from(posSales)
      .where(and(
        eq(posSales.companyId, companyId),
        gte(posSales.createdAt, startDate),
        lte(posSales.createdAt, endDate)
      ));

    const comprobantes: InsertComprobante606[] = [];

    for (const sale of salesData) {
      // For POS sales, use customer data if available, otherwise use "00000000000"
      const rncCedula = sale.customerPhone || "00000000000";
      
      comprobantes.push({
        companyId,
        period,
        rncCedula,
        tipoIdentificacion: "2", // Assume cedula for POS sales
        tipoComprobante: "02", // Consumidor final
        ncf: sale.ncf,
        fechaComprobante: sale.createdAt || new Date(),
        montoFacturado: sale.subtotal,
        itbisFacturado: sale.itbis,
      });
    }

    // Insert all comprobantes
    const results: Comprobante606[] = [];
    for (const comprobante of comprobantes) {
      const result = await this.createComprobante606(comprobante);
      results.push(result);
    }

    return results;
  }



  async bulkInsertRNCRegistry(data: InsertRNCRegistry[]): Promise<void> {
    if (data.length === 0) return;
    
    // Insert in batches to avoid memory issues
    const batchSize = 1000;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await db.insert(rncRegistry).values(batch).onConflictDoNothing();
    }
  }

  // AI Chat Messages
  async saveAIChatMessage(data: InsertAIChatMessage): Promise<AIChatMessage> {
    const [message] = await db
      .insert(aiChatMessages)
      .values(data)
      .returning();
    return message;
  }

  async getAIChatMessages(companyId: number, userId: string, limit: number = 50): Promise<AIChatMessage[]> {
    return await db
      .select()
      .from(aiChatMessages)
      .where(and(
        eq(aiChatMessages.companyId, companyId),
        eq(aiChatMessages.userId, userId)
      ))
      .orderBy(desc(aiChatMessages.createdAt))
      .limit(limit);
  }

  // Chat System Methods
  
  async getChatChannels(companyId: number, userId: string): Promise<ChatChannel[]> {
    return await db
      .select({
        id: chatChannels.id,
        name: chatChannels.name,
        description: chatChannels.description,
        type: chatChannels.type,
        companyId: chatChannels.companyId,
        createdBy: chatChannels.createdBy,
        isActive: chatChannels.isActive,
        createdAt: chatChannels.createdAt,
        updatedAt: chatChannels.updatedAt
      })
      .from(chatChannels)
      .innerJoin(chatChannelMembers, eq(chatChannels.id, chatChannelMembers.channelId))
      .where(and(
        eq(chatChannels.companyId, companyId),
        eq(chatChannelMembers.userId, userId),
        eq(chatChannels.isActive, true)
      ))
      .orderBy(desc(chatChannels.createdAt));
  }

  async createChatChannel(data: InsertChatChannel): Promise<ChatChannel> {
    const [channel] = await db
      .insert(chatChannels)
      .values(data)
      .returning();
    
    // Add creator as admin member
    await db
      .insert(chatChannelMembers)
      .values({
        channelId: channel.id,
        userId: data.createdBy,
        role: 'admin'
      });

    return channel;
  }

  async getChatMessages(channelId: number, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    return await db
      .select({
        id: chatMessages.id,
        channelId: chatMessages.channelId,
        senderId: chatMessages.senderId,
        content: chatMessages.content,
        messageType: chatMessages.messageType,
        fileUrl: chatMessages.fileUrl,
        fileName: chatMessages.fileName,
        replyToId: chatMessages.replyToId,
        isEdited: chatMessages.isEdited,
        editedAt: chatMessages.editedAt,
        isDeleted: chatMessages.isDeleted,
        deletedAt: chatMessages.deletedAt,
        createdAt: chatMessages.createdAt,
        updatedAt: chatMessages.updatedAt,
        senderName: users.firstName,
        senderLastName: users.lastName,
        senderProfileImage: users.profileImageUrl
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(and(
        eq(chatMessages.channelId, channelId),
        eq(chatMessages.isDeleted, false)
      ))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(data)
      .returning();
    return message;
  }

  async userHasChannelAccess(userId: string, channelId: number): Promise<boolean> {
    const [member] = await db
      .select()
      .from(chatChannelMembers)
      .where(and(
        eq(chatChannelMembers.userId, userId),
        eq(chatChannelMembers.channelId, channelId)
      ))
      .limit(1);
    
    return !!member;
  }

  // User Management Methods



  async createUserRole(data: InsertUserRole): Promise<UserRole> {
    const [role] = await db
      .insert(userRoles)
      .values(data)
      .returning();
    return role;
  }

  async getUserPermissions(userId: string, companyId: number): Promise<UserPermission[]> {
    return await db
      .select()
      .from(userPermissions)
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.companyId, companyId)
      ));
  }

  async updateUserPermissions(data: InsertUserPermission): Promise<UserPermission> {
    // First try to update existing permission
    const existing = await db
      .select()
      .from(userPermissions)
      .where(and(
        eq(userPermissions.userId, data.userId),
        eq(userPermissions.companyId, data.companyId),
        eq(userPermissions.module, data.module)
      ))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(userPermissions)
        .set({
          permissions: data.permissions,
          updatedAt: new Date()
        })
        .where(eq(userPermissions.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userPermissions)
        .values(data)
        .returning();
      return created;
    }
  }

  async logActivity(data: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db
      .insert(activityLogs)
      .values(data)
      .returning();
    return log;
  }

  async getActivityLogs(companyId: number, limit: number = 50): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.companyId, companyId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({
        isOnline,
        lastSeen: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }





  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    await db
      .update(users)
      .set({
        password,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));
  }

  async logLoginAttempt(attempt: {
    email: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    failureReason?: string;
  }): Promise<void> {
    await db.execute(sql`
      INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason)
      VALUES (${attempt.email}, ${attempt.ipAddress}, ${attempt.userAgent}, ${attempt.success}, ${attempt.failureReason || null})
    `);
  }

  async getRecentLoginAttempts(email: string, minutes: number): Promise<Array<{
    email: string;
    success: boolean;
    attemptedAt: Date;
  }>> {
    const result = await db.execute(sql`
      SELECT email, success, attempted_at
      FROM login_attempts
      WHERE email = ${email}
        AND attempted_at > NOW() - INTERVAL '15 minutes'
      ORDER BY attempted_at DESC
    `);
    
    return result.rows.map(row => ({
      email: row.email as string,
      success: row.success as boolean,
      attemptedAt: new Date(row.attempted_at as string)
    }));
  }

  async createCompanyUser(data: {
    userId: string;
    companyId: number;
    role: string;
    permissions: string[];
    isActive: boolean;
  }): Promise<CompanyUser> {
    const [companyUser] = await db
      .insert(companyUsers)
      .values({
        userId: data.userId,
        companyId: data.companyId,
        role: data.role,
        permissions: data.permissions,
        isActive: data.isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return companyUser;
  }

  async getCompanyUserCount(companyId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(companyUsers)
      .where(and(eq(companyUsers.companyId, companyId), eq(companyUsers.isActive, true)));
    return result[0]?.count || 0;
  }

  async canAddUserToCompany(companyId: number): Promise<boolean> {
    const company = await this.getCompany(companyId);
    if (!company) return false;

    const currentUserCount = await this.getCompanyUserCount(companyId);
    
    // Default plan allows 5 users
    return currentUserCount < 5;
  }

  async deleteCompany(companyId: number): Promise<void> {
    // Delete related data first
    await db.delete(products).where(eq(products.companyId, companyId));
    await db.delete(customers).where(eq(customers.companyId, companyId));
    await db.delete(invoices).where(eq(invoices.companyId, companyId));
    await db.delete(employees).where(eq(employees.companyId, companyId));
    await db.delete(companyUsers).where(eq(companyUsers.companyId, companyId));
    
    // Delete the company
    await db.delete(companies).where(eq(companies.id, companyId));
  }

  // Password reset token operations
  async createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
    // First delete any existing tokens for this email
    await db.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.email, email));
    
    // Then insert the new token
    await db.insert(passwordResetTokens)
      .values({ email, token, expiresAt });
  }

  async getPasswordResetToken(token: string): Promise<{ email: string; expiresAt: Date; isRecovery?: boolean } | null> {
    const [result] = await db.select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    
    if (!result) return null;
    
    return {
      email: result.email,
      expiresAt: result.expiresAt,
      isRecovery: result.isRecovery || false
    };
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
  }





  // RNC Registry operations
  async searchRNC(rnc: string): Promise<RNCRegistry | undefined> {
    // First try exact match
    let [result] = await db.select().from(rncRegistry).where(eq(rncRegistry.rnc, rnc));
    
    // If not found and RNC is 9 digits, try with "00" prefix (common DGII format)
    if (!result && rnc.length === 9) {
      const paddedRnc = "00" + rnc;
      [result] = await db.select().from(rncRegistry).where(eq(rncRegistry.rnc, paddedRnc));
    }
    
    // If still not found and RNC is 11 digits with "00" prefix, try without prefix
    if (!result && rnc.length === 11 && rnc.startsWith("00")) {
      const unpaddedRnc = rnc.substring(2);
      [result] = await db.select().from(rncRegistry).where(eq(rncRegistry.rnc, unpaddedRnc));
    }
    
    return result;
  }

  async searchCompaniesByName(query: string, limit: number = 10): Promise<any[]> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      const result = await db
        .select()
        .from(rncRegistry)
        .where(
          or(
            ilike(rncRegistry.razonSocial, searchTerm),
            ilike(rncRegistry.nombreComercial, searchTerm)
          )
        )
        .limit(limit);
      
      console.log('Raw database result:', JSON.stringify(result, null, 2)); // Debug log
      
      const mappedResult = result.map(company => ({
        rnc: company.rnc,
        name: company.razonSocial || company.nombreComercial || 'Sin nombre',
        razonSocial: company.razonSocial,
        nombreComercial: company.nombreComercial,
        status: company.estado || 'ACTIVO',
        category: company.categoria || 'CONTRIBUYENTE REGISTRADO'
      }));
      
      console.log('Mapped result from storage:', JSON.stringify(mappedResult, null, 2)); // Debug log
      
      return mappedResult;
    } catch (error) {
      console.error('Error searching companies by name:', error);
      return [];
    }
  }

  async createRNCRegistry(rncData: InsertRNCRegistry): Promise<RNCRegistry> {
    const [result] = await db
      .insert(rncRegistry)
      .values(rncData)
      .onConflictDoUpdate({
        target: rncRegistry.rnc,
        set: {
          razonSocial: rncData.razonSocial,
          nombreComercial: rncData.nombreComercial,
          categoria: rncData.categoria,
          regimen: rncData.regimen,
          estado: rncData.estado,
          lastUpdated: new Date()
        }
      })
      .returning();
    return result;
  }

  async bulkCreateRNCRegistry(records: InsertRNCRegistry[]): Promise<{ inserted: number; skipped: number }> {
    if (records.length === 0) {
      return { inserted: 0, skipped: 0 };
    }

    try {
      // Use insert with onConflictDoUpdate for bulk operations
      const result = await db
        .insert(rncRegistry)
        .values(records)
        .onConflictDoUpdate({
          target: rncRegistry.rnc,
          set: {
            razonSocial: sql`excluded.razon_social`,
            nombreComercial: sql`excluded.nombre_comercial`,
            categoria: sql`excluded.categoria`,
            regimen: sql`excluded.regimen`,
            estado: sql`excluded.estado`,
            lastUpdated: new Date()
          }
        });

      return { inserted: records.length, skipped: 0 };
    } catch (error) {
      console.error('Bulk insert failed, falling back to individual inserts:', error);
      
      // Fallback: process individually
      let inserted = 0;
      let skipped = 0;
      
      for (const record of records) {
        try {
          const existing = await this.searchRNC(record.rnc);
          if (!existing) {
            await this.createRNCRegistry(record);
            inserted++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`Failed to insert RNC ${record.rnc}:`, error);
          skipped++;
        }
      }
      
      return { inserted, skipped };
    }
  }



  async createRNCRecord(rncData: any): Promise<any> {
    try {
      const [result] = await db.insert(rncRegistry).values({
        rnc: rncData.rnc,
        razonSocial: rncData.razonSocial,
        nombreComercial: rncData.nombreComercial,
        categoria: rncData.categoria,
        regimen: rncData.regimen,
        estado: rncData.estado,
        lastUpdated: new Date()
      }).returning();
      return result;
    } catch (error) {
      console.error('Error creating RNC record:', error);
      throw error;
    }
  }

  async clearRNCRegistry(): Promise<void> {
    await db.delete(rncRegistry);
    console.log('RNC registry cleared');
  }

  async deleteRNCRecordsChunk(chunkSize: number): Promise<{ deleted: number }> {
    try {
      // Get records to delete in chunks
      const recordsToDelete = await db.select({ id: rncRegistry.id })
        .from(rncRegistry)
        .limit(chunkSize);

      if (recordsToDelete.length === 0) {
        return { deleted: 0 };
      }

      // Delete the records by their IDs
      const ids = recordsToDelete.map(r => r.id);
      await db.delete(rncRegistry).where(sql`${rncRegistry.id} IN (${sql.join(ids, sql`, `)})`);

      return { deleted: recordsToDelete.length };
    } catch (error) {
      console.error('Error deleting RNC records chunk:', error);
      throw error;
    }
  }

  // Purchases Module Implementation
  async getSuppliers(companyId: number): Promise<any[]> {
    try {
      const result = await db.select().from(suppliers).where(eq(suppliers.companyId, companyId));
      return result;
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      return [];
    }
  }

  async getSupplier(id: number, companyId: number): Promise<any | null> {
    try {
      const [result] = await db
        .select()
        .from(suppliers)
        .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)))
        .limit(1);
      return result || null;
    } catch (error) {
      console.error("Error fetching supplier:", error);
      return null;
    }
  }

  async createSupplier(supplier: any): Promise<any> {
    try {
      const [result] = await db
        .insert(suppliers)
        .values({
          ...supplier,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating supplier:", error);
      throw error;
    }
  }

  async updateSupplier(id: number, supplierData: any): Promise<any> {
    try {
      const [result] = await db
        .update(suppliers)
        .set({
          ...supplierData,
          updatedAt: new Date()
        })
        .where(eq(suppliers.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating supplier:", error);
      throw error;
    }
  }

  async deleteSupplier(id: number, companyId: number): Promise<void> {
    try {
      await db
        .delete(suppliers)
        .where(and(
          eq(suppliers.id, id),
          eq(suppliers.companyId, companyId)
        ));
    } catch (error) {
      console.error("Error deleting supplier:", error);
      throw error;
    }
  }

  async getPurchaseOrders(companyId: number): Promise<any[]> {
    try {
      // Using existing invoices table as purchase orders for now
      const result = await db.select().from(invoices).where(eq(invoices.companyId, companyId));
      return result.map(invoice => ({
        id: invoice.id,
        orderNumber: `PO-${String(invoice.id).padStart(6, '0')}`,
        status: "pending",
        supplier: { name: "Proveedor Genérico" },
        orderDate: invoice.date || new Date().toISOString().split('T')[0],
        totalAmount: invoice.total || "0.00",
        currency: "DOP"
      }));
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      return [];
    }
  }

  // Stock Management for Invoicing
  async updateProductStock(productId: number, quantityChange: number, companyId: number, reason: string, createdBy: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        // Update product stock
        await tx
          .update(products)
          .set({ 
            stock: sql`stock + ${quantityChange}`,
            updatedAt: new Date()
          })
          .where(and(eq(products.id, productId), eq(products.companyId, companyId)));

        // Record inventory movement
        await tx.insert(inventoryMovements).values({
          productId,
          type: quantityChange > 0 ? 'in' : 'out',
          quantity: Math.abs(quantityChange),
          reason,
          notes: `Stock adjustment for invoice processing`,
          companyId,
          createdBy,
          createdAt: new Date()
        });
      });
    } catch (error) {
      console.error("Error updating product stock:", error);
      throw error;
    }
  }

  async processInvoiceStockDeduction(invoiceId: number, companyId: number, createdBy: string): Promise<void> {
    try {
      // Get invoice items
      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoiceId));

      // Deduct stock for each item
      for (const item of items) {
        await this.updateProductStock(
          item.productId,
          -item.quantity, // Negative to deduct stock
          companyId,
          `Invoice #${invoiceId} created`,
          createdBy
        );
      }
    } catch (error) {
      console.error("Error processing invoice stock deduction:", error);
      throw error;
    }
  }

  async restoreInvoiceStock(invoiceId: number, companyId: number, createdBy: string): Promise<void> {
    try {
      // Get invoice items
      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoiceId));

      // Restore stock for each item
      for (const item of items) {
        await this.updateProductStock(
          item.productId,
          item.quantity, // Positive to restore stock
          companyId,
          `Invoice #${invoiceId} deleted/modified`,
          createdBy
        );
      }
    } catch (error) {
      console.error("Error restoring invoice stock:", error);
      throw error;
    }
  }

  // Inventory Movement Methods
  async getInventoryMovements(companyId: number): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: inventoryMovements.id,
          productId: inventoryMovements.productId,
          type: inventoryMovements.type,
          quantity: inventoryMovements.quantity,
          reason: inventoryMovements.reason,
          notes: inventoryMovements.notes,
          createdBy: inventoryMovements.createdBy,
          createdAt: inventoryMovements.createdAt,
          product: {
            id: products.id,
            name: products.name,
            code: products.code,
            stock: products.stock
          }
        })
        .from(inventoryMovements)
        .innerJoin(products, eq(inventoryMovements.productId, products.id))
        .where(eq(inventoryMovements.companyId, companyId))
        .orderBy(desc(inventoryMovements.createdAt));
      
      return result;
    } catch (error) {
      console.error("Error fetching inventory movements:", error);
      return [];
    }
  }

  async createInventoryMovement(movement: any): Promise<any> {
    try {
      const [result] = await db
        .insert(inventoryMovements)
        .values({
          productId: movement.productId,
          type: movement.type,
          quantity: movement.quantity,
          reason: movement.reason,
          notes: movement.notes,
          companyId: movement.companyId,
          createdBy: movement.createdBy,
          createdAt: new Date()
        })
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating inventory movement:", error);
      throw error;
    }
  }

  async createPurchaseOrder(order: any): Promise<any> {
    try {
      const [result] = await db
        .insert(invoices)
        .values({
          ...order,
          companyId: order.companyId,
          date: new Date().toISOString().split('T')[0],
          total: order.totalAmount || "0.00",
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return {
        id: result.id,
        orderNumber: `PO-${String(result.id).padStart(6, '0')}`,
        status: "pending",
        supplier: { name: "Proveedor Genérico" },
        orderDate: result.date || new Date().toISOString().split('T')[0],
        totalAmount: result.total || "0.00",
        currency: "DOP"
      };
    } catch (error) {
      console.error("Error creating purchase order:", error);
      throw error;
    }
  }

  async getPurchaseInvoices(companyId: number): Promise<any[]> {
    try {
      const result = await db.select().from(invoices).where(eq(invoices.companyId, companyId));
      return result.map(invoice => ({
        id: invoice.id,
        invoiceNumber: `PI-${String(invoice.id).padStart(6, '0')}`,
        paymentStatus: "pending",
        type: "purchase",
        supplier: { name: "Proveedor Genérico" },
        ncf: invoice.ncf,
        invoiceDate: invoice.date || new Date().toISOString().split('T')[0],
        totalAmount: invoice.total || "0.00",
        paidAmount: "0.00"
      }));
    } catch (error) {
      console.error("Error fetching purchase invoices:", error);
      return [];
    }
  }

  async createPurchaseInvoice(invoice: any): Promise<any> {
    try {
      const [result] = await db
        .insert(invoices)
        .values({
          ...invoice,
          companyId: invoice.companyId,
          issueDate: new Date(),
          totalAmount: invoice.totalAmount || "0.00",
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return {
        id: result.id,
        invoiceNumber: `PI-${String(result.id).padStart(6, '0')}`,
        paymentStatus: "pending",
        type: "purchase",
        supplier: { name: "Proveedor Genérico" },
        ncf: result.ncf,
        invoiceDate: result.date || new Date().toISOString().split('T')[0],
        totalAmount: result.total || "0.00",
        paidAmount: "0.00"
      };
    } catch (error) {
      console.error("Error creating purchase invoice:", error);
      throw error;
    }
  }

  async getPurchasesStats(companyId: number): Promise<any> {
    try {
      const suppliers = await this.getSuppliers(companyId);
      const orders = await this.getPurchaseOrders(companyId);
      const invoices = await this.getPurchaseInvoices(companyId);
      
      const pendingOrders = orders.filter(order => order.status === "pending");
      const pendingInvoices = invoices.filter(invoice => invoice.paymentStatus === "pending");
      
      const pendingOrdersValue = pendingOrders.reduce((total, order) => 
        total + parseFloat(order.totalAmount || "0"), 0
      ).toFixed(2);
      
      const pendingPayments = pendingInvoices.reduce((total, invoice) => 
        total + parseFloat(invoice.totalAmount || "0"), 0
      ).toFixed(2);

      const monthlyExpenses = invoices.reduce((total, invoice) => 
        total + parseFloat(invoice.totalAmount || "0"), 0
      ).toFixed(2);

      return {
        totalSuppliers: suppliers.length,
        newSuppliersThisMonth: Math.floor(suppliers.length * 0.1),
        pendingOrders: pendingOrders.length,
        pendingOrdersValue: `$${pendingOrdersValue}`,
        pendingInvoices: pendingInvoices.length,
        pendingPayments: `$${pendingPayments}`,
        monthlyExpenses: `$${monthlyExpenses}`,
        expenseChange: "+12.5%"
      };
    } catch (error) {
      console.error("Error fetching purchases stats:", error);
      return {
        totalSuppliers: 0,
        newSuppliersThisMonth: 0,
        pendingOrders: 0,
        pendingOrdersValue: "$0.00",
        pendingInvoices: 0,
        pendingPayments: "$0.00",
        monthlyExpenses: "$0.00",
        expenseChange: "0%"
      };
    }
  }

  // POS Cart Management
  async getPOSCartItems(companyId: number, userId: string): Promise<any[]> {
    const cartItems = await db
      .select({
        id: posCartItems.id,
        productId: posCartItems.productId,
        quantity: posCartItems.quantity,
        unitPrice: posCartItems.unitPrice,
        subtotal: posCartItems.subtotal,
        productName: products.name,
        productCode: products.code,
      })
      .from(posCartItems)
      .leftJoin(products, eq(posCartItems.productId, products.id))
      .where(and(eq(posCartItems.companyId, companyId), eq(posCartItems.userId, userId)));
    
    return cartItems;
  }

  async getPOSCartItem(cartId: number): Promise<POSCartItem | undefined> {
    const [cartItem] = await db
      .select()
      .from(posCartItems)
      .where(eq(posCartItems.id, cartId));
    return cartItem;
  }





  async addToPOSCart(cartData: any): Promise<any> {
    const [cartItem] = await db
      .insert(posCartItems)
      .values({
        companyId: cartData.companyId,
        userId: cartData.userId,
        productId: cartData.productId,
        quantity: cartData.quantity,
        unitPrice: cartData.unitPrice,
        subtotal: cartData.subtotal
      })
      .returning();
    return cartItem;
  }

  async updatePOSCartItem(cartId: number, quantity: number): Promise<any> {
    const [updated] = await db
      .update(posCartItems)
      .set({ 
        quantity: quantity,
        subtotal: sql`(${quantity} * CAST(unit_price AS DECIMAL))`
      })
      .where(eq(posCartItems.id, cartId))
      .returning();
    return updated;
  }

  // POS Multi-Station Implementation
  // Employee management methods
  async getPOSEmployees(companyId: number): Promise<POSEmployee[]> {
    return await db.select().from(posEmployees).where(eq(posEmployees.companyId, companyId));
  }

  async getPOSEmployee(id: number, companyId: number): Promise<POSEmployee | undefined> {
    const [employee] = await db
      .select()
      .from(posEmployees)
      .where(and(eq(posEmployees.id, id), eq(posEmployees.companyId, companyId)));
    return employee;
  }

  async createPOSEmployee(employee: InsertPOSEmployee): Promise<POSEmployee> {
    const [created] = await db.insert(posEmployees).values(employee).returning();
    return created;
  }

  async updatePOSEmployee(id: number, employee: Partial<InsertPOSEmployee>, companyId: number): Promise<POSEmployee | undefined> {
    const [updated] = await db
      .update(posEmployees)
      .set({ ...employee, updatedAt: new Date() })
      .where(and(eq(posEmployees.id, id), eq(posEmployees.companyId, companyId)))
      .returning();
    return updated;
  }

  async deletePOSEmployee(id: number, companyId: number): Promise<void> {
    await db.delete(posEmployees).where(and(eq(posEmployees.id, id), eq(posEmployees.companyId, companyId)));
  }

  async authenticatePOSEmployee(employeeCode: string, pin: string, companyId: number): Promise<POSEmployee | null> {
    const [employee] = await db
      .select()
      .from(posEmployees)
      .where(and(
        eq(posEmployees.employeeCode, employeeCode),
        eq(posEmployees.pin, pin),
        eq(posEmployees.companyId, companyId),
        eq(posEmployees.isActive, true)
      ));
    
    if (employee) {
      return employee;
    }
    return null;
  }

  // Station management methods
  async getPOSStations(companyId: number): Promise<POSStation[]> {
    return await db.select().from(posStations).where(eq(posStations.companyId, companyId));
  }

  async getPOSStation(id: number, companyId: number): Promise<POSStation | undefined> {
    const [station] = await db
      .select()
      .from(posStations)
      .where(and(eq(posStations.id, id), eq(posStations.companyId, companyId)));
    return station;
  }

  async createPOSStation(station: InsertPOSStation): Promise<POSStation> {
    const [created] = await db.insert(posStations).values(station).returning();
    return created;
  }

  async updatePOSStation(id: number, station: Partial<InsertPOSStation>, companyId: number): Promise<POSStation | undefined> {
    const [updated] = await db
      .update(posStations)
      .set({ ...station, updatedAt: new Date() })
      .where(and(eq(posStations.id, id), eq(posStations.companyId, companyId)))
      .returning();
    return updated;
  }

  async deletePOSStation(id: number, companyId: number): Promise<void> {
    await db.delete(posStations).where(and(eq(posStations.id, id), eq(posStations.companyId, companyId)));
  }

  // Cash session management methods
  async getPOSCashSessions(companyId: number, stationId?: number): Promise<POSCashSession[]> {
    const whereConditions = stationId 
      ? and(eq(posCashSessions.companyId, companyId), eq(posCashSessions.stationId, stationId))
      : eq(posCashSessions.companyId, companyId);
    
    return await db
      .select()
      .from(posCashSessions)
      .where(whereConditions)
      .orderBy(desc(posCashSessions.openedAt));
  }

  async getPOSCashSession(id: number, companyId: number): Promise<POSCashSession | undefined> {
    const [session] = await db
      .select()
      .from(posCashSessions)
      .where(and(eq(posCashSessions.id, id), eq(posCashSessions.companyId, companyId)));
    return session;
  }

  async createPOSCashSession(session: InsertPOSCashSession): Promise<POSCashSession> {
    const [created] = await db.insert(posCashSessions).values(session).returning();
    return created;
  }

  async updatePOSCashSession(id: number, session: Partial<InsertPOSCashSession>, companyId: number): Promise<POSCashSession | undefined> {
    const [updated] = await db
      .update(posCashSessions)
      .set(session)
      .where(and(eq(posCashSessions.id, id), eq(posCashSessions.companyId, companyId)))
      .returning();
    return updated;
  }

  async closePOSCashSession(id: number, closingData: any, companyId: number): Promise<POSCashSession | undefined> {
    const [updated] = await db
      .update(posCashSessions)
      .set({
        ...closingData,
        status: 'closed',
        closedAt: new Date()
      })
      .where(and(eq(posCashSessions.id, id), eq(posCashSessions.companyId, companyId)))
      .returning();
    return updated;
  }

  // Customer management with RNC validation
  async getPOSCustomers(companyId: number): Promise<POSCustomer[]> {
    return await db.select().from(posCustomers).where(eq(posCustomers.companyId, companyId));
  }

  async getPOSCustomer(id: number, companyId: number): Promise<POSCustomer | undefined> {
    const [customer] = await db
      .select()
      .from(posCustomers)
      .where(and(eq(posCustomers.id, id), eq(posCustomers.companyId, companyId)));
    return customer;
  }

  async createPOSCustomer(customer: InsertPOSCustomer): Promise<POSCustomer> {
    const [created] = await db.insert(posCustomers).values(customer).returning();
    return created;
  }

  async updatePOSCustomer(id: number, customer: Partial<InsertPOSCustomer>, companyId: number): Promise<POSCustomer | undefined> {
    const [updated] = await db
      .update(posCustomers)
      .set({ ...customer, updatedAt: new Date() })
      .where(and(eq(posCustomers.id, id), eq(posCustomers.companyId, companyId)))
      .returning();
    return updated;
  }

  async deletePOSCustomer(id: number, companyId: number): Promise<void> {
    await db.delete(posCustomers).where(and(eq(posCustomers.id, id), eq(posCustomers.companyId, companyId)));
  }

  async validateCustomerRNC(rnc: string, companyId: number): Promise<{ valid: boolean; data?: any }> {
    // Check against DGII registry
    const rncRecord = await this.searchRNC(rnc);
    if (rncRecord) {
      // Update customer record with validated RNC if it exists
      await db
        .update(posCustomers)
        .set({ 
          isValidatedRnc: true, 
          rncValidationDate: new Date() 
        })
        .where(and(eq(posCustomers.rnc, rnc), eq(posCustomers.companyId, companyId)));
      
      return { 
        valid: true, 
        data: {
          name: rncRecord.razonSocial || rncRecord.nombreComercial,
          businessName: rncRecord.razonSocial,
          status: rncRecord.estado,
          activity: rncRecord.categoria
        }
      };
    }
    return { valid: false };
  }

  // Enhanced customer search with RNC auto-fill
  async searchCustomerByRNC(rnc: string, companyId: number): Promise<any> {
    // First check if customer already exists
    const [existingCustomer] = await db
      .select()
      .from(posCustomers)
      .where(and(eq(posCustomers.rnc, rnc), eq(posCustomers.companyId, companyId)))
      .limit(1);

    if (existingCustomer) {
      return { exists: true, customer: existingCustomer };
    }

    // If not exists, validate RNC and return data for auto-fill
    const validation = await this.validateCustomerRNC(rnc, companyId);
    return { exists: false, validation };
  }

  // Stock Reservation operations for cart synchronization
  async createStockReservation(reservationData: InsertStockReservation): Promise<StockReservation> {
    const [created] = await db.insert(stockReservations).values(reservationData).returning();
    return created;
  }

  async releaseStockReservations(sessionId: string): Promise<void> {
    await db.delete(stockReservations).where(eq(stockReservations.sessionId, sessionId));
  }

  async getStockReservations(productId: number): Promise<StockReservation[]> {
    return await db.select().from(stockReservations).where(eq(stockReservations.productId, productId));
  }

  async cleanExpiredReservations(): Promise<void> {
    const expirationTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    await db.delete(stockReservations).where(lt(stockReservations.reservedAt, expirationTime));
  }

  // ACCOUNTING MODULE METHODS

  async getAccounts(companyId: number) {
    return await db.select({
      id: accounts.id,
      code: accounts.code,
      name: accounts.name,
      accountType: accountTypes.name,
      currentBalance: accounts.currentBalance,
      allowTransactions: accounts.allowTransactions,
      level: accounts.level,
      isParent: accounts.isParent,
    })
      .from(accounts)
      .leftJoin(accountTypes, eq(accounts.accountTypeId, accountTypes.id))
      .where(eq(accounts.companyId, companyId))
      .orderBy(accounts.code);
  }

  async createAccount(accountData: any) {
    const [account] = await db.insert(accounts).values(accountData).returning();
    return account;
  }

  async getJournalEntries(companyId: number) {
    return await db.select()
      .from(journalEntries)
      .where(eq(journalEntries.companyId, companyId))
      .orderBy(desc(journalEntries.createdAt));
  }

  async createJournalEntry(entryData: any) {
    const [entry] = await db.insert(journalEntries).values(entryData).returning();
    return entry;
  }

  async createPaymentSubmission(paymentData: any): Promise<any> {
    const [payment] = await db
      .insert(paymentSubmissions)
      .values({
        name: paymentData.name,
        email: paymentData.email,
        phone: paymentData.phone,
        company: paymentData.company,
        rnc: paymentData.rnc,
        paymentMethod: paymentData.paymentMethod,
        bankAccount: paymentData.bankAccount,
        amount: paymentData.amount.toString(),
        reference: paymentData.reference,
        notes: paymentData.notes,
        status: paymentData.status,
        submittedAt: paymentData.submittedAt
      })
      .returning();
    return payment;
  }

  // Payment methods moved to end of class to avoid duplicates

  async getAllCompaniesWithDetails() {
    // Get companies with their active modules
    const companiesWithDetails = await db
      .select({
        id: companies.id,
        name: companies.name,
        businessName: companies.businessName,
        email: companies.email,
        phone: companies.phone,
        rnc: companies.rnc,
        isActive: companies.isActive,
        subscriptionPlan: companies.subscriptionPlan,
        paymentStatus: companies.paymentStatus,
        createdAt: companies.createdAt,
        ownerId: companies.ownerId,
        ownerEmail: companies.ownerEmail,
      })
      .from(companies)
      .orderBy(desc(companies.createdAt));

    // For each company, get its active modules
    const companiesWithModules = await Promise.all(
      companiesWithDetails.map(async (company) => {
        console.log(`[DEBUG] Looking for modules for company ID: ${company.id}`);
        
        const activeModules = await db
          .select({
            moduleId: companyModules.moduleId,
            moduleName: systemModules.name,
          })
          .from(companyModules)
          .leftJoin(systemModules, eq(companyModules.moduleId, systemModules.id))
          .where(and(
            eq(companyModules.companyId, company.id),
            eq(companyModules.isEnabled, true)
          ));

        console.log(`[DEBUG] Found ${activeModules.length} active modules for company ${company.id}:`, activeModules);

        return {
          ...company,
          activeModules: activeModules.map(m => m.moduleName).filter(Boolean)
        };
      })
    );

    // If company has no modules, auto-assign basic modules for first-time setup
    console.log('[DEBUG] Checking if should auto-assign modules...');
    console.log('[DEBUG] companiesWithModules.length:', companiesWithModules.length);
    console.log('[DEBUG] activeModules.length:', companiesWithModules.length > 0 ? companiesWithModules[0].activeModules.length : 'N/A');
    
    if (companiesWithModules.length > 0 && companiesWithModules[0].activeModules.length === 0) {
      console.log('[DEBUG] Company has no modules. Auto-assigning basic modules...');
      
      try {
        // Get available system modules
        const availableModules = await db.select().from(systemModules).limit(6);
        console.log('[DEBUG] Available modules to assign:', availableModules.map(m => ({ id: m.id, name: m.name })));
        
        // Assign basic modules to company
        for (const module of availableModules) {
          await db.insert(companyModules).values({
            companyId: 1,
            moduleId: module.id,
            isEnabled: true,
            enabledBy: '06t1a03ch'
          }).onConflictDoNothing();
          console.log(`[DEBUG] Assigned module: ${module.name}`);
        }
        
        // Re-fetch active modules after assignment
        const newActiveModules = await db
          .select({
            moduleId: companyModules.moduleId,
            moduleName: systemModules.name,
          })
          .from(companyModules)
          .leftJoin(systemModules, eq(companyModules.moduleId, systemModules.id))
          .where(and(
            eq(companyModules.companyId, 1),
            eq(companyModules.isEnabled, true)
          ));
        
        companiesWithModules[0].activeModules = newActiveModules.map(m => m.moduleName).filter(Boolean);
        console.log('[DEBUG] Updated activeModules:', companiesWithModules[0].activeModules);
        
      } catch (error) {
        console.log('[DEBUG] Error during module assignment:', error);
      }
    }
    
    return companiesWithModules;
  }

  async updateCompanyStatus(companyId: number, isActive: boolean, notes?: string) {
    const [updatedCompany] = await db
      .update(companies)
      .set({ 
        isActive,
        updatedAt: new Date()
      })
      .where(eq(companies.id, companyId))
      .returning();
    
    return updatedCompany;
  }

  // Exchange Rate operations for Multi-Currency
  async getExchangeRate(currency: string): Promise<ExchangeRate | undefined> {
    const [rate] = await db
      .select()
      .from(exchangeRates)
      .where(eq(exchangeRates.currency, currency))
      .orderBy(desc(exchangeRates.lastUpdated))
      .limit(1);
    return rate;
  }

  async getAllExchangeRates(): Promise<ExchangeRate[]> {
    return await db
      .select()
      .from(exchangeRates)
      .orderBy(asc(exchangeRates.currency));
  }

  async upsertExchangeRate(rateData: InsertExchangeRate): Promise<ExchangeRate> {
    // Check if rate exists
    const existing = await this.getExchangeRate(rateData.currency);
    
    if (existing) {
      // Update existing rate
      const [updated] = await db
        .update(exchangeRates)
        .set({
          rate: rateData.rate,
          lastUpdated: rateData.lastUpdated || new Date(),
          isFallback: rateData.isFallback || false,
          baseCurrency: rateData.baseCurrency || 'DOP'
        })
        .where(eq(exchangeRates.currency, rateData.currency))
        .returning();
      return updated;
    } else {
      // Insert new rate
      const [inserted] = await db
        .insert(exchangeRates)
        .values(rateData)
        .returning();
      return inserted;
    }
  }

  async deleteExchangeRate(currency: string): Promise<void> {
    await db
      .delete(exchangeRates)
      .where(eq(exchangeRates.currency, currency));
  }

  // Period-based data operations for fiscal reports
  async getPOSSalesByPeriod(companyId: number, startDate: Date, endDate: Date): Promise<POSSale[]> {
    return await db
      .select()
      .from(posSales)
      .where(
        and(
          eq(posSales.companyId, companyId),
          gte(posSales.createdAt, startDate),
          lte(posSales.createdAt, endDate)
        )
      )
      .orderBy(desc(posSales.createdAt));
  }

  async getPurchasesByPeriod(companyId: number, startDate: Date, endDate: Date): Promise<any[]> {
    // This method should be implemented when purchase module is created
    // For now, return empty array
    return [];
  }
  // MANUFACTURING MODULE METHODS

  // BOM operations
  async getBOMs(companyId: number): Promise<any[]> {
    const boms = await db
      .select({
        id: billOfMaterials.id,
        productId: billOfMaterials.productId,
        name: billOfMaterials.name,
        version: billOfMaterials.version,
        isActive: billOfMaterials.isActive,
        notes: billOfMaterials.notes,
        companyId: billOfMaterials.companyId,
        createdBy: billOfMaterials.createdBy,
        createdAt: billOfMaterials.createdAt,
        updatedAt: billOfMaterials.updatedAt,
        items: sql<any>`
          COALESCE(
            json_agg(
              json_build_object(
                'id', ${bomItems.id},
                'componentId', ${bomItems.componentId},
                'quantity', ${bomItems.quantity},
                'unit', ${bomItems.unit},
                'wastePercentage', ${bomItems.wastePercentage},
                'notes', ${bomItems.notes}
              )
            ) FILTER (WHERE ${bomItems.id} IS NOT NULL),
            '[]'::json
          )
        `
      })
      .from(billOfMaterials)
      .leftJoin(bomItems, eq(bomItems.bomId, billOfMaterials.id))
      .where(eq(billOfMaterials.companyId, companyId))
      .groupBy(billOfMaterials.id);
    
    return boms;
  }

  async createBOM(bomData: any): Promise<BillOfMaterials> {
    const { items, ...bomInfo } = bomData;
    
    // Create BOM
    const [bom] = await db
      .insert(billOfMaterials)
      .values(bomInfo)
      .returning();
    
    // Create BOM items
    if (items && items.length > 0) {
      await db
        .insert(bomItems)
        .values(items.map((item: any) => ({
          ...item,
          bomId: bom.id
        })));
    }
    
    return bom;
  }

  async updateBOM(bomId: number, bomData: any, companyId: number): Promise<BillOfMaterials> {
    const { items, ...bomInfo } = bomData;
    
    // Update BOM
    const [updatedBOM] = await db
      .update(billOfMaterials)
      .set({ ...bomInfo, updatedAt: new Date() })
      .where(
        and(
          eq(billOfMaterials.id, bomId),
          eq(billOfMaterials.companyId, companyId)
        )
      )
      .returning();
    
    // Update BOM items if provided
    if (items) {
      // Delete existing items
      await db
        .delete(bomItems)
        .where(eq(bomItems.bomId, bomId));
      
      // Insert new items
      if (items.length > 0) {
        await db
          .insert(bomItems)
          .values(items.map((item: any) => ({
            ...item,
            bomId
          })));
      }
    }
    
    return updatedBOM;
  }

  async deleteBOM(bomId: number, companyId: number): Promise<void> {
    await db
      .delete(billOfMaterials)
      .where(
        and(
          eq(billOfMaterials.id, bomId),
          eq(billOfMaterials.companyId, companyId)
        )
      );
  }

  // Production Orders
  async getProductionOrders(companyId: number) {
    return await db.select()
      .from(productionOrders)
      .where(eq(productionOrders.companyId, companyId))
      .orderBy(desc(productionOrders.createdAt));
  }

  async createProductionOrder(orderData: any) {
    const [order] = await db.insert(productionOrders).values({
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return order;
  }

  async updateProductionOrder(orderId: number, updateData: any, companyId: number) {
    const [order] = await db
      .update(productionOrders)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(productionOrders.id, orderId),
        eq(productionOrders.companyId, companyId)
      ))
      .returning();
    return order;
  }

  async deleteProductionOrder(orderId: number, companyId: number) {
    await db
      .delete(productionOrders)
      .where(and(
        eq(productionOrders.id, orderId),
        eq(productionOrders.companyId, companyId)
      ));
  }

  async updateProductionOrderStatus(orderId: number, status: string, companyId: number) {
    const [order] = await db
      .update(productionOrders)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(and(
        eq(productionOrders.id, orderId),
        eq(productionOrders.companyId, companyId)
      ))
      .returning();
    return order;
  }

  // Legacy BOM methods - to be migrated
  async getBOMByProduct(productId: number, companyId: number): Promise<any[]> {
    // Legacy method - returns empty array until migration
    return [];
    /* Commented out legacy implementation
    const result = await db.select({
      id: bom.id,
      productId: bom.productId,
      materialId: bom.materialId,
      quantity: bom.quantity,
      unit: bom.unit,
      cost: bom.cost,
      notes: bom.notes,
      companyId: bom.companyId,
      createdAt: bom.createdAt,
      updatedAt: bom.updatedAt,
      materialId_p: products.id,
      materialName: products.name,
      materialCode: products.code,
      materialPrice: products.price,
      materialUnit: products.unit,
      materialStock: products.stock
    })
      .from(bom)
      .innerJoin(products, eq(bom.materialId, products.id))
      .where(and(
        eq(bom.productId, productId),
        eq(bom.companyId, companyId)
      ))
      .orderBy(products.name);

    return result.map(item => ({
      id: item.id,
      productId: item.productId,
      materialId: item.materialId,
      quantity: item.quantity,
      unit: item.unit,
      cost: item.cost,
      notes: item.notes,
      companyId: item.companyId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      material: {
        id: item.materialId_p,
        name: item.materialName,
        code: item.materialCode,
        price: item.materialPrice,
        unit: item.materialUnit,
        stock: item.materialStock.toString()
      }
    }));
  }
  */
  }

  async createBOMItem(bomData: any) {
    // Legacy method - not implemented
    return null;
    /*
    const [bomItem] = await db.insert(bom).values({
      ...bomData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return bomItem;
    */
  }

  async updateBOMItem(bomId: number, updateData: any, companyId: number) {
    // Legacy method - not implemented
    return null;
    /*
    const [bomItem] = await db
      .update(bom)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(bom.id, bomId),
        eq(bom.companyId, companyId)
      ))
      .returning();
    return bomItem;
    */
  }

  async deleteBOMItem(bomId: number, companyId: number) {
    // Legacy method - not implemented
    return;
    /*
    await db
      .delete(bom)
      .where(and(
        eq(bom.id, bomId),
        eq(bom.companyId, companyId)
      ));
    */
  }

  // Manufacturing cost calculation
  async calculateManufacturingCosts(productId: number, quantity: number, companyId: number) {
    const bomItems = await this.getBOMByProduct(productId, companyId);
    
    let totalMaterialCost = 0;
    let totalLaborCost = 0;
    let totalOverheadCost = 0;
    
    const materials = [];
    
    for (const bomItem of bomItems) {
      if (!bomItem.material) continue;
      
      const materialQuantity = parseFloat(bomItem.quantity.toString()) * quantity;
      const materialCost = parseFloat(bomItem.material.price.toString()) * materialQuantity;
      totalMaterialCost += materialCost;
      
      materials.push({
        id: bomItem.material.id,
        name: bomItem.material.name,
        code: bomItem.material.code,
        unitCost: parseFloat(bomItem.material.price.toString()),
        requiredQuantity: materialQuantity,
        unit: bomItem.unit,
        totalCost: materialCost,
        availableStock: parseFloat(bomItem.material.stock.toString()),
        isAvailable: parseFloat(bomItem.material.stock.toString()) >= materialQuantity
      });
    }
    
    // Calculate estimated labor cost (10% of material cost)
    totalLaborCost = totalMaterialCost * 0.10;
    
    // Calculate estimated overhead cost (15% of material cost)
    totalOverheadCost = totalMaterialCost * 0.15;
    
    const totalCost = totalMaterialCost + totalLaborCost + totalOverheadCost;
    
    return {
      productId,
      quantity,
      materialCost: totalMaterialCost,
      laborCost: totalLaborCost,
      overheadCost: totalOverheadCost,
      totalCost,
      unitCost: totalCost / quantity,
      materials,
      canProduce: materials.every(m => m.isAvailable)
    };
  }

  // Recipe management methods
  async getRecipes(companyId: number) {
    return await db
      .select()
      .from(recipes)
      .where(eq(recipes.companyId, companyId))
      .orderBy(desc(recipes.createdAt));
  }

  async createRecipe(recipeData: any) {
    const [recipe] = await db
      .insert(recipes)
      .values({
        companyId: recipeData.companyId,
        productId: recipeData.productId,
        name: recipeData.name,
        description: recipeData.description,
        instructions: recipeData.instructions,
        preparationTime: recipeData.preparationTime,
        cookingTime: recipeData.cookingTime,
        servings: recipeData.servings,
        difficulty: recipeData.difficulty || 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return recipe;
  }

  async updateRecipe(recipeId: number, recipeData: any, companyId: number) {
    const [recipe] = await db
      .update(recipes)
      .set({
        productId: recipeData.productId,
        name: recipeData.name,
        description: recipeData.description,
        instructions: recipeData.instructions,
        preparationTime: recipeData.preparationTime,
        cookingTime: recipeData.cookingTime,
        servings: recipeData.servings,
        difficulty: recipeData.difficulty,
        updatedAt: new Date(),
      })
      .where(and(
        eq(recipes.id, recipeId),
        eq(recipes.companyId, companyId)
      ))
      .returning();
    return recipe;
  }

  async deleteRecipe(recipeId: number, companyId: number) {
    await db
      .delete(recipes)
      .where(and(
        eq(recipes.id, recipeId),
        eq(recipes.companyId, companyId)
      ));
  }

  // Profile and Settings methods
  async getUserById(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  // updateUser method already defined above - removing duplicate

  async getCompanySettings(companyId: number): Promise<any> {
    // Return default settings - can be extended to use a settings table
    return {
      theme: "light",
      language: "es",
      currency: "DOP",
      timezone: "America/Santo_Domingo",
      notifications: {
        email: true,
        push: true,
        lowStock: true,
        sales: true
      },
      fiscal: {
        defaultNCFType: "01",
        taxRate: 0.18,
        autoGenerateNCF: true
      }
    };
  }

  async updateCompanySettings(companyId: number, settings: any): Promise<any> {
    // Return the settings - can be extended to persist in database
    return settings;
  }

  // Module Management Storage Methods
  async getSystemModules(): Promise<SystemModule[]> {
    return await db.select().from(systemModules).orderBy(systemModules.sortOrder, systemModules.category);
  }

  async getSystemModule(id: number): Promise<SystemModule | undefined> {
    const [module] = await db.select().from(systemModules).where(eq(systemModules.id, id));
    return module;
  }

  async createSystemModule(module: InsertSystemModule): Promise<SystemModule> {
    const [created] = await db.insert(systemModules).values(module).returning();
    return created;
  }

  async updateSystemModule(id: number, updates: Partial<InsertSystemModule>): Promise<SystemModule | undefined> {
    const [updated] = await db
      .update(systemModules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(systemModules.id, id))
      .returning();
    return updated;
  }

  async deleteSystemModule(id: number): Promise<void> {
    await db.delete(systemModules).where(eq(systemModules.id, id));
  }

  // Company Module Operations
  async getCompanyModules(companyId: number): Promise<(CompanyModule & { module: SystemModule })[]> {
    return await db
      .select({
        id: companyModules.id,
        companyId: companyModules.companyId,
        moduleId: companyModules.moduleId,
        isEnabled: companyModules.isEnabled,
        enabledAt: companyModules.enabledAt,
        enabledBy: companyModules.enabledBy,
        disabledAt: companyModules.disabledAt,
        disabledBy: companyModules.disabledBy,
        settings: companyModules.settings,
        createdAt: companyModules.createdAt,
        updatedAt: companyModules.updatedAt,
        module: {
          id: systemModules.id,
          name: systemModules.name,
          displayName: systemModules.displayName,
          description: systemModules.description,
          category: systemModules.category,
          icon: systemModules.icon,
          version: systemModules.version,
          isCore: systemModules.isCore,
          requiresSubscription: systemModules.requiresSubscription,
          subscriptionTiers: systemModules.subscriptionTiers,
          dependencies: systemModules.dependencies,
          isActive: systemModules.isActive,
          sortOrder: systemModules.sortOrder,
          createdAt: systemModules.createdAt,
          updatedAt: systemModules.updatedAt
        }
      })
      .from(companyModules)
      .innerJoin(systemModules, eq(companyModules.moduleId, systemModules.id))
      .where(eq(companyModules.companyId, companyId))
      .orderBy(systemModules.category, systemModules.sortOrder);
  }

  async getCompanyModule(companyId: number, moduleId: number): Promise<CompanyModule | undefined> {
    const [module] = await db
      .select()
      .from(companyModules)
      .where(and(eq(companyModules.companyId, companyId), eq(companyModules.moduleId, moduleId)));
    return module;
  }

  async enableCompanyModule(companyId: number, moduleId: number, enabledBy: string): Promise<CompanyModule> {
    // Check if module permission already exists
    const existing = await this.getCompanyModule(companyId, moduleId);
    
    if (existing) {
      const [updated] = await db
        .update(companyModules)
        .set({
          isEnabled: true,
          enabledAt: new Date(),
          enabledBy,
          disabledAt: null,
          disabledBy: null,
          updatedAt: new Date()
        })
        .where(and(eq(companyModules.companyId, companyId), eq(companyModules.moduleId, moduleId)))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(companyModules)
        .values({
          companyId,
          moduleId,
          isEnabled: true,
          enabledBy,
          enabledAt: new Date()
        })
        .returning();
      return created;
    }
  }

  async disableCompanyModule(companyId: number, moduleId: number, disabledBy: string): Promise<CompanyModule> {
    const [updated] = await db
      .update(companyModules)
      .set({
        isEnabled: false,
        disabledAt: new Date(),
        disabledBy,
        updatedAt: new Date()
      })
      .where(and(eq(companyModules.companyId, companyId), eq(companyModules.moduleId, moduleId)))
      .returning();
    return updated;
  }

  async updateCompanyModuleSettings(companyId: number, moduleId: number, settings: any): Promise<CompanyModule | undefined> {
    const [updated] = await db
      .update(companyModules)
      .set({ settings, updatedAt: new Date() })
      .where(and(eq(companyModules.companyId, companyId), eq(companyModules.moduleId, moduleId)))
      .returning();
    return updated;
  }

  // System Configuration Operations
  async getSystemConfigs(category?: string): Promise<SystemConfig[]> {
    if (category) {
      return await db.select().from(systemConfig).where(eq(systemConfig.category, category));
    }
    return await db.select().from(systemConfig).orderBy(systemConfig.category, systemConfig.key);
  }

  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    const [config] = await db.select().from(systemConfig).where(eq(systemConfig.key, key));
    return config;
  }

  async upsertSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const [result] = await db
      .insert(systemConfig)
      .values(config)
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: {
          value: config.value,
          valueType: config.valueType,
          category: config.category,
          description: config.description,
          isEditable: config.isEditable,
          isPublic: config.isPublic,
          updatedAt: new Date()
        }
      })
      .returning();
    return result;
  }

  async deleteSystemConfig(key: string): Promise<void> {
    await db.delete(systemConfig).where(eq(systemConfig.key, key));
  }

  // Notification methods
  async getUserNotifications(userId: string) {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotificationSettings(userId: string) {
    const [settings] = await db.select().from(notificationSettings)
      .where(eq(notificationSettings.userId, userId));
    return settings;
  }

  async updateNotificationSettings(userId: string, settings: any) {
    const [result] = await db
      .insert(notificationSettings)
      .values({ userId, ...settings })
      .onConflictDoUpdate({
        target: notificationSettings.userId,
        set: { ...settings, updatedAt: new Date() }
      })
      .returning();
    return result;
  }

  // Notification methods already defined above, removing duplicates

  // API Developer operations
  async createApiDeveloper(developer: InsertApiDeveloper): Promise<ApiDeveloper> {
    const [result] = await db.insert(apiDevelopers)
      .values(developer)
      .returning();
    return result;
  }

  async getApiDeveloperByKey(apiKey: string): Promise<ApiDeveloper | undefined> {
    const [result] = await db.select()
      .from(apiDevelopers)
      .where(eq(apiDevelopers.apiKey, apiKey))
      .limit(1);
    return result;
  }

  async getApiDeveloperByEmail(email: string): Promise<ApiDeveloper | undefined> {
    const [result] = await db.select()
      .from(apiDevelopers)
      .where(eq(apiDevelopers.email, email))
      .limit(1);
    return result;
  }

  async updateApiDeveloper(id: number, updates: Partial<InsertApiDeveloper>): Promise<ApiDeveloper | undefined> {
    const [result] = await db.update(apiDevelopers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(apiDevelopers.id, id))
      .returning();
    return result;
  }

  async logApiRequest(request: InsertApiRequest): Promise<ApiRequest> {
    const [result] = await db.insert(apiRequests)
      .values(request)
      .returning();
    
    // Update developer's request count and last request time
    await db.update(apiDevelopers)
      .set({ 
        requestsCount: sql`${apiDevelopers.requestsCount} + 1`,
        lastRequestAt: new Date()
      })
      .where(eq(apiDevelopers.id, request.developerId));
    
    return result;
  }

  async getApiDeveloperStats(developerId: number): Promise<{ requestsCount: number; lastRequestAt: Date | null }> {
    const [developer] = await db.select({
      requestsCount: apiDevelopers.requestsCount,
      lastRequestAt: apiDevelopers.lastRequestAt
    })
    .from(apiDevelopers)
    .where(eq(apiDevelopers.id, developerId))
    .limit(1);
    
    return {
      requestsCount: developer?.requestsCount || 0,
      lastRequestAt: developer?.lastRequestAt || null
    };
  }

  // Add missing getRNCData method for API
  async getRNCData(rnc: string): Promise<RNCRegistry | undefined> {
    const [result] = await db.select()
      .from(rncRegistry)
      .where(eq(rncRegistry.rnc, rnc))
      .limit(1);
    return result;
  }

  // updateUser method already defined above - removing duplicate

  // Settings management methods
  async updateSystemSettings(userId: string, settings: any): Promise<void> {
    // Store settings in a simple key-value format using company settings
    const company = await this.getCompanyByUserId(userId);
    if (company) {
      await db.update(companies)
        .set({ 
          systemSettings: JSON.stringify(settings),
          updatedAt: new Date()
        })
        .where(eq(companies.id, company.id));
    }
  }

  async updateSecuritySettings(userId: string, settings: any): Promise<void> {
    const company = await this.getCompanyByUserId(userId);
    if (company) {
      await db.update(companies)
        .set({ 
          securitySettings: JSON.stringify(settings),
          updatedAt: new Date()
        })
        .where(eq(companies.id, company.id));
    }
  }

  async updatePOSSettings(userId: string, settings: any): Promise<void> {
    const company = await this.getCompanyByUserId(userId);
    if (company) {
      await db.update(companies)
        .set({ 
          posSettings: JSON.stringify(settings),
          updatedAt: new Date()
        })
        .where(eq(companies.id, company.id));
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // For Replit Auth users, password changes would need to be handled through the auth provider
    // This is a placeholder for the functionality
    throw new Error("Password changes must be handled through your authentication provider");
  }

  // DGII Analytics Methods
  async getPOSSalesCount(companyId: number, year: number): Promise<number> {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(posSales)
      .where(and(
        eq(posSales.companyId, companyId),
        gte(posSales.createdAt, startDate),
        lte(posSales.createdAt, endDate)
      ));
    
    return result[0]?.count || 0;
  }

  async getPOSSalesTotalAmount(companyId: number, year: number): Promise<number> {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    
    const result = await db
      .select({ total: sql<number>`sum(cast(total as decimal))` })
      .from(posSales)
      .where(and(
        eq(posSales.companyId, companyId),
        gte(posSales.createdAt, startDate),
        lte(posSales.createdAt, endDate)
      ));
    
    return result[0]?.total || 0;
  }

  async getFiscalReportsCount(companyId: number, year: number): Promise<number> {
    // Count generated fiscal reports for the year
    // This would typically be stored in a fiscal_reports table
    // For now, we'll return a calculated value based on sales data
    const salesCount = await this.getPOSSalesCount(companyId, year);
    
    // Estimate reports sent based on sales activity
    // Typically one report per month with sales activity
    const currentMonth = new Date().getMonth() + 1;
    const monthsWithSales = Math.min(currentMonth, Math.ceil(salesCount / 10)); // Estimate months with significant sales
    
    return monthsWithSales;
  }

  // Payment and subscription management methods
  async getPaymentSubmissions(): Promise<any[]> {
    return await db
      .select()
      .from(paymentSubmissions)
      .orderBy(desc(paymentSubmissions.submittedAt));
  }

  async updatePaymentStatus(paymentId: number, status: string, adminNotes?: string): Promise<any> {
    console.log(`[DEBUG STORAGE] Updating payment ID: ${paymentId} to status: ${status}`);
    try {
      const [payment] = await db
        .update(paymentSubmissions)
        .set({
          status,
          adminNotes,
          processedAt: new Date()
        })
        .where(eq(paymentSubmissions.id, paymentId))
        .returning();
      
      console.log(`[DEBUG STORAGE] Payment update result:`, payment);
      return payment;
    } catch (error) {
      console.error(`[DEBUG STORAGE] Error updating payment:`, error);
      throw error;
    }
  }

  async getUserPaymentStatus(email: string): Promise<any> {
    const [payment] = await db
      .select()
      .from(paymentSubmissions)
      .where(eq(paymentSubmissions.email, email))
      .orderBy(desc(paymentSubmissions.submittedAt))
      .limit(1);
    return payment;
  }

  // getUserByEmail method already defined above - removing duplicate

  // Manufacturing and BOM operations
  async calculateManufacturedProductCost(productId: number, companyId: number): Promise<number> {
    // Legacy method - to be reimplemented with new BOM structure
    return 0;
    /* Legacy implementation commented out
    const bomItems = await db
      .select({
        materialId: bom.materialId,
        quantity: bom.quantity,
        material: products
      })
      .from(bom)
      .innerJoin(products, eq(bom.materialId, products.id))
      .where(and(
        eq(bom.productId, productId),
        eq(bom.companyId, companyId),
        eq(products.companyId, companyId)
      ));

    let totalCost = 0;
    for (const item of bomItems) {
      const materialCost = parseFloat(item.material.cost || '0');
      const requiredQuantity = parseFloat(item.quantity.toString());
      totalCost += materialCost * requiredQuantity;
    }

    return totalCost;
    */
  }

  async checkMaterialAvailability(productId: number, quantity: number, companyId: number): Promise<{ available: boolean; missing: Array<{ materialId: number; required: number; available: number }> }> {
    // Legacy method - to be reimplemented with new BOM structure
    return { available: true, missing: [] };
    /* Legacy implementation commented out
    const bomItems = await db
      .select({
        materialId: bom.materialId,
        quantity: bom.quantity,
        material: products
      })
      .from(bom)
      .innerJoin(products, eq(bom.materialId, products.id))
      .where(and(
        eq(bom.productId, productId),
        eq(bom.companyId, companyId),
        eq(products.companyId, companyId)
      ));

    const missing: Array<{ materialId: number; required: number; available: number }> = [];

    for (const item of bomItems) {
      const requiredQuantity = parseFloat(item.quantity.toString()) * quantity;
      const availableStock = item.material.stock;

      // Only check stock for non-consumable materials (raw materials and regular products)
      if (!item.material.isConsumable && availableStock < requiredQuantity) {
        missing.push({
          materialId: item.materialId,
          required: requiredQuantity,
          available: availableStock
        });
      }
    }

    return {
      available: missing.length === 0,
      missing
    };
    */
  }

  async processManufacturedProductSale(productId: number, quantity: number, companyId: number, userId: string): Promise<void> {
    // Check if product has BOM using new structure
    const boms = await this.getBOMs(companyId);
    const productBOM = boms.find(b => b.productId === productId && b.isActive);
    
    if (!productBOM || !productBOM.items || productBOM.items.length === 0) {
      // No BOM defined, skip material deduction
      return;
    }
    
    // Process each material in the BOM
    for (const item of productBOM.items) {
      const requiredQuantity = parseFloat(item.quantity) * quantity;
      
      // Get material details
      const [material] = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.id, item.componentId),
            eq(products.companyId, companyId)
          )
        )
        .limit(1);
      
      if (material && material.trackInventory) {
        // Update material stock
        await db
          .update(products)
          .set({ 
            stock: sql`${products.stock} - ${requiredQuantity}`,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(products.id, item.componentId),
              eq(products.companyId, companyId)
            )
          );

        // Create inventory movement record
        await db.insert(inventoryMovements).values({
          productId: item.componentId,
          type: 'OUT',
          quantity: Math.floor(requiredQuantity),
          reason: 'manufactured_product_sale',
          notes: `Material used for manufacturing product ID: ${productId}, quantity: ${quantity}`,
          companyId,
          createdBy: userId,
        });
      }
    }
    
    return;
    /* Legacy implementation commented out
    const bomItems = await db
      .select({
        materialId: bom.materialId,
        quantity: bom.quantity,
        material: products
      })
      .from(bom)
      .innerJoin(products, eq(bom.materialId, products.id))
      .where(and(
        eq(bom.productId, productId),
        eq(bom.companyId, companyId),
        eq(products.companyId, companyId)
      ));

    // Process each material in the BOM
    for (const item of bomItems) {
      const requiredQuantity = parseFloat(item.quantity.toString()) * quantity;
      
      // Only deduct stock from non-consumable materials
      if (!item.material.isConsumable) {
        // Update material stock
        await db
          .update(products)
          .set({ 
            stock: sql`${products.stock} - ${requiredQuantity}`,
            updatedAt: new Date()
          })
          .where(and(
            eq(products.id, item.materialId),
            eq(products.companyId, companyId)
          ));

        // Create inventory movement record
        await db.insert(inventoryMovements).values({
          productId: item.materialId,
          type: 'OUT',
          quantity: Math.floor(requiredQuantity),
          reason: 'manufactured_product_sale',
          notes: `Material usado para manufactura de producto ID: ${productId}, cantidad: ${quantity}`,
          companyId,
          createdBy: userId,
        });
      }
    }
    */
  }

  async getBOMForProduct(productId: number, companyId: number): Promise<Array<{ materialId: number; quantity: number; material: Product }>> {
    // Legacy method - returns empty array until migration
    return [];
    /* Legacy implementation commented out
    const bomItems = await db
      .select({
        materialId: bom.materialId,
        quantity: bom.quantity,
        material: products
      })
      .from(bom)
      .innerJoin(products, eq(bom.materialId, products.id))
      .where(and(
        eq(bom.productId, productId),
        eq(bom.companyId, companyId),
        eq(products.companyId, companyId)
      ));

    return bomItems.map(item => ({
      materialId: item.materialId,
      quantity: parseFloat(item.quantity.toString()),
      material: item.material
    }));
    */
  }

  async verifySaleById(saleId: number): Promise<{sale: POSSale, company: Company, items: POSSaleItem[]} | null> {
    try {
      // First get the sale to find the company ID
      const [sale] = await db
        .select()
        .from(posSales)
        .where(eq(posSales.id, saleId))
        .limit(1);

      if (!sale) {
        return null;
      }

      // Get company data
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, sale.companyId))
        .limit(1);

      if (!company) {
        return null;
      }

      // Get sale items
      const items = await db
        .select()
        .from(posSaleItems)
        .where(eq(posSaleItems.saleId, saleId))
        .orderBy(posSaleItems.id);

      return {
        sale,
        company,
        items
      };
    } catch (error) {
      console.error("Error verifying sale:", error);
      return null;
    }
  }

  // NCF Sequence Management Methods
  async getNextNCF(companyId: number, ncfType: string): Promise<string | null> {
    try {
      const [sequence] = await db
        .select()
        .from(ncfSequences)
        .where(
          and(
            eq(ncfSequences.companyId, companyId),
            eq(ncfSequences.ncfType, ncfType),
            eq(ncfSequences.isActive, true)
          )
        )
        .limit(1);

      if (!sequence) {
        console.log(`No active NCF sequence found for type ${ncfType}`);
        return null;
      }

      const currentSeq = sequence.currentSequence || 1;
      const maxSeq = sequence.maxSequence || 50000000;
      
      if (currentSeq >= maxSeq) {
        console.log(`NCF sequence ${ncfType} exhausted`);
        return null;
      }

      const formattedNumber = currentSeq.toString().padStart(8, '0');
      const ncf = `${ncfType}${formattedNumber}`;
      
      return ncf;
    } catch (error) {
      console.error("Error getting next NCF:", error);
      return null;
    }
  }

  async incrementNCFSequence(companyId: number, ncfType: string): Promise<void> {
    try {
      await db
        .update(ncfSequences)
        .set({ 
          currentSequence: sql`${ncfSequences.currentSequence} + 1`,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(ncfSequences.companyId, companyId),
            eq(ncfSequences.ncfType, ncfType),
            eq(ncfSequences.isActive, true)
          )
        );
    } catch (error) {
      console.error("Error incrementing NCF sequence:", error);
      throw error;
    }
  }

  async createNCFSequence(sequenceData: any): Promise<any> {
    try {
      const [sequence] = await db
        .insert(ncfSequences)
        .values(sequenceData)
        .returning();
      return sequence;
    } catch (error) {
      console.error("Error creating NCF sequence:", error);
      throw error;
    }
  }

  async getNCFSequences(companyId: number): Promise<any[]> {
    try {
      return await db
        .select()
        .from(ncfSequences)
        .where(eq(ncfSequences.companyId, companyId))
        .orderBy(ncfSequences.ncfType);
    } catch (error) {
      console.error("Error fetching NCF sequences:", error);
      return [];
    }
  }

  async updateNCFSequence(id: number, updateData: any): Promise<any> {
    try {
      const [updated] = await db
        .update(ncfSequences)
        .set({ 
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(ncfSequences.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating NCF sequence:", error);
      throw error;
    }
  }

  async getNCFSequenceById(id: number): Promise<any> {
    try {
      const [sequence] = await db
        .select()
        .from(ncfSequences)
        .where(eq(ncfSequences.id, id));
      return sequence;
    } catch (error) {
      console.error("Error getting NCF sequence by ID:", error);
      throw error;
    }
  }

  async deleteNCFSequence(id: number): Promise<void> {
    try {
      await db
        .delete(ncfSequences)
        .where(eq(ncfSequences.id, id));
    } catch (error) {
      console.error("Error deleting NCF sequence:", error);
      throw error;
    }
  }

  // Additional missing methods for completeness
  async clearPOSCart(companyId: number, userId: string): Promise<void> {
    try {
      await db
        .delete(posCartItems)
        .where(
          and(
            eq(posCartItems.companyId, companyId),
            eq(posCartItems.userId, userId)
          )
        );
    } catch (error) {
      console.error("Error clearing POS cart:", error);
      throw error;
    }
  }

  async removePOSCartItem(cartId: number): Promise<void> {
    try {
      await db
        .delete(posCartItems)
        .where(eq(posCartItems.id, cartId));
    } catch (error) {
      console.error("Error removing POS cart item:", error);
      throw error;
    }
  }

  // Recipe operations

  async getRecipe(id: number, companyId: number): Promise<any | undefined> {
    try {
      const [recipe] = await db
        .select()
        .from(recipes)
        .where(and(
          eq(recipes.id, id),
          eq(recipes.companyId, companyId)
        ))
        .limit(1);
      
      return recipe;
    } catch (error) {
      console.error("Error fetching recipe:", error);
      return undefined;
    }
  }




  // Users and Permissions Management
  async createUser(user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isActive?: boolean;
  }): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive ?? true,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newUser;
  }






  async getCompanyRoles(companyId: number): Promise<any[]> {
    try {
      // For now, return default roles since we don't have a roles table
      const rolesData = [
        {
          id: 'role_admin',
          name: 'Administrador',
          description: 'Acceso completo al sistema',
          permissions: [
            'pos.view', 'pos.create', 'pos.edit', 'pos.delete',
            'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
            'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
            'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
            'billing.view', 'billing.create', 'billing.edit', 'billing.delete',
            'accounting.view', 'accounting.create', 'accounting.edit', 'accounting.delete',
            'reports.view', 'reports.export', 'reports.advanced',
            'warehouse.view', 'warehouse.create', 'warehouse.edit', 'warehouse.delete',
            'hr.view', 'hr.create', 'hr.edit', 'hr.payroll',
            'system.view', 'system.edit', 'system.admin',
            'ai.view', 'ai.use',
            'audit.view', 'audit.export',
          ],
          isActive: true,
          userCount: 0,
        },
        {
          id: 'role_manager',
          name: 'Gerente',
          description: 'Acceso a gestión y reportes',
          permissions: [
            'pos.view', 'pos.create', 'pos.edit',
            'inventory.view', 'inventory.create', 'inventory.edit',
            'customers.view', 'customers.create', 'customers.edit',
            'suppliers.view', 'suppliers.create', 'suppliers.edit',
            'billing.view', 'billing.create', 'billing.edit',
            'reports.view', 'reports.export',
            'warehouse.view', 'warehouse.create', 'warehouse.edit',
            'hr.view', 'hr.create', 'hr.edit',
            'ai.view', 'ai.use',
          ],
          isActive: true,
          userCount: 0,
        },
        {
          id: 'role_user',
          name: 'Usuario',
          description: 'Acceso básico al sistema',
          permissions: [
            'pos.view', 'pos.create',
            'inventory.view',
            'customers.view', 'customers.create',
            'billing.view', 'billing.create',
            'reports.view',
            'warehouse.view',
          ],
          isActive: true,
          userCount: 0,
        },
      ];

      return rolesData;
    } catch (error) {
      console.error("Error getting company roles:", error);
      throw error;
    }
  }

  async createRole(roleData: any): Promise<any> {
    try {
      // For now, just return the role data since we don't have a roles table
      const role = {
        id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions || [],
        isActive: true,
        userCount: 0,
        createdAt: new Date(),
      };

      return role;
    } catch (error) {
      console.error("Error creating role:", error);
      throw error;
    }
  }

  async updateRole(roleId: string, updateData: any): Promise<any> {
    try {
      // For now, just return the updated role data
      const role = {
        id: roleId,
        name: updateData.name,
        description: updateData.description,
        permissions: updateData.permissions || [],
        isActive: updateData.isActive !== undefined ? updateData.isActive : true,
        userCount: 0,
        updatedAt: new Date(),
      };

      return role;
    } catch (error) {
      console.error("Error updating role:", error);
      throw error;
    }
  }

  async getRole(roleId: string): Promise<any> {
    try {
      // For now, return a default role since we don't have a roles table
      const role = {
        id: roleId,
        name: 'Usuario',
        description: 'Rol básico del sistema',
        permissions: ['pos.view', 'inventory.view'],
        isActive: true,
        userCount: 0,
      };

      return role;
    } catch (error) {
      console.error("Error getting role:", error);
      throw error;
    }
  }

  // DGII Reports methods
  async getDGIIReports(companyId: number): Promise<any[]> {
    try {
      const results = await db
        .select()
        .from(dgiiReports)
        .where(eq(dgiiReports.companyId, companyId))
        .orderBy(desc(dgiiReports.generatedAt));
      
      return results;
    } catch (error) {
      console.error("Error getting DGII reports:", error);
      return [];
    }
  }

  async createDGIIReport(reportData: any): Promise<any> {
    try {
      const [report] = await db
        .insert(dgiiReports)
        .values({
          companyId: reportData.companyId,
          tipo: reportData.tipo,
          periodo: reportData.periodo,
          fechaInicio: new Date(reportData.fechaInicio),
          fechaFin: new Date(reportData.fechaFin),
          numeroRegistros: reportData.numeroRegistros,
          montoTotal: reportData.montoTotal,
          itbisTotal: reportData.itbisTotal,
          estado: reportData.estado,
          checksum: reportData.checksum,
          generatedAt: reportData.generatedAt,
        })
        .returning();

      return report;
    } catch (error) {
      console.error("Error creating DGII report:", error);
      throw error;
    }
  }



  // Enhanced Accounting Methods
  async getChartOfAccounts(companyId: number): Promise<any[]> {
    try {
      const accounts = await db.execute(sql`
        SELECT * FROM accounts 
        WHERE company_id = ${companyId} 
        ORDER BY code
      `);
      return accounts.rows;
    } catch (error) {
      console.error("Error fetching chart of accounts:", error);
      return [];
    }
  }

  async searchChartOfAccounts(companyId: number, query: string, category?: string): Promise<any[]> {
    try {
      let queryConditions = sql`company_id = ${companyId}`;
      
      if (query) {
        queryConditions = sql`${queryConditions} AND (
          LOWER(name) LIKE LOWER(${`%${query}%`}) OR
          LOWER(code) LIKE LOWER(${`%${query}%`}) OR
          LOWER(description) LIKE LOWER(${`%${query}%`})
        )`;
      }
      
      if (category) {
        queryConditions = sql`${queryConditions} AND category = ${category}`;
      }

      const accounts = await db.execute(sql`
        SELECT * FROM accounts 
        WHERE ${queryConditions}
        ORDER BY code
      `);
      return accounts.rows;
    } catch (error) {
      console.error("Error searching chart of accounts:", error);
      return [];
    }
  }


  async getFinancialReports(companyId: number): Promise<any[]> {
    try {
      const reports = await db.execute(sql`
        SELECT * FROM financial_reports 
        WHERE company_id = ${companyId} 
        ORDER BY generated_date DESC
      `);
      return reports.rows;
    } catch (error) {
      console.error("Error fetching financial reports:", error);
      return [];
    }
  }

  async saveFinancialReport(report: any): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO financial_reports (
          company_id, report_type, report_name, period_start, period_end,
          generated_by, report_data, status
        ) VALUES (
          ${report.companyId}, ${report.reportType}, ${report.reportName},
          ${report.periodStart}, ${report.periodEnd}, ${report.generatedBy},
          ${JSON.stringify(report.reportData)}, ${report.status || 'GENERATED'}
        ) RETURNING *
      `);
      return result.rows[0];
    } catch (error) {
      console.error("Error saving financial report:", error);
      throw error;
    }
  }

  // Payroll methods for automatic deduction calculations
  async getPayrollRecords(companyId: number): Promise<any[]> {
    try {
      const records = await db
        .select({
          id: payrollEntries.id,
          employeeId: payrollEntries.employeeId,
          companyId: payrollEntries.companyId,
          periodId: payrollEntries.periodId,
          baseSalary: payrollEntries.baseSalary,
          grossPay: payrollEntries.grossPay,
          tssDeduction: payrollEntries.tssDeduction,
          sfsDeduction: payrollEntries.sfsDeduction,
          incomeTaxDeduction: payrollEntries.incomeTaxDeduction,
          totalDeductions: payrollEntries.totalDeductions,
          netPay: payrollEntries.netPay,
          createdAt: payrollEntries.createdAt,
          employee: {
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            cedula: employees.cedula,
            salary: employees.salary
          }
        })
        .from(payrollEntries)
        .leftJoin(employees, eq(payrollEntries.employeeId, employees.id))
        .where(eq(payrollEntries.companyId, companyId))
        .orderBy(payrollEntries.createdAt);

      return records;
    } catch (error) {
      console.error("Error getting payroll records:", error);
      return [];
    }
  }

  async createPayrollRecord(data: any): Promise<any> {
    try {
      // First, create or get the payroll period
      const periodData = {
        companyId: data.companyId,
        periodName: `${data.month}/${data.year}`,
        startDate: new Date(data.year, data.month - 1, 1),
        endDate: new Date(data.year, data.month, 0),
        payDate: new Date(data.year, data.month, 0),
        status: 'open'
      };
      
      const [period] = await db
        .insert(payrollPeriods)
        .values(periodData)
        .onConflictDoUpdate({
          target: [payrollPeriods.companyId, payrollPeriods.periodName],
          set: { status: 'open' }
        })
        .returning();

      // Create the payroll entry
      const [record] = await db
        .insert(payrollEntries)
        .values({
          employeeId: data.employeeId,
          companyId: data.companyId,
          periodId: period.id,
          baseSalary: data.grossSalary,
          grossPay: data.grossSalary,
          sfsDeduction: data.deductions.sfs || 0,
          tssDeduction: data.deductions.afp || 0,
          incomeTaxDeduction: data.deductions.isr || 0,
          totalDeductions: data.deductions.total || 0,
          netPay: data.netSalary
        })
        .returning();

      return record;
    } catch (error) {
      console.error("Error creating payroll record:", error);
      throw error;
    }
  }

  async getPayrollRecordsByPeriod(companyId: number, month: number, year: number): Promise<any[]> {
    try {
      // First, find the payroll period for the specified month/year
      const periodName = `${month}/${year}`;
      const periods = await db
        .select()
        .from(payrollPeriods)
        .where(
          and(
            eq(payrollPeriods.companyId, companyId),
            eq(payrollPeriods.periodName, periodName)
          )
        );

      if (periods.length === 0) {
        return [];
      }

      const periodId = periods[0].id;

      // Now get all payroll entries for this period
      const records = await db
        .select({
          id: payrollEntries.id,
          employeeId: payrollEntries.employeeId,
          companyId: payrollEntries.companyId,
          periodId: payrollEntries.periodId,
          baseSalary: payrollEntries.baseSalary,
          grossPay: payrollEntries.grossPay,
          tssDeduction: payrollEntries.tssDeduction,
          sfsDeduction: payrollEntries.sfsDeduction,
          incomeTaxDeduction: payrollEntries.incomeTaxDeduction,
          totalDeductions: payrollEntries.totalDeductions,
          netPay: payrollEntries.netPay,
          createdAt: payrollEntries.createdAt,
          employee: {
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            cedula: employees.cedula,
            salary: employees.salary
          }
        })
        .from(payrollEntries)
        .leftJoin(employees, eq(payrollEntries.employeeId, employees.id))
        .where(eq(payrollEntries.periodId, periodId))
        .orderBy(employees.firstName, employees.lastName);

      return records;
    } catch (error) {
      console.error("Error getting payroll records by period:", error);
      return [];
    }
  }

  // Fiscal documents methods
  async getFiscal606Data(companyId: number, period: string): Promise<any[]> {
    try {
      // For 606 (purchases), we would typically get data from purchase orders/supplier invoices
      // For now, return sample structure based on actual sales data
      const startDate = `${period}-01`;
      const endDate = period.length === 7 ? `${period}-31` : `${period}`;
      
      const purchases = await db
        .select({
          id: posSales.id,
          ncf: posSales.ncf,
          proveedor: customers.name,
          rnc: customers.rnc,
          fecha: posSales.createdAt,
          monto: posSales.total,
          itbis: posSales.itbis,
          estado: sql<string>`'procesado'`
        })
        .from(posSales)
        .leftJoin(customers, eq(posSales.customerId, customers.id))
        .where(
          and(
            eq(posSales.companyId, companyId),
            gte(posSales.createdAt, new Date(startDate)),
            lte(posSales.createdAt, new Date(endDate))
          )
        )
        .limit(50);

      return purchases;
    } catch (error) {
      console.error("Error getting 606 data:", error);
      return [];
    }
  }

  async getFiscal607Data(companyId: number, period: string): Promise<any[]> {
    try {
      // For 607 (sales), get data from POS sales
      const startDate = `${period}-01`;
      const endDate = period.length === 7 ? `${period}-31` : `${period}`;
      
      const sales = await db
        .select({
          id: posSales.id,
          ncf: posSales.ncf,
          cliente: customers.name,
          rnc: customers.rnc,
          fecha: posSales.createdAt,
          monto: posSales.total,
          itbis: posSales.itbis,
          estado: sql<string>`'procesado'`
        })
        .from(posSales)
        .leftJoin(customers, eq(posSales.customerId, customers.id))
        .where(
          and(
            eq(posSales.companyId, companyId),
            gte(posSales.createdAt, new Date(startDate)),
            lte(posSales.createdAt, new Date(endDate))
          )
        )
        .orderBy(desc(posSales.createdAt))
        .limit(50);

      return sales;
    } catch (error) {
      console.error("Error getting 607 data:", error);
      return [];
    }
  }

  // ===== SYSTEM MANAGEMENT METHODS =====

  // System Configuration Methods
  async getAllSystemConfig(): Promise<any[]> {
    try {
      const configs = await db.select().from(systemConfig);
      return configs;
    } catch (error) {
      console.error("Error fetching all system config:", error);
      return [];
    }
  }

  async getSystemConfigByCategory(category: string): Promise<any[]> {
    try {
      const configs = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.category, category));
      return configs;
    } catch (error) {
      console.error("Error fetching system config by category:", error);
      return [];
    }
  }



  async updateSystemConfig(key: string, value: string, updatedBy: string): Promise<any> {
    try {
      const [config] = await db
        .update(systemConfig)
        .set({
          value,
          updatedAt: new Date()
        })
        .where(eq(systemConfig.key, key))
        .returning();
      
      return config;
    } catch (error) {
      console.error("Error updating system config:", error);
      throw error;
    }
  }

  // System Statistics Methods
  async getInvoiceCount(companyId?: number): Promise<number> {
    try {
      if (!companyId) return 0;
      
      const result = await db.execute(sql`
        SELECT COUNT(*) as count FROM invoices WHERE company_id = ${companyId}
      `);
      return parseInt(result.rows[0]?.count || '0');
    } catch (error) {
      console.error("Error getting invoice count:", error);
      return 0;
    }
  }

  async getCustomerCount(companyId?: number): Promise<number> {
    try {
      if (!companyId) return 0;
      
      const result = await db.execute(sql`
        SELECT COUNT(*) as count FROM customers WHERE company_id = ${companyId}
      `);
      return parseInt(result.rows[0]?.count || '0');
    } catch (error) {
      console.error("Error getting customer count:", error);
      return 0;
    }
  }

  async getProductCount(companyId?: number): Promise<number> {
    try {
      if (!companyId) return 0;
      
      const result = await db.execute(sql`
        SELECT COUNT(*) as count FROM products WHERE company_id = ${companyId}
      `);
      return parseInt(result.rows[0]?.count || '0');
    } catch (error) {
      console.error("Error getting product count:", error);
      return 0;
    }
  }

  async getSupplierCount(companyId?: number): Promise<number> {
    try {
      if (!companyId) return 0;
      
      const result = await db.execute(sql`
        SELECT COUNT(*) as count FROM suppliers WHERE company_id = ${companyId}
      `);
      return parseInt(result.rows[0]?.count || '0');
    } catch (error) {
      console.error("Error getting supplier count:", error);
      return 0;
    }
  }

  // System Modules Methods  


  // Audit Logs Methods
  async getAuditLogs(page: number = 1, limit: number = 50, filters: any = {}): Promise<any> {
    try {
      const offset = (page - 1) * limit;
      let query = sql`
        SELECT 
          id, user_id, action, resource_type, resource_id, 
          details, ip_address, user_agent, created_at, module
        FROM activity_logs
        WHERE 1=1
      `;

      // Add filters
      if (filters.action) {
        query = sql`${query} AND action = ${filters.action}`;
      }
      if (filters.userId) {
        query = sql`${query} AND user_id = ${filters.userId}`;
      }
      if (filters.resourceType) {
        query = sql`${query} AND resource_type = ${filters.resourceType}`;
      }
      if (filters.startDate) {
        query = sql`${query} AND created_at >= ${filters.startDate}`;
      }
      if (filters.endDate) {
        query = sql`${query} AND created_at <= ${filters.endDate}`;
      }

      // Add ordering and pagination
      query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const logs = await db.execute(query);
      
      // Get total count for pagination
      const countQuery = sql`SELECT COUNT(*) as count FROM activity_logs WHERE 1=1`;
      const countResult = await db.execute(countQuery);
      const total = parseInt(countResult.rows[0]?.count || '0');

      return {
        data: logs.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
      };
    }
  }

}

export const storage = new DatabaseStorage();
