const db = require('../db');

class Captcha {
  static async create(token, captcha, browserInfo) {
    try {
      const browserInfoStr = JSON.stringify(browserInfo);
      await db.execute(
        'INSERT INTO captchas (token, captcha, browser_info) VALUES (?, ?, ?)',
        [token, captcha, browserInfoStr]
      );
      
      await this.limitTableSize();
      
      return true;
    } catch (error) {
      console.error('❌ MySQL insert error:', error);
      throw error;
    }
  }

  static async limitTableSize(maxRecords = 10) {
    try {
      const [countResult] = await db.execute('SELECT COUNT(*) as count FROM captchas');
      const currentCount = countResult[0].count;
      
      if (currentCount > maxRecords) {
        const deleteCount = currentCount - maxRecords;
        
        const [oldestRecords] = await db.execute(
          'SELECT id FROM captchas ORDER BY created_at ASC LIMIT ?',
          [deleteCount]
        );
        
        if (oldestRecords.length > 0) {
          const idsToDelete = oldestRecords.map(row => row.id);
          const placeholders = idsToDelete.map(() => '?').join(',');
          
          await db.execute(
            `DELETE FROM captchas WHERE id IN (${placeholders})`,
            idsToDelete
          );
          
          console.log(`🗑️ Deleted ${deleteCount} oldest CAPTCHA records to maintain limit of ${maxRecords}`);
        }
      }
    } catch (error) {
      console.error('❌ Error limiting table size:', error);
      throw error;
    }
  }

  static async findByToken(token) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM captchas WHERE token = ?',
        [token]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      console.error('❌ MySQL select error:', error);
      throw error;
    }
  }

  static async verify(token, captcha, browserInfo) {
    try {
      const storedCaptcha = await this.findByToken(token);
      
      if (!storedCaptcha) {
        return { success: false, message: 'Token not found' };
      }

      if (storedCaptcha.captcha !== captcha) {
        return { success: false, message: 'CAPTCHA does not match' };
      }

      const storedBrowserInfo = JSON.parse(storedCaptcha.browser_info);
      const matches = JSON.stringify(storedBrowserInfo) === JSON.stringify(browserInfo);

      if (!matches) {
        return { success: false, message: 'Browser info does not match' };
      }

      return { success: true, message: 'CAPTCHA verified successfully' };
    } catch (error) {
      console.error('❌ CAPTCHA verification failed:', error);
      throw error;
    }
  }
}

module.exports = Captcha;
