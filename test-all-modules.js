#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs';

const API_URL = 'http://localhost:5000/api';

// Read cookie from file
const cookie = fs.readFileSync('cookies.txt', 'utf8')
  .split('\n')
  .find(line => line.includes('fourone.sid'))
  ?.split('\t')[6];

if (!cookie) {
  console.error('❌ No session cookie found. Please login first.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Cookie': `fourone.sid=${cookie}`
};

// Test result tracking
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

async function testEndpoint(method, path, data = null, description = '') {
  try {
    console.log(`\n🧪 Testing: ${method} ${path}`);
    if (description) console.log(`   📝 ${description}`);
    
    const config = {
      method,
      url: `${API_URL}${path}`,
      headers,
      ...(data && { data })
    };
    
    const response = await axios(config);
    console.log(`   ✅ Success: Status ${response.status}`);
    if (response.data && typeof response.data === 'object') {
      const preview = JSON.stringify(response.data).substring(0, 100);
      console.log(`   📦 Response: ${preview}${preview.length === 100 ? '...' : ''}`);
    }
    results.passed++;
    return response.data;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.response?.status || error.code} - ${error.response?.data?.message || error.message}`);
    results.failed++;
    results.errors.push({
      endpoint: `${method} ${path}`,
      error: error.response?.data?.message || error.message
    });
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive ERP system test suite...\n');
  console.log(`🍪 Using session cookie: ${cookie.substring(0, 20)}...`);

  // 1. USER & AUTH ENDPOINTS
  console.log('\n\n===== 1. USER & AUTHENTICATION TESTS =====');
  await testEndpoint('GET', '/user', null, 'Get current user info');
  await testEndpoint('GET', '/user/payment-status', null, 'Check payment status');
  await testEndpoint('GET', '/users', null, 'List all users');
  
  // 2. COMPANY MANAGEMENT
  console.log('\n\n===== 2. COMPANY MANAGEMENT TESTS =====');
  await testEndpoint('GET', '/companies', null, 'List companies');
  await testEndpoint('GET', '/companies/current', null, 'Get current company');
  
  // 3. CUSTOMER MANAGEMENT
  console.log('\n\n===== 3. CUSTOMER MANAGEMENT TESTS =====');
  await testEndpoint('GET', '/customers', null, 'List all customers');
  await testEndpoint('GET', '/customers/statistics', null, 'Customer statistics');
  const newCustomer = await testEndpoint('POST', '/customers', {
    name: 'Test Customer',
    email: 'test@customer.com',
    phone: '809-555-0123',
    rnc: '133320681',
    address: 'Test Address',
    isActive: true
  }, 'Create new customer');
  
  if (newCustomer?.id) {
    await testEndpoint('GET', `/customers/${newCustomer.id}`, null, 'Get customer by ID');
    await testEndpoint('PUT', `/customers/${newCustomer.id}`, {
      name: 'Updated Test Customer'
    }, 'Update customer');
  }
  
  // 4. PRODUCT MANAGEMENT
  console.log('\n\n===== 4. PRODUCT MANAGEMENT TESTS =====');
  await testEndpoint('GET', '/products', null, 'List all products');
  await testEndpoint('GET', '/products/categories', null, 'List product categories');
  await testEndpoint('GET', '/products/low-stock', null, 'Get low stock products');
  
  // 5. SUPPLIER MANAGEMENT
  console.log('\n\n===== 5. SUPPLIER MANAGEMENT TESTS =====');
  await testEndpoint('GET', '/suppliers', null, 'List all suppliers');
  await testEndpoint('GET', '/suppliers/statistics', null, 'Supplier statistics');
  
  // 6. INVENTORY & WAREHOUSE
  console.log('\n\n===== 6. INVENTORY & WAREHOUSE TESTS =====');
  await testEndpoint('GET', '/warehouses', null, 'List warehouses');
  await testEndpoint('GET', '/inventory/movements', null, 'List inventory movements');
  await testEndpoint('GET', '/inventory/stock-levels', null, 'Get stock levels');
  
  // 7. POS SYSTEM
  console.log('\n\n===== 7. POINT OF SALE TESTS =====');
  await testEndpoint('GET', '/pos/products', null, 'Get POS products');
  await testEndpoint('GET', '/pos/sales', null, 'List POS sales');
  await testEndpoint('GET', '/pos/sessions/current', null, 'Get current POS session');
  
  // 8. BILLING & INVOICES
  console.log('\n\n===== 8. BILLING & INVOICES TESTS =====');
  await testEndpoint('GET', '/invoices', null, 'List all invoices');
  await testEndpoint('GET', '/ncf-sequences', null, 'List NCF sequences');
  await testEndpoint('GET', '/ncf-types', null, 'List NCF types');
  
  // 9. ACCOUNTING
  console.log('\n\n===== 9. ACCOUNTING TESTS =====');
  await testEndpoint('GET', '/accounts', null, 'List chart of accounts');
  await testEndpoint('GET', '/journal-entries', null, 'List journal entries');
  await testEndpoint('GET', '/financial/trial-balance', null, 'Get trial balance');
  await testEndpoint('GET', '/financial/income-statement', null, 'Get income statement');
  await testEndpoint('GET', '/financial/balance-sheet', null, 'Get balance sheet');
  
  // 10. HR MANAGEMENT
  console.log('\n\n===== 10. HUMAN RESOURCES TESTS =====');
  await testEndpoint('GET', '/employees', null, 'List employees');
  await testEndpoint('GET', '/leave-requests', null, 'List leave requests');
  await testEndpoint('GET', '/payroll/periods', null, 'List payroll periods');
  
  // 11. DGII & FISCAL
  console.log('\n\n===== 11. DGII & FISCAL TESTS =====');
  await testEndpoint('GET', '/fiscal/606', null, 'Get 606 reports');
  await testEndpoint('GET', '/fiscal/607', null, 'Get 607 reports');
  await testEndpoint('GET', '/fiscal/dgii-status', null, 'Check DGII status');
  await testEndpoint('POST', '/rnc/validate', { rnc: '133320681' }, 'Validate RNC');
  
  // 12. REPORTS & ANALYTICS
  console.log('\n\n===== 12. REPORTS & ANALYTICS TESTS =====');
  await testEndpoint('GET', '/reports/sales', null, 'Sales reports');
  await testEndpoint('GET', '/reports/inventory', null, 'Inventory reports');
  await testEndpoint('GET', '/reports/financial', null, 'Financial reports');
  await testEndpoint('GET', '/dashboard/stats', null, 'Dashboard statistics');
  
  // 13. SYSTEM & MONITORING
  console.log('\n\n===== 13. SYSTEM & MONITORING TESTS =====');
  await testEndpoint('GET', '/system/info', null, 'System information');
  await testEndpoint('GET', '/system/health', null, 'System health check');
  await testEndpoint('GET', '/system/stats', null, 'System statistics');
  await testEndpoint('GET', '/system/config', null, 'System configuration');
  await testEndpoint('GET', '/system/modules', null, 'System modules');
  await testEndpoint('GET', '/system/audit-logs', null, 'Audit logs');
  
  // 14. AI ASSISTANT
  console.log('\n\n===== 14. AI ASSISTANT TESTS =====');
  await testEndpoint('POST', '/ai/chat', {
    message: 'What are my total sales this month?'
  }, 'Test AI chat');
  await testEndpoint('POST', '/ai/analyze-sales', null, 'Analyze sales with AI');
  
  // 15. NOTIFICATIONS
  console.log('\n\n===== 15. NOTIFICATIONS TESTS =====');
  await testEndpoint('GET', '/notifications', null, 'List notifications');
  await testEndpoint('GET', '/notifications/unread-count', null, 'Get unread count');
  
  // 16. SECURITY
  console.log('\n\n===== 16. SECURITY TESTS =====');
  await testEndpoint('GET', '/security/dashboard', null, 'Security dashboard');
  await testEndpoint('POST', '/security/change-password', {
    currentPassword: 'password123',
    newPassword: 'password123'
  }, 'Test password change');
  
  // 17. EMAIL SYSTEM
  console.log('\n\n===== 17. EMAIL SYSTEM TESTS =====');
  await testEndpoint('POST', '/test-emails', null, 'Test email system');
  
  // 18. DOWNLOADS
  console.log('\n\n===== 18. DOWNLOADS TESTS =====');
  await testEndpoint('GET', '/downloads/available', null, 'List available downloads');
  await testEndpoint('GET', '/downloads/desktop/windows', null, 'Windows download info');
  await testEndpoint('GET', '/downloads/mobile/android', null, 'Android download info');
  
  // SUMMARY
  console.log('\n\n========== TEST SUMMARY ==========');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Success Rate: ${(results.passed / (results.passed + results.failed) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n🔴 Failed Endpoints:');
    results.errors.forEach(err => {
      console.log(`   - ${err.endpoint}: ${err.error}`);
    });
  }
  
  console.log('\n✨ Test suite completed!');
}

// Run tests
runAllTests().catch(console.error);