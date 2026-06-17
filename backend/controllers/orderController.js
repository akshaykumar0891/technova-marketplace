const db = require('../config/db');

async function createOrder(req, res) {
  try {
    const userId = req.user.id;
    const { addressId, shippingAddress } = req.body;

    // Fetch cart items
    const cartItems = await db.query(`
      SELECT c.*, p.title, p.price, p.stock 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?
    `, [userId]);

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Your shopping cart is empty.' });
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(400).json({ 
          message: `Insufficient stock for "${item.title}". Only ${item.stock} left in stock.` 
        });
      }
      totalAmount += parseFloat(item.price) * item.quantity;
    }

    // Resolve address
    let finalAddressId = addressId;
    if (!finalAddressId && shippingAddress) {
      const { full_name, phone, city, state, pincode, address } = shippingAddress;
      if (!full_name || !phone || !city || !state || !pincode || !address) {
        return res.status(400).json({ message: 'Complete shipping address details are required.' });
      }
      const addrResult = await db.query(
        `INSERT INTO addresses (user_id, full_name, phone, city, state, pincode, address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, full_name, phone, city, state, pincode, address]
      );
      finalAddressId = addrResult.insertId;
    }

    if (!finalAddressId) {
      return res.status(400).json({ message: 'Shipping address is required.' });
    }

    // Create order entry
    const orderResult = await db.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [userId, totalAmount, 'Pending']
    );
    const orderId = orderResult.insertId;

    // Create order items & update product stock
    for (const item of cartItems) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );

      await db.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Empty shopping cart
    await db.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    return res.status(201).json({
      message: 'Order placed successfully.',
      orderId,
      totalAmount
    });

  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({ message: 'Server error placing your order.' });
  }
}

async function getOrders(req, res) {
  try {
    const userId = req.user.id;

    // Fetch user's orders
    const orders = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);

    if (orders.length === 0) {
      return res.json([]);
    }

    // Fetch all items related to these orders to prevent N+1 queries
    const orderItems = await db.query(`
      SELECT oi.*, p.title, p.image_url, p.brand 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      JOIN orders o ON oi.order_id = o.id 
      WHERE o.user_id = ?
    `, [userId]);

    // Group items by order ID
    const orderMap = {};
    orders.forEach(o => {
      orderMap[o.id] = {
        ...o,
        items: []
      };
    });

    orderItems.forEach(item => {
      if (orderMap[item.order_id]) {
        orderMap[item.order_id].items.push(item);
      }
    });

    const detailedOrders = Object.values(orderMap).sort((a, b) => b.id - a.id);
    return res.json(detailedOrders);

  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ message: 'Server error fetching order history.' });
  }
}

async function addAddress(req, res) {
  try {
    const userId = req.user.id;
    const { full_name, phone, city, state, pincode, address } = req.body;

    if (!full_name || !phone || !city || !state || !pincode || !address) {
      return res.status(400).json({ message: 'All address fields are required.' });
    }

    const result = await db.query(
      `INSERT INTO addresses (user_id, full_name, phone, city, state, pincode, address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, full_name, phone, city, state, pincode, address]
    );

    return res.status(201).json({
      id: result.insertId,
      user_id: userId,
      full_name,
      phone,
      city,
      state,
      pincode,
      address
    });

  } catch (error) {
    console.error('Error adding address:', error);
    return res.status(500).json({ message: 'Server error saving address.' });
  }
}

async function getAddresses(req, res) {
  try {
    const userId = req.user.id;
    const addresses = await db.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY id DESC', [userId]);
    return res.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return res.status(500).json({ message: 'Server error fetching addresses.' });
  }
}

module.exports = {
  createOrder,
  getOrders,
  addAddress,
  getAddresses
};
