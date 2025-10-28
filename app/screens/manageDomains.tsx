import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import theme from "../Theme/theme";

export default function ManageDomains() {
  const router = useRouter();

  const services = [
    {
      title: "Check Domain Status",
      description: "Verify if your domain is active and properly registered",
      route: "/screens/domainStatus",
      color: theme.colors.primary,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>Manage Your Domains</Text>
      <Text style={styles.subHeader}>Choose an option below to continue</Text>

      <View style={styles.cardsWrapper}>
        {services.map((service, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: service.color }]}
            activeOpacity={0.8}
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
  paddingHorizontal: 24, // a bit wider breathing space on sides
  paddingVertical: 60,   // more top and bottom spacing
  gap: 24,               // adds space between header/subheader/cards
},

  header: {
    fontSize: 26,
    fontWeight: "700",
    color: theme.colors.dark,
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    color: theme.colors.secondary,
    marginBottom: 25,
  },
  cardsWrapper: {
    flexDirection: "column",
    gap: 16,
  },
  card: {
    backgroundColor: theme.colors.white,
    padding: 20,
    borderRadius: 14,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    borderLeftWidth: 5,
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
  },
});
