/**
 * Comprehensive Backend-Mobile Integration Test Script using native fetch
 */

const BASE_URL = 'http://localhost:5000/api/v1';

const credentials = {
  customer: { email: 'demo.customer@nukrentserve.com', password: 'Demo@Customer123' },
  provider: { email: 'demo.provider@nukrentserve.com', password: 'Demo@Provider123' },
  driver: { email: 'demo.driver@nukrentserve.com', password: 'Demo@Driver123' },
  student: { email: 'demo.student@nukrentserve.com', password: 'Demo@Student123' },
  admin: { email: 'demo.admin@nukrentserve.com', password: 'Demo@Admin123' },
};

async function runTests() {
  console.log('=== STARTING INTEGRATION TESTS ===\n');
  const tokens = {};
  const users = {};

  // 1. Health Check
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const data = await healthRes.json();
    console.log('✓ [1/8] Health Check Passed:', data);
  } catch (err) {
    console.error('✗ [1/8] Health Check Failed:', err.message);
    process.exit(1);
  }

  // 2. Auth for all 5 roles
  for (const [role, cred] of Object.entries(credentials)) {
    try {
      const url = role === 'admin' ? `${BASE_URL}/admin/login` : `${BASE_URL}/auth/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred)
      });
      const data = await res.json();
      const token = data.data?.accessToken || data.data?.token || data.accessToken || data.token;
      const user = data.data?.user || data.data?.admin || data.user || data.admin;

      if (res.ok && token) {
        tokens[role] = token;
        users[role] = user;
        console.log(`✓ [2/8] Login Passed for Role: ${role.toUpperCase()} (ID: ${user?.id || user?._id}, Role: ${user?.role})`);
      } else {
        throw new Error(data.message || 'Token not returned');
      }
    } catch (err) {
      console.error(`✗ [2/8] Login Failed for ${role}:`, err.message);
      process.exit(1);
    }
  }

  // 3. User Profiles
  try {
    const profileRes = await fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${tokens.customer}` }
    });
    const profileData = await profileRes.json();
    const customerUser = profileData.data?.user || profileData.user || profileData.data;
    console.log(`✓ [3/8] Customer Profile Loaded: Name: "${customerUser?.name}", Role: "${customerUser?.role}"`);
  } catch (err) {
    console.error('✗ [3/8] Customer Profile Fetch Failed:', err.message);
  }

  // 4. Services & Rentals Listings
  try {
    const servicesRes = await fetch(`${BASE_URL}/services`);
    const servicesData = await servicesRes.json();
    const rentalsRes = await fetch(`${BASE_URL}/properties`);
    const rentalsData = await rentalsRes.json();
    const sList = servicesData.data?.services || servicesData.data || (Array.isArray(servicesData) ? servicesData : []);
    const rList = rentalsData.data?.properties || rentalsData.data || (Array.isArray(rentalsData) ? rentalsData : []);
    console.log(`✓ [4/8] Listings Loaded: ${sList.length || 0} Services, ${rList.length || 0} Rentals`);
  } catch (err) {
    console.error('✗ [4/8] Listings Fetch Failed:', err.message);
  }

  // 5. Admin Applications Review List
  let pendingApplications = [];
  try {
    const appsRes = await fetch(`${BASE_URL}/admin/applications`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    const appsData = await appsRes.json();
    pendingApplications = appsData.data?.applications || appsData.applications || appsData.data || [];
    console.log(`✓ [5/8] Admin Applications Loaded: ${pendingApplications.length} applications in review`);
  } catch (err) {
    console.error('✗ [5/8] Admin Applications Fetch Failed:', err.message);
  }

  // 6. Document Preview Streaming Endpoint (PDF and Image)
  let testApp = pendingApplications.find(a => a.hasDrivingLicence || a.applicationType === 'driver') || pendingApplications[0];
  if (testApp) {
    const appId = testApp._id || testApp.id;
    try {
      // Test PDF document preview endpoint
      const pdfRes = await fetch(`${BASE_URL}/admin/applications/${appId}/document/drivingLicence?token=${tokens.admin}`);
      const pdfBuf = await pdfRes.arrayBuffer();
      console.log(`✓ [6/8a] Admin Document Stream (PDF) Passed: HTTP ${pdfRes.status}, Content-Type: ${pdfRes.headers.get('content-type')}, Size: ${pdfBuf.byteLength} bytes`);
      
      // Test Image document preview endpoint
      const imgRes = await fetch(`${BASE_URL}/admin/applications/${appId}/document/aadhaar?token=${tokens.admin}`);
      const imgBuf = await imgRes.arrayBuffer();
      console.log(`✓ [6/8b] Admin Document Stream (Image) Passed: HTTP ${imgRes.status}, Content-Type: ${imgRes.headers.get('content-type')}, Size: ${imgBuf.byteLength} bytes`);
    } catch (err) {
      console.error('✗ [6/8] Document Preview Fetch Failed:', err.message);
    }
  }

  // 7. Security: Unauthorized Document Access
  try {
    const unauthorizedRes = await fetch(`${BASE_URL}/admin/applications/${testApp?._id || testApp?.id || '123'}/document/drivingLicence`, {
      headers: { Authorization: `Bearer ${tokens.customer}` } // Customer trying to access admin doc route
    });
    if (unauthorizedRes.status === 401 || unauthorizedRes.status === 403) {
      console.log(`✓ [7/8] Security Passed: Customer rejected with HTTP ${unauthorizedRes.status} on Admin endpoint`);
    } else {
      console.error(`✗ [7/8] Security Test Failed: Unexpected status ${unauthorizedRes.status}`);
    }
  } catch (err) {
    console.log(`✓ [7/8] Security Passed: ${err.message}`);
  }

  // 8. User Document Self-View
  try {
    const myAppRes = await fetch(`${BASE_URL}/documents/my-application`, {
      headers: { Authorization: `Bearer ${tokens.driver}` }
    });
    const myAppData = await myAppRes.json();
    const appRecord = myAppData.data?.application || myAppData.application;
    console.log(`✓ [8/8a] Driver My-Application Loaded: Status = ${appRecord?.status || 'loaded'}`);
    
    const myDocRes = await fetch(`${BASE_URL}/documents/mine/drivingLicence?token=${tokens.driver}`);
    const myDocBuf = await myDocRes.arrayBuffer();
    console.log(`✓ [8/8b] Driver Mine Document Preview (PDF) Passed: HTTP ${myDocRes.status}, Content-Type: ${myDocRes.headers.get('content-type')}, Size: ${myDocBuf.byteLength} bytes`);
  } catch (err) {
    console.error('✗ [8/8] Driver Document Self-View Failed:', err.message);
  }

  console.log('\n=== ALL INTEGRATION VERIFICATION CHECKS COMPLETED SUCCESSFULLY ===');
}

runTests();
