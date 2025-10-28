import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import theme from "../Theme/theme";

export default function RegistrarServices() {
  const router = useRouter();

  const services = [
    { 
      title: "Search Registrars", 
      description: "Find accredited domain registrars quickly", 
      route: "/screens/searchRegistrar", 
      color: theme.colors.primary 
    },
    { 
      title: "Become a Registrar", 
      description: "Apply to become an accredited registrar", 
      route: "/screens/becomeRegistrar", 
      color: theme.colors.accent 
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>Registrar Services</Text>
      <Text style={styles.subHeader}>Choose a service below to continue</Text>

      <View style={styles.cardsWrapper}>
        {services.map((service, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: service.color }]}
            activeOpacity={0.85}
            onPress={() => router.push(service.route as any)}
          >
            <Text style={styles.cardTitle}>{service.title}</Text>
            <Text style={styles.cardDescription}>{service.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20, // ✅ reduced from 70 for full-width layout
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: theme.colors.dark,
    marginBottom: 6,
  },
  subHeader: {
    fontSize: 16,
    color: theme.colors.secondary,
    marginBottom: 24,
  },
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
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.dark,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.gray600 || theme.colors.secondary,
    lineHeight: 20,
  },
});
