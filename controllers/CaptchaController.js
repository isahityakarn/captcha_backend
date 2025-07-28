const { v4: uuidv4 } = require('uuid');
const Captcha = require('../models/Captcha');

class CaptchaController {
  static async getCaptchaRequest(req, res) {
    try {
      const { browserInfo, captcha } = req.body;

      if (!captcha || typeof captcha !== 'string' || !/^\d{6}$/.test(captcha)) {
        return res.status(400).json({ 
          success: false, 
          message: 'CAPTCHA must be a valid 6-digit number' 
        });
      }

      if (!browserInfo || typeof browserInfo !== 'object') {
        return res.status(400).json({ 
          success: false, 
          message: 'Browser information is required' 
        });
      }

      const token = uuidv4();

      await Captcha.create(token, captcha, browserInfo);

      res.json({ 
        success: true, 
        message: 'Get CAPTCHA successfully', 
        token 
      });
    } catch (error) {
      console.error('❌ Error in getCaptchaRequest:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
  }

  static async verifyCaptcha(req, res) {
    try {
      const { token, captcha, browserInfo } = req.body;

      if (!token || !captcha || !browserInfo) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields' 
        });
      }

      const result = await Captcha.verify(token, captcha, browserInfo);

      if (!result.success) {
        const statusCode = result.message === 'Token not found' ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('❌ Error in verifyCaptcha:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }
}

module.exports = CaptchaController;
