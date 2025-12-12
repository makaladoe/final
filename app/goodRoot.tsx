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

import Constants from "expo-constants";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/context/authcontext";
import { CartProvider } from "@/context/cartContext";
import useConnectionStatus from "./hooks/useConnectionStatus";
import ConnectionToast from "@/components/connectionToast";
import { NotificationProvider } from "@/context/notificationContext";

// ADD THIS (fix for gesture handler)
import { GestureHandlerRootView } from "react-native-gesture-handler";

// ---------------------------------------------------------
// APP NAVIGATION LOGIC
// ---------------------------------------------------------
function AppNavigator() {
  const { ready, hasSeenWelcome, isAuthenticated, justSignedIn } = useAuth();
  const [navigationHandled, setNavigationHandled] = useState(false);

  useEffect(() => {
    if (!ready || navigationHandled) return;

    if (!hasSeenWelcome) {
      router.replace("/(welcome)");
      setNavigationHandled(true);
      return;
    }

    if (isAuthenticated && !justSignedIn) {
      router.replace("/welcomeBack");
      setNavigationHandled(true);
      return;
    }

    if (isAuthenticated && justSignedIn) {
      router.replace("/(tabs)");
      setNavigationHandled(true);
      return;
    }

    if (!isAuthenticated) {
      router.replace("/(auth)/signin");
      setNavigationHandled(true);
      return;
    }
  }, [ready, hasSeenWelcome, isAuthenticated, justSignedIn, navigationHandled]);

  return null;
}

// ---------------------------------------------------------
// AUTH GATE
// ---------------------------------------------------------
function AuthGate() {
  const { ready } = useAuth();

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

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <AppNavigator />
    </>
  );
}

// ---------------------------------------------------------
// ROOT LAYOUT
// ---------------------------------------------------------
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isConnected = useConnectionStatus();

  useEffect(() => {
    const STK_BASE_URL = Constants.expoConfig?.extra?.STK_BASE_URL ?? "";
    const AI_SUGGEST_API = Constants.expoConfig?.extra?.AI_SUGGEST_API ?? "";
    const AI_BASE_URL = AI_SUGGEST_API.split("/")[0];

    if (STK_BASE_URL) fetch(STK_BASE_URL).catch(() => {});
    if (AI_BASE_URL) fetch(AI_BASE_URL).catch(() => {});

    const interval = setInterval(() => {
      if (STK_BASE_URL) fetch(STK_BASE_URL).catch(() => {});
      if (AI_BASE_URL) fetch(AI_BASE_URL).catch(() => {});
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <ConnectionToast isConnected={isConnected} />

              <AuthGate />

              <StatusBar style="auto" />
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
