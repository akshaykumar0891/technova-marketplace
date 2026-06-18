const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Email regex pattern for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check if user exists
    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role (elevate to admin if matching ADMIN_EMAIL env variable)
    const adminEmail = process.env.ADMIN_EMAIL;
    const role = (adminEmail && email.toLowerCase() === adminEmail.toLowerCase().trim()) ? 'admin' : 'customer';

    // Insert user
    const result = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    const userId = result.insertId;

    // Create JWT token
    const token = jwt.sign(
      { id: userId, email, role, name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user
    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Check if account is deactivated
    if (user.status === 'deactivated') {
      return res.status(403).json({ message: 'This account has been deactivated. Please contact support.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
}

async function getProfile(req, res) {
  try {
    const userId = req.user.id;

    // Fetch user details (excluding password)
    const users = await db.query('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = users[0];

    // Fetch saved addresses
    const addresses = await db.query('SELECT * FROM addresses WHERE user_id = ?', [userId]);

    return res.json({
      user,
      addresses
    });

  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ message: 'Server error fetching user profile.' });
  }
}

async function deactivateAccount(req, res) {
  try {
    const userId = req.user.id;
    const { password, reason, other_reason } = req.body;

    if (!password || !reason) {
      return res.status(400).json({ message: 'Password and reason are required.' });
    }

    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    // Set status to deactivated
    await db.query("UPDATE users SET status = 'deactivated' WHERE id = ?", [userId]);

    // Create log
    await db.query(
      "INSERT INTO deactivation_logs (user_id, name, email, type, reason, other_reason) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, user.name, user.email, 'deactivate', reason, other_reason || '']
    );

    return res.json({ message: 'Account deactivated successfully.' });

  } catch (error) {
    console.error('Deactivation error:', error);
    return res.status(500).json({ message: 'Server error during account deactivation.' });
  }
}

async function deleteAccount(req, res) {
  try {
    const userId = req.user.id;
    const { password, reason, other_reason } = req.body;

    if (!password || !reason) {
      return res.status(400).json({ message: 'Password and reason are required.' });
    }

    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    // Create log (user_id is NULL because the user record is deleted)
    await db.query(
      "INSERT INTO deactivation_logs (user_id, name, email, type, reason, other_reason) VALUES (NULL, ?, ?, ?, ?, ?)",
      [user.name, user.email, 'delete', reason, other_reason || '']
    );

    // Delete user (cascades to cart, addresses, orders)
    await db.query("DELETE FROM users WHERE id = ?", [userId]);

    return res.json({ message: 'Account deleted successfully.' });

  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ message: 'Server error during account deletion.' });
  }
}

async function requestPasswordOTP(req, res) {
  try {
    const userId = req.user.id;

    const users = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = users[0];

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.query('UPDATE users SET otp_code = ?, otp_expiry = ? WHERE id = ?', [otpCode, expiry, userId]);

    console.log('\n============================================================');
    console.log(`[GMAIL SIMULATOR] Sending verification email to: ${user.email}`);
    console.log('Subject: TechNova Password Change Verification Code');
    console.log(`Verification Code: ${otpCode}`);
    console.log('This code will expire in 10 minutes.');
    console.log('============================================================\n');

    return res.json({ 
      message: 'A verification OTP has been sent to your Gmail inbox (simulated in server console).',
      otp: otpCode 
    });

  } catch (error) {
    console.error('Request OTP error:', error);
    return res.status(500).json({ message: 'Server error generating OTP code.' });
  }
}

async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { mode, currentPassword, otp, newPassword } = req.body;

    if (!mode || !newPassword) {
      return res.status(400).json({ message: 'Mode and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = users[0];

    if (mode === 'current_password') {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect current password.' });
      }
    } else if (mode === 'otp') {
      if (!otp) {
        return res.status(400).json({ message: 'OTP is required.' });
      }
      if (!user.otp_code || user.otp_code !== otp) {
        return res.status(401).json({ message: 'Invalid OTP code.' });
      }
      if (new Date(user.otp_expiry) < new Date()) {
        return res.status(401).json({ message: 'OTP code has expired.' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid password change mode.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      'UPDATE users SET password = ?, otp_code = NULL, otp_expiry = NULL WHERE id = ?',
      [hashedPassword, userId]
    );

    return res.json({ message: 'Password updated successfully!' });

  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error updating password.' });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  deactivateAccount,
  deleteAccount,
  requestPasswordOTP,
  changePassword
};
