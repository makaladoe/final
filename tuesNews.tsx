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
  Linking,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  Animated,
  ScrollView,
  Pressable,
  PanResponder,
  Platform,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";

const SANITY_API_URL =
  "https://9geqtfdw.api.sanity.io/v2023-10-01/data/query/production1";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const FILTER_BAR_HEIGHT = 56;
const FILTER_BAR_TOP = 50;

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

export default function NewsScreen(): React.ReactElement {

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [visibleIndex, setVisibleIndex] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const flatListRef = useRef<FlatList<FeedItem> | null>(null);

  const CATEGORIES = [
    { key: "all", label: "All" },
    { key: "trending", label: "Trending" },
    { key: "domainsales", label: "Domain Sales" },
    { key: "registrars", label: "Registrars" },
    { key: "careers", label: "Careers" },
    { key: "insights", label: "Insights" },
  ];

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
      setItems((json.result || []) as FeedItem[]);
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

  const filteredItems = useMemo<FeedItem[]>(() => {
    if (selectedFilter === "all") return items;
    if (selectedFilter === "trending") return items.filter((it) => !!it.isTrending);
    return items.filter((it) => it.category === selectedFilter);
  }, [items, selectedFilter]);

  const handleSelectFilter = (key: string) => {
    setSelectedFilter(key);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: FeedItem; index: number | null }> }) => {
      if (viewableItems && viewableItems.length > 0) {
        const sorted = viewableItems
          .filter((v) => typeof v.index === "number")
          .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        if (sorted.length > 0) {
          setVisibleIndex(sorted[0].index ?? null);
          return;
        }
      }
      setVisibleIndex(null);
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

  if (selectedItem) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => setSelectedItem(null)}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <ScrollView style={styles.contentContainer}>
          <Text style={styles.contentTitle}>{selectedItem.title}</Text>
          {selectedItem.summary && (
            <Text style={styles.contentSummary}>{selectedItem.summary}</Text>
          )}

          {selectedItem.contentType === "image" && selectedItem.imageUrl && (
            <Image
              source={{ uri: selectedItem.imageUrl }}
              style={styles.contentMedia}
              resizeMode="contain"
            />
          )}

          {selectedItem.contentType === "video" &&
            (selectedItem.videoFileUrl || selectedItem.videoUrl) && (
              <VideoCard
                url={selectedItem.videoFileUrl || selectedItem.videoUrl!}
                autoplay={true}
              />
            )}

          {selectedItem.contentType === "reel" && selectedItem.reelUrl && (
            <VideoCard url={selectedItem.reelUrl} autoplay={true} />
          )}

          {selectedItem.contentType === "pdf" && selectedItem.pdfUrl && (
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={() => Linking.openURL(selectedItem.pdfUrl!)}
            >
              <Text style={styles.pdfText}>Open PDF</Text>
            </TouchableOpacity>
          )}

          {selectedItem.contentType === "link" && selectedItem.externalUrl && (
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => Linking.openURL(selectedItem.externalUrl!)}
            >
              <Text style={styles.linkText}>Open Link</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item, index }: { item: FeedItem; index: number }) => {
    return (
      <Pressable
        android_ripple={{ color: "rgba(0,0,0,0.04)" }}
        onPress={() => setSelectedItem(item)}
        style={({ pressed }) => [{ opacity: pressed ? 0.98 : 1 }]}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          {item.summary && <Text style={styles.summary}>{item.summary}</Text>}

          {item.contentType === "image" && item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.media}
              resizeMode="contain"
            />
          )}

          {item.contentType === "video" &&
            (item.videoFileUrl || item.videoUrl) && (
              <VideoCard
                url={item.videoFileUrl || item.videoUrl!}
                autoplay={visibleIndex === index}
              />
            )}

          {item.contentType === "reel" && item.reelUrl && (
            <VideoCard url={item.reelUrl} autoplay={visibleIndex === index} />
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
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No content yet</Text>
    </View>
  );

  const FilterBar = () => {
    return (
      <View style={[styles.filterBarContainer, { top: FILTER_BAR_TOP }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {CATEGORIES.map((c) => {
            const isActive = selectedFilter === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => handleSelectFilter(c.key)}
                style={[
                  styles.chip,
                  isActive ? styles.chipActive : styles.chipInactive,
                ]}
                android_ripple={{ color: "rgba(0,0,0,0.08)" }}
                hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                accessibilityRole="button"
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FilterBar />

      <FlatList
        ref={flatListRef}
        data={filteredItems}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingTop: FILTER_BAR_HEIGHT + FILTER_BAR_TOP + 8,
          paddingBottom: 32,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </SafeAreaView>
  );
}

// ------------------ VideoCard ------------------
type VideoCardProps = {
  url: string;
  autoplay?: boolean;
  style?: any;
};

const VideoCard: React.FC<VideoCardProps> = ({ url, autoplay = false, style = {} }) => {
  const player: any = useVideoPlayer(url, (p: any) => {
    try {
      p.loop = true;
      p.muted = false;
    } catch {}
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);

  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTap = useRef<number>(0);

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
  const safeSeek = async (seconds: number) => {
    try {
      if (typeof player.setPosition === "function") {
        await player.setPosition(seconds);
      } else if (typeof player.seek === "function") {
        await player.seek(seconds);
      } else if (typeof player.setCurrentTime === "function") {
        await player.setCurrentTime(seconds);
      } else if (typeof player.currentTime !== "undefined") {
        player.currentTime = seconds;
      }
      setPosition(seconds);
    } catch {}
  };

  const safeGetPosition = async (): Promise<number | null> => {
    try {
      if (typeof player.getPosition === "function") return await player.getPosition();
      if (typeof player.position === "number") return player.position;
      if (player.status?.positionMillis) return player.status.positionMillis / 1000;
    } catch {}
    return null;
  };

  const safeGetDuration = async (): Promise<number | null> => {
    try {
      if (typeof player.getDuration === "function") return await player.getDuration();
      if (typeof player.duration === "number") return player.duration;
      if (player.status?.durationMillis) return player.status.durationMillis / 1000;
    } catch {}
    return null;
  };

  const autoplayRef = useRef<boolean>(autoplay);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const d = await safeGetDuration();
      if (!mounted) return;
      if (d) setDuration(d);
    })();

    if (autoplay && !autoplayRef.current) {
      safePlay();
    }
    autoplayRef.current = autoplay;

    return () => {
      mounted = false;
    };
  }, [autoplay]);

  useEffect(() => {
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
      try {
        player.pause?.();
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(async () => {
      const pos = await safeGetPosition();
      const dur = await safeGetDuration();
      if (typeof pos === "number") setPosition(pos);
      if (typeof dur === "number") setDuration(dur);
    }, 500);
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const showControlsImmediate = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setShowControls(true);
    controlsOpacity.setValue(1);
    hideTimeout.current = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setShowControls(false));
    }, 2500);
  };

  const toggleControls = () => {
    if (showControls) {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowControls(false));
    } else {
      showControlsImmediate();
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await safePause();
    } else {
      await safePlay();
    }
    showControlsImmediate();
  };

  const handleMute = () => {
    const next = !muted;
    try {
      player.muted = next;
    } catch {}
    setMuted(next);
    showControlsImmediate();
  };

  const formatTime = (secs: number | null) => {
    if (!secs || isNaN(secs)) return "0:00";
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    const m = Math.floor(secs / 60).toString();
    return `${m}:${s}`;
  };

  const onTapArea = (side: "left" | "right" | "center") => {
    const now = Date.now();
    const delta = now - lastTap.current;
    lastTap.current = now;
    if (delta < 300) {
      const jump = side === "left" ? -10 : 10;
      const newPos = Math.max(0, Math.min(duration || 0, position + jump));
      safeSeek(newPos);
      showControlsImmediate();
    } else {
      toggleControls();
    }
  };

  const progressBarWidth = useRef<number>(0);
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        const x = evt.nativeEvent.locationX;
        const w = progressBarWidth.current || 1;
        const ratio = Math.max(0, Math.min(1, x / w));
        const newPos = (duration || 0) * ratio;
        setPosition(newPos);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const w = progressBarWidth.current || 1;
        const ratio = Math.max(0, Math.min(1, x / w));
        const newPos = (duration || 0) * ratio;
        setPosition(newPos);
      },
      onPanResponderRelease: async (evt) => {
        const x = evt.nativeEvent.locationX;
        const w = progressBarWidth.current || 1;
        const ratio = Math.max(0, Math.min(1, x / w));
        const newPos = (duration || 0) * ratio;
        await safeSeek(newPos);
        showControlsImmediate();
      },
    })
  ).current;

  return (
    <View style={[styles.media, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Pressable
          style={[StyleSheet.absoluteFill, { flexDirection: "row" }]}
          onPress={() => onTapArea("center")}
        >
          <Pressable style={{ flex: 1 }} onPress={() => onTapArea("left")} hitSlop={20} />
          <Pressable style={{ flex: 1 }} onPress={() => onTapArea("right")} hitSlop={20} />
        </Pressable>
      </View>

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="contain"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      </View>

      <Animated.View
        pointerEvents={showControls ? "box-none" : "none"}
        style={[StyleSheet.absoluteFill, { opacity: controlsOpacity }]}
      >
        <View style={{ position: "absolute", top: 12, left: 12, right: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <TouchableOpacity onPress={handleMute} style={styles.topRightBtn}>
              <Text style={styles.controlText}>{muted ? "🔇" : "🔊"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <TouchableOpacity
            onPress={handlePlayPause}
            style={styles.centerPlayButton}
            activeOpacity={0.85}
          >
            <Text style={styles.controlText}>{isPlaying ? "⏸" : "▶️"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomControlsContainer}>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          <View
            style={styles.progressBarWrapper}
            onLayout={(e) => (progressBarWidth.current = e.nativeEvent.layout.width)}
            {...pan.panHandlers}
          >
            <View style={styles.progressBackground} />
            <View
              style={[
                styles.progressForeground,
                { width: (progressBarWidth.current - 24) * (duration ? position / duration : 0) },
              ]}
            />
            <View style={styles.scrubHandleContainer} pointerEvents="none">
              <View style={styles.scrubHandle} />
            </View>
          </View>

          <View style={styles.bottomButtonsRow}>
            <TouchableOpacity
              onPress={() => safeSeek(Math.max(0, (position || 0) - 10))}
              style={styles.smallBtn}
            >
              <Text style={styles.controlText}>⏪ 10s</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseBtn}>
              <Text style={[styles.controlText, { fontSize: 22 }]}>{isPlaying ? "⏸" : "▶️"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => safeSeek(Math.min(duration || 0, (position || 0) + 10))}
              style={styles.smallBtn}
            >
              <Text style={styles.controlText}>10s ⏩</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isBuffering && (
          <View style={styles.bufferingOverlay} pointerEvents="none">
            <ActivityIndicator size="small" />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

// ------------------ Styles ------------------
const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 0,
    marginHorizontal: 0,
    paddingBottom: 16,
  },

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
    lineHeight: 22,
  },

  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.52,
    backgroundColor: "#000",
    justifyContent: "center",
    overflow: "hidden",
  },

  engagementRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  engagementBtn: { flexDirection: "row", alignItems: "center" as const, gap: 6 as any },
  engagementText: { fontSize: 14, color: "#555" },

  pdfBtn: {
    backgroundColor: "#2c3e50",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginHorizontal: 16,
    alignSelf: "flex-start",
  },
  pdfText: { color: "#fff", fontWeight: "600" },

  linkBtn: {
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginHorizontal: 16,
    alignSelf: "flex-start",
  },
  linkText: { color: "#fff", fontWeight: "600" },

  contentContainer: { flex: 1, paddingTop: 80 },
  contentTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    marginHorizontal: 16,
  },
  contentSummary: { fontSize: 18, color: "#ddd", marginBottom: 16, marginHorizontal: 16 },
  contentMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
    backgroundColor: "#000",
    marginBottom: 16,
  },

  exitButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },

  centerPlayButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  topRightBtn: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  bottomRightButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlText: { color: "#fff", fontSize: 18 },

  filterBarContainer: {
    position: "absolute",
    left: 8,
    right: 8,
    height: FILTER_BAR_HEIGHT,
    zIndex: 50,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    backgroundColor: "transparent",
  },
  filterScrollContent: {
    alignItems: "center",
    paddingHorizontal: 8,
    height: FILTER_BAR_HEIGHT,
  },
  chip: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#222" },
  chipInactive: { backgroundColor: "#fff" },
  chipText: {
    fontSize: 14,
    color: "#222",
    fontWeight: "600",
  },
  chipTextActive: { color: "#fff" },

  emptyContainer: { marginTop: 40, alignItems: "center" },
  emptyText: { color: "#999", fontSize: 16 },

  bottomControlsContainer: {
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  timeRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  timeText: { color: "#fff", fontSize: 12 },
  progressBarWrapper: {
    height: 28,
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  progressBackground: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 2,
  },
  progressForeground: {
    position: "absolute",
    left: 12,
    height: 4,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  scrubHandleContainer: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 28,
    justifyContent: "center",
  },
  scrubHandle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
    marginLeft: -6,
  },
  bottomButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  smallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  playPauseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
