const apiKey = "o9l6U47i3BvhYRp6iCHuNhdAkY944oEP";
const url = "https://api.phone.email/v1/sendmail";

async function testSendMail() {
  const body = {
    apiKey: apiKey,
    fromCountryCode: "+91",
    fromPhoneNo: "9019968082",
    toCountrycode: "91",
    toPhoneNo: "9019968082",
    subject: "OTP - 123456 from UK RentServe",
    tinyFlag: true,
    messageBody: Buffer.from("Your UK RentServe verification code is 123456. Valid for 5 minutes.").toString("base64")
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    console.log("HTTP Status:", res.status);
    const text = await res.text();
    console.log("HTTP Response:", text);
  } catch (err) {
    console.error("Fetch error message:", err.message);
    console.error("Fetch error code:", err.code);
    console.error("Fetch error cause:", err.cause);
  }
}

testSendMail();
