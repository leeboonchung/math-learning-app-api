// Service layer exports
// This file provides a single entry point for all services

const AuthService = require('./AuthService');
const LessonService = require('./LessonService');
const UserService = require('./UserService');
const DatabaseService = require('./DatabaseService');

module.exports = {
  AuthService,
  LessonService,
  UserService,
  DatabaseService
};

// Export individual services as well for direct import
module.exports.AuthService = AuthService;
module.exports.LessonService = LessonService;
module.exports.UserService = UserService;
module.exports.DatabaseService = DatabaseService;
