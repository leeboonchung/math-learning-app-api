const db = require('../config/database');

const createTables = async () => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        total_xp INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Lessons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        difficulty_level INTEGER NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
        xp_reward INTEGER DEFAULT 10,
        order_index INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Problems table
    await client.query(`
      CREATE TABLE IF NOT EXISTS problems (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        correct_answer VARCHAR(100) NOT NULL,
        problem_type VARCHAR(50) DEFAULT 'multiple_choice',
        options JSONB,
        order_index INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User lesson progress table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_lesson_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        is_completed BOOLEAN DEFAULT false,
        best_score DECIMAL(5,2) DEFAULT 0,
        attempts_count INTEGER DEFAULT 0,
        last_attempted_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, lesson_id)
      )
    `);

    // Lesson attempts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_attempts (
        id SERIAL PRIMARY KEY,
        attempt_id UUID UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        submitted_answers JSONB NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        xp_earned INTEGER DEFAULT 0,
        is_completed BOOLEAN DEFAULT false,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lesson_attempts_user_id ON lesson_attempts(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lesson_attempts_attempt_id ON lesson_attempts(attempt_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_problems_lesson_id ON problems(lesson_id);
    `);

    await client.query('COMMIT');
    console.log('Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const dropTables = async () => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    await client.query('DROP TABLE IF EXISTS lesson_attempts CASCADE');
    await client.query('DROP TABLE IF EXISTS user_lesson_progress CASCADE');
    await client.query('DROP TABLE IF EXISTS problems CASCADE');
    await client.query('DROP TABLE IF EXISTS lessons CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    
    await client.query('COMMIT');
    console.log('Database tables dropped successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createTables,
  dropTables
};
