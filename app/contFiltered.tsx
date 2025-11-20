import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";

/* --------------------- DATA DEFINITIONS --------------------- */
const filteredKeys = [
  "total_registrars",
  "total_domains",
  "ac.ke","sc.ke","go.ke",
  "co.ke","or.ke","ke","me.ke","info.ke","mobi.ke","ne.ke"
];

const keyMappings: Record<string, { name: string }> = {
  total_registrars: { name: "Registrars" },
  total_domains: { name: "Domains" },
  "ac.ke": { name: "ac.ke" },
  "sc.ke": { name: "sc.ke" },
  "go.ke": { name: "go.ke" },
  "co.ke": { name: "co.ke" },
  "or.ke": { name: "or.ke" },
  ke: { name: "ke" },
  "me.ke": { name: "me.ke" },
  "info.ke": { name: "info.ke" },
  "mobi.ke": { name: "mobi.ke" },
  "ne.ke": { name: "ne.ke" }
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

  /* --------------------- RENDER FILTERED STATISTICS --------------------- */
  return (
    <ScrollView style={styles.container}>
      {filteredKeys.map((key) => (
        <View key={key} style={styles.card}>
          <Text style={styles.cardTitle}>{keyMappings[key]?.name || key}</Text>
          <Text style={styles.cardValue}>{formatNumber(jsonData[key] ?? "N/A")}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

/* --------------------- STYLES --------------------- */
const styles = StyleSheet.create({
  container: { flex:1, padding:14, backgroundColor:"#fff" },
  card: { backgroundColor:"#f4f4f4", padding:14, borderRadius:10, marginBottom:8 },
  cardTitle: { fontSize:15, fontWeight:"600" },
  cardValue: { fontSize:18, fontWeight:"700", marginTop:3 },
  center: { flex:1, justifyContent:"center", alignItems:"center" }
});
