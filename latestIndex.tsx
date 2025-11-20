import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import theme from "./theme";

/* --------------------- DATA DEFINITIONS --------------------- */
const mainKeys = ["total_domains", "total_registrars"];
const tldKeys = ["ac.ke","sc.ke","go.ke","co.ke","or.ke","ke","me.ke","info.ke","mobi.ke","ne.ke"];

const keyMappings: Record<string, { name: string }> = {
  total_domains: { name: ".KE Domains" },
  total_registrars: { name: "Registrars" },
  tlds_count: { name: "Top Level Domains" },
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
  maxFontSize?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 4000, maxFontSize = 32 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 50);
    const interval = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 50);

    return () => clearInterval(interval);
  }, [value, duration]);

  // Adjust font size dynamically to prevent wrapping
  const strValue = displayValue.toLocaleString();
  const fontSize = strValue.length > 7 ? maxFontSize - 4 : maxFontSize;

  return (
    <Text
      style={[styles.statValue, { fontSize }]}
      numberOfLines={1}
      ellipsizeMode="clip"
    >
      {strValue}
    </Text>
  );
};

/* --------------------- MAIN COMPONENT --------------------- */
export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jsonData, setJsonData] = useState<APIData | null>(null);
  const [currentTldIndex, setCurrentTldIndex] = useState(0);

  useEffect(() => {
    const loadData = async () => {
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
    loadData();
  }, []);

  // Rotate TLDs every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTldIndex((prev) => (prev + 1) % tldKeys.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleContinue = async () => {
    await AsyncStorage.setItem("hasSeenWelcome", "true");
    router.replace("/(auth)/signin");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading statistics...</Text>
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

  /* --------------------- STATS TO DISPLAY --------------------- */
  const statsData = [
    {
      key: "total_domains",
      value: Number(jsonData["total_domains"] || 0),
      label: keyMappings["total_domains"].name,
      wider: true,
    },
    {
      key: "total_registrars",
      value: Number(jsonData["total_registrars"] || 0),
      label: keyMappings["total_registrars"].name,
    },
    {
      key: "tlds_count",
      value: tldKeys.length,
      label: keyMappings["tlds_count"].name,
    },
  ];

  return (
    <ImageBackground
      source={require("../assets/images/background1.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Stats Panel */}
        <View style={styles.statsPanel}>
          {/* Top row: .KE Domains */}
          <View style={[styles.statCard, { width: "90%", marginBottom: 20 }]}>
            <AnimatedCounter
              value={statsData[0].value}
              duration={4000}
              maxFontSize={36}
            />
            <Text style={styles.statLabel}>{statsData[0].label}</Text>
          </View>

          {/* Bottom row: Registrars + TLDs */}
          <View style={styles.bottomStatsRow}>
            {statsData.slice(1).map((item) => (
              <View key={item.key} style={[styles.statCard, { width: "45%" }]}>
                <AnimatedCounter value={item.value} duration={3500} maxFontSize={28} />
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Available TLD ticker */}
        <View style={styles.tldContainer}>
          <Text style={styles.tldTitle}>Available TLDs</Text>
          <Text style={styles.tldItem}>• {tldKeys[currentTldIndex]}</Text>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

/* --------------------- STYLES --------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  statsPanel: {
    width: "100%",
    alignItems: "center",
    marginBottom: 40,
  },
  bottomStatsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  statValue: { fontSize: 28, fontWeight: "700", color: theme.colors.primary },
  statLabel: { fontSize: 14, color: theme.colors.gray600, marginTop: 5, textAlign: "center" },
  tldContainer: {
    width: "90%",
    height: 60,
    backgroundColor: "#dbeafe",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  tldTitle: { fontSize: 15, fontWeight: "700", color: "#1e3a8a" },
  tldItem: { fontSize: 16, fontWeight: "600", marginTop: 4 },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    elevation: 2,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
