import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Onboarding from "./Onboarding"; // import your onboarding component
import theme from "./Theme/theme";

const domains = [
  { ext: ".ke", category: "Kenya General Use" },
  { ext: ".co.ke", category: "Commercial / Businesses" },
  { ext: ".or.ke", category: "Organizations / NGOs" },
  { ext: ".ne.ke", category: "Network Providers" },
  { ext: ".go.ke", category: "Government" },
  { ext: ".me.ke", category: "Personal Use" },
  { ext: ".mobi.ke", category: "Mobile Services" },
  { ext: ".info.ke", category: "Information Services" },
  { ext: ".sc.ke", category: "Schools" },
  { ext: ".ac.ke", category: "Higher Education" },
];

const stats = [
  { value: "110,000+", label: ".KE Domains" },
  { value: "10+", label: "Top Level Domains" },
  { value: "500+", label: "Registrars" },
];

const colors = ["green", "red", "black", "gray"];

export default function IndexScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  // Load onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
        setShowOnboarding(!hasSeenOnboarding); // if not seen, show onboarding
      } catch (err) {
        console.error("Error loading onboarding status:", err);
        setShowOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  // Auto cycle domain extensions
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % domains.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const currentDomain = domains[index];

  // Function to mark onboarding as seen
  const handleFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      setShowOnboarding(false);
    } catch (err) {
      console.error("Error saving onboarding status:", err);
    }
  };

  // Loading state while checking AsyncStorage
  if (showOnboarding === null) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return <Onboarding onFinish={handleFinishOnboarding} />;
  }

  // Otherwise show your main app (the same UI as before)
  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={[styles.heroTitle, { color: colors[index % colors.length] }]}>
          {currentDomain.ext}
        </Text>
        <Text style={styles.category}>{currentDomain.category}</Text>
        <Text style={styles.subtitle}>.KE Country Code Top Level Domain Registry</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {stats.map((item, i) => (
          <View key={i} style={styles.statBox}>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="key-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Register Your .KE Domain</Text>
        </View>
        <Text style={styles.description}>
          Secure your unique .KE domain name today and build your online brand.
        </Text>
        <Button
          mode="contained"
          style={styles.primaryButton}
          onPress={() => router.push("/screens/domainsearch")}
        >
          Domain Search
        </Button>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="people-outline" size={24} color={theme.colors.secondary} />
          <Text style={styles.sectionTitle}>Join the .KE Community</Text>
        </View>
        <Text style={styles.description}>
          Create your account to manage domains, become a registrar, or join our growing team.
        </Text>
        <Button
          mode="contained"
          style={styles.secondaryButton}
          onPress={() => router.push("/screens/signup")}
        >
          Sign Up
        </Button>
        <Button
          mode="contained"
          style={styles.primaryButton}
          onPress={() => router.push("/screens/signin")}
        >
          Sign In
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: theme.colors.light },
  hero: { alignItems: "center", marginBottom: 25 },
  heroTitle: { fontSize: 48, fontWeight: "bold", marginBottom: 6 },
  category: { fontSize: 16, fontWeight: "500", color: theme.colors.accent },
  subtitle: { fontSize: 14, color: theme.colors.gray600, marginTop: 6 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 25,
  },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "bold", color: theme.colors.primary },
  statLabel: { fontSize: 13, color: theme.colors.accent },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionTitle: { marginLeft: 8, fontWeight: "600", color: theme.colors.dark },
  description: { marginBottom: 10, color: theme.colors.accent },
  primaryButton: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.secondary,
  },
});
