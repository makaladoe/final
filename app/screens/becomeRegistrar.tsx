import React from "react";
import { View, Text, StyleSheet } from "react-native";
import theme from "../Theme/theme";

export default function BecomeRegistrar() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Become a Registrar</Text>
      <Text style={styles.subtitle}>
        This screen will later contain the application form for new registrars.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.light,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.accent,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.secondary,
    textAlign: "center",
  },
});
