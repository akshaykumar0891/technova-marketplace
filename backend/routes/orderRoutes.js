const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken); // Protect all order routes

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.post('/addresses', orderController.addAddress);
router.get('/addresses', orderController.getAddresses);

module.exports = router;
