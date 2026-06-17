const db = require('../config/db');

async function getCart(req, res) {
  try {
    const userId = req.user.id;

    const cartItems = await db.query(`
      SELECT c.id, c.product_id, c.quantity, p.title, p.price, p.image_url, p.brand, p.stock 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?
    `, [userId]);

    return res.json(cartItems);

  } catch (error) {
    console.error('Error fetching cart:', error);
    return res.status(500).json({ message: 'Server error fetching cart.' });
  }
}

async function addToCart(req, res) {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    const qty = parseInt(quantity) || 1;

    if (!product_id) {
      return res.status(400).json({ message: 'Product ID is required.' });
    }

    // Check if product exists and has stock
    const products = await db.query('SELECT stock, title FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = products[0];

    // Check if already in cart
    const existing = await db.query('SELECT * FROM cart WHERE user_id = ? AND product_id = ?', [userId, product_id]);

    if (existing.length > 0) {
      const newQty = existing[0].quantity + qty;
      
      if (newQty > product.stock) {
        return res.status(400).json({ message: `Cannot add more items. Only ${product.stock} items are in stock.` });
      }

      await db.query('UPDATE cart SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    } else {
      if (qty > product.stock) {
        return res.status(400).json({ message: `Cannot add. Only ${product.stock} items are in stock.` });
      }

      await db.query('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [userId, product_id, qty]);
    }

    // Return updated cart
    const updatedCart = await db.query(`
      SELECT c.id, c.product_id, c.quantity, p.title, p.price, p.image_url, p.brand, p.stock 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?
    `, [userId]);

    return res.json({ message: 'Product added to cart successfully.', cart: updatedCart });

  } catch (error) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({ message: 'Server error adding to cart.' });
  }
}

async function updateCartItem(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive integer.' });
    }

    // Verify ownership and check product stock
    const items = await db.query(`
      SELECT c.id, c.product_id, p.stock, p.title 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.id = ? AND c.user_id = ?
    `, [id, userId]);

    if (items.length === 0) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    const item = items[0];
    if (qty > item.stock) {
      return res.status(400).json({ message: `Cannot update quantity. Only ${item.stock} items are in stock.` });
    }

    await db.query('UPDATE cart SET quantity = ? WHERE id = ?', [qty, id]);

    // Return updated cart
    const updatedCart = await db.query(`
      SELECT c.id, c.product_id, c.quantity, p.title, p.price, p.image_url, p.brand, p.stock 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?
    `, [userId]);

    return res.json({ message: 'Cart updated successfully.', cart: updatedCart });

  } catch (error) {
    console.error('Error updating cart item:', error);
    return res.status(500).json({ message: 'Server error updating cart item.' });
  }
}

async function removeFromCart(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cart item not found or unauthorized.' });
    }

    // Return updated cart
    const updatedCart = await db.query(`
      SELECT c.id, c.product_id, c.quantity, p.title, p.price, p.image_url, p.brand, p.stock 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?
    `, [userId]);

    return res.json({ message: 'Item removed from cart.', cart: updatedCart });

  } catch (error) {
    console.error('Error deleting cart item:', error);
    return res.status(500).json({ message: 'Server error deleting cart item.' });
  }
}

async function mergeCart(req, res) {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required.' });
    }

    for (const item of items) {
      const { product_id, quantity } = item;
      const qty = parseInt(quantity) || 1;

      const products = await db.query('SELECT stock FROM products WHERE id = ?', [product_id]);
      if (products.length === 0) continue;
      const stock = products[0].stock;

      const existing = await db.query('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?', [userId, product_id]);

      if (existing.length > 0) {
        const newQty = Math.min(existing[0].quantity + qty, stock);
        await db.query('UPDATE cart SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
      } else {
        const finalQty = Math.min(qty, stock);
        if (finalQty > 0) {
          await db.query('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [userId, product_id, finalQty]);
        }
      }
    }

    const updatedCart = await db.query(`
      SELECT c.id, c.product_id, c.quantity, p.title, p.price, p.image_url, p.brand, p.stock 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?
    `, [userId]);

    return res.json({ message: 'Cart merged successfully.', cart: updatedCart });

  } catch (error) {
    console.error('Cart merge error:', error);
    return res.status(500).json({ message: 'Server error during cart merge.' });
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  mergeCart
};
