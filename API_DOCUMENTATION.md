# Four One Solutions API Documentation

## Overview
This document provides comprehensive API documentation for the Four One Solutions ERP system. All endpoints require authentication unless otherwise specified.

## Authentication
The system uses session-based authentication with cookies.

### Login
```
POST /api/login
Content-Type: application/json

{
  "email": "admin@fourone.com.do",
  "password": "PSzorro99**"
}
```

### Logout
```
POST /api/logout
```

## Core Modules

### 1. Dashboard & Metrics
```
GET /api/dashboard/metrics
GET /api/dashboard/sales-chart
GET /api/dashboard/top-products
GET /api/dashboard/recent-activities
```

### 2. Point of Sale (POS)
```
# Sales
POST /api/pos/sales
GET /api/pos/sales
GET /api/pos/sales/:id

# Cart Management
GET /api/pos/cart
POST /api/pos/cart/items
PUT /api/pos/cart/items/:id
DELETE /api/pos/cart/items/:id
POST /api/pos/cart/clear

# Print Settings
GET /api/pos/print-settings
PUT /api/pos/print-settings

# Cash Sessions
GET /api/pos/cash-sessions
POST /api/pos/cash-sessions
PUT /api/pos/cash-sessions/:id/close
```

### 3. Inventory Management
```
# Products
GET /api/products
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id
GET /api/products/search
GET /api/products/low-stock

# Inventory Movements
GET /api/inventory-movements
POST /api/inventory-movements
GET /api/inventory-movements/:productId

# Warehouses
GET /api/warehouses
POST /api/warehouses
PUT /api/warehouses/:id
DELETE /api/warehouses/:id
```

### 4. Manufacturing
```
# Production Orders
GET /api/production-orders
POST /api/production-orders
PUT /api/production-orders/:id
DELETE /api/production-orders/:id
POST /api/production-orders/:id/complete

# Bill of Materials (BOM)
GET /api/bom
POST /api/bom
PUT /api/bom/:id
DELETE /api/bom/:id

# Recipes
GET /api/recipes
POST /api/recipes
PUT /api/recipes/:id
DELETE /api/recipes/:id
```

### 5. Invoicing & Billing
```
# Invoices
GET /api/invoices
POST /api/invoices
PUT /api/invoices/:id
DELETE /api/invoices/:id
GET /api/invoices/:id/download
POST /api/invoices/:id/send-email

# NCF Sequences
GET /api/ncf-sequences
POST /api/ncf-sequences
PUT /api/ncf-sequences/:id
```

### 6. Customer Management
```
GET /api/customers
POST /api/customers
PUT /api/customers/:id
DELETE /api/customers/:id
GET /api/customers/search
GET /api/customers/:id/history
```

### 7. Supplier Management
```
GET /api/suppliers
POST /api/suppliers
PUT /api/suppliers/:id
DELETE /api/suppliers/:id
```

### 8. Accounting
```
# Chart of Accounts
GET /api/accounting/accounts
POST /api/accounting/accounts
PUT /api/accounting/accounts/:id
DELETE /api/accounting/accounts/:id

# Journal Entries
GET /api/accounting/journal-entries
POST /api/accounting/journal-entries
PUT /api/accounting/journal-entries/:id
POST /api/accounting/journal-entries/:id/post

# Financial Reports
GET /api/accounting/reports/trial-balance
GET /api/accounting/reports/income-statement
GET /api/accounting/reports/balance-sheet
GET /api/accounting/reports/general-ledger
```

### 9. Human Resources
```
# Employees
GET /api/employees
POST /api/employees
PUT /api/employees/:id
DELETE /api/employees/:id

# Time Tracking
GET /api/time-tracking
POST /api/time-tracking/clock-in
POST /api/time-tracking/clock-out
GET /api/time-tracking/report

# Leave Requests
GET /api/leave-requests
POST /api/leave-requests
PUT /api/leave-requests/:id
POST /api/leave-requests/:id/approve
POST /api/leave-requests/:id/reject
```

### 10. Reports & Analytics
```
GET /api/reports/sales
GET /api/reports/inventory
GET /api/reports/financial
GET /api/reports/customers
GET /api/reports/employees
GET /api/reports/export/:type
```

### 11. AI Assistant
```
POST /api/ai/chat
POST /api/ai/analyze-sales
POST /api/ai/optimize-inventory
POST /api/ai/generate-insights
```

### 12. Internal Chat
```
# Channels
GET /api/chat/channels
POST /api/chat/channels
PUT /api/chat/channels/:id
DELETE /api/chat/channels/:id

# Messages
GET /api/chat/channels/:channelId/messages
POST /api/chat/channels/:channelId/messages
PUT /api/chat/messages/:id
DELETE /api/chat/messages/:id
POST /api/chat/messages/:id/react
```

### 13. DGII Fiscal Compliance
```
# RNC Registry
GET /api/rnc/search
POST /api/rnc/validate
GET /api/rnc/update-status

# Fiscal Reports
GET /api/fiscal/reports/605
GET /api/fiscal/reports/606
GET /api/fiscal/reports/607
POST /api/fiscal/reports/generate
GET /api/fiscal/reports/download/:id
```

### 14. System Configuration
```
# Company Settings
GET /api/company
PUT /api/company
GET /api/company/settings
PUT /api/company/settings

# User Management
GET /api/users
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
POST /api/users/:id/reset-password

# Permissions & Roles
GET /api/permissions
PUT /api/permissions/user/:userId
GET /api/roles
POST /api/roles
PUT /api/roles/:id
DELETE /api/roles/:id

# System Configuration
GET /api/system/config
PUT /api/system/config
GET /api/system/modules
PUT /api/system/modules/:id
GET /api/system/audit-logs
GET /api/system/health
POST /api/system/backup
POST /api/system/restore
```

### 15. Notifications
```
GET /api/notifications
PUT /api/notifications/:id/read
DELETE /api/notifications/:id
GET /api/notifications/settings
PUT /api/notifications/settings
```

### 16. File Management
```
POST /api/files/upload
GET /api/files/:id
DELETE /api/files/:id
GET /api/files/download/:id
```

### 17. Currency & Exchange Rates
```
GET /api/currency/rates
POST /api/currency/rates
GET /api/currency/convert
```

### 18. Subscription & Billing
```
GET /api/billing/status
GET /api/billing/history
POST /api/billing/payment
GET /api/billing/invoices
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

### Pagination
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Status Codes
- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

## Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per user

## Webhooks
The system supports webhooks for real-time notifications:
- Invoice created/updated
- Payment received
- Low stock alerts
- Employee clock in/out
- Leave request status changes

## WebSocket Events
Real-time updates via WebSocket:
- `notification`: New notification
- `chat.message`: New chat message
- `pos.sale`: New POS sale
- `inventory.update`: Inventory changes
- `system.alert`: System alerts

## Environment Variables Required
```
DATABASE_URL: PostgreSQL connection string
ANTHROPIC_API_KEY: For AI features
BREVO_API_KEY: For email notifications
PAYPAL_CLIENT_ID: For payment processing
PAYPAL_CLIENT_SECRET: For payment processing
SESSION_SECRET: For session management
```

## Security Notes
- All endpoints require authentication except /api/login
- CSRF protection is enabled
- Rate limiting is applied
- Input validation using Zod schemas
- SQL injection protection via parameterized queries
- XSS protection through proper encoding