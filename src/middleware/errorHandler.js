const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      error: 'Conflict Error',
      message: 'Resource already exists',
      details: err.detail
    });
  }

  if (err.code === '23503') { // Foreign key constraint violation
    return res.status(422).json({
      error: 'Validation Error',
      message: 'Referenced resource does not exist',
      details: err.detail
    });
  }

  if (err.code === '23502') { // Not null constraint violation
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Required field is missing',
      details: err.detail
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Token expired'
    });
  }

  // Validation errors (from Joi)
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.details[0].message,
      details: err.details
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
