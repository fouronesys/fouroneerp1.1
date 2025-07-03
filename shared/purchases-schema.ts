import {
  pgTable,
  text,
  varchar,
  timestamp,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { companies, users, products } from "./schema";

// === MÓDULO DE COMPRAS ===

// Suppliers (Proveedores)
export const purchaseSuppliers = pgTable("purchase_suppliers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  businessName: varchar("business_name", { length: 255 }),
  rnc: varchar("rnc", { length: 20 }),
  cedula: varchar("cedula", { length: 20 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  mobile: varchar("mobile", { length: 20 }),
  website: varchar("website", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("República Dominicana"),
  paymentTerms: varchar("payment_terms", { length: 100 }), // 30 días, contado, etc.
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).default("0"),
  category: varchar("category", { length: 100 }), // Servicios, Materiales, Equipos, etc.
  taxId: varchar("tax_id", { length: 50 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase Orders (Órdenes de Compra)
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  supplierId: integer("supplier_id").notNull().references(() => purchaseSuppliers.id),
  orderDate: date("order_date").notNull(),
  expectedDeliveryDate: date("expected_delivery_date"),
  status: varchar("status", { length: 20 }).default("draft"), // draft, sent, confirmed, received, cancelled
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("DOP"),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  deliveryAddress: text("delivery_address"),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase Order Items
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").notNull().references(() => purchaseOrders.id),
  productId: integer("product_id").references(() => products.id),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  receivedQuantity: decimal("received_quantity", { precision: 10, scale: 2 }).default("0"),
  unit: varchar("unit", { length: 20 }).default("unidad"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchase Invoices (Facturas de Compra)
export const purchaseInvoices = pgTable("purchase_invoices", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  supplierInvoiceNumber: varchar("supplier_invoice_number", { length: 50 }).notNull(),
  supplierId: integer("supplier_id").notNull().references(() => purchaseSuppliers.id),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date"),
  ncf: varchar("ncf", { length: 20 }), // Número de Comprobante Fiscal
  ncfType: varchar("ncf_type", { length: 10 }), // B01, B02, B03, B04, etc.
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  itbisAmount: decimal("itbis_amount", { precision: 12, scale: 2 }).default("0"),
  withholdingAmount: decimal("withholding_amount", { precision: 12, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("DOP"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }).default("1"),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending, partial, paid, overdue
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0"),
  type: varchar("type", { length: 20 }).default("goods"), // goods, services, expenses
  category: varchar("category", { length: 100 }), // Para clasificar gastos
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase Invoice Items
export const purchaseInvoiceItems = pgTable("purchase_invoice_items", {
  id: serial("id").primaryKey(),
  purchaseInvoiceId: integer("purchase_invoice_id").notNull().references(() => purchaseInvoices.id),
  productId: integer("product_id").references(() => products.id),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("18"), // % ITBIS
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  unit: varchar("unit", { length: 20 }).default("unidad"),
  accountCode: varchar("account_code", { length: 20 }), // Código contable
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchase Payments (Pagos a Proveedores)
export const purchasePayments = pgTable("purchase_payments", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  paymentNumber: varchar("payment_number", { length: 50 }).notNull(),
  supplierId: integer("supplier_id").notNull().references(() => purchaseSuppliers.id),
  purchaseInvoiceId: integer("purchase_invoice_id").references(() => purchaseInvoices.id),
  paymentDate: date("payment_date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // transferencia, cheque, efectivo, etc.
  bankAccount: varchar("bank_account", { length: 100 }),
  checkNumber: varchar("check_number", { length: 50 }),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("completed"), // pending, completed, cancelled
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const purchaseSuppliersRelations = relations(purchaseSuppliers, ({ one, many }) => ({
  company: one(companies, {
    fields: [purchaseSuppliers.companyId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [purchaseSuppliers.createdBy],
    references: [users.id],
  }),
  purchaseOrders: many(purchaseOrders),
  purchaseInvoices: many(purchaseInvoices),
  purchasePayments: many(purchasePayments),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  company: one(companies, {
    fields: [purchaseOrders.companyId],
    references: [companies.id],
  }),
  supplier: one(purchaseSuppliers, {
    fields: [purchaseOrders.supplierId],
    references: [purchaseSuppliers.id],
  }),
  createdBy: one(users, {
    fields: [purchaseOrders.createdBy],
    references: [users.id],
  }),
  items: many(purchaseOrderItems),
  invoices: many(purchaseInvoices),
}));

export const purchaseInvoicesRelations = relations(purchaseInvoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [purchaseInvoices.companyId],
    references: [companies.id],
  }),
  supplier: one(purchaseSuppliers, {
    fields: [purchaseInvoices.supplierId],
    references: [purchaseSuppliers.id],
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseInvoices.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  createdBy: one(users, {
    fields: [purchaseInvoices.createdBy],
    references: [users.id],
  }),
  items: many(purchaseInvoiceItems),
  payments: many(purchasePayments),
}));

// === SCHEMAS PARA VALIDACIÓN ===

// Purchase Suppliers
export const insertPurchaseSupplierSchema = createInsertSchema(purchaseSuppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Purchase Orders
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true,
  createdAt: true,
});

// Purchase Invoices
export const insertPurchaseInvoiceSchema = createInsertSchema(purchaseInvoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseInvoiceItemSchema = createInsertSchema(purchaseInvoiceItems).omit({
  id: true,
  createdAt: true,
});

// Purchase Payments
export const insertPurchasePaymentSchema = createInsertSchema(purchasePayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// === TIPOS TYPESCRIPT ===

// Purchase Suppliers
export type PurchaseSupplier = typeof purchaseSuppliers.$inferSelect;
export type InsertPurchaseSupplier = z.infer<typeof insertPurchaseSupplierSchema>;

// Purchase Orders
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;

// Purchase Invoices
export type PurchaseInvoice = typeof purchaseInvoices.$inferSelect;
export type InsertPurchaseInvoice = z.infer<typeof insertPurchaseInvoiceSchema>;
export type PurchaseInvoiceItem = typeof purchaseInvoiceItems.$inferSelect;
export type InsertPurchaseInvoiceItem = z.infer<typeof insertPurchaseInvoiceItemSchema>;

// Purchase Payments
export type PurchasePayment = typeof purchasePayments.$inferSelect;
export type InsertPurchasePayment = z.infer<typeof insertPurchasePaymentSchema>;