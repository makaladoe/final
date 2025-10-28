// config/env.ts
import Constants from "expo-constants";

const extra = (Constants.expoConfig && Constants.expoConfig.extra) || {};

export type Env = {
  APP_ENV?: string;
  FIREBASE_API_KEY?: string;
  FIREBASE_AUTH_DOMAIN?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_STORAGE_BUCKET?: string;
  FIREBASE_MESSAGING_SENDER_ID?: string;
  FIREBASE_APP_ID?: string;
  WHOIS_API_URL?: string;
  WHOIS_API_KEY?: string;
};

const env: Env = {
  APP_ENV: extra.APP_ENV ?? "development",
  FIREBASE_API_KEY: extra.FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: extra.FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: extra.FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: extra.FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: extra.FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: extra.FIREBASE_APP_ID,
  WHOIS_API_URL: extra.WHOIS_API_URL,
  WHOIS_API_KEY: extra.WHOIS_API_KEY,
};

export default env;
