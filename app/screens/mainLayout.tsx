// app/_layout.tsx
import React from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { ActivityIndicator, View } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/context/authcontext";

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * Main app routing logic
 * - While initializing: show loader
 * - If user exists: show main (tabs)
 * - Else: show auth stack
 */
function AppRoutesInner() {
  const { initializing, user, loading } = useAuth();

  // Show loading spinner while checking Firebase auth state
  if (initializing || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        // ✅ Logged-in → Tabs
        <Stack.Screen name="(tabs)" />
      ) : (
        // 🔐 Not logged-in → Auth flow
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}

/**
 * Root layout: wraps navigation in Theme + AuthProvider
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AppRoutesInner />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
