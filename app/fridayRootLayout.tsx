// app/_layout.tsx
import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { AuthProvider, useAuth } from "@/context/authcontext";
import { CartProvider } from "@/context/cartContext";

import useConnectionStatus from "./hooks/useConnectionStatus";
import ConnectionToast from "@/components/connectionToast";

function AppNavigator() {
  const { loading, hasSeenWelcome, isAuthenticated, justSignedIn } = useAuth();

  useEffect(() => {
    if (loading) return;

    // 1️⃣ First-time users
    if (!hasSeenWelcome) {
      router.replace("/(welcome)");
      return;
    }

    // 2️⃣ Returning authenticated users reopening the app
    if (isAuthenticated && !justSignedIn && hasSeenWelcome) {
      router.replace("/welcomeBack");
      return;
    }

    // 3️⃣ Fresh login after sign-out or signup -> go directly to tabs
    if (isAuthenticated && justSignedIn) {
      router.replace("/(tabs)");
      return;
    }

    // 4️⃣ Not authenticated
    if (!isAuthenticated) {
      router.replace("/(auth)/signin");
      return;
    }
  }, [loading, hasSeenWelcome, isAuthenticated, justSignedIn]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Global online/offline detection
  const isConnected = useConnectionStatus();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>
          {/* GLOBAL CONNECTION TOAST */}
          <ConnectionToast isConnected={isConnected} />

          {/* Navigation stack */}
          <Stack screenOptions={{ headerShown: false }} />

          {/* Auth/Welcome redirect logic */}
          <AppNavigator />

          <StatusBar style="auto" />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
