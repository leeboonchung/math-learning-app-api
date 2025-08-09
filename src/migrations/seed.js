const bcrypt = require('bcryptjs');
const db = require('../config/database');

const seedData = async () => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userResult = await client.query(`
      INSERT INTO users (username, email, password_hash, total_xp, current_streak, best_streak)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['testuser', 'test@example.com', hashedPassword, 150, 3, 5]);

    // Create sample lessons
    const lessons = [
      {
        title: 'Basic Addition',
        description: 'Learn the fundamentals of adding numbers',
        difficulty_level: 1,
        xp_reward: 10,
        order_index: 1
      },
      {
        title: 'Basic Subtraction',
        description: 'Master subtraction with simple problems',
        difficulty_level: 1,
        xp_reward: 10,
        order_index: 2
      },
      {
        title: 'Multiplication Tables',
        description: 'Practice multiplication with times tables',
        difficulty_level: 2,
        xp_reward: 15,
        order_index: 3
      },
      {
        title: 'Division Basics',
        description: 'Learn division through practical examples',
        difficulty_level: 2,
        xp_reward: 15,
        order_index: 4
      },
      {
        title: 'Fractions Introduction',
        description: 'Understanding fractions and basic operations',
        difficulty_level: 3,
        xp_reward: 20,
        order_index: 5
      }
    ];

    const lessonIds = [];
    for (const lesson of lessons) {
      const result = await client.query(`
        INSERT INTO lessons (title, description, difficulty_level, xp_reward, order_index)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [lesson.title, lesson.description, lesson.difficulty_level, lesson.xp_reward, lesson.order_index]);
      
      if (result.rows.length > 0) {
        lessonIds.push(result.rows[0].id);
      }
    }

    // Create problems for each lesson
    const problems = [
      // Basic Addition (lesson 1)
      {
        lesson_index: 0,
        question: 'What is 5 + 3?',
        correct_answer: '8',
        options: JSON.stringify(['6', '7', '8', '9']),
        order_index: 1
      },
      {
        lesson_index: 0,
        question: 'What is 12 + 7?',
        correct_answer: '19',
        options: JSON.stringify(['18', '19', '20', '21']),
        order_index: 2
      },
      {
        lesson_index: 0,
        question: 'What is 25 + 18?',
        correct_answer: '43',
        options: JSON.stringify(['41', '42', '43', '44']),
        order_index: 3
      },
      
      // Basic Subtraction (lesson 2)
      {
        lesson_index: 1,
        question: 'What is 10 - 4?',
        correct_answer: '6',
        options: JSON.stringify(['5', '6', '7', '8']),
        order_index: 1
      },
      {
        lesson_index: 1,
        question: 'What is 15 - 8?',
        correct_answer: '7',
        options: JSON.stringify(['6', '7', '8', '9']),
        order_index: 2
      },
      {
        lesson_index: 1,
        question: 'What is 23 - 9?',
        correct_answer: '14',
        options: JSON.stringify(['13', '14', '15', '16']),
        order_index: 3
      },
      
      // Multiplication Tables (lesson 3)
      {
        lesson_index: 2,
        question: 'What is 4 × 6?',
        correct_answer: '24',
        options: JSON.stringify(['22', '23', '24', '25']),
        order_index: 1
      },
      {
        lesson_index: 2,
        question: 'What is 7 × 8?',
        correct_answer: '56',
        options: JSON.stringify(['54', '55', '56', '57']),
        order_index: 2
      },
      {
        lesson_index: 2,
        question: 'What is 9 × 9?',
        correct_answer: '81',
        options: JSON.stringify(['79', '80', '81', '82']),
        order_index: 3
      },
      
      // Division Basics (lesson 4)
      {
        lesson_index: 3,
        question: 'What is 20 ÷ 4?',
        correct_answer: '5',
        options: JSON.stringify(['4', '5', '6', '7']),
        order_index: 1
      },
      {
        lesson_index: 3,
        question: 'What is 36 ÷ 6?',
        correct_answer: '6',
        options: JSON.stringify(['5', '6', '7', '8']),
        order_index: 2
      },
      {
        lesson_index: 3,
        question: 'What is 49 ÷ 7?',
        correct_answer: '7',
        options: JSON.stringify(['6', '7', '8', '9']),
        order_index: 3
      },
      
      // Fractions Introduction (lesson 5)
      {
        lesson_index: 4,
        question: 'What is 1/2 + 1/4?',
        correct_answer: '3/4',
        options: JSON.stringify(['1/2', '2/3', '3/4', '1/1']),
        order_index: 1
      },
      {
        lesson_index: 4,
        question: 'What is 2/3 - 1/6?',
        correct_answer: '1/2',
        options: JSON.stringify(['1/3', '1/2', '2/3', '5/6']),
        order_index: 2
      },
      {
        lesson_index: 4,
        question: 'What is 1/4 × 2?',
        correct_answer: '1/2',
        options: JSON.stringify(['1/8', '1/4', '1/2', '1/1']),
        order_index: 3
      }
    ];

    // Insert problems
    for (const problem of problems) {
      if (lessonIds[problem.lesson_index]) {
        await client.query(`
          INSERT INTO problems (lesson_id, question, correct_answer, options, order_index, problem_type)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          lessonIds[problem.lesson_index],
          problem.question,
          problem.correct_answer,
          problem.options,
          problem.order_index,
          'multiple_choice'
        ]);
      }
    }

    // Create some sample progress for the test user
    if (userResult.rows.length > 0 && lessonIds.length > 0) {
      const userId = userResult.rows[0].id;
      
      // Complete first lesson
      await client.query(`
        INSERT INTO user_lesson_progress (user_id, lesson_id, is_completed, best_score, attempts_count, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, lesson_id) DO NOTHING
      `, [userId, lessonIds[0], true, 100.00, 1, new Date()]);
      
      // Partial progress on second lesson
      await client.query(`
        INSERT INTO user_lesson_progress (user_id, lesson_id, is_completed, best_score, attempts_count, last_attempted_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, lesson_id) DO NOTHING
      `, [userId, lessonIds[1], false, 66.67, 2, new Date()]);
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const runSeed = async () => {
  try {
    console.log('Seeding database...');
    await seedData();
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSeed();
}

module.exports = { seedData };
