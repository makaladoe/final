import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { PieChart } from "react-native-chart-kit";

interface ApiData {
  [key: string]: any;
}

const data2 = {
  total: ["total_registrars", "generic_total", "restricted_total", "total_domains"],
  renewals: ["renewed_domains24", "renewed_domains30"],
  new_domains: ["new_domains24", "new_domains30"],
  specific_domains: ["ac.ke", "sc.ke", "go.ke"],
  generic_domains: ["co.ke", "or.ke", "ke", "me.ke", "info.ke", "mobi.ke", "ne.ke"],
  percentages: [
    "ps_go.ke",
    "ps_me.ke",
    "ps_co.ke",
    "ps_or.ke",
    "ps_sc.ke",
    "ps_ke",
    "ps_mobi.ke",
    "ps_ac.ke",
    "ps_info.ke",
    "ps_ne.ke",
  ],
};

const keyMappings: Record<string, { name: string; icon: string }> = {
  total_registrars: { name: "Registrars", icon: "users" },
  generic_total: { name: "Generic Domains", icon: "globe" },
  restricted_total: { name: "Restricted Domains", icon: "lock" },
  total_domains: { name: "Domains", icon: "globe" },
  new_domains24: { name: "New Domains (24h)", icon: "clock" },
  renewed_domains24: { name: "Renewed Domains (24h)", icon: "redo" },
  new_domains30: { name: "New Domains (30d)", icon: "calendar-plus" },
  renewed_domains30: { name: "Renewed Domains (30d)", icon: "calendar-check" },
  "ac.ke": { name: "ac.ke", icon: "graduation-cap" },
  "sc.ke": { name: "sc.ke", icon: "user-graduate" },
  "go.ke": { name: "go.ke", icon: "landmark" },
  "co.ke": { name: "co.ke", icon: "building" },
  "or.ke": { name: "or.ke", icon: "balance-scale" },
  ke: { name: "ke", icon: "flag" },
  "me.ke": { name: "me.ke", icon: "user" },
  "info.ke": { name: "info.ke", icon: "info-circle" },
  "mobi.ke": { name: "mobi.ke", icon: "mobile-alt" },
  "ne.ke": { name: "ne.ke", icon: "network-wired" },
};

export default function Registrars() {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentDate = new Date();
        const formattedDate =
          currentDate.getFullYear().toString() +
          ("0" + currentDate.getDate()).slice(-2) +
          ("0" + (currentDate.getMonth() + 1)).slice(-2);

        const url = `https://registry.kenic.or.ke/payapi/statistics?token=${formattedDate}`;
        console.log("Fetching:", url);

        const res = await fetch(url);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatNumber = (value: any) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text>Failed to load data.</Text>
      </View>
    );
  }

  const percentages = data2.percentages.map((key) => ({
    name: key.replace("ps_", "").toUpperCase(),
    population: parseFloat(data[key]) || 0,
    color: "#" + Math.floor(Math.random() * 16777215).toString(16),
    legendFontColor: "#333",
    legendFontSize: 12,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.header}>.KE Domain Statistics</Text>

      {Object.keys(data2)
        .filter((category) => category !== "percentages")
        .map((category) => (
          <View key={category} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>
              {category.replace("_", " ").toUpperCase()}
            </Text>
            <View style={styles.cardsContainer}>
              {data2[category as keyof typeof data2].map((key) => {
                const mapping = keyMappings[key] || { name: key, icon: "info-circle" };
                const value = data[key] ?? "N/A";
                return (
                  <View key={key} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{mapping.name}</Text>
                      <FontAwesome5 name={mapping.icon as any} size={18} color="#007AFF" />
                    </View>
                    <Text style={styles.cardValue}>{formatNumber(value)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

      <Text style={styles.chartTitle}>Percentage Distribution</Text>
      <PieChart
        data={percentages}
        width={Dimensions.get("window").width - 30}
        height={250}
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="10"
        center={[0, 0]}
        hasLegend={true}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingTop: 60, // ✅ pushes content slightly lower
    paddingHorizontal: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 25,
    color: "#007AFF",
  },
  categoryBlock: {
    marginBottom: 25,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    paddingLeft: 8,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    width: "48%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  cardValue: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: "bold",
    color: "#007AFF",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 25,
    color: "#333",
  },
});
