import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be under 2s
    http_req_failed: ['rate<0.1'],     // Error rate should be under 10%
    errors: ['rate<0.1'],              // Custom error rate under 10%
  },
};

const BASE_URL = 'http://localhost:5000';

export default function() {
  // Test home page
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'home page status is 200': (r) => r.status === 200,
    'home page loads in reasonable time': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // Test API health check
  response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test viral challenge API
  const challengePayload = JSON.stringify({
    challengeType: '15_second',
    difficulty: 'medium',
    userId: `load-test-user-${__VU}-${__ITER}`,
  });

  response = http.post(`${BASE_URL}/api/viral-challenge/start`, challengePayload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const challengeCheck = check(response, {
    'viral challenge status is 200': (r) => r.status === 200,
    'viral challenge response time < 1000ms': (r) => r.timings.duration < 1000,
    'viral challenge returns session ID': (r) => {
      try {
        const json = JSON.parse(r.body);
        return json.success && json.sessionId;
      } catch (e) {
        return false;
      }
    },
  });

  if (!challengeCheck) {
    errorRate.add(1);
  }

  sleep(2);

  // Test assessment API if we have a session
  if (challengeCheck && response.json().sessionId) {
    const sessionId = response.json().sessionId;
    
    response = http.get(`${BASE_URL}/api/viral-challenge/${sessionId}/questions`);
    check(response, {
      'questions fetch status is 200': (r) => r.status === 200,
      'questions response time < 1000ms': (r) => r.timings.duration < 1000,
      'questions return valid data': (r) => {
        try {
          const json = JSON.parse(r.body);
          return Array.isArray(json.questions) && json.questions.length > 0;
        } catch (e) {
          return false;
        }
      },
    }) || errorRate.add(1);
  }

  sleep(1);
}