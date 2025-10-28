// app.config.js
import "dotenv/config";
import fs from "fs";
import path from "path";

const APP_ENV = process.env.APP_ENV || "development";
const envFile = path.resolve(__dirname, `.env.${APP_ENV}`);

if (fs.existsSync(envFile)) {
  require("dotenv").config({ path: envFile });
}

export default {
  expo: {
    name: "DotKe",
    slug: "DotKe",
    
    version: "1.0.0",
    orientation: "portrait",
    scheme: "dotke",
    userInterfaceStyle: "automatic",

    // ✅ Single unified app icon
    icon: "./assets/images/kenic1.png",

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logo2.jpg",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    ios: {
      supportsTablet: true,
    },

    // ✅ Clean Android section (no adaptive icon override)
    android: {
      package: "com.dotke.app",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },

    web: {
      output: "static",
      favicon: "./assets/images/kenic1.png",
    },

    assetBundlePatterns: ["**/*"],

    extra: {
      APP_ENV,
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID:
        process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      WHOIS_API_URL: process.env.WHOIS_API_URL,
      WHOIS_API_KEY: process.env.WHOIS_API_KEY,

      eas: {
        projectId: "d0dfe879-3c1c-407b-9c36-1f2f79dcae63",
      },
    },
  },
};
