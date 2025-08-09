const LessonService = require('../services/LessonService');
const { submitAnswersSchema } = require('../validation/schemas');

class LessonController {
  // Helper method to validate GUID format
  static validateGuid(guid) {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return guidRegex.test(guid);
  }

  // GET /api/lessons - Return lessons with completion/progress status
  static async getAllLessons(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const lessons = await LessonService.getAllLessons(userId);
      
      res.json({
        success: true,
        data: lessons
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/lessons/:id - Get lesson + problems (don't leak correct answers)
  static async getLessonById(req, res, next) {
    try {
      const lessonId = req.params.id;
      
      if (!LessonController.validateGuid(lessonId)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid lesson ID format. Expected GUID/UUID format.'
        });
      }

      const userId = req.user ? req.user.id : null;
      const lesson = await LessonService.getLessonById(lessonId, userId);

      res.json({
        success: true,
        data: lesson
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/lessons/:id/submit - Submit answers with attempt_id
  static async submitAnswers(req, res, next) {
    try {
      const lessonId = req.params.id;
      
      if (!LessonController.validateGuid(lessonId)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid lesson ID format. Expected GUID/UUID format.'
        });
      }

      // Validate request body
      const { error, value } = submitAnswersSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.details[0].message,
          details: error.details
        });
      }

      const { attempt_id, answers } = value;
      const userId = req.user.id;

      const result = await LessonService.submitAnswers(lessonId, userId, attempt_id, answers);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/lessons/:id/attempts - Get user attempts for a lesson
  static async getLessonAttempts(req, res, next) {
    try {
      const lessonId = req.params.id;
      
      if (!LessonController.validateGuid(lessonId)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid lesson ID format. Expected GUID/UUID format.'
        });
      }

      const userId = req.user.id;
      const attempts = await LessonService.getUserAttempts(userId, lessonId);

      res.json({
        success: true,
        data: attempts
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/lessons/:id/stats - Get lesson statistics
  static async getLessonStats(req, res, next) {
    try {
      const lessonId = req.params.id;
      
      if (!LessonController.validateGuid(lessonId)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid lesson ID format. Expected GUID/UUID format.'
        });
      }

      const stats = await LessonService.getLessonStats(lessonId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LessonController;
