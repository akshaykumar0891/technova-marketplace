const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

router.use(authenticateToken, isAdmin); // Secure all admin routes

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);

router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

router.get('/orders', adminController.getAdminOrders);
router.put('/orders/:id', adminController.updateOrderStatus);

// Account Deactivation & Deletion logs routes
router.get('/deactivations', adminController.getDeactivationLogs);
router.post('/deactivations/:id/reactivate', adminController.reactivateAccount);
router.delete('/deactivations/:id', adminController.deleteDeactivationLog);

// Reviews moderation routes
router.get('/reviews', adminController.getAdminReviews);
router.delete('/reviews/:id', adminController.deleteReview);

module.exports = router;
