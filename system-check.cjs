// system-check.js
// Creates a CTO-style Markdown report of env, audits, tests & performance.
// Usage: node system-check.js [--url http://localhost:5000] [--conn 50] [--dur 20]

const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');

const argv = process.argv.slice(2);
const getArg = (flag, defaultValue) => {
  const index = argv.indexOf(flag);
  return index !== -1 && argv[index + 1] ? argv[index + 1] : defaultValue;
};

const config = {
  url: getArg('--url', 'http://localhost:5000'),
  connections: parseInt(getArg('--conn', '50')),
  duration: parseInt(getArg('--dur', '20')),
  output: getArg('--output', `CTO_SYSTEM_CHECK_${new Date().toISOString().split('T')[0]}.md`)
};

console.log('🚀 EIQ™ System Check - Generating CTO Report...');
console.log(`📊 Testing: ${config.url} | Connections: ${config.connections} | Duration: ${config.duration}s`);

const execPromise = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve({ error: error.message, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

const checkDatabase = async () => {
  try {
    const result = await execPromise('psql $DATABASE_URL -c "SELECT COUNT(*) FROM simulation_assessments;" 2>/dev/null');
    if (result.stdout) {
      const count = result.stdout.split('\n')[2]?.trim();
      return { status: '✅', count: count || 'Unknown', error: null };
    }
    return { status: '⚠️', count: 'N/A', error: result.error };
  } catch (err) {
    return { status: '❌', count: 'N/A', error: err.message };
  }
};

const checkEndpoints = async () => {
  const endpoints = [
    '/api/auth/user',
    '/api/role-model-match',
    '/api/adaptive/assessment',
    '/api/developer/auth',
    '/health'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const result = await execPromise(`curl -s -w "%{http_code}" -o /dev/null ${config.url}${endpoint}`);
      const statusCode = result.stdout?.trim();
      results.push({
        endpoint,
        status: statusCode === '200' || statusCode === '304' ? '✅' : '⚠️',
        code: statusCode || 'Error'
      });
    } catch (err) {
      results.push({
        endpoint,
        status: '❌',
        code: 'Error'
      });
    }
  }
  
  return results;
};

const runPerformanceTest = async () => {
  try {
    console.log('⚡ Running performance test...');
    const testFile = `logs/system_check_bench_${Date.now()}.json`;
    
    const result = await execPromise(
      `npx autocannon -c ${config.connections} -d ${config.duration} -j -m POST -H 'content-type: application/json' -b '{}' ${config.url}/api/role-model-match > ${testFile} 2>&1`
    );
    
    // Wait a moment for file to be written
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (fs.existsSync(testFile)) {
      const benchData = JSON.parse(fs.readFileSync(testFile, 'utf8'));
      return {
        status: '✅',
        requests: benchData['2xx'] || benchData.requests?.total || 0,
        errors: benchData.errors || 0,
        latency: benchData.latency?.average || 0,
        throughput: benchData.requests?.average || 0,
        duration: benchData.duration || config.duration
      };
    }
    
    return { status: '⚠️', error: 'Benchmark file not found' };
  } catch (err) {
    return { status: '❌', error: err.message };
  }
};

const getSystemInfo = () => {
  return {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    cpus: os.cpus().length,
    totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
    freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + 'GB',
    uptime: Math.round(os.uptime() / 3600) + 'h',
    loadAvg: os.loadavg().map(l => l.toFixed(2)).join(', ')
  };
};

const checkEnvironment = () => {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GEMINI_API_KEY'
  ];
  
  return requiredVars.map(varName => ({
    name: varName,
    status: process.env[varName] ? '✅ Configured' : '❌ Missing'
  }));
};

const generateReport = async () => {
  const timestamp = new Date().toISOString();
  const systemInfo = getSystemInfo();
  const envVars = checkEnvironment();
  const database = await checkDatabase();
  const endpoints = await checkEndpoints();
  const performance = await runPerformanceTest();
  
  const report = `# 🚀 EIQ™ SYSTEM CHECK REPORT
**Generated**: ${timestamp}  
**Platform**: EIQ™ Powered by SikatLabs™ Educational Intelligence Platform  
**Check Type**: Comprehensive System Validation

---

## 📊 EXECUTIVE SUMMARY

**System Status**: ${database.status === '✅' && performance.status === '✅' ? '✅ OPERATIONAL' : '⚠️ ATTENTION REQUIRED'}  
**Database Records**: ${database.count} simulation assessments  
**Performance Score**: ${performance.throughput ? Math.round(performance.throughput) + ' req/s' : 'N/A'}  
**Environment**: ${envVars.filter(v => v.status.includes('✅')).length}/${envVars.length} variables configured

---

## 🖥️ SYSTEM INFORMATION

| Metric | Value |
|--------|-------|
| Platform | ${systemInfo.platform} ${systemInfo.arch} |
| Node.js | ${systemInfo.nodeVersion} |
| CPU Cores | ${systemInfo.cpus} |
| Memory | ${systemInfo.freeMemory}/${systemInfo.totalMemory} free |
| System Uptime | ${systemInfo.uptime} |
| Load Average | ${systemInfo.loadAvg} |

---

## 🔧 ENVIRONMENT CONFIGURATION

| Variable | Status |
|----------|--------|
${envVars.map(v => `| ${v.name} | ${v.status} |`).join('\n')}

---

## 🗄️ DATABASE STATUS

**Connection**: ${database.status}  
**Records**: ${database.count} simulation assessments  
${database.error ? `**Error**: ${database.error}` : '**Performance**: Operational'}

---

## 🌐 API ENDPOINT HEALTH

| Endpoint | Status | Code |
|----------|--------|------|
${endpoints.map(e => `| ${e.endpoint} | ${e.status} | ${e.code} |`).join('\n')}

---

## ⚡ PERFORMANCE METRICS

**Test Configuration**:
- URL: ${config.url}
- Connections: ${config.connections}
- Duration: ${config.duration}s

**Results**:
- **Status**: ${performance.status}
- **Successful Requests**: ${performance.requests || 'N/A'}
- **Errors**: ${performance.errors || 'N/A'}
- **Average Latency**: ${performance.latency ? Math.round(performance.latency) + 'ms' : 'N/A'}
- **Throughput**: ${performance.throughput ? Math.round(performance.throughput) + ' req/s' : 'N/A'}

${performance.error ? `**Error**: ${performance.error}` : ''}

---

## 🎯 RECOMMENDATIONS

${database.status !== '✅' ? '- ❗ **Database**: Resolve database connectivity issues\n' : ''}${envVars.some(v => v.status.includes('❌')) ? '- ⚠️ **Environment**: Configure missing environment variables\n' : ''}${endpoints.some(e => e.status !== '✅') ? '- 🔧 **APIs**: Investigate failing endpoints\n' : ''}${performance.status !== '✅' ? '- 🚀 **Performance**: Optimize performance bottlenecks\n' : ''}${database.status === '✅' && performance.status === '✅' && !envVars.some(v => v.status.includes('❌')) && !endpoints.some(e => e.status !== '✅') ? '- ✅ **All Systems Operational**: Platform ready for production deployment\n' : ''}

---

## 📈 SYSTEM HEALTH SCORE

**Overall Score**: ${(() => {
  let score = 0;
  if (database.status === '✅') score += 30;
  if (performance.status === '✅') score += 30;
  score += (envVars.filter(v => v.status.includes('✅')).length / envVars.length) * 20;
  score += (endpoints.filter(e => e.status === '✅').length / endpoints.length) * 20;
  return Math.round(score);
})()}%

${(() => {
  const score = (() => {
    let s = 0;
    if (database.status === '✅') s += 30;
    if (performance.status === '✅') s += 30;
    s += (envVars.filter(v => v.status.includes('✅')).length / envVars.length) * 20;
    s += (endpoints.filter(e => e.status === '✅').length / endpoints.length) * 20;
    return Math.round(s);
  })();
  
  if (score >= 90) return '🟢 **EXCELLENT** - Production Ready';
  if (score >= 75) return '🟡 **GOOD** - Minor Issues';
  if (score >= 50) return '🟠 **FAIR** - Attention Required';
  return '🔴 **POOR** - Critical Issues';
})()}

---

**Report Generated**: ${timestamp}  
**Next Check**: Run \`node system-check.js\` for updated status  
**Platform**: 🚀 EIQ™ Enterprise Educational Intelligence Platform

---

*This automated system check validates all critical platform components for enterprise deployment readiness.*`;

  // Write report to file
  fs.writeFileSync(config.output, report);
  console.log(`✅ Report generated: ${config.output}`);
  
  return report;
};

// Run the system check
generateReport().then(() => {
  console.log('🎉 System check complete!');
}).catch(err => {
  console.error('❌ System check failed:', err);
  process.exit(1);
});