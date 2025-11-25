// Jest setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock logger to avoid console noise during tests
jest.mock('../src/middlewares/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  requestLogger: (req, res, next) => next(),
}));

// Global teardown
afterAll(async () => {
  // Close any open connections
});


