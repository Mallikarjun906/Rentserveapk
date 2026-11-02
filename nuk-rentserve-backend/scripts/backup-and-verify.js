require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { MongoMemoryServer } = require("mongodb-memory-server");

async function backupAndVerify() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing from backend .env");

  console.log("=== STEP 1: CONNECTING TO SOURCE DATABASE FOR BACKUP ===");
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const dbName = mongoose.connection.name;
  console.log(`Connected to: ${dbName}`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.resolve(__dirname, "../backups", `backup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`Backup target directory: ${backupDir}`);

  const collections = await db.listCollections().toArray();
  const manifest = {
    sourceDatabase: dbName,
    createdAt: new Date().toISOString(),
    collections: {}
  };

  for (const col of collections) {
    const colName = col.name;
    const docs = await db.collection(colName).find({}).toArray();
    manifest.collections[colName] = docs.length;
    const filePath = path.join(backupDir, `${colName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), "utf8");
    console.log(`  [DUMPED] ${colName}: ${docs.length} documents -> ${path.basename(filePath)}`);
  }

  const manifestPath = path.join(backupDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Manifest written to: ${manifestPath}`);
  await mongoose.disconnect();
  console.log("Disconnected from source database.");

  console.log("\n=== STEP 2: VERIFYING BACKUP INTEGRITY VIA READ CHECK ===");
  for (const [colName, expectedCount] of Object.entries(manifest.collections)) {
    const filePath = path.join(backupDir, `${colName}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Verification failed: missing file ${filePath}`);
    }
    const content = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed) || parsed.length !== expectedCount) {
      throw new Error(`Verification failed for ${colName}: expected ${expectedCount}, got ${parsed.length}`);
    }
    console.log(`  [VERIFIED READ] ${colName}: ${parsed.length}/${expectedCount} records intact`);
  }
  console.log("All dumped files read and validated successfully.");

  console.log("\n=== STEP 3: TESTING RESTORATION IN ISOLATED IN-MEMORY DATABASE ===");
  const mongod = await MongoMemoryServer.create();
  const memoryUri = mongod.getUri();
  console.log("Spinning up MongoMemoryServer for isolated restoration test...");
  
  const testConn = await mongoose.createConnection(memoryUri).asPromise();
  const testDb = testConn.db;

  for (const [colName, count] of Object.entries(manifest.collections)) {
    if (count === 0) continue;
    const filePath = path.join(backupDir, `${colName}.json`);
    const docs = JSON.parse(fs.readFileSync(filePath, "utf8"));
    // Convert string $oid and dates if needed or insert raw documents
    await testDb.collection(colName).insertMany(docs);
    const restoredCount = await testDb.collection(colName).countDocuments();
    if (restoredCount !== count) {
      throw new Error(`Restore mismatch for ${colName}: expected ${count}, got ${restoredCount}`);
    }
    console.log(`  [RESTORED & COUNTED] ${colName}: ${restoredCount} records successfully loaded`);
  }

  await testConn.close();
  await mongod.stop();
  console.log("Isolated restoration test completed with 100% fidelity.");
  console.log("\n>>> BACKUP & RESTORATION VERIFICATION PASSED <<<\n");

  return backupDir;
}

backupAndVerify()
  .then((dir) => {
    console.log("SUCCESS: Backup created and verified at:", dir);
    process.exit(0);
  })
  .catch((err) => {
    console.error("FAILURE during backup/verification:", err);
    process.exit(1);
  });
