require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");

async function checkDetails() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log("--- TRANSPORT BOOKINGS ---");
  const tb = await db.collection("transportbookings").find({}).toArray();
  for (const t of tb) {
    console.log(`TB ID: ${t._id} | customerId: ${t.customerId} | driverId: ${t.driverId} | status: ${t.status} | pickup: ${JSON.stringify(t.pickup)} | destination: ${JSON.stringify(t.destination)} | fare: ${t.fareOffer || t.fare}`);
  }

  console.log("\n--- SERVICE PROVIDERS ---");
  const sp = await db.collection("serviceproviders").find({}).toArray();
  for (const p of sp) {
    console.log(`SP ID: ${p._id} | userId: ${p.userId} | displayName: ${p.displayName} | category: ${p.category} | verificationStatus: ${p.verificationStatus}`);
  }

  console.log("\n--- AUDIT LOGS ---");
  const al = await db.collection("auditlogs").find({}).toArray();
  for (const a of al) {
    console.log(`Log ID: ${a._id} | action: ${a.action} | adminEmail: ${a.adminEmail} | date: ${a.createdAt}`);
  }

  await mongoose.disconnect();
}

checkDetails();
