# SMMS Developer Quick Reference Card

## Quick Commands

```bash
# Install & Start
npm install
mkdir public/uploads  # (Windows: New-Item -ItemType Directory -Path "public\uploads" -Force)
npm start             # Production mode
npm run dev          # Development (with auto-reload)

# Stop Server
Ctrl+C

# Database Reset
# Delete smms.db file, restart server

# Clear Packages
rm -r node_modules   # (Windows: rmdir /s /q node_modules)
npm install
```

## Project Structure at a Glance

```
CORE FILES:
  server.js          → Main Express app
  database.js        → SQLite utilities
  package.json       → Dependencies
  
ROUTES (API Endpoints):
  auth.js            → /auth (login, register, logout)
  posts.js           → /posts (CRUD operations)
  admin.js           → /admin (user management)
  dashboard.js       → /dashboard (stats)
  analytics.js       → /analytics (counts)
  
VIEWS (HTML Templates):
  login.ejs          → /auth/login
  register.ejs       → /auth/register
  dashboard.ejs      → /dashboard
  create-post.ejs    → /posts/create
  draft-posts.ejs    → /posts/drafts
  scheduled-posts.ejs → /posts/scheduled
  analytics.ejs      → /analytics
  admin-dashboard.ejs → /admin
  
STATIC:
  style.css          → Main stylesheet
  uploads/           → User images directory
```

## Common URLs

```
http://localhost:3000/                    Home (redirects to dashboard)
http://localhost:3000/auth/login          Login page
http://localhost:3000/auth/register       Registration page
http://localhost:3000/dashboard           Dashboard
http://localhost:3000/posts/create        Create post form
http://localhost:3000/posts/drafts        View drafts
http://localhost:3000/posts/scheduled     View scheduled/published
http://localhost:3000/analytics           Analytics
http://localhost:3000/admin               Admin panel
http://localhost:3000/auth/logout         Logout
```

## Default Admin Credentials

```
Email: admin@smms.local
Password: admin123
```

## Session & Security Settings

```javascript
// In server.js:
maxAge: 15 * 60 * 1000  // Session timeout (15 minutes)

// In database.js:
bcrypt.hash(password, 10)  // Password hashing cost factor

// In routes/posts.js:
limits: { fileSize: 5 * 1024 * 1024 }  // File upload limit (5MB)
```

## Database Tables

```sql
-- Users
CREATE TABLE users (
  id, email (UNIQUE), password_hash, role, is_active,
  created_at, updated_at
)

-- Posts
CREATE TABLE posts (
  id, user_id (FK), title, content, image_path,
  status (draft/scheduled/published), scheduled_time,
  published_at, created_at, updated_at
)

-- Sessions (for session management)
CREATE TABLE sessions (
  sid, data, expiresAt
)
```

## Key Code Snippets

### Check if User is Authenticated
```javascript
if (req.session && req.session.userId) {
  // User is logged in
}
```

### Check if User is Admin
```javascript
if (req.session.userRole === 'admin') {
  // User is admin
}
```

### Get User Info from Session
```javascript
req.session.userId       // Logged-in user ID
req.session.userEmail    // User email
req.session.userRole     // User role (admin/user)
```

### Database Query Examples

```javascript
// Get single row
const user = await db.get(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);

// Get multiple rows
const posts = await db.all(
  'SELECT * FROM posts WHERE user_id = ?',
  [userId]
);

// Insert
await db.run(
  'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
  [email, hashedPassword, 'user']
);

// Update
await db.run(
  'UPDATE posts SET status = ? WHERE id = ?',
  ['published', postId]
);

// Delete
await db.run('DELETE FROM posts WHERE id = ?', [postId]);
```

## Common Status Codes

```
200  OK - Request successful
201  Created - Resource created
400  Bad Request - Invalid input
403  Forbidden - Access denied
404  Not Found - Resource not found
500  Internal Server Error
```

## View Variables Available

```ejs
<!-- In any EJS view, these are available: -->
<%= userEmail %>         <!-- Current user email -->
<%= req.session.userRole %>  <!-- admin or user -->

<!-- Loop through data: -->
<% data.forEach(item => { %>
  <%= item.property %>
<% }); %>

<!-- Conditionals: -->
<% if (condition) { %>
  <p>True</p>
<% } else { %>
  <p>False</p>
<% } %>
```

## Common Tasks

### Add a New Route
```javascript
// In routes/example.js
router.get('/path', async (req, res) => {
  try {
    // Your logic here
    res.render('view-name', { data: data });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).render('error', { message: 'Error' });
  }
});
module.exports = router;

// In server.js, add:
const exampleRoutes = require('./routes/example');
app.use('/path', exampleRoutes);
```

### Create a New View
```ejs
<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav class="navbar">
    <!-- Navigation -->
  </nav>
  
  <div class="container">
    <!-- Content -->
  </div>
  
  <footer class="footer">
    <!-- Footer -->
  </footer>
</body>
</html>
```

### Add Input Validation
```javascript
const { body, validationResult } = require('express-validator');

router.post('/path', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('view', { errors: errors.array() });
  }
  // Process valid data
});
```

## Debugging Tips

### Console Logging
```javascript
console.log('Debug:', variable);
console.error('Error:', error);
```

### Browser DevTools (F12)
- Console: JavaScript errors
- Network: HTTP requests/responses
- Application: Cookies, LocalStorage, SessionStorage
- Elements: HTML inspection

### Check Session
```javascript
// In a route:
console.log(req.session);  // All session data
```

### Database Debugging
```javascript
// Check database connection:
db.all('SELECT COUNT(*) FROM posts', [], (err, rows) => {
  console.log('Posts count:', rows);
});
```

## Performance Tips

1. Use `.all()` for lists, `.get()` for single records
2. Add indexes to frequently queried columns
3. Use parameterized queries (already done)
4. Cache static files in public/
5. Minimize database queries in loops

## Security Reminders

✅ Always use parameterized queries (never concatenate SQL)  
✅ Always hash passwords (never store plain text)  
✅ Always validate input (both client and server)  
✅ Always escape HTML output  
✅ Always check authentication before sensitive operations  
✅ Never expose error details to users  
✅ Never trust user input  

## File Locations

```
Configuration:     .env, .gitignore, package.json
Main App:          server.js
Database:          database.js, smms.db
Routes:            routes/ directory
Views:             views/ directory
Styles:            public/style.css
Images:            public/uploads/
```

## Important Files to NOT Edit

```
.git/               ← Version control (use git commands)
node_modules/       ← Dependencies (use npm)
smms.db             ← Database (reset by deleting)
.gitignore          ← Git settings
```

## Testing Shortcuts

```bash
# Test login
curl -X POST http://localhost:3000/auth/login \
  -d "email=admin@smms.local&password=admin123"

# View user count
sqlite3 smms.db "SELECT COUNT(*) FROM users;"

# View posts
sqlite3 smms.db "SELECT id, status FROM posts;"
```

## Environment Variables (Optional)

Create `.env` file:
```
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secret-here
UPLOAD_LIMIT_MB=5
```

Then require in server.js:
```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| Cannot GET / | Not found | Check route exists |
| SQLITE_CANTOPEN | DB permission | Check directory writable |
| EADDRINUSE | Port in use | Change PORT or kill process |
| Unauthorized | Not logged in | Login first |
| Forbidden | Not admin | Admin only route |
| Invalid input | Validation failed | Check input requirements |

## File Size Limits

```
Passwords: min 6 chars, max 128
Post titles: max 200 chars
Post content: max 5000 chars
Images: max 5 MB
Email: standard RFC 5322
```

## Role Permissions

```
Regular User:
- Create/edit own posts
- View own posts
- View own analytics
- Cannot access admin panel

Admin User:
- All user permissions
- View all users
- Deactivate/activate users
- Promote/demote users
- Manual auto-publish
- View system statistics
```

## Useful npm Packages (Already Installed)

```
express              - Web framework
express-session      - Session management
sqlite3              - Database driver
bcrypt               - Password hashing
ejs                  - Template engine
multer               - File uploads
express-validator    - Input validation
```

## Useful npm Packages (For Future)

```
dotenv               - Environment variables
cors                 - Cross-origin requests
helmet               - Security headers
winston              - Logging
jest                 - Testing framework
supertest            - HTTP assertions
```

---

**Bookmark this card for quick reference!**

**Last Updated:** November 2025  
**Version:** 1.0.0
