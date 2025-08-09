const AuthService = require('../services/AuthService');

class AuthController {
  // POST /api/auth/register
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/me
  static async getCurrentUser(req, res, next) {
    try {
      const user = await AuthService.getUserById(req.user.id);
      
      res.json({
        success: true,
        data: {
          user
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/refresh
  static async refreshToken(req, res, next) {
    try {
      const result = await AuthService.refreshToken(req.user.id);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;

module.exports = AuthController;
