import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import theme from "../theme";

export default function RegistrarServices() {
  const router = useRouter();

  const services = [
    {
      title: "Search A .KE Registrar",
      description:
        "Find accredited and verified .KE domain registrars in Kenya.",
      route: "/searchRegistrar",
      color: theme.colors.primary,
      icon: "search-outline",
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 🔹 Logo + Text (two-colored, clean layout) */}
      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/images/logo2.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.accreditedText}>Accredited</Text>
          <Text style={styles.registrarText}>Registrars</Text>
        </View>
      </View>

      {/* 🔹 Service Card(s) */}
      <View style={styles.cardsWrapper}>
        {services.map((service, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: service.color }]}
            activeOpacity={0.85}
            onPress={() => router.push(service.route as any)}
          >
            <View style={styles.cardHeader}>
              <Ionicons
                name={service.icon as any}
                size={20}
                color={theme.colors.primary}
                style={styles.icon}
              />
              <Text style={styles.cardTitle}>{service.title}</Text>
            </View>
            <Text style={styles.cardDescription}>{service.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  /* ---------- Containers ---------- */
  container: {
    flex: 1,
    backgroundColor: theme.colors.light,
  },
  scrollContent: {
    paddingTop: 45,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },

  /* ---------- Logo & Header ---------- */
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  logo: {
    width: 75,
    height: 75,
    marginRight: 10,
  },
  accreditedText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
    fontFamily: "System",
    letterSpacing: 0.3,
  },
  registrarText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.secondary,
    fontFamily: "System",
    letterSpacing: 0.3,
  },

  /* ---------- Cards ---------- */
  cardsWrapper: {
    flexDirection: "column",
    gap: 16,
  },
  card: {
    backgroundColor: theme.colors.white,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
    borderLeftWidth: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  icon: {
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.dark,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.gray700 || theme.colors.secondary,
    lineHeight: 20,
    fontFamily: "System",
  },
});
