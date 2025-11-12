const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const logger = require('../utils/logger');
const backup = require('../utils/backup');
const path = require('path');

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
        logger.warn('Admin attempted to deactivate own account', { adminId: req.session.userId });
        return res.status(400).json({ error: 'Cannot deactivate your own account.' });
      }

      // Get user details
      const user = await db.get('SELECT id, email, role FROM users WHERE id = ?', [userId]);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Deactivate user
      await db.run(
        'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );

      logger.auth('User account deactivated by admin', {
        adminId: req.session.userId,
        targetUserId: userId,
        targetEmail: user.email,
      });

      res.json({ success: true, message: 'User account deactivated.' });
    } catch (err) {
      logger.error('Deactivation error', { error: err.message, adminId: req.session.userId });
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

      const user = await db.get('SELECT id, email FROM users WHERE id = ?', [userId]);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Activate user
      await db.run(
        'UPDATE users SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );

      logger.auth('User account activated by admin', {
        adminId: req.session.userId,
        targetUserId: userId,
        targetEmail: user.email,
      });

      res.json({ success: true, message: 'User account activated.' });
    } catch (err) {
      logger.error('Activation error', { error: err.message, adminId: req.session.userId });
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
    // Use same time format as scheduler (local time string)
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const localNow = `${pad(now.getFullYear())}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    logger.info('Admin manually triggered scheduled post publishing', {
      adminId: req.session.userId,
      currentTime: localNow,
    });

    const result = await db.run(
      `UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE status = 'scheduled' AND scheduled_time <= ?`,
      [localNow]
    );

    logger.info('Admin manual publish completed', {
      adminId: req.session.userId,
      postsPublished: result.changes,
    });

    res.json({
      success: true,
      message: result.changes > 0 
        ? `${result.changes} scheduled post${result.changes > 1 ? 's have' : ' has'} been published.`
        : 'No posts were ready to be published.',
      postsPublished: result.changes,
    });
  } catch (err) {
    logger.error('Auto-publish error', { error: err.message, adminId: req.session.userId });
    res.status(500).json({ error: 'Failed to publish scheduled posts.' });
  }
});

/**
 * POST /admin/backup - Create database backup
 * SMMS-NF-005: Manual database backup
 */
router.post('/backup', async (req, res) => {
  try {
    logger.info('Database backup initiated', { adminId: req.session.userId });
    const result = await backup.createBackup();

    if (result.success) {
      logger.info('Database backup created successfully', {
        adminId: req.session.userId,
        fileName: result.fileName,
        size: result.size,
      });
      res.json({
        success: true,
        message: 'Database backup created successfully.',
        fileName: result.fileName,
        size: result.size,
        timestamp: result.timestamp,
      });
    } else {
      logger.error('Database backup failed', { adminId: req.session.userId, error: result.error });
      res.status(500).json({ error: result.error || 'Failed to create backup.' });
    }
  } catch (err) {
    logger.error('Backup error', { error: err.message, adminId: req.session.userId });
    res.status(500).json({ error: 'Failed to create database backup.' });
  }
});

/**
 * GET /admin/backups - List all backups
 * SMMS-NF-005: View available backups
 */
router.get('/backups', (req, res) => {
  try {
    const backups = backup.listBackups();
    res.json({ success: true, backups });
  } catch (err) {
    logger.error('Error listing backups', { error: err.message });
    res.status(500).json({ error: 'Failed to list backups.' });
  }
});

/**
 * GET /admin/backup/download/:fileName - Download a backup file
 */
router.get('/backup/download/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(backup.BACKUP_DIR, fileName);

    // Security check: ensure filename doesn't contain path traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      logger.security('Attempted path traversal in backup download', {
        adminId: req.session.userId,
        fileName,
      });
      return res.status(403).json({ error: 'Invalid file name.' });
    }

    logger.info('Backup file downloaded', { adminId: req.session.userId, fileName });
    res.download(filePath, fileName, (err) => {
      if (err) {
        logger.error('Backup download error', { error: err.message, fileName });
        res.status(404).json({ error: 'Backup file not found.' });
      }
    });
  } catch (err) {
    logger.error('Backup download error', { error: err.message });
    res.status(500).json({ error: 'Failed to download backup.' });
  }
});

/**
 * DELETE /admin/backup/:fileName - Delete a backup file
 */
router.delete('/backup/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;

    // Security check: ensure filename doesn't contain path traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      logger.security('Attempted path traversal in backup deletion', {
        adminId: req.session.userId,
        fileName,
      });
      return res.status(403).json({ error: 'Invalid file name.' });
    }

    const result = backup.deleteBackup(fileName);

    if (result.success) {
      logger.info('Backup file deleted', { adminId: req.session.userId, fileName });
      res.json({ success: true, message: 'Backup deleted successfully.' });
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (err) {
    logger.error('Backup deletion error', { error: err.message });
    res.status(500).json({ error: 'Failed to delete backup.' });
  }
});

module.exports = router;
