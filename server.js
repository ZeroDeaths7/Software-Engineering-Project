const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 minutes session timeout
    },
  })
);

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.redirect('/auth/login');
  }
};

const isAdmin = (req, res, next) => {
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    next();
  } else {
    return res.status(403).render('error', { 
      message: 'Access Denied: Admin privileges required.' 
    });
  }
};

// Routes
app.use('/auth', authRoutes);
app.use('/posts', isAuthenticated, postRoutes);
app.use('/admin', isAuthenticated, isAdmin, adminRoutes);
app.use('/dashboard', isAuthenticated, dashboardRoutes);
app.use('/analytics', isAuthenticated, analyticsRoutes);

// Home route
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/auth/login');
  }
});

// 404 Error handler
app.use((req, res) => {
  res.status(404).render('error', { 
    message: 'Page not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).render('error', { 
    message: 'An internal server error occurred.' 
  });
});

// Initialize database and start server
db.initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`SMMS Server running on http://localhost:${PORT}`);
    console.log('Session timeout: 15 minutes');
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Auto-publish scheduler: runs every 10 seconds and publishes posts whose scheduled_time has passed
// This provides a responsive server-side scheduler so posts are published precisely when the time arrives.
setInterval(async () => {
  try {
    const now = new Date();
    // Format current time as YYYY-MM-DDTHH:MM:SS (local time, no timezone)
    const pad = (n) => String(n).padStart(2, '0');
    const localNow = `${pad(now.getFullYear())}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    // Get all scheduled posts for debug logging
    const scheduledPosts = await db.all(
      `SELECT id, title, scheduled_time, status FROM posts WHERE status = 'scheduled' ORDER BY scheduled_time ASC`
    );
    
    if (scheduledPosts && scheduledPosts.length > 0) {
      console.log(`[Scheduler] Current server time (local): ${localNow}`);
      console.log(`[Scheduler] Checking ${scheduledPosts.length} scheduled post(s):`);
      scheduledPosts.forEach(post => {
        const isPast = post.scheduled_time <= localNow;
        console.log(
          `  - Post ${post.id} "${post.title}": scheduled_time=${post.scheduled_time}, ready=${isPast}`
        );
      });
    }
    
    // Compare as strings since we're storing local time as ISO string
    // Only publish if the scheduled time is actually in the past (not just equal due to seconds truncation)
    const result = await db.run(
      `UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE status = 'scheduled' AND scheduled_time <= ?`,
      [localNow]
    );

    if (result && result.changes && result.changes > 0) {
      console.log(`[Scheduler] ✓ Auto-published ${result.changes} post(s) at ${new Date().toISOString()}`);
    }
  } catch (err) {
    console.error('[Scheduler] Auto-publish error:', err);
  }
}, 10 * 1000); // Check every 10 seconds for more responsive publishing

// Debug endpoint: manually check scheduler status and trigger publish
app.get('/debug/scheduler', async (req, res) => {
  try {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const localNow = `${pad(now.getFullYear())}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    console.log(`[Debug] Manual scheduler check at ${now.toISOString()}`);
    console.log(`[Debug] Local time string: ${localNow}`);
    
    // Get all scheduled posts
    const scheduledPosts = await db.all(
      `SELECT id, title, scheduled_time, status FROM posts WHERE status = 'scheduled' ORDER BY scheduled_time ASC`
    );
    
    console.log(`[Debug] Found ${scheduledPosts.length} scheduled posts`);
    scheduledPosts.forEach(post => {
      const isPast = post.scheduled_time <= localNow;
      console.log(
        `  - Post ${post.id}: scheduled=${post.scheduled_time}, isPast=${isPast}`
      );
    });
    
    // Manually run the update query
    const result = await db.run(
      `UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE status = 'scheduled' AND scheduled_time <= ?`,
      [localNow]
    );
    
    console.log(`[Debug] Published ${result.changes} posts in this manual trigger`);
    
    res.json({
      currentTime: now.toISOString(),
      localTimeString: localNow,
      scheduledPostsCount: scheduledPosts.length,
      scheduledPosts: scheduledPosts,
      publishResult: result,
      message: `Server time is ${now.toISOString()} (local: ${localNow}). Check console logs for details.`
    });
  } catch (err) {
    console.error('[Debug] Scheduler check error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
