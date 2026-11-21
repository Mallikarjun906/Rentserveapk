const jwt = require("jsonwebtoken");

async function runTests() {
  const apiKey = "o9l6U47i3BvhYRp6iCHuNhdAkY944oEP";
  const baseUrl = "http://localhost:5000/api/v1";

  console.log("=== TEST 1: Valid Phone.Email Token Verification ===");
  const testPhone = "9019968082";
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

  const res1 = await fetch(baseUrl + "/auth/phone-email/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: validToken, purpose: "customer-login" })
  });
  const data1 = await res1.json();
  console.log("Status:", res1.status);
  console.log("Response:", JSON.stringify(data1));
  if (res1.status !== 200 || !data1.data?.verificationToken) {
    throw new Error("Test 1 Failed: " + JSON.stringify(data1));
  }
  const verificationToken = data1.data.verificationToken;
  console.log("--> Test 1 Passed! Received verificationToken:", verificationToken.slice(0, 15) + "...");

  console.log("\n=== TEST 2: Customer Login with Verification Token ===");
  const res2 = await fetch(baseUrl + "/auth/customer/phone-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verificationToken })
  });
  const data2 = await res2.json();
  console.log("Status:", res2.status);
  console.log("User Phone:", data2.data?.user?.phone, "| Role:", data2.data?.user?.role, "| Has AccessToken:", Boolean(data2.data?.accessToken));
  if (res2.status !== 200 || !data2.data?.accessToken) {
    throw new Error("Test 2 Failed: " + JSON.stringify(data2));
  }
  console.log("--> Test 2 Passed! Customer logged in successfully!");

  console.log("\n=== TEST 3: Replay Attack Prevention ===");
  const res3 = await fetch(baseUrl + "/auth/phone-email/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: validToken, purpose: "customer-login" })
  });
  console.log("Replay status (expected 409):", res3.status);
  if (res3.status !== 409) {
    throw new Error("Test 3 Failed! Expected 409, got " + res3.status);
  }
  console.log("--> Test 3 Passed! Replay correctly prevented with 409 Conflict!");

  console.log("\n=== TEST 4: Invalid Secret Key Rejection ===");
  const badToken = jwt.sign(
    {
      iss: "phmail",
      aud: "user",
      country_code: "+91",
      phone_no: "9876543210",
      exp: Math.floor(Date.now() / 1000) + 300
    },
    "wrong_secret_key_12345",
    { algorithm: "HS256" }
  );

  const res4 = await fetch(baseUrl + "/auth/phone-email/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: badToken, purpose: "customer-login" })
  });
  console.log("Invalid token status (expected 401):", res4.status);
  if (res4.status !== 401) {
    throw new Error("Test 4 Failed! Expected 401, got " + res4.status);
  }
  console.log("--> Test 4 Passed! Forged/invalid token rejected with 401 Unauthorized!");

  console.log("\n=== TEST 5: Direct Customer Phone Login with Token ===");
  const freshToken = jwt.sign(
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

  const res5 = await fetch(baseUrl + "/auth/customer/phone-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: freshToken })
  });
  const data5 = await res5.json();
  console.log("Direct login status:", res5.status);
  if (res5.status !== 200 || !data5.data?.accessToken) {
    throw new Error("Test 5 Failed: " + JSON.stringify(data5));
  }
  console.log("--> Test 5 Passed! Direct JWT login works!");

  console.log("\n==========================================");
  console.log("  ALL 5 PHONE.EMAIL AUTH TESTS PASSED!   ");
  console.log("==========================================");
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
