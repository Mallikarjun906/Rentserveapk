require("dotenv").config();
const mongoose = require("mongoose");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const users = await User.find({}, "name email phone role approvalStatus createdAt").lean();
  console.log("=== TOTAL USERS IN DB ===", users.length);
  console.log("=== USERS LIST ===");
  users.forEach(u => {
    console.log(`- Name: ${u.name} | Email: ${u.email} | Phone: ${u.phone} | Role: ${u.role} | Status: ${u.approvalStatus}`);
  });
  
  const target = await User.findOne({ 
    $or: [
      { email: "mallikarjun410@gmail.com" },
      { email: /mallikarjun/i }
    ] 
  }).lean();
  console.log("\n=== TARGET USER (mallikarjun410@gmail.com) ===");
  console.log(target ? JSON.stringify(target, null, 2) : "NOT FOUND IN DATABASE");

  if (target && target.password) {
    const bcrypt = require("bcryptjs");
    const candidates = [
      "mallu121", "Mallu121", "Mallu@121", "mallu@121", 
      "12345678", "Mallikarjun", "Mallikarjun@123", "Mallikarjun123",
      "9019968082", "AdminSecurePass2026!", "badiger@123", "Badiger@123",
      "mallu", "Mallu", "password", "Password@123"
    ];
    for (const c of candidates) {
      if (bcrypt.compareSync(c, target.password)) {
        console.log("\n>>> PASSWORD MATCH FOUND: <<<\n", c);
        break;
      }
    }
  }
  
  const AuditLog = mongoose.model("AuditLog", new mongoose.Schema({}, { strict: false }));
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(10).lean();
  console.log("\n=== RECENT AUDIT LOGS ===");
  logs.forEach(l => console.log(l.createdAt, l.action, JSON.stringify(l.details || l.metadata || "")));

  await mongoose.disconnect();
}

check().catch(console.error);
