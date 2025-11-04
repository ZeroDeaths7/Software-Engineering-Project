const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');

const router = express.Router();

/**
 * GET /admin - Admin dashboard
 * SMMS-F-014: Admin manage users
 * Only admins can access
 */
router.get('/', async (req, res) => {
  try {
    // Fetch all users
    const users = await db.all(
      'SELECT id, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );

    // Fetch system statistics
    const stats = await db.get(`
      SELECT
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as adminCount,
        (SELECT COUNT(*) FROM posts) as totalPosts,
        (SELECT COUNT(*) FROM posts WHERE status = 'published') as publishedPosts,
        (SELECT COUNT(*) FROM posts WHERE status = 'scheduled') as scheduledPosts,
        (SELECT COUNT(*) FROM posts WHERE status = 'draft') as draftPosts
    `);

    res.render('admin-dashboard', { users, stats });
  } catch (err) {
    console.error('Error fetching admin data:', err);
    res.status(500).render('error', { message: 'Failed to load admin dashboard.' });
  }
});

/**
 * POST /admin/deactivate - Deactivate a user account
 * SMMS-F-014: Admin manage users
 */
router.post(
  '/deactivate/:userId',
  [
    body('userId')
      .isInt()
      .withMessage('Invalid user ID.'),
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Prevent deactivating self
      if (parseInt(userId) === req.session.userId) {
        return res.status(400).json({ error: 'Cannot deactivate your own account.' });
      }

      // Prevent deactivating other admins (optional - can be removed if needed)
      const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Deactivate user
      await db.run(
        'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );

      res.json({ success: true, message: 'User account deactivated.' });
    } catch (err) {
      console.error('Deactivation error:', err);
      res.status(500).json({ error: 'Failed to deactivate user.' });
    }
  }
);

/**
 * POST /admin/activate - Activate a user account
 */
router.post(
  '/activate/:userId',
  [
    body('userId')
      .isInt()
      .withMessage('Invalid user ID.'),
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Activate user
      await db.run(
        'UPDATE users SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );

      res.json({ success: true, message: 'User account activated.' });
    } catch (err) {
      console.error('Activation error:', err);
      res.status(500).json({ error: 'Failed to activate user.' });
    }
  }
);

/**
 * POST /admin/promote - Promote a user to admin
 */
router.post(
  '/promote/:userId',
  [
    body('userId')
      .isInt()
      .withMessage('Invalid user ID.'),
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (user.role === 'admin') {
        return res.status(400).json({ error: 'User is already an admin.' });
      }

      await db.run(
        'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['admin', userId]
      );

      res.json({ success: true, message: 'User promoted to admin.' });
    } catch (err) {
      console.error('Promotion error:', err);
      res.status(500).json({ error: 'Failed to promote user.' });
    }
  }
);

/**
 * POST /admin/demote - Demote an admin to user
 */
router.post(
  '/demote/:userId',
  [
    body('userId')
      .isInt()
      .withMessage('Invalid user ID.'),
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Prevent demoting self
      if (parseInt(userId) === req.session.userId) {
        return res.status(400).json({ error: 'Cannot demote your own account.' });
      }

      const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (user.role !== 'admin') {
        return res.status(400).json({ error: 'User is not an admin.' });
      }

      await db.run(
        'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['user', userId]
      );

      res.json({ success: true, message: 'Admin demoted to user.' });
    } catch (err) {
      console.error('Demotion error:', err);
      res.status(500).json({ error: 'Failed to demote admin.' });
    }
  }
);

/**
 * POST /admin/publish-scheduled - Auto-publish scheduled posts
 * Manual trigger for auto-publish feature
 */
router.post('/publish-scheduled', async (req, res) => {
  try {
    const result = await db.run(
      `UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE status = 'scheduled' AND scheduled_time <= CURRENT_TIMESTAMP`
    );

    res.json({
      success: true,
      message: `${result.changes} scheduled posts have been published.`,
      postsPublished: result.changes,
    });
  } catch (err) {
    console.error('Auto-publish error:', err);
    res.status(500).json({ error: 'Failed to publish scheduled posts.' });
  }
});

module.exports = router;
