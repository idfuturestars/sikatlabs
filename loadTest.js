// loadTest.js
//
// This script performs a load test against your backend using the
// autocannon library. It simulates a high volume of requests to a
// specified endpoint, which is useful for validating that your server
// can handle large numbers of users (e.g. up to one million requests).
//
// To run this test locally, install autocannon as a dev dependency:
//   npm install --save-dev autocannon
// Then execute:
//   node loadTest.js http://localhost:5000/api/your-endpoint
//
// You can control the amount of requests and concurrency via
// environment variables. For example:
//   AMOUNT=1000000 CONNECTIONS=200 node loadTest.js http://localhost:5000/api/assessments

import autocannon from 'autocannon';

// Read the target URL from the command line. Default to a local
// development server if none is provided.
const url = process.argv[2] || 'http://localhost:5000';

// Number of concurrent connections (simulated users). Adjust this to
// match the expected level of concurrency in your environment. More
// connections will generate more simultaneous load.
const connections = parseInt(process.env.CONNECTIONS || '100', 10);

// Total number of requests to make. For a one million user
// simulation, set this to 1_000_000. Note that running one million
// requests locally may take considerable time and resources.
const amount = parseInt(process.env.AMOUNT || '100000', 10);

function runLoadTest() {
  console.log(`Running load test against ${url}`);
  console.log(`Connections: ${connections}`);
  console.log(`Total requests: ${amount}`);
  const instance = autocannon({
    url,
    connections,
    amount,
  });

  instance.on('tick', () => {
    // You can emit intermediate metrics here if desired
  });

  instance.on('done', (results) => {
    console.log('\nLoad test complete');
    console.log('Requests/second:', results.requests.average);
    console.log('Latency (ms):', results.latency.average);
    console.log('Throughput (bytes/sec):', results.throughput.average);
    process.exit(0);
  });
}

runLoadTest();