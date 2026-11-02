require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");

async function removeTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const res1 = await db.collection("users").deleteMany({ email: /test\.provider/i });
  const res2 = await db.collection("providerapplications").deleteMany({ email: /test\.provider/i });
  console.log(`Cleaned test users: ${res1.deletedCount}, applications: ${res2.deletedCount}`);
  await mongoose.disconnect();
}

removeTest();
