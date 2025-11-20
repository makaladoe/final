import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";

/* --------------------- DATA DEFINITIONS --------------------- */
const mainKeys = ["total_registrars", "total_domains"];
const tldKeys = ["ac.ke","sc.ke","go.ke","co.ke","or.ke","ke","me.ke","info.ke","mobi.ke","ne.ke"];

const keyMappings: Record<string, { name: string }> = {
  total_registrars: { name: "Registrars" },
  total_domains: { name: "Domains" },
  tlds_count: { name: "TLDs Count" }
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

/* --------------------- ANIMATED COUNTER --------------------- */
interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 30); // updates every 30ms
    const interval = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 30);

    return () => clearInterval(interval);
  }, [value, duration]);

  return <Text style={styles.cardValue}>{displayValue.toLocaleString()}</Text>;
};

/* --------------------- MAIN COMPONENT --------------------- */
export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [jsonData, setJsonData] = useState<APIData | null>(null);
  const [showTldDetails, setShowTldDetails] = useState(false);

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

      // Show TLD details after 2 seconds
      setTimeout(() => {
        setShowTldDetails(true);
      }, 2000);
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

  /* --------------------- RENDER STATISTICS --------------------- */
  return (
    <ScrollView style={styles.container}>
      {/* Main counters */}
      {mainKeys.map((key) => (
        <View key={key} style={styles.card}>
          <Text style={styles.cardTitle}>{keyMappings[key]?.name || key}</Text>
          <AnimatedCounter value={Number(jsonData[key] || 0)} duration={1200} />
        </View>
      ))}

      {/* TLDs count */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{keyMappings["tlds_count"].name}</Text>
        <AnimatedCounter value={tldKeys.length} duration={1000} />
      </View>

      {/* Delayed TLD details */}
      {showTldDetails && (
        <View style={[styles.card, { backgroundColor: "#dbeafe" }]}>
          <Text style={[styles.cardTitle, { color: "#1e3a8a" }]}>Available TLDs</Text>
          {tldKeys.map((tld) => (
            <Text key={tld} style={styles.tldItem}>• {tld}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/* --------------------- STYLES --------------------- */
const styles = StyleSheet.create({
  container: { flex:1, padding:14, backgroundColor:"#fff" },
  card: { backgroundColor:"#f4f4f4", padding:14, borderRadius:10, marginBottom:8 },
  cardTitle: { fontSize:15, fontWeight:"600", marginBottom:4 },
  cardValue: { fontSize:24, fontWeight:"700", color:"#1e3a8a" },
  tldItem: { fontSize:14, marginLeft:8, marginVertical:2 },
  center: { flex:1, justifyContent:"center", alignItems:"center" }
});
