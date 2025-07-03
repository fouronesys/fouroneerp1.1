const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testProductCreation() {
  try {
    // First login
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(API_URL + '/login', {
      email: 'admin@fourone.com.do',
      password: 'Admin123!'
    });
    
    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];
    console.log('✅ Login successful');
    
    // Test product creation
    console.log('\n📦 Creating product...');
    const productRes = await axios.post(API_URL + '/products', {
      name: 'Test Product',
      code: 'TEST-002', 
      type: 'product',
      salePrice: 100,
      costPrice: 50,
      warehouseId: 2
    }, {
      headers: { 'Cookie': cookie }
    });
    
    console.log('✅ Product created successfully:');
    console.log('   ID:', productRes.data.id);
    console.log('   Name:', productRes.data.name);
    console.log('   Code:', productRes.data.code);
    console.log('   Price:', productRes.data.price);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('   Message:', error.response.data.message);
    }
  }
}

testProductCreation();