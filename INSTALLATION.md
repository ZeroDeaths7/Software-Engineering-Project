# SMMS Installation & Quick Start Guide

## System Requirements

- **Operating System:** Windows, macOS, or Linux
- **Node.js:** v14.0.0 or higher
- **npm:** v6.0.0 or higher
- **RAM:** Minimum 512 MB
- **Disk Space:** 500 MB minimum

## Installation Steps

### Step 1: Verify Node.js and npm Installation

Open PowerShell (Windows), Terminal (macOS), or Command Line (Linux) and run:

```bash
node --version
npm --version
```

If not installed, download from [https://nodejs.org/](https://nodejs.org/)

### Step 2: Navigate to Project Directory

```bash
cd c:\Users\mjeni\OneDrive\Desktop\Software-Engineering-Project
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`:
- express (web framework)
- express-session (session management)
- sqlite3 (database)
- bcrypt (password hashing)
- ejs (template engine)
- multer (file upload handling)
- express-validator (input validation)

### Step 4: Create Required Directories

```bash
# Create uploads directory for image storage
mkdir public/uploads
```

Or on Windows (if mkdir doesn't work):
```bash
New-Item -ItemType Directory -Path "public\uploads" -Force
```

### Step 5: Start the Application

**For development with auto-reload:**
```bash
npm run dev
```

**For production:**
```bash
npm start
```

The application will start on `http://localhost:3000`

### Step 6: Access the Application

1. Open your web browser (Chrome, Firefox, Safari, Edge)
2. Go to: `http://localhost:3000`
3. You will be automatically redirected to the login page

## First-Time Setup

### Admin Account (Pre-created)

**Email:** `admin@smms.local`  
**Password:** `admin123`

### Creating a New User Account

1. Click "Register here" on the login page
2. Enter a valid email address
3. Enter a password (minimum 6 characters, must contain letters and numbers)
4. Confirm the password
5. Click "Register"
6. You'll be redirected to login page
7. Login with your new credentials

## Project Structure Overview

```
Software-Engineering-Project/
├── server.js                    # Main application file
├── database.js                  # Database initialization
├── package.json                 # Dependencies list
├── README.md                    # Full documentation
├── INSTALLATION.md              # This file
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
│
├── routes/                      # API route handlers
│   ├── auth.js                 # Login/Register/Logout
│   ├── posts.js                # Post management
│   ├── admin.js                # Admin controls
│   ├── dashboard.js            # Dashboard
│   └── analytics.js            # Analytics
│
├── views/                       # HTML Templates (EJS)
│   ├── login.ejs               # Login page
│   ├── register.ejs            # Registration page
│   ├── dashboard.ejs           # Main dashboard
│   ├── create-post.ejs         # Post creation form
│   ├── draft-posts.ejs         # Draft posts list
│   ├── scheduled-posts.ejs     # Scheduled/published posts
│   ├── analytics.ejs           # Analytics page
│   ├── admin-dashboard.ejs     # Admin panel
│   ├── error.ejs               # Error page
│
├── public/                      # Static files
│   ├── style.css               # Main stylesheet
│   └── uploads/                # User-uploaded images
│
└── smms.db                      # SQLite database (auto-created)
```

## Troubleshooting

### Issue: "npm: command not found"
**Solution:** Node.js/npm not installed. Download from https://nodejs.org/

### Issue: "Cannot find module 'express'"
**Solution:** Run `npm install` in the project directory

### Issue: "SQLITE_CANTOPEN"
**Solution:** Ensure you're running from the correct directory. Database will auto-create.

### Issue: "Port 3000 already in use"
**Solution:** 
- Either stop the process using port 3000
- Or change PORT in server.js: `const PORT = 3001;`

### Issue: "Cannot POST /posts/create"
**Solution:** Make sure you're logged in first. The app requires authentication.

### Issue: File uploads not working
**Solution:** 
1. Ensure `public/uploads` directory exists
2. Check directory permissions (should be writable)
3. File must be an image (JPEG, PNG, GIF, WebP)
4. File size must be under 5MB

## Important Notes

### Security for Production

Before deploying to production:

1. **Change Session Secret:**
   Edit `server.js` line 23:
   ```javascript
   secret: 'change-this-to-a-very-long-random-string-in-production'
   ```

2. **Set HTTPS:**
   In `server.js` line 28:
   ```javascript
   secure: true, // Set to true if using HTTPS
   ```

3. **Use Environment Variables:**
   Create a `.env` file (based on `.env.example`) and load it

4. **Change Default Admin Password:**
   Login to admin account and update password (feature can be added)

5. **Database Backup:**
   Regularly backup `smms.db` file

### Default Session Timeout

Sessions expire after **15 minutes of inactivity**. This is configured in `server.js`:
```javascript
maxAge: 15 * 60 * 1000, // 15 minutes
```

### Database Reset

To reset the database and start fresh:

1. Stop the application (Press Ctrl+C)
2. Delete `smms.db` file
3. Restart the application
4. New database will be created with fresh admin account

## Development vs Production

### Development Mode (npm run dev)
- Auto-reloads on file changes
- Shows detailed error messages
- Uses in-memory session storage

### Production Mode (npm start)
- Optimized performance
- Minimal error details
- Use Redis for session storage (future enhancement)

## Next Steps After Installation

1. **Test with Admin Account:**
   - Login with admin@smms.local / admin123
   - Explore the admin panel
   - Check system statistics

2. **Create a User Account:**
   - Register a new user
   - Create and schedule a post
   - View analytics

3. **Read Documentation:**
   - Open `README.md` for full feature documentation
   - Check `SOFTWARE TEST PLAN.pdf` for testing guidelines

4. **Customize:**
   - Edit `public/style.css` to customize styling
   - Modify templates in `views/` directory
   - Update branding in `server.js` and views

## Getting Help

### Check Logs

If something goes wrong, check the console output:
- Error messages will appear in the terminal where you ran `npm start`
- Browser console (F12 → Console tab) may show JavaScript errors

### Common Commands

```bash
# Install dependencies
npm install

# Start application
npm start

# Start with auto-reload (development)
npm run dev

# Stop application
Ctrl+C (Press Ctrl and C together)

# Clear node_modules and reinstall
rm -r node_modules
npm install

# Check Node version
node -v

# Check npm version
npm -v
```

## Support Resources

- Node.js Documentation: https://nodejs.org/docs/
- Express.js Guide: https://expressjs.com/
- SQLite Documentation: https://www.sqlite.org/
- EJS Template Engine: https://ejs.co/

---

**Need help?** Refer to the README.md for comprehensive documentation or check the STP (Software Test Plan) document for testing procedures.

**Last Updated:** November 2025  
**Version:** 1.0.0
