const axios = require('axios');

async function testImageGeneration() {
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/login', {
      email: 'admin@fourone.com.do',
      password: 'Admin123!'
    });
    
    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];
    console.log('✅ Login successful\n');

    // Test 1: Generate image for existing product (Gemini AI)
    console.log('🎨 Test 1: Generating image with Gemini AI for existing product...');
    try {
      const existingProductId = 12; // Tablet Android Premium
      const imageRes = await axios.post(`http://localhost:5000/api/products/${existingProductId}/generate-image`, {}, {
        headers: { 'Cookie': cookie }
      });
      console.log('✅ Gemini AI generation successful:', imageRes.data);
    } catch (error) {
      console.log('❌ Gemini AI generation error:', error.response?.data || error.message);
    }

    // Test 2: Generate image with description (should use Gemini)
    console.log('\n🎨 Test 2: Generating image with product details...');
    try {
      const imageRes = await axios.post('http://localhost:5000/api/products/generate-image', {
        productName: 'Laptop Gaming RGB',
        description: 'High-performance gaming laptop with RGB keyboard and NVIDIA graphics',
        productCode: 'LG-RGB-001'
      }, {
        headers: { 'Cookie': cookie }
      });
      console.log('✅ Image with description generated:', imageRes.data);
    } catch (error) {
      console.log('❌ Image generation error:', error.response?.data || error.message);
    }

    // Test 3: Test fallback to Unsplash by forcing source
    console.log('\n🎨 Test 3: Testing Unsplash fallback...');
    try {
      const imageRes = await axios.post('http://localhost:5000/api/products/generate-image', {
        productName: 'Office Chair Ergonomic',
        source: 'unsplash'
      }, {
        headers: { 'Cookie': cookie }
      });
      console.log('✅ Unsplash fallback successful:', imageRes.data);
    } catch (error) {
      console.log('❌ Unsplash fallback error:', error.response?.data || error.message);
    }

    // Test 4: Check products without images
    console.log('\n📋 Test 4: Checking products without images...');
    const productsRes = await axios.get('http://localhost:5000/api/products', {
      headers: { 'Cookie': cookie }
    });
    
    const productsWithoutImages = productsRes.data.filter(p => !p.imageUrl);
    const productsWithImages = productsRes.data.filter(p => p.imageUrl);
    
    console.log(`📊 Total products: ${productsRes.data.length}`);
    console.log(`🖼️  Products with images: ${productsWithImages.length}`);
    console.log(`❌ Products without images: ${productsWithoutImages.length}`);
    
    if (productsWithoutImages.length > 0) {
      console.log('\nProducts without images:');
      productsWithoutImages.forEach(p => {
        console.log(`  - ${p.name} (ID: ${p.id})`);
      });
    }

    // Test 5: Verify generated images are accessible
    console.log('\n🔍 Test 5: Verifying generated images are accessible...');
    const recentProducts = productsWithImages.slice(-3); // Last 3 products with images
    for (const product of recentProducts) {
      if (product.imageUrl) {
        try {
          const imageUrl = product.imageUrl.startsWith('http') 
            ? product.imageUrl 
            : `http://localhost:5000${product.imageUrl}`;
          
          const imageRes = await axios.head(imageUrl);
          console.log(`✅ ${product.name}: Image accessible (${imageRes.headers['content-type']})`);
        } catch (error) {
          console.log(`❌ ${product.name}: Image not accessible`);
        }
      }
    }

    console.log('\n✅ All image generation tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImageGeneration();