const express = require('express');
const ProfileController = require('../controllers/ProfileController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get user profile with statistics
 *     description: Returns comprehensive user statistics including XP, streaks, and progress information
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile and statistics
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserProfile'
 *             example:
 *               success: true
 *               data:
 *                 user_id: 1
 *                 username: "johndoe"
 *                 email: "john@example.com"
 *                 total_xp: 160
 *                 current_streak: 4
 *                 best_streak: 5
 *                 completed_lessons: 1
 *                 total_lessons: 5
 *                 progress_percentage: 20
 *                 created_at: "2025-08-09T09:00:00Z"
 *                 updated_at: "2025-08-09T10:05:00Z"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Authentication Error"
 *               message: "Access token is required"
 *       404:
 *         description: User profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not Found"
 *               message: "User profile not found"
 */
router.get('/', authenticateToken, ProfileController.getUserProfile);

module.exports = router;
