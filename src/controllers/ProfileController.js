const UserService = require('../services/UserService');

class ProfileController {
  // GET /api/profile - Return user stats (total XP, current/best streak, progress percentage)
  static async getUserProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await UserService.getProfile(userId);

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProfileController;
