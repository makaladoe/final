// --------------------------------------
// NEWS SCREEN WITH NATIVE VIDEO CONTROLS
// --------------------------------------

import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Constants from "expo-constants";
import { addNotification } from "../../services/localNotifications"; // notification handler

// ✔️ Load URL from .env
const SANITY_API_URL = Constants.expoConfig?.extra?.SANITY_API_URL;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FILTER_BAR_HEIGHT = 56;

type FeedItem = {
  _id?: string;
  title?: string;
  summary?: string;
  contentType?: "image" | "video" | "reel";
  imageUrl?: string;
  videoFileUrl?: string;
  videoUrl?: string;
  reelUrl?: string;
  publishedAt?: string;
  category?: string;
};

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "careers", label: "Careers" },
  { key: "insights", label: "Insights" },
];

export default function NewsScreen() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const flatListRef = useRef<FlatList<FeedItem>>(null);

  // Track previous feed items for new article detection
  const previous = useRef<FeedItem[]>([]);

  const fetchData = async () => {
    try {
      const query = `*[_type == "feedItem"] | order(publishedAt desc){
        _id,
        title,
        summary,
        contentType,
        image,
        "imageUrl": image.asset->url,
        videoFile,
        "videoFileUrl": videoFile.asset->url,
        videoUrl,
        reelUrl,
        publishedAt,
        category
      }`;

      const res = await fetch(
        `${SANITY_API_URL}?query=${encodeURIComponent(query)}`
      );
      const json = await res.json();
      const data: FeedItem[] = json.result || [];

      // Detect new articles
      data.forEach((item) => {
        const exists = previous.current.some((n) => n._id === item._id);
        if (!exists) {
          addNotification({
            id: Date.now().toString(),
            title: "New Article",
            message: item.title || "New article published",
            timestamp: Date.now(),
            type: "news",
          });
        }
      });

      // Update previous ref and state
      previous.current = data;
      setItems(data);
    } catch (err) {
      console.log("Sanity error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Optional: polling every 30s to check for new articles
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredItems = useMemo(() => {
    if (selectedFilter === "all") return items;
    return items.filter((it) => it.category === selectedFilter);
  }, [items, selectedFilter]);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.summary}>{item.summary}</Text>

      {item.contentType === "image" && item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.media}
          resizeMode="contain"
        />
      )}

      {(item.contentType === "video" || item.contentType === "reel") && (
        <VideoCard
          url={item.videoFileUrl || item.videoUrl || item.reelUrl || ""}
        />
      )}

      <View style={styles.engagementRow}>
        <TouchableOpacity style={styles.engagementBtn}>
          <Ionicons name="heart-outline" size={20} color="#555" />
          <Text style={styles.engagementText}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.engagementBtn}>
          <Ionicons name="chatbubble-outline" size={20} color="#555" />
          <Text style={styles.engagementText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.engagementBtn}>
          <Ionicons name="share-social-outline" size={20} color="#555" />
          <Text style={styles.engagementText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.key}
                onPress={() => {
                  setSelectedFilter(c.key);
                  flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                }}
                style={[
                  styles.chip,
                  selectedFilter === c.key
                    ? styles.chipActive
                    : styles.chipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedFilter === c.key && styles.chipTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <FlatList
          ref={flatListRef}
          data={filteredItems}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      </View>
    </SafeAreaView>
  );
}

// ==========================
// VIDEO CARD WITH NATIVE CONTROLS
// ==========================

type VideoCardProps = {
  url: string;
};

const VideoCard = ({ url }: VideoCardProps) => {
  const player = useVideoPlayer(url);

  return (
    <VideoView
      style={styles.media}
      player={player}
      contentFit="contain"
      nativeControls
    />
  );
};

// ==========================
// STYLES
// ==========================

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9f9f9", paddingTop: 8 },

  card: { backgroundColor: "#fff", paddingBottom: 16 },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginHorizontal: 16,
    marginTop: 16,
  },
  summary: {
    fontSize: 16,
    color: "#555",
    marginHorizontal: 16,
    marginTop: 4,
  },

  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.52,
    backgroundColor: "#000",
  },

  engagementRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  engagementBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  engagementText: { fontSize: 14, color: "#555" },

  filterBar: { height: FILTER_BAR_HEIGHT, justifyContent: "center", marginTop: 50 },
  filterScroll: {
    alignItems: "center",
    paddingHorizontal: 8,
    flexGrow: 1,
  },
  chip: {
    borderRadius: 999,
    marginHorizontal: 6,
    paddingHorizontal: 20,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  chipActive: { backgroundColor: "#222" },
  chipInactive: { backgroundColor: "#fff" },
  chipText: { fontSize: 14, color: "#222", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
});
