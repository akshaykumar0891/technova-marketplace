const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/brands', productController.getBrands);
router.get('/:id', productController.getProductById);

// Reviews routes
router.get('/:id/reviews', productController.getProductReviews);
router.post('/:id/reviews', authenticateToken, productController.createProductReview);

module.exports = router;
