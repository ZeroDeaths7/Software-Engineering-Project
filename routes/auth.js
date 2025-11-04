const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../database');

const router = express.Router();

/**
 * GET /auth/register - Display registration form
 */
router.get('/register', (req, res) => {
  res.render('register', { errors: [] });
});

/**
 * POST /auth/register - Handle user registration
 * SMMS-F-001: User registration
 */
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.')
      .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
      .withMessage('Password must contain both letters and numbers.'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('register', { errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await db.get(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser) {
        return res.render('register', {
          errors: [{ msg: 'Email already registered.' }],
        });
      }

      // Hash password (SMMS-SR-001: Password hashing)
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert new user
      await db.run(
        'INSERT INTO users (email, password_hash, role, is_active) VALUES (?, ?, ?, ?)',
        [email, passwordHash, 'user', 1]
      );

      res.redirect('/auth/login?registered=true');
    } catch (err) {
      console.error('Registration error:', err);
      res.render('register', {
        errors: [{ msg: 'An error occurred during registration.' }],
      });
    }
  }
);

/**
 * GET /auth/login - Display login form
 */
router.get('/login', (req, res) => {
  const registered = req.query.registered === 'true';
  res.render('login', { errors: [], registered });
});

/**
 * POST /auth/login - Handle user login
 * SMMS-F-002: User login
 * SMMS-SR-002: Session timeout implemented in server.js (15 minutes)
 * SMMS-SR-004: Authorization - only authenticated users can proceed
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address.'),
    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('login', {
        errors: errors.array(),
        registered: false,
      });
    }

    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await db.get(
        'SELECT id, email, password_hash, role, is_active FROM users WHERE email = ?',
        [email]
      );

      if (!user) {
        return res.render('login', {
          errors: [{ msg: 'Invalid email or password.' }],
          registered: false,
        });
      }

      // Check if account is active
      if (!user.is_active) {
        return res.render('login', {
          errors: [{ msg: 'Your account has been deactivated.' }],
          registered: false,
        });
      }

      // Verify password (SMMS-SR-001: Password hashing verification)
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return res.render('login', {
          errors: [{ msg: 'Invalid email or password.' }],
          registered: false,
        });
      }

      // Set session
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userRole = user.role;

      res.redirect('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      res.render('login', {
        errors: [{ msg: 'An error occurred during login.' }],
        registered: false,
      });
    }
  }
);

/**
 * GET /auth/logout - Handle user logout
 */
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;
