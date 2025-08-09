# Setup Instructions

## Prerequisites

1. **Node.js** (v16 or higher)
2. **PostgreSQL** (v12 or higher)
3. **npm** or **yarn**

## Quick Setup

### 1. Environment Configuration
Copy the environment template and configure your database:

```bash
copy .env.template .env
```

Edit `.env` file with your PostgreSQL connection details:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/math_learning_app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3000
NODE_ENV=development
```

### 2. Database Setup

Create the PostgreSQL database:
```sql
CREATE DATABASE math_learning_app;
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Database Migrations
```bash
npm run migrate
```

### 5. Seed the Database (Optional)
```bash
npm run seed
```

### 6. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

The API will be available at: `http://localhost:3000`

## API Documentation

### Interactive Swagger Documentation
Once the server is running, you can access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

This provides:
- Interactive API explorer
- Request/response schemas
- Example data
- Try-it-out functionality

### Static Documentation
- Full API documentation: `API_DOCS.md`
- OpenAPI specification: `swagger.yaml`

## Testing the API

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Lessons (with token)
```bash
curl -X GET http://localhost:3000/api/lessons \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Submit Lesson Answers
```bash
curl -X POST http://localhost:3000/api/lessons/1/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "attempt_id": "550e8400-e29b-41d4-a716-446655440000",
    "answers": {
      "1": "8",
      "2": "19", 
      "3": "43"
    }
  }'
```

### Get User Profile
```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Running Tests
```bash
npm test
```

## Project Structure

```
src/
├── config/
│   └── database.js          # Database connection
├── controllers/
│   ├── AuthController.js    # Authentication logic
│   ├── LessonController.js  # Lesson management
│   └── ProfileController.js # User profile
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── errorHandler.js     # Error handling
│   └── validation.js       # Request validation
├── migrations/
│   ├── migrate.js          # Migration runner
│   ├── schema.js           # Database schema
│   └── seed.js             # Sample data
├── models/
│   ├── User.js             # User model
│   ├── Lesson.js           # Lesson model
│   └── LessonAttempt.js    # Lesson attempt model
├── routes/
│   ├── auth.js             # Auth routes
│   ├── lessons.js          # Lesson routes
│   ├── profile.js          # Profile routes
│   └── index.js            # Route aggregator
├── validation/
│   └── schemas.js          # Joi validation schemas
└── server.js               # Main application
```

## Features Implemented

✅ **All Required Endpoints:**
- `GET /api/lessons` - Return lessons with completion/progress status
- `GET /api/lessons/:id` - Get lesson + problems (don't leak correct answers)
- `POST /api/lessons/:id/submit` - Submit answers with attempt_id (idempotent)
- `GET /api/profile` - Return user stats (total XP, current/best streak, progress %)

✅ **PostgreSQL Integration:**
- Proper migrations and seed script
- Transaction safety for XP updates
- Indexed database queries for performance

✅ **Validation & Error Handling:**
- Joi validation for all inputs
- Clear 400/422/409 error responses
- Proper HTTP status codes

✅ **Additional Features:**
- JWT authentication
- Password hashing with bcrypt
- CORS and security headers
- Comprehensive logging
- Idempotent submissions using attempt_id
- Progress tracking and streak system

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists
4. Check firewall/network settings

### Migration Errors
1. Ensure database user has CREATE privileges
2. Check if tables already exist
3. Verify database connection string

### Authentication Issues
1. Ensure JWT_SECRET is set in `.env`
2. Check token format in Authorization header
3. Verify token hasn't expired (24h default)
