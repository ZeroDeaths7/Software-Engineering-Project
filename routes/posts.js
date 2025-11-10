const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const db = require('../database');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
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
    cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
  }
};

// Create error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).render('create-post', {
        errors: [{ msg: 'File size too large. Maximum size is 5MB.' }]
      });
    }
    return res.status(400).render('create-post', {
      errors: [{ msg: `Upload error: ${err.message}` }]
    });
  }
  if (err) {
    return res.status(400).render('create-post', {
      errors: [{ msg: err.message }]
    });
  }
  next();
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
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
  (req, res, next) => {
    if (req.fileValidationError) {
      return res.render('create-post', {
        errors: [{ msg: req.fileValidationError }]
      });
    }
    next();
  },
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
      const status = saveAs === 'draft' ? 'draft' : 'published';

      // Ensure the uploads directory exists
      const uploadsDir = path.join(__dirname, '../public/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      await db.run(
        `INSERT INTO posts (user_id, title, content, image_path, status, created_at, updated_at, published_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END)`,
        [req.session.userId, title || null, content, imagePath, status, status]
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
 * GET /posts/:postId - View a single post
 */
router.get('/:postId', async (req, res) => {
  try {
    const post = await db.get(
      `SELECT posts.*, users.email as username 
       FROM posts 
       JOIN users ON posts.user_id = users.id 
       WHERE posts.id = ? AND (posts.status = 'published' OR posts.user_id = ?)`,
      [req.params.postId, req.session.userId]
    );

    if (!post) {
      return res.status(404).render('error', { 
        message: 'Post not found or you don\'t have permission to view it.' 
      });
    }

    res.render('view-post', { post });
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).render('error', { 
      message: 'Failed to fetch post details.' 
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
 * GET /posts/edit/:postId - Display edit form
 */
router.get('/edit/:postId', async (req, res) => {
  try {
    const post = await db.get(
      'SELECT * FROM posts WHERE id = ? AND user_id = ?',
      [req.params.postId, req.session.userId]
    );

    if (!post) {
      return res.status(404).render('error', { 
        message: 'Post not found or you don\'t have permission to edit it.' 
      });
    }

    res.render('edit-post', { errors: [], post });
  } catch (err) {
    console.error('Error fetching post for edit:', err);
    res.status(500).render('error', { 
      message: 'Failed to fetch post for editing.' 
    });
  }
});

/**
 * POST /posts/edit/:postId - Save edited post
 * SMMS-F-012: Edit posts
 */
router.post(
  '/edit/:postId',
  upload.single('image'),
  (req, res, next) => {
    if (req.fileValidationError) {
      return res.render('edit-post', {
        errors: [{ msg: req.fileValidationError }],
        post: req.body
      });
    }
    next();
  },
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
    body('status')
      .isIn(['draft', 'scheduled', 'published'])
      .withMessage('Invalid status'),
    body('scheduledTime')
      .custom((value, { req }) => {
        // Only validate scheduledTime if status is 'scheduled'
        if (req.body.status === 'scheduled') {
          if (!value) {
            throw new Error('Scheduled time is required when status is scheduled');
          }
          // Check if it's a valid date
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid scheduled time format');
          }
        }
        return true;
      }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const post = await db.get('SELECT * FROM posts WHERE id = ?', [req.params.postId]);
      return res.render('edit-post', { 
        errors: errors.array(), 
        post: { ...post, ...req.body }
      });
    }

    try {
      const { postId } = req.params;
      const { title, content, status, scheduledTime, removeImage } = req.body;

      // Verify post belongs to user
      const post = await db.get(
        'SELECT * FROM posts WHERE id = ? AND user_id = ?',
        [postId, req.session.userId]
      );

      if (!post) {
        return res.status(403).render('error', {
          message: 'Post not found or access denied.',
        });
      }

      // Handle image upload or removal
      let imagePath = post.image_path;
      if (req.file) {
        imagePath = `/uploads/${req.file.filename}`;
      } else if (removeImage === 'true') {
        imagePath = null;
      }

      // Update post with new values
      await db.run(
        `UPDATE posts 
         SET title = ?, 
             content = ?, 
             status = ?,
             scheduled_time = CASE 
               WHEN ? = 'scheduled' THEN ?
               ELSE NULL
             END,
             published_at = CASE 
               WHEN ? = 'published' THEN CURRENT_TIMESTAMP
               ELSE published_at
             END,
             image_path = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          title || null,
          content,
          status,
          status,
          status === 'scheduled' ? scheduledTime : null,
          status,
          imagePath,
          postId
        ]
      );

      res.redirect('/posts/scheduled?updated=true');
    } catch (err) {
      console.error('Post editing error:', err);
      const post = await db.get('SELECT * FROM posts WHERE id = ?', [req.params.postId]);
      res.render('edit-post', {
        errors: [{ msg: 'Failed to edit post.' }],
        post: { ...post, ...req.body }
      });
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

    // Verify post belongs to user
    const post = await db.get(
      'SELECT id FROM posts WHERE id = ? AND user_id = ?',
      [postId, req.session.userId]
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
