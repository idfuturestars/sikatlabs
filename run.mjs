#!/usr/bin/env node

import autocannon from 'autocannon';

// Configuration from environment variables
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const CONNECTIONS = parseInt(process.env.CONNECTIONS || '10');
const DURATION = process.env.DURATION || '30s';
const PIPELINING = parseInt(process.env.PIPELINING || '1');

console.log(`🚀 Starting Autocannon stress test`);
console.log(`   Target: ${BASE_URL}`);
console.log(`   Connections: ${CONNECTIONS}`);
console.log(`   Duration: ${DURATION}`);
console.log(`   Pipelining: ${PIPELINING}`);

// Test scenarios
const scenarios = [
  {
    name: 'Health Check Endpoint',
    url: `${BASE_URL}/api/health`,
    method: 'GET',
  },
  {
    name: 'Demo Login Endpoint',
    url: `${BASE_URL}/api/auth/demo-login`,
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      username: 'autocannon_user_' + Math.floor(Math.random() * 10000),
      password: 'demo123'
    })
  },
  {
    name: 'Assessment Start (requires auth)',
    url: `${BASE_URL}/api/assessment/start`,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer dummy_token_for_stress_test'
    },
    body: JSON.stringify({
      sections: ['core_math']
    })
  },
  {
    name: 'Viral Challenge Questions (requires auth)',
    url: `${BASE_URL}/api/viral-challenge/test_session/questions?count=5`,
    method: 'GET',
    headers: {
      'authorization': 'Bearer dummy_token_for_stress_test'
    }
  }
];

async function runScenario(scenario) {
  console.log(`\n📊 Testing: ${scenario.name}`);
  console.log(`   ${scenario.method} ${scenario.url}`);
  
  const options = {
    url: scenario.url,
    connections: CONNECTIONS,
    duration: DURATION,
    pipelining: PIPELINING,
    method: scenario.method,
  };

  if (scenario.headers) {
    options.headers = scenario.headers;
  }

  if (scenario.body) {
    options.body = scenario.body;
  }

  try {
    const result = await autocannon(options);
    
    console.log(`\n✅ Results for ${scenario.name}:`);
    console.log(`   Requests/sec: ${result.requests.average}`);
    console.log(`   Latency avg: ${result.latency.average}ms`);
    console.log(`   Latency p99: ${result.latency.p99}ms`);
    console.log(`   Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
    console.log(`   Total Requests: ${result.requests.total}`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`   2xx Responses: ${result['2xx']}`);
    console.log(`   Non-2xx Responses: ${result.non2xx}`);
    
    // Performance gates
    const avgLatency = result.latency.average;
    const errorRate = result.errors / result.requests.total * 100;
    const reqsPerSec = result.requests.average;
    
    console.log(`\n🎯 Performance Gates:`);
    console.log(`   Avg Latency < 500ms: ${avgLatency < 500 ? '✅ PASS' : '❌ FAIL'} (${avgLatency.toFixed(2)}ms)`);
    console.log(`   Error Rate < 1%: ${errorRate < 1 ? '✅ PASS' : '❌ FAIL'} (${errorRate.toFixed(2)}%)`);
    console.log(`   Requests/sec > 100: ${reqsPerSec > 100 ? '✅ PASS' : '❌ FAIL'} (${reqsPerSec.toFixed(2)})`);
    
    return {
      name: scenario.name,
      passed: avgLatency < 500 && errorRate < 1 && reqsPerSec > 100,
      metrics: {
        avgLatency,
        errorRate,
        reqsPerSec,
        throughput: result.throughput.average
      }
    };
    
  } catch (error) {
    console.error(`❌ Error testing ${scenario.name}:`, error.message);
    return {
      name: scenario.name,
      passed: false,
      error: error.message
    };
  }
}

async function main() {
  const results = [];
  
  for (const scenario of scenarios) {
    const result = await runScenario(scenario);
    results.push(result);
    
    // Brief pause between scenarios
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n\n📈 FINAL SUMMARY`);
  console.log(`================`);
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    
    if (result.metrics) {
      console.log(`     Latency: ${result.metrics.avgLatency.toFixed(2)}ms | ` +
                 `Error Rate: ${result.metrics.errorRate.toFixed(2)}% | ` +
                 `Req/sec: ${result.metrics.reqsPerSec.toFixed(2)}`);
    }
    
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log(`🎉 All performance tests passed!`);
    process.exit(0);
  } else {
    console.log(`⚠️  ${totalTests - passedTests} performance tests failed`);
    process.exit(1);
  }
}

// Handle SIGINT gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test interrupted by user');
  process.exit(130);
});

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});