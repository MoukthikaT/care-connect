import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

let server;

const request = (path, options = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: 5005,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runEndToEndTests() {
  console.log('====================================================');
  console.log('      CARECONNECT PHASE 1 VERIFICATION TEST SUITE   ');
  console.log('====================================================');

  await connectDB();
  server = app.listen(5005);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // Test 1: GET /api/v1/health
    const healthRes = await request('/api/v1/health');
    assert(healthRes.status === 200 && healthRes.body.status === 'OK', 'GET /api/v1/health returns 200 OK');

    // Clean test user if exists
    const testEmail = 'verify_customer_test@careconnect.com';
    await User.deleteOne({ email: testEmail });

    // Test 2: Public registration with explicit attempt to self-assign 'Platform Admin' role
    const regRes = await request('/api/v1/auth/register', { method: 'POST' }, {
      name: 'Verify User',
      email: testEmail,
      password: 'password123',
      phone: '555-9999',
      role: 'Platform Admin' // Attacking role field to test override policy
    });

    assert(
      regRes.status === 201 && 
      regRes.body.success === true && 
      regRes.body.user.role === 'Customer',
      'POST /api/v1/auth/register strictly forces role to "Customer" regardless of body payload'
    );

    const token = regRes.body.token;
    assert(typeof token === 'string' && token.length > 20, 'Valid JWT token returned on registration');

    // Test 3: GET /api/v1/auth/me with JWT
    const meRes = await request('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(meRes.status === 200 && meRes.body.user.email === testEmail, 'GET /api/v1/auth/me succeeds with valid Bearer JWT');

    // Test 4: POST /api/v1/auth/login with valid credentials
    const loginRes = await request('/api/v1/auth/login', { method: 'POST' }, {
      email: testEmail,
      password: 'password123'
    });
    assert(loginRes.status === 200 && loginRes.body.token, 'POST /api/v1/auth/login succeeds with correct password');

    // Test 5: POST /api/v1/auth/login with invalid password
    const badLoginRes = await request('/api/v1/auth/login', { method: 'POST' }, {
      email: testEmail,
      password: 'wrongpassword'
    });
    assert(badLoginRes.status === 401, 'POST /api/v1/auth/login rejects invalid password with 401 Unauthorized');

    // Test 6: GET /api/v1/auth/me without token
    const noTokenRes = await request('/api/v1/auth/me');
    assert(noTokenRes.status === 401, 'GET /api/v1/auth/me rejects requests without JWT token with 401 Unauthorized');

    // Test 7: GET /api/v1/auth/me with invalid token
    const invalidTokenRes = await request('/api/v1/auth/me', {
      headers: { Authorization: 'Bearer invalid_fake_token' }
    });
    assert(invalidTokenRes.status === 401, 'GET /api/v1/auth/me rejects invalid JWT token with 401 Unauthorized');

    // Cleanup test user
    await User.deleteOne({ email: testEmail });

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('----------------------------------------------------');
    console.log(`Verification Complete: ${passed} PASSED, ${failed} FAILED.`);
    console.log('====================================================');
  }
}

runEndToEndTests();
