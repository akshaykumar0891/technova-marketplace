const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

let query;
let sqliteDb;
let mysqlPool;

if (DB_TYPE === 'sqlite') {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.resolve(__dirname, '../technova.db');
  
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err);
    } else {
      console.log(`SQLite database connected successfully at: ${dbPath}`);
      sqliteDb.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) console.error('Error enabling foreign keys in SQLite:', err);
      });
    }
  });

  query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      const cleanSql = sql.trim().toLowerCase();
      if (cleanSql.startsWith('select') || cleanSql.startsWith('pragma') || cleanSql.startsWith('show')) {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      } else {
        sqliteDb.run(sql, params, function(err) {
          if (err) return reject(err);
          resolve({
            insertId: this.lastID,
            affectedRows: this.changes
          });
        });
      }
    });
  };
} else {
  const mysql = require('mysql2/promise');
  
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'technova_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log('MySQL connection pool created.');

  query = async (sql, params = []) => {
    const [result] = await mysqlPool.execute(sql, params);
    return result;
  };
}

// Database Schema Migrations Setup
async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    
    const isSqlite = DB_TYPE === 'sqlite';
    const primaryKeyType = isSqlite ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT AUTO_INCREMENT PRIMARY KEY';
    const timestampType = isSqlite ? 'DATETIME DEFAULT CURRENT_TIMESTAMP' : 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';

    // 1. Create Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id ${primaryKeyType},
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer',
        created_at ${timestampType}
      )
    `);

    // Add status column to users table if missing (migration)
    try {
      await query(`ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active'`);
      console.log('Migrated: status column added to users table.');
    } catch (e) {
      // Column already exists, ignore error
    }

    // Add otp_code column to users table if missing (migration)
    try {
      await query(`ALTER TABLE users ADD COLUMN otp_code VARCHAR(10) DEFAULT NULL`);
      console.log('Migrated: otp_code column added to users table.');
    } catch (e) {
      // Column already exists, ignore error
    }

    // Add otp_expiry column to users table if missing (migration)
    try {
      await query(`ALTER TABLE users ADD COLUMN otp_expiry DATETIME DEFAULT NULL`);
      console.log('Migrated: otp_expiry column added to users table.');
    } catch (e) {
      // Column already exists, ignore error
    }

    // 2. Create Categories Table
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id ${primaryKeyType},
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL
      )
    `);

    // 3. Create Products Table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id ${primaryKeyType},
        category_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        brand VARCHAR(255),
        stock INTEGER DEFAULT 0,
        image_url TEXT,
        created_at ${timestampType},
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    // 4. Create Cart Table
    await query(`
      CREATE TABLE IF NOT EXISTS cart (
        id ${primaryKeyType},
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // 5. Create Orders Table
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id ${primaryKeyType},
        user_id INTEGER NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at ${timestampType},
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 6. Create Order Items Table
    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id ${primaryKeyType},
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // 7. Create Addresses Table
    await query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id ${primaryKeyType},
        user_id INTEGER NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 8. Create Deactivation Logs Table
    await query(`
      CREATE TABLE IF NOT EXISTS deactivation_logs (
        id ${primaryKeyType},
        user_id INTEGER NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'deactivate' or 'delete'
        reason VARCHAR(255) NOT NULL,
        other_reason TEXT,
        created_at ${timestampType}
      )
    `);

    // 9. Create Reviews Table
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id ${primaryKeyType},
        product_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        rating INTEGER NOT NULL, -- 1 to 5 stars
        title VARCHAR(255) NOT NULL,
        comment TEXT,
        image_url TEXT DEFAULT NULL,
        created_at ${timestampType},
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add image_url column to reviews table if missing (migration for existing dbs)
    try {
      await query(`ALTER TABLE reviews ADD COLUMN image_url TEXT DEFAULT NULL`);
      console.log('Migrated: image_url column added to reviews table.');
    } catch (e) {
      // Column already exists, ignore error
    }

    console.log('Database tables verified/created successfully.');
    
    // Seed default categories, products, and users if tables are empty
    await seedData();

  } catch (error) {
    console.error('Database schema initialization failed:', error);
  }
}

async function seedData() {
  try {
    // 1. Check if categories are empty
    const existingCategories = await query('SELECT count(*) as count FROM categories');
    const categoriesCount = existingCategories[0].count;

    if (categoriesCount === 0) {
      console.log('Seeding default categories...');
      await query("INSERT INTO categories (name, slug) VALUES ('Laptops', 'laptops')");
      await query("INSERT INTO categories (name, slug) VALUES ('Smartphones', 'smartphones')");
      await query("INSERT INTO categories (name, slug) VALUES ('Gaming', 'gaming')");
      await query("INSERT INTO categories (name, slug) VALUES ('Audio', 'audio')");
      await query("INSERT INTO categories (name, slug) VALUES ('Accessories', 'accessories')");
    }

    // Retrieve categories for product linking
    const categoriesList = await query('SELECT id, slug FROM categories');
    const categoryMap = {};
    categoriesList.forEach(c => {
      categoryMap[c.slug] = c.id;
    });

    // 2. Check if products are empty
    const existingProducts = await query('SELECT count(*) as count FROM products');
    const productsCount = existingProducts[0].count;

    if (productsCount === 0) {
      console.log('Seeding default products...');
      const seedProducts = [
        {
          category_id: categoryMap['laptops'],
          title: 'MacBook Pro 16" M3 Max',
          description: 'Apple M3 Max chip with 16‑core CPU, 40‑core GPU, 48GB unified memory, and 1TB SSD storage. Experience extreme performance and Liquid Retina XDR display.',
          price: 3499.00,
          brand: 'Apple',
          stock: 15,
          image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=600'
        },
        {
          category_id: categoryMap['laptops'],
          title: 'ASUS ROG Zephyrus G14',
          description: 'AMD Ryzen 9, NVIDIA GeForce RTX 4070, 16GB DDR5 RAM, 1TB PCIe SSD. Ultimate portable 14" gaming laptop with Nebula HDR display.',
          price: 1599.99,
          brand: 'ASUS',
          stock: 8,
          image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=600'
        },
        {
          category_id: categoryMap['laptops'],
          title: 'Dell XPS 15 9530',
          description: 'Intel Core i9 13th Gen, NVIDIA RTX 4060, 32GB RAM, 1TB SSD, 15.6" OLED Touch Display. Elegant design combined with creative powerhouse hardware.',
          price: 2199.00,
          brand: 'Dell',
          stock: 10,
          image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=600'
        },
        {
          category_id: categoryMap['smartphones'],
          title: 'iPhone 15 Pro Max',
          description: 'A17 Pro chip with 6-core GPU, titanium design, Action button, 48MP main camera, and 5x Telephoto optical zoom. Advanced smartphone photography.',
          price: 1199.00,
          brand: 'Apple',
          stock: 25,
          image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=600'
        },
        {
          category_id: categoryMap['smartphones'],
          title: 'Samsung Galaxy S24 Ultra',
          description: 'Snapdragon 8 Gen 3, 200MP camera, built-in S Pen, 12GB RAM, 256GB storage, and Galaxy AI features. The ultimate Android experience.',
          price: 1299.99,
          brand: 'Samsung',
          stock: 20,
          image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=600'
        },
        {
          category_id: categoryMap['gaming'],
          title: 'PlayStation 5 Console Slim',
          description: 'Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers, and 3D Audio.',
          price: 499.00,
          brand: 'Sony',
          stock: 12,
          image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=600'
        },
        {
          category_id: categoryMap['audio'],
          title: 'Sony WH-1000XM5 ANC Headphones',
          description: 'Industry-leading noise canceling overhead headphones with auto ANC optimizer, crystal clear hands-free calling, and 30-hour battery life.',
          price: 398.00,
          brand: 'Sony',
          stock: 30,
          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600'
        },
        {
          category_id: categoryMap['accessories'],
          title: 'Apple Watch Ultra 2',
          description: 'The most rugged and capable Apple Watch. Featuring a lightweight titanium case, extra-long battery life, and the brightest Always-On Retina display.',
          price: 799.00,
          brand: 'Apple',
          stock: 14,
          image_url: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=600'
        }
      ];

      for (const prod of seedProducts) {
        await query(
          'INSERT INTO products (category_id, title, description, price, brand, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [prod.category_id, prod.title, prod.description, prod.price, prod.brand, prod.stock, prod.image_url]
        );
      }
    }

    // 3. User accounts seeding removed for client deployment.

    // 4. Sample reviews seeding removed.

  } catch (error) {
    console.error('Data seeding failed:', error);
  }
}

module.exports = {
  query,
  initializeDatabase
};
