const Lesson = require('../models/Lesson');
const Submission = require('../models/Submission');
const LessonProgress = require('../models/LessonProgress');
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
   * @param {string} lessonId - Lesson ID
   * @param {string} userId - User ID
   * @param {string} submissionId - Unique submission identifier
   * @param {Array} answers - Array of answers with problem_id and selected_option_id
   * @returns {Object} Submission result with score, XP, and progress
   */
  static async submitAnswers(submissionId, lessonId, userId, answers) {
    try {
      // Validate submission ID format
      if (!this.isValidUUID(submissionId)) {
        const error = new Error('Invalid submission ID format');
        error.code = 'INVALID_SUBMISSION_ID';
        error.statusCode = 400;
        throw error;
      }

      // Check if this submission was already processed (idempotent)
      const existingSubmissions = await Submission.findBySubmissionId(submissionId);
      if (existingSubmissions.length > 0) {
        // Return the existing submission result
        const userStats = await User.getStats(userId);
        const userProgress = await LessonProgress.getUserProgress(userId, lessonId);
        
        return {
          submission_id: submissionId,
          score: userProgress ? userProgress.best_score : 0,
          xp_earned: 0, // No additional XP for duplicate submission
          is_completed: userProgress ? userProgress.is_completed : false,
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
      // Create submissions in database
      const submissionData = {
        submissionId,
        userId,
        lessonId,
        answers
      };
      await Submission.createSubmissions(submissionData);

      // Grade the answers
      const gradingResult = this.gradeAnswers(problems, answers);
      console.log("Grading Result:", gradingResult);
      // Calculate XP and completion status
      const score = gradingResult.score;
      const isCompleted = score >= 70; // 70% threshold for completion
      
      // Update lesson progress
      const progressData = {
        userId,
        lessonId,
        submissionId,
        score,
        expEarned: gradingResult.expEarned,
        isCompleted,
        gradingResults: gradingResult.gradedAnswers
      };
      await LessonProgress.updateProgress(progressData);

      // Get updated user stats
      const userStats = await User.getStats(userId);

      return {
        submission_id: submissionId,
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
   * Get user's progress and submissions for lessons
   * @param {string} userId - User ID
   * @param {string|null} lessonId - Lesson ID (optional)
   * @returns {Array} List of lesson progress with submission details
   */
  static async getUserAttempts(userId, lessonId = null) {
    try {
      const progress = await LessonProgress.getUserProgress(userId, lessonId);
      return progress;
    } catch (error) {
      const serviceError = new Error('Failed to retrieve user progress');
      serviceError.code = 'PROGRESS_FETCH_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }

  /**
   * Grade submitted answers against correct answers
   * @param {Array} problems - Array of problem objects with correct answers and options
   * @param {Array} answers - Array of submitted answers with problem_id and selected_option_id
   * @returns {Object} Grading result
   */
  static gradeAnswers(problems, answers) {
    let correctAnswers = 0;
    let expEarned = 0;
    const gradedAnswers = {};

    // Convert answers array to a map for easier lookup
    const answersMap = {};
    for (const answer of answers) {
      answersMap[answer.problem_id] = answer.selected_option_id;
    }

    for (const problem of problems) {
      const selectedOptionId = answersMap[problem.problem_id];
      let isCorrect = false;
      let selectedOption = null;

      // Find the selected option from problem options
      if (selectedOptionId && problem.problem_options) {
        selectedOption = problem.problem_options.find(
          option => option.problem_option_id.toString() === selectedOptionId.toString()
        );
        
        // Check if the selected option matches the correct answer
        if (selectedOption) {
          isCorrect = selectedOption.is_right_answer
          expEarned += problem.reward_xp;
        }
      }

      gradedAnswers[problem.problem_id] = {
        selected_option_id: selectedOptionId,
        selected_option: selectedOption ? selectedOption.option : null,
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
      expEarned,
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
