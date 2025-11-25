import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
} from "react-native";
import Constants from "expo-constants";

export default function ShopScreen() {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const H_PADDING = 20;
  const GAP = 16;
  const HERO_HEIGHT = Math.round(windowHeight * 0.35);
  const CARD_WIDTH = (windowWidth - H_PADDING * 2 - GAP) / 2;
  const CARD_HEIGHT = CARD_WIDTH * 1.05;

  const [offers, setOffers] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // 🔹 Sanity offers API (Loaded from .env via app.config.js)
  const SANITY_OFFERS_API =
    Constants.expoConfig?.extra?.SANITY_OFFERS_API ?? "";

  const fetchOffers = async () => {
    try {
      const response = await fetch(SANITY_OFFERS_API);
      const data = await response.json();
      setOffers(data.result || []);
    } catch (error) {
      console.error("Error fetching offers:", error);
    }
  };

  // Fetch offers on mount + auto-refresh every 60 seconds
  useEffect(() => {
    fetchOffers();
    const interval = setInterval(fetchOffers, 60000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Auto scroll effect (every 8 seconds)
  useEffect(() => {
    if (!offers.length) return;
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % offers.length;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 8000); // slower transition (8 seconds)
    return () => clearInterval(interval);
  }, [currentIndex, offers.length]);

  const handleScroll = (event: any) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / (windowWidth - H_PADDING * 2)
    );
    setCurrentIndex(index);
  };

  const logo = require("../../assets/images/logo.jpg");
  const jacket = require("../../assets/images/jacket.jpg");

  const services = [
    {
      id: "booking",
      title: "Reserve A Domain",
      image: logo,
      route: "/bookDomain",
      bg: "#ffffff",
    },
    {
      id: "merch",
      title: "Merchandise",
      image: jacket,
      route: "/merchandise",
      bg: "#ffffff",
    },
    
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingHorizontal: H_PADDING,
        paddingTop: 80, // 👈 lowered content
        paddingBottom: 60,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* 🔹 Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Latest Offers</Text>
      </View>

      <View style={{ height: 14 }} />

      {/* 🔹 HERO SECTION */}
      <View style={[styles.hero, { height: HERO_HEIGHT }]}>
        {offers.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={offers}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View
                style={{
                  position: "relative",
                  width: windowWidth - H_PADDING * 2,
                  height: HERO_HEIGHT,
                }}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                {/* 🔸 Overlay title */}
                <View style={styles.overlay}>
                  <Text style={styles.offerTitle}>{item.title}</Text>
                </View>
              </View>
            )}
          />
        ) : (
          <View
            style={{
              height: HERO_HEIGHT,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text>Loading offers...</Text>
          </View>
        )}

        {/* 🔸 Dot Indicators */}
        <View style={styles.dotsContainer}>
          {offers.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: index === currentIndex ? 1 : 0.3,
                  backgroundColor: index === currentIndex ? "#111" : "#999",
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={{ height: 28 }} />

      {/* 🔹 SERVICE GRID */}
      <View style={styles.grid}>
        {services.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.card,
              {
                backgroundColor: s.bg,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
              },
            ]}
            activeOpacity={0.95}
            onPress={() =>
              s.route ? router.push(s.route as any) : Alert.alert(s.title)
            }
          >
            <View style={styles.cardTop}>
              <Image
                source={s.image}
                style={styles.cardImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{s.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ================= STYLES ==================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fb",
  },

  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111",
  },

  // HERO SECTION
  hero: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#ccc",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  overlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },

  dotsContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    borderRadius: 16,
    marginBottom: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  cardTop: {
    flex: 1.2,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
  },
  cardImage: {
    width: "70%",
    height: "70%",
    borderRadius: 10,
  },
  cardBody: {
    paddingVertical: 10,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
  },
});
