/**
 * EiQ™ Platform Enterprise Services Tests
 * Unit tests for multi-tenant, SSO, and white-label features
 */

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import '../../setup/server.setup';

describe('Enterprise Services', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = global.serverTestUtils.createMockRequest();
    res = global.serverTestUtils.createMockResponse();
    next = global.serverTestUtils.createMockNext();
  });

  describe('Multi-Tenant Middleware', () => {
    it('should detect tenant from subdomain', async () => {
      req.headers.host = 'acme-corp.eiq-platform.com';

      const { tenantMiddleware } = await import('@server/enterprise/tenantMiddleware');
      
      await tenantMiddleware(req, res, next);

      expect(req.tenant).toBeDefined();
      expect(req.tenant.organizationId).toBe('demo_org_1'); // Mock implementation
      expect(next).toHaveBeenCalled();
    });

    it('should detect tenant from custom domain', async () => {
      req.headers.host = 'learning.acme.com';

      const { tenantMiddleware } = await import('@server/enterprise/tenantMiddleware');
      
      await tenantMiddleware(req, res, next);

      expect(req.tenant).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should detect tenant from header', async () => {
      req.headers['x-tenant-id'] = 'test-org-123';

      const { tenantMiddleware } = await import('@server/enterprise/tenantMiddleware');
      
      await tenantMiddleware(req, res, next);

      expect(req.tenant).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing tenant gracefully', async () => {
      const { tenantMiddleware } = await import('@server/enterprise/tenantMiddleware');
      
      await tenantMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Feature Gating', () => {
    it('should allow access to features included in tenant plan', async () => {
      req.tenant = global.serverTestUtils.createMockTenant({
        features: ['advanced_reporting', 'sso_integration']
      });

      const { requireFeature } = await import('@server/enterprise/tenantMiddleware');
      const middleware = requireFeature('advanced_reporting');
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access to features not included in tenant plan', async () => {
      req.tenant = global.serverTestUtils.createMockTenant({
        features: ['basic_analytics']
      });

      const { requireFeature } = await import('@server/enterprise/tenantMiddleware');
      const middleware = requireFeature('advanced_reporting');
      
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Feature not available',
        message: 'Your current plan does not include access to: advanced_reporting',
        availableFeatures: ['basic_analytics']
      });
    });
  });

  describe('Usage Limits', () => {
    it('should allow requests within usage limits', async () => {
      req.tenant = global.serverTestUtils.createMockTenant({
        limits: {
          maxApiCalls: 1000000,
          maxUsers: 10000,
          maxStorage: 100,
          maxConcurrentSessions: 500
        }
      });

      // Mock current usage below limits
      const { organizationService } = await import('@server/enterprise/organizationService');
      organizationService.getMonthlyApiUsage = jest.fn().mockResolvedValue(50000);

      const { checkUsageLimits } = await import('@server/enterprise/tenantMiddleware');
      
      await checkUsageLimits(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject requests when usage limits exceeded', async () => {
      req.tenant = global.serverTestUtils.createMockTenant({
        limits: {
          maxApiCalls: 10000,
          maxUsers: 10000,
          maxStorage: 100,
          maxConcurrentSessions: 500
        }
      });

      // Mock current usage above limits
      const { organizationService } = await import('@server/enterprise/organizationService');
      organizationService.getMonthlyApiUsage = jest.fn().mockResolvedValue(15000);

      const { checkUsageLimits } = await import('@server/enterprise/tenantMiddleware');
      
      await checkUsageLimits(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'API limit exceeded',
          currentUsage: 15000
        })
      );
    });
  });

  describe('Advanced Reporting Service', () => {
    it('should generate user analytics report', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const organizationId = 'test-org-123';

      const { advancedReportingService } = await import('@server/enterprise/advancedReporting');
      
      const report = await advancedReportingService.generateUserAnalyticsReport(
        organizationId,
        startDate,
        endDate
      );

      expect(report).toBeDefined();
      expect(report.title).toBe('User Analytics Report');
      expect(report.organizationId).toBe(organizationId);
      expect(report.sections).toBeInstanceOf(Array);
      expect(report.summary).toBeDefined();
    });

    it('should generate performance metrics report', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const organizationId = 'test-org-123';

      const { advancedReportingService } = await import('@server/enterprise/advancedReporting');
      
      const report = await advancedReportingService.generatePerformanceMetricsReport(
        organizationId,
        startDate,
        endDate
      );

      expect(report).toBeDefined();
      expect(report.title).toBe('Performance Metrics Report');
      expect(report.organizationId).toBe(organizationId);
      expect(report.sections).toBeInstanceOf(Array);
    });

    it('should export reports in different formats', async () => {
      const mockReport = {
        title: 'Test Report',
        generatedAt: new Date(),
        period: { start: new Date(), end: new Date() },
        organizationId: 'test-org-123',
        sections: [],
        summary: {}
      };

      const { advancedReportingService } = await import('@server/enterprise/advancedReporting');
      
      const jsonExport = await advancedReportingService.exportReport(mockReport, 'json');
      const csvExport = await advancedReportingService.exportReport(mockReport, 'csv');
      
      expect(typeof jsonExport).toBe('string');
      expect(typeof csvExport).toBe('string');
      expect(jsonExport).toContain('Test Report');
      expect(csvExport).toContain('Test Report');
    });
  });

  describe('White-Label Service', () => {
    it('should apply branding configuration', async () => {
      const organizationId = 'test-org-123';
      const brandingConfig = {
        appName: 'Acme Learning Platform',
        colors: {
          primary: '#ff6b35',
          secondary: '#004e89',
          accent: '#009ffd',
          background: '#ffffff',
          surface: '#f8f9fa',
          text: {
            primary: '#212529',
            secondary: '#6c757d',
            muted: '#adb5bd'
          },
          status: {
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545',
            info: '#17a2b8'
          }
        }
      };

      const { whiteLabelService } = await import('@server/enterprise/whiteLabelCustomization');
      
      const result = await whiteLabelService.applyBrandingConfig(organizationId, brandingConfig);

      expect(result).toBeDefined();
      expect(result.appName).toBe('Acme Learning Platform');
      expect(result.colors.primary).toBe('#ff6b35');
      expect(result.organizationId).toBe(organizationId);
    });

    it('should generate CSS variables from branding config', async () => {
      const organizationId = 'test-org-123';
      const brandingConfig = global.serverTestUtils.createMockTenant();

      const { whiteLabelService } = await import('@server/enterprise/whiteLabelCustomization');
      const config = whiteLabelService.getDefaultBrandingConfig();
      config.organizationId = organizationId;
      
      const cssVariables = await whiteLabelService.generateCSSVariables(organizationId, config);

      expect(cssVariables).toContain('--color-primary:');
      expect(cssVariables).toContain('--font-heading:');
      expect(cssVariables).toContain(`[data-organization="${organizationId}"]`);
    });

    it('should validate custom domain configuration', async () => {
      const organizationId = 'test-org-123';
      const validDomain = 'learning.acme.com';
      const invalidDomain = 'invalid..domain';

      const { whiteLabelService } = await import('@server/enterprise/whiteLabelCustomization');
      
      await expect(whiteLabelService.configureCustomDomain(organizationId, validDomain))
        .resolves.not.toThrow();
      
      await expect(whiteLabelService.configureCustomDomain(organizationId, invalidDomain))
        .rejects.toThrow('Invalid domain format');
    });
  });
});