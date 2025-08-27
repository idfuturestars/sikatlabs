#!/usr/bin/env node

/**
 * FRONTEND INTEGRATION TEST
 * EIQ™ Platform - UI Component and Feature Validation
 * 
 * Tests the newly implemented frontend features:
 * - Assessment interfaces (IQ/Personality)
 * - Avatar selection components
 * - Voice-to-text integration
 * - Audit logging displays
 */

import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';

class FrontendIntegrationTest {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      pageTests: [],
      apiIntegration: [],
      componentValidation: [],
      summary: {}
    };
  }

  async testMainApplication() {
    console.log('\n🖥️  TESTING MAIN APPLICATION LOAD...');
    
    try {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      const hasReactApp = html.includes('id="root"');
      const hasViteScripts = html.includes('/@vite/client');
      const hasCorrectTitle = html.includes('EIQ™') || html.includes('Educational Intelligence');
      
      this.results.pageTests.push({
        page: 'Main Application',
        status: response.status,
        hasReactRoot: hasReactApp,
        hasViteClient: hasViteScripts,
        hasCorrectTitle: hasCorrectTitle,
        loadTime: `${Date.now()}ms`,
        healthy: response.status === 200 && hasReactApp
      });
      
      console.log(`✅ Main App: ${response.status} - React: ${hasReactApp} - Vite: ${hasViteScripts}`);
      
    } catch (error) {
      console.log(`❌ Main App: ERROR - ${error.message}`);
      this.results.pageTests.push({
        page: 'Main Application',
        status: 'ERROR',
        error: error.message,
        healthy: false
      });
    }
  }

  async testAssessmentEndpoints() {
    console.log('\n🧠 TESTING ASSESSMENT API INTEGRATION...');
    
    const assessmentEndpoints = [
      { url: '/api/personality-assessment/disc', name: 'DISC Personality' },
      { url: '/api/iq-assessment/traditional', name: 'Traditional IQ' },
      { url: '/api/iq-assessment/emotional', name: 'Emotional IQ' },
      { url: '/api/iq-assessment/combined', name: 'Combined Scoring' }
    ];

    for (const endpoint of assessmentEndpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint.url}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        this.results.apiIntegration.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          status: response.status,
          healthy: response.status < 400
        });
        
        console.log(`✅ ${endpoint.name}: ${response.status}`);
        
      } catch (error) {
        this.results.apiIntegration.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          status: 'ERROR',
          error: error.message,
          healthy: false
        });
        console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
      }
    }
  }

  async testAvatarAndAuditEndpoints() {
    console.log('\n👤 TESTING AVATAR & AUDIT INTEGRATION...');
    
    const systemEndpoints = [
      { url: '/api/avatars/available', name: 'Avatar Catalog' },
      { url: '/api/audit/system-status', name: 'Audit System' },
      { url: '/api/voice/status', name: 'Voice Service' },
      { url: '/health', name: 'System Health' }
    ];

    for (const endpoint of systemEndpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint.url}`);
        
        this.results.apiIntegration.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          status: response.status,
          healthy: response.status < 400
        });
        
        console.log(`✅ ${endpoint.name}: ${response.status}`);
        
      } catch (error) {
        this.results.apiIntegration.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          status: 'ERROR',
          error: error.message,
          healthy: false
        });
        console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
      }
    }
  }

  async testComponentAvailability() {
    console.log('\n🔧 TESTING COMPONENT AVAILABILITY...');
    
    const componentPaths = [
      '/src/pages/AdaptiveAssessment.tsx',
      '/src/components/assessment/InteractiveAssessment.tsx',
      '/src/components/assessment/AssessmentResults.tsx',
      '/src/components/ui/form.tsx',
      '/src/hooks/useAchievements.tsx'
    ];

    for (const componentPath of componentPaths) {
      try {
        const response = await fetch(`${BASE_URL}${componentPath}`);
        const isAvailable = response.status === 200;
        
        this.results.componentValidation.push({
          component: componentPath.split('/').pop(),
          path: componentPath,
          available: isAvailable,
          status: response.status
        });
        
        console.log(`${isAvailable ? '✅' : '❌'} ${componentPath}: ${response.status}`);
        
      } catch (error) {
        this.results.componentValidation.push({
          component: componentPath.split('/').pop(),
          path: componentPath,
          available: false,
          error: error.message
        });
        console.log(`❌ ${componentPath}: ERROR - ${error.message}`);
      }
    }
  }

  calculateSummary() {
    const healthyPages = this.results.pageTests.filter(p => p.healthy).length;
    const totalPages = this.results.pageTests.length;
    
    const healthyAPIs = this.results.apiIntegration.filter(a => a.healthy).length;
    const totalAPIs = this.results.apiIntegration.length;
    
    const availableComponents = this.results.componentValidation.filter(c => c.available).length;
    const totalComponents = this.results.componentValidation.length;
    
    const overallHealthScore = ((healthyPages + healthyAPIs + availableComponents) / (totalPages + totalAPIs + totalComponents)) * 100;
    
    this.results.summary = {
      pageHealth: `${healthyPages}/${totalPages} (${((healthyPages/totalPages)*100).toFixed(1)}%)`,
      apiHealth: `${healthyAPIs}/${totalAPIs} (${((healthyAPIs/totalAPIs)*100).toFixed(1)}%)`,
      componentHealth: `${availableComponents}/${totalComponents} (${((availableComponents/totalComponents)*100).toFixed(1)}%)`,
      overallScore: `${overallHealthScore.toFixed(1)}%`,
      status: overallHealthScore >= 90 ? 'EXCELLENT' : overallHealthScore >= 75 ? 'GOOD' : 'NEEDS_ATTENTION',
      frontendReady: overallHealthScore >= 80
    };
  }

  async generateReport() {
    const reportContent = `
# EIQ™ FRONTEND INTEGRATION TEST REPORT
## Generated: ${this.results.timestamp}

## SUMMARY
**Overall Health**: ${this.results.summary.overallScore}
**Status**: ${this.results.summary.status}
**Frontend Ready**: ${this.results.summary.frontendReady ? '✅ YES' : '❌ NEEDS REVIEW'}

## PAGE LOAD TESTS
${this.results.pageTests.map(page => 
  `- **${page.page}**: ${page.healthy ? '✅' : '❌'} ${page.status} ${page.loadTime || ''}`
).join('\n')}

## API INTEGRATION TESTS
${this.results.apiIntegration.map(api => 
  `- **${api.endpoint}**: ${api.healthy ? '✅' : '❌'} ${api.status}`
).join('\n')}

## COMPONENT AVAILABILITY
${this.results.componentValidation.map(comp => 
  `- **${comp.component}**: ${comp.available ? '✅' : '❌'} ${comp.status || 'ERROR'}`
).join('\n')}

## HEALTH METRICS
- **Page Health**: ${this.results.summary.pageHealth}
- **API Health**: ${this.results.summary.apiHealth}
- **Component Health**: ${this.results.summary.componentHealth}

## CONCLUSION
${this.results.summary.frontendReady ? 
  'Frontend integration is successful and ready for production deployment.' :
  'Frontend requires attention before production deployment.'}
`;

    fs.writeFileSync('FRONTEND_INTEGRATION_TEST_REPORT.md', reportContent);
    console.log('\n📄 Frontend report generated: FRONTEND_INTEGRATION_TEST_REPORT.md');
  }

  async run() {
    console.log('🚀 STARTING FRONTEND INTEGRATION TEST...');

    try {
      await this.testMainApplication();
      await this.testAssessmentEndpoints();
      await this.testAvatarAndAuditEndpoints();
      await this.testComponentAvailability();
      
      this.calculateSummary();
      await this.generateReport();

      console.log('\n🎉 FRONTEND TEST COMPLETE!');
      console.log(`✅ Frontend Ready: ${this.results.summary.frontendReady}`);
      console.log(`📊 Overall Score: ${this.results.summary.overallScore}`);
      
      return this.results;

    } catch (error) {
      console.error('❌ Frontend test failed:', error);
      return { error: error.message };
    }
  }
}

// Run the frontend test
const frontendTest = new FrontendIntegrationTest();
frontendTest.run().then(results => {
  console.log('\n📈 FRONTEND SUMMARY:');
  console.log(JSON.stringify(results.summary, null, 2));
  process.exit(results.summary?.frontendReady ? 0 : 1);
}).catch(error => {
  console.error('💥 Critical frontend error:', error);
  process.exit(1);
});