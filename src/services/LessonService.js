const Lesson = require('../models/Lesson');
const LessonAttempt = require('../models/LessonAttempt');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class LessonService {
  /**
   * Get all lessons with optional user progress
   * @param {number|null} userId - User ID for progress tracking
   * @returns {Array} List of lessons with progress information
   */
  static async getAllLessons(userId = null) {
    try {
      const lessons = await Lesson.findAll(userId);
      return lessons;
    } catch (error) {
      const serviceError = new Error('Failed to retrieve lessons');
      serviceError.code = 'LESSONS_FETCH_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }

  /**
   * Get a specific lesson by ID with problems
   * @param {number} lessonId - Lesson ID
   * @param {number|null} userId - User ID for progress tracking
   * @returns {Object} Lesson with problems and progress data
   */
  static async getLessonById(lessonId) {
    try {
      let lesson;
      
    lesson = await Lesson.findById(lessonId, true);
    if (lesson) {
        // Add default progress data for non-authenticated users
        lesson.is_completed = false;
        lesson.best_score = 0;
        lesson.attempts_count = 0;
        lesson.last_attempted_at = null;
        lesson.completed_at = null;
    }

      if (!lesson) {
        const error = new Error('Lesson not found');
        error.code = 'LESSON_NOT_FOUND';
        error.statusCode = 404;
        throw error;
      }

      return lesson;
    } catch (error) {
      if (error.statusCode) {
        throw error; // Re-throw known errors
      }
      
      const serviceError = new Error('Failed to retrieve lesson');
      serviceError.code = 'LESSON_FETCH_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }

  /**
   * Submit answers for a lesson
   * @param {number} lessonId - Lesson ID
   * @param {number} userId - User ID
   * @param {string} attemptId - Unique attempt identifier
   * @param {Object} answers - Map of problem_id to answer
   * @returns {Object} Submission result with score, XP, and progress
   */
  static async submitAnswers(lessonId, userId, attemptId, answers) {
    try {
      // Validate attempt ID format
      if (!this.isValidUUID(attemptId)) {
        const error = new Error('Invalid attempt ID format');
        error.code = 'INVALID_ATTEMPT_ID';
        error.statusCode = 400;
        throw error;
      }

      // Check if this attempt was already processed (idempotent)
      const existingAttempt = await LessonAttempt.findByAttemptId(attemptId);
      if (existingAttempt) {
        // Return the existing attempt result
        const userStats = await User.getStats(userId);
        return {
          attempt_id: existingAttempt.attempt_id,
          score: parseFloat(existingAttempt.score),
          xp_earned: existingAttempt.xp_earned,
          is_completed: existingAttempt.is_completed,
          current_streak: userStats.current_streak,
          total_xp: userStats.total_xp,
          progress_percentage: userStats.progress_percentage,
          is_duplicate: true
        };
      }

      // Verify lesson exists
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        const error = new Error('Lesson not found');
        error.code = 'LESSON_NOT_FOUND';
        error.statusCode = 404;
        throw error;
      }

      // Get problems with correct answers for grading
      const problems = await Lesson.getProblemsWithAnswers(lessonId);
      if (problems.length === 0) {
        const error = new Error('Lesson has no problems to grade');
        error.code = 'NO_PROBLEMS_FOUND';
        error.statusCode = 422;
        throw error;
      }

      // Grade the answers
      const gradingResult = this.gradeAnswers(problems, answers);
      
      // Calculate XP and completion status
      const score = gradingResult.score;
      const isCompleted = score >= 70; // 70% threshold for completion
      const xpEarned = this.calculateXP(lesson.xp_reward, score, isCompleted);

      // Create lesson attempt record
      const attemptData = {
        attemptId,
        userId,
        lessonId,
        submittedAnswers: gradingResult.gradedAnswers,
        score,
        xpEarned,
        isCompleted
      };

      await LessonAttempt.create(attemptData);

      // Get updated user stats
      const userStats = await User.getStats(userId);

      return {
        attempt_id: attemptId,
        score,
        xp_earned: xpEarned,
        is_completed: isCompleted,
        correct_answers: gradingResult.correctAnswers,
        total_problems: problems.length,
        current_streak: userStats.current_streak,
        total_xp: userStats.total_xp,
        progress_percentage: userStats.progress_percentage,
        is_duplicate: false
      };
    } catch (error) {
      if (error.statusCode) {
        throw error; // Re-throw known errors
      }
      
      const serviceError = new Error('Failed to submit lesson answers');
      serviceError.code = 'SUBMISSION_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }

  /**
   * Get user's attempts for a lesson
   * @param {number} userId - User ID
   * @param {number|null} lessonId - Lesson ID (optional)
   * @returns {Array} List of attempts
   */
  static async getUserAttempts(userId, lessonId = null) {
    try {
      const attempts = await LessonAttempt.getUserAttempts(userId, lessonId);
      return attempts;
    } catch (error) {
      const serviceError = new Error('Failed to retrieve user attempts');
      serviceError.code = 'ATTEMPTS_FETCH_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }

  /**
   * Grade submitted answers against correct answers
   * @param {Array} problems - Array of problem objects with correct answers
   * @param {Object} answers - Map of problem_id to submitted answer
   * @returns {Object} Grading result
   */
  static gradeAnswers(problems, answers) {
    let correctAnswers = 0;
    const gradedAnswers = {};

    for (const problem of problems) {
      const userAnswer = answers[problem.id];
      const isCorrect = userAnswer && 
        userAnswer.trim().toLowerCase() === problem.correct_answer.trim().toLowerCase();

      gradedAnswers[problem.id] = {
        user_answer: userAnswer || '',
        correct_answer: problem.correct_answer,
        is_correct: isCorrect
      };

      if (isCorrect) {
        correctAnswers++;
      }
    }

    const score = Math.round((correctAnswers / problems.length) * 100);

    return {
      score,
      correctAnswers,
      gradedAnswers
    };
  }

  /**
   * Calculate XP earned based on lesson reward and performance
   * @param {number} baseXP - Base XP reward for the lesson
   * @param {number} score - Score achieved (0-100)
   * @param {boolean} isCompleted - Whether lesson was completed
   * @returns {number} XP earned
   */
  static calculateXP(baseXP, score, isCompleted) {
    if (isCompleted) {
      return baseXP;
    }
    // Give partial XP for incomplete attempts
    return Math.round(baseXP * 0.5);
  }

  /**
   * Validate UUID format
   * @param {string} uuid - UUID string to validate
   * @returns {boolean} Whether UUID is valid
   */
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Generate a new attempt ID
   * @returns {string} New UUID for attempt
   */
  static generateAttemptId() {
    return uuidv4();
  }

  /**
   * Get lesson statistics
   * @param {number} lessonId - Lesson ID
   * @returns {Object} Lesson statistics
   */
  static async getLessonStats(lessonId) {
    try {
      // This would require additional database queries
      // Implementation depends on specific statistics needed
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        const error = new Error('Lesson not found');
        error.code = 'LESSON_NOT_FOUND';
        error.statusCode = 404;
        throw error;
      }

      return {
        lesson_id: lessonId,
        title: lesson.title,
        difficulty_level: lesson.difficulty_level,
        xp_reward: lesson.xp_reward
        // Add more statistics as needed
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      const serviceError = new Error('Failed to retrieve lesson statistics');
      serviceError.code = 'STATS_FETCH_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }
}

module.exports = LessonService;
