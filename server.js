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

module.exports = app;
