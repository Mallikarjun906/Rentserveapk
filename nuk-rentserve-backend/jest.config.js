process.env.MONGOMS_DOWNLOAD_DIR = "D:\\mongodb-binaries";
process.env.PHONE_EMAIL_CLIENT_ID = "18875442659397262084";
process.env.PHONE_EMAIL_API_KEY = "o9l6U47i3BvhYRp6iCHuNhdAkY944oEP";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "nuk_rentserve_super_secure_access_token_secret_key_2026_dev";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "nuk_rentserve_super_secure_refresh_token_secret_key_2026_dev";

module.exports = {
  testEnvironment: "node",
  testTimeout: 120000
};
