const AuthService = require('../services/AuthService');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Access token is required'
    });
  }

  try {
    const user = await AuthService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Authentication Error',
      message: error.message
    });
  }
};

// Optional authentication - sets req.user if token is valid, but doesn't require it
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const user = await AuthService.verifyToken(token);
    req.user = user;
  } catch (error) {
    req.user = null;
  }
  
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};
