# Math Learning App API

A Node.js REST API for a math learning application with PostgreSQL backend.

## Features

- User lesson management with progress tracking
- XP and streak system
- PostgreSQL database with migrations
- Input validation with Joi
- Transaction safety for critical operations
- Error handling with proper HTTP status codes
- **Swagger/OpenAPI documentation**

## API Endpoints

- `GET /api/lessons` - Get all lessons with progress status
- `GET /api/lessons/:id` - Get specific lesson with problems
- `POST /api/lessons/:id/submit` - Submit lesson answers
- `GET /api/profile` - Get user profile with stats
- `GET /api-docs` - **Interactive Swagger API Documentation**

## Documentation

### Interactive API Documentation
Visit `http://localhost:3000/api-docs` for interactive Swagger UI documentation where you can:
- Explore all API endpoints
- Test API calls directly from the browser
- View request/response schemas
- See example requests and responses

### Static Documentation
- `API_DOCS.md` - Comprehensive API documentation
- `swagger.yaml` - OpenAPI 3.0 specification file

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your database configuration:
```
DATABASE_URL=postgresql://username:password@localhost:5432/math_learning_app
JWT_SECRET=your-secret-key
PORT=3000
```

3. Run migrations:
```bash
npm run migrate
```

4. Seed the database:
```bash
npm run seed
```

5. Start the server:
```bash
npm run dev
```

6. **Access the API documentation:**
   - Interactive docs: `http://localhost:3000/api-docs`
   - API base URL: `http://localhost:3000/api`

## Database Schema

The application uses PostgreSQL with the following tables:
- `users` - User profiles and stats
- `lessons` - Learning lessons
- `problems` - Math problems for each lesson
- `user_lesson_progress` - Track user progress per lesson
- `lesson_attempts` - Individual lesson attempt records
