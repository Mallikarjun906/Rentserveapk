require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../src/models/User");
const ServiceProvider = require("../src/models/ServiceProvider");
const ProviderApplication = require("../src/models/ProviderApplication");
const TransportBooking = require("../src/models/TransportBooking");
const Booking = require("../src/models/Booking");
const AuditLog = require("../src/models/AuditLog");

async function seedDemoAccounts() {
  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from backend .env.");
  }

  console.log("Connecting to MongoDB for demo accounts seed...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  const demoAccounts = [
    {
      name: "Demo Customer",
      email: "demo.customer@nukrentserve.com",
      phone: "9876543210",
      password: "Demo@Customer123",
      role: "customer",
      approvalStatus: "approved",
      location: "Bagalkot",
      isDemo: true
    },
    {
      name: "Demo Provider",
      email: "demo.provider@nukrentserve.com",
      phone: "9876543211",
      password: "Demo@Provider123",
      role: "provider",
      approvalStatus: "pending",
      location: "Bagalkot",
      isDemo: true
    },
    {
      name: "Demo Driver",
      email: "demo.driver@nukrentserve.com",
      phone: "9876543212",
      password: "Demo@Driver123",
      role: "driver",
      approvalStatus: "pending",
      location: "Bagalkot",
      isDemo: true
    },
    {
      name: "Demo Student",
      email: "demo.student@nukrentserve.com",
      phone: "9876543213",
      password: "Demo@Student123",
      role: "student",
      approvalStatus: "pending",
      location: "Bagalkot",
      isDemo: true
    },
    {
      name: "Demo Admin",
      email: "demo.admin@nukrentserve.com",
      phone: "9876543214",
      password: "Demo@Admin123",
      role: "admin",
      approvalStatus: "approved",
      location: "Bagalkot",
      isDemo: true
    }
  ];

  const createdUsers = {};

  for (const acc of demoAccounts) {
    const hashedPassword = await bcrypt.hash(acc.password, 12);
    let user = await User.findOne({ email: acc.email });

    if (user) {
      user.name = acc.name;
      user.phone = acc.phone;
      user.password = hashedPassword;
      user.role = acc.role;
      user.approvalStatus = acc.approvalStatus;
      user.location = acc.location;
      user.isActive = true;
      user.isDemo = true;
      await user.save();
      console.log(`[UPDATED] Demo user: ${acc.email} (${acc.role})`);
    } else {
      user = await User.create({
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        password: hashedPassword,
        role: acc.role,
        approvalStatus: acc.approvalStatus,
        location: acc.location,
        isActive: true,
        isDemo: true
      });
      console.log(`[CREATED] Demo user: ${acc.email} (${acc.role})`);
    }
    createdUsers[acc.role] = user;
  }

  // 1. Seed Provider Application & ServiceProvider Profile for Demo Provider
  const providerUser = createdUsers.provider;
  await ServiceProvider.findOneAndUpdate(
    { userId: providerUser._id },
    {
      userId: providerUser._id,
      displayName: "Demo Professional Electrician",
      bio: "Certified domestic & commercial wiring, inverter installation and repairs.",
      verificationStatus: "pending",
      profileImage: {
        url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
        publicId: "demo-provider-profile"
      }
    },
    { upsert: true, new: true }
  );

  await ProviderApplication.findOneAndUpdate(
    { userId: providerUser._id },
    {
      userId: providerUser._id,
      applicationType: "provider",
      fullName: providerUser.name,
      email: providerUser.email,
      phone: providerUser.phone,
      dob: new Date("1995-06-15"),
      address: "Station Road, Near Old Bus Stand, Bagalkot",
      serviceArea: "Bagalkot, Navanagar, Vidyagiri",
      city: "Bagalkot",
      taluk: "Bagalkot",
      district: "Bagalkot",
      category: "Electrician",
      experience: "5 years",
      price: "₹350 / visit",
      description: "Domestic wiring, switchboard fixing, circuit breaker repair and earthing.",
      consent: true,
      status: "pending",
      documentVerificationStatus: "pending",
      isDemo: true,
      profileImage: {
        url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
        publicId: "demo-provider-profile"
      },
      aadhaarDocument: {
        publicId: "demo-aadhaar-doc",
        resourceType: "image",
        mimeType: "image/jpeg",
        uploadedAt: new Date(),
        status: "pending"
      }
    },
    { upsert: true, new: true }
  );
  console.log("Seeded demo provider application for approval review.");

  // 2. Seed Driver Application & ServiceProvider Profile for Demo Driver
  const driverUser = createdUsers.driver;
  await ServiceProvider.findOneAndUpdate(
    { userId: driverUser._id },
    {
      userId: driverUser._id,
      displayName: "Demo Auto Driver",
      bio: "Daily auto rickshaw travel across Bagalkot and Navanagar. Honest meter / Karnataka standard rates.",
      verificationStatus: "pending",
      profileImage: {
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
        publicId: "demo-driver-profile"
      },
      vehicleImages: [
        {
          url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
          publicId: "demo-driver-auto"
        }
      ]
    },
    { upsert: true, new: true }
  );

  await ProviderApplication.findOneAndUpdate(
    { userId: driverUser._id },
    {
      userId: driverUser._id,
      applicationType: "driver",
      fullName: driverUser.name,
      email: driverUser.email,
      phone: driverUser.phone,
      dob: new Date("1992-04-10"),
      address: "Sector 12, Navanagar, Bagalkot",
      city: "Bagalkot",
      taluk: "Bagalkot",
      district: "Bagalkot",
      category: "Auto",
      vehicleType: "auto",
      vehicleRegistrationNumber: "KA 29 A 4589",
      drivingLicenceNumber: "KA2920150009876",
      consent: true,
      status: "pending",
      documentVerificationStatus: "pending",
      isDemo: true,
      profileImage: {
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
        publicId: "demo-driver-profile"
      },
      vehicleImages: [
        {
          url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
          publicId: "demo-driver-auto"
        }
      ],
      drivingLicenceDocument: {
        publicId: "demo-dl-doc",
        resourceType: "raw",
        mimeType: "application/pdf",
        uploadedAt: new Date(),
        status: "pending"
      },
      vehicleRcDocument: {
        publicId: "demo-rc-doc",
        resourceType: "image",
        mimeType: "image/jpeg",
        uploadedAt: new Date(),
        status: "pending"
      },
      aadhaarDocument: {
        publicId: "demo-aadhaar-doc",
        resourceType: "image",
        mimeType: "image/jpeg",
        uploadedAt: new Date(),
        status: "pending"
      }
    },
    { upsert: true, new: true }
  );
  console.log("Seeded demo driver application with DL & RC for approval review.");

  // 3. Seed Student Application for Demo Student
  const studentUser = createdUsers.student;
  await ProviderApplication.findOneAndUpdate(
    { userId: studentUser._id },
    {
      userId: studentUser._id,
      applicationType: "student",
      fullName: studentUser.name,
      email: studentUser.email,
      phone: studentUser.phone,
      address: "Vidyagiri Hostel Block B, Bagalkot",
      city: "Bagalkot",
      taluk: "Bagalkot",
      district: "Bagalkot",
      category: "Student Rental Partner",
      collegeName: "Basaveshwar Engineering College, Bagalkot",
      studentIdNumber: "2BA21CS045",
      consent: true,
      status: "pending",
      documentVerificationStatus: "pending",
      isDemo: true,
      studentIdCardDocument: {
        publicId: "demo-student-id-doc",
        resourceType: "image",
        mimeType: "image/jpeg",
        uploadedAt: new Date(),
        status: "pending"
      },
      aadhaarDocument: {
        publicId: "demo-aadhaar-doc",
        resourceType: "image",
        mimeType: "image/jpeg",
        uploadedAt: new Date(),
        status: "pending"
      }
    },
    { upsert: true, new: true }
  );
  console.log("Seeded demo student application with Student ID card for approval review.");

  // 4. Create an audit log for seeding demo accounts
  const adminUser = createdUsers.admin;
  await AuditLog.create({
    userId: adminUser._id,
    adminName: adminUser.name,
    adminEmail: adminUser.email,
    action: "DEMO_ACCOUNTS_SEEDED",
    targetUserId: adminUser._id,
    targetRole: "admin",
    details: "All five dedicated demo accounts (customer, provider, driver, student, admin) seeded successfully with isDemo: true.",
    ipAddress: "127.0.0.1"
  });

  console.log("\n=======================================================");
  console.log("  NUK RENTSERVE DEMO ACCOUNTS SEEDED SUCCESSFULLY");
  console.log("=======================================================");
  console.log("1. Customer : demo.customer@nukrentserve.com / Demo@Customer123");
  console.log("2. Provider : demo.provider@nukrentserve.com / Demo@Provider123");
  console.log("3. Driver   : demo.driver@nukrentserve.com   / Demo@Driver123");
  console.log("4. Student  : demo.student@nukrentserve.com  / Demo@Student123");
  console.log("5. Admin    : demo.admin@nukrentserve.com    / Demo@Admin123");
  console.log("=======================================================\n");

  await mongoose.disconnect();
}

seedDemoAccounts().catch(async (err) => {
  console.error("Failed to seed demo accounts:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
