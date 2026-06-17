const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/deactivate', authenticateToken, authController.deactivateAccount);
router.post('/delete-account', authenticateToken, authController.deleteAccount);
router.post('/request-password-otp', authenticateToken, authController.requestPasswordOTP);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
