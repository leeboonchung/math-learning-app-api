const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Math Learning App API',
      version: '1.0.0',
      description: 'A comprehensive API for a math learning application with PostgreSQL backend',
      contact: {
        name: 'API Support',
        email: 'support@mathlearningapp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.mathlearningapp.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authorization token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            total_xp: {
              type: 'integer',
              description: 'Total experience points earned'
            },
            current_streak: {
              type: 'integer',
              description: 'Current learning streak'
            },
            best_streak: {
              type: 'integer',
              description: 'Best learning streak achieved'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        UserRegistration: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 30,
              pattern: '^[a-zA-Z0-9]+$',
              description: 'Username (alphanumeric, 3-30 characters)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Valid email address'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Password (minimum 6 characters)'
            }
          }
        },
        UserLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              description: 'User password'
            }
          }
        },
        Lesson: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Lesson ID'
            },
            title: {
              type: 'string',
              description: 'Lesson title'
            },
            description: {
              type: 'string',
              description: 'Lesson description'
            },
            difficulty_level: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Difficulty level (1-5)'
            },
            xp_reward: {
              type: 'integer',
              description: 'XP reward for completing the lesson'
            },
            order_index: {
              type: 'integer',
              description: 'Order in the lesson sequence'
            },
            is_completed: {
              type: 'boolean',
              description: 'Whether the user has completed this lesson'
            },
            best_score: {
              type: 'number',
              format: 'float',
              description: 'Best score achieved (0-100)'
            },
            attempts_count: {
              type: 'integer',
              description: 'Number of attempts made'
            },
            last_attempted_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last attempt timestamp'
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Completion timestamp'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Lesson creation timestamp'
            }
          }
        },
        LessonWithProblems: {
          allOf: [
            { $ref: '#/components/schemas/Lesson' },
            {
              type: 'object',
              properties: {
                problems: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Problem' }
                }
              }
            }
          ]
        },
        Problem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Problem ID'
            },
            question: {
              type: 'string',
              description: 'The math problem question'
            },
            problem_type: {
              type: 'string',
              enum: ['multiple_choice', 'text_input'],
              description: 'Type of problem'
            },
            options: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Multiple choice options (if applicable)'
            },
            order_index: {
              type: 'integer',
              description: 'Order within the lesson'
            }
          }
        },
        SubmitAnswers: {
          type: 'object',
          required: ['submission_id', 'lesson_id', 'answers'],
          properties: {
            submission_id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique submission identifier (UUID v4)'
            },
            lesson_id: {
              type: 'string',
              format: 'uuid',
              description: 'Lesson identifier (UUID v4)'
            },
            answers: {
              type: 'array',
              items: {
                type: 'object',
                required: ['problem_id', 'selected_option_id'],
                properties: {
                  problem_id: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Problem identifier (UUID v4)'
                  },
                  selected_option_id: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                    description: 'Selected option identifier (UUID v4) or null if no option selected'
                  }
                }
              },
              description: 'Array of problem answers with selected options'
            }
          }
        },
        SubmissionResult: {
          type: 'object',
          properties: {
            submission_id: {
              type: 'string',
              format: 'uuid',
              description: 'Submission identifier'
            },
            score: {
              type: 'number',
              format: 'float',
              description: 'Score achieved (0-100)'
            },
            xp_earned: {
              type: 'integer',
              description: 'Experience points earned'
            },
            is_completed: {
              type: 'boolean',
              description: 'Whether the lesson was completed (score >= 70%)'
            },
            correct_answers: {
              type: 'integer',
              description: 'Number of correct answers'
            },
            total_problems: {
              type: 'integer',
              description: 'Total number of problems'
            },
            current_streak: {
              type: 'integer',
              description: 'Updated current streak'
            },
            total_xp: {
              type: 'integer',
              description: 'Updated total XP'
            },
            progress_percentage: {
              type: 'integer',
              description: 'Overall progress percentage'
            }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            user_id: {
              type: 'integer',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            total_xp: {
              type: 'integer',
              description: 'Total experience points'
            },
            current_streak: {
              type: 'integer',
              description: 'Current learning streak'
            },
            best_streak: {
              type: 'integer',
              description: 'Best streak achieved'
            },
            completed_lessons: {
              type: 'integer',
              description: 'Number of completed lessons'
            },
            total_lessons: {
              type: 'integer',
              description: 'Total available lessons'
            },
            progress_percentage: {
              type: 'integer',
              description: 'Overall progress percentage'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User'
            },
            token: {
              type: 'string',
              description: 'JWT authentication token'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Detailed error information'
            }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Math Learning App API is running'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Current timestamp'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration endpoints'
      },
      {
        name: 'Lessons',
        description: 'Lesson management and submission endpoints'
      },
      {
        name: 'Profile',
        description: 'User profile and statistics endpoints'
      },
      {
        name: 'Health',
        description: 'API health check endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs;
