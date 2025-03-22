export const logtoConfig = {
  endpoint: "https://auth.muchen.fan/",
  appId: "r8iodto59fsk28o4rqauj",
  appSecret: "QN0D5FesDWiPyEE6UqNJSzcEELnzTKNm",
  baseUrl:
    process.env.NODE_ENV === "production"
      ? "https://chat.fmc.ai"
      : "http://localhost:3000",
  cookieSecret: "QptWXblM3Mw91cufGTovjNVzRoewZFSQ", // Auto-generated 32 digit secret
  cookieSecure: process.env.NODE_ENV === "production",
};
