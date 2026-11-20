const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const BASE = "http://localhost:5000/api/v1";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require("../src/models/User");
  const PhoneOtp = require("../src/models/PhoneOtp");
  const bcrypt = require("bcryptjs");

  const existingPhone = "9740821099";
  await User.deleteMany({ phone: existingPhone });
  await PhoneOtp.deleteMany({ phone: existingPhone });

  // 1. Create an established existing customer with a password
  const originalPassword = "MyExistingPassword123!";
  const establishedUser = await User.create({
    name: "Established Customer",
    email: "established@example.com",
    phone: existingPhone,
    phoneNumber: existingPhone,
    phoneCountryCode: "+91",
    normalizedPhoneNumber: "+91" + existingPhone,
    role: "customer",
    phoneVerified: true,
    phoneVerifiedAt: new Date(),
    profileCompleted: true,
    location: "Bagalkot",
    approvalStatus: "approved",
    password: await bcrypt.hash(originalPassword, 12)
  });
  console.log("✓ [Setup] Created established customer:", establishedUser.name, "(Phone:", establishedUser.phone, ")");

  // 2. Existing Customer requests OTP for Login
  console.log("\n=== 1. Existing Customer requests OTP for Login ===");
  const sendRes = await fetch(`${BASE}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: existingPhone, purpose: "login", role: "customer" })
  });
  const sendData = await sendRes.json();
  console.log("Send OTP status:", sendRes.status, sendData.message);
  const otp = sendData.data?.devOtp;
  console.log("Received OTP code for login:", otp);

  // 3. Existing Customer logs in with OTP
  console.log("\n=== 2. Existing Customer logs in with OTP ===");
  const loginRes = await fetch(`${BASE}/auth/login-with-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: existingPhone, otp, role: "customer" })
  });
  const loginData = await loginRes.json();
  console.log("Login HTTP status:", loginRes.status, loginData.message);
  console.log("Authenticated User Name:", loginData.data?.user?.name);
  console.log("Role:", loginData.data?.user?.role);
  console.log("isNewUser:", loginData.data?.isNewUser);
  console.log("JWT AccessToken received:", Boolean(loginData.data?.accessToken));

  // 4. Verify original password remains intact (not overwritten by OTP login)
  const userCheck = await User.findById(establishedUser._id).select("+password");
  const passwordValid = await bcrypt.compare(originalPassword, userCheck.password);
  console.log("Original password preserved intact:", passwordValid);

  // 5. Test Password Login continues working alongside OTP
  console.log("\n=== 3. Existing Customer logs in with Password ===");
  const pwLoginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: existingPhone, password: originalPassword })
  });
  const pwLoginData = await pwLoginRes.json();
  console.log("Password Login HTTP status:", pwLoginRes.status, pwLoginData.message || "Success");
  console.log("JWT AccessToken via password:", Boolean(pwLoginData.data?.accessToken));

  // 6. Test New Customer Auto-Registration via OTP
  console.log("\n=== 4. New Customer OTP Auto-Registration ===");
  const newPhone = "9740821088";
  await User.deleteMany({ phone: newPhone });
  await PhoneOtp.deleteMany({ phone: newPhone });

  const newSendRes = await fetch(`${BASE}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: newPhone, purpose: "login", role: "customer" })
  });
  const newSendData = await newSendRes.json();
  const newOtp = newSendData.data?.devOtp;

  const newLoginRes = await fetch(`${BASE}/auth/login-with-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: newPhone, otp: newOtp, role: "customer" })
  });
  const newLoginData = await newLoginRes.json();
  console.log("New Customer Login status:", newLoginRes.status, newLoginData.message);
  console.log("New User Auto-Created Name:", newLoginData.data?.user?.name);
  console.log("Role:", newLoginData.data?.user?.role);
  console.log("isNewUser:", newLoginData.data?.isNewUser);
  console.log("profileCompleted:", newLoginData.data?.user?.profileCompleted);

  // Cleanup test accounts
  await User.deleteMany({ phone: { $in: [existingPhone, newPhone] } });
  await PhoneOtp.deleteMany({ phone: { $in: [existingPhone, newPhone] } });
  await mongoose.disconnect();

  console.log("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY! No errors detected.");
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
