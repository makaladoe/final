// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/context/authcontext";
import { CartProvider } from "@/context/cartContext";
import useConnectionStatus from "./hooks/useConnectionStatus";
import ConnectionToast from "@/components/connectionToast";

// ⭐ NEW: Notification context
import { NotificationProvider } from "@/context/notificationContext";

// ---------------------------------------------------------
// APP NAVIGATION LOGIC
// ---------------------------------------------------------
function AppNavigator() {
  const { ready, hasSeenWelcome, isAuthenticated, justSignedIn } = useAuth();
  const [navigationHandled, setNavigationHandled] = useState(false);

  useEffect(() => {
    if (!ready || navigationHandled) return;

    // 1️⃣ First-time user → Welcome onboarding
    if (!hasSeenWelcome) {
      router.replace("/(welcome)");
      setNavigationHandled(true);
      return;
    }

    // 2️⃣ User is authenticated & returning to app → WelcomeBack (Biometrics)
    if (isAuthenticated && !justSignedIn) {
      router.replace("/welcomeBack");
      setNavigationHandled(true);
      return;
    }

    // 3️⃣ User JUST signed in right now → Send them to Tabs
    if (isAuthenticated && justSignedIn) {
      router.replace("/(tabs)");
      setNavigationHandled(true);
      return;
    }

    // 4️⃣ Not authenticated → Sign in
    if (!isAuthenticated) {
      router.replace("/(auth)/signin");
      setNavigationHandled(true);
      return;
    }
  }, [
    ready,
    hasSeenWelcome,
    isAuthenticated,
    justSignedIn,
    navigationHandled,
  ]);

  // Splash while loading initial state from storage.
  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "black",
        }}
      >
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return null;
}

// ---------------------------------------------------------
// ROOT LAYOUT
// ---------------------------------------------------------
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isConnected = useConnectionStatus();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>
          {/* ⭐ NEW: Wrap everything with NotificationProvider */}
          <NotificationProvider>

            {/* Internet connection toast */}
            <ConnectionToast isConnected={isConnected} />

            {/* App routes */}
            <Stack screenOptions={{ headerShown: false }} />

            {/* Auth-based navigation */}
            <AppNavigator />

            <StatusBar style="auto" />

          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
