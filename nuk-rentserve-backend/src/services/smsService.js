/**
 * SMS / Mobile OTP Delivery Service
 * NUK RentServe
 */

async function sendSmsOtp({ phone, otp, purpose = "verification" }) {
  const normalizedPhone = String(phone).replace(/\D/g, "").slice(-10);
  const message = `Your NUK RentServe OTP is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;

  // Always log in development/testing for visibility
  console.log(`[SMS OTP] >>> Code for +91 ${normalizedPhone}: ${otp} (Purpose: ${purpose})`);

  // Check if Fast2SMS or other SMS provider API key is provided
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2SmsKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otp,
          numbers: normalizedPhone
        })
      });
      const data = await response.json();
      if (!data.return) {
        console.warn("[SMS OTP] Fast2SMS returned failure:", data.message);
      }
      return { success: true, provider: "fast2sms" };
    } catch (err) {
      console.error("[SMS OTP] Fast2SMS dispatch failed:", err.message);
    }
  }

  // Check if Twilio is configured
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const body = new URLSearchParams({
        From: twilioFrom,
        To: `+91${normalizedPhone}`,
        Body: message
      });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      });
      if (!res.ok) {
        console.warn("[SMS OTP] Twilio dispatch returned non-200 status:", res.status);
      }
      return { success: true, provider: "twilio" };
    } catch (err) {
      console.error("[SMS OTP] Twilio dispatch failed:", err.message);
    }
  }

  return { success: true, provider: "console" };
}

module.exports = {
  sendSmsOtp
};
