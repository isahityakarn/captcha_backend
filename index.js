require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = 5050;

app.use(cors());
app.use(express.json());

app.post('/api/captcha/getCaptchaRequest', async (req, res) => {
  const { browserInfo, captcha } = req.body;

  if (!captcha || typeof captcha !== 'string' || !/^\d{6}$/.test(captcha)) {
    return res.status(400).json({ success: false, message: 'CAPTCHA must be a valid 6-digit number' });
  }

  if (!browserInfo || typeof browserInfo !== 'object') {
    return res.status(400).json({ success: false, message: 'Browser information is required' });
  }

  const token = uuidv4();
  const browserInfoStr = JSON.stringify(browserInfo);

  try {
    await db.execute(
      'INSERT INTO captchas (token, captcha, browser_info) VALUES (?, ?, ?)',
      [token, captcha, browserInfoStr]
    );

    res.json({ success: true, message: 'Get CAPTCHA successfully', token });
  } catch (error) {
    console.error('❌ MySQL insert error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});


app.post('/api/captcha/verifyCaptcha', async (req, res) => {
  const { token, captcha, browserInfo } = req.body;

  if (!token || !captcha || !browserInfo) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT * FROM captchas WHERE token = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    const storedCaptcha = rows[0];

    // Compare captcha
    if (storedCaptcha.captcha !== captcha) {
      return res.status(400).json({ success: false, message: 'CAPTCHA does not match' });
    }

    // Compare browser info
    const storedBrowserInfo = JSON.parse(storedCaptcha.browser_info);
    const matches = JSON.stringify(storedBrowserInfo) === JSON.stringify(browserInfo);

    if (!matches) {
      return res.status(400).json({ success: false, message: 'Browser info does not match' });
    }

    return res.json({ success: true, message: 'CAPTCHA verified successfully' });
  } catch (error) {
    console.error('❌ CAPTCHA verification failed:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});