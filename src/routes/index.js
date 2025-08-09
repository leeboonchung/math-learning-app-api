const express = require('express');
const lessonsRouter = require('./lessons');
const profileRouter = require('./profile');
const authRouter = require('./auth');

const router = express.Router();

// API routes
router.use('/lessons', lessonsRouter);
router.use('/profile', profileRouter);
router.use('/auth', authRouter);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current status of the API and database
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *             example:
 *               success: true
 *               message: "Math Learning App API is running"
 *               timestamp: "2025-08-09T12:00:00Z"
 *               database: 
 *                 status: "healthy"
 *                 pool:
 *                   total: 1
 *                   idle: 1
 *                   waiting: 0
 */
router.get('/health', async (req, res) => {
  try {
    const db = require('../config/database');
    const dbHealth = await db.healthCheck();
    
    res.json({
      success: true,
      message: 'Math Learning App API is running',
      timestamp: new Date().toISOString(),
      database: dbHealth
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'API is running but database is unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'unhealthy',
        error: error.message
      }
    });
  }
});

module.exports = router;
