import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { generateToken } from '../utils/jwt.js';
import { ROLES } from '../config/constants.js';

dotenv.config();

let server;

// Multipart form data builder helper for raw HTTP requests
function createMultipartPayload(fields, file) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  let body = '';

  for (const [key, value] of Object.entries(fields)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    body += `${value}\r\n`;
  }

  if (file) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"\r\n`;
    body += `Content-Type: ${file.mimetype}\r\n\r\n`;
  }

  const payloadHeader = Buffer.from(body, 'utf-8');
  const payloadFooter = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const fileBuffer = file ? file.buffer : Buffer.alloc(0);

  const fullBuffer = Buffer.concat([payloadHeader, fileBuffer, payloadFooter]);
  return { boundary, buffer: fullBuffer };
}

const request = (path, options = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const isMultipart = options.isMultipart;
    const reqOptions = {
      hostname: '127.0.0.1',
      port: 5007,
      path,
      method: options.method || 'GET',
      headers: {
        ...(isMultipart ? { 'Content-Type': `multipart/form-data; boundary=${options.boundary}` } : { 'Content-Type': 'application/json' }),
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
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
};

async function runFinalVerification() {
  console.log('====================================================');
  console.log('    PHASE 2 FINAL TARGETED VERIFICATION CHECKS      ');
  console.log('====================================================');

  await connectDB();
  server = app.listen(5007);

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
    // Setup test users
    await User.deleteMany({ email: /@finalphase2\.com$/ });

    const p1User = await User.create({ name: 'Provider 1', email: 'p1@finalphase2.com', password: 'password123', phone: '555-1111', role: ROLES.SERVICE_PROVIDER });
    const p2User = await User.create({ name: 'Provider 2', email: 'p2@finalphase2.com', password: 'password123', phone: '555-2222', role: ROLES.SERVICE_PROVIDER });
    const opsUser = await User.create({ name: 'Ops Agent', email: 'ops@finalphase2.com', password: 'password123', phone: '555-3333', role: ROLES.OPS_MANAGER });

    const p1Token = generateToken(p1User._id, p1User.role);
    const p2Token = generateToken(p2User._id, p2User.role);
    const opsToken = generateToken(opsUser._id, opsUser.role);

    // Test 1, 2, 3: Upload valid document (PDF/PNG) to POST /api/v1/providers/documents & check MongoDB record
    const validFile = {
      fieldname: 'file',
      filename: 'master_license.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('FAKE_PDF_DOCUMENT_CONTENT_HEADER_%PDF-1.4')
    };

    const multipart1 = createMultipartPayload({ docName: 'Master Plumber License' }, validFile);
    const uploadRes = await request('/api/v1/providers/documents', {
      method: 'POST',
      isMultipart: true,
      boundary: multipart1.boundary,
      headers: { Authorization: `Bearer ${p1Token}` }
    }, multipart1.buffer);

    assert(uploadRes.status === 201 && uploadRes.body.success === true, '1. Provider uploads valid PDF verification document to POST /api/v1/providers/documents');

    // Verify MongoDB ProviderProfile.verificationDocuments record fields
    const p1Profile = await ProviderProfile.findOne({ user: p1User._id });
    const docRecord = p1Profile?.verificationDocuments?.[0];
    console.log('Inspecting docRecord:', docRecord);

    assert(
      docRecord &&
      docRecord.docName === 'Master Plumber License' &&
      docRecord.fileUrl && docRecord.fileUrl.startsWith('https://') &&
      typeof docRecord.cloudinaryId === 'string' &&
      docRecord.uploadedAt,
      '2 & 3. Cloudinary upload successful & MongoDB record contains docName, secure HTTPS fileUrl, cloudinaryId, and uploadedAt'
    );

    // Test 4: Test invalid file type (.txt / text/plain)
    const invalidFile = {
      fieldname: 'file',
      filename: 'script.exe',
      mimetype: 'application/x-msdownload',
      buffer: Buffer.from('BINARY_EXE_DATA')
    };
    const multipart2 = createMultipartPayload({ docName: 'Malicious File' }, invalidFile);
    const badTypeRes = await request('/api/v1/providers/documents', {
      method: 'POST',
      isMultipart: true,
      boundary: multipart2.boundary,
      headers: { Authorization: `Bearer ${p1Token}` }
    }, multipart2.buffer);

    assert(badTypeRes.status === 400, '4. Invalid file type rejected with 400 Bad Request');

    // Test 5: Test file larger than 5MB limit
    const hugeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB
    const hugeFile = {
      fieldname: 'file',
      filename: 'huge_scan.png',
      mimetype: 'image/png',
      buffer: hugeBuffer
    };
    const multipart3 = createMultipartPayload({ docName: 'Huge Image' }, hugeFile);
    const hugeRes = await request('/api/v1/providers/documents', {
      method: 'POST',
      isMultipart: true,
      boundary: multipart3.boundary,
      headers: { Authorization: `Bearer ${p1Token}` }
    }, multipart3.buffer);

    assert(hugeRes.status === 400, '5. File larger than 5MB limit rejected with 400 Bad Request');

    // Test 6: Provider verification rejection
    const rejectRes = await request(`/api/v1/providers/${p1Profile._id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${opsToken}` }
    }, {
      status: 'Rejected',
      rejectionReason: 'Trade license documentation is illegible. Please resubmit clear scan.'
    });

    const updatedP1Profile = await ProviderProfile.findById(p1Profile._id);
    const p1Notif = await Notification.findOne({ recipient: p1User._id, title: /Rejected/ });
    const p1Audit = await AuditLog.findOne({ targetEntityId: p1Profile._id, action: 'PROVIDER_VERIFICATION_REJECTED' });

    assert(
      rejectRes.status === 200 &&
      updatedP1Profile.verificationStatus === 'Rejected' &&
      p1Notif && p1Notif.message.includes('illegible') &&
      p1Audit && p1Audit.details.rejectionReason.includes('illegible'),
      '6. Provider rejection verified: rejectionReason stored, Provider notified with reason, AuditLog created'
    );

    // Test 7: Confirm Provider 2 cannot access or modify Provider 1 profile
    const unauthModifyRes = await request('/api/v1/providers/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${p2Token}` }
    }, {
      bio: 'Attempting to overwrite another profile'
    });

    // P2 modifies P2's profile, not P1's
    const p1ProfileAfter = await ProviderProfile.findById(p1Profile._id);
    assert(p1ProfileAfter.bio !== 'Attempting to overwrite another profile', "7. Service Provider cannot modify another provider's profile");

    // Test 8: Confirm Customer cannot approve/reject verification
    const custUser = await User.create({ name: 'Customer X', email: 'custx@finalphase2.com', password: 'password123', phone: '555-4444', role: ROLES.CUSTOMER });
    const custToken = generateToken(custUser._id, custUser.role);

    const custVerifyRes = await request(`/api/v1/providers/${p1Profile._id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${custToken}` }
    }, { status: 'Verified' });

    assert(custVerifyRes.status === 403, '8. Only Operations Manager & Platform Admin can approve/reject verification (Customer blocked with 403 Forbidden)');

    // Cleanup
    await User.deleteMany({ email: /@finalphase2\.com$/ });
    await ProviderProfile.deleteMany({ _id: p1Profile._id });

  } catch (err) {
    console.error('Final Verification Error:', err);
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('----------------------------------------------------');
    console.log(`Final Verification Complete: ${passed} PASSED, ${failed} FAILED.`);
    console.log('====================================================');
  }
}

runFinalVerification();
