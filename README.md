# Social Media Management System (SMMS)

A complete web application for managing and scheduling social media posts with role-based access control.

## Project Information

**Version:** 1.0.0  
**Authors:** Mevin Jose, Prateek Meher, K Abhiram, K Rajeev  
**Date:** November 2025  
**Status:** Draft / For Review

## Features Implemented

### Authentication & Authorization (SMMS-F-001, F-002, F-004)
- ✅ User registration with email and password
- ✅ Secure login with session management
- ✅ Password hashing using bcrypt
- ✅ Role-based access control (Admin/User)
- ✅ Session timeout (15 minutes of inactivity)

### Post Management (SMMS-F-005, F-006, F-007, F-012)
- ✅ Create posts with text content
- ✅ Optional image upload with validation
- ✅ Save posts as drafts
- ✅ Edit and delete scheduled/draft posts
- ✅ Published posts cannot be edited/deleted

### Scheduling (SMMS-F-008, F-009)
- ✅ Schedule posts for future date/time
- ✅ Auto-publish functionality (manual trigger)
- ✅ Automatic status updates from scheduled to published

### Dashboard & Viewing (SMMS-F-010, F-011)
- ✅ User dashboard with quick actions
- ✅ View scheduled posts with date/time
- ✅ View published posts
- ✅ View draft posts

### Analytics (SMMS-F-013)
- ✅ Total post count
- ✅ Published post count
- ✅ Scheduled post count
- ✅ Draft post count
- ✅ Monthly activity breakdown

### Admin Features (SMMS-F-014)
- ✅ View all users
- ✅ Deactivate/activate user accounts
- ✅ Promote users to admin
- ✅ Demote admins to users
- ✅ Manual auto-publish trigger
- ✅ System statistics dashboard

### Security Requirements
- ✅ SMMS-SR-001: Password hashing with bcrypt
- ✅ SMMS-SR-002: Session timeout (15 minutes)
- ✅ SMMS-SR-003: Input validation & XSS prevention
- ✅ SMMS-SR-004: Role-based authorization
- ✅ SMMS-SR-005: SQL injection prevention

## Technology Stack

**Backend:**
- Node.js
- Express.js (4.18.2)
- SQLite3
- bcrypt for password hashing
- express-session for session management
- EJS for server-side templating
- express-validator for input validation

**Frontend:**
- HTML5
- CSS3 (responsive design)
- Vanilla JavaScript (no frameworks)

**Database:**
- SQLite

## Project Structure

```
software-engineering-project/
├── server.js                 # Main Express application
├── database.js              # Database initialization and utilities
├── package.json             # Project dependencies
├── README.md                # This file
├── .gitignore              # Git ignore rules
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── posts.js            # Post management routes
│   ├── admin.js            # Admin-only routes
│   ├── dashboard.js        # Dashboard routes
│   └── analytics.js        # Analytics routes
├── views/
│   ├── login.ejs           # Login page
│   ├── register.ejs        # Registration page
│   ├── dashboard.ejs       # User dashboard
│   ├── create-post.ejs     # Post creation form
│   ├── draft-posts.ejs     # Draft posts list
│   ├── scheduled-posts.ejs # Scheduled/published posts list
│   ├── analytics.ejs       # Analytics dashboard
│   ├── admin-dashboard.ejs # Admin panel
│   ├── error.ejs           # Error page
├── public/
│   ├── style.css           # Main stylesheet
│   └── uploads/            # User uploaded images
└── smms.db                 # SQLite database (auto-generated)
```

## Installation & Setup

### Prerequisites
- Node.js (v14+)
- npm (v6+)

### Steps

1. **Clone the repository:**
   ```bash
   cd c:\Users\mjeni\OneDrive\Desktop\Software-Engineering-Project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create public/uploads directory:**
   ```bash
   mkdir public/uploads
   ```

4. **Start the application:**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Open your browser and navigate to: `http://localhost:3000`
   - You will be redirected to the login page

## Demo Credentials

**Admin Account:**
- Email: `admin@smms.local`
- Password: `admin123`

## User Guide

### For Regular Users

1. **Register:** Click "Register here" on the login page
2. **Create Post:** Navigate to "Create Post" and fill in the form
3. **Save Draft:** Submit with "Save as Draft" button
4. **Schedule Post:** Move posts to "Posts" section and set schedule time
5. **View Analytics:** Check your post statistics in "Analytics"

### For Admins

1. **Access Admin Panel:** Click "Admin Panel" in the navigation
2. **Manage Users:** View, deactivate, or promote users
3. **Auto-Publish:** Click "Auto-Publish Scheduled Posts" to publish ready posts
4. **System Stats:** View overall system statistics

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/logout` - Logout user

### Posts
- `GET /posts/create` - Create post form
- `POST /posts/create` - Submit new post
- `GET /posts/drafts` - View draft posts
- `GET /posts/scheduled` - View scheduled/published posts
- `POST /posts/schedule` - Schedule a post
- `POST /posts/publish` - Manually publish a post
- `POST /posts/edit/:postId` - Edit a post
- `DELETE /posts/:postId` - Delete a post
- `POST /posts/auto-publish` - Auto-publish scheduled posts

### Admin
- `GET /admin` - Admin dashboard
- `POST /admin/deactivate/:userId` - Deactivate user
- `POST /admin/activate/:userId` - Activate user
- `POST /admin/promote/:userId` - Promote to admin
- `POST /admin/demote/:userId` - Demote from admin
- `POST /admin/publish-scheduled` - Auto-publish posts

### Dashboard & Analytics
- `GET /dashboard` - User dashboard
- `GET /analytics` - Analytics dashboard

## Security Considerations

1. **Password Security:** All passwords are hashed using bcrypt with a cost factor of 10
2. **Session Security:** Sessions are HTTP-only and expire after 15 minutes of inactivity
3. **Input Validation:** All user inputs are validated and escaped to prevent XSS
4. **SQL Injection Prevention:** Using parameterized queries throughout
5. **CSRF Protection:** Session tokens are used for state management
6. **File Upload Security:** Only image files are allowed, with size limits

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password_hash` - Hashed password
- `role` - 'admin' or 'user'
- `is_active` - Account status
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp

### Posts Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `title` - Post title (optional)
- `content` - Post content
- `image_path` - Path to uploaded image
- `status` - 'draft', 'scheduled', or 'published'
- `scheduled_time` - Scheduled publication time
- `published_at` - Actual publication time
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Register new user with valid email and password
- [ ] Login with incorrect credentials (should fail)
- [ ] Login with correct credentials (should succeed)
- [ ] Verify session timeout after 15 minutes
- [ ] Logout and verify redirect to login

**Posts:**
- [ ] Create post with text only
- [ ] Create post with image upload
- [ ] Save post as draft
- [ ] Schedule post for future date
- [ ] Edit draft post
- [ ] Delete draft post
- [ ] Cannot edit published post

**Admin:**
- [ ] Access admin panel (admin only)
- [ ] Deactivate user account
- [ ] Activate deactivated user
- [ ] Promote user to admin
- [ ] Demote admin to user
- [ ] Auto-publish scheduled posts

**Analytics:**
- [ ] View post statistics
- [ ] Verify correct counts
- [ ] Check monthly breakdown

## Performance Considerations

- Database queries are optimized with proper indexing
- File uploads are limited to 5MB
- Sessions are stored in memory (can be upgraded to Redis for production)
- Static assets are cached through browser caching

## Future Enhancements

- [ ] Real social media API integration
- [ ] Advanced analytics with engagement metrics
- [ ] Post templates
- [ ] Bulk post scheduling
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] OAuth integration
- [ ] Database backup automation
- [ ] Post preview before publishing
- [ ] Collaborative features

## Troubleshooting

### Database errors
- Delete `smms.db` and restart the application to reset database
- Ensure the `public/uploads` directory exists and is writable

### Session timeout issues
- Clear browser cookies
- Check system time is correct
- Verify session timeout setting in `server.js`

### File upload errors
- Ensure `public/uploads` directory has write permissions
- Check file size is under 5MB
- Verify file type is an image

## Support & Contact

For issues or questions, please refer to the Software Test Plan (STP) documentation included with this project.

## License

MIT License - See LICENSE file for details

## Version History

**v1.0.0 (November 2025)**
- Initial release with all core features
- Complete security implementation
- Full admin panel
- Analytics dashboard
