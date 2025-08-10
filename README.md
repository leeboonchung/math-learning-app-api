# Math Learning App API

A comprehensive Node.js REST API for a math learning application with PostgreSQL backend, featuring user authentication, lesson management, submission tracking, and progress analytics.

## 🚀 Features

### Core Functionality
- **User Authentication** - JWT-based authentication with bcrypt password hashing
- **Lesson Management** - Complete CRUD operations for math lessons with problems and multiple-choice options
- **Submission Tracking** - Individual answer submission tracking with detailed progress analytics
- **Progress Analytics** - XP system, streak tracking, and comprehensive learning statistics
- **Service Layer Architecture** - Clean separation of concerns with dedicated service classes

### Technical Features
- **PostgreSQL Database** - Robust relational database with proper normalization
- **UUID/GUID Support** - All entities use UUIDs for better security and scalability
- **Input Validation** - Comprehensive validation using Joi schemas
- **Transaction Safety** - Database transactions for critical operations
- **Error Handling** - Proper HTTP status codes and detailed error messages
- **CORS Support** - Configured for cross-origin requests from frontend applications
- **Swagger Documentation** - Interactive OpenAPI 3.0 documentation
- **Vercel Deployment** - Ready for serverless deployment

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Lessons
- `GET /api/lessons` - Get all lessons with optional user progress
- `GET /api/lessons/:id` - Get specific lesson with problems and options
- `POST /api/lessons/:id/submit` - Submit lesson answers (new normalized format)
- `GET /api/lessons/:id/attempts` - Get user progress and submissions for a lesson

### User Profile
- `GET /api/profile` - Get user profile with comprehensive statistics

### Documentation
- `GET /api-docs` - **Interactive Swagger UI Documentation**

## 🛠️ Setup and Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database (local or cloud-hosted like Supabase)
- npm or yarn package manager

### Local Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/leeboonchung/math-learning-app-api.git
cd math-learning-app-api
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment Configuration:**
Create a `.env` file in the root directory:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/math_learning_app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: Supabase Configuration (if using Supabase)
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

4. **Database Setup:**
```bash
# Run database migrations
npm run migrate

# Seed the database with sample data
npm run seed
```

5. **Start the development server:**
```bash
npm start
# or for development with auto-reload
npm run dev
```

6. **Access the application:**
   - **API Base URL:** `http://localhost:3000/api`
   - **Interactive Documentation:** `http://localhost:3000/api-docs`
   - **Health Check:** `http://localhost:3000/api/health`

## 🌐 Deployment

### Vercel Deployment

The application is configured for easy deployment on Vercel:

1. **Push to GitHub** and connect your repository to Vercel
2. **Set Environment Variables** in Vercel dashboard:
   ```
   DATABASE_URL=your-production-database-url
   JWT_SECRET=your-production-jwt-secret
   NODE_ENV=production
   ```
3. **Deploy** - Vercel will automatically deploy using the `vercel.json` configuration

### Manual Deployment

For other platforms:
```bash
# Build and start
npm install --production
npm start
```

## 🗄️ Database Schema

### Current Schema (Updated)
The application uses a normalized PostgreSQL schema:

#### Core Tables
- **`user`** - User accounts with authentication and statistics
  - `user_id` (UUID), `username`, `email`, `password_hash`
  - `total_xp`, `current_streak`, `best_streak`

- **`lesson`** - Learning lessons and categories
  - `lesson_id` (UUID), `lesson_name`, `lesson_category`
  - `difficulty_level`, `xp_reward`

- **`problem`** - Math problems within lessons
  - `problem_id` (UUID), `lesson_id`, `question`
  - `correct_answer`, `explanation`

- **`problem_option`** - Multiple choice options for problems
  - `problem_option_id` (UUID), `problem_id`, `option`
  - `is_right_answer`

#### Progress Tracking (New Schema)
- **`submission`** - Individual answer submissions (normalized)
  - `submission_id` (UUID), `user_id`, `lesson_id`, `problem_id`
  - `selected_option_id`, `submission_timestamp`

- **`user_progress`** - Lesson-level progress and scoring
  - `user_id`, `lesson_id`, `score`, `lesson_exp_earned`
  - `completion_date`, `progress` status

## 🏗️ Architecture

### Service Layer Pattern
```
Controllers → Services → Models → Database
```

- **Controllers** (`src/controllers/`) - HTTP request/response handling
- **Services** (`src/services/`) - Business logic and orchestration
- **Models** (`src/models/`) - Database interaction layer
- **Middleware** (`src/middleware/`) - Authentication, validation, error handling

### Key Services
- **AuthService** - Authentication and user management
- **LessonService** - Lesson management and submission processing
- **UserService** - User analytics and progress tracking
- **DatabaseService** - Database connection and query management

## 📝 API Usage Examples

### User Registration
```javascript
POST /api/auth/register
{
  "username": "student123",
  "email": "student@example.com",
  "password": "securepassword"
}
```

### Submit Lesson Answers (New Format)
```javascript
POST /api/lessons/{lessonId}/submit
Authorization: Bearer {jwt-token}
{
  "submission_id": "uuid-v4-string",
  "lesson_id": "lesson-uuid",
  "answers": [
    {
      "problem_id": "problem-uuid-1",
      "selected_option_id": "option-uuid-1"
    },
    {
      "problem_id": "problem-uuid-2", 
      "selected_option_id": "option-uuid-2"
    }
  ]
}
```

## 🔧 Development Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload
npm run migrate    # Run database migrations
npm run seed       # Seed database with sample data
npm test           # Run test suite
npm run lint       # Run ESLint
```

## 📚 Documentation

- **Interactive API Docs:** `http://localhost:3000/api-docs` (Swagger UI)
- **API Documentation:** `API_DOCS.md`
- **Setup Guide:** `SETUP.md`
- **Deployment Guide:** `VERCEL_DEPLOYMENT.md`
- **Database Troubleshooting:** `DATABASE_TROUBLESHOOTING.md`

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Joi schema validation for all endpoints
- **CORS Configuration** - Proper cross-origin resource sharing setup
- **UUID Identifiers** - UUIDs prevent enumeration attacks
- **SQL Injection Protection** - Parameterized queries throughout

## 🚀 Recent Updates

### Version 2.0 Features
- **Normalized Submission Schema** - Individual answer tracking for better analytics
- **Enhanced Progress Tracking** - Separate submission and progress models
- **CORS Configuration** - Improved frontend integration support
- **Service Layer Refactoring** - Cleaner architecture with better separation of concerns
- **UUID Migration** - All entities now use UUIDs for better security
- **Vercel Deployment** - Optimized for serverless deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the API documentation at `/api-docs`
