# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-30 chars, alphanumeric)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "total_xp": 0,
      "current_streak": 0,
      "best_streak": 0
    },
    "token": "jwt-token-here"
  }
}
```

#### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "jwt-token-here"
  }
}
```

### Lessons

#### GET /api/lessons
Get all lessons with progress status (optional authentication).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Basic Addition",
      "description": "Learn the fundamentals of adding numbers",
      "difficulty_level": 1,
      "xp_reward": 10,
      "order_index": 1,
      "is_completed": true,
      "best_score": 100,
      "attempts_count": 1,
      "last_attempted_at": "2025-08-09T10:00:00Z",
      "completed_at": "2025-08-09T10:05:00Z"
    }
  ]
}
```

#### GET /api/lessons/:id
Get specific lesson with problems (no correct answers leaked).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Basic Addition",
    "description": "Learn the fundamentals of adding numbers",
    "difficulty_level": 1,
    "xp_reward": 10,
    "problems": [
      {
        "id": 1,
        "question": "What is 5 + 3?",
        "problem_type": "multiple_choice",
        "options": ["6", "7", "8", "9"],
        "order_index": 1
      }
    ],
    "is_completed": false,
    "best_score": 0,
    "attempts_count": 0
  }
}
```

#### POST /api/lessons/:id/submit
Submit answers for a lesson (requires authentication).

**Request Body:**
```json
{
  "attempt_id": "uuid-v4-string",
  "answers": {
    "1": "8",
    "2": "19",
    "3": "43"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "attempt_id": "uuid-v4-string",
    "score": 100,
    "xp_earned": 10,
    "is_completed": true,
    "correct_answers": 3,
    "total_problems": 3,
    "current_streak": 4,
    "total_xp": 160,
    "progress_percentage": 20
  }
}
```

### Profile

#### GET /api/profile
Get user profile with stats (requires authentication).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "total_xp": 160,
    "current_streak": 4,
    "best_streak": 5,
    "completed_lessons": 1,
    "total_lessons": 5,
    "progress_percentage": 20,
    "created_at": "2025-08-09T09:00:00Z",
    "updated_at": "2025-08-09T10:05:00Z"
  }
}
```

## Error Responses

### 400 - Validation Error
```json
{
  "error": "Validation Error",
  "message": "\"username\" is required",
  "details": [/* validation details */]
}
```

### 401 - Authentication Error
```json
{
  "error": "Authentication Error",
  "message": "Access token is required"
}
```

### 404 - Not Found
```json
{
  "error": "Not Found",
  "message": "Lesson not found"
}
```

### 409 - Conflict Error
```json
{
  "error": "Conflict Error",
  "message": "User with this email already exists"
}
```

### 422 - Validation Error
```json
{
  "error": "Validation Error",
  "message": "Referenced resource does not exist"
}
```

## Database Schema

### Tables
- **users**: User accounts and stats
- **lessons**: Learning lessons
- **problems**: Math problems for each lesson
- **user_lesson_progress**: User progress per lesson
- **lesson_attempts**: Individual lesson attempt records

## Features

- ✅ Transaction safety for XP updates
- ✅ Idempotent lesson submissions (using attempt_id)
- ✅ Proper error handling with clear HTTP status codes
- ✅ Input validation with Joi
- ✅ JWT authentication
- ✅ Progress tracking and streaks
- ✅ PostgreSQL with migrations and seeding
