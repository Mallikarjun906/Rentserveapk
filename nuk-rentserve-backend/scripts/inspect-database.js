require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");

async function inspectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }

  console.log("Attempting to connect to MongoDB...");
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    console.log("Connected successfully to DB:", mongoose.connection.name);

    const collections = await db.listCollections().toArray();
    console.log("\n--- COLLECTIONS & DOCUMENT COUNTS ---");
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`- ${col.name}: ${count} documents`);
    }

    console.log("\n--- USERS BREAKDOWN ---");
    const usersCol = db.collection("users");
    const users = await usersCol.find({}, { projection: { password: 0 } }).toArray();
    console.log(`Total users: ${users.length}`);
    for (const u of users) {
      console.log(`User ID: ${u._id} | Email: ${u.email} | Role: ${u.role} | isDemo: ${u.isDemo} | Name: ${u.name}`);
    }

    console.log("\n--- PROVIDER APPLICATIONS ---");
    const appCol = db.collection("providerapplications");
    const apps = await appCol.find({}).toArray();
    console.log(`Total provider applications: ${apps.length}`);
    for (const a of apps) {
      console.log(`App ID: ${a._id} | Email: ${a.email} | Type: ${a.applicationType} | isDemo: ${a.isDemo} | Status: ${a.status}`);
    }

    console.log("\n--- PROPERTIES & SERVICES ---");
    const propCol = db.collection("properties");
    const props = await propCol.find({}).toArray();
    console.log(`Total properties: ${props.length}`);
    for (const p of props) {
      console.log(`Property ID: ${p._id} | Title: ${p.title} | City: ${p.city} | Price: ${p.price} | isDemo: ${p.isDemo}`);
    }

    const servCol = db.collection("servicelistings");
    const servs = await servCol.find({}).toArray();
    console.log(`Total service listings: ${servs.length}`);
    for (const s of servs) {
      console.log(`Service ID: ${s._id} | Title: ${s.title} | Category: ${s.category} | Price: ${s.price} | isDemo: ${s.isDemo}`);
    }

    console.log("\n--- BOOKINGS & TRANSPORT ---");
    const bookCol = db.collection("bookings");
    const books = await bookCol.find({}).toArray();
    console.log(`Total bookings: ${books.length}`);

    const transCol = db.collection("transportbookings");
    const trans = await transCol.find({}).toArray();
    console.log(`Total transport bookings: ${trans.length}`);

    await mongoose.disconnect();
    console.log("\nInspection complete.");
  } catch (err) {
    console.error("Database connection/inspection error:", err);
    process.exit(1);
  }
}

inspectDB();
