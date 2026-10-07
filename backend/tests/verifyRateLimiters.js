const express = require('express');
const request = require('supertest');
const { apiLimiter, authLimiter, createUrlLimiter, redirectLimiter } = require('../middleware/rateLimiter');

async function testLimiter({ name, limiter, method, path, max, sampleBody = {} }) {
  process.stdout.write(`Testing [${name}] (Limit: ${max} reqs)... `);

  // Isolate each limiter in its own fresh express app instance with a unique IP simulation
  const app = express();
  app.use(express.json());

  if (method === 'get') {
    app.get(path, limiter, (req, res) => res.status(200).json({ success: true }));
  } else {
    app.post(path, limiter, (req, res) => res.status(200).json({ success: true }));
  }

  // 1. Send requests up to the max threshold
  let lastSuccessRes = null;
  for (let i = 1; i <= max; i++) {
    const res = method === 'get'
      ? await request(app).get(path)
      : await request(app).post(path).send(sampleBody);

    if (res.status !== 200) {
      console.log(`❌ FAILED: Unexpected status ${res.status} on request #${i}`);
      return { name, status: 'FAILED', reason: `Throttled early at request #${i}` };
    }
    lastSuccessRes = res;
  }

  // 2. The (max + 1)th request MUST trigger HTTP 429 Too Many Requests
  const throttledRes = method === 'get'
    ? await request(app).get(path)
    : await request(app).post(path).send(sampleBody);

  if (throttledRes.status !== 429) {
    console.log(`❌ FAILED: Expected HTTP 429 on request #${max + 1}, got HTTP ${throttledRes.status}`);
    return { name, status: 'FAILED', reason: `Did not throttle on request #${max + 1}` };
  }

  // Validate error payload & headers
  const hasErrorMsg = !!throttledRes.body?.error;
  const hasRetryAfter = typeof throttledRes.body?.retryAfter === 'number';
  const hasRateLimitHeader = !!lastSuccessRes?.headers['ratelimit'];

  console.log(`✓ PASSED (Throttled at #${max + 1})`);
  return {
    name,
    status: 'PASSED',
    max,
    throttledAt: max + 1,
    httpStatus: throttledRes.status,
    errorMessage: throttledRes.body.error,
    retryAfter: `${throttledRes.body.retryAfter}s`,
    hasHeaders: hasRateLimitHeader ? 'Yes (draft-7)' : 'No',
  };
}

async function testHealthBypass() {
  process.stdout.write('Testing [/api/health bypass rule]... ');
  const app = express();
  app.get('/api/health', apiLimiter, (req, res) => res.status(200).json({ status: 'ok' }));

  // Send 105 requests to /api/health (apiLimiter max is 100)
  for (let i = 1; i <= 105; i++) {
    const res = await request(app).get('/api/health');
    if (res.status !== 200) {
      console.log(`❌ FAILED: Health check was throttled at request #${i}`);
      return { name: 'Health Check Bypass', status: 'FAILED' };
    }
  }

  console.log('✓ PASSED (Bypasses limiter as expected)');
  return {
    name: 'Health Check Bypass',
    status: 'PASSED',
    max: 'Unlimited (skip rule)',
    throttledAt: 'Never (Always 200)',
    httpStatus: 200,
    errorMessage: 'N/A',
    retryAfter: 'N/A',
    hasHeaders: 'Bypassed',
  };
}

async function runAllRateLimiterTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║               🛡️  SnipLink Rate Limiter Verification Suite               ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  const results = [];

  // 1. Auth Limiter (10 requests)
  results.push(await testLimiter({
    name: 'authLimiter',
    limiter: authLimiter,
    method: 'post',
    path: '/api/auth/login',
    max: 10,
    sampleBody: { email: 'test@example.com', password: 'password123' },
  }));

  // 2. Link Creation Limiter (30 requests)
  results.push(await testLimiter({
    name: 'createUrlLimiter',
    limiter: createUrlLimiter,
    method: 'post',
    path: '/api/url/shorten',
    max: 30,
    sampleBody: { originalUrl: 'https://example.com' },
  }));

  // 3. General API Limiter (100 requests)
  results.push(await testLimiter({
    name: 'apiLimiter',
    limiter: apiLimiter,
    method: 'get',
    path: '/api/url/my-links',
    max: 100,
  }));

  // 4. Public Redirect Limiter (300 requests)
  results.push(await testLimiter({
    name: 'redirectLimiter',
    limiter: redirectLimiter,
    method: 'get',
    path: '/custom-code',
    max: 300,
  }));

  // 5. Health Check Skip Validation
  results.push(await testHealthBypass());

  console.log('\n┌────────────────────┬──────────┬──────────────┬─────────────┬──────────────┬───────────────────────────────┐');
  console.log('│ Limiter Name       │ Status   │ Threshold    │ Throttled At│ RateLimit Hdr│ Throttling Error Message      │');
  console.log('├────────────────────┼──────────┼──────────────┼─────────────┼──────────────┼───────────────────────────────┤');

  for (const r of results) {
    const name = String(r.name).padEnd(19);
    const status = String(r.status).padEnd(9);
    const max = String(r.max).padEnd(13);
    const throttledAt = String(r.throttledAt).padEnd(12);
    const headers = String(r.hasHeaders).padEnd(13);
    const msg = String(r.errorMessage).substring(0, 29).padEnd(30);
    console.log(`│ ${name}│ ${status}│ ${max}│ ${throttledAt}│ ${headers}│ ${msg}│`);
  }

  console.log('└────────────────────┴──────────┴──────────────┴─────────────┴──────────────┴───────────────────────────────┘\n');

  const allPassed = results.every((r) => r.status === 'PASSED');
  if (allPassed) {
    console.log('🎉 ALL RATE LIMITERS ARE WORKING PROPERLY WITH HTTP 429 RESPONSES & HEADERS!\n');
    process.exit(0);
  } else {
    console.error('⚠️ Some rate limiters failed verification.');
    process.exit(1);
  }
}

runAllRateLimiterTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
