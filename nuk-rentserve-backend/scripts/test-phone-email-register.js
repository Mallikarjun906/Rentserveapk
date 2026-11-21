const jwt = require("jsonwebtoken");

async function runRegistrationTests() {
  const apiKey = "o9l6U47i3BvhYRp6iCHuNhdAkY944oEP";
  const baseUrl = "http://localhost:5000/api/v1";

  console.log("=== TEST: Customer Registration with Phone.Email Verification ===");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testPhone = `98450${randomSuffix}`;
  const testEmail = `newcustomer_${randomSuffix}@example.com`;

  const validToken = jwt.sign(
    {
      iss: "phmail",
      aud: "user",
      country_code: "+91",
      phone_no: testPhone,
      exp: Math.floor(Date.now() / 1000) + 300
    },
    apiKey,
    { algorithm: "HS256" }
  );

  // 1. Verify Phone.Email token with purpose: customer-registration
  const verifyRes = await fetch(baseUrl + "/auth/phone-email/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: validToken, purpose: "customer-registration" })
  });
  const verifyData = await verifyRes.json();
  console.log("Phone.Email Verify Status:", verifyRes.status);
  if (verifyRes.status !== 200 || !verifyData.data?.verificationToken) {
    throw new Error("Verification failed: " + JSON.stringify(verifyData));
  }
  const verificationToken = verifyData.data.verificationToken;

  // 2. Register new customer with verificationToken
  const regRes = await fetch(baseUrl + "/auth/customer/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "New Test Customer",
      email: testEmail,
      password: "TestSecurePassword123!",
      confirmPassword: "TestSecurePassword123!",
      verificationToken,
      terms: true,
      city: "Bagalkot"
    })
  });
  const regData = await regRes.json();
  console.log("Customer Register Status:", regRes.status);
  console.log("Registered User Phone:", regData.data?.user?.phone, "| Verified:", regData.data?.user?.phoneVerified);
  if (regRes.status !== 201 || !regData.data?.accessToken) {
    throw new Error("Customer registration failed: " + JSON.stringify(regData));
  }
  console.log("--> Registration with Phone.Email Token Passed Successfully!");

  console.log("\n=== TEST: Prevent Duplicate Registration of Existing Phone ===");
  const dupToken = jwt.sign(
    {
      iss: "phmail",
      aud: "user",
      country_code: "+91",
      phone_no: testPhone, // already registered above
      exp: Math.floor(Date.now() / 1000) + 300
    },
    apiKey,
    { algorithm: "HS256" }
  );
  const dupVRes = await fetch(baseUrl + "/auth/phone-email/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: dupToken, purpose: "customer-registration" })
  });
  const dupVData = await dupVRes.json();
  const dupRegRes = await fetch(baseUrl + "/auth/customer/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Another Name",
      email: `another_${randomSuffix}@example.com`,
      password: "TestSecurePassword123!",
      confirmPassword: "TestSecurePassword123!",
      verificationToken: dupVData.data.verificationToken,
      terms: true,
      city: "Bagalkot"
    })
  });
  console.log("Duplicate registration status (expected 409):", dupRegRes.status);
  const dupRegData = await dupRegRes.json();
  console.log("Message:", dupRegData.message);
  if (dupRegRes.status !== 409) {
    throw new Error("Expected 409, got " + dupRegRes.status);
  }
  console.log("--> Duplicate phone registration correctly prevented!");
}

runRegistrationTests().catch(e => {
  console.error(e);
  process.exit(1);
});
