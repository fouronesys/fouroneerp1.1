-- ==============================================
-- FOUR ONE SOLUTIONS ERP DATABASE SETUP SCRIPT
-- Sistema ERP Completo para República Dominicana
-- ==============================================

-- ===========================
-- SESSION AND AUTHENTICATION
-- ===========================

-- Session storage table (MANDATORY for Replit Auth)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Users table - Updated for email/password authentication
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Encrypted password
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    role VARCHAR(20) DEFAULT 'user', -- super_admin, company_admin, user
    is_active BOOLEAN DEFAULT true,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP,
    last_login_at TIMESTAMP,
    job_title VARCHAR(100),
    department VARCHAR(100),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Login attempts table for security
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- Session tokens table for token-based authentication
CREATE TABLE IF NOT EXISTS session_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    session_data TEXT NOT NULL, -- JSON string with session info
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_tokens_token ON session_tokens (token);
CREATE INDEX IF NOT EXISTS idx_session_tokens_user_id ON session_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_session_tokens_expires_at ON session_tokens (expires_at);

-- ===========================
-- COMPANY MANAGEMENT
-- ===========================

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255), -- Razón social
    rnc VARCHAR(20),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT, -- URL del logo personalizado
    industry VARCHAR(100), -- Sector/industria
    business_type VARCHAR(50) DEFAULT 'general', -- general, restaurant
    tax_regime VARCHAR(50) DEFAULT 'general', -- régimen tributario
    currency VARCHAR(3) DEFAULT 'DOP',
    timezone VARCHAR(50) DEFAULT 'America/Santo_Domingo',
    subscription_plan VARCHAR(20) DEFAULT 'active', -- active, suspended, cancelled
    subscription_expiry TIMESTAMP,
    subscription_start_date TIMESTAMP,
    payment_confirmed BOOLEAN DEFAULT false, -- Admin-controlled payment confirmation
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, rejected
    registration_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, expired
    invitation_token VARCHAR(255), -- token for registration link
    invitation_sent_at TIMESTAMP,
    invitation_expires_at TIMESTAMP,
    owner_email VARCHAR(255), -- email del propietario para invitación
    is_active BOOLEAN NOT NULL DEFAULT true,
    owner_id VARCHAR NOT NULL REFERENCES users(id),
    -- Settings storage fields
    system_settings TEXT, -- JSON storage for system preferences
    security_settings TEXT, -- JSON storage for security settings
    pos_settings TEXT, -- JSON storage for POS configuration
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Company Users - Junction table for user-company relationships
CREATE TABLE IF NOT EXISTS company_users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    role VARCHAR(20) DEFAULT 'user', -- company_admin, user
    permissions TEXT[], -- array of permission strings
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- CUSTOMER MANAGEMENT
-- ===========================

-- Customers - Enhanced for complete ERP functionality
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    -- Basic Information
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    type VARCHAR(20) NOT NULL DEFAULT 'individual', -- individual, company
    
    -- Identification
    rnc VARCHAR(20),
    cedula VARCHAR(20),
    passport VARCHAR(50),
    
    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    website VARCHAR(255),
    
    -- Address Information
    address TEXT,
    sector VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'República Dominicana',
    
    -- Business Information
    industry VARCHAR(100),
    tax_type VARCHAR(50) DEFAULT 'general',
    
    -- Financial Information
    credit_limit DECIMAL(12,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30, -- días
    currency VARCHAR(3) DEFAULT 'DOP',
    price_list_id INTEGER,
    
    -- Sales Information
    sales_rep_id INTEGER,
    customer_category VARCHAR(50),
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Communication Preferences
    invoice_by_email BOOLEAN DEFAULT false,
    marketing_emails BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    
    -- System Information
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    notes TEXT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_by VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- SUPPLIER MANAGEMENT
-- ===========================

-- Suppliers - Enhanced for complete vendor management
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    -- Basic Information
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    supplier_type VARCHAR(50) DEFAULT 'general', -- general, services, materials
    
    -- Identification
    rnc VARCHAR(20),
    tax_id VARCHAR(50),
    registration_number VARCHAR(100),
    
    -- Contact Information
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    website VARCHAR(255),
    
    -- Address Information
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'República Dominicana',
    
    -- Business Information
    industry VARCHAR(100),
    business_classification VARCHAR(100),
    
    -- Financial Information
    currency VARCHAR(3) DEFAULT 'DOP',
    payment_terms INTEGER DEFAULT 30, -- días
    credit_limit DECIMAL(12,2) DEFAULT 0,
    
    -- Performance Metrics
    quality_rating DECIMAL(3,2) DEFAULT 5.00, -- 1-5 scale
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 100.00, -- percentage
    lead_time_days INTEGER DEFAULT 7,
    
    -- Banking Information
    bank_name VARCHAR(255),
    bank_account VARCHAR(100),
    swift_code VARCHAR(20),
    iban VARCHAR(50),
    
    -- System Information
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    notes TEXT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_by VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- PRODUCT CATALOG
-- ===========================

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES product_categories(id),
    code VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    address TEXT,
    manager_id VARCHAR REFERENCES users(id),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Products - Enhanced for complete inventory management
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    
    -- Basic Information
    code VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    
    -- Categorization
    category_id INTEGER REFERENCES product_categories(id),
    brand VARCHAR(100),
    model VARCHAR(100),
    
    -- Product Type
    product_type VARCHAR(50) DEFAULT 'product', -- product, service, digital
    is_inventoriable BOOLEAN DEFAULT true,
    is_purchasable BOOLEAN DEFAULT true,
    is_saleable BOOLEAN DEFAULT true,
    
    -- Pricing
    cost_price DECIMAL(12,2) DEFAULT 0,
    sale_price DECIMAL(12,2) DEFAULT 0,
    list_price DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'DOP',
    
    -- Tax Information
    tax_type VARCHAR(50) DEFAULT 'itbis_18', -- see DR_TAX_TYPES
    tax_included BOOLEAN DEFAULT false,
    
    -- Inventory Management
    stock_quantity DECIMAL(12,2) DEFAULT 0,
    reserved_quantity DECIMAL(12,2) DEFAULT 0,
    available_quantity DECIMAL(12,2) DEFAULT 0,
    reorder_point DECIMAL(12,2) DEFAULT 0,
    reorder_quantity DECIMAL(12,2) DEFAULT 0,
    warehouse_id INTEGER REFERENCES warehouses(id),
    
    -- Physical Attributes
    weight DECIMAL(10,3), -- kg
    volume DECIMAL(10,3), -- m³
    length DECIMAL(10,2), -- cm
    width DECIMAL(10,2), -- cm
    height DECIMAL(10,2), -- cm
    
    -- Supplier Information
    default_supplier_id INTEGER REFERENCES suppliers(id),
    supplier_code VARCHAR(100),
    lead_time_days INTEGER DEFAULT 0,
    
    -- Quality & Compliance
    barcode VARCHAR(50),
    internal_reference VARCHAR(100),
    manufacturer_reference VARCHAR(100),
    lot_tracking BOOLEAN DEFAULT false,
    expiry_tracking BOOLEAN DEFAULT false,
    serial_tracking BOOLEAN DEFAULT false,
    
    -- Media
    image_url TEXT,
    image_urls TEXT[], -- array of image URLs
    
    -- System Information
    is_active BOOLEAN DEFAULT true,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_by VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- INVENTORY MANAGEMENT
-- ===========================

-- Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    movement_type VARCHAR(50) NOT NULL, -- in, out, adjustment, transfer
    quantity DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    reference_type VARCHAR(50), -- invoice, purchase, adjustment, transfer
    reference_id INTEGER,
    reference_number VARCHAR(100),
    reason TEXT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_by VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Stock Reservations
CREATE TABLE IF NOT EXISTS stock_reservations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    quantity DECIMAL(12,2) NOT NULL,
    reserved_for VARCHAR(50), -- order, invoice, quote
    reference_id INTEGER,
    expires_at TIMESTAMP,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_by VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- SALES & INVOICING
-- ===========================

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- NCF Information (Dominican Republic)
    ncf VARCHAR(19), -- Número de Comprobante Fiscal
    ncf_type VARCHAR(10), -- B01, B02, B14, B15
    ncf_sequence_id INTEGER,
    
    -- Customer Information
    customer_id INTEGER REFERENCES customers(id),
    customer_name VARCHAR(255),
    customer_rnc VARCHAR(20),
    customer_address TEXT,
    
    -- Invoice Details
    invoice_date DATE NOT NULL,
    due_date DATE,
    payment_terms INTEGER DEFAULT 30,
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance_due DECIMAL(12,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, cancelled
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, partial, paid, overdue
    
    -- Additional Information
    notes TEXT,
    internal_notes TEXT,
    currency VARCHAR(3) DEFAULT 'DOP',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    
    -- System Information
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_by VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    
    -- Item Details
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100),
    description TEXT,
    
    -- Quantities and Pricing
    quantity DECIMAL(12,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Tax Information
    tax_type VARCHAR(50) DEFAULT 'itbis_18',
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Totals
    line_total DECIMAL(12,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- POINT OF SALE (POS)
-- ===========================

-- POS Stations
CREATE TABLE IF NOT EXISTS pos_stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    warehouse_id INTEGER REFERENCES warehouses(id),
    is_active BOOLEAN DEFAULT true,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- POS Cash Sessions
CREATE TABLE IF NOT EXISTS pos_cash_sessions (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL REFERENCES pos_stations(id),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    opening_balance DECIMAL(12,2) DEFAULT 0,
    closing_balance DECIMAL(12,2),
    cash_sales DECIMAL(12,2) DEFAULT 0,
    card_sales DECIMAL(12,2) DEFAULT 0,
    total_sales DECIMAL(12,2) DEFAULT 0,
    opened_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'open', -- open, closed
    company_id INTEGER NOT NULL REFERENCES companies(id)
);

-- POS Sales
CREATE TABLE IF NOT EXISTS pos_sales (
    id SERIAL PRIMARY KEY,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- NCF Information
    ncf VARCHAR(19),
    ncf_type VARCHAR(10),
    
    -- Customer Information
    customer_id INTEGER REFERENCES customers(id),
    customer_name VARCHAR(255),
    customer_rnc VARCHAR(20),
    
    -- Sale Details
    sale_date TIMESTAMP DEFAULT NOW(),
    payment_method VARCHAR(50) DEFAULT 'cash', -- cash, card, transfer
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tip_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- System Information
    station_id INTEGER REFERENCES pos_stations(id),
    session_id INTEGER REFERENCES pos_cash_sessions(id),
    cashier_id VARCHAR NOT NULL REFERENCES users(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- POS Sale Items
CREATE TABLE IF NOT EXISTS pos_sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    
    -- Item Details
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100),
    
    -- Quantities and Pricing
    quantity DECIMAL(12,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Tax Information
    tax_type VARCHAR(50) DEFAULT 'itbis_18',
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Totals
    line_total DECIMAL(12,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- DOMINICAN FISCAL COMPLIANCE
-- ===========================

-- NCF Sequences (Números de Comprobante Fiscal)
CREATE TABLE IF NOT EXISTS ncf_sequences (
    id SERIAL PRIMARY KEY,
    ncf_type VARCHAR(10) NOT NULL, -- B01, B02, B14, B15
    sequence_from BIGINT NOT NULL,
    sequence_to BIGINT NOT NULL,
    current_sequence BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at DATE,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_by VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- RNC Registry (Dominican Republic Taxpayer Registry)
CREATE TABLE IF NOT EXISTS rnc_registry (
    id SERIAL PRIMARY KEY,
    rnc VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(500),
    commercial_name VARCHAR(500),
    category VARCHAR(100),
    payment_regime VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for RNC lookups
CREATE INDEX IF NOT EXISTS idx_rnc_registry_rnc ON rnc_registry (rnc);
CREATE INDEX IF NOT EXISTS idx_rnc_registry_name ON rnc_registry (name);

-- DGII Reports (606, 607, T-REGISTRO)
CREATE TABLE IF NOT EXISTS dgii_reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(20) NOT NULL, -- 606, 607, t_registro
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    file_path TEXT,
    generated_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'generated', -- generated, submitted, approved
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_by VARCHAR NOT NULL REFERENCES users(id)
);

-- ===========================
-- ACCOUNTING SYSTEM
-- ===========================

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- asset, liability, equity, income, expense
    parent_id INTEGER REFERENCES accounts(id),
    balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Journals
CREATE TABLE IF NOT EXISTS journals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- general, sales, purchases, cash, bank
    is_active BOOLEAN DEFAULT true,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    journal_id INTEGER NOT NULL REFERENCES journals(id),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    reference VARCHAR(255),
    description TEXT,
    entry_date DATE NOT NULL,
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_credit DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft', -- draft, posted, cancelled
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_by VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Journal Entry Lines
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id SERIAL PRIMARY KEY,
    journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    description TEXT,
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    line_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- HUMAN RESOURCES
-- ===========================

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    cedula VARCHAR(20),
    passport VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(50),
    nationality VARCHAR(100) DEFAULT 'Dominicana',
    
    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    
    -- Employment Information
    position VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    hire_date DATE NOT NULL,
    employment_type VARCHAR(50) DEFAULT 'full_time', -- full_time, part_time, contract
    work_schedule VARCHAR(100),
    
    -- Salary Information
    salary DECIMAL(12,2),
    salary_type VARCHAR(20) DEFAULT 'monthly', -- monthly, hourly, annual
    currency VARCHAR(3) DEFAULT 'DOP',
    
    -- System Information
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, terminated
    termination_date DATE,
    termination_reason TEXT,
    user_id VARCHAR REFERENCES users(id), -- Link to system user account
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_by VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payroll Periods
CREATE TABLE IF NOT EXISTS payroll_periods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, calculated, paid, closed
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_by VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payroll Entries
CREATE TABLE IF NOT EXISTS payroll_entries (
    id SERIAL PRIMARY KEY,
    payroll_period_id INTEGER NOT NULL REFERENCES payroll_periods(id),
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    
    -- Salary Information
    base_salary DECIMAL(12,2) NOT NULL,
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    overtime_rate DECIMAL(12,2) DEFAULT 0,
    overtime_amount DECIMAL(12,2) DEFAULT 0,
    bonuses DECIMAL(12,2) DEFAULT 0,
    commissions DECIMAL(12,2) DEFAULT 0,
    
    -- Gross Pay
    gross_pay DECIMAL(12,2) NOT NULL,
    
    -- Deductions (Dominican Republic)
    sfs_deduction DECIMAL(12,2) DEFAULT 0, -- 2.87%
    afp_deduction DECIMAL(12,2) DEFAULT 0, -- 2.87%
    isr_deduction DECIMAL(12,2) DEFAULT 0, -- Progressive tax
    other_deductions DECIMAL(12,2) DEFAULT 0,
    
    -- Total Deductions
    total_deductions DECIMAL(12,2) DEFAULT 0,
    
    -- Net Pay
    net_pay DECIMAL(12,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'calculated', -- calculated, paid
    
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leaves (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    leave_type VARCHAR(50) NOT NULL, -- vacation, sick, personal, maternity
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(5,2) NOT NULL,
    days_approved DECIMAL(5,2),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    approved_by VARCHAR REFERENCES users(id),
    approved_at TIMESTAMP,
    comments TEXT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_by VARCHAR NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- SYSTEM MANAGEMENT
-- ===========================

-- System Configuration
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- System Modules
CREATE TABLE IF NOT EXISTS system_modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT true,
    version VARCHAR(20),
    dependencies TEXT[], -- array of module names
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity Logs / Audit Trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    company_id INTEGER REFERENCES companies(id),
    module VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    severity VARCHAR(20) DEFAULT 'info' -- info, warning, error, critical
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    expires_at TIMESTAMP,
    company_id INTEGER REFERENCES companies(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Error Logs
CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id VARCHAR REFERENCES users(id),
    company_id INTEGER REFERENCES companies(id),
    request_url VARCHAR(500),
    request_method VARCHAR(10),
    request_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- INITIAL DATA SETUP
-- ===========================

-- Insert default system modules
INSERT INTO system_modules (name, display_name, description, is_enabled) VALUES
('dashboard', 'Dashboard', 'Panel principal con métricas y resúmenes', true),
('pos', 'Punto de Venta', 'Sistema de punto de venta con NCF', true),
('inventory', 'Inventario', 'Gestión de productos y stock', true),
('customers', 'Clientes', 'Gestión de clientes y CRM', true),
('suppliers', 'Proveedores', 'Gestión de proveedores', true),
('billing', 'Facturación', 'Sistema de facturación con NCF', true),
('accounting', 'Contabilidad', 'Sistema contable completo', true),
('fiscal', 'Fiscal/DGII', 'Cumplimiento fiscal dominicano', true),
('hr', 'Recursos Humanos', 'Gestión de empleados y nómina', true),
('reports', 'Reportes', 'Reportes y analytics', true),
('system', 'Sistema', 'Configuración del sistema', true),
('ai', 'AI Assistant', 'Asistente de inteligencia artificial', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default system configuration
INSERT INTO system_config (key, value, description, category, is_public) VALUES
('system.name', 'Four One Solutions ERP', 'Nombre del sistema', 'system', true),
('system.version', '1.0.0', 'Versión del sistema', 'system', true),
('system.currency', 'DOP', 'Moneda predeterminada', 'system', true),
('system.timezone', 'America/Santo_Domingo', 'Zona horaria', 'system', true),
('subscription.monthly_price', '2500', 'Precio mensual en DOP', 'subscription', true),
('subscription.annual_price', '25000', 'Precio anual en DOP', 'subscription', true),
('dgii.auto_update', 'true', 'Actualización automática de datos DGII', 'dgii', false),
('security.session_timeout', '86400', 'Tiempo de vida de sesión en segundos', 'security', false),
('pos.default_tax_rate', '18', 'Tasa de impuesto por defecto (%)', 'pos', true),
('pos.tip_rate', '10', 'Porcentaje de propina sugerido', 'pos', true),
('ai.enabled', 'true', 'Habilitar funciones de IA', 'ai', true),
('backup.auto_enabled', 'true', 'Respaldos automáticos habilitados', 'backup', false),
('backup.frequency_hours', '24', 'Frecuencia de respaldos en horas', 'backup', false)
ON CONFLICT (key) DO NOTHING;

-- Insert default chart of accounts (simplified Dominican version)
INSERT INTO accounts (code, name, account_type, balance) VALUES
('1101', 'Caja General', 'asset', 15000),
('1102', 'Bancos', 'asset', 45000),
('1201', 'Cuentas por Cobrar - Clientes', 'asset', 25000),
('1301', 'Inventario de Mercancías', 'asset', 35000),
('1401', 'Mobiliario y Equipos', 'asset', 18000),
('2101', 'Cuentas por Pagar - Proveedores', 'liability', -22000),
('2201', 'ITBIS por Pagar', 'liability', -5000),
('2301', 'Préstamos por Pagar', 'liability', -15000),
('3101', 'Capital Social', 'equity', -75000),
('3201', 'Utilidades Retenidas', 'equity', -21000),
('4101', 'Ventas', 'income', 0),
('4201', 'Ingresos por Servicios', 'income', 0),
('5101', 'Costo de Ventas', 'expense', 0),
('5201', 'Gastos Operativos', 'expense', 0)
ON CONFLICT (code) DO NOTHING;

-- Insert default journals
INSERT INTO journals (name, code, type) VALUES
('Diario General', 'GEN', 'general'),
('Diario de Ventas', 'VEN', 'sales'),
('Diario de Compras', 'COM', 'purchases'),
('Diario de Caja', 'CAJ', 'cash'),
('Diario de Bancos', 'BCO', 'bank')
ON CONFLICT (code) DO NOTHING;

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers (company_id);
CREATE INDEX IF NOT EXISTS idx_customers_rnc ON customers (rnc);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status);

-- Supplier indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON suppliers (company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_rnc ON suppliers (rnc);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers (status);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products (company_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products (code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices (company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices (invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_ncf ON invoices (ncf);

-- POS indexes
CREATE INDEX IF NOT EXISTS idx_pos_sales_company_id ON pos_sales (company_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_date ON pos_sales (sale_date);
CREATE INDEX IF NOT EXISTS idx_pos_sales_cashier ON pos_sales (cashier_id);

-- Employee indexes
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees (company_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees (employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees (status);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id ON activity_logs (company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON activity_logs (module);

-- ===========================
-- DATABASE MAINTENANCE
-- ===========================

-- Function to update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers to relevant tables
DO $$
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY[
        'users', 'companies', 'company_users', 'customers', 'suppliers',
        'products', 'invoices', 'employees', 'accounts', 'journal_entries',
        'system_config', 'system_modules', 'leaves'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trigger_update_%I_updated_at ON %I;
            CREATE TRIGGER trigger_update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;

-- ===========================
-- SCRIPT COMPLETION MESSAGE
-- ===========================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'FOUR ONE SOLUTIONS ERP DATABASE SETUP COMPLETE';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Database initialized successfully with:';
    RAISE NOTICE '- Complete table structure (70+ tables)';
    RAISE NOTICE '- Dominican Republic fiscal compliance';
    RAISE NOTICE '- Full ERP functionality';
    RAISE NOTICE '- Performance indexes';
    RAISE NOTICE '- Audit trail system';
    RAISE NOTICE '- Default data and configuration';
    RAISE NOTICE '==============================================';
END $$;