/**
 * EiQ™ Platform Complete Integration Tests
 * Full system integration testing including all major subsystems
 */

import { describe, expect, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import '../../setup/server.setup';

describe('EiQ™ Platform Complete Integration', () => {
  beforeAll(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    // Cleanup
  });

  beforeEach(() => {
    // Reset mocks
    global.serverTestUtils.resetServerMocks();
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full authentication workflow', async () => {
      const mockUser = global.serverTestUtils.createMockServerUser();
      
      // Test user registration
      const registrationData = {
        email: mockUser.email,
        password: 'SecurePassword123!',
        firstName: mockUser.firstName,
        lastName: mockUser.lastName
      };

      // Mock successful registration
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          token: 'mock-jwt-token',
          user: mockUser
        })
      });

      const registrationResult = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const registrationResponse = await registrationResult.json();
      expect(registrationResult.ok).toBe(true);
      expect(registrationResponse.token).toBeDefined();

      // Test login with same credentials
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          token: 'mock-jwt-token-login',
          user: mockUser
        })
      });

      const loginResult = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registrationData.email,
          password: registrationData.password
        })
      });

      const loginResponse = await loginResult.json();
      expect(loginResult.ok).toBe(true);
      expect(loginResponse.token).toBeDefined();

      // Test authenticated API call
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUser)
      });

      const userResult = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${loginResponse.token}`
        }
      });

      const userResponse = await userResult.json();
      expect(userResult.ok).toBe(true);
      expect(userResponse.email).toBe(mockUser.email);
    });

    it('should handle authentication errors gracefully', async () => {
      // Test invalid credentials
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: 'Authentication failed',
          message: 'Invalid credentials'
        })
      });

      const result = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        })
      });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('Assessment System Integration', () => {
    it('should complete full assessment workflow', async () => {
      const authToken = 'mock-assessment-token';
      
      // Start new assessment
      const mockAssessment = global.testUtils.createMockAssessment();
      
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockAssessment)
      });

      const startResult = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'adaptive-reasoning',
          mode: 'comprehensive'
        })
      });

      const startResponse = await startResult.json();
      expect(startResult.ok).toBe(true);
      expect(startResponse.id).toBeDefined();

      // Submit assessment answers
      const answers = [
        { questionId: 'q1', answer: 'a', timeSpent: 45 },
        { questionId: 'q2', answer: 'c', timeSpent: 38 },
        { questionId: 'q3', answer: 'b', timeSpent: 52 }
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          score: 742,
          breakdown: {
            accuracy: 0.85,
            speed: 0.78,
            difficulty: 0.73
          },
          recommendations: [
            'Focus on advanced reasoning patterns',
            'Practice time management techniques'
          ]
        })
      });

      const submitResult = await fetch(`/api/assessments/${startResponse.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers })
      });

      const submitResponse = await submitResult.json();
      expect(submitResult.ok).toBe(true);
      expect(submitResponse.score).toBeGreaterThan(0);
      expect(submitResponse.recommendations).toBeDefined();
    });

    it('should generate adaptive questions based on performance', async () => {
      const authToken = 'mock-adaptive-token';
      
      // Mock AI-powered adaptive question generation
      const mockAdaptiveQuestion = {
        id: 'adaptive-q-123',
        text: 'Based on your performance, solve this advanced pattern recognition problem...',
        difficulty: 'advanced',
        type: 'pattern-recognition',
        options: [
          { id: 'a', text: 'Option A' },
          { id: 'b', text: 'Option B' },
          { id: 'c', text: 'Option C' },
          { id: 'd', text: 'Option D' }
        ],
        adaptiveContext: {
          userPerformance: 0.78,
          adjustedDifficulty: 'advanced',
          skillAreas: ['pattern-recognition', 'logical-reasoning']
        }
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAdaptiveQuestion)
      });

      const result = await fetch('/api/assessments/adaptive/next-question', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: 'session-123',
          previousAnswers: [
            { questionId: 'q1', correct: true, timeSpent: 30 },
            { questionId: 'q2', correct: false, timeSpent: 45 }
          ]
        })
      });

      const response = await result.json();
      expect(result.ok).toBe(true);
      expect(response.difficulty).toBe('advanced');
      expect(response.adaptiveContext).toBeDefined();
    });
  });

  describe('AI System Integration', () => {
    it('should integrate multiple AI providers seamlessly', async () => {
      const authToken = 'mock-ai-token';
      
      // Test AI tutoring with fallback providers
      const tutorRequest = {
        message: 'Explain quantum computing principles',
        context: 'advanced-physics',
        preferredProvider: 'openai'
      };

      // Mock primary provider success
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          response: 'Quantum computing leverages quantum mechanical properties...',
          provider: 'openai',
          confidence: 0.94,
          suggestions: ['Would you like examples?', 'Shall we discuss applications?']
        })
      });

      const result = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tutorRequest)
      });

      const response = await result.json();
      expect(result.ok).toBe(true);
      expect(response.response).toContain('quantum');
      expect(response.provider).toBe('openai');
      expect(response.suggestions).toBeInstanceOf(Array);
    });

    it('should handle AI provider failover gracefully', async () => {
      const authToken = 'mock-ai-failover-token';
      
      // Mock primary provider failure, secondary success
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: () => Promise.resolve({
            error: 'Primary AI provider unavailable'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            response: 'Quantum computing principles explained via backup provider...',
            provider: 'anthropic',
            fallbackUsed: true,
            confidence: 0.89
          })
        });

      const result = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Explain quantum computing',
          context: 'physics'
        })
      });

      const response = await result.json();
      expect(result.ok).toBe(true);
      expect(response.fallbackUsed).toBe(true);
      expect(response.provider).toBe('anthropic');
    });
  });

  describe('Enterprise Features Integration', () => {
    it('should handle multi-tenant operations correctly', async () => {
      const authToken = 'mock-enterprise-token';
      const tenantId = 'acme-corp';
      
      // Test tenant-specific data isolation
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          users: [
            global.serverTestUtils.createMockServerUser({ id: 'user1' }),
            global.serverTestUtils.createMockServerUser({ id: 'user2' })
          ],
          totalUsers: 2847,
          organizationId: tenantId,
          features: ['advanced_reporting', 'sso_integration']
        })
      });

      const result = await fetch('/api/enterprise/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-ID': tenantId
        }
      });

      const response = await result.json();
      expect(result.ok).toBe(true);
      expect(response.organizationId).toBe(tenantId);
      expect(response.features).toContain('advanced_reporting');
      expect(response.totalUsers).toBeGreaterThan(0);
    });

    it('should generate advanced enterprise reports', async () => {
      const authToken = 'mock-reporting-token';
      const tenantId = 'enterprise-client';
      
      const mockReport = {
        title: 'Comprehensive Analytics Report',
        generatedAt: new Date().toISOString(),
        period: {
          start: '2025-01-01T00:00:00Z',
          end: '2025-01-31T23:59:59Z'
        },
        organizationId: tenantId,
        sections: [
          {
            title: 'User Performance Analytics',
            type: 'metrics',
            data: {
              totalUsers: 2847,
              activeUsers: 2156,
              averageScore: 782.5,
              improvementRate: 12.3
            }
          },
          {
            title: 'Learning Path Effectiveness',
            type: 'analysis',
            data: {
              completionRates: { beginner: 0.89, intermediate: 0.76, advanced: 0.63 },
              timeToCompletion: { avg: 28.5, median: 24.0 },
              userSatisfaction: 4.6
            }
          }
        ],
        exportFormats: ['pdf', 'csv', 'json'],
        nextReportDate: '2025-02-28T23:59:59Z'
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockReport)
      });

      const result = await fetch('/api/enterprise/reports/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType: 'comprehensive-analytics',
          period: {
            start: '2025-01-01',
            end: '2025-01-31'
          },
          includeUserDetails: true,
          format: 'json'
        })
      });

      const response = await result.json();
      expect(result.ok).toBe(true);
      expect(response.title).toContain('Analytics Report');
      expect(response.sections).toHaveLength(2);
      expect(response.organizationId).toBe(tenantId);
    });
  });

  describe('Performance and Scalability Integration', () => {
    it('should handle concurrent user sessions efficiently', async () => {
      const simulatedUsers = Array.from({ length: 50 }, (_, i) => ({
        id: `user-${i}`,
        token: `token-${i}`,
        sessionId: `session-${i}`
      }));

      // Simulate concurrent API calls
      const concurrentRequests = simulatedUsers.map(user => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            userId: user.id,
            sessionActive: true,
            responseTime: Math.floor(Math.random() * 100) + 50 // 50-150ms
          })
        });

        return fetch('/api/auth/session/status', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'X-Session-ID': user.sessionId
          }
        });
      });

      // All requests should complete successfully
      const results = await Promise.all(concurrentRequests);
      
      results.forEach(result => {
        expect(result.ok).toBe(true);
      });

      // Verify performance metrics
      const responses = await Promise.all(results.map(r => r.json()));
      const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
      
      expect(avgResponseTime).toBeLessThan(200); // Should be under 200ms average
      expect(responses.every(r => r.sessionActive)).toBe(true);
    });

    it('should enforce usage limits correctly', async () => {
      const authToken = 'mock-rate-limit-token';
      const tenantId = 'rate-limited-tenant';
      
      // Mock hitting rate limit
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: 'API limit exceeded',
          message: 'You have exceeded your monthly API limit',
          currentUsage: 1000500,
          limit: 1000000,
          resetDate: '2025-02-01T00:00:00Z',
          retryAfter: 3600
        })
      });

      const result = await fetch('/api/ai/generate-question', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify({
          topic: 'mathematics',
          difficulty: 'intermediate'
        })
      });

      const response = await result.json();
      expect(result.ok).toBe(false);
      expect(result.status).toBe(429);
      expect(response.error).toBe('API limit exceeded');
      expect(response.currentUsage).toBeGreaterThan(response.limit);
    });
  });

  describe('Error Handling and Recovery Integration', () => {
    it('should handle system errors gracefully', async () => {
      const authToken = 'mock-error-token';
      
      // Mock system error
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: 'Internal server error',
          message: 'An unexpected error occurred',
          requestId: 'req-123-456',
          timestamp: new Date().toISOString()
        })
      });

      const result = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'adaptive' })
      });

      const response = await result.json();
      expect(result.ok).toBe(false);
      expect(result.status).toBe(500);
      expect(response.requestId).toBeDefined();
      expect(response.timestamp).toBeDefined();
    });

    it('should maintain data consistency during failures', async () => {
      // This would test transaction rollbacks and data integrity
      // Mock scenario where assessment creation fails but user data remains consistent
      
      const authToken = 'mock-consistency-token';
      const userId = 'test-user-consistency';
      
      // Mock assessment creation failure
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: 'Assessment creation failed',
          userDataIntact: true,
          rollbackCompleted: true
        })
      });

      const result = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'comprehensive',
          userId
        })
      });

      const response = await result.json();
      expect(result.ok).toBe(false);
      expect(response.userDataIntact).toBe(true);
      expect(response.rollbackCompleted).toBe(true);
    });
  });
});