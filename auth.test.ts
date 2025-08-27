/**
 * EiQ™ Platform Authentication Service Tests
 * Unit tests for authentication middleware and services
 */

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import '../../setup/server.setup';

describe('Authentication Service', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = global.serverTestUtils.createMockRequest();
    res = global.serverTestUtils.createMockResponse();
    next = global.serverTestUtils.createMockNext();
  });

  describe('JWT Authentication', () => {
    it('should validate a valid JWT token', async () => {
      // Mock JWT verification
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ userId: 'test-user-123', organizationId: 'test-org-123' });

      req.headers.authorization = 'Bearer valid-jwt-token';

      // Import authentication middleware
      const { authenticateToken } = await import('@server/middleware/auth');
      
      await authenticateToken(req, res, next);

      expect(req.user).toEqual({
        userId: 'test-user-123',
        organizationId: 'test-org-123'
      });
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid JWT token', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      req.headers.authorization = 'Bearer invalid-jwt-token';

      const { authenticateToken } = await import('@server/middleware/auth');
      
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Invalid or expired token'
      });
    });

    it('should reject missing authorization header', async () => {
      const { authenticateToken } = await import('@server/middleware/auth');
      
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'No authorization token provided'
      });
    });
  });

  describe('Password Authentication', () => {
    it('should hash passwords correctly', async () => {
      const bcrypt = require('bcrypt');
      const { hashPassword } = await import('@server/utils/password');

      const plaintext = 'test-password-123';
      const hashed = await hashPassword(plaintext);

      expect(bcrypt.hash).toHaveBeenCalledWith(plaintext, 12);
      expect(hashed).toBe('hashed_password');
    });

    it('should verify passwords correctly', async () => {
      const bcrypt = require('bcrypt');
      const { verifyPassword } = await import('@server/utils/password');

      const plaintext = 'test-password-123';
      const hashed = 'hashed_password';

      const isValid = await verifyPassword(plaintext, hashed);

      expect(bcrypt.compare).toHaveBeenCalledWith(plaintext, hashed);
      expect(isValid).toBe(true);
    });
  });

  describe('User Session Management', () => {
    it('should create user session on login', async () => {
      const mockUser = global.serverTestUtils.createMockServerUser();
      req.body = {
        email: mockUser.email,
        password: 'test-password-123'
      };

      // Mock database operations
      const mockDb = global.serverTestUtils.mockDbOperations;
      mockDb.execute.mockResolvedValue([mockUser]);

      const { loginUser } = await import('@server/services/auth');
      
      const result = await loginUser(req.body.email, req.body.password);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should handle invalid login credentials', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      req.body = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      const { loginUser } = await import('@server/services/auth');
      
      await expect(loginUser(req.body.email, req.body.password))
        .rejects
        .toThrow('Invalid credentials');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow access for authorized roles', async () => {
      req.user = {
        userId: 'test-user-123',
        roles: ['admin', 'instructor']
      };

      const { requireRole } = await import('@server/middleware/auth');
      const middleware = requireRole(['admin']);
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for unauthorized roles', async () => {
      req.user = {
        userId: 'test-user-123',
        roles: ['student']
      };

      const { requireRole } = await import('@server/middleware/auth');
      const middleware = requireRole(['admin', 'instructor']);
      
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        message: 'Required roles: admin, instructor'
      });
    });
  });
});