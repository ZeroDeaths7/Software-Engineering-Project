const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const db = require('../database');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * GET /posts/create - Display post creation form
 */
router.get('/create', (req, res) => {
  res.render('create-post', { errors: [] });
});

/**
 * POST /posts/create - Create a new post
 * SMMS-F-005: Create post
 * SMMS-F-006: Upload image
 * SMMS-SR-003: Input validation for XSS prevention
 */
router.post(
  '/create',
  upload.single('image'),
  [
    body('title')
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title must be less than 200 characters.')
      .escape(),
    body('content')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Content must be between 1 and 5000 characters.')
      .escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('create-post', { errors: errors.array() });
    }

    try {
      const { title, content, saveAs } = req.body;
      const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
      const status = saveAs === 'draft' ? 'draft' : 'scheduled';

      await db.run(
        `INSERT INTO posts (user_id, title, content, image_path, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [req.session.userId, title || null, content, imagePath, status]
      );

      res.redirect('/dashboard?created=true');
    } catch (err) {
      console.error('Post creation error:', err);
      res.render('create-post', {
        errors: [{ msg: 'An error occurred while creating the post.' }],
      });
    }
  }
);

/**
 * GET /posts/draft - View draft posts
 * SMMS-F-007: Save drafts
 */
router.get('/drafts', async (req, res) => {
  try {
    const posts = await db.all(
      `SELECT * FROM posts WHERE user_id = ? AND status = 'draft'
       ORDER BY created_at DESC`,
      [req.session.userId]
    );
    res.render('draft-posts', { posts });
  } catch (err) {
    console.error('Error fetching drafts:', err);
    res.status(500).render('error', { message: 'Failed to fetch draft posts.' });
  }
});

/**
 * GET /posts/scheduled - View scheduled posts
 * SMMS-F-008: Schedule posts
 * SMMS-F-010: View scheduled posts
 */
router.get('/scheduled', async (req, res) => {
  try {
    const posts = await db.all(
      `SELECT * FROM posts WHERE user_id = ? AND status IN ('scheduled', 'published')
       ORDER BY scheduled_time DESC`,
      [req.session.userId]
    );
    res.render('scheduled-posts', { posts });
  } catch (err) {
    console.error('Error fetching scheduled posts:', err);
    res.status(500).render('error', {
      message: 'Failed to fetch scheduled posts.',
    });
  }
});

/**
 * POST /posts/schedule - Schedule a post
 * SMMS-F-008: Schedule posts
 */
router.post(
  '/schedule',
  [
    body('postId')
      .isInt()
      .withMessage('Invalid post ID.'),
    body('scheduledTime')
      .isISO8601()
      .withMessage('Invalid date/time format.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    try {
      const { postId, scheduledTime } = req.body;

      // Verify post belongs to user
      const post = await db.get(
        'SELECT id FROM posts WHERE id = ? AND user_id = ?',
        [postId, req.session.userId]
      );

      if (!post) {
        return res.status(403).json({ error: 'Post not found or access denied.' });
      }

      // Update post with scheduled time and status
      await db.run(
        `UPDATE posts SET status = 'scheduled', scheduled_time = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [scheduledTime, postId]
      );

      res.json({ success: true, message: 'Post scheduled successfully.' });
    } catch (err) {
      console.error('Post scheduling error:', err);
      res.status(500).json({ error: 'Failed to schedule post.' });
    }
  }
);

/**
 * POST /posts/publish - Manually publish a scheduled post
 * SMMS-F-009: Auto-publish (can be triggered manually)
 */
router.post(
  '/publish',
  [
    body('postId')
      .isInt()
      .withMessage('Invalid post ID.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    try {
      const { postId } = req.body;

      // Verify post belongs to user
      const post = await db.get(
        'SELECT id FROM posts WHERE id = ? AND user_id = ?',
        [postId, req.session.userId]
      );

      if (!post) {
        return res.status(403).json({ error: 'Post not found or access denied.' });
      }

      // Update post status to published
      await db.run(
        `UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [postId]
      );

      res.json({ success: true, message: 'Post published successfully.' });
    } catch (err) {
      console.error('Post publishing error:', err);
      res.status(500).json({ error: 'Failed to publish post.' });
    }
  }
);

/**
 * POST /posts/edit - Edit a post
 * SMMS-F-012: Edit scheduled posts
 */
router.post(
  '/edit/:postId',
  [
    body('title')
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title must be less than 200 characters.')
      .escape(),
    body('content')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Content must be between 1 and 5000 characters.')
      .escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    try {
      const { postId } = req.params;
      const { title, content } = req.body;

      // Verify post belongs to user and is not published
      const post = await db.get(
        'SELECT id FROM posts WHERE id = ? AND user_id = ? AND status != ?',
        [postId, req.session.userId, 'published']
      );

      if (!post) {
        return res.status(403).json({
          error: 'Post not found, access denied, or cannot edit published posts.',
        });
      }

      await db.run(
        `UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [title || null, content, postId]
      );

      res.json({ success: true, message: 'Post updated successfully.' });
    } catch (err) {
      console.error('Post editing error:', err);
      res.status(500).json({ error: 'Failed to edit post.' });
    }
  }
);

/**
 * DELETE /posts/:postId - Delete a post
 * SMMS-F-012: Delete scheduled posts
 */
router.delete('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    // Verify post belongs to user and is not published
    const post = await db.get(
      'SELECT id FROM posts WHERE id = ? AND user_id = ? AND status != ?',
      [postId, req.session.userId, 'published']
    );

    if (!post) {
      return res.status(403).json({
        error: 'Post not found, access denied, or cannot delete published posts.',
      });
    }

    await db.run('DELETE FROM posts WHERE id = ?', [postId]);

    res.json({ success: true, message: 'Post deleted successfully.' });
  } catch (err) {
    console.error('Post deletion error:', err);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

/**
 * POST /posts/auto-publish - Auto-publish scheduled posts
 * SMMS-F-009: Auto-publish triggered by admin or scheduler
 * This simulates the auto-publish feature
 */
router.post('/auto-publish', async (req, res) => {
  try {
    // Update all posts where scheduled_time has passed
    const result = await db.run(
      `UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE status = 'scheduled' AND scheduled_time <= CURRENT_TIMESTAMP`
    );

    res.json({
      success: true,
      message: `${result.changes} posts auto-published.`,
      postsPublished: result.changes,
    });
  } catch (err) {
    console.error('Auto-publish error:', err);
    res.status(500).json({ error: 'Failed to auto-publish posts.' });
  }
});

module.exports = router;
