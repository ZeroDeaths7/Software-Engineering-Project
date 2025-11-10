const express = require('express');
const db = require('../database');

const router = express.Router();

/**
 * GET /analytics - User analytics page
 * SMMS-F-013: Analytics counts
 * Shows: total posts, scheduled posts, published posts
 */
router.get('/', async (req, res) => {
  try {
    const analytics = await db.get(
      `SELECT
        (SELECT COUNT(*) FROM posts WHERE user_id = ?) as totalPosts,
        (SELECT COUNT(*) FROM posts WHERE user_id = ? AND status = 'published') as publishedPosts,
        (SELECT COUNT(*) FROM posts WHERE user_id = ? AND status = 'scheduled') as scheduledPosts,
        (SELECT COUNT(*) FROM posts WHERE user_id = ? AND status = 'draft') as draftPosts`,
      [req.session.userId, req.session.userId, req.session.userId, req.session.userId]
    );

    // Get posts breakdown by month
    const monthlyData = await db.all(
      `SELECT 
        strftime('%Y-%m', created_at) as month,
        status,
        COUNT(*) as count
       FROM posts
       WHERE user_id = ?
       GROUP BY strftime('%Y-%m', created_at), status
       ORDER BY month DESC
       LIMIT 12`,
      [req.session.userId]
    );

    res.render('analytics', {
      analytics,
      monthlyData,
      userEmail: req.session.userEmail,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).render('error', { message: 'Failed to load analytics.' });
  }
});

module.exports = router;
