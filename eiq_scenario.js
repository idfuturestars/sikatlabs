import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const loginSuccessRate = new Rate('login_success_rate');
const assessmentSuccessRate = new Rate('assessment_success_rate');
const responseTime = new Trend('eiq_response_time');
const errorCounter = new Counter('eiq_errors');

// Configuration from environment variables
const SHARDS = parseInt(__ENV.SHARDS || '1');
const SHARD_ID = parseInt(__ENV.SHARD_ID || '1');
const ARRIVALS_PER_SHARD = parseInt(__ENV.ARRIVALS_PER_SHARD || '1000');
const BASE_URL = __ENV.TEST_BASE_URL || 'http://localhost:3000';

// Calculate this shard's user range
const usersPerShard = Math.floor(ARRIVALS_PER_SHARD / SHARDS);
const startUserId = (SHARD_ID - 1) * usersPerShard + 1;
const endUserId = SHARD_ID * usersPerShard;

console.log(`Shard ${SHARD_ID}/${SHARDS}: Users ${startUserId}-${endUserId} (${endUserId - startUserId + 1} users)`);

export let options = {
  scenarios: {
    eiq_scenario: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { duration: '2m', target: 5 }, // Ramp up to 5 arrivals per second
        { duration: '5m', target: 10 }, // Stay at 10 arrivals per second
        { duration: '5m', target: 20 }, // Increase to 20 arrivals per second
        { duration: '3m', target: 0 }, // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'], // Error rate under 1%
    login_success_rate: ['rate>0.99'], // 99% login success
    assessment_success_rate: ['rate>0.95'], // 95% assessment success
  },
};

function getShardedUserId() {
  const userId = Math.floor(Math.random() * (endUserId - startUserId + 1)) + startUserId;
  return `shard_${SHARD_ID}_user_${userId}`;
}

export function setup() {
  console.log(`Starting K6 test for shard ${SHARD_ID}/${SHARDS}`);
  console.log(`Target arrivals: ${ARRIVALS_PER_SHARD}`);
  console.log(`Base URL: ${BASE_URL}`);
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const baseUrl = data.baseUrl;
  const userId = getShardedUserId();
  
  // Health check
  let healthResponse = http.get(`${baseUrl}/api/health`);
  check(healthResponse, {
    'health check successful': (r) => r.status === 200,
  });

  if (healthResponse.status !== 200) {
    errorCounter.add(1);
    return;
  }

  // Demo login
  let loginPayload = {
    username: userId,
    password: 'demo123'
  };

  let loginResponse = http.post(`${baseUrl}/api/auth/demo-login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
  });

  let loginSuccess = check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
  });

  loginSuccessRate.add(loginSuccess);
  responseTime.add(loginResponse.timings.duration);

  if (!loginSuccess) {
    errorCounter.add(1);
    return;
  }

  const authToken = loginResponse.json('token');
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  sleep(Math.random() * 2); // Random think time

  // Start assessment
  let assessmentPayload = {
    sections: ['core_math', 'applied_reasoning']
  };

  let assessmentResponse = http.post(`${baseUrl}/api/assessment/start`, JSON.stringify(assessmentPayload), { headers });

  let assessmentSuccess = check(assessmentResponse, {
    'assessment start successful': (r) => r.status === 200,
    'assessment has sessionId': (r) => r.json('sessionId') !== undefined,
  });

  assessmentSuccessRate.add(assessmentSuccess);
  responseTime.add(assessmentResponse.timings.duration);

  if (!assessmentSuccess) {
    errorCounter.add(1);
    return;
  }

  const sessionId = assessmentResponse.json('sessionId');

  sleep(1);

  // Get viral challenge questions
  let questionsResponse = http.get(`${baseUrl}/api/viral-challenge/${sessionId}/questions?count=5`, { headers });

  let questionsSuccess = check(questionsResponse, {
    'questions retrieved successfully': (r) => r.status === 200,
    'questions have correct count': (r) => r.json('questions') && r.json('questions').length === 5,
    'questions have no-store cache': (r) => r.headers['Cache-Control'] && r.headers['Cache-Control'].includes('no-store'),
  });

  responseTime.add(questionsResponse.timings.duration);

  if (!questionsSuccess) {
    errorCounter.add(1);
    return;
  }

  const questions = questionsResponse.json('questions');

  // Answer questions
  for (let i = 0; i < Math.min(3, questions.length); i++) {
    const question = questions[i];
    
    sleep(Math.random() * 5 + 2); // Simulate thinking time (2-7 seconds)
    
    let answerPayload = {
      questionId: question.id,
      answer: question.options[Math.floor(Math.random() * question.options.length)],
      responseTime: Math.floor(Math.random() * 5000) + 1000
    };

    let answerResponse = http.post(`${baseUrl}/api/viral-challenge/${sessionId}/submit`, JSON.stringify(answerPayload), { headers });

    check(answerResponse, {
      [`answer ${i + 1} submitted successfully`]: (r) => r.status === 200,
    });

    responseTime.add(answerResponse.timings.duration);

    if (answerResponse.status !== 200) {
      errorCounter.add(1);
    }
  }

  // Get adaptive assessment question
  let adaptiveResponse = http.get(`${baseUrl}/api/assessment/adaptive?sessionId=${sessionId}&section=core_math`, { headers });

  check(adaptiveResponse, {
    'adaptive question retrieved': (r) => r.status === 200,
    'adaptive question has content': (r) => r.json('question') !== undefined,
  });

  responseTime.add(adaptiveResponse.timings.duration);

  if (adaptiveResponse.status !== 200) {
    errorCounter.add(1);
  }

  sleep(1);

  // Test Turing test endpoint
  let turingResponse = http.get(`${baseUrl}/api/turing-test/prompt`, { headers });

  check(turingResponse, {
    'turing test prompt retrieved': (r) => r.status === 200 || r.status === 404, // 404 is acceptable if not implemented
  });

  if (turingResponse.status === 200) {
    responseTime.add(turingResponse.timings.duration);
  }

  // Random additional operations
  if (Math.random() < 0.3) {
    // 30% chance to check leaderboard
    let leaderboardResponse = http.get(`${baseUrl}/api/leaderboard`, { headers });
    check(leaderboardResponse, {
      'leaderboard accessible': (r) => r.status === 200 || r.status === 404,
    });
  }

  if (Math.random() < 0.2) {
    // 20% chance to test developer API
    let devApiResponse = http.get(`${baseUrl}/api/developer-api/keys`, { headers });
    check(devApiResponse, {
      'developer API accessible': (r) => r.status === 200 || r.status === 401 || r.status === 404,
    });
  }
}

export function teardown(data) {
  console.log(`Completed K6 test for shard ${SHARD_ID}/${SHARDS}`);
}