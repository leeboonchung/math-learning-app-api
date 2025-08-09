const express = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *           example:
 *             username: "johndoe"
 *             email: "john@example.com"
 *             password: "password123"
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   id: 1
 *                   username: "johndoe"
 *                   email: "john@example.com"
 *                   total_xp: 0
 *                   current_streak: 0
 *                   best_streak: 0
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Validation Error"
 *               message: "\"email\" must be a valid email"
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Conflict Error"
 *               message: "User with this email already exists"
 */
router.post('/register', AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with existing credentials
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *           example:
 *             email: "john@example.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   id: 1
 *                   username: "johndoe"
 *                   email: "john@example.com"
 *                   total_xp: 150
 *                   current_streak: 3
 *                   best_streak: 5
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Authentication Error"
 *               message: "Invalid email or password"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   id: 1
 *                   username: "johndoe"
 *                   email: "john@example.com"
 *                   total_xp: 150
 *                   current_streak: 3
 *                   best_streak: 5
 *                   created_at: "2025-08-09T09:00:00Z"
 *                   updated_at: "2025-08-09T10:30:00Z"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Authentication Error"
 *               message: "Access token is required"
 */
router.get('/me', authenticateToken, AuthController.getCurrentUser);

module.exports = router;
