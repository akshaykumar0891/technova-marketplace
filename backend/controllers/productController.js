const db = require('../config/db');

async function getProducts(req, res) {
  try {
    const { search, category, brand, minPrice, maxPrice, sortBy } = req.query;

    let sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    // Search filter (matches title or description case-insensitively)
    if (search) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Category filter (accepts category id)
    if (category) {
      sql += ' AND p.category_id = ?';
      params.push(category);
    }

    // Brand filter
    if (brand) {
      sql += ' AND p.brand = ?';
      params.push(brand);
    }

    // Price range filters
    if (minPrice) {
      sql += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      sql += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }

    // Sorting
    if (sortBy) {
      if (sortBy === 'price_asc') {
        sql += ' ORDER BY p.price ASC';
      } else if (sortBy === 'price_desc') {
        sql += ' ORDER BY p.price DESC';
      } else if (sortBy === 'name_asc') {
        sql += ' ORDER BY p.title ASC';
      } else if (sortBy === 'name_desc') {
        sql += ' ORDER BY p.title DESC';
      } else {
        sql += ' ORDER BY p.created_at DESC';
      }
    } else {
      sql += ' ORDER BY p.id DESC';
    }

    const products = await db.query(sql, params);
    return res.json(products);

  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Server error fetching products.' });
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const products = await db.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [id]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.json(products[0]);

  } catch (error) {
    console.error('Error fetching product detail:', error);
    return res.status(500).json({ message: 'Server error fetching product details.' });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await db.query('SELECT * FROM categories ORDER BY name ASC');
    return res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Server error fetching categories.' });
  }
}

async function getBrands(req, res) {
  try {
    const brands = await db.query('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != "" ORDER BY brand ASC');
    const brandNames = brands.map(row => row.brand);
    return res.json(brandNames);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return res.status(500).json({ message: 'Server error fetching brands.' });
  }
}

async function getProductReviews(req, res) {
  try {
    const { id } = req.params;

    const reviews = await db.query('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC', [id]);
    const summary = await db.query('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = ?', [id]);
    
    const avgRating = parseFloat(summary[0].avg_rating || 0).toFixed(1);
    const count = summary[0].count || 0;

    return res.json({
      reviews,
      avgRating,
      count
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ message: 'Server error loading reviews.' });
  }
}

async function createProductReview(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userName = req.user.name;
    const { rating, title, comment, image_url } = req.body;

    const ratingVal = parseInt(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Review title is required.' });
    }

    await db.query(
      'INSERT INTO reviews (product_id, user_id, user_name, rating, title, comment, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, userName, ratingVal, title, comment || '', image_url || '']
    );

    return res.status(201).json({ message: 'Review submitted successfully.' });

  } catch (error) {
    console.error('Error saving review:', error);
    return res.status(500).json({ message: 'Server error saving review.' });
  }
}

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  getBrands,
  getProductReviews,
  createProductReview
};
