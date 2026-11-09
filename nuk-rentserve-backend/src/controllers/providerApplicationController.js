const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ProviderApplication = require("../models/ProviderApplication");
const User = require("../models/User");
const ServiceProvider = require("../models/ServiceProvider");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const {
  uploadPublicImage,
  uploadPrivateDocument
} = require("../services/documentService");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const accessToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );

const refreshToken = (user) =>
  jwt.sign(
    { sub: user.id, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

const submit = asyncHandler(async (req, res) => {
  const {
    fullName,
    name,
    dob,
    phone,
    email,
    password,
    address,
    serviceArea,
    area,
    city,
    taluk,
    district,
    category,
    experience,
    price,
    description,
    consent,
    terms,
  } = req.body;

  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedName = typeof (fullName || name) === "string" ? (fullName || name).trim() : "";
  const normalizedPhone = typeof phone === "string" ? phone.trim() : "";
  const normalizedCity = typeof city === "string" && city.trim() ? city.trim() : "Bagalkot";
  const normalizedAddress = typeof address === "string" && address.trim().length >= 3 ? address.trim() : `${normalizedCity}, Karnataka`;
  const normalizedCategory = typeof category === "string" && category.trim() ? category.trim() : "Other Services";
  const normalizedExperience = typeof experience === "string" && experience.trim() ? experience.trim() : "2 years";
  const normalizedArea = String(serviceArea || area || address || normalizedCity || "Bagalkot").trim();
  const normalizedTaluk = typeof taluk === "string" && taluk.trim() ? taluk.trim() : normalizedCity;
  const normalizedDistrict = typeof district === "string" && district.trim() ? district.trim() : normalizedCity;
  const normalizedDescription = typeof description === "string" && description.trim().length >= 5
    ? description.trim()
    : `${normalizedCategory} professional services across ${normalizedCity}.`;

  if (
    normalizedName.length < 2 ||
    normalizedName.length > 100 ||
    !/^[6-9]\d{9}$/.test(normalizedPhone) ||
    !/^\S+@\S+\.\S+$/.test(normalizedEmail) ||
    !password
  ) {
    throw new ApiError(
      400,
      "Please complete all required provider application fields."
    );
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    throw new ApiError(400, "Password must contain 8–72 characters.");
  }

  // Handle Date of Birth (optional or validate if provided)
  let birth = null;
  if (dob) {
    birth = new Date(dob);
    if (!Number.isFinite(birth.getTime()) || birth > new Date()) {
      throw new ApiError(400, "Please provide a valid date of birth.");
    }
    let age = new Date().getFullYear() - birth.getFullYear();
    const month = new Date().getMonth() - birth.getMonth();
    if (month < 0 || (month === 0 && new Date().getDate() < birth.getDate())) {
      age--;
    }
    if (age < 18) {
      throw new ApiError(400, "Service providers must be at least 18 years old.");
    }
  } else {
    // Default to adult birth date (25 years ago)
    birth = new Date(Date.now() - 25 * 365.25 * 24 * 60 * 60 * 1000);
  }

  const hasAcceptedTerms = terms === true || terms === "on" || terms === "true" || req.body.termsAccepted === true || req.body.termsAccepted === "true";
  if (!hasAcceptedTerms) {
    throw new ApiError(400, "You must accept the terms of service.");
  }

  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(
      409,
      "This email is already registered. Please log in instead."
    );
  }

  const files = req.files || {};
  const profileFile = files.profileImage?.[0] || files.photo?.[0] || files.avatar?.[0];
  const vehicleFiles = files.vehicleImages || [];
  const aadhaarFile = files.aadhaarDocument?.[0] || files.govtIdDocument?.[0] || files.document?.[0] || files.file?.[0];
  const addressFile = files.addressProofDocument?.[0];

  const driverCategories = ["Auto", "Passenger car", "Goods van"];
  if (driverCategories.includes(normalizedCategory) && vehicleFiles.length < 1) {
    throw new ApiError(400, "At least one vehicle photo is required for driver applications.");
  }
  if (vehicleFiles.length > 5) {
    throw new ApiError(400, "Upload no more than five vehicle photos.");
  }

  let uploadedProfileImage = {
    url: `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedName)}&background=D71920&color=fff`,
    publicId: ""
  };
  let uploadedVehicleImages = [];
  try {
    if (profileFile) {
      uploadedProfileImage = await uploadPublicImage(profileFile);
    }
    for (const file of vehicleFiles) {
      uploadedVehicleImages.push(await uploadPublicImage(file));
    }
  } catch (error) {
    console.error("Provider/vehicle image upload failed:", error.message);
    throw new ApiError(502, "A provider or vehicle photo could not be uploaded securely. Please try again.");
  }

  let uploadedDocument = null;
  if (aadhaarFile) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(aadhaarFile.mimetype)) {
      throw new ApiError(400, "Upload a JPG, PNG, WebP or PDF document.");
    }
    if (aadhaarFile.size > 5 * 1024 * 1024) {
      throw new ApiError(400, "The document must be 5 MB or smaller.");
    }
    try {
      uploadedDocument = await uploadPrivateDocument(aadhaarFile, "aadhaar");
    } catch (error) {
      console.error("Private identity document upload failed:", error.message);
      throw new ApiError(502, "The identity document could not be uploaded securely. Please try again.");
    }
  }

  let uploadedAddressProof = null;
  if (addressFile) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(addressFile.mimetype)) {
      throw new ApiError(400, "Upload a JPG, PNG, WebP or PDF address document.");
    }
    if (addressFile.size > 5 * 1024 * 1024) {
      throw new ApiError(400, "The address proof must be 5 MB or smaller.");
    }
    try {
      uploadedAddressProof = await uploadPrivateDocument(addressFile, "address");
    } catch (error) {
      console.error("Private address proof upload failed:", error.message);
      throw new ApiError(502, "The address proof could not be uploaded securely. Please try again.");
    }
  }

  // Parse location coordinates
  let locationCoordinates = null;
  if (req.body.locationCoordinates) {
    try {
      const parsed = typeof req.body.locationCoordinates === "string" ? JSON.parse(req.body.locationCoordinates) : req.body.locationCoordinates;
      if (parsed && parsed.latitude != null && parsed.longitude != null) {
        locationCoordinates = { latitude: Number(parsed.latitude), longitude: Number(parsed.longitude) };
      }
    } catch {}
  } else if (req.body.latitude != null && req.body.longitude != null) {
    locationCoordinates = { latitude: Number(req.body.latitude), longitude: Number(req.body.longitude) };
  }

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password: await bcrypt.hash(password, 12),
    role: "provider",
    approvalStatus: "pending",
    location: normalizedCity,
    profileImage: { url: uploadedProfileImage.url || "", publicId: uploadedProfileImage.publicId || "" },
  });

  await ServiceProvider.create({
    userId: user._id,
    displayName: user.name,
    bio: normalizedDescription,
    verificationStatus: "pending",
    profileImage: { url: uploadedProfileImage.url || "", publicId: uploadedProfileImage.publicId || "" },
    vehicleImages: uploadedVehicleImages.map(image => ({ url: image.url, publicId: image.publicId })),
  });

  const applicationData = {
    userId: user._id,
    fullName: user.name,
    phone: user.phone,
    dob: birth,
    email: user.email,
    address: normalizedAddress,
    serviceArea: normalizedArea,
    city: normalizedCity,
    taluk: normalizedTaluk,
    district: normalizedDistrict,
    locationCoordinates: locationCoordinates || undefined,
    profileImage: { url: uploadedProfileImage.url || "", publicId: uploadedProfileImage.publicId || "" },
    vehicleImages: uploadedVehicleImages.map(image => ({ url: image.url, publicId: image.publicId })),
    category: normalizedCategory,
    experience: normalizedExperience,
    price: String(price || "").trim(),
    description: normalizedDescription,
    consent: Boolean(
      consent === true || consent === "on" || consent === "true"
    ),
    status: "pending",
  };

  if (uploadedDocument) {
    applicationData.aadhaarDocument = uploadedDocument;
  }
  if (uploadedAddressProof) {
    applicationData.addressProofDocument = uploadedAddressProof;
  }

  const application = await ProviderApplication.create(applicationData);

  const newAccessToken = accessToken(user);
  const newRefreshToken = refreshToken(user);

  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        application: {
          id: application.id,
          status: application.status,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          location: user.location,
          approvalStatus: user.approvalStatus,
          profileImage: { url: uploadedProfileImage.url || "" }
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      "Provider account created; application submitted for manual review."
    )
  );
});

module.exports = { submit };
