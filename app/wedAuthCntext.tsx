// app/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------
interface AuthContextType {
  firebaseUser: User | null;
  user: User | null;
  userProfile: any | null;

  loading: boolean;
  ready: boolean;

  isLoggedIn: boolean;
  biometricEnabled: boolean;
  isLocked: boolean;
  hasSeenWelcome: boolean;

  isAuthenticated: boolean;
  justSignedIn: boolean;

  authError: string | null;
  setAuthError: (message: string | null) => void;

  signUp: (email: string, password: string) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOutUser: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  unlock: () => void;
  markWelcomeSeen: () => Promise<void>;

  checkUserProfile: (uid: string) => Promise<boolean>;
  markProfileComplete: (uid: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

// ---------------------------------------------------------
// CONTEXT
// ---------------------------------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------
// ERROR TRANSLATION
// ---------------------------------------------------------
const translateFirebaseError = (code: string): string => {
  const map: Record<string, string> = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/missing-password": "Password cannot be empty.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/user-not-found": "No account found with this email.",
    "auth/email-already-in-use": "This email is already registered.",
    "auth/weak-password": "Your password must be stronger.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
  };

  return map[code] || "Something went wrong. Please try again.";
};

// ---------------------------------------------------------
// PROVIDER
// ---------------------------------------------------------
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [justSignedIn, setJustSignedIn] = useState(false);

  const [hydrated, setHydrated] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  const loading = !hydrated || !firebaseReady;
  const ready = hydrated && firebaseReady;
  const isAuthenticated = firebaseUser !== null && isLoggedIn;

  const [authError, setAuthError] = useState<string | null>(null);

  // -------------------------------------------------------
  // RESTORE STATE
  // -------------------------------------------------------
  const restoreState = useCallback(async () => {
    try {
      const logged = await SecureStore.getItemAsync("isLoggedIn");
      const bio = await SecureStore.getItemAsync("biometricEnabled");
      const justSigned = await SecureStore.getItemAsync("justSignedIn");
      const welcome = await AsyncStorage.getItem("hasSeenWelcome");

      setIsLoggedIn(logged === "true");
      setBiometricEnabled(bio === "true");
      setHasSeenWelcome(welcome === "true");
      setJustSignedIn(justSigned === "true");
    } catch (e) {
      console.error("RestoreState error:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    restoreState();
  }, []);

  // -------------------------------------------------------
  // FIREBASE AUTH LISTENER
  // -------------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setFirebaseReady(true);
    });
    return () => unsub();
  }, []);

  // -------------------------------------------------------
  // APP LOCK + ALWAYS SHOW WELCOME BACK LOGIC
  // -------------------------------------------------------
  useEffect(() => {
    if (!hydrated || !firebaseReady) return;

    const sub = AppState.addEventListener("change", (state) => {
      if (!isLoggedIn) return;

      if (state === "active") {
        // IMPORTANT FIX:
        // Any time user comes back → they are NOT "freshly signed in"
        SecureStore.setItemAsync("justSignedIn", "false");
        setJustSignedIn(false);

        // Lock only if biometrics are enabled
        if (biometricEnabled) {
          setIsLocked(true);
        }
      }
    });

    return () => sub.remove();
  }, [hydrated, firebaseReady, isLoggedIn, biometricEnabled]);

  const unlock = async () => {
    setIsLocked(false);
  };

  // -------------------------------------------------------
  // AUTH ACTIONS
  // -------------------------------------------------------
  const signUp = async (email: string, password: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        email,
        profileComplete: false,
        createdAt: serverTimestamp(),
      });

      setFirebaseUser(user);
      setAuthError(null);
      return user;
    } catch (error: any) {
      const msg = translateFirebaseError(error.code);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      if (!user.emailVerified) {
        await signOut(auth);
        setAuthError("Please verify your email before signing in.");
        throw new Error("Please verify your email before signing in.");
      }

      await SecureStore.setItemAsync("isLoggedIn", "true");
      await SecureStore.setItemAsync("justSignedIn", "true");

      setIsLoggedIn(true);
      setJustSignedIn(true);
      setFirebaseUser(user);
      setAuthError(null);

      await refreshUserProfile();
      return user;
    } catch (error: any) {
      const msg = translateFirebaseError(error.code);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    await SecureStore.deleteItemAsync("isLoggedIn");
    await SecureStore.deleteItemAsync("biometricEnabled");
    await SecureStore.deleteItemAsync("justSignedIn");

    setFirebaseUser(null);
    setUserProfile(null);

    setIsLoggedIn(false);
    setBiometricEnabled(false);
    setJustSignedIn(false);
    setAuthError(null);
  };

  const enableBiometric = async () => {
    await SecureStore.setItemAsync("biometricEnabled", "true");
    setBiometricEnabled(true);
  };

  const markWelcomeSeen = async () => {
    await AsyncStorage.setItem("hasSeenWelcome", "true");
    setHasSeenWelcome(true);
  };

  // -------------------------------------------------------
  // PROFILE HANDLERS
  // -------------------------------------------------------
  const refreshUserProfile = async () => {
    if (!firebaseUser) return;

    try {
      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (snap.exists()) setUserProfile(snap.data());
    } catch (e) {
      console.error("refreshUserProfile error:", e);
      setUserProfile(null);
    }
  };

  const checkUserProfile = async (uid: string) => {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() && snap.data()?.profileComplete === true;
  };

  const markProfileComplete = async (uid: string) => {
    await updateDoc(doc(db, "users", uid), {
      profileComplete: true,
      updatedAt: serverTimestamp(),
    });
  };

  // -------------------------------------------------------
  // UPDATE USER PROFILE WHEN AUTH CHANGES
  // -------------------------------------------------------
  useEffect(() => {
    if (firebaseUser) refreshUserProfile();
    else setUserProfile(null);
  }, [firebaseUser]);

  // -------------------------------------------------------
  // PROVIDER
  // -------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user: firebaseUser,
        userProfile,

        loading,
        ready,
        isLoggedIn,
        biometricEnabled,
        isLocked,
        hasSeenWelcome,
        isAuthenticated,
        justSignedIn,

        authError,
        setAuthError,

        signUp,
        signIn,
        signOutUser,
        enableBiometric,
        unlock,
        markWelcomeSeen,

        checkUserProfile,
        markProfileComplete,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ---------------------------------------------------------
// HOOK
// ---------------------------------------------------------
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
