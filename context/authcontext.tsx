// app/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../context/firebaseConfig";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOutUser: () => Promise<void>;
  checkUserProfile: (uid: string) => Promise<boolean>;
  markProfileComplete: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const firebaseAuth: Auth = auth;

  // --- Persist Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // --- SIGN UP
  const signUp = async (email: string, password: string): Promise<User | null> => {
    try {
      const { user } = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        email,
        emailVerified: false,
        profileComplete: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return user;
    } catch (error) {
      console.error("SignUp Error:", error);
      throw error;
    }
  };

  // --- SIGN IN
  const signIn = async (email: string, password: string): Promise<User | null> => {
    try {
      const { user } = await signInWithEmailAndPassword(firebaseAuth, email, password);
      if (!user.emailVerified) {
        throw new Error("Please verify your email before signing in.");
      }
      return user;
    } catch (error) {
      console.error("SignIn Error:", error);
      throw error;
    }
  };

  // --- SIGN OUT
  const signOutUser = async (): Promise<void> => {
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.error("SignOut Error:", error);
    }
  };

  // --- CHECK PROFILE COMPLETION
  const checkUserProfile = async (uid: string): Promise<boolean> => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (!userDoc.exists()) return false;
      return !!userDoc.data()?.profileComplete;
    } catch (error) {
      console.error("CheckProfile Error:", error);
      return false;
    }
  };

  // --- MARK PROFILE COMPLETE
  const markProfileComplete = async (uid: string): Promise<void> => {
    try {
      await updateDoc(doc(db, "users", uid), {
        profileComplete: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("MarkProfile Error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOutUser,
        checkUserProfile,
        markProfileComplete,
      }}
    >
      {loading ? null : children}
    </AuthContext.Provider>
  );
};

// --- Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
