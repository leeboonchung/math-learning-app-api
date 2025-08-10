const express = require('express');
const LessonController = require('../controllers/LessonController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /lessons:
 *   get:
 *     summary: Get all lessons with progress status
 *     description: Returns all available lessons. If authenticated, includes user progress data.
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters: []
 *     responses:
 *       200:
 *         description: List of lessons with progress information
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Lesson'
 *             example:
 *               success: true
 *               data:
 *                 - id: "550e8400-e29b-41d4-a716-446655440001"
 *                   title: "Basic Addition"
 *                   description: "Learn the fundamentals of adding numbers"
 *                   difficulty_level: 1
 *                   xp_reward: 10
 *                   order_index: 1
 *                   is_completed: true
 *                   best_score: 100
 *                   attempts_count: 1
 *                   last_attempted_at: "2025-08-09T10:00:00Z"
 *                   completed_at: "2025-08-09T10:05:00Z"
 *                 - id: "550e8400-e29b-41d4-a716-446655440002"
 *                   title: "Basic Subtraction"
 *                   description: "Master subtraction with simple problems"
 *                   difficulty_level: 1
 *                   xp_reward: 10
 *                   order_index: 2
 *                   is_completed: false
 *                   best_score: 66.67
 *                   attempts_count: 2
 *                   last_attempted_at: "2025-08-09T11:00:00Z"
 *                   completed_at: null
 */
router.get('/', optionalAuth, LessonController.getAllLessons);

/**
 * @swagger
 * /lessons/{id}:
 *   get:
 *     summary: Get specific lesson with problems
 *     description: Returns lesson details with problems. Correct answers are not included for security.
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Lesson ID (UUID/GUID format)
 *         schema:
 *           type: string
 *           format: uuid
 *           pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Lesson details with problems
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LessonWithProblems'
 *             example:
 *               success: true
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440001"
 *                 title: "Basic Addition"
 *                 description: "Learn the fundamentals of adding numbers"
 *                 difficulty_level: 1
 *                 xp_reward: 10
 *                 order_index: 1
 *                 is_completed: false
 *                 best_score: 0
 *                 attempts_count: 0
 *                 last_attempted_at: null
 *                 completed_at: null
 *                 problems:
 *                   - id: "550e8400-e29b-41d4-a716-446655440101"
 *                     question: "What is 5 + 3?"
 *                     problem_type: "multiple_choice"
 *                     options: ["6", "7", "8", "9"]
 *                     order_index: 1
 *                     problem_options:
 *                       - problem_option_id: 1
 *                         problem_id: "550e8400-e29b-41d4-a716-446655440101"
 *                         option: "6"
 *                       - problem_option_id: 2
 *                         problem_id: "550e8400-e29b-41d4-a716-446655440101"
 *                         option: "7"
 *                       - problem_option_id: 3
 *                         problem_id: "550e8400-e29b-41d4-a716-446655440101"
 *                         option: "8"
 *                       - problem_option_id: 4
 *                         problem_id: "550e8400-e29b-41d4-a716-446655440101"
 *                         option: "9"
 *                   - id: "550e8400-e29b-41d4-a716-446655440102"
 *                     question: "What is 12 + 7?"
 *                     problem_type: "multiple_choice"
 *                     options: ["18", "19", "20", "21"]
 *                     order_index: 2
 *                     problem_options:
 *                       - problem_option_id: 5
 *                         problem_id: "550e8400-e29b-41d4-a716-446655440102"
 *                         option: "18"
 *                       - problem_option_id: 6
 *                         problem_id: "550e8400-e29b-41d4-a716-446655440102"
 *                         option: "19"
 *                       - problem_option_id: 7
 *                         problem_id: "550e8400-e29b-41d4-a716-446655440102"
 *                         option: "20"
 *                       - problem_option_id: 8
 *                         problem_id: "550e8400-e29b-41d4-a716-446655440102"
 *                         option: "21"
 *       400:
 *         description: Invalid lesson ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Validation Error"
 *               message: "Invalid lesson ID"
 *       404:
 *         description: Lesson not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not Found"
 *               message: "Lesson not found"
 */
router.get('/:id', optionalAuth, LessonController.getLessonById);

/**
 * @swagger
 * /lessons/{id}/submit:
 *   post:
 *     summary: Submit answers for a lesson
 *     description: Submit answers with attempt_id for idempotent processing. Returns XP, streak, and progress information.
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Lesson ID (UUID/GUID format)
 *         schema:
 *           type: string
 *           format: uuid
 *           pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitAnswers'
 *           example:
 *             submission_id: "550e8400-e29b-41d4-a716-446655440000"
 *             lesson_id: "550e8400-e29b-41d4-a716-446655440001"
 *             answers:
 *               - problem_id: "550e8400-e29b-41d4-a716-446655440101"
 *                 selected_option_id: "550e8400-e29b-41d4-a716-446655440201"
 *               - problem_id: "550e8400-e29b-41d4-a716-446655440102"
 *                 selected_option_id: "550e8400-e29b-41d4-a716-446655440206"
 *               - problem_id: "550e8400-e29b-41d4-a716-446655440103"
 *                 selected_option_id: null
 *     responses:
 *       200:
 *         description: Submission processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SubmissionResult'
 *             example:
 *               success: true
 *               data:
 *                 submission_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 score: 100
 *                 xp_earned: 10
 *                 is_completed: true
 *                 correct_answers: 3
 *                 total_problems: 3
 *                 current_streak: 4
 *                 total_xp: 160
 *                 progress_percentage: 20
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Validation Error"
 *               message: "\"attempt_id\" must be a valid GUID"
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
 *         description: Lesson not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not Found"
 *               message: "Lesson not found"
 *       422:
 *         description: Lesson has no problems
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Validation Error"
 *               message: "Lesson has no problems to grade"
 */
router.post('/:id/submit', LessonController.submitAnswers);

module.exports = router;
