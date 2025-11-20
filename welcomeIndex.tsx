import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import theme from "../theme";

const stats = [
  { value: "110,000+", label: ".KE Domains" },
  { value: "10+", label: "Top Level Domains" },
  { value: "500+", label: "Registrars" },
];

export default function WelcomeScreen() {
  const router = useRouter();

  const handleContinue = async () => {
    await AsyncStorage.setItem("hasSeenWelcome", "true");
    router.replace("/(auth)/signin");
  };

  return (
    <ImageBackground
      source={require("../../assets/images/background1.jpg")}  // ← your background image
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* 🔹 Logo and Branding */}
        <View style={styles.logoSection}>
          <Image
            source={require("../../assets/images/logo2.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>.KE Country Code</Text>
          <Text style={styles.brandSubtitle}>Top Level Domain Registry</Text>
        </View>

        {/* 🔹 Intro Text */}
        <Text style={styles.description}>
          Your trusted gateway to managing, registering, and exploring .KE
          domains across accredited registrars.
        </Text>

        {/* 🔹 Stats Section */}
        <View style={styles.statsContainer}>
          {stats.map((item, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* 🔹 Get Started Button */}
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent", // ← important so background image shows
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  /* ---------- Logo & Branding ---------- */
  logoSection: {
    alignItems: "center",
    marginBottom: 35,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  brandSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.secondary,
  },

  /* ---------- Description ---------- */
  description: {
    textAlign: "center",
    color: theme.colors.gray700,
    fontSize: 15.5,
    lineHeight: 22,
    marginBottom: 35,
    paddingHorizontal: 10,
  },

  /* ---------- Stats Section ---------- */
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 50,
    width: "100%",
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.gray600,
    textAlign: "center",
    marginTop: 3,
  },

  /* ---------- Button ---------- */
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignSelf: "center",
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
});
