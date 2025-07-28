require('dotenv').config();
const express = require('express');
const cors = require('cors');
const captchaRoutes = require('./routes/captcha');

const app = express();
const PORT = 5050;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/captcha', captchaRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});