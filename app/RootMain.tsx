import React from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { ActivityIndicator, View } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/context/authcontext";

/**
 * Routing logic:
 * - Show loader while initializing
 * - If first install → show (welcome)
 * - Otherwise → show (auth)
 * - Tabs navigation handled after login (not here)
 */

function AppRoutesInner() {
  const { initializing, loading, hasSeenWelcome } = useAuth();

  // Show loading spinner while initializing Firebase & AsyncStorage
  if (initializing || loading || hasSeenWelcome === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {hasSeenWelcome ? (
        // User already saw welcome → show auth flow
        <Stack.Screen name="(auth)" />
      ) : (
        // First app launch → show welcome flow
        <Stack.Screen name="(welcome)" />
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
