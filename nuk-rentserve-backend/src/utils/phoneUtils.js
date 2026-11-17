/**
 * Phone Number Normalization and Validation Utilities
 * UK RentServe / NUK RentServe
 */

/**
 * Normalizes phone numbers to standard format.
 * Defaults to Indian mobile standard (+91, 10 digits).
 *
 * @param {string} countryCode e.g. "+91" or "91"
 * @param {string} phoneNumber e.g. "9876543210" or "+919876543210"
 * @returns {{ phoneCountryCode: string, phoneNumber: string, normalizedPhoneNumber: string }}
 */
function normalizePhoneNumber(countryCode = "+91", phoneNumber = "") {
  let rawPhone = String(phoneNumber || "").trim().replace(/[^\d+]/g, "");
  let rawCc = String(countryCode || "+91").trim().replace(/[^\d+]/g, "");

  if (!rawCc.startsWith("+")) {
    rawCc = `+${rawCc}`;
  }

  // If phoneNumber already has country code prefix
  if (rawPhone.startsWith("+91") && rawPhone.length === 13) {
    rawCc = "+91";
    rawPhone = rawPhone.slice(3);
  } else if (rawPhone.startsWith("91") && rawPhone.length === 12) {
    rawCc = "+91";
    rawPhone = rawPhone.slice(2);
  } else if (rawPhone.startsWith("0") && rawPhone.length === 11) {
    rawPhone = rawPhone.slice(1);
  }

  // Ensure 10 digits for Indian numbers
  const digitsOnly = rawPhone.replace(/\D/g, "");
  const normalized = `${rawCc}${digitsOnly}`;

  return {
    phoneCountryCode: rawCc,
    phoneNumber: digitsOnly,
    normalizedPhoneNumber: normalized
  };
}

/**
 * Creates a MongoDB query matching a phone number across legacy and normalized fields.
 *
 * @param {string} phone
 * @returns {object} MongoDB query filter
 */
function buildPhoneQuery(phone) {
  if (!phone) return { _id: null };
  const cleaned = String(phone).trim();
  const digits = cleaned.replace(/\D/g, "");
  const tenDigit = digits.slice(-10);
  const normalized = `+91${tenDigit}`;

  const candidates = Array.from(
    new Set([cleaned, digits, tenDigit, normalized, `0${tenDigit}`, `91${tenDigit}`])
  ).filter(Boolean);

  return {
    $or: [
      { normalizedPhoneNumber: { $in: candidates } },
      { phone: { $in: candidates } },
      { phoneNumber: { $in: candidates } }
    ]
  };
}

module.exports = {
  normalizePhoneNumber,
  buildPhoneQuery
};
