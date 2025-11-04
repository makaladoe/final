// context/authcontext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initializing: boolean;
  hasSeenWelcome: boolean | null;
  profileComplete: boolean;
  pendingVerificationEmail: string | null;
  markWelcomeSeen: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOutUser: () => Promise<void>;
  checkUserProfile: (uid: string) => Promise<boolean>;
  markProfileComplete: (uid: string) => Promise<void>;
  clearPendingVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  // split initialization steps
  const [storageReady, setStorageReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  const initializing = !(storageReady && authReady);

  /* -------------------------------
   🔹 Step 1: Load AsyncStorage flags first
  --------------------------------*/
  useEffect(() => {
    const loadFlags = async () => {
      try {
        const [welcome, pendingEmail] = await Promise.all([
          AsyncStorage.getItem("hasSeenWelcome"),
          AsyncStorage.getItem("pendingVerificationEmail"),
        ]);
        setHasSeenWelcome(welcome === "true");
        setPendingVerificationEmail(pendingEmail);
      } catch (err) {
        console.warn("⚠️ Error loading AsyncStorage flags:", err);
        setHasSeenWelcome(false);
        setPendingVerificationEmail(null);
      } finally {
        setStorageReady(true);
      }
    };
    loadFlags();
  }, []);

  /* -------------------------------
   🔹 Step 2: Firebase Auth state listener
  --------------------------------*/
  useEffect(() => {
    if (!storageReady) return; // wait for storage flags first

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        console.log("👤 Auth change →", firebaseUser?.email || "No user");

        if (firebaseUser) {
          await firebaseUser.reload();

          // unverified → sign out and store pending email
          if (!firebaseUser.emailVerified) {
            await AsyncStorage.setItem("pendingVerificationEmail", firebaseUser.email || "");
            setPendingVerificationEmail(firebaseUser.email || "");
            await signOut(auth);
            setUser(null);
            setProfileComplete(false);
            return;
          }

          // verified → load user profile
          setUser(firebaseUser);
          await AsyncStorage.removeItem("pendingVerificationEmail");
          setPendingVerificationEmail(null);

          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          setProfileComplete(userDoc.exists() && !!userDoc.data()?.profileComplete);
        } else {
          // no user
          const pending = await AsyncStorage.getItem("pendingVerificationEmail");
          setPendingVerificationEmail(pending);
          setUser(null);
          setProfileComplete(false);
        }
      } catch (err) {
        console.warn("🔥 Error in onAuthStateChanged:", err);
      } finally {
        setAuthReady(true);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [storageReady]);

  /* -------------------------------
   🔹 Firebase error message formatter
  --------------------------------*/
  const formatFirebaseError = (error: any): string => {
    if (!error?.code) return "Verify Email (Inbox/Spam) to continue";
    switch (error.code) {
      case "auth/email-already-in-use":
        return "Email already in use";
      case "auth/invalid-email":
        return "Invalid email address";
      case "auth/weak-password":
        return "Weak password";
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Wrong email or password";
      case "auth/network-request-failed":
        return "Network error";
      case "auth/too-many-requests":
        return "Too many attempts — try again later";
      default:
        return error.message || "Unexpected error";
    }
  };

  /* -------------------------------
   🔹 Helper actions
  --------------------------------*/
  const markWelcomeSeen = async () => {
    try {
      await AsyncStorage.setItem("hasSeenWelcome", "true");
      setHasSeenWelcome(true);
    } catch (err) {
      console.error("Failed to mark welcome seen:", err);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = res.user;
      await sendEmailVerification(newUser);

      await setDoc(doc(db, "users", newUser.uid), {
        email,
        emailVerified: false,
        profileComplete: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await AsyncStorage.setItem("pendingVerificationEmail", email);
      setPendingVerificationEmail(email);

      // sign out to prevent immediate login before verification
      await signOut(auth);
      setUser(null);
      setProfileComplete(false);
    } catch (err: any) {
      throw new Error(formatFirebaseError(err));
    }
  };

  const signIn = async (email: string, password: string): Promise<User | null> => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = res.user;
      await loggedInUser.reload();

      if (!loggedInUser.emailVerified) {
        await signOut(auth);
        await AsyncStorage.setItem("pendingVerificationEmail", email);
        setPendingVerificationEmail(email);
        throw new Error("Please verify your email before signing in.");
      }

      await AsyncStorage.removeItem("pendingVerificationEmail");
      setPendingVerificationEmail(null);

      const userDoc = await getDoc(doc(db, "users", loggedInUser.uid));
      setProfileComplete(userDoc.exists() && !!userDoc.data()?.profileComplete);

      setUser(loggedInUser);
      return loggedInUser;
    } catch (err: any) {
      throw new Error(formatFirebaseError(err));
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfileComplete(false);
    } catch (err: any) {
      throw new Error(formatFirebaseError(err));
    }
  };

  const clearPendingVerification = async () => {
    await AsyncStorage.removeItem("pendingVerificationEmail");
    setPendingVerificationEmail(null);
  };

  const checkUserProfile = async (uid: string): Promise<boolean> => {
    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      return docSnap.exists() && !!docSnap.data()?.profileComplete;
    } catch (err) {
      console.warn("Check profile error:", err);
      return false;
    }
  };

  const markProfileComplete = async (uid: string): Promise<void> => {
    try {
      await updateDoc(doc(db, "users", uid), {
        profileComplete: true,
        updatedAt: serverTimestamp(),
      });
      setProfileComplete(true);
    } catch (err: any) {
      throw new Error(formatFirebaseError(err));
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    initializing,
    hasSeenWelcome,
    profileComplete,
    pendingVerificationEmail,
    markWelcomeSeen,
    signUp,
    signIn,
    signOutUser,
    checkUserProfile,
    markProfileComplete,
    clearPendingVerification,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

/* -------------------------------
   🔹 Hook
  --------------------------------*/
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
