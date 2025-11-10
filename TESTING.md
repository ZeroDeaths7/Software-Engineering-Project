# SMMS - Quick Testing Reference Guide

Based on Software Test Plan v1.0 (11-09-2025)

## Test Scenarios & Cases

### Authentication Tests (SMMS-F-001, F-002, F-003)

#### TC-Auth-01: User Registration
```
1. Go to http://localhost:3000/auth/register
2. Enter: test@example.com
3. Enter password: Test123 (must contain letters and numbers)
4. Confirm password: Test123
5. Click "Register"
✓ Expected: Success message, redirect to login
✗ Fail: Duplicate email, weak password, password mismatch
```

#### TC-Auth-02: User Login
```
1. Go to http://localhost:3000/auth/login
2. Enter: admin@smms.local
3. Enter password: admin123
4. Click "Login"
✓ Expected: Redirect to dashboard
✗ Fail: Invalid email/password, account deactivated
```

#### TC-Sec-01: Password Hashing
```
1. Login with admin@smms.local / admin123
2. Open browser DevTools (F12)
3. Go to Storage/Application → Cookies
4. View session cookie
✓ Expected: Password is NOT visible anywhere (hashed in database)
✗ Fail: Password visible in any request/response
```

### Post Management Tests (SMMS-F-005, F-006, F-007, F-012)

#### TC-Post-01: Create Post
```
1. Login to dashboard
2. Click "Create Post"
3. Title: "My First Post" (optional)
4. Content: "This is my first post"
5. Click "Create Post"
✓ Expected: Post created, redirect to dashboard
✗ Fail: Missing required fields, content too long
```

#### TC-Post-02: Upload Image
```
1. Go to Create Post
2. Fill title and content
3. Click "Choose File" for image
4. Select a JPEG/PNG/GIF file
5. Click "Create Post"
✓ Expected: Image uploaded and displayed
✗ Fail: Non-image files, files >5MB, wrong format
```

#### TC-Post-03: Save as Draft
```
1. Go to Create Post
2. Fill title and content (don't schedule)
3. Click "Save as Draft"
✓ Expected: Post saved as draft, appears in Drafts section
✗ Fail: Post not saved, appears in scheduled section
```

#### TC-Post-04: Edit/Delete Scheduled
```
1. Create a post and save as draft
2. Go to "Drafts" section
3. Click "Delete" on a draft
4. Confirm deletion
✓ Expected: Post deleted, no longer appears in lists
✗ Fail: Post still appears, error message
```

### Scheduling Tests (SMMS-F-008, F-009)

#### TC-Sched-01: Schedule Post
```
1. Create and save a draft post
2. Go to "Drafts"
3. Click "Schedule" on a post
4. Enter date/time: 2025-12-01T14:00
5. Click OK
✓ Expected: Post moved to scheduled section
✗ Fail: Invalid date format, past date accepted
```

#### TC-Sched-02: Auto-Publish
```
1. Create post scheduled for today/now
2. Go to Admin Panel (admin only)
3. Click "Auto-Publish Scheduled Posts"
✓ Expected: Post status changes to "published"
✗ Fail: Post status remains "scheduled"
```

### Viewing Tests (SMMS-F-010, F-011)

#### TC-View-01: View Scheduled Posts
```
1. Login to dashboard
2. Click "Posts" in navigation
3. Verify scheduled posts are listed
✓ Expected: All scheduled posts visible with date/time
✗ Fail: Posts missing, wrong status shown
```

#### TC-View-02: View Published Posts
```
1. Go to "Posts" section
2. Look for posts with "PUBLISHED" badge
✓ Expected: Published posts clearly marked
✗ Fail: Published posts not distinguished
```

### Analytics Tests (SMMS-F-013)

#### TC-Analy-01: Analytics Counts
```
1. Create 3 draft posts
2. Create 2 scheduled posts
3. Auto-publish 1 post
4. Go to Analytics
✓ Expected: Total=6, Published=1, Scheduled=1, Draft=3
✗ Fail: Wrong counts, missing metrics
```

### Admin Tests (SMMS-F-004, F-014)

#### TC-Admin-01: Admin Manage Users
```
1. Login as admin@smms.local
2. Click "Admin Panel"
3. View user list
✓ Expected: All users visible with status and role
✗ Fail: Users not listed, information incomplete
```

#### TC-Admin-02: Deactivate User
```
1. Go to Admin Panel
2. Click "Deactivate" on a user
3. Confirm action
4. Try to login as deactivated user
✓ Expected: Account deactivated, cannot login
✗ Fail: User still able to login
```

### Security Tests (SMMS-SR-001...005)

#### TC-Sec-02: Session Timeout
```
1. Login successfully
2. Leave browser idle for 15 minutes
3. Try to access dashboard
✓ Expected: Redirected to login (session expired)
✗ Fail: Access granted, session still active
```

#### TC-Sec-03: SQL Injection Prevention
```
1. Go to Login page
2. Email field: ' OR '1'='1
3. Password: anything
4. Try to login
✓ Expected: Login fails, no system error
✗ Fail: Injection works, database compromised
```

#### TC-Sec-04: XSS Prevention
```
1. Create a post with content: <script>alert('XSS')</script>
2. View the post
✓ Expected: Script tag displayed as text, no alert
✗ Fail: Alert popup appears (XSS vulnerability)
```

#### TC-Sec-05: Access Control
```
1. Login as regular user
2. Try to access /admin directly
✓ Expected: 403 Forbidden error, redirect
✗ Fail: Access granted to admin panel
```

### Performance Tests (SMMS-NF-001)

#### TC-Perf-01: Response Time
```
1. Measure response time for dashboard load
✓ Expected: <2 seconds
✗ Fail: Takes longer than 2 seconds
```

## Test Data Setup

### Test Users
```
Admin:
  Email: admin@smms.local
  Password: admin123
  Role: admin

User1:
  Email: user1@test.local
  Password: User123
  Role: user

User2:
  Email: user2@test.local
  Password: User123
  Role: user
```

### Sample Posts
```
Draft Post:
  Title: "Untitled Draft"
  Content: "This is still being written..."
  Status: draft

Scheduled Post:
  Title: "Future Announcement"
  Content: "This will be published soon!"
  Status: scheduled
  Time: 2025-12-15T10:00

Published Post:
  Title: "Live Now"
  Content: "This post has been published!"
  Status: published
```

## Browser Testing Checklist

- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Edge (Latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Regression Test Suite

Run these tests after any code changes:

1. **Authentication Flow**
   - [ ] Register new user
   - [ ] Login with valid credentials
   - [ ] Login with invalid credentials
   - [ ] Logout
   - [ ] Session timeout

2. **Post Operations**
   - [ ] Create post
   - [ ] Edit post
   - [ ] Delete post
   - [ ] Upload image
   - [ ] Save as draft
   - [ ] Schedule post

3. **Admin Operations**
   - [ ] View users
   - [ ] Deactivate user
   - [ ] Activate user
   - [ ] Promote user
   - [ ] Auto-publish posts

4. **Data Validation**
   - [ ] Email validation
   - [ ] Password validation
   - [ ] Content length validation
   - [ ] File upload validation
   - [ ] Date/time validation

5. **Security Checks**
   - [ ] Password hashing working
   - [ ] XSS prevention working
   - [ ] SQL injection prevention working
   - [ ] Session timeout working
   - [ ] Authorization working

## Defect Reporting Template

When you find a bug:

```
Bug ID: SMMS-BUG-XXX
Severity: Critical / High / Medium / Low
Component: [e.g., Authentication, Posts, Admin]
Title: [Brief description]

Steps to Reproduce:
1. [First step]
2. [Second step]
3. [Expected result]
4. [Actual result]

Environment: Windows/Mac/Linux, Chrome/Firefox
Database: Clean install / Existing data

Expected Behavior:
[What should happen]

Actual Behavior:
[What actually happened]

Screenshots/Logs:
[Attach if possible]
```

## Performance Benchmarks

Target metrics:
- Page load time: < 2 seconds
- Database query time: < 100ms
- Image upload: < 5 seconds (5MB file)
- Session creation: < 50ms

## Coverage Goals

- Functional requirements: 100%
- Security requirements: 100%
- Edge cases: 95%+
- Code coverage: 85%+

## Test Environment

- **Server:** localhost:3000
- **Database:** SQLite (smms.db)
- **Browser Cache:** Clear before each test session
- **Session:** 15 minutes timeout
- **File Upload Limit:** 5MB

## Known Limitations (Not in Scope)

- ❌ Real social media API integration
- ❌ Advanced engagement analytics
- ❌ Third-party authentication (OAuth)
- ❌ Email notifications
- ❌ Two-factor authentication
- ❌ Post scheduling via cron job (manual trigger only)

---

**Test Plan Reference:** STP v1.0 (11-09-2025)  
**Last Updated:** November 2025  
**Version:** 1.0.0
