import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  ImageBackground,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import theme from "./theme";

/* --------------------- DATA --------------------- */
const tldKeys = [
  "ac.ke",
  "sc.ke",
  "go.ke",
  "co.ke",
  "or.ke",
  "ke",
  "me.ke",
  "info.ke",
  "mobi.ke",
  "ne.ke",
];

const keyMappings: Record<string, { name: string }> = {
  total_domains: { name: ".KE Domains" },
  total_registrars: { name: "Registrars" },
  tlds_count: { name: " Domains Extensions" },
};

interface APIData {
  total_domains: number;
  total_registrars: number;
  tlds_count: number;
}

/* --------------------- Fetch Helper --------------------- */
async function fetchData(url: string): Promise<APIData | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* --------------------- Animated Counter (TS FIXED) --------------------- */
interface CounterProps {
  value: number;
  duration?: number;
}

const AnimatedCounter: React.FC<CounterProps> = ({ value, duration = 3000 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let n = 0;
    const increment = value / (duration / 30);
    const interval = setInterval(() => {
      n += increment;
      if (n >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(n));
      }
    }, 30);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <Text style={styles.statValue}>{displayValue.toLocaleString()}</Text>
  );
};

/* --------------------- MAIN --------------------- */
export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jsonData, setJsonData] = useState<APIData | null>(null);
  const [currentTldIndex, setCurrentTldIndex] = useState(0);

  const fadeAnim = useState(new Animated.Value(0))[0];

  /* ---------------- Load API ---------------- */
  useEffect(() => {
    const load = async () => {
      const d = new Date();
      const token =
        d.getFullYear().toString() +
        String(d.getDate()).padStart(2, "0") +
        String(d.getMonth() + 1).padStart(2, "0");

      const url = `https://registry.kenic.or.ke/payapi/statistics?token=${token}`;
      const data = await fetchData(url);

      if (data) {
        setJsonData({
          total_domains: Number(data.total_domains) || 0,
          total_registrars: Number(data.total_registrars) || 0,
          tlds_count: tldKeys.length,
        });
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }).start();

      setLoading(false);
    };

    load();
  }, []);

  /* ------------ Rotate TLDs ----------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTldIndex((i) => (i + 1) % tldKeys.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleContinue = async () => {
    await AsyncStorage.setItem("hasSeenWelcome", "true");
    router.replace("/(auth)/signin");
  };

  /* ----------------- LOADING UI ----------------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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

  /* ----------------- STATS ----------------- */
  const statsData = [
    {
      key: "total_domains",
      value: jsonData.total_domains,
      label: keyMappings.total_domains.name,
    },
    {
      key: "total_registrars",
      value: jsonData.total_registrars,
      label: keyMappings.total_registrars.name,
    },
    {
      key: "tlds_count",
      value: jsonData.tlds_count,
      label: keyMappings.tlds_count.name,
    },
  ];

  return (
    <ImageBackground
      source={require("../assets/images/background4.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.gradientOverlay} />

      {/* HEADER */}
      <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
        <Text style={styles.headerTitle}>Welcome to</Text>
        <Text style={styles.headerMain}>.KE Online Platform</Text>
      </Animated.View>

      {/* STATS */}
      <Animated.View style={[styles.statsPanel, { opacity: fadeAnim }]}>
        <View style={styles.statsRow}>
          {statsData.map((stat) => (
            <View key={stat.key} style={styles.statCard}>
              <AnimatedCounter value={stat.value} />
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* TLD ROTATOR */}
      <View style={styles.tldTicker}>
        <Text style={styles.tldText}>
          Available: {tldKeys[currentTldIndex]}
        </Text>
      </View>

      {/* BUTTON */}
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
}

/* --------------------- STYLES --------------------- */
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  headerTitle: {
    fontSize: 20,
    color: "#fff",
    opacity: 0.9,
  },

  headerMain: {
    fontSize: 33,
    color: "#fff",
    fontWeight: "800",
    marginTop: 6,
  },

  statsPanel: {
    marginBottom: 40,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statCard: {
    width: width * 0.28,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#ddd",
    textAlign: "center",
  },

  tldTicker: {
    marginTop: 20,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },

  tldText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 34,
    borderRadius: 30,
    alignSelf: "center",
    marginTop: 50,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
