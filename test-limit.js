// Simple test file to check the CAPTCHA functionality
require('dotenv').config();
const Captcha = require('./models/Captcha');

async function testCaptchaLimit() {
  try {
    console.log('🧪 Testing CAPTCHA limit functionality...');
    
    // Test creating multiple CAPTCHAs
    for (let i = 1; i <= 12; i++) {
      const token = `test-token-${i}`;
      const captcha = `12345${i % 10}`;
      const browserInfo = { test: `browser-${i}` };
      
      console.log(`Creating CAPTCHA ${i}...`);
      await Captcha.create(token, captcha, browserInfo);
    }
    
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit();
  }
}

testCaptchaLimit();
