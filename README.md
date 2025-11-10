# Social Media Management System (SMMS)

## Overview

A scalable web application for user registration, authentication, post creation/scheduling, and basic analytics. Built with Node.js, Express, SQLite, and Jest.

**Status**: 🎯 Base skeleton - Ready for feature development

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | 14+ |
| **Framework** | Express.js | 4.18+ |
| **Database** | SQLite3 | 5.1+ |
| **Authentication** | JWT | 9.0+ |
| **Security** | bcryptjs, Helmet | Latest |
| **Testing** | Jest | 29+ |
| **Rate Limiting** | express-rate-limit | 6.7+ |

## Project Structure

```
SMMS/
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI/CD pipeline configuration
├── src/
│   ├── config/
│   │   └── database.js            # SQLite connection
│   ├── controllers/               # Business logic
│   ├── middleware/                # Custom middleware
│   ├── models/                    # Database models
│   ├── routes/
│   │   └── health.js              # Health check route
│   ├── utils/                     # Utility functions
│   ├── app.js                     # Express app setup
│   └── index.js                   # Server entry point
├── tests/
│   ├── setup.js                   # Jest configuration
│   └── health.integration.test.js # Sample integration test
├── db/
│   └── smms.db                    # SQLite database (auto-created)
├── .env                           # Environment variables
├── .env.example                   # Example environment file
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies and scripts
├── jest.config.js                 # Jest configuration
└── README.md                      # This file
```

## Installation

### Prerequisites

- Node.js v14 or higher
- npm v6 or higher
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Software-Engineering-Project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Verify setup**
   ```bash
   npm run test
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```
- Starts server with nodemon (auto-restart on file changes)
- Server runs on `http://localhost:5000`

### Production Mode
```bash
npm start
```

## API Endpoints

### Base Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Welcome message and endpoints list |
| `GET` | `/api/health` | Server health check |

### Response Examples

**GET /api/health** (200 OK)
```json
{
  "status": "OK",
  "timestamp": "2025-11-10T12:30:45.123Z",
  "uptime": 123.456,
  "environment": "development",
  "version": "1.0.0"
}
```

**GET /** (200 OK)
```json
{
  "message": "Welcome to SMMS (Social Media Management System)",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "auth": "/api/auth",
    "posts": "/api/posts",
    "users": "/api/users",
    "analytics": "/api/analytics"
  }
}
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) includes:

1. **Build Stage**
   - Checkout code
   - Setup Node.js (16.x, 18.x, 20.x)
   - Install dependencies

2. **Test Stage**
   - Run unit tests
   - Run integration tests
   - Generate coverage reports
   - Upload to Codecov

3. **Lint Stage**
   - Check for syntax errors

4. **Security Stage**
   - Run npm audit
   - Check for vulnerable dependencies with Snyk

### Pipeline Triggers
- Push to `main`, `develop`, or `feature/**` branches
- Pull requests to `main` or `develop`

## Security Features

### Implemented
- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Request body size limits
- ✅ Environment variable management
- ✅ Error handling without stack traces in production

### Planned (Feature Branches)
- 🔒 JWT authentication (SMMS-F-002)
- 🔒 Password hashing with bcrypt (SMMS-SR-001)
- 🔒 SQL injection prevention (SMMS-SR-002)
- 🔒 Input validation (SMMS-SR-003)
- 🔒 Rate limiting on auth endpoints (SMMS-SR-005)

## Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_PATH=./db/smms.db

# Authentication (JWT)
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=3600

# CORS
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

## Development Workflow

### Feature Branch Pattern

1. **Create feature branch**
   ```bash
   git checkout -b feature/SMMS-XXX-description
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "Feat: Add new feature (SMMS-XXX)"
   ```

3. **Push and create PR**
   ```bash
   git push -u origin feature/SMMS-XXX-description
   ```

4. **PR Checks**
   - ✅ All CI/CD tests must pass
   - ✅ Code coverage maintained
   - ✅ Peer review approval required

5. **Merge to main**
   - Use "Squash and merge" for cleaner history

## Git Workflow

### Branches

- `main` - Production-ready code
- `develop` - Development branch (for future use)
- `feature/*` - Feature branches (SMMS-XXX-description)
- `bugfix/*` - Bug fix branches
- `Deployment` - Deployment branch

### Commit Messages

Follow this format:
```
Feat: Short description of feature (SMMS-XXX)
Fix: Short description of fix (SMMS-XXX)
Test: Short description of test (SMMS-XXX)
Docs: Short description of documentation
Chore: Short description of chore
```

## Requirements Coverage

### SMMS-F-001: User Registration
- Route placeholder: `/api/auth/register`
- Awaiting feature implementation on feature branch

### SMMS-F-002: User Login
- Route placeholder: `/api/auth/login`
- Awaiting feature implementation on feature branch
- Security requirements: SMMS-SR-001, SMMS-SR-002, SMMS-SR-003

### SMMS-F-003: Post Creation
- Route placeholder: `/api/posts`
- Awaiting feature implementation on feature branch

### Future Features
- Post scheduling
- Analytics dashboard
- User management (Admin)
- Content moderation

## Testing Strategy

### Unit Tests
- Test individual functions and methods
- Mock external dependencies
- Located in `tests/` or co-located with source

### Integration Tests
- Test API endpoints
- Test interactions between modules
- Use real database (in-memory for tests)

### System Tests
- End-to-end testing
- Full workflow validation
- Planned for later stages

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### Database Issues
```bash
# Remove old database and recreate
rm db/smms.db
npm start
```

### Node Modules Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Create a feature branch
2. Write tests for your changes
3. Ensure all tests pass: `npm test`
4. Commit with descriptive messages
5. Push and create a PR
6. Wait for CI/CD checks and reviews
7. Merge after approval

## License

ISC

## Contact

For questions or issues, please create a GitHub issue.

---

**Last Updated**: November 10, 2025  
**Version**: 1.0.0  
**Status**: Base skeleton ready for feature development
