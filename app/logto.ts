export const logtoConfig = {
  endpoint: process.env.LOGTO_ENDPOINT || "https://auth.example.com/",
  appId: process.env.LOGTO_APP_ID || "example-app-id",
  appSecret: process.env.LOGTO_APP_SECRET || "example-app-secret",
  baseUrl:
    process.env.NODE_ENV === "production"
      ? process.env.LOGTO_BASE_URL_PROD || "https://example.com"
      : process.env.LOGTO_BASE_URL_DEV || "http://localhost:3000",
  cookieSecret:
    process.env.LOGTO_COOKIE_SECRET || "example-cookie-secret-32-digits-long", // Auto-generated 32 digit secret
  cookieSecure: process.env.NODE_ENV === "production",
};
