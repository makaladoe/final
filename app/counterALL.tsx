import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";

/* --------------------- DATA DEFINITIONS --------------------- */
const data2 = {
  total: ["total_registrars", "generic_total", "restricted_total", "total_domains"],
  renewals: ["renewed_domains24", "renewed_domains30"],
  new_domains: ["new_domains24", "new_domains30"],
  specific_domains: ["ac.ke", "sc.ke", "go.ke"],
  generic_domains: ["co.ke", "or.ke", "ke", "me.ke", "info.ke", "mobi.ke", "ne.ke"],
  percentages: [
    "ps_go.ke","ps_me.ke","ps_co.ke","ps_or.ke","ps_sc.ke",
    "ps_ke","ps_mobi.ke","ps_ac.ke","ps_info.ke","ps_ne.ke"
  ]
};

const keyMappings: Record<string, { name: string }> = {
  total_registrars: { name: "Registrars" },
  generic_total: { name: "Generic Domains" },
  restricted_total: { name: "Restricted Domains" },
  total_domains: { name: "Domains" },
  new_domains24: { name: "New Domains (24h)" },
  renewed_domains24: { name: "Renewed Domains (24h)" },
  new_domains30: { name: "New Domains (30d)" },
  renewed_domains30: { name: "Renewed Domains (30d)" },
  "ac.ke": { name: "ac.ke" },
  "sc.ke": { name: "sc.ke" },
  "go.ke": { name: "go.ke" },
  "co.ke": { name: "co.ke" },
  "or.ke": { name: "or.ke" },
  ke: { name: "ke" },
  "me.ke": { name: "me.ke" },
  "info.ke": { name: "info.ke" },
  "mobi.ke": { name: "mobi.ke" },
  "ne.ke": { name: "ne.ke" },
  "ps_go.ke": { name: "ps_go.ke" },
  "ps_me.ke": { name: "ps_me.ke" },
  "ps_co.ke": { name: "ps_co.ke" },
  "ps_or.ke": { name: "ps_or.ke" },
  "ps_sc.ke": { name: "ps_sc.ke" },
  ps_ke: { name: "ps_ke" },
  "ps_mobi.ke": { name: "ps_mobi.ke" },
  "ps_ac.ke": { name: "ps_ac.ke" },
  "ps_info.ke": { name: "ps_info.ke" },
  "ps_ne.ke": { name: "ps_ne.ke" }
};

interface APIData { [key: string]: number | string; }

/* --------------------- FETCH UTIL --------------------- */
async function fetchData(url: string): Promise<APIData | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* --------------------- FORMATTER --------------------- */
function formatNumber(value: number | string): string {
  const num = parseFloat(value as string);
  if (isNaN(num)) return String(value);
  return num.toLocaleString();
}

/* --------------------- MAIN COMPONENT --------------------- */
export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [jsonData, setJsonData] = useState<APIData | null>(null);

  useEffect(() => {
    const load = async () => {
      const currentDate = new Date();
      const formattedDate =
        currentDate.getFullYear().toString() +
        String(currentDate.getDate()).padStart(2, "0") +
        String(currentDate.getMonth() + 1).padStart(2, "0");

      const url = `https://registry.kenic.or.ke/payapi/statistics?token=${formattedDate}`;
      const data = await fetchData(url);
      setJsonData(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading statistics...</Text>
      </View>
    );
  }

  if (!jsonData) {
    return (
      <View style={styles.center}>
        <Text>No data available.</Text>
      </View>
    );
  }

  /* --------------------- RENDER STATISTICS CARDS --------------------- */
  return (
    <ScrollView style={styles.container}>
      {Object.entries(data2).map(([category, keys]) =>
        category !== "percentages" ? (
          <View key={category} style={styles.category}>
            <Text style={styles.categoryTitle}>{category.replace("_"," ").toUpperCase()}</Text>
            {keys.map((key) => (
              <View key={key} style={styles.card}>
                <Text style={styles.cardTitle}>{keyMappings[key]?.name || key}</Text>
                <Text style={styles.cardValue}>{formatNumber(jsonData[key] ?? "N/A")}</Text>
              </View>
            ))}
          </View>
        ) : null
      )}
    </ScrollView>
  );
}

/* --------------------- STYLES --------------------- */
const styles = StyleSheet.create({
  container: { flex:1, padding:14, backgroundColor:"#fff" },
  category: { marginBottom:25 },
  categoryTitle: { fontSize:18, fontWeight:"700", marginBottom:10 },
  card: { backgroundColor:"#f4f4f4", padding:14, borderRadius:10, marginBottom:8 },
  cardTitle: { fontSize:15, fontWeight:"600" },
  cardValue: { fontSize:18, fontWeight:"700", marginTop:3 },
  center: { flex:1, justifyContent:"center", alignItems:"center" }
});
