// app/config/firebaseConfig.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  Auth as FirebaseAuthType,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import env from "../config/env";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.warn("⚠️ Missing Firebase config variables!");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Attempt to initialize React Native persistence in a resilient way
let auth: FirebaseAuthType;

if (Platform.OS === "web") {
  // web: normal getAuth
  auth = getAuth(app);
} else {
  // mobile: try to initialize persistence; accept multiple import shapes
  try {
    // Preferred (modern): getReactNativePersistence exported from 'firebase/auth'
    // We use dynamic require to avoid TS/packager import errors on older installs.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const firebaseAuthPkg: any = require("firebase/auth");
    const maybeGetter = firebaseAuthPkg.getReactNativePersistence;
    if (typeof maybeGetter === "function") {
      auth = initializeAuth(app, {
        persistence: maybeGetter(AsyncStorage),
      });
    } else {
      // fallback: try older path 'firebase/auth/react-native'
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const rnPkg: any = require("firebase/auth/react-native");
        const getter2 = rnPkg.getReactNativePersistence;
        if (typeof getter2 === "function") {
          auth = initializeAuth(app, {
            persistence: getter2(AsyncStorage),
          });
        } else {
          throw new Error("getReactNativePersistence not found in either path");
        }
      } catch (innerErr) {
        console.warn(
          "⚠️ Could not initialize native persistence via firebase/auth/react-native:",
          innerErr
        );
        // final fallback to plain getAuth (memory persistence)
        auth = getAuth(app);
      }
    }
  } catch (err) {
    console.warn("⚠️ Could not initialize native persistence, falling back to getAuth:", err);
    auth = getAuth(app);
  }
}

export { app, auth, db };
