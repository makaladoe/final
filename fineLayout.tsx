// app/_layout.tsx
import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { AuthProvider, useAuth } from "@/context/authcontext";
import { CartProvider } from "@/context/cartContext";

// ⭐ NEW IMPORTS
import useConnectionStatus from "./hooks/useConnectionStatus";
import ConnectionToast from "@/components/connectionToast";

function AppNavigator() {
  const {
    loading,
    hasSeenWelcome,
    isAuthenticated,
    biometricEnabled,
    isLocked,
  } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!hasSeenWelcome) {
      router.replace("/(welcome)");
      return;
    }

    if (!isAuthenticated) {
      router.replace("/(auth)/signin");
      return;
    }

    if (biometricEnabled && isLocked) {
      router.replace("/applockscreen");
      return;
    }
  }, [
    loading,
    hasSeenWelcome,
    isAuthenticated,
    biometricEnabled,
    isLocked,
  ]);

  return null; // IMPORTANT: AppNavigator must NOT render Slot
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // ⭐ Detect online/offline globally
  const isConnected = useConnectionStatus();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>

          {/* ⭐ GLOBAL CONNECTION TOAST */}
          <ConnectionToast isConnected={isConnected} />

          {/* The ONLY navigation container */}
          <Stack screenOptions={{ headerShown: false }} />

          {/* Auth/Welcome redirect logic */}
          <AppNavigator />

          <StatusBar style="auto" />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
