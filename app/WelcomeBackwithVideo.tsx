// app/welcomeBack.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import theme from "./theme";
import AppLockScreen from "@/components/appLockScreen";

/* --------------------- DATA --------------------- */
const tldKeys = [
  "ac.ke", "sc.ke", "go.ke", "co.ke", "or.ke",
  "ke", "me.ke", "info.ke", "mobi.ke", "ne.ke",
];

const keyMappings: Record<string, { name: string }> = {
  total_domains: { name: ".KE Domains" },
  total_registrars: { name: "Registrars" },
  tlds_count: { name: "Top Level Domains" },
};

interface APIData {
  total_domains: number;
  total_registrars: number;
  tlds_count: number;
}

interface AnimatedCounterProps {
  value: number;
  maxFontSize?: number;
}

/* --------------------- COUNTER --------------------- */
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, maxFontSize = 32 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const intervalTime = 50;
    const duration = 2000;
    const increment = value / (duration / intervalTime);

    const interval = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [value]);

  const strValue = displayValue.toLocaleString();
  const fontSize = strValue.length > 7 ? maxFontSize - 4 : maxFontSize;

  return (
    <Text style={[styles.statValue, { fontSize }]} numberOfLines={1}>
      {strValue}
    </Text>
  );
};

/* --------------------- MAIN SCREEN --------------------- */
export default function WelcomeBackScreen() {
  const router = useRouter();
  const [currentTldIndex, setCurrentTldIndex] = useState(0);
  const [showLock, setShowLock] = useState(false);
  const [statsData, setStatsData] = useState<APIData | null>(null);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const titleAnim = useState(new Animated.Value(0))[0];
  const subtitleAnim = useState(new Animated.Value(0))[0];
  const cardsAnim = useState(new Animated.Value(0))[0];
  const buttonAnim = useState(new Animated.Value(0))[0];

  /* --------------------- VIDEO --------------------- */
  const player = useVideoPlayer(
    require("../assets/videos/intro.mp4"),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  /* --------------------- API --------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentDate = new Date();
        const formattedDate =
          currentDate.getFullYear().toString() +
          String(currentDate.getDate()).padStart(2, "0") +
          String(currentDate.getMonth() + 1).padStart(2, "0");

        const url = `https://registry.kenic.or.ke/payapi/statistics?token=${formattedDate}`;
        const res = await fetch(url);
        const data = await res.json();

        setStatsData({
          total_domains: Number(data.total_domains) || 0,
          total_registrars: Number(data.total_registrars) || 0,
          tlds_count: tldKeys.length,
        });

        // Animate everything sequentially for a premium feel
        Animated.sequence([
          Animated.timing(titleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(subtitleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(cardsAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(buttonAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.exp), useNativeDriver: true }),
        ]).start();

      } catch (e) {
        console.log("Failed to fetch API data:", e);
      }
    };

    fetchData();
  }, []);

  /* ---------------- TLD ROTATION ---------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTldIndex((prev) => (prev + 1) % tldKeys.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- LOCK SCREEN ---------------- */
  const handleContinue = () => setShowLock(true);
  const handleLockSuccess = async () => {
    await AsyncStorage.setItem("hasSeenWelcome", "true");
    router.replace("/(tabs)");
  };

  if (showLock) return <AppLockScreen onSuccess={handleLockSuccess} />;

  const statsArray = [
    { key: "total_domains", value: statsData?.total_domains || 0, label: keyMappings.total_domains.name },
    { key: "total_registrars", value: statsData?.total_registrars || 0, label: keyMappings.total_registrars.name },
    { key: "tlds_count", value: statsData?.tlds_count || tldKeys.length, label: keyMappings.tlds_count.name },
  ];

  return (
    <View style={styles.container}>
      {/* VIDEO BACKGROUND */}
      <VideoView player={player} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      <View style={styles.overlay} />

      {/* FAQ TOP RIGHT */}
      <TouchableOpacity style={styles.faqButton} onPress={() => router.push("/faq")}>
        <Ionicons name="help-circle-outline" size={32} color={theme.colors.white} />
      </TouchableOpacity>

      {/* ---------------- WELCOME TITLE ---------------- */}
      <Animated.View
        style={{
          opacity: titleAnim,
          transform: [
            { translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
          ],
        }}
      >
        <Text style={styles.welcomeTitle}>Welcome Back</Text>
      </Animated.View>

      {/* ---------------- PROUDLY KENYAN ---------------- */}
      <Animated.View style={{ opacity: subtitleAnim }}>
        <Text style={styles.subtitle}>🇰🇪 Proudly Kenyan</Text>
      </Animated.View>

      {/* ---------------- STATS PANEL ---------------- */}
      <Animated.View
        style={[
          styles.statsPanel,
          {
            opacity: cardsAnim,
            transform: [
              { translateY: cardsAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
            ],
          },
        ]}
      >
        {/* TOP CARD */}
        <View style={[styles.statCard, { width: "90%", marginBottom: 20 }]}>
          <AnimatedCounter value={statsArray[0].value} maxFontSize={36} />
          <Text style={styles.statLabel}>{statsArray[0].label}</Text>
        </View>

        {/* ROW CARDS */}
        <View style={styles.bottomStatsRow}>
          {statsArray.slice(1).map((item) => (
            <View key={item.key} style={[styles.statCard, { width: "45%" }]}>
              <AnimatedCounter value={item.value} maxFontSize={28} />
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* ---------------- TLD ROTATION ---------------- */}
      <Animated.View style={{ opacity: cardsAnim }}>
        <View style={styles.tldContainer}>
          <Text style={styles.tldTitle}>Available TLDs</Text>
          <Text style={styles.tldItem}>• {tldKeys[currentTldIndex]}</Text>
        </View>
      </Animated.View>

      {/* ---------------- CONTINUE ---------------- */}
      <Animated.View
        style={{
          opacity: buttonAnim,
          transform: [
            { scale: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
          ],
        }}
      >
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

/* --------------------- STYLES --------------------- */
const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    paddingTop: 70,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  faqButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },

  /* ----- TITLE + SUBTITLE ----- */
  welcomeTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 25,
  },

  statsPanel: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
    zIndex: 1,
  },
  bottomStatsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 14,
    paddingVertical: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 7,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginTop: 5,
    textAlign: "center",
  },

  /* ----- TLD ----- */
  tldContainer: {
    width: "90%",
    height: 60,
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  tldTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e3a8a",
  },
  tldItem: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },

  /* ----- BUTTON ----- */
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 45,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
});
