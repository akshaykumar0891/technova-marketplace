const db = require('../config/db');

async function getDashboardStats(req, res) {
  try {
    // Total Revenue (excluding cancelled orders)
    const salesRes = await db.query("SELECT SUM(total_amount) as total_sales FROM orders WHERE status != 'Cancelled'");
    const totalSales = parseFloat(salesRes[0].total_sales || 0);

    // Total Orders count
    const ordersRes = await db.query("SELECT COUNT(*) as count FROM orders");
    const totalOrders = ordersRes[0].count;

    // Total Products count
    const productsRes = await db.query("SELECT COUNT(*) as count FROM products");
    const totalProducts = productsRes[0].count;

    // Total Customers count
    const usersRes = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    const totalUsers = usersRes[0].count;

    // Recent 5 Orders
    const recentOrders = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC 
      LIMIT 5
    `);

    // Inventory warning (products with stock < 5)
    const lowStockProducts = await db.query(`
      SELECT id, title, stock, price, brand 
      FROM products 
      WHERE stock < 5 
      ORDER BY stock ASC
    `);

    return res.json({
      stats: {
        totalSales,
        totalOrders,
        totalProducts,
        totalUsers
      },
      recentOrders,
      lowStockProducts
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Server error loading admin dashboard metrics.' });
  }
}

async function getUsers(req, res) {
  try {
    const users = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY role ASC, created_at DESC');
    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Server error loading users.' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // Prevent administrators from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Self-deletion is not permitted.' });
    }

    const result = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ message: 'User account deleted successfully.' });

  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Server error deleting user.' });
  }
}

async function createProduct(req, res) {
  try {
    const { category_id, title, description, price, brand, stock, image_url } = req.body;

    if (!category_id || !title || !price || stock === undefined) {
      return res.status(400).json({ message: 'Required fields: Category, Title, Price, and Stock.' });
    }

    const result = await db.query(
      'INSERT INTO products (category_id, title, description, price, brand, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [category_id, title, description || '', parseFloat(price), brand || '', parseInt(stock), image_url || '']
    );

    return res.status(201).json({
      message: 'Product created successfully.',
      productId: result.insertId
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Server error creating product.' });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { category_id, title, description, price, brand, stock, image_url } = req.body;

    if (!category_id || !title || !price || stock === undefined) {
      return res.status(400).json({ message: 'Required fields: Category, Title, Price, and Stock.' });
    }

    const result = await db.query(
      'UPDATE products SET category_id = ?, title = ?, description = ?, price = ?, brand = ?, stock = ?, image_url = ? WHERE id = ?',
      [category_id, title, description || '', parseFloat(price), brand || '', parseInt(stock), image_url || '', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.json({ message: 'Product updated successfully.' });

  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Server error updating product.' });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.json({ message: 'Product deleted successfully.' });

  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Server error deleting product.' });
  }
}

async function getAdminOrders(req, res) {
  try {
    // Fetch all orders
    const orders = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);

    if (orders.length === 0) {
      return res.json([]);
    }

    // Fetch all order items
    const orderItems = await db.query(`
      SELECT oi.*, p.title, p.image_url, p.brand 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id
    `);

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

    return res.json(Object.values(orderMap).sort((a, b) => b.id - a.id));

  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return res.status(500).json({ message: 'Server error loading order list.' });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status value.' });
    }

    const result = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    return res.json({ message: 'Order status updated successfully.' });

  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Server error updating order status.' });
  }
}

async function getDeactivationLogs(req, res) {
  try {
    const logs = await db.query('SELECT * FROM deactivation_logs ORDER BY created_at DESC');
    const deactivatedCountRes = await db.query("SELECT COUNT(*) as count FROM users WHERE status = 'deactivated'");
    const deactivatedCount = deactivatedCountRes[0].count;

    return res.json({
      logs,
      deactivatedCount
    });
  } catch (error) {
    console.error('Error fetching deactivation logs:', error);
    return res.status(500).json({ message: 'Server error loading deactivation logs.' });
  }
}

async function reactivateAccount(req, res) {
  try {
    const { id } = req.params; // Log ID

    // Fetch log details
    const logs = await db.query('SELECT * FROM deactivation_logs WHERE id = ?', [id]);
    if (logs.length === 0) {
      return res.status(404).json({ message: 'Log record not found.' });
    }

    const log = logs[0];
    if (!log.user_id) {
      return res.status(400).json({ message: 'Permanently deleted accounts cannot be reactivated.' });
    }

    // Toggle user status
    await db.query("UPDATE users SET status = 'active' WHERE id = ?", [log.user_id]);

    // Clear log
    await db.query('DELETE FROM deactivation_logs WHERE id = ?', [id]);

    return res.json({ message: 'User account reactivated successfully.' });

  } catch (error) {
    console.error('Error reactivating account:', error);
    return res.status(500).json({ message: 'Server error reactivating account.' });
  }
}

async function deleteDeactivationLog(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM deactivation_logs WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Log record not found.' });
    }

    return res.json({ message: 'Log record deleted from list.' });

  } catch (error) {
    console.error('Error deleting log:', error);
    return res.status(500).json({ message: 'Server error clearing log record.' });
  }
}

async function getAdminReviews(req, res) {
  try {
    const reviews = await db.query(`
      SELECT r.*, p.title as product_title 
      FROM reviews r 
      JOIN products p ON r.product_id = p.id 
      ORDER BY r.created_at DESC
    `);
    return res.json(reviews);
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return res.status(500).json({ message: 'Server error fetching reviews.' });
  }
}

async function deleteReview(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM reviews WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    return res.json({ message: 'Review deleted successfully.' });

  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ message: 'Server error deleting review.' });
  }
}

module.exports = {
  getDashboardStats,
  getUsers,
  deleteUser,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminOrders,
  updateOrderStatus,
  getDeactivationLogs,
  reactivateAccount,
  deleteDeactivationLog,
  getAdminReviews,
  deleteReview
};
