// app/_layout.tsx
import React from "react";
import { Stack, router } from "expo-router";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ActivityIndicator, View } from "react-native";

import { AuthProvider, useAuth } from "@/context/authcontext";
import { CartProvider } from "@/context/cartContext";
import useConnectionStatus from "./hooks/useConnectionStatus";
import ConnectionToast from "@/components/connectionToast";

function AppNavigator() {
  const { ready, hasSeenWelcome, isAuthenticated, justSignedIn } = useAuth();

  // Block navigation until everything is ready
  React.useEffect(() => {
    if (!ready) return;

    // 1️⃣ First-time users
    if (!hasSeenWelcome) {
      router.replace("/(welcome)");
      return;
    }

    // 2️⃣ Returning authenticated users reopening the app
    if (isAuthenticated && !justSignedIn) {
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
  }, [ready, hasSeenWelcome, isAuthenticated, justSignedIn]);

  // Show splash while ready is false
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "black" }}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isConnected = useConnectionStatus();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>
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
