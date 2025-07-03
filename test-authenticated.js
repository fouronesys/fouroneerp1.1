#!/usr/bin/env node

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test credentials
const TEST_USER = {
  email: 'admin@fourone.com.do',
  password: 'Admin123!' // Default password
};

let sessionCookie = null;

async function login() {
  try {
    console.log('\n🔐 Logging in as admin@fourone.com.do...');
    const response = await axios.post(`${API_URL}/login`, TEST_USER, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
      maxRedirects: 0,
      validateStatus: (status) => status < 400
    });
    
    // Extract session cookie
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      const sidCookie = cookies.find(c => c.includes('fourone.sid'));
      if (sidCookie) {
        sessionCookie = sidCookie.split(';')[0];
        console.log('   ✅ Login successful - session obtained');
        return true;
      }
    }
    console.log('   ❌ Login failed - no session cookie');
    return false;
  } catch (error) {
    console.error('   ❌ Login error:', error.message);
    return false;
  }
}

async function testEndpoint(method, path, data = null, description = '') {
  try {
    console.log(`\n🧪 Testing: ${method} ${path}`);
    if (description) console.log(`   📝 ${description}`);
    
    const config = {
      method,
      url: `${API_URL}${path}`,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    console.log(`   ✅ Success: Status ${response.status}`);
    if (response.data && typeof response.data === 'object') {
      const preview = JSON.stringify(response.data).substring(0, 100);
      console.log(`   📦 Response: ${preview}${preview.length === 100 ? '...' : ''}`);
    }
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`   ❌ Failed: ${error.response?.status || 'Network Error'} - ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting authenticated API tests...\n');
  
  // First login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Test user info
  await testEndpoint('GET', '/user', null, 'Get current user info');
  
  // Test system endpoints
  await testEndpoint('GET', '/system/health', null, 'System health check');
  await testEndpoint('GET', '/system/info', null, 'System information');
  await testEndpoint('GET', '/system/stats', null, 'System statistics');
  
  // Test customer endpoints
  await testEndpoint('GET', '/customers', null, 'Get all customers');
  await testEndpoint('POST', '/customers', {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '809-555-0123',
    rnc: '13400034305',
    type: 'individual'
  }, 'Create new customer');
  
  // Test product endpoints
  await testEndpoint('GET', '/products', null, 'Get all products');
  await testEndpoint('POST', '/products', {
    name: 'Test Product',
    code: 'TEST-001',
    type: 'product',
    salePrice: 100,
    costPrice: 50,
    warehouseId: 2
  }, 'Create new product');
  
  // Test email functionality
  await testEndpoint('POST', '/test-emails', null, 'Test email sending');
  
  // Test security endpoints
  await testEndpoint('GET', '/security/info', null, 'Get security info');
  await testEndpoint('POST', '/security/change-password', {
    currentPassword: 'Admin123!',
    newPassword: 'Admin123!',
    confirmPassword: 'Admin123!'
  }, 'Test password change');
  
  console.log('\n✨ Test run completed!');
}

// Run tests
runTests().catch(console.error);