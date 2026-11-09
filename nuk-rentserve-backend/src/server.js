require("dotenv").config();

const { validateEnv } = require("./config/env");
const connectDB = require("./config/db");

async function startServer() {
  validateEnv();
  await connectDB();

  // Initialize Default Service Categories
  const ServiceCategory = require("./models/ServiceCategory");
  const defaults = [
    ["Carpenter", "carpenter"],
    ["Plumber", "plumber"],
    ["Electrician", "electrician"],
    ["Painter", "painter"],
    ["Cleaning", "cleaning"],
    ["Appliance Repair", "appliance-repair"],
    ["Other Services", "other-services"]
  ];
  for (const [name, slug] of defaults) {
    await ServiceCategory.updateOne(
      { name },
      { $setOnInsert: { name, slug, description: "Local service" } },
      { upsert: true }
    );
  }

  // Provision First Admin Account if not present
  const User = require("./models/User");
  const bcrypt = require("bcryptjs");
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@nukrentserve.com").trim().toLowerCase();
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const adminPassword = process.env.ADMIN_PASSWORD || "AdminSecurePass2026!";
    await User.create({
      name: process.env.ADMIN_NAME || "System Administrator",
      email: adminEmail,
      phone: process.env.ADMIN_PHONE || "9999999999",
      password: await bcrypt.hash(adminPassword, 12),
      role: "admin",
      approvalStatus: "approved",
      location: "Bagalkot"
    });
    console.log(`Administrator account provisioned: ${adminEmail}`);
  }

  const http = require("http");
  const app = require("./app");
  const { initSocket } = require("./services/socketService");
  const port = Number(process.env.PORT) || 5000;

  const server = http.createServer(app);
  initSocket(server);

  server.listen(port, () => {
    console.log(`NUK RentServe Backend listening on http://localhost:${port}`);
    console.log(`Socket.IO initialized on port ${port}`);
    console.log(`Health check: http://localhost:${port}/api/v1/health`);
  });

  const shutdown = async () => {
    server.close(async () => {
      const mongoose = require("mongoose");
      await mongoose.disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error("Failed to start server:");
  console.error(error.stack || error);
  process.exit(1);
});
