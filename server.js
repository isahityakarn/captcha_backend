const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require('crypto-js');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY;


app.post('/api/captcha/getCaptchaRequest', async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ success: false, message: 'Missing encrypted data' });
  }

  try {
    const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
    const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    const { captcha, browserInfo } = decrypted;

    if (!captcha || !browserInfo) {
      return res.status(400).json({ success: false, message: 'Captcha or browserInfo missing' });
    }

    const token = uuidv4();
    await db.execute(
      'INSERT INTO captchas (token, captcha, browser_info) VALUES (?, ?, ?)',
      [token, captcha, JSON.stringify(browserInfo)]
    );

    res.json({ success: true, token });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ success: false, message: 'Decryption or DB error' });
  }
});


app.post('/api/captcha/verify', async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ success: false, message: 'Missing encrypted data' });
  }

  try {
    const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
    const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    const { captcha, browserInfo, token } = decrypted;

    const [rows] = await db.execute('SELECT * FROM captchas WHERE token = ?', [token]);

    if (!rows.length) {
      return res.json({ success: false, message: 'Token not found' });
    }

    const stored = rows[0];
    const storedInfo = JSON.parse(stored.browser_info);

    const browserMatch = JSON.stringify(browserInfo) === JSON.stringify(storedInfo);
    const captchaMatch = captcha === stored.captcha;

    if (browserMatch && captchaMatch) {
      return res.json({ success: true, message: 'CAPTCHA verified' });
    } else {
      return res.json({ success: false, message: 'CAPTCHA mismatch...... Plese check' });
    }

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ success: false, message: 'Issue With Server error' });
  }
});

app.listen(5050, () => {
  console.log('Server started on http://localhost:5050');
});