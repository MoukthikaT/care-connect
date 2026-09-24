import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import ServiceCategory from '../models/ServiceCategory.js';
import ProviderProfile from '../models/ProviderProfile.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Quote from '../models/Quote.js';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import RuleBasedClassifier from '../services/ai/RuleBasedClassifier.js';
import MatchingEngine from '../services/ai/MatchingEngine.js';
import { generateToken } from '../utils/jwt.js';
import { BOOKING_STATUS, ROLES } from '../config/constants.js';

dotenv.config();

let server;

const request = (path, options = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: 5008,
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

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('      CARECONNECT PHASE 3 VERIFICATION TEST SUITE   ');
  console.log('====================================================');

  await connectDB();
  server = app.listen(5008);

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
    // Setup test users & category
    await User.deleteMany({ email: /@testphase3\.com$/ });
    await ServiceCategory.deleteMany({ name: /Phase3Plumbing/ });

    const category = await ServiceCategory.create({
      name: 'Phase3Plumbing',
      description: 'Plumbing Services',
      subcategories: [
        { name: 'Pipe Repair', estimatedBasePrice: 80, requiredSkills: ['Pipe Repair', 'Leak Sealing'] }
      ]
    });

    const c1User = await User.create({ name: 'Customer 1', email: 'c1@testphase3.com', password: 'password123', phone: '555-1001', role: ROLES.CUSTOMER });
    const c2User = await User.create({ name: 'Customer 2', email: 'c2@testphase3.com', password: 'password123', phone: '555-1002', role: ROLES.CUSTOMER });
    
    // Verified Provider
    const pVerifiedUser = await User.create({ name: 'Verified Provider', email: 'pv@testphase3.com', password: 'password123', phone: '555-2001', role: ROLES.SERVICE_PROVIDER, status: 'Active' });
    const pProfile = await ProviderProfile.create({
      user: pVerifiedUser._id,
      verificationStatus: 'Verified',
      businessName: 'Apex Plumbing',
      skills: ['Pipe Repair', 'Leak Sealing'],
      categories: [category._id],
      hourlyRate: 85,
      rating: { average: 4.9, count: 12 },
      serviceAreas: [{ cityName: 'New York', center: { type: 'Point', coordinates: [-74.006, 40.7128] }, radiusInKm: 30 }]
    });

    // Unverified Provider
    const pUnverifiedUser = await User.create({ name: 'Unverified Provider', email: 'pu@testphase3.com', password: 'password123', phone: '555-2002', role: ROLES.SERVICE_PROVIDER, status: 'Pending Verification' });
    await ProviderProfile.create({
      user: pUnverifiedUser._id,
      verificationStatus: 'Pending',
      skills: ['Pipe Repair']
    });

    const c1Token = generateToken(c1User._id, c1User.role);
    const c2Token = generateToken(c2User._id, c2User.role);
    const pVerifiedToken = generateToken(pVerifiedUser._id, pVerifiedUser.role);
    const pUnverifiedToken = generateToken(pUnverifiedUser._id, pUnverifiedUser.role);

    // Item 1: Customer creates service request
    const createReqRes = await request('/api/v1/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${c1Token}` }
    }, {
      title: 'Kitchen Pipe Leaking Water',
      description: 'Water is leaking under kitchen sink. Need pipe repair asap!',
      categoryId: category._id,
      location: {
        address: '100 Broadway, NY',
        coordinates: { type: 'Point', coordinates: [-74.006, 40.7128] }
      }
    });

    assert(createReqRes.status === 201 && createReqRes.body.success === true, '1. Customer creates service request successfully');

    const req1Id = createReqRes.body.serviceRequest._id;

    // Item 2: Required-field validation works
    const badReqRes = await request('/api/v1/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${c1Token}` }
    }, { title: 'Incomplete Request' });
    assert(badReqRes.status === 400, '2. Required-field validation rejects incomplete request with 400 Bad Request');

    // Item 3: Customer can retrieve own request
    const getMyReqRes = await request('/api/v1/requests/my', {
      headers: { Authorization: `Bearer ${c1Token}` }
    });
    assert(getMyReqRes.status === 200 && getMyReqRes.body.requests.length === 1, '3. Customer retrieves own service requests');

    // Item 4: Customer 2 cannot retrieve Customer 1 request
    const c2GetRes = await request(`/api/v1/requests/${req1Id}`, {
      headers: { Authorization: `Bearer ${c2Token}` }
    });
    assert(c2GetRes.status === 403, '4. Customer cannot access another customer request (403 Forbidden)');

    // Item 5: AI classifier categorizes clear request correctly
    const aiClear = await RuleBasedClassifier.classifyRequest('Water leaking under sink needs pipe repair immediately');
    assert(aiClear.suggestedCategory === 'Phase3Plumbing' && aiClear.detectedSkills.includes('Pipe Repair'), '5. AI classifier categorizes clear plumbing request correctly');

    // Item 6: AI classifier handles unknown/ambiguous text safely
    const aiAmbiguous = await RuleBasedClassifier.classifyRequest('xyz random unclassified text 123');
    assert(aiAmbiguous.confidenceScore <= 0.40 && Array.isArray(aiAmbiguous.aiTags), '6. AI classifier handles ambiguous text safely with low confidence score');

    // Item 7: Classification is stored with the request
    const savedReq = await ServiceRequest.findById(req1Id);
    assert(savedReq.aiAnalysis && savedReq.aiAnalysis.confidenceScore > 0, '7. AI classification result stored on ServiceRequest document');

    // Item 8 & 9: Provider ranking ranks eligible verified providers & excludes unverified
    const rankedProviders = await MatchingEngine.rankProvidersForRequest(savedReq);
    assert(
      rankedProviders.length === 1 && 
      rankedProviders[0].provider._id.toString() === pVerifiedUser._id.toString() &&
      rankedProviders[0].matchScore > 70,
      '8 & 9. Matching engine ranks verified providers & excludes unverified/ineligible providers'
    );

    // Item 10: Verified provider can view matched requests
    const pMatchedRes = await request('/api/v1/requests/matched', {
      headers: { Authorization: `Bearer ${pVerifiedToken}` }
    });
    assert(pMatchedRes.status === 200 && pMatchedRes.body.requests.length === 1, '10. Verified provider can view authorized matched service request');

    // Item 11: Unverified provider blocked from viewing matched job opportunities
    const pUnverifiedRes = await request('/api/v1/requests/matched', {
      headers: { Authorization: `Bearer ${pUnverifiedToken}` }
    });
    assert(pUnverifiedRes.status === 403, '11. Unverified provider blocked from job opportunities with 403 Forbidden');

    // Item 12: Verified provider submits valid quote
    const quoteRes = await request('/api/v1/quotes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${pVerifiedToken}` }
    }, {
      serviceRequest: req1Id,
      estimatedCost: 120,
      estimatedDurationHours: 2,
      notes: 'Includes pipe seal replacement and 30-day warranty'
    });

    assert(quoteRes.status === 201 && quoteRes.body.quote.estimatedCost === 120, '12. Verified provider submits valid cost quote');

    const quoteId = quoteRes.body.quote._id;

    // Item 13: Invalid quote (e.g. 0 cost) rejected
    const badQuoteRes = await request('/api/v1/quotes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${pVerifiedToken}` }
    }, {
      serviceRequest: req1Id,
      estimatedCost: 0
    });
    assert(badQuoteRes.status === 400, '13. Invalid quote (0 cost) rejected with 400 Bad Request');

    // Item 14: Customer can view quotes for their request
    const getQuotesRes = await request(`/api/v1/quotes/request/${req1Id}`, {
      headers: { Authorization: `Bearer ${c1Token}` }
    });
    assert(getQuotesRes.status === 200 && getQuotesRes.body.quotes.length === 1, '14. Customer views quotes submitted for own service request');

    // Item 15 & 16: Customer accepts valid quote -> creates Booking with status 'Requested'
    const acceptRes = await request(`/api/v1/quotes/${quoteId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${c1Token}` }
    });

    assert(
      acceptRes.status === 200 && 
      acceptRes.body.quote.status === 'Accepted' &&
      acceptRes.body.booking.status === BOOKING_STATUS.REQUESTED,
      "15 & 16. Customer accepts quote -> creates Booking with standardized initial status 'Requested'"
    );

    // Item 17: Customer 2 cannot accept Customer 1's quote
    const c2AcceptRes = await request(`/api/v1/quotes/${quoteId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${c2Token}` }
    });
    assert(c2AcceptRes.status === 403, '17. Customer cannot accept quote belonging to another customer (403 Forbidden)');

    // Item 18: Verify Notifications created for events
    const notifs = await Notification.find({ recipient: pVerifiedUser._id });
    assert(notifs.length >= 1 && notifs.some(n => n.title.includes('Quote Accepted')), '18. In-app Notifications dispatched for quote events');

    // Item 19: Verify AuditLogs created for administrative & workflow actions
    const logs = await AuditLog.find({ actor: c1User._id });
    assert(logs.length >= 2, '19. Immutable AuditLog entries recorded for request creation & quote acceptance');

    // Cleanup test data
    await User.deleteMany({ email: /@testphase3\.com$/ });
    await ServiceCategory.deleteMany({ name: /Phase3Plumbing/ });
    await ServiceRequest.deleteMany({ _id: req1Id });
    await Quote.deleteMany({ _id: quoteId });
    await Booking.deleteMany({ serviceRequest: req1Id });

  } catch (err) {
    console.error('Phase 3 Test Execution Error:', err);
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('----------------------------------------------------');
    console.log(`Phase 3 Verification Complete: ${passed} PASSED, ${failed} FAILED.`);
    console.log('====================================================');
  }
}

runPhase3Tests();
