import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import ServiceCategory from '../models/ServiceCategory.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { generateToken } from '../utils/jwt.js';
import { ROLES } from '../config/constants.js';

dotenv.config();

let server;

const request = (path, options = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: 5006,
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

async function runPhase2Tests() {
  console.log('====================================================');
  console.log('      CARECONNECT PHASE 2 VERIFICATION TEST SUITE   ');
  console.log('====================================================');

  await connectDB();
  server = app.listen(5006);

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
    // Setup test users & tokens
    await User.deleteMany({ email: /@testphase2\.com$/ });
    await ServiceCategory.deleteMany({ name: /Phase2Test/ });

    const opsUser = await User.create({
      name: 'Ops Tester',
      email: 'ops@testphase2.com',
      password: 'password123',
      phone: '555-0001',
      role: ROLES.OPS_MANAGER
    });

    const providerUser = await User.create({
      name: 'Provider Tester',
      email: 'provider@testphase2.com',
      password: 'password123',
      phone: '555-0002',
      role: ROLES.SERVICE_PROVIDER
    });

    const customerUser = await User.create({
      name: 'Customer Tester',
      email: 'customer@testphase2.com',
      password: 'password123',
      phone: '555-0003',
      role: ROLES.CUSTOMER
    });

    const opsToken = generateToken(opsUser._id, opsUser.role);
    const providerToken = generateToken(providerUser._id, providerUser.role);
    const customerToken = generateToken(customerUser._id, customerUser.role);

    // Test 1: Customer blocked from creating category (RBAC)
    const custCatRes = await request('/api/v1/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` }
    }, { name: 'Phase2Test Plumbing' });
    assert(custCatRes.status === 403, 'Customer role blocked from creating service category (403 Forbidden)');

    // Test 2: Ops Manager creates Service Category
    const createCatRes = await request('/api/v1/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${opsToken}` }
    }, {
      name: 'Phase2Test Plumbing',
      description: 'Plumbing & Leak Services',
      subcategories: [
        { name: 'Pipe Repair', estimatedBasePrice: 75, requiredSkills: ['Pipe Repair', 'Soldering'] }
      ]
    });
    assert(createCatRes.status === 201 && createCatRes.body.category.name === 'Phase2Test Plumbing', 'Ops Manager successfully creates service category');

    const catId = createCatRes.body.category._id;

    // Test 3: Duplicate category name validation
    const dupCatRes = await request('/api/v1/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${opsToken}` }
    }, { name: 'Phase2Test Plumbing' });
    assert(dupCatRes.status === 400, 'Rejects duplicate service category name with 400 Bad Request');

    // Test 4: Provider fetches empty/default profile
    const getProfileRes = await request('/api/v1/providers/profile/me', {
      headers: { Authorization: `Bearer ${providerToken}` }
    });
    assert(getProfileRes.status === 200 && getProfileRes.body.profile, 'Provider retrieves own profile');

    // Test 5: Invalid GeoJSON coordinates validation
    const badGeoRes = await request('/api/v1/providers/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${providerToken}` }
    }, {
      hourlyRate: 85,
      serviceAreas: [{
        cityName: 'Invalid City',
        center: { type: 'Point', coordinates: [300, 40] } // Invalid Longitude 300
      }]
    });
    assert(badGeoRes.status === 400, 'Rejects invalid GeoJSON longitude coordinates (> 180) with 400 Bad Request');

    // Test 6: Provider updates profile with valid GeoJSON & skills
    const updateProfileRes = await request('/api/v1/providers/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${providerToken}` }
    }, {
      bio: 'Licensed Plumbing Specialist',
      businessName: 'Phase2 Pro Plumbing',
      hourlyRate: 85,
      skills: ['Pipe Repair', 'Soldering'],
      serviceAreas: [{
        cityName: 'New York',
        center: { type: 'Point', coordinates: [-74.006, 40.7128] },
        radiusInKm: 30
      }]
    });
    assert(
      updateProfileRes.status === 200 && 
      updateProfileRes.body.profile.businessName === 'Phase2 Pro Plumbing' &&
      updateProfileRes.body.profile.serviceAreas[0].radiusInKm === 30,
      'Provider successfully updates profile, skills, and GeoJSON service radius'
    );

    const providerProfileId = updateProfileRes.body.profile._id;

    // Test 7: Ops Manager views pending verification queue
    const pendingRes = await request('/api/v1/providers/verifications/pending', {
      headers: { Authorization: `Bearer ${opsToken}` }
    });
    assert(pendingRes.status === 200 && Array.isArray(pendingRes.body.verifications), 'Ops Manager retrieves pending provider verifications queue');

    // Test 8: Ops Manager approves provider verification
    const verifyRes = await request(`/api/v1/providers/${providerProfileId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${opsToken}` }
    }, { status: 'Verified' });
    assert(verifyRes.status === 200 && verifyRes.body.profile.verificationStatus === 'Verified', 'Ops Manager approves provider verification status');

    // Test 9: Verify Notification dispatch to Provider
    const notif = await Notification.findOne({ recipient: providerUser._id });
    assert(notif && notif.title.includes('Verified'), 'System created approval Notification for Provider');

    // Test 10: Verify Audit Log created for admin action
    const audit = await AuditLog.findOne({ targetEntityId: providerProfileId });
    assert(audit && audit.action === 'PROVIDER_VERIFICATION_APPROVED', 'System recorded AuditLog entry for provider verification approval');

    // Cleanup
    await User.deleteMany({ email: /@testphase2\.com$/ });
    await ServiceCategory.deleteMany({ name: /Phase2Test/ });
    await ProviderProfile.deleteMany({ _id: providerProfileId });

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('----------------------------------------------------');
    console.log(`Phase 2 Verification Complete: ${passed} PASSED, ${failed} FAILED.`);
    console.log('====================================================');
  }
}

runPhase2Tests();
