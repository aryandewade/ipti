// Comprehensive Automated Test Suite for IPTI Platform
// Tests: Server API, Admin Portal, Certificate Verification, Learner Portal, & DOM ID integrity

import fs from 'fs';
import path from 'path';
import http from 'http';
import app from './server.js';

let serverInstance = null;
const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}`;
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'ipti@admin2026';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
    failed++;
    failures.push({ testName, details });
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('STARTING COMPREHENSIVE IPTI PLATFORM TEST SUITE');
  console.log(`Testing Live Codebase on Port ${TEST_PORT}`);
  console.log('================================================================\n');

  // Start test server instance
  await new Promise((resolve) => {
    serverInstance = http.createServer(app).listen(TEST_PORT, () => {
      resolve();
    });
  });

  // ---------------------------------------------------------------------------
  // 1. STATIC PAGES & ROUTE ALIASES
  // ---------------------------------------------------------------------------
  console.log('--- 1. Testing Static HTML Pages & Route Aliases ---');
  const routesToTest = [
    { path: '/', expected: 200, name: 'Home Page (/)' },
    { path: '/index.html', expected: 200, name: 'Home Page (/index.html)' },
    { path: '/verify.html', expected: 200, name: 'Verification Page (/verify.html)' },
    { path: '/verify', expected: 200, name: 'Verification Route Alias (/verify)' },
    { path: '/learner.html', expected: 200, name: 'Learner Portal Page (/learner.html)' },
    { path: '/learner', expected: 200, name: 'Learner Route Alias (/learner)' },
    { path: '/admin.html', expected: 200, name: 'Admin Portal Page (/admin.html)' },
    { path: '/admin', expected: 200, name: 'Admin Route Alias (/admin)' },
    { path: '/api/health', expected: 200, name: 'Health Check API (/api/health)' }
  ];

  for (const r of routesToTest) {
    try {
      const res = await fetch(`${BASE_URL}${r.path}`);
      assert(res.status === r.expected, r.name, `HTTP Status: ${res.status}`);
    } catch (err) {
      assert(false, r.name, err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. PUBLIC CERTIFICATE VERIFICATION ENGINE (STUDENT ID ONLY)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Testing Certificate Verification Engine (Student ID Only) ---');
  
  // A. Verify with valid Student Unique ID (IPTI-2026-STU-01)
  try {
    const res = await fetch(`${BASE_URL}/api/certificates/verify/IPTI-2026-STU-01`);
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Verify by Student ID (IPTI-2026-STU-01)', `Status ${res.status}`);
    assert(data.type === 'certificate' && data.certificate?.studentName === 'Rahul V. Sharma', 'Verify response returns candidate name');
    assert(Boolean(data.certificate?.verificationHash), 'Verify response contains cryptographic SHA-256 hash', data.certificate?.verificationHash);
    assert(data.certificate?.studentId === 'IPTI-2026-STU-01' && !data.certificate?.certId, 'Verify response maintains single unique Student ID only', data.certificate?.studentId);
  } catch (err) {
    assert(false, 'Verify by Student ID (IPTI-2026-STU-01)', err.message);
  }

  // B. Verify with second Student ID (IPTI-2026-STU-03 - Amitesh Kulkarni)
  try {
    const res = await fetch(`${BASE_URL}/api/certificates/verify/IPTI-2026-STU-03`);
    const data = await res.json();
    assert(res.status === 200 && data.certificate?.studentName === 'Amitesh Kulkarni', 'Verify second Student ID (IPTI-2026-STU-03 - Amitesh Kulkarni)');
  } catch (err) {
    assert(false, 'Verify second Student ID', err.message);
  }

  // C. Reject legacy Certificate ID format (Verification strictly on basis of Student ID)
  try {
    const res = await fetch(`${BASE_URL}/api/certificates/verify/IPTI-CERT-2026-1042`);
    const data = await res.json();
    assert(res.status === 404 && data.status === 'not_found', 'Verification strictly uses Student ID only (rejects legacy Certificate ID)', `Status: ${res.status}`);
  } catch (err) {
    assert(false, 'Legacy Certificate ID rejection', err.message);
  }

  // D. Verify non-existent Student ID (Anti-Fraud check)
  try {
    const res = await fetch(`${BASE_URL}/api/certificates/verify/FAKE-CREDENTIAL-9999`);
    const data = await res.json();
    assert(res.status === 404 && data.success === false, 'Anti-Fraud check for non-existent Student ID (404 expected)', `Status: ${res.status}`);
    assert(data.status === 'not_found', 'Anti-Fraud response returns status: not_found');
  } catch (err) {
    assert(false, 'Anti-Fraud check', err.message);
  }

  // E. Verify ungenerated Student ID (Certificate must be generated first)
  try {
    const res = await fetch(`${BASE_URL}/api/certificates/verify/IPTI-2026-STU-02`);
    const data = await res.json();
    assert(data.status === 'not_generated' && data.candidate?.certificateIssued === false, 'Student ID without generated certificate returns status: not_generated');
  } catch (err) {
    assert(false, 'Ungenerated Student ID check', err.message);
  }

  // ---------------------------------------------------------------------------
  // 3. ADMIN PORTAL & CRM API
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Testing Admin Portal & CRM Features ---');
  let adminToken = '';

  // A. Admin Login (/api/auth/login)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS })
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true && Boolean(data.token), 'Admin Login (/api/auth/login) with valid credentials');
    adminToken = data.token;
  } catch (err) {
    assert(false, 'Admin Login', err.message);
  }

  // B. Admin Login Alias (/api/admin/login)
  try {
    const res = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS })
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true && Boolean(data.token), 'Admin Login Alias (/api/admin/login)');
  } catch (err) {
    assert(false, 'Admin Login Alias', err.message);
  }

  // C. Admin Login (Invalid Password)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
    });
    assert(res.status === 401, 'Admin Login rejects wrong password (401 expected)');
  } catch (err) {
    assert(false, 'Admin Login invalid reject', err.message);
  }

  if (adminToken) {
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };

    // D. Fetch Enquiries CRM
    try {
      const res = await fetch(`${BASE_URL}/api/enquiries`, { headers: authHeaders });
      const data = await res.json();
      assert(res.status === 200 && Array.isArray(data.data), 'Fetch Enquiries CRM (/api/enquiries)', `Count: ${data.data?.length}`);
    } catch (err) {
      assert(false, 'Fetch Enquiries', err.message);
    }

    // E. Fetch Candidates Database
    try {
      const res = await fetch(`${BASE_URL}/api/candidates`, { headers: authHeaders });
      const data = await res.json();
      assert(res.status === 200 && Array.isArray(data.data), 'Fetch Candidates LMS Database (/api/candidates)', `Count: ${data.data?.length}`);
    } catch (err) {
      assert(false, 'Fetch Candidates', err.message);
    }

    // F. Fetch Certificates List & Stats
    try {
      const res = await fetch(`${BASE_URL}/api/certificates`, { headers: authHeaders });
      const data = await res.json();
      assert(res.status === 200 && Array.isArray(data.data), 'Fetch Certificates List (/api/certificates)', `Count: ${data.data?.length}`);

      const statsRes = await fetch(`${BASE_URL}/api/certificates/stats`, { headers: authHeaders });
      const statsData = await statsRes.json();
      assert(statsRes.status === 200 && statsData.success === true, 'Fetch Certificate Stats (/api/certificates/stats)', `Total: ${statsData.stats?.total}`);
    } catch (err) {
      assert(false, 'Fetch Certificates & Stats', err.message);
    }

    // G. Create Test Certificate with Unique Student ID, enforce uniqueness, verify, then clean up
    try {
      const testStudentId = `IPTI-TEST-STU-${Date.now().toString().slice(-4)}`;
      const createRes = await fetch(`${BASE_URL}/api/certificates`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          studentId: testStudentId,
          studentName: 'Automated Test Candidate',
          studentEmail: 'autotest@ipti.edu.in',
          studentPhone: '+91 99999 00000',
          program: 'Robotics & AI Automation',
          grade: 'Distinction (Grade A+ • 98%)',
          issueDate: new Date().toISOString().slice(0, 10),
          standard: 'Government Recognized Standard',
          notes: 'Automated Test Verification'
        })
      });
      const createData = await createRes.json();
      assert(createRes.status === 201 && createData.success === true, 'Admin Issue New Certificate by Unique Student ID', `ID: ${testStudentId}`);

      // Enforce duplicate Student ID rejection on certificates (409 expected)
      const dupCertRes = await fetch(`${BASE_URL}/api/certificates`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          studentId: testStudentId,
          studentName: 'Duplicate Test Candidate',
          studentEmail: 'dup@ipti.edu.in',
          program: 'Robotics & AI Automation'
        })
      });
      assert(dupCertRes.status === 409, 'Enforce Unique Student ID on Certificate Issuance (409 on duplicate)', `Status: ${dupCertRes.status}`);

      // Enforce duplicate Student ID rejection on candidates (409 expected)
      const dupCandRes = await fetch(`${BASE_URL}/api/candidates`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          studentId: 'IPTI-2026-STU-01',
          fullName: 'Duplicate Candidate',
          email: 'uniqueemail@ipti.edu.in',
          program: 'Robotics & AI Automation'
        })
      });
      assert(dupCandRes.status === 409, 'Enforce Unique Student ID on Candidate Creation (409 on duplicate)', `Status: ${dupCandRes.status}`);

      // Verify the newly created certificate via public endpoint using Student ID
      const verifyRes = await fetch(`${BASE_URL}/api/certificates/verify/${testStudentId}`);
      const verifyData = await verifyRes.json();
      assert(verifyRes.status === 200 && verifyData.certificate?.studentName === 'Automated Test Candidate', 'Public verification of newly issued certificate by Student ID');

      // Delete/cleanup the test certificate
      if (createData.data?.id) {
        const delRes = await fetch(`${BASE_URL}/api/certificates/${createData.data.id}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        const delData = await delRes.json();
        assert(delRes.status === 200 && delData.success === true, 'Admin Revoke/Delete Certificate (Cleanup)');
      }

      // H. Program Syllabus Upload & Download Verification
      const dummyPdfBase64 = Buffer.from('%PDF-1.4 sample test syllabus').toString('base64');
      const uploadSyllabusRes = await fetch(`${BASE_URL}/api/programs/upload-syllabus`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          filename: 'test-syllabus.pdf',
          fileData: `data:application/pdf;base64,${dummyPdfBase64}`
        })
      });
      const uploadSyllabusData = await uploadSyllabusRes.json();
      assert(uploadSyllabusRes.status === 200 && Boolean(uploadSyllabusData.url), 'Admin Upload Program Syllabus File', uploadSyllabusData.url);

      // Verify syllabus file is publicly downloadable
      const downloadSyllabusRes = await fetch(`${BASE_URL}${uploadSyllabusData.url}`);
      assert(downloadSyllabusRes.status === 200, 'Public Download Verification of Uploaded Syllabus');
    } catch (err) {
      assert(false, 'Certificate & Syllabus CRUD test', err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. LEARNER PORTAL FEATURES
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Testing Learner Candidate Portal ---');
  let learnerToken = '';

  // A. Learner Login with Student ID
  try {
    const res = await fetch(`${BASE_URL}/api/learner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: 'IPTI-2026-STU-01', password: 'ipti@123' })
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true && Boolean(data.token), 'Learner Login with Student ID (IPTI-2026-STU-01)');
    learnerToken = data.token;
  } catch (err) {
    assert(false, 'Learner Login', err.message);
  }

  // B. Learner Login with Invalid Password
  try {
    const res = await fetch(`${BASE_URL}/api/learner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: 'IPTI-2026-STU-01', password: 'wrongpassword' })
    });
    assert(res.status === 401, 'Learner Login rejects invalid password (401 expected)');
  } catch (err) {
    assert(false, 'Learner Login invalid reject', err.message);
  }

  // C. Learner Profile & Certificate Status
  if (learnerToken) {
    try {
      const res = await fetch(`${BASE_URL}/api/learner/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${learnerToken}`
        }
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true, 'Fetch Learner Profile (/api/learner/profile)');
      assert(data.student?.fullName === 'Rahul V. Sharma', 'Learner Profile returns student name');
      assert(Boolean(data.certificate), 'Learner Profile returns matched official certificate', data.certificate?.studentId);
      assert(data.student?.eligibleForCertificate === true, 'Learner eligibility status verified');

      // D. Upload Learner Avatar Photo
      const dummyPhotoBase64 = Buffer.from('dummy-image-data-2026').toString('base64');
      const photoRes = await fetch(`${BASE_URL}/api/learner/photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${learnerToken}`
        },
        body: JSON.stringify({
          filename: 'rahul-avatar.jpg',
          photoData: `data:image/jpeg;base64,${dummyPhotoBase64}`
        })
      });
      const photoData = await photoRes.json();
      assert(photoRes.status === 200 && Boolean(photoData.photoUrl), 'Learner Profile Photo Upload (/api/learner/photo)', photoData.photoUrl);

      // E. Update Learner Profile Details
      const updateProfileRes = await fetch(`${BASE_URL}/api/learner/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${learnerToken}`
        },
        body: JSON.stringify({
          phone: '+91 98230 45671',
          whatsapp: '+91 98230 45671'
        })
      });
      const updateProfileData = await updateProfileRes.json();
      assert(updateProfileRes.status === 200 && updateProfileData.success === true, 'Learner Profile Update (/api/learner/profile)');
    } catch (err) {
      assert(false, 'Learner Profile Fetch & Update', err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. DOM & ELEMENT ID INTEGRITY CHECK
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Testing DOM Element IDs & Client Script Bindings ---');
  function checkDomBindings(htmlFile, jsFile) {
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    const jsContent = fs.readFileSync(jsFile, 'utf8');

    const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
    let match;
    const requiredIds = new Set();
    while ((match = idRegex.exec(jsContent)) !== null) {
      requiredIds.add(match[1]);
    }

    let missing = [];
    for (const id of requiredIds) {
      // Ignore optional forms guarded by if (el) that are superseded
      if (id === 'heroQuickForm') continue;

      const inHtml = htmlContent.includes(`id="${id}"`) || htmlContent.includes(`id='${id}'`);
      const inJsInjected = jsContent.includes(`id="${id}"`) || jsContent.includes(`id=\\"${id}\\"`) || jsContent.includes(`id='${id}'`);
      if (!inHtml && !inJsInjected) {
        missing.push(id);
      }
    }

    assert(missing.length === 0, `DOM ID Integrity: ${path.basename(jsFile)} -> ${path.basename(htmlFile)}`, missing.length > 0 ? `Missing IDs: ${missing.join(', ')}` : '');
  }

  try {
    checkDomBindings('verify.html', 'verify.js');
    checkDomBindings('learner.html', 'learner.js');
    checkDomBindings('admin.html', 'admin.js');
    checkDomBindings('index.html', 'app.js');
  } catch (err) {
    assert(false, 'DOM Bindings Check', err.message);
  }

  // ---------------------------------------------------------------------------
  // 6. DEFENSIVE SECURITY HARDENING & ISOLATION CHECKS
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Testing Defensive Security Hardening & Isolation ---');

  // A. Sensitive static files are blocked with 403 Forbidden
  const protectedStaticFiles = [
    '/data/candidates.json',
    '/data/enquiries.json',
    '/data/certificates.json',
    '/server.js',
    '/package.json',
    '/.env'
  ];

  for (const p of protectedStaticFiles) {
    try {
      const res = await fetch(`${BASE_URL}${p}`);
      assert(res.status === 403, `Static Shielding: ${p} access forbidden (HTTP 403 expected)`, `Status: ${res.status}`);
    } catch (err) {
      assert(false, `Static Shielding: ${p}`, err.message);
    }
  }

  // B. HTTP Security Headers
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const nosniff = res.headers.get('x-content-type-options');
    const xframe = res.headers.get('x-frame-options');
    assert(nosniff === 'nosniff', 'Security Header: X-Content-Type-Options: nosniff present');
    assert(xframe === 'SAMEORIGIN', 'Security Header: X-Frame-Options: SAMEORIGIN present');
  } catch (err) {
    assert(false, 'Security Headers check', err.message);
  }

  // C. Candidate API Credential Redaction (Password Field Stripping)
  if (adminToken) {
    try {
      const res = await fetch(`${BASE_URL}/api/candidates`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      const hasAnyPassword = data.data && data.data.some(c => c.password !== undefined);
      assert(!hasAnyPassword, 'Candidate API redacts password field from all candidate items in list');
    } catch (err) {
      assert(false, 'Candidate password redaction check', err.message);
    }
  }

  // Close test server
  if (serverInstance) {
    serverInstance.close();
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    console.error('Failure Details:');
    failures.forEach((f, i) => console.error(`  ${i + 1}. ${f.testName}: ${f.details}`));
    process.exit(1);
  } else {
    console.log('ALL SYSTEMS FULLY OPERATIONAL WITH ZERO BREAKAGES!');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  if (serverInstance) serverInstance.close();
  process.exit(1);
});
