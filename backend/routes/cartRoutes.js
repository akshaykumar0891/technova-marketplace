const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken); // Protect all cart routes

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.post('/merge', cartController.mergeCart);
router.put('/:id', cartController.updateCartItem);
router.delete('/:id', cartController.removeFromCart);

module.exports = router;
