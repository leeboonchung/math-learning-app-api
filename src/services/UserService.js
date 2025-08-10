const User = require('../models/User');
const Submission = require('../models/Submission');
const LessonProgress = require('../models/LessonProgress');

class UserService {
  /**
   * Get comprehensive user profile with statistics
   * @param {number} userId - User ID
   * @returns {Object} User profile with statistics
   */
  static async getUserProfile(userId) {
    try {
      // Get basic user information
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error('User not found');
        error.code = 'USER_NOT_FOUND';
        error.statusCode = 404;
        throw error;
      }

      // Get user statistics
      const userStats = await User.getStats(userId);
      if (!userStats) {
        const error = new Error('User statistics not found');
        error.code = 'USER_STATS_NOT_FOUND';
        error.statusCode = 404;
        throw error;
      }

      return {
        user_id: userId,
        username: user.username,
        email: user.email,
        total_xp: userStats.total_xp,
        current_streak: userStats.current_streak,
        best_streak: userStats.best_streak,
        completed_lessons: userStats.completed_lessons,
        total_lessons: userStats.total_lessons,
        progress_percentage: userStats.progress_percentage,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    } catch (error) {
      if (error.statusCode) {
        throw error; // Re-throw known errors
      }
      
      const serviceError = new Error('Failed to retrieve user profile');
      serviceError.code = 'PROFILE_FETCH_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }

  /**
   * Update user XP
   * @param {number} userId - User ID
   * @param {number} xpToAdd - XP amount to add
   * @returns {Object} Updated user data
   */
  static async updateUserXP(userId, xpToAdd) {
    try {
      if (xpToAdd < 0) {
        const error = new Error('XP amount must be positive');
        error.code = 'INVALID_XP_AMOUNT';
        error.statusCode = 400;
        throw error;
      }

      const updatedUser = await User.updateXP(userId, xpToAdd);
      if (!updatedUser) {
        const error = new Error('User not found');
        error.code = 'USER_NOT_FOUND';
        error.statusCode = 404;
        throw error;
      }

      return updatedUser;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      const serviceError = new Error('Failed to update user XP');
      serviceError.code = 'XP_UPDATE_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }

  /**
   * Update user streak
   * @param {number} userId - User ID
   * @param {number} newStreak - New streak value
   * @returns {Object} Updated user data
   */
  static async updateUserStreak(userId, newStreak) {
    try {
      if (newStreak < 0) {
        const error = new Error('Streak must be non-negative');
        error.code = 'INVALID_STREAK';
        error.statusCode = 400;
        throw error;
      }

      const updatedUser = await User.updateStreak(userId, newStreak);
      if (!updatedUser) {
        const error = new Error('User not found');
        error.code = 'USER_NOT_FOUND';
        error.statusCode = 404;
        throw error;
      }

      return updatedUser;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      const serviceError = new Error('Failed to update user streak');
      serviceError.code = 'STREAK_UPDATE_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }

  /**
   * Get user learning analytics
   * @param {number} userId - User ID
   * @returns {Object} User learning analytics
   */
  static async getUserAnalytics(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error('User not found');
        error.code = 'USER_NOT_FOUND';
        error.statusCode = 404;
        throw error;
      }

      // Get user progress for analytics
      const progressRecords = await LessonProgress.getAllUserProgress(userId);
      
      // Calculate analytics
      const analytics = this.calculateLearningAnalytics(progressRecords, user);
      
      return analytics;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      const serviceError = new Error('Failed to retrieve user analytics');
      serviceError.code = 'ANALYTICS_FETCH_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }

  /**
   * Calculate learning analytics from user progress records
   * @param {Array} progressRecords - User's lesson progress records
   * @param {Object} user - User object
   * @returns {Object} Learning analytics
   */
  static calculateLearningAnalytics(progressRecords, user) {
    const totalLessonsAttempted = progressRecords.length;
    const completedLessons = progressRecords.filter(progress => progress.is_completed).length;
    
    const averageScore = totalLessonsAttempted > 0 
      ? progressRecords.reduce((sum, progress) => sum + parseFloat(progress.best_score || 0), 0) / totalLessonsAttempted 
      : 0;

    // Calculate total attempts across all lessons
    const totalAttempts = progressRecords.reduce((sum, progress) => sum + (progress.attempts_count || 0), 0);

    // Find recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentProgress = progressRecords.filter(progress => 
      new Date(progress.last_attempted_at) >= sevenDaysAgo
    );

    // Calculate recent XP (this would need to be tracked separately or calculated from submissions)
    const recentXP = recentProgress.length * 10; // Approximate based on recent activity

    return {
      user_id: user.user_id,
      total_lessons_attempted: totalLessonsAttempted,
      completed_lessons: completedLessons,
      completion_rate: totalLessonsAttempted > 0 ? Math.round((completedLessons / totalLessonsAttempted) * 100 * 100) / 100 : 0,
      average_score: Math.round(averageScore * 100) / 100,
      total_attempts: totalAttempts,
      current_total_xp: user.total_xp,
      current_streak: user.current_streak,
      best_streak: user.best_streak,
      recent_activity: {
        lessons_attempted_last_7_days: recentProgress.length,
        estimated_xp_earned_last_7_days: recentXP
      },
      account_created: user.created_at,
      last_updated: user.updated_at
    };
  }

  /**
   * Reset user streak (for missed days)
   * @param {number} userId - User ID
   * @returns {Object} Updated user data
   */
  static async resetUserStreak(userId) {
    try {
      const updatedUser = await User.updateStreak(userId, 0);
      if (!updatedUser) {
        const error = new Error('User not found');
        error.code = 'USER_NOT_FOUND';
        error.statusCode = 404;
        throw error;
      }

      return updatedUser;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      const serviceError = new Error('Failed to reset user streak');
      serviceError.code = 'STREAK_RESET_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }

  /**
   * Get user leaderboard position
   * @param {number} userId - User ID
   * @returns {Object} Leaderboard information
   */
  static async getUserLeaderboardPosition(userId) {
    try {
      // This would require a more complex query to rank users
      // For now, return basic information
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error('User not found');
        error.code = 'USER_NOT_FOUND';
        error.statusCode = 404;
        throw error;
      }

      return {
        user_id: userId,
        username: user.username,
        total_xp: user.total_xp,
        current_streak: user.current_streak,
        best_streak: user.best_streak
        // Add actual ranking logic here
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      const serviceError = new Error('Failed to retrieve leaderboard position');
      serviceError.code = 'LEADERBOARD_FETCH_FAILED';
      serviceError.statusCode = 500;
      serviceError.originalError = error;
      throw serviceError;
    }
  }
}

module.exports = UserService;
