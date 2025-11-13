import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import theme from "../theme";

/* ---------- Direct Registrar Data ---------- */
const registrars = [
  {
    name: "Safaricom",
    logo: require("../../assets/images/safaricom.png"),
    url: "https://domains.safaricom.co.ke/",
    email: "business.support@safaricom.co.ke",
  },
  {
    name: "Truehost",
    logo: require("../../assets/images/truehost.png"),
    url: "https://truehost.co.ke/",
    email: "info@truehost.co.ke",
  },
  {
    name: "Host Africa",
    logo: require("../../assets/images/hostAfrica.jpg"),
    url: "https://www.hostafrica.ke/kenic-registrar/",
    email: "support@hostafrica.com",
  },
  {
    name: "Host Pinnacle",
    logo: require("../../assets/images/hostPinnacle.png"),
    url: "https://www.hostpinnacle.co.ke/",
    email: "info@hostpinnacle.co.ke",
  },
];

export default function TopRegistrars() {
  const router = useRouter();

  const openInWebView = (url: string, title: string) => {
    router.push({
      pathname: "/webview",
      params: { url, title },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 🔹 Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Top Registrars</Text>
        <Text style={styles.bannerSubtitle}>
          Explore accredited .KE registrars
        </Text>
      </View>

      {/* 🔹 Grid of Registrars */}
      <View style={styles.grid}>
        {registrars.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => openInWebView(item.url, item.name)}
          >
            <View style={styles.logoWrapper}>
              <Image source={item.logo} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.email}>{item.email}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light,
  },
  scrollContent: {
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  banner: {
    alignItems: "center",
    marginBottom: 25,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 5,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: theme.colors.secondary,
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 20,
  },
  card: {
    backgroundColor: theme.colors.white,
    width: "47%",
    height: 170,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    paddingHorizontal: 8,
    paddingVertical: 15,
  },
  logoWrapper: {
    width: 75,
    height: 75,
    borderRadius: 75 / 2,
    borderWidth: 3,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginBottom: 10,
    overflow: "hidden",
  },
  logo: {
    width: 55,
    height: 55,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.dark,
    textAlign: "center",
    marginBottom: 3,
  },
  email: {
    fontSize: 12,
    color: theme.colors.secondary,
    textAlign: "center",
    flexWrap: "wrap",
  },
});
