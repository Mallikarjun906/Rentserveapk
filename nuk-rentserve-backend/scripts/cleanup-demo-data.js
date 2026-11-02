require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

async function cleanupDemoData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing from backend .env");

  // Verify backup exists before doing anything
  const backupsDir = path.resolve(__dirname, "../backups");
  if (!fs.existsSync(backupsDir)) throw new Error("Backups directory not found! Aborting for safety.");
  const backups = fs.readdirSync(backupsDir).filter(f => f.startsWith("backup-"));
  if (backups.length === 0) throw new Error("No verified backup found! Aborting for safety.");
  console.log(`Verified backup present: ${backups[backups.length - 1]}`);

  console.log("Connecting to database for demo data cleanup...");
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const demoEmails = [
    "demo.customer@nukrentserve.com",
    "demo.provider@nukrentserve.com",
    "demo.driver@nukrentserve.com",
    "demo.student@nukrentserve.com",
    "demo.admin@nukrentserve.com"
  ];

  console.log("\n=== 1. IDENTIFYING CONFIRMED DEMO ACCOUNTS ===");
  const usersCol = db.collection("users");
  const demoUsers = await usersCol.find({
    $or: [
      { isDemo: true },
      { email: { $in: demoEmails } }
    ]
  }).toArray();

  console.log(`Found ${demoUsers.length} confirmed demo user accounts:`);
  const demoUserIds = [];
  for (const u of demoUsers) {
    demoUserIds.push(u._id);
    console.log(`  - [DEMO USER] ID: ${u._id} | Email: ${u.email} | Role: ${u.role} | isDemo: ${u.isDemo}`);
  }

  // Double check that genuine users are NOT in this list
  const genuineUsers = await usersCol.find({
    _id: { $nin: demoUserIds }
  }).toArray();
  console.log(`\nGenuine users to preserve: ${genuineUsers.length}`);
  for (const g of genuineUsers) {
    if (g.email.includes("demo.")) {
      throw new Error(`Safety violation: genuine list contains demo pattern ${g.email}`);
    }
  }

  console.log("\n=== 2. IDENTIFYING ASSOCIATED DEMO BUSINESS RECORDS ===");
  // Provider Applications
  const appCol = db.collection("providerapplications");
  const demoApps = await appCol.find({
    $or: [
      { isDemo: true },
      { userId: { $in: demoUserIds } },
      { email: { $in: demoEmails } }
    ]
  }).toArray();
  console.log(`Found ${demoApps.length} demo provider/driver/student applications.`);

  // Service Providers
  const spCol = db.collection("serviceproviders");
  const demoSPs = await spCol.find({
    $or: [
      { userId: { $in: demoUserIds } },
      { displayName: { $regex: /^Demo/i } }
    ]
  }).toArray();
  console.log(`Found ${demoSPs.length} demo service providers.`);

  // Bookings (service/property)
  const bookCol = db.collection("bookings");
  const demoBookings = await bookCol.find({
    $or: [
      { customerId: { $in: demoUserIds } },
      { providerId: { $in: demoUserIds } },
      { ownerId: { $in: demoUserIds } }
    ]
  }).toArray();
  const demoBookingIds = demoBookings.map(b => b._id);
  console.log(`Found ${demoBookings.length} demo service/rental bookings.`);

  // Transport Bookings
  const tbCol = db.collection("transportbookings");
  const demoTransport = await tbCol.find({
    $or: [
      { customerId: { $in: demoUserIds } },
      { providerId: { $in: demoUserIds } }
    ]
  }).toArray();
  const demoTransportIds = demoTransport.map(t => t._id);
  console.log(`Found ${demoTransport.length} demo transport bookings.`);

  // Transport Messages (associated with demo bookings or demo transport)
  const tmCol = db.collection("transportmessages");
  const allDemoBookingObjIds = [...demoBookingIds, ...demoTransportIds];
  const demoMessages = await tmCol.find({
    $or: [
      { senderId: { $in: demoUserIds } },
      { bookingId: { $in: allDemoBookingObjIds } },
      { bookingId: { $in: allDemoBookingObjIds.map(id => id.toString()) } }
    ]
  }).toArray();
  console.log(`Found ${demoMessages.length} demo chat messages.`);

  // Audit Logs (demo seeds and demo admin actions)
  const alCol = db.collection("auditlogs");
  const demoLogs = await alCol.find({
    $or: [
      { action: "DEMO_ACCOUNTS_SEEDED" },
      { adminEmail: { $in: demoEmails } },
      { targetUserId: { $in: demoUserIds } },
      { userId: { $in: demoUserIds } }
    ]
  }).toArray();
  console.log(`Found ${demoLogs.length} demo audit logs.`);

  console.log("\n=== 3. EXECUTING CONTROLLED REMOVAL OF CONFIRMED DEMO RECORDS ===");
  const delUsersResult = await usersCol.deleteMany({ _id: { $in: demoUserIds } });
  console.log(`  Removed Users: ${delUsersResult.deletedCount}`);

  const delAppsResult = await appCol.deleteMany({ _id: { $in: demoApps.map(a => a._id) } });
  console.log(`  Removed Provider Applications: ${delAppsResult.deletedCount}`);

  const delSPsResult = await spCol.deleteMany({ _id: { $in: demoSPs.map(s => s._id) } });
  console.log(`  Removed Service Providers: ${delSPsResult.deletedCount}`);

  const delBookingsResult = await bookCol.deleteMany({ _id: { $in: demoBookingIds } });
  console.log(`  Removed Bookings: ${delBookingsResult.deletedCount}`);

  const delTransportResult = await tbCol.deleteMany({ _id: { $in: demoTransportIds } });
  console.log(`  Removed Transport Bookings: ${delTransportResult.deletedCount}`);

  const delMessagesResult = await tmCol.deleteMany({ _id: { $in: demoMessages.map(m => m._id) } });
  console.log(`  Removed Transport Messages: ${delMessagesResult.deletedCount}`);

  const delLogsResult = await alCol.deleteMany({ _id: { $in: demoLogs.map(l => l._id) } });
  console.log(`  Removed Demo Audit Logs: ${delLogsResult.deletedCount}`);

  console.log("\n=== 4. POST-CLEANUP INTEGRITY VERIFICATION ===");
  const remainingUsers = await usersCol.countDocuments();
  const remainingGenuineCheck = await usersCol.find({}).toArray();
  console.log(`Total remaining genuine users in DB: ${remainingUsers}`);
  for (const u of remainingGenuineCheck) {
    console.log(`  - Preserved: ${u.email} (${u.role})`);
  }

  const remainingTB = await tbCol.countDocuments();
  console.log(`Total remaining genuine transport bookings: ${remainingTB}`);
  const remainingSP = await spCol.countDocuments();
  console.log(`Total remaining genuine service providers: ${remainingSP}`);
  const remainingApps = await appCol.countDocuments();
  console.log(`Total remaining genuine applications: ${remainingApps}`);
  const remainingProps = await db.collection("properties").countDocuments();
  console.log(`Total remaining genuine properties: ${remainingProps}`);
  const remainingServ = await db.collection("servicelistings").countDocuments();
  console.log(`Total remaining genuine service listings: ${remainingServ}`);

  const report = {
    timestamp: new Date().toISOString(),
    status: "SUCCESS",
    backupVerified: backups[backups.length - 1],
    removed: {
      users: delUsersResult.deletedCount,
      applications: delAppsResult.deletedCount,
      serviceProviders: delSPsResult.deletedCount,
      bookings: delBookingsResult.deletedCount,
      transportBookings: delTransportResult.deletedCount,
      messages: delMessagesResult.deletedCount,
      auditLogs: delLogsResult.deletedCount
    },
    preserved: {
      genuineUsers: remainingUsers,
      genuineTransportBookings: remainingTB,
      genuineServiceProviders: remainingSP,
      genuineApplications: remainingApps,
      genuineProperties: remainingProps,
      genuineServiceListings: remainingServ
    }
  };

  const reportPath = path.resolve(__dirname, "../backups/deletion-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nDeletion Report saved to: ${reportPath}`);

  await mongoose.disconnect();
  console.log("\n=== DEMO DATA CLEANUP COMPLETED SAFELY ===");
}

cleanupDemoData().catch(async (err) => {
  console.error("Cleanup error:", err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
