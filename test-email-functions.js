// Test all email functions by calling API endpoints
async function testEmailFunctions() {
  const testEmail = 'admin@fourone.com.do';
  console.log('Testing email functions with:', testEmail);
  
  // First we need to check if server is running
  try {
    const response = await fetch('http://localhost:5000/api/test-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Email test result:', result);
    } else {
      console.error('Email test failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error calling email test endpoint:', error);
  }
}

testEmailFunctions();