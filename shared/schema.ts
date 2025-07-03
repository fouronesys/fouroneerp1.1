import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Dominican Republic Tax Types
export const DR_TAX_TYPES = {
  itbis_18: { rate: 18, label: "ITBIS 18%", isInclusive: false },
  itbis_16: { rate: 16, label: "ITBIS 16%", isInclusive: false },
  itbis_8: { rate: 8, label: "ITBIS 8%", isInclusive: false },
  itbis_incl: { rate: 18, label: "ITBIS Incl.", isInclusive: true },
  exempt: { rate: 0, label: "Exento de Impuestos", isInclusive: false },
  selective_consumption: { rate: 25, label: "Impuesto Selectivo al Consumo", isInclusive: false },
  luxury_tax: { rate: 15, label: "Impuesto a Artículos de Lujo", isInclusive: false },
  fuel_tax: { rate: 16.18, label: "Impuesto a Combustibles", isInclusive: false },
  alcohol_tax: { rate: 20, label: "Impuesto a Bebidas Alcohólicas", isInclusive: false },
  tobacco_tax: { rate: 25, label: "Impuesto al Tabaco", isInclusive: false },
  tip_10: { rate: 10, label: "Propina 10%", isInclusive: false },
} as const;

export type TaxType = keyof typeof DR_TAX_TYPES;

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Updated for email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  password: text("password").notNull(), // Encrypted password
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).default("user"), // super_admin, company_admin, user
  isActive: boolean("is_active").default(true),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen"),
  lastLoginAt: timestamp("last_login_at"), // Track last login
  jobTitle: varchar("job_title", { length: 100 }),
  department: varchar("department", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company Users - Junction table for user-company relationships
export const companyUsers = pgTable("company_users", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  role: varchar("role", { length: 20 }).default("user"), // company_admin, user
  permissions: text("permissions").array(), // array of permission strings
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Companies
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  businessName: varchar("business_name", { length: 255 }), // Razón social
  rnc: varchar("rnc", { length: 20 }),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  logoUrl: text("logo_url"), // URL del logo personalizado
  industry: varchar("industry", { length: 100 }), // Sector/industria
  businessType: varchar("business_type", { length: 50 }).default("general"), // general, restaurant
  taxRegime: varchar("tax_regime", { length: 50 }).default("general"), // régimen tributario
  currency: varchar("currency", { length: 3 }).default("DOP"),
  timezone: varchar("timezone", { length: 50 }).default("America/Santo_Domingo"),
  subscriptionPlan: varchar("subscription_plan", { length: 20 }).default("active"), // active, suspended, cancelled
  subscriptionExpiry: timestamp("subscription_expiry"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  paymentConfirmed: boolean("payment_confirmed").default(false), // Admin-controlled payment confirmation
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending, confirmed, rejected
  registrationStatus: varchar("registration_status", { length: 20 }).default("pending"), // pending, completed, expired
  invitationToken: varchar("invitation_token", { length: 255 }), // token for registration link
  invitationSentAt: timestamp("invitation_sent_at"),
  invitationExpiresAt: timestamp("invitation_expires_at"),
  ownerEmail: varchar("owner_email", { length: 255 }), // email del propietario para invitación
  isActive: boolean("is_active").notNull().default(true),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  // Settings storage fields
  systemSettings: text("system_settings"), // JSON storage for system preferences
  securitySettings: text("security_settings"), // JSON storage for security settings
  posSettings: text("pos_settings"), // JSON storage for POS configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers - Enhanced for complete ERP functionality
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  // Basic Information
  code: varchar("code", { length: 50 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  businessName: varchar("business_name", { length: 255 }),
  type: varchar("type", { length: 20 }).notNull().default("individual"), // individual, company
  
  // Identification
  rnc: varchar("rnc", { length: 20 }),
  cedula: varchar("cedula", { length: 15 }),
  passportNumber: varchar("passport_number", { length: 50 }),
  
  // Contact Information
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  mobile: varchar("mobile", { length: 20 }),
  fax: varchar("fax", { length: 20 }),
  website: varchar("website", { length: 255 }),
  
  // Address Information
  address: text("address"),
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("República Dominicana"),
  postalCode: varchar("postal_code", { length: 20 }),
  
  // Business Information
  industry: varchar("industry", { length: 100 }),
  employeeCount: varchar("employee_count", { length: 50 }),
  annualRevenue: decimal("annual_revenue", { precision: 15, scale: 2 }),
  taxRegime: varchar("tax_regime", { length: 50 }),
  
  // Sales Information
  salesRepId: varchar("sales_rep_id").references(() => users.id),
  territory: varchar("territory", { length: 100 }),
  customerGroup: varchar("customer_group", { length: 100 }),
  priceList: varchar("price_list", { length: 50 }),
  
  // Payment Information
  paymentTerms: integer("payment_terms").default(30), // days
  creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }).default("0"),
  paymentMethod: varchar("payment_method", { length: 50 }).default("cash"),
  currency: varchar("currency", { length: 3 }).default("DOP"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  
  // Financial Information
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).default("0"),
  totalSales: decimal("total_sales", { precision: 15, scale: 2 }).default("0"),
  lastPurchaseDate: date("last_purchase_date"),
  
  // Marketing Information
  leadSource: varchar("lead_source", { length: 100 }),
  marketingOptIn: boolean("marketing_opt_in").default(true),
  preferredContactMethod: varchar("preferred_contact_method", { length: 50 }).default("email"),
  birthDate: date("birth_date"),
  
  // Loyalty Program
  loyaltyPoints: integer("loyalty_points").default(0),
  loyaltyTier: varchar("loyalty_tier", { length: 50 }).default("bronze"), // bronze, silver, gold, platinum
  memberSince: date("member_since"),
  
  // Status and Classification
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, blocked, suspended
  rating: decimal("rating", { precision: 3, scale: 2 }), // 0-5
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, vip
  tags: text("tags").array(),
  
  // Notes
  internalNotes: text("internal_notes"),
  publicNotes: text("public_notes"),
  
  // Audit Fields
  companyId: integer("company_id").notNull().references(() => companies.id),
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers - Enhanced for complete ERP functionality
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  // Basic Information
  code: varchar("code", { length: 50 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  businessName: varchar("business_name", { length: 255 }),
  rnc: varchar("rnc", { length: 20 }),
  
  // Contact Information
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  mobile: varchar("mobile", { length: 20 }),
  fax: varchar("fax", { length: 20 }),
  website: varchar("website", { length: 255 }),
  
  // Primary Contact Person
  contactPerson: varchar("contact_person", { length: 255 }),
  contactPersonPosition: varchar("contact_person_position", { length: 100 }),
  contactPersonPhone: varchar("contact_person_phone", { length: 20 }),
  contactPersonEmail: varchar("contact_person_email", { length: 255 }),
  
  // Additional identification for individuals
  cedula: varchar("cedula", { length: 20 }),
  
  // Address Information
  address: text("address"),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  country: varchar("country", { length: 100 }).default("República Dominicana"),
  postalCode: varchar("postal_code", { length: 20 }),
  
  // Business Information
  supplierType: varchar("supplier_type", { length: 50 }).default("business"), // business, individual
  supplierCategory: varchar("supplier_category", { length: 100 }).default("materials"), // materials, services, equipment, utilities, other
  industry: varchar("industry", { length: 100 }),
  taxRegime: varchar("tax_regime", { length: 50 }),
  
  // Payment Information
  paymentTerms: integer("payment_terms").default(30), // days
  paymentMethod: varchar("payment_method", { length: 50 }).default("transfer"), // cash, check, transfer, card
  creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 3 }).default("DOP"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  
  // Banking Information
  bankName: varchar("bank_name", { length: 100 }),
  bankAccount: varchar("bank_account", { length: 50 }),
  bankAccountType: varchar("bank_account_type", { length: 20 }), // checking, savings
  bankRoutingNumber: varchar("bank_routing_number", { length: 20 }),
  
  // Financial Information
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).default("0"),
  totalPurchases: decimal("total_purchases", { precision: 15, scale: 2 }).default("0"),
  lastPurchaseDate: date("last_purchase_date"),
  
  // Compliance & Documents
  taxId: varchar("tax_id", { length: 50 }),
  businessLicense: varchar("business_license", { length: 100 }),
  certifications: text("certifications").array(),
  
  // Performance Metrics
  averageDeliveryTime: integer("average_delivery_time"), // days
  qualityRating: decimal("quality_rating", { precision: 3, scale: 2 }), // 0-5
  onTimeDeliveryRate: decimal("on_time_delivery_rate", { precision: 5, scale: 2 }), // percentage
  
  // Tax Compliance
  taxWithholding: boolean("tax_withholding").default(false),
  
  // Status and Control
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, suspended, blacklisted
  isVerified: boolean("is_verified").default(false),
  verificationDate: timestamp("verification_date"),
  blockedReason: text("blocked_reason"),
  blockedDate: timestamp("blocked_date"),
  
  // Tags and Classification
  tags: text("tags").array(),
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, critical
  preferredSupplier: boolean("preferred_supplier").default(false),
  
  // Notes
  internalNotes: text("internal_notes"),
  publicNotes: text("public_notes"),
  
  // Audit Fields
  companyId: integer("company_id").notNull().references(() => companies.id),
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Warehouses
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  type: varchar("type", { length: 50 }).notNull().default("main"), // main, regional, temporary, finished_goods, raw_materials, assets
  manager: varchar("manager", { length: 255 }),
  maxCapacity: decimal("max_capacity", { precision: 15, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  temperatureControlled: boolean("temperature_controlled").notNull().default(false),
  minTemperature: decimal("min_temperature", { precision: 5, scale: 2 }),
  maxTemperature: decimal("max_temperature", { precision: 5, scale: 2 }),
  notes: text("notes"),
  companyId: integer("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Categories
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  companyId: integer("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products - Enhanced for complete ERP functionality
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  // Basic Information
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  detailedDescription: text("detailed_description"),
  
  // Product Type and Classification
  productType: varchar("product_type", { length: 50 }).notNull().default("product"), // product, raw_material, consumable, service, non_inventoriable
  categoryId: integer("category_id").references(() => productCategories.id),
  subcategory: varchar("subcategory", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  tags: text("tags").array(),
  
  // Pricing Information
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  priceList2: decimal("price_list_2", { precision: 10, scale: 2 }), // Wholesale price
  priceList3: decimal("price_list_3", { precision: 10, scale: 2 }), // Special price
  minimumPrice: decimal("minimum_price", { precision: 10, scale: 2 }),
  suggestedPrice: decimal("suggested_price", { precision: 10, scale: 2 }),
  
  // Tax Information
  taxType: varchar("tax_type", { length: 50 }).notNull().default("itbis_18"), // Tax type key
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("18"),
  taxIncluded: boolean("tax_included").default(false),
  
  // Inventory Information
  stock: integer("stock").notNull().default(0),
  availableStock: integer("available_stock").default(0),
  reservedStock: integer("reserved_stock").default(0),
  incomingStock: integer("incoming_stock").default(0),
  unit: varchar("unit", { length: 20 }).notNull().default("unit"),
  secondaryUnit: varchar("secondary_unit", { length: 20 }),
  unitConversionFactor: decimal("unit_conversion_factor", { precision: 10, scale: 4 }),
  
  // Stock Control
  trackInventory: boolean("track_inventory").default(true),
  minStock: integer("min_stock").default(0),
  maxStock: integer("max_stock"),
  reorderPoint: integer("reorder_point").default(0),
  reorderQuantity: integer("reorder_quantity").default(0),
  leadTime: integer("lead_time").default(0), // days
  
  // Physical Attributes
  weight: decimal("weight", { precision: 10, scale: 3 }),
  weightUnit: varchar("weight_unit", { length: 10 }).default("kg"),
  length: decimal("length", { precision: 10, scale: 2 }),
  width: decimal("width", { precision: 10, scale: 2 }),
  height: decimal("height", { precision: 10, scale: 2 }),
  dimensionUnit: varchar("dimension_unit", { length: 10 }).default("cm"),
  volume: decimal("volume", { precision: 10, scale: 3 }),
  
  // Identification
  barcode: varchar("barcode", { length: 50 }),
  sku: varchar("sku", { length: 100 }),
  ean13: varchar("ean13", { length: 13 }),
  upc: varchar("upc", { length: 12 }),
  isbn: varchar("isbn", { length: 13 }),
  
  // Location and Storage
  location: varchar("location", { length: 100 }),
  warehouseId: integer("warehouse_id"),
  rack: varchar("rack", { length: 50 }),
  row: varchar("row", { length: 50 }),
  bin: varchar("bin", { length: 50 }),
  
  // Supplier Information
  preferredSupplierId: integer("preferred_supplier_id").references(() => suppliers.id),
  supplierCode: varchar("supplier_code", { length: 100 }),
  manufacturerCode: varchar("manufacturer_code", { length: 100 }),
  
  // Sales Information
  canBeSold: boolean("can_be_sold").default(true),
  canBePurchased: boolean("can_be_purchased").default(true),
  saleDescription: text("sale_description"),
  purchaseDescription: text("purchase_description"),
  
  // Manufacturing
  isManufactured: boolean("is_manufactured").notNull().default(false),
  isConsumable: boolean("is_consumable").notNull().default(false), // Products that don't track stock
  isBom: boolean("is_bom").default(false), // Bill of Materials
  isComponent: boolean("is_component").default(false),
  productionTime: integer("production_time"), // hours
  
  // Images and Media
  imageUrl: varchar("image_url", { length: 1000 }),
  thumbnailUrl: varchar("thumbnail_url", { length: 1000 }),
  gallery: text("gallery").array(), // Additional images
  
  // Performance Metrics
  salesCount: integer("sales_count").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").default(0),
  
  // Status and Control
  isActive: boolean("is_active").notNull().default(true),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  discontinuedAt: timestamp("discontinued_at"),
  
  // Notes
  internalNotes: text("internal_notes"),
  publicNotes: text("public_notes"),
  
  // Warranty and Service
  warrantyDays: integer("warranty_days").default(0),
  hasSerialNumber: boolean("has_serial_number").default(false),
  hasBatchNumber: boolean("has_batch_number").default(false),
  expirationDays: integer("expiration_days"),
  
  // Audit Fields
  companyId: integer("company_id").notNull().references(() => companies.id),
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory Movements
export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  type: varchar("type", { length: 20 }).notNull(), // IN, OUT, ADJUSTMENT
  quantity: integer("quantity").notNull(),
  reason: varchar("reason", { length: 100 }).notNull(),
  notes: text("notes"),
  companyId: integer("company_id").notNull().references(() => companies.id),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull(),
  ncf: varchar("ncf", { length: 20 }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  date: date("date").notNull(),
  dueDate: date("due_date"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  itbis: decimal("itbis", { precision: 10, scale: 2 }).notNull().default("0"),
  selectiveConsumptionTax: decimal("selective_consumption_tax", { precision: 10, scale: 2 }).default("0"),
  otherTaxes: decimal("other_taxes", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, paid, overdue, cancelled
  notes: text("notes"),
  companyId: integer("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice Items
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  productId: integer("product_id").notNull().references(() => products.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxType: varchar("tax_type", { length: 20 }).notNull().default("itbis_18"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("18.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Bill of Materials (BOM) - Lista de materiales para manufactura
export const bom = pgTable("bom", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  materialId: integer("material_id").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }), // Costo por unidad del material
  notes: text("notes"), // Notas sobre el material (ej: "Agregar al final", "Calentar antes")
  companyId: integer("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recetas - Para productos que requieren instrucciones detalladas
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  instructions: text("instructions").notNull(), // Instrucciones paso a paso
  preparationTime: integer("preparation_time"), // Tiempo en minutos
  cookingTime: integer("cooking_time"), // Tiempo de cocción en minutos
  servings: integer("servings"), // Porciones que produce
  difficulty: varchar("difficulty", { length: 20 }).default("medium"), // easy, medium, hard
  companyId: integer("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ingredientes/Materiales para recetas
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id),
  materialId: integer("material_id").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  step: integer("step").default(1), // En qué paso se usa
  isOptional: boolean("is_optional").default(false),
  notes: text("notes"), // Notas específicas del ingrediente
});

// Pasos de producción
export const productionSteps = pgTable("production_steps", {
  id: serial("id").primaryKey(),
  productionOrderId: integer("production_order_id").notNull().references(() => productionOrders.id),
  stepNumber: integer("step_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  estimatedTime: integer("estimated_time"), // Tiempo estimado en minutos
  actualTime: integer("actual_time"), // Tiempo real tomado
  status: varchar("status", { length: 20 }).default("pending"), // pending, in_progress, completed, skipped
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

// Bill of Materials (BOM)
export const billOfMaterials = pgTable("bill_of_materials", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  name: varchar("name", { length: 255 }).notNull(),
  version: varchar("version", { length: 20 }).default("1.0"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  companyId: integer("company_id").notNull().references(() => companies.id),
  createdBy: varchar("created_by", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// BOM Items
export const bomItems = pgTable("bom_items", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").notNull().references(() => billOfMaterials.id, { onDelete: "cascade" }),
  componentId: integer("component_id").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  wastePercentage: decimal("waste_percentage", { precision: 5, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Production Orders
export const productionOrders = pgTable("production_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }),
  number: varchar("number", { length: 50 }).notNull(),
  productId: integer("product_id").notNull().references(() => products.id),
  bomId: integer("bom_id").references(() => billOfMaterials.id),
  quantity: integer("quantity").notNull(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  status: varchar("status", { length: 20 }).notNull().default("planned"), // planned, in_progress, completed, cancelled
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  scheduledDate: date("scheduled_date"),
  plannedStartDate: date("planned_start_date"),
  plannedEndDate: date("planned_end_date"),
  actualStartDate: date("actual_start_date"),
  actualEndDate: date("actual_end_date"),
  notes: text("notes"),
  companyId: integer("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Relations
export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, {
    fields: [companies.ownerId],
    references: [users.id],
  }),
  customers: many(customers),
  // suppliers moved to purchases module
  products: many(products),
  invoices: many(invoices),
  productionOrders: many(productionOrders),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id],
  }),
  invoices: many(invoices),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  company: one(companies, {
    fields: [products.companyId],
    references: [companies.id],
  }),
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  invoiceItems: many(invoiceItems),
  bomItems: many(bom, { relationName: "product_bom" }),
  bomMaterials: many(bom, { relationName: "material_bom" }),
  productionOrders: many(productionOrders),
  inventoryMovements: many(inventoryMovements),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
}));

export const bomRelations = relations(bom, ({ one }) => ({
  product: one(products, {
    fields: [bom.productId],
    references: [products.id],
    relationName: "product_bom",
  }),
  material: one(products, {
    fields: [bom.materialId],
    references: [products.id],
    relationName: "material_bom",
  }),
  company: one(companies, {
    fields: [bom.companyId],
    references: [companies.id],
  }),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  product: one(products, {
    fields: [recipes.productId],
    references: [products.id],
  }),
  company: one(companies, {
    fields: [recipes.companyId],
    references: [companies.id],
  }),
  ingredients: many(recipeIngredients),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  material: one(products, {
    fields: [recipeIngredients.materialId],
    references: [products.id],
  }),
}));

export const productionStepsRelations = relations(productionSteps, ({ one }) => ({
  productionOrder: one(productionOrders, {
    fields: [productionSteps.productionOrderId],
    references: [productionOrders.id],
  }),
}));

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
  registrationStatus: true,
});

// Schema for admin company creation (includes invitation fields)
export const insertCompanySchemaForAdmin = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
  registrationStatus: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.coerce.string(),
  cost: z.coerce.string().optional(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  number: z.string().optional(), // Make invoice number optional for auto-generation
});

export const insertProductionOrderSchema = createInsertSchema(productionOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBOMSchema = createInsertSchema(bom).omit({
  id: true,
  createdAt: true,
});

export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyUserSchema = createInsertSchema(companyUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// POS Sales table with Fiscal Receipt support
export const posSales = pgTable("pos_sales", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  customerId: integer("customer_id").references(() => posCustomers.id),
  sessionId: integer("session_id").references(() => posCashSessions.id),
  stationId: integer("station_id").references(() => posStations.id),
  employeeId: integer("employee_id").references(() => posEmployees.id),
  saleNumber: varchar("sale_number", { length: 50 }).notNull(),
  subtotal: varchar("subtotal").notNull(),
  itbis: varchar("itbis").notNull(),
  total: varchar("total").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  cashReceived: varchar("cash_received"),
  cashChange: varchar("cash_change"),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerRnc: varchar("customer_rnc", { length: 11 }), // Dominican RNC
  customerAddress: text("customer_address"), // Required for fiscal receipts
  // Fiscal Receipt fields
  ncf: varchar("ncf", { length: 20 }), // Comprobante Fiscal
  ncfType: varchar("ncf_type", { length: 3 }), // B01, B02, B04, etc.
  ncfSequence: integer("ncf_sequence"),
  fiscalPeriod: varchar("fiscal_period", { length: 8 }), // YYYYMMDD
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("completed"),
  // Restaurant-specific fields
  orderType: varchar("order_type", { length: 20 }).default("dine_in"), // dine_in, takeout, delivery
  tableNumber: varchar("table_number", { length: 10 }),
  kitchenStatus: varchar("kitchen_status", { length: 20 }).default("pending"), // pending, preparing, ready, served
  preparationNotes: text("preparation_notes"),
  // Audit fields
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// POS Sale Items table
export const posSaleItems = pgTable("pos_sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => posSales.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productCode: varchar("product_code", { length: 50 }).notNull(),
  quantity: varchar("quantity").notNull(),
  unitPrice: varchar("unit_price").notNull(),
  discount: varchar("discount").default("0"),
  subtotal: varchar("subtotal").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// POS Cart Items table for persistent cart storage
export const posCartItems = pgTable("pos_cart_items", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  userId: varchar("user_id").notNull(),
  sessionId: varchar("session_id"),
  stationId: varchar("station_id"),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: varchar("unit_price").notNull(),
  subtotal: varchar("subtotal").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// POS Employees table for multi-user sessions
export const posEmployees = pgTable("pos_employees", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  employeeCode: varchar("employee_code", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  pin: varchar("pin", { length: 6 }).notNull(), // 4-6 digit PIN
  role: varchar("role", { length: 50 }).notNull().default("cashier"), // cashier, supervisor, manager
  permissions: jsonb("permissions").default([]),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// POS Stations table for multi-station support
export const posStations = pgTable("pos_stations", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  stationCode: varchar("station_code", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  currentEmployeeId: integer("current_employee_id").references(() => posEmployees.id),
  currentSessionId: varchar("current_session_id"),
  isActive: boolean("is_active").default(true),
  printerSettings: jsonb("printer_settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// POS Cash Sessions table for cash register sessions
export const posCashSessions = pgTable("pos_cash_sessions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  stationId: integer("station_id").references(() => posStations.id).notNull(),
  employeeId: integer("employee_id").references(() => posEmployees.id).notNull(),
  sessionNumber: varchar("session_number", { length: 50 }).notNull(),
  openingCash: varchar("opening_cash").notNull().default("0"),
  expectedCash: varchar("expected_cash").default("0"),
  actualCash: varchar("actual_cash").default("0"),
  totalSales: varchar("total_sales").default("0"),
  totalTransactions: integer("total_transactions").default(0),
  cashSales: varchar("cash_sales").default("0"),
  cardSales: varchar("card_sales").default("0"),
  transferSales: varchar("transfer_sales").default("0"),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).notNull().default("open"), // open, closed
  openedAt: timestamp("opened_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  closedBy: integer("closed_by").references(() => posEmployees.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// POS Customers table with RNC validation
export const posCustomers = pgTable("pos_customers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  rnc: varchar("rnc", { length: 11 }).notNull(),
  cedula: varchar("cedula", { length: 11 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }),
  sector: varchar("sector", { length: 100 }),
  isValidatedRnc: boolean("is_validated_rnc").default(false),
  rncValidationDate: timestamp("rnc_validation_date"),
  customerType: varchar("customer_type", { length: 20 }).default("individual"), // individual, company
  creditLimit: varchar("credit_limit").default("0"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NCF Sequence Control for Fiscal Receipts
export const ncfSequences = pgTable("ncf_sequences", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  ncfType: varchar("ncf_type", { length: 3 }).notNull(), // B01, B02, B04, etc.
  currentSequence: integer("current_sequence").default(1),
  maxSequence: integer("max_sequence").default(50000000), // DGII limit
  fiscalPeriod: varchar("fiscal_period", { length: 8 }).notNull(), // YYYYMMDD
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Removed duplicate posSessions table - using the one defined above for cash register sessions

// Stock Reservations for cart items
export const stockReservations = pgTable("stock_reservations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  reservedAt: timestamp("reserved_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Auto-expire after 30 minutes
  isReleased: boolean("is_released").default(false),
  releasedAt: timestamp("released_at"),
});

// NCF Sequences table already defined elsewhere in the file

// POS Print Settings table
export const posPrintSettings = pgTable("pos_print_settings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  printerWidth: varchar("printer_width", { length: 10 }).default("80mm"),
  headerText: text("header_text"),
  footerText: text("footer_text"),
  showLogo: boolean("show_logo").default(false),
  showNCF: boolean("show_ncf").default(true),
  showCustomerInfo: boolean("show_customer_info").default(true),
  fontSize: varchar("font_size", { length: 10 }).default("normal"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Chat Messages table
export const aiChatMessages = pgTable("ai_chat_messages", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  context: jsonb("context"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull().default("info"), // info, success, warning, error
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Error Management System
export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  errorId: varchar("error_id", { length: 50 }).notNull().unique(),
  message: text("message").notNull(),
  stack: text("stack").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // frontend, backend, database, api, validation
  severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
  context: text("context").notNull(), // JSON string
  userId: varchar("user_id"),
  companyId: integer("company_id").references(() => companies.id),
  resolved: boolean("resolved").default(false),
  aiAnalysis: text("ai_analysis"),
  suggestedFix: text("suggested_fix"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
});

export const insertPOSSaleSchema = createInsertSchema(posSales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPOSSaleItemSchema = createInsertSchema(posSaleItems).omit({
  id: true,
  createdAt: true,
});

export const insertPOSPrintSettingsSchema = createInsertSchema(posPrintSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPOSCartItemSchema = createInsertSchema(posCartItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Removed old POS session schema - replaced with cash sessions

export const insertStockReservationSchema = createInsertSchema(stockReservations).omit({
  id: true,
  reservedAt: true,
  isReleased: true,
  releasedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

// POS Multi-Station Schema Types
export const insertPOSEmployeeSchema = createInsertSchema(posEmployees).omit({
  id: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPOSStationSchema = createInsertSchema(posStations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPOSCashSessionSchema = createInsertSchema(posCashSessions).omit({
  id: true,
  closedAt: true,
  createdAt: true,
});

export const insertPOSCustomerSchema = createInsertSchema(posCustomers).omit({
  id: true,
  isValidatedRnc: true,
  rncValidationDate: true,
  createdAt: true,
  updatedAt: true,
});

// HR and Payroll Tables
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "set null" }), // User assigned to this employee
  employeeId: varchar("employee_id", { length: 50 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  position: varchar("position", { length: 100 }).notNull(),
  department: varchar("department", { length: 100 }),
  hireDate: timestamp("hire_date").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  salaryType: varchar("salary_type", { length: 20 }).notNull().default("monthly"), // monthly, hourly, weekly
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, terminated
  cedula: varchar("cedula", { length: 20 }), // Dominican ID
  tss: varchar("tss", { length: 20 }), // Social Security Number
  bankAccount: varchar("bank_account", { length: 50 }),
  bankName: varchar("bank_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payrollPeriods = pgTable("payroll_periods", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  periodName: varchar("period_name", { length: 100 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  payDate: timestamp("pay_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, processing, paid, closed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payrollEntries = pgTable("payroll_entries", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  periodId: integer("period_id").notNull().references(() => payrollPeriods.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  hoursWorked: decimal("hours_worked", { precision: 8, scale: 2 }).default("0"),
  overtimeHours: decimal("overtime_hours", { precision: 8, scale: 2 }).default("0"),
  bonuses: decimal("bonuses", { precision: 10, scale: 2 }).default("0"),
  commissions: decimal("commissions", { precision: 10, scale: 2 }).default("0"),
  allowances: decimal("allowances", { precision: 10, scale: 2 }).default("0"),
  grossPay: decimal("gross_pay", { precision: 10, scale: 2 }).notNull(),
  tssDeduction: decimal("tss_deduction", { precision: 10, scale: 2 }).default("0"),
  sfsDeduction: decimal("sfs_deduction", { precision: 10, scale: 2 }).default("0"),
  infotepDeduction: decimal("infotep_deduction", { precision: 10, scale: 2 }).default("0"),
  incomeTaxDeduction: decimal("income_tax_deduction", { precision: 10, scale: 2 }).default("0"),
  otherDeductions: decimal("other_deductions", { precision: 10, scale: 2 }).default("0"),
  totalDeductions: decimal("total_deductions", { precision: 10, scale: 2 }).notNull(),
  netPay: decimal("net_pay", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const timeTracking = pgTable("time_tracking", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  clockIn: timestamp("clock_in"),
  clockOut: timestamp("clock_out"),
  breakStart: timestamp("break_start"),
  breakEnd: timestamp("break_end"),
  hoursWorked: decimal("hours_worked", { precision: 8, scale: 2 }).default("0"),
  overtimeHours: decimal("overtime_hours", { precision: 8, scale: 2 }).default("0"),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  leaveType: varchar("leave_type", { length: 50 }).notNull(), // vacation, sick, personal, maternity, etc.
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  days: integer("days").notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by", { length: 255 }),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  token: varchar("token", { length: 255 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isRecovery: boolean("is_recovery").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// System modules configuration table
export const systemModules = pgTable("system_modules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  displayName: varchar("display_name", { length: 150 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // core, pos, accounting, hr, inventory, etc.
  icon: varchar("icon", { length: 50 }), // Lucide icon name
  version: varchar("version", { length: 20 }).default("1.0.0"),
  isCore: boolean("is_core").default(false), // core modules cannot be disabled
  requiresSubscription: boolean("requires_subscription").default(false),
  subscriptionTiers: text("subscription_tiers").array(), // ['monthly', 'annual']
  dependencies: text("dependencies").array(), // module names this depends on
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company module permissions table
export const companyModules = pgTable("company_modules", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  moduleId: integer("module_id").notNull().references(() => systemModules.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").default(true),
  enabledAt: timestamp("enabled_at").defaultNow(),
  enabledBy: varchar("enabled_by").references(() => users.id),
  disabledAt: timestamp("disabled_at"),
  disabledBy: varchar("disabled_by").references(() => users.id),
  settings: jsonb("settings"), // module-specific configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System configuration for global settings
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).unique().notNull(),
  value: text("value"),
  valueType: varchar("value_type", { length: 20 }).default("string"), // string, number, boolean, json
  category: varchar("category", { length: 50 }).default("general"),
  description: text("description"),
  isEditable: boolean("is_editable").default(true),
  isPublic: boolean("is_public").default(false), // can be accessed by frontend
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// HR and Payroll Insert Schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayrollPeriodSchema = createInsertSchema(payrollPeriods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayrollEntrySchema = createInsertSchema(payrollEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeTrackingSchema = createInsertSchema(timeTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeaveSchema = createInsertSchema(leaves).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Manufacturing schemas
export const insertBillOfMaterialsSchema = createInsertSchema(billOfMaterials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBOMItemSchema = createInsertSchema(bomItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Module Management Insert Schemas
export const insertSystemModuleSchema = createInsertSchema(systemModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyModuleSchema = createInsertSchema(companyModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports for module management
export type SystemModule = typeof systemModules.$inferSelect;
export type InsertSystemModule = z.infer<typeof insertSystemModuleSchema>;

export type CompanyModule = typeof companyModules.$inferSelect;
export type InsertCompanyModule = z.infer<typeof insertCompanyModuleSchema>;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

// API Developer System Tables
export const apiDevelopers = pgTable("api_developers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 255 }),
  description: text("description"),
  apiKey: varchar("api_key", { length: 64 }).unique().notNull(),
  isActive: boolean("is_active").default(true),
  requestsCount: integer("requests_count").default(0),
  lastRequestAt: timestamp("last_request_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const apiRequests = pgTable("api_requests", {
  id: serial("id").primaryKey(),
  developerId: integer("developer_id").notNull().references(() => apiDevelopers.id, { onDelete: "cascade" }),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time"), // in milliseconds
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  requestData: jsonb("request_data"),
  responseData: jsonb("response_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Remove duplicate ncfSequences table as it's already defined above

export const comprobantes605 = pgTable("comprobantes_605", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  rncCedula: varchar("rnc_cedula", { length: 11 }).notNull(),
  tipoIdentificacion: varchar("tipo_identificacion", { length: 1 }).notNull(), // 1=RNC, 2=Cedula
  tipoComprobante: varchar("tipo_comprobante", { length: 2 }).notNull(), // 01, 02, etc.
  ncf: varchar("ncf", { length: 11 }),
  ncfModificado: varchar("ncf_modificado", { length: 11 }),
  fechaComprobante: timestamp("fecha_comprobante").notNull(),
  fechaPago: timestamp("fecha_pago"),
  montoFacturado: decimal("monto_facturado", { precision: 12, scale: 2 }).notNull(),
  itbisFacturado: decimal("itbis_facturado", { precision: 12, scale: 2 }).notNull(),
  itbisRetenido: decimal("itbis_retenido", { precision: 12, scale: 2 }).default("0"),
  itbisPercibido: decimal("itbis_percibido", { precision: 12, scale: 2 }).default("0"),
  retencionRenta: decimal("retencion_renta", { precision: 12, scale: 2 }).default("0"),
  isrPercibido: decimal("isr_percibido", { precision: 12, scale: 2 }).default("0"),
  impuestoSelectivoConsumo: decimal("impuesto_selectivo_consumo", { precision: 12, scale: 2 }).default("0"),
  otrosImpuestos: decimal("otros_impuestos", { precision: 12, scale: 2 }).default("0"),
  montoTotal: decimal("monto_total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentSubmissions = pgTable("payment_submissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  rnc: varchar("rnc", { length: 20 }),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
  bankAccount: varchar("bank_account", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reference: varchar("reference", { length: 100 }).notNull(),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: varchar("processed_by", { length: 255 }),
  adminNotes: text("admin_notes"),
});

// Exchange Rates for Multi-Currency Support
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  currency: varchar("currency", { length: 3 }).notNull(), // ISO 4217 currency code
  rate: decimal("rate", { precision: 15, scale: 8 }).notNull(), // Exchange rate
  baseCurrency: varchar("base_currency", { length: 3 }).notNull().default("DOP"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  isFallback: boolean("is_fallback").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comprobantes606 = pgTable("comprobantes_606", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  rncCedula: varchar("rnc_cedula", { length: 11 }).notNull(),
  tipoIdentificacion: varchar("tipo_identificacion", { length: 1 }).notNull(), // 1=RNC, 2=Cedula
  tipoComprobante: varchar("tipo_comprobante", { length: 2 }).notNull(), // Tipo de bienes y servicios (1-11)
  ncf: varchar("ncf", { length: 13 }), // NCF completo (11 o 13 posiciones)
  ncfModificado: varchar("ncf_modificado", { length: 13 }),
  fechaComprobante: timestamp("fecha_comprobante").notNull(),
  fechaPago: timestamp("fecha_pago"),
  // Campos según formato oficial DGII 606
  montoFacturadoServicios: decimal("monto_facturado_servicios", { precision: 12, scale: 2 }).default("0"),
  montoFacturadoBienes: decimal("monto_facturado_bienes", { precision: 12, scale: 2 }).default("0"),
  montoFacturado: decimal("monto_facturado", { precision: 12, scale: 2 }).notNull(), // Total monto facturado
  itbisFacturado: decimal("itbis_facturado", { precision: 12, scale: 2 }).notNull(),
  itbisRetenido: decimal("itbis_retenido", { precision: 12, scale: 2 }).default("0"),
  itbisProporcionalidad: decimal("itbis_proporcionalidad", { precision: 12, scale: 2 }).default("0"), // Art. 349
  itbisCosto: decimal("itbis_costo", { precision: 12, scale: 2 }).default("0"), // ITBIS llevado al costo
  itbisAdelantar: decimal("itbis_adelantar", { precision: 12, scale: 2 }).default("0"), // ITBIS por adelantar
  itbisPercibido: decimal("itbis_percibido", { precision: 12, scale: 2 }).default("0"),
  tipoRetencionISR: varchar("tipo_retencion_isr", { length: 1 }), // 1-8 según clasificación
  retencionRenta: decimal("retencion_renta", { precision: 12, scale: 2 }).default("0"),
  isrPercibido: decimal("isr_percibido", { precision: 12, scale: 2 }).default("0"),
  impuestoSelectivoConsumo: decimal("impuesto_selectivo_consumo", { precision: 12, scale: 2 }).default("0"),
  otrosImpuestos: decimal("otros_impuestos", { precision: 12, scale: 2 }).default("0"),
  montoPropina: decimal("monto_propina", { precision: 12, scale: 2 }).default("0"), // Propina legal 10%
  formaPago: varchar("forma_pago", { length: 1 }).notNull().default("1"), // 1-7 según clasificación
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comprobantes607 = pgTable("comprobantes_607", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  rncCedula: varchar("rnc_cedula", { length: 11 }).notNull(),
  tipoIdentificacion: varchar("tipo_identificacion", { length: 1 }).notNull(), // 1=RNC, 2=Cedula
  ncf: varchar("ncf", { length: 13 }), // NCF completo (11 o 13 posiciones)
  ncfModificado: varchar("ncf_modificado", { length: 13 }),
  tipoIngresoModificado: varchar("tipo_ingreso_modificado", { length: 2 }),
  fechaComprobante: timestamp("fecha_comprobante").notNull(),
  fechaVencimiento: timestamp("fecha_vencimiento"),
  // Campos según formato oficial DGII 607
  montoFacturado: decimal("monto_facturado", { precision: 12, scale: 2 }).notNull(), // Monto facturado sin impuestos
  itbisFacturado: decimal("itbis_facturado", { precision: 12, scale: 2 }).notNull(),
  itbisRetenido: decimal("itbis_retenido", { precision: 12, scale: 2 }).default("0"), // ITBIS retenido por terceros
  retencionRenta: decimal("retencion_renta", { precision: 12, scale: 2 }).default("0"), // Retención ISR aplicada
  itbisPercibido: decimal("itbis_percibido", { precision: 12, scale: 2 }).default("0"), // ITBIS percibido por la empresa
  propina: decimal("propina", { precision: 12, scale: 2 }).default("0"), // Propina legal (10%)
  // Formas de pago según clasificación DGII
  efectivo: decimal("efectivo", { precision: 12, scale: 2 }).default("0"), // Pagos en efectivo
  cheque: decimal("cheque", { precision: 12, scale: 2 }).default("0"), // Pagos con cheque
  tarjeta: decimal("tarjeta", { precision: 12, scale: 2 }).default("0"), // Pagos con tarjeta
  credito: decimal("credito", { precision: 12, scale: 2 }).default("0"), // Ventas a crédito
  bonos: decimal("bonos", { precision: 12, scale: 2 }).default("0"), // Pagos con bonos
  permuta: decimal("permuta", { precision: 12, scale: 2 }).default("0"), // Operaciones de permuta
  otrasFormas: decimal("otras_formas", { precision: 12, scale: 2 }).default("0"), // Otras formas de pago
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rncRegistry = pgTable("rnc_registry", {
  id: serial("id").primaryKey(),
  rnc: varchar("rnc", { length: 11 }).notNull().unique(),
  razonSocial: text("razon_social").notNull(),
  nombreComercial: text("nombre_comercial"),
  categoria: varchar("categoria", { length: 50 }),
  regimen: varchar("regimen", { length: 50 }),
  estado: varchar("estado", { length: 20 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const dgiiReports = pgTable("dgii_reports", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  tipo: varchar("tipo", { length: 10 }).notNull(), // 606, 607, T-REGISTRO
  periodo: varchar("periodo", { length: 7 }).notNull(), // YYYY-MM
  fechaInicio: date("fecha_inicio").notNull(),
  fechaFin: date("fecha_fin").notNull(),
  numeroRegistros: integer("numero_registros").default(0),
  montoTotal: decimal("monto_total", { precision: 12, scale: 2 }).default("0.00"),
  itbisTotal: decimal("itbis_total", { precision: 12, scale: 2 }).default("0.00"),
  estado: varchar("estado", { length: 20 }).default("pending"), // pending, generated, submitted, accepted, rejected
  checksum: varchar("checksum", { length: 100 }),
  generatedAt: timestamp("generated_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  fileName: varchar("file_name", { length: 255 }),
  filePath: varchar("file_path", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Developer Insert Schemas
export const insertApiDeveloperSchema = createInsertSchema(apiDevelopers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiRequestSchema = createInsertSchema(apiRequests).omit({
  id: true,
  createdAt: true,
});

// API Developer Types
export type ApiDeveloper = typeof apiDevelopers.$inferSelect;
export type InsertApiDeveloper = z.infer<typeof insertApiDeveloperSchema>;
export type ApiRequest = typeof apiRequests.$inferSelect;
export type InsertApiRequest = z.infer<typeof insertApiRequestSchema>;

export const insertComprobante605Schema = createInsertSchema(comprobantes605).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComprobante606Schema = createInsertSchema(comprobantes606).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComprobante607Schema = createInsertSchema(comprobantes607).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRNCRegistrySchema = createInsertSchema(rncRegistry).omit({
  id: true,
  lastUpdated: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type NCFSequence = typeof ncfSequences.$inferSelect;
export const insertNCFSequenceSchema = createInsertSchema(ncfSequences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNCFSequence = z.infer<typeof insertNCFSequenceSchema>;
export type RNCRegistry = typeof rncRegistry.$inferSelect;
export type InsertRNCRegistry = z.infer<typeof insertRNCRegistrySchema>;

// AI Chat Messages types
export type AIChatMessage = typeof aiChatMessages.$inferSelect;
export type InsertAIChatMessage = typeof aiChatMessages.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type CompanyUser = typeof companyUsers.$inferSelect;
export type InsertCompanyUser = z.infer<typeof insertCompanyUserSchema>;
export type POSSale = typeof posSales.$inferSelect;
export type InsertPOSSale = z.infer<typeof insertPOSSaleSchema>;
export type POSSaleItem = typeof posSaleItems.$inferSelect;
export type InsertPOSSaleItem = z.infer<typeof insertPOSSaleItemSchema>;
export type POSCartItem = typeof posCartItems.$inferSelect;
export type InsertPOSCartItem = z.infer<typeof insertPOSCartItemSchema>;
export type POSCashSession = typeof posCashSessions.$inferSelect;
export type InsertPOSCashSession = z.infer<typeof insertPOSCashSessionSchema>;
export type POSEmployee = typeof posEmployees.$inferSelect;
export type InsertPOSEmployee = z.infer<typeof insertPOSEmployeeSchema>;
export type POSStation = typeof posStations.$inferSelect;
export type InsertPOSStation = z.infer<typeof insertPOSStationSchema>;
export type POSCustomer = typeof posCustomers.$inferSelect;
export type InsertPOSCustomer = z.infer<typeof insertPOSCustomerSchema>;
export type StockReservation = typeof stockReservations.$inferSelect;
export type InsertStockReservation = z.infer<typeof insertStockReservationSchema>;
export type POSPrintSettings = typeof posPrintSettings.$inferSelect;
export type InsertPOSPrintSettings = z.infer<typeof insertPOSPrintSettingsSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type InsertPayrollPeriod = z.infer<typeof insertPayrollPeriodSchema>;
export type PayrollEntry = typeof payrollEntries.$inferSelect;
export type InsertPayrollEntry = z.infer<typeof insertPayrollEntrySchema>;
export type TimeTracking = typeof timeTracking.$inferSelect;
export type InsertTimeTracking = z.infer<typeof insertTimeTrackingSchema>;
export type Leave = typeof leaves.$inferSelect;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;
export type BillOfMaterials = typeof billOfMaterials.$inferSelect;
export type InsertBillOfMaterials = z.infer<typeof insertBillOfMaterialsSchema>;
export type BOMItem = typeof bomItems.$inferSelect;
export type InsertBOMItem = z.infer<typeof insertBOMItemSchema>;
export type Comprobante605 = typeof comprobantes605.$inferSelect;
export type InsertComprobante605 = z.infer<typeof insertComprobante605Schema>;
export type Comprobante606 = typeof comprobantes606.$inferSelect;
export type InsertComprobante606 = z.infer<typeof insertComprobante606Schema>;
export type Comprobante607 = typeof comprobantes607.$inferSelect;
export type InsertComprobante607 = z.infer<typeof insertComprobante607Schema>;

// Chat Channels
export const chatChannels = pgTable("chat_channels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull().default("public"), // public, private, direct
  companyId: integer("company_id").notNull().references(() => companies.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat Channel Members
export const chatChannelMembers = pgTable("chat_channel_members", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => chatChannels.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role", { length: 20 }).default("member"), // admin, member
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadAt: timestamp("last_read_at"),
});

// Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => chatChannels.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"), // text, file, image, system
  fileUrl: text("file_url"),
  fileName: varchar("file_name", { length: 255 }),
  replyToId: integer("reply_to_id"),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Message Reactions
export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => chatMessages.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Permissions
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  module: varchar("module", { length: 50 }).notNull(), // sales, inventory, manufacturing, etc.
  permissions: text("permissions").array().notNull(), // [read, write, delete, admin]
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  action: varchar("action", { length: 100 }).notNull(),
  module: varchar("module", { length: 50 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: varchar("resource_id", { length: 50 }),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Roles
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  companyId: integer("company_id").notNull().references(() => companies.id),
  permissions: jsonb("permissions").notNull(), // JSON object with module permissions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Role Assignments
export const userRoleAssignments = pgTable("user_role_assignments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  roleId: integer("role_id").notNull().references(() => userRoles.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  assignedBy: varchar("assigned_by").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// ACCOUNTING MODULE - Complete accounting cycle management

// Chart of Accounts - Plan de Cuentas
export const accountTypes = pgTable("account_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // Activo, Pasivo, Patrimonio, Ingresos, Gastos
  code: varchar("code", { length: 10 }).notNull().unique(),
  description: text("description"),
  normalBalance: varchar("normal_balance", { length: 10 }).notNull(), // DEBIT or CREDIT
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  code: varchar("code", { length: 6 }).notNull(), // DGII standard 6-digit format
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  accountTypeId: integer("account_type_id").references(() => accountTypes.id),
  parentAccountId: integer("parent_account_id"),
  level: integer("level").default(1),
  isParent: boolean("is_parent").default(false),
  allowTransactions: boolean("allow_transactions").default(true),
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).default("0.00"),

  category: varchar("category", { length: 20 }).notNull(), // ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO
  subcategory: varchar("subcategory", { length: 50 }), // Corriente, No Corriente, etc.
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// General Ledger - Libro Mayor
export const journals = pgTable("journals", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  description: text("description"),
  journalType: varchar("journal_type", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Journal Entries - Asientos Contables
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  journalId: integer("journal_id").references(() => journals.id),
  entryNumber: varchar("entry_number", { length: 50 }).notNull(),
  reference: varchar("reference", { length: 100 }),
  description: text("description").notNull(),
  date: date("date").notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  totalDebit: decimal("total_debit", { precision: 15, scale: 2 }).default("0.00"),
  totalCredit: decimal("total_credit", { precision: 15, scale: 2 }).default("0.00"),
  status: varchar("status", { length: 20 }).default("draft"),
  sourceModule: varchar("source_module", { length: 50 }),
  sourceId: integer("source_id"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Journal Entry Lines - Líneas de Asientos
export const journalEntryLines = pgTable("journal_entry_lines", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").notNull().references(() => journalEntries.id),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  description: text("description"),
  debitAmount: decimal("debit_amount", { precision: 15, scale: 2 }).default("0.00"),
  creditAmount: decimal("credit_amount", { precision: 15, scale: 2 }).default("0.00"),
  lineNumber: integer("line_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fiscal Periods - Períodos Fiscales
export const fiscalPeriods = pgTable("fiscal_periods", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: varchar("name", { length: 100 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isClosed: boolean("is_closed").default(false),
  closedBy: varchar("closed_by").references(() => users.id),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial Reports Configuration
export const reportTemplates = pgTable("report_templates", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // balance_sheet, income_statement, cash_flow
  template: jsonb("template").notNull(), // Report structure and accounts
  isDefault: boolean("is_default").default(false),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget Planning
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: varchar("name", { length: 100 }).notNull(),
  fiscalPeriodId: integer("fiscal_period_id").notNull().references(() => fiscalPeriods.id),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("draft"), // draft, approved, active
  totalBudget: decimal("total_budget", { precision: 15, scale: 2 }),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const budgetLines = pgTable("budget_lines", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").notNull().references(() => budgets.id),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  budgetedAmount: decimal("budgeted_amount", { precision: 15, scale: 2 }).notNull(),
  actualAmount: decimal("actual_amount", { precision: 15, scale: 2 }).default("0.00"),
  variance: decimal("variance", { precision: 15, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cost Centers
export const costCenters = pgTable("cost_centers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  managerId: varchar("manager_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Automatic Journal Entry Templates for POS Integration
export const autoJournalTemplates = pgTable("auto_journal_templates", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: varchar("name", { length: 100 }).notNull(),
  triggerEvent: varchar("trigger_event", { length: 50 }).notNull(), // pos_sale, invoice_payment, etc.
  description: text("description"),
  template: jsonb("template").notNull(), // Account mappings and rules
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Módulo de compras movido a shared/purchases-schema.ts

// Chat Channel Relations
export const chatChannelRelations = relations(chatChannels, ({ one, many }) => ({
  company: one(companies, {
    fields: [chatChannels.companyId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [chatChannels.createdBy],
    references: [users.id],
  }),
  members: many(chatChannelMembers),
  messages: many(chatMessages),
}));

export const chatChannelMemberRelations = relations(chatChannelMembers, ({ one }) => ({
  channel: one(chatChannels, {
    fields: [chatChannelMembers.channelId],
    references: [chatChannels.id],
  }),
  user: one(users, {
    fields: [chatChannelMembers.userId],
    references: [users.id],
  }),
}));

export const chatMessageRelations = relations(chatMessages, ({ one, many }) => ({
  channel: one(chatChannels, {
    fields: [chatMessages.channelId],
    references: [chatChannels.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
  replyTo: one(chatMessages, {
    fields: [chatMessages.replyToId],
    references: [chatMessages.id],
  }),
  reactions: many(messageReactions),
}));

export const messageReactionRelations = relations(messageReactions, ({ one }) => ({
  message: one(chatMessages, {
    fields: [messageReactions.messageId],
    references: [chatMessages.id],
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id],
  }),
}));

export const userPermissionRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [userPermissions.companyId],
    references: [companies.id],
  }),
}));

export const activityLogRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [activityLogs.companyId],
    references: [companies.id],
  }),
}));

export const userRoleRelations = relations(userRoles, ({ one, many }) => ({
  company: one(companies, {
    fields: [userRoles.companyId],
    references: [companies.id],
  }),
  assignments: many(userRoleAssignments),
}));

export const userRoleAssignmentRelations = relations(userRoleAssignments, ({ one }) => ({
  user: one(users, {
    fields: [userRoleAssignments.userId],
    references: [users.id],
  }),
  role: one(userRoles, {
    fields: [userRoleAssignments.roleId],
    references: [userRoles.id],
  }),
  company: one(companies, {
    fields: [userRoleAssignments.companyId],
    references: [companies.id],
  }),
  assignedBy: one(users, {
    fields: [userRoleAssignments.assignedBy],
    references: [users.id],
  }),
}));

// Schema exports for chat system
export const insertChatChannelSchema = createInsertSchema(chatChannels);
export const insertChatChannelMemberSchema = createInsertSchema(chatChannelMembers);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertMessageReactionSchema = createInsertSchema(messageReactions);
export const insertUserPermissionSchema = createInsertSchema(userPermissions);
export const insertActivityLogSchema = createInsertSchema(activityLogs);
export const insertUserRoleSchema = createInsertSchema(userRoles);
export const insertUserRoleAssignmentSchema = createInsertSchema(userRoleAssignments);

export type ChatChannel = typeof chatChannels.$inferSelect;
export type InsertChatChannel = z.infer<typeof insertChatChannelSchema>;
export type ChatChannelMember = typeof chatChannelMembers.$inferSelect;
export type InsertChatChannelMember = z.infer<typeof insertChatChannelMemberSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;
export type InsertUserRoleAssignment = z.infer<typeof insertUserRoleAssignmentSchema>;

// Manufacturing Module Types
export type ProductionOrder = typeof productionOrders.$inferSelect;
export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;
export type BOM = typeof bom.$inferSelect & {
  material?: {
    id: number;
    name: string;
    code: string;
    price: string;
    unit: string;
    stock: string;
  };
};
export type InsertBOM = z.infer<typeof insertBOMSchema>;

// ACCOUNTING MODULE RELATIONS
export const accountTypesRelations = relations(accountTypes, ({ many }) => ({
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  accountType: one(accountTypes, {
    fields: [accounts.accountTypeId],
    references: [accountTypes.id],
  }),
  company: one(companies, {
    fields: [accounts.companyId],
    references: [companies.id],
  }),
  parentAccount: one(accounts, {
    fields: [accounts.parentAccountId],
    references: [accounts.id],
  }),
  childAccounts: many(accounts),
}));

export const journalsRelations = relations(journals, ({ one, many }) => ({
  company: one(companies, {
    fields: [journals.companyId],
    references: [companies.id],
  }),
  journalEntries: many(journalEntries),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  company: one(companies, {
    fields: [journalEntries.companyId],
    references: [companies.id],
  }),
  journal: one(journals, {
    fields: [journalEntries.journalId],
    references: [journals.id],
  }),
  createdByUser: one(users, {
    fields: [journalEntries.createdBy],
    references: [users.id],
  }),
  lines: many(journalEntryLines),
}));

export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalEntryLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [journalEntryLines.accountId],
    references: [accounts.id],
  }),
}));

export const fiscalPeriodsRelations = relations(fiscalPeriods, ({ one, many }) => ({
  company: one(companies, {
    fields: [fiscalPeriods.companyId],
    references: [companies.id],
  }),
  closedByUser: one(users, {
    fields: [fiscalPeriods.closedBy],
    references: [users.id],
  }),
  budgets: many(budgets),
}));

export const reportTemplatesRelations = relations(reportTemplates, ({ one }) => ({
  company: one(companies, {
    fields: [reportTemplates.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [reportTemplates.createdBy],
    references: [users.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  company: one(companies, {
    fields: [budgets.companyId],
    references: [companies.id],
  }),
  fiscalPeriod: one(fiscalPeriods, {
    fields: [budgets.fiscalPeriodId],
    references: [fiscalPeriods.id],
  }),
  createdByUser: one(users, {
    fields: [budgets.createdBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [budgets.approvedBy],
    references: [users.id],
  }),
  budgetLines: many(budgetLines),
}));

export const budgetLinesRelations = relations(budgetLines, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetLines.budgetId],
    references: [budgets.id],
  }),
  account: one(accounts, {
    fields: [budgetLines.accountId],
    references: [accounts.id],
  }),
}));

export const costCentersRelations = relations(costCenters, ({ one }) => ({
  company: one(companies, {
    fields: [costCenters.companyId],
    references: [companies.id],
  }),
  manager: one(users, {
    fields: [costCenters.managerId],
    references: [users.id],
  }),
}));

export const autoJournalTemplatesRelations = relations(autoJournalTemplates, ({ one }) => ({
  company: one(companies, {
    fields: [autoJournalTemplates.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [autoJournalTemplates.createdBy],
    references: [users.id],
  }),
}));

// ACCOUNTING MODULE SCHEMAS
export const insertAccountTypeSchema = createInsertSchema(accountTypes);
export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  currentBalance: true,
  createdAt: true,
  updatedAt: true,
});
export const insertJournalSchema = createInsertSchema(journals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  entryNumber: true,
  createdAt: true,
  updatedAt: true,
});
export const insertJournalEntryLineSchema = createInsertSchema(journalEntryLines).omit({
  id: true,
  createdAt: true,
});
export const insertFiscalPeriodSchema = createInsertSchema(fiscalPeriods).omit({
  id: true,
  closedBy: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
});
export const insertReportTemplateSchema = createInsertSchema(reportTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});
export const insertBudgetLineSchema = createInsertSchema(budgetLines).omit({
  id: true,
  actualAmount: true,
  variance: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCostCenterSchema = createInsertSchema(costCenters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertAutoJournalTemplateSchema = createInsertSchema(autoJournalTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ACCOUNTING MODULE TYPES
export type AccountType = typeof accountTypes.$inferSelect;
export type InsertAccountType = z.infer<typeof insertAccountTypeSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Journal = typeof journals.$inferSelect;
export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntryLine = typeof journalEntryLines.$inferSelect;
export type InsertJournalEntryLine = z.infer<typeof insertJournalEntryLineSchema>;
export type FiscalPeriod = typeof fiscalPeriods.$inferSelect;
export type InsertFiscalPeriod = z.infer<typeof insertFiscalPeriodSchema>;
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type BudgetLine = typeof budgetLines.$inferSelect;
export type InsertBudgetLine = z.infer<typeof insertBudgetLineSchema>;
export type CostCenter = typeof costCenters.$inferSelect;
export type InsertCostCenter = z.infer<typeof insertCostCenterSchema>;
export type AutoJournalTemplate = typeof autoJournalTemplates.$inferSelect;
export type InsertAutoJournalTemplate = z.infer<typeof insertAutoJournalTemplateSchema>;

// Exchange Rate schema
export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
  createdAt: true,
});
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type ExchangeRate = typeof exchangeRates.$inferSelect;

// Tipos del módulo de compras movidos a shared/purchases-schema.ts

// Support Documents - Documentos de Soporte para Asientos
export const supportDocuments = pgTable("support_documents", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").notNull().references(() => journalEntries.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 50 }), // PDF, image, etc.
  fileSize: integer("file_size"),
  documentType: varchar("document_type", { length: 50 }), // FACTURA, RECIBO, NCF, etc.
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Financial Reports - Reportes Financieros
export const financialReports = pgTable("financial_reports", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  reportType: varchar("report_type", { length: 50 }).notNull(), // BALANCE_GENERAL, ESTADO_RESULTADOS, FLUJO_EFECTIVO
  reportName: varchar("report_name", { length: 200 }).notNull(),
  periodo: varchar("periodo", { length: 7 }).notNull(), // YYYY-MM
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reportData: jsonb("report_data"), // Store calculated report data
  fileName: varchar("file_name", { length: 255 }),
  filePath: varchar("file_path", { length: 500 }),
  generatedBy: varchar("generated_by").notNull().references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// DGII Compliance - Cumplimiento DGII
export const dgiiCompliance = pgTable("dgii_compliance", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  transactionId: integer("transaction_id"), // Reference to POS sale, purchase, etc.
  transactionType: varchar("transaction_type", { length: 50 }), // VENTA, COMPRA, NOMINA
  ncf: varchar("ncf", { length: 19 }),
  itbisAmount: decimal("itbis_amount", { precision: 12, scale: 2 }).default("0.00"),
  itbisRate: decimal("itbis_rate", { precision: 5, scale: 4 }).default("0.18"), // 18%
  retentionAmount: decimal("retention_amount", { precision: 12, scale: 2 }).default("0.00"),
  retentionType: varchar("retention_type", { length: 50 }), // ISR, ITBIS_RET
  reportPeriod: varchar("report_period", { length: 7 }), // YYYY-MM for DGII reports
  isReported: boolean("is_reported").default(false),
  reportedAt: timestamp("reported_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// DGII Chart of Accounts - Plan de Cuentas Oficial DGII
export const dgiiChartOfAccounts = pgTable("dgii_chart_of_accounts", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 6 }).notNull().unique(), // DGII official 6-digit code
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 20 }).notNull(), // ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO
  subcategory: varchar("subcategory", { length: 50 }),
  level: integer("level").notNull(),
  parentCode: varchar("parent_code", { length: 6 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schema for new tables
export const insertSupportDocumentSchema = createInsertSchema(supportDocuments).omit({
  id: true,
  uploadedAt: true,
});

export const insertFinancialReportSchema = createInsertSchema(financialReports).omit({
  id: true,
  generatedAt: true,
});

export const insertDgiiComplianceSchema = createInsertSchema(dgiiCompliance).omit({
  id: true,
  createdAt: true,
});

// Types for new tables
export type SupportDocument = typeof supportDocuments.$inferSelect;
export type InsertSupportDocument = z.infer<typeof insertSupportDocumentSchema>;
export type FinancialReport = typeof financialReports.$inferSelect;
export type InsertFinancialReport = z.infer<typeof insertFinancialReportSchema>;
export type DgiiCompliance = typeof dgiiCompliance.$inferSelect;
export type InsertDgiiCompliance = z.infer<typeof insertDgiiComplianceSchema>;
export type DgiiChartOfAccount = typeof dgiiChartOfAccounts.$inferSelect;

// Import notifications schema
export * from "./notifications-schema";
