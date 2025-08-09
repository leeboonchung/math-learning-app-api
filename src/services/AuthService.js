const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email address
   * @param {string} userData.password - Plain text password
   * @returns {Object} User data with JWT token
   */
  static async register(userData) {
    const { username, email, password } = userData;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      const error = new Error('User with this email already exists');
      error.code = 'USER_EXISTS';
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    // Create user
    const user = await User.create({
      username,
      email,
      password_hash
    });

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * Login with credentials
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - Email address
   * @param {string} credentials.password - Plain text password
   * @returns {Object} User data with JWT token
   */
  static async login(credentials) {
    const { email, password } = credentials;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.code = 'INVALID_CREDENTIALS';
      error.statusCode = 401;
      throw error;
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      const error = new Error('Invalid email or password');
      error.code = 'INVALID_CREDENTIALS';
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Object} User data
   */
  static async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.code = 'USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    return this.sanitizeUser(user);
  }

  /**
   * Verify JWT token and return user
   * @param {string} token - JWT token
   * @returns {Object} User data
   */
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        const error = new Error('Invalid token - user not found');
        error.code = 'INVALID_TOKEN';
        error.statusCode = 401;
        throw error;
      }

      return user;
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        const newError = new Error('Invalid or expired token');
        newError.code = 'INVALID_TOKEN';
        newError.statusCode = 401;
        throw newError;
      }
      throw error;
    }
  }

  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  static generateToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  /**
   * Remove sensitive data from user object
   * @param {Object} user - User object
   * @returns {Object} Sanitized user object
   */
  static sanitizeUser(user) {
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Refresh user token
   * @param {number} userId - User ID
   * @returns {Object} New token data
   */
  static async refreshToken(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.code = 'USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const token = this.generateToken(user);
    return { token };
  }
}

module.exports = AuthService;
