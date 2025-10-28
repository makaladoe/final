// app/verifyemail.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { auth } from "../../context/firebaseConfig";
import theme from "../Theme/theme";

export default function VerifyEmail() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");

  // Check verification status
  const checkVerification = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          setVerified(true);
          setMessage("Email verified successfully!");
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: "signin" as never }],
            });
          }, 1500);
        } else {
          setMessage("Email not verified yet. Please check your inbox.");
        }
      }
    } catch (error) {
      setMessage("Error checking verification status.");
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setMessage("Verification email resent successfully!");
      }
    } catch (error) {
      setMessage("Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.emailVerified) {
        setVerified(true);
        navigation.reset({
          index: 0,
          routes: [{ name: "signin" as never }],
        });
      }
    });
    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.message}>
          A verification link has been sent to your registered email address. Please verify to continue.
        </Text>

        {message ? <Text style={styles.info}>{message}</Text> : null}
        {loading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 10 }} />}

        <TouchableOpacity style={styles.button} onPress={checkVerification} disabled={loading}>
          <Text style={styles.buttonText}>I've Verified My Email</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.resendButton]} onPress={resendEmail} disabled={loading}>
          <Text style={[styles.buttonText, { color: theme.colors.secondary }]}>Resend Email</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.light,
  },
  card: {
    width: "90%",
    maxWidth: 420,
    padding: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    shadowColor: theme.colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
    color: theme.colors.dark,
  },
  message: {
    fontSize: 16,
    color: theme.colors.accent,
    textAlign: "center",
    marginBottom: 20,
  },
  info: {
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: 10,
  },
  button: {
    backgroundColor: theme.colors.secondary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 6,
  },
  resendButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
});
