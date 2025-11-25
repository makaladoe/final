// news.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Animated,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";

const SANITY_API_URL =
  "https://9geqtfdw.api.sanity.io/v2023-10-01/data/query/production1";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const FILTER_BAR_HEIGHT = 56;

type FeedItem = {
  _id?: string;
  title?: string;
  summary?: string;
  contentType?: "image" | "video" | "reel" | "pdf" | "link" | string;
  imageUrl?: string;
  videoFileUrl?: string;
  videoUrl?: string;
  reelUrl?: string;
  pdfUrl?: string;
  externalUrl?: string;
  body?: any;
  publishedAt?: string;
  category?: string;
  isTrending?: boolean;
};

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "careers", label: "Careers" },
  { key: "insights", label: "Insights" },
];

export default function NewsScreen(): React.ReactElement {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [visibleIndex, setVisibleIndex] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const flatListRef = useRef<FlatList<FeedItem> | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
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
        pdfFile,
        "pdfUrl": pdfFile.asset->url,
        externalUrl,
        body,
        publishedAt,
        category,
        isTrending
      }`;
      const url = `${SANITY_API_URL}?query=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const json = await res.json();
      setItems(json.result || []);
    } catch (err) {
      console.log("Sanity error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredItems = useMemo(() => {
    if (selectedFilter === "all") return items;
    if (selectedFilter === "trending") return items.filter((it) => !!it.isTrending);
    return items.filter((it) => it.category === selectedFilter);
  }, [items, selectedFilter]);

  const handleSelectFilter = (key: string) => {
    setSelectedFilter(key);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: FeedItem; index: number | null }> }) => {
      if (viewableItems.length > 0) {
        const sorted = viewableItems
          .filter((v) => typeof v.index === "number")
          .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        setVisibleIndex(sorted[0]?.index ?? null);
      } else {
        setVisibleIndex(null);
      }
    }
  ).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 75,
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: FeedItem; index: number }) => (
    <Pressable
      android_ripple={{ color: "rgba(0,0,0,0.04)" }}
      style={({ pressed }) => [{ opacity: pressed ? 0.98 : 1 }]}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{item.title}</Text>
        {item.summary && <Text style={styles.summary}>{item.summary}</Text>}

        {item.contentType === "image" && item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.media} resizeMode="contain" />
        )}

        {(item.contentType === "video" || item.contentType === "reel") &&
          (item.videoFileUrl || item.videoUrl || item.reelUrl) && (
            <VideoCard
              url={item.videoFileUrl || item.videoUrl || item.reelUrl!}
              autoplay={visibleIndex === index}
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
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No content yet</Text>
    </View>
  );

  // ------------------- Filter Chip -------------------
  const FilterChip: React.FC<{ label: string; isActive: boolean; onPress: () => void }> = ({
    label,
    isActive,
    onPress,
  }) => (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: false }}
      style={({ pressed }) => [
        styles.chip,
        isActive ? styles.chipActive : styles.chipInactive,
        { opacity: pressed ? 0.8 : 1 },
      ]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
            keyboardShouldPersistTaps="handled"
          >
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c.key}
                label={c.label}
                isActive={selectedFilter === c.key}
                onPress={() => handleSelectFilter(c.key)}
              />
            ))}
          </ScrollView>
        </View>

        {/* FlatList below filter bar */}
        <FlatList
          ref={flatListRef}
          data={filteredItems}
          extraData={selectedFilter}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </View>
    </SafeAreaView>
  );
}

// ------------------ VideoCard ------------------
type VideoCardProps = { url: string; autoplay?: boolean; style?: any };

const VideoCard: React.FC<VideoCardProps> = ({ url, autoplay = false, style = {} }) => {
  const player: any = useVideoPlayer(url, (p: any) => {
    try {
      p.loop = true;
      p.muted = false;
    } catch {}
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safePlay = async () => {
    try {
      await player.play?.();
      setIsPlaying(true);
    } catch {}
  };
  const safePause = async () => {
    try {
      await player.pause?.();
      setIsPlaying(false);
    } catch {}
  };

  useEffect(() => {
    if (autoplay) safePlay();
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      try {
        player.pause?.();
      } catch {}
    };
  }, [autoplay]);

  const toggleControls = () => {
    if (showControls) {
      Animated.timing(controlsOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(
        () => setShowControls(false)
      );
    } else {
      setShowControls(true);
      controlsOpacity.setValue(1);
      hideTimeout.current = setTimeout(() => {
        Animated.timing(controlsOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(
          () => setShowControls(false)
        );
      }, 2500);
    }
  };

  const handlePlayPause = async () => {
    isPlaying ? await safePause() : await safePlay();
    toggleControls();
  };

  return (
    <View style={[styles.media, style]}>
      <VideoView style={StyleSheet.absoluteFill} player={player} contentFit="contain" />
      <Animated.View
        pointerEvents={showControls ? "box-none" : "none"}
        style={[StyleSheet.absoluteFill, { opacity: controlsOpacity }]}
      >
        <TouchableOpacity onPress={handlePlayPause} style={styles.centerPlayButton}>
          <Text style={styles.controlText}>{isPlaying ? "⏸" : "▶️"}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ------------------ Styles ------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9f9f9", paddingTop: 8 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: { backgroundColor: "#fff", paddingBottom: 16 },

  title: { fontSize: 20, fontWeight: "700", color: "#222", marginHorizontal: 16, marginTop: 16 },
  summary: { fontSize: 16, color: "#555", marginHorizontal: 16, marginTop: 4, lineHeight: 22 },

  media: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.52, backgroundColor: "#000" },

  engagementRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 12 },
  engagementBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  engagementText: { fontSize: 14, color: "#555" },

  filterBar: {
    height: FILTER_BAR_HEIGHT,
    justifyContent: "center",
    marginTop: 50,
  },
  filterScroll: {
    justifyContent: "center",
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

  emptyContainer: { marginTop: 40, alignItems: "center" },
  emptyText: { color: "#999", fontSize: 16 },

  centerPlayButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlText: { color: "#fff", fontSize: 18 },
});
