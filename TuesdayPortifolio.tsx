// app/Portfolio.tsx
import React from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";

const services = [
  { id: "1", name: "My Registered", icon: "check-circle", screen: "/myRegistered" },
  { id: "2", name: "My Pending", icon: "pending-actions", screen: "/myPending" },
  { id: "3", name: "My Renewals", icon: "autorenew", screen: "/myRenewals" },
  { id: "4", name: "My Transfers", icon: "swap-horiz", screen: "/myTransfers" },
];

export default function Portfolio() {
  const router = useRouter();

  const renderService = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(item.screen)}
    >
      <MaterialIcons name={item.icon as any} size={40} color="#4A90E2" />
      <Text style={styles.cardText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portfolio</Text>
      <Text style={styles.subtitle}>Select a service below:</Text>
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 30;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  grid: {
    justifyContent: "space-between",
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#F0F4F8",
    borderRadius: 12,
    paddingVertical: 30,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginHorizontal: 5,
  },
  cardText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
});
