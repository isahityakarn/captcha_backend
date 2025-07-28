const express = require('express');
const CaptchaController = require('../controllers/CaptchaController');

const router = express.Router();


router.post('/getCaptchaRequest', CaptchaController.getCaptchaRequest);
router.post('/verifyCaptcha', CaptchaController.verifyCaptcha);



module.exports = router;
