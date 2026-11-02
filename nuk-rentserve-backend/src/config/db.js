const mongoose = require("mongoose");

async function connectDB(uri = process.env.MONGODB_URI) {
  mongoose.set("strictQuery", true);
  try {
    if (!uri) throw new Error("MONGODB_URI is not configured.");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    const databaseName = mongoose.connection.name || "configured database";
    console.log(`MongoDB connected to database: ${databaseName}`);
  } catch (err) {
    console.warn(`Primary MongoDB URI unreachable (${err.message}). Starting embedded memory database...`);
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Embedded MongoDB active for local development.`);
    } catch (inner) {
      throw new Error(`Failed to establish database connection: ${err.message}`);
    }
  }
}

module.exports = connectDB;
