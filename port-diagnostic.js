#!/usr/bin/env node

/**
 * EiQ™ PORT CONNECTIVITY DIAGNOSTIC
 * 
 * Comprehensive port testing and connectivity analysis
 */

import http from 'http';
import { performance } from 'perf_hooks';

const TARGET_PORT = 5000;
const TARGET_HOST = 'localhost';

async function testPortConnectivity() {
  console.log('🔍 EiQ™ PORT CONNECTIVITY DIAGNOSTIC');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Basic HTTP GET to health endpoint
    console.log('🧪 Test 1: Health Endpoint Connectivity...');
    const healthResponse = await makeRequest('/health', 'GET');
    
    if (healthResponse.statusCode === 200) {
      console.log('✅ Health endpoint accessible');
      const healthData = JSON.parse(healthResponse.data);
      console.log(`   Status: ${healthData.status}`);
      console.log(`   Uptime: ${healthData.uptime}s`);
      console.log(`   Environment: ${healthData.environment}`);
    } else {
      console.log(`❌ Health endpoint failed: ${healthResponse.statusCode}`);
    }
    
    // Test 2: API Authentication endpoints
    console.log('\n🧪 Test 2: Authentication Endpoints...');
    const registerTest = await makeRequest('/api/auth/register', 'POST', {
      username: `port_test_${Date.now()}`,
      email: `test${Date.now()}@port.test`,
      password: 'test123'
    });
    
    if (registerTest.statusCode === 200 || registerTest.statusCode === 201) {
      console.log('✅ Registration endpoint accessible');
    } else if (registerTest.statusCode === 409) {
      console.log('✅ Registration endpoint accessible (user exists)');
    } else {
      console.log(`❌ Registration endpoint issues: ${registerTest.statusCode}`);
    }
    
    // Test 3: WebSocket connection test
    console.log('\n🧪 Test 3: WebSocket Connectivity...');
    const wsTest = await testWebSocketConnection();
    console.log(wsTest ? '✅ WebSocket connection possible' : '❌ WebSocket connection failed');
    
    // Test 4: Multiple concurrent requests
    console.log('\n🧪 Test 4: Concurrent Request Load Test...');
    const concurrentTests = [];
    for (let i = 0; i < 10; i++) {
      concurrentTests.push(makeRequest('/health', 'GET'));
    }
    
    const concurrentResults = await Promise.allSettled(concurrentTests);
    const successfulRequests = concurrentResults.filter(result => 
      result.status === 'fulfilled' && result.value.statusCode === 200
    ).length;
    
    console.log(`✅ Concurrent requests successful: ${successfulRequests}/10`);
    
    // Test 5: Port binding check
    console.log('\n🧪 Test 5: Port Binding Analysis...');
    const portBindingTest = await checkPortBinding(TARGET_PORT);
    console.log(portBindingTest ? '✅ Port properly bound' : '❌ Port binding issues detected');
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log(`Port ${TARGET_PORT} Status: ${healthResponse.statusCode === 200 ? 'OPERATIONAL ✅' : 'ISSUES DETECTED ❌'}`);
    console.log(`Authentication: ${registerTest.statusCode < 400 ? 'WORKING ✅' : 'ISSUES ❌'}`);
    console.log(`Concurrent Load: ${successfulRequests >= 8 ? 'EXCELLENT ✅' : 'NEEDS ATTENTION ❌'}`);
    console.log('='.repeat(50));
    
    return {
      overall: healthResponse.statusCode === 200,
      health: healthResponse.statusCode === 200,
      auth: registerTest.statusCode < 400,
      concurrent: successfulRequests >= 8,
      websocket: wsTest
    };
    
  } catch (error) {
    console.error('💥 Diagnostic failed:', error.message);
    return null;
  }
}

async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const options = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = performance.now();
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          responseTime: endTime - startTime
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));

    if (body && method !== 'GET') {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testWebSocketConnection() {
  try {
    // Simple WebSocket connection test
    const testConnection = new Promise((resolve) => {
      try {
        const WebSocket = require('ws');
        const ws = new WebSocket(`ws://${TARGET_HOST}:${TARGET_PORT}`);
        
        ws.on('open', () => {
          ws.close();
          resolve(true);
        });
        
        ws.on('error', () => resolve(false));
        
        setTimeout(() => resolve(false), 5000);
      } catch (error) {
        resolve(false);
      }
    });
    
    return await testConnection;
  } catch (error) {
    return false;
  }
}

async function checkPortBinding(port) {
  try {
    // Try to create a server on the same port to check if it's bound
    const testServer = http.createServer();
    
    return new Promise((resolve) => {
      testServer.listen(port, () => {
        testServer.close();
        resolve(false); // Port is available, meaning our main server isn't bound
      });
      
      testServer.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          resolve(true); // Port is in use, which is good for our main server
        } else {
          resolve(false);
        }
      });
    });
  } catch (error) {
    return false;
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPortConnectivity()
    .then(results => {
      if (results && results.overall) {
        console.log('🎉 Port connectivity is excellent!');
        process.exit(0);
      } else {
        console.log('⚠️ Port connectivity issues detected.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Diagnostic execution failed:', error);
      process.exit(1);
    });
}

export { testPortConnectivity };