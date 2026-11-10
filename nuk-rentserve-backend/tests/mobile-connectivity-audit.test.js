const fs = require("fs");
const path = require("path");
const https = require("https");

describe("Mobile Production Backend Connectivity & Error Handling Audit", () => {
  const mobileDir = path.resolve(__dirname, "../../nuk-rentserve-mobile");
  const PROD_API_URL = "https://rentserveapk.onrender.com/api/v1";

  test("1. config.ts defines correct production API base URL and removes dev IP fallbacks", () => {
    const configContent = fs.readFileSync(path.join(mobileDir, "src/constants/config.ts"), "utf-8");
    expect(configContent).toContain("https://rentserveapk.onrender.com/api/v1");
    expect(configContent).not.toContain("return 'http://10.0.2.2:5000/api/v1'");
    expect(configContent).not.toContain("LOCAL_COMPUTER_IP");
  });

  test("2. eas.json injects EXPO_PUBLIC_API_URL in preview and production profiles", () => {
    const easJson = JSON.parse(fs.readFileSync(path.join(mobileDir, "eas.json"), "utf-8"));
    expect(easJson.build.preview.env.EXPO_PUBLIC_API_URL).toBe(PROD_API_URL);
    expect(easJson.build.production.env.EXPO_PUBLIC_API_URL).toBe(PROD_API_URL);
  });

  test("3. app.json defines apiUrl under extra configuration", () => {
    const appJson = JSON.parse(fs.readFileSync(path.join(mobileDir, "app.json"), "utf-8"));
    expect(appJson.expo.extra.apiUrl).toBe(PROD_API_URL);
  });

  test("4. AndroidManifest.xml grants android.permission.INTERNET", () => {
    const manifest = fs.readFileSync(
      path.join(mobileDir, "android/app/src/main/AndroidManifest.xml"),
      "utf-8"
    );
    expect(manifest).toContain('android.permission.INTERNET');
  });

  test("5. client.ts provides checkBackendConnectivity and structured error classification", () => {
    const clientContent = fs.readFileSync(path.join(mobileDir, "src/api/client.ts"), "utf-8");
    expect(clientContent).toContain("export async function checkBackendConnectivity");
    expect(clientContent).toContain("AppApiError");
    expect(clientContent).toContain("INVALID_CREDENTIALS");
    expect(clientContent).toContain("COLD_START_TIMEOUT");
    expect(clientContent).toContain("NO_INTERNET");
    expect(clientContent).toContain("RATE_LIMITED");
  });

  test("6. LoginScreen.tsx features genuine health check verification and retry state", () => {
    const loginContent = fs.readFileSync(
      path.join(mobileDir, "src/screens/auth/LoginScreen.tsx"),
      "utf-8"
    );
    expect(loginContent).toContain("checkBackendConnectivity");
    expect(loginContent).toContain("checkingConnection");
    expect(loginContent).toContain("handleRetry");
  });

  test("7. Live Production Backend: /health endpoint responds 200 OK", (done) => {
    https.get("https://rentserveapk.onrender.com/health", (res) => {
      expect(res.statusCode).toBe(200);
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const json = JSON.parse(data);
        expect(json.success).toBe(true);
        done();
      });
    }).on("error", (err) => done(err));
  }, 30000);

  test("8. Live Production Backend: /api/v1/health endpoint responds 200 OK", (done) => {
    https.get("https://rentserveapk.onrender.com/api/v1/health", (res) => {
      expect(res.statusCode).toBe(200);
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const json = JSON.parse(data);
        expect(json.success).toBe(true);
        done();
      });
    }).on("error", (err) => done(err));
  }, 30000);

  test("9. Live Production Backend: /api/v1/auth/login returns 401 with structured JSON", (done) => {
    const postData = JSON.stringify({ identifier: "audit.test@example.com", password: "AuditPassword123!" });
    const req = https.request(
      "https://rentserveapk.onrender.com/api/v1/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        expect(res.statusCode).toBe(401);
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const json = JSON.parse(data);
          expect(json.success).toBe(false);
          expect(json.message).toContain("Invalid email or password");
          done();
        });
      }
    );
    req.on("error", (err) => done(err));
    req.write(postData);
    req.end();
  }, 15000);
});
