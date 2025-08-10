const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Submission {
  /**
   * Create individual answer submissions for each problem
   * @param {Object} submissionData - Submission data
   * @param {string} submissionData.submissionId - Unique submission identifier
   * @param {string} submissionData.userId - User ID
   * @param {string} submissionData.lessonId - Lesson ID
   * @param {Array} submissionData.answers - Array of answers with problem_id and selected_option_id
   * @returns {Array} Created submission records
   */
  static async createSubmissions(submissionData) {
    const { submissionId, userId, lessonId, answers } = submissionData;
    console.log("Line15: Submission Data:", submissionData);
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Check if submissions already exist for this submission_id (idempotent)
      const existingSubmissions = await client.query(
        'SELECT * FROM submission WHERE submission_id = $1',
        [submissionId]
      );

      if (existingSubmissions.rows.length > 0) {
        await client.query('COMMIT');
        return existingSubmissions.rows;
      }

      const result = await client.query(`
          INSERT INTO submission (submission_id, user_id, lesson_id, submission_timestamp, submission_data)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
          RETURNING *
        `, [submissionId, userId, lessonId, JSON.stringify(answers)]);

      await client.query('COMMIT');
      return result.rows;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find submissions by submission ID
   * @param {string} submissionId - Submission ID
   * @returns {Array} Submission records
   */
  static async findBySubmissionId(submissionId) {
    const result = await db.query(
      'SELECT * FROM submission WHERE submission_id = $1 ORDER BY submission_timestamp',
      [submissionId]
    );
    return result.rows;
  }

  /**
   * Get user submissions for a specific lesson
   * @param {string} userId - User ID
   * @param {string} lessonId - Lesson ID (optional)
   * @returns {Array} User submissions
   */
  static async getUserSubmissions(userId, lessonId = null) {
    let query = `
      SELECT s.*, p.question
      FROM submission s
      LEFT JOIN problem p ON s.problem_id = p.problem_id
      WHERE s.user_id = $1
    `;
    let params = [userId];

    if (lessonId) {
      query += ' AND s.lesson_id = $2';
      params.push(lessonId);
    }

    query += ' ORDER BY s.submission_timestamp DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get all submissions for a lesson grouped by submission_id
   * @param {string} lessonId - Lesson ID
   * @returns {Object} Submissions grouped by submission_id
   */
  static async getLessonSubmissions(lessonId) {
    const result = await db.query(`
      SELECT s.*, p.question, u.username
      FROM submission s
      LEFT JOIN problem p ON s.problem_id = p.problem_id
      LEFT JOIN "user" u ON s.user_id = u.user_id
      WHERE s.lesson_id = $1
      ORDER BY s.submission_timestamp DESC
    `, [lessonId]);

    // Group by submission_id
    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.submission_id]) {
        grouped[row.submission_id] = {
          submission_id: row.submission_id,
          user_id: row.user_id,
          username: row.username,
          lesson_id: row.lesson_id,
          submission_timestamp: row.submission_timestamp,
          answers: []
        };
      }
      grouped[row.submission_id].answers.push({
        problem_id: row.problem_id,
        question: row.question
      });
    }

    return Object.values(grouped);
  }

  /**
   * Check if a submission exists
   * @param {string} submissionId - Submission ID
   * @returns {boolean} Whether submission exists
   */
  static async exists(submissionId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM submission WHERE submission_id = $1',
      [submissionId]
    );
    return parseInt(result.rows[0].count) > 0;
  }
}

module.exports = Submission;
