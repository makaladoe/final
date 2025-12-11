// --------------------------------------
// NEWS SCREEN (WITH LIKES + COMMENTS + REPLIES)
// --------------------------------------

import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  View,
} from "react-native";
import Constants from "expo-constants";

// AUTH
import { useAuth } from "../../context/authcontext";

// SUPABASE ENGAGEMENT SERVICES
import {
  toggleLike,
  getLikeCount,
  userLikedPost,
  addComment,
  addReply,
  getCommentsForPost,
} from "../../services/supabaseService";

// LOCAL NOTIFICATION
import { addNotification } from "../../services/localNotifications";

// FIRESTORE
import { db } from "../../context/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const SANITY_API_URL = Constants.expoConfig?.extra?.SANITY_API_URL;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FILTER_BAR_HEIGHT = 56;

// ---------------------------
// TYPES
// ---------------------------
type FeedItem = {
  _id: string;
  title: string;
  summary?: string;
  contentType?: "image" | "video" | "reel";
  imageUrl?: string;
  videoFileUrl?: string;
  videoUrl?: string;
  reelUrl?: string;
  publishedAt?: string;
  category?: string;
  ownerId?: string;
};

type CommentItem = {
  id: string;
  user_id: string;
  user_name: string;
  post_id: string;
  comment: string;
  parent_comment_id?: string | null;
};

// ---------------------------
// CATEGORIES
// ---------------------------
const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "careers", label: "Careers" },
  { key: "insights", label: "Insights" },
];

export default function NewsScreen() {
  const { user } = useAuth();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const flatListRef = useRef<FlatList<FeedItem>>(null);

  // Likes
  const [likesCount, setLikesCount] = useState<{ [key: string]: number }>({});
  const [likedState, setLikedState] = useState<{ [key: string]: boolean }>({});

  // Comments
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [activePost, setActivePost] = useState<FeedItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const previous = useRef<FeedItem[]>([]);

  // ---------------------------
  // GET POST OWNER
  // ---------------------------
  const getPostOwnerId = async (postId: string) => {
    try {
      const query = `*[_type == "feedItem" && _id == "${postId}"]{ user-> { _id } }`;
      const res = await fetch(`${SANITY_API_URL}?query=${encodeURIComponent(query)}`);
      const json = await res.json();

      return json?.result?.[0]?.user?._id || "unknown";
    } catch (e) {
      console.log("Failed to fetch post owner:", e);
      return "unknown";
    }
  };

  // ---------------------------
  // GET USER FULL NAME
  // ---------------------------
  const getUserName = async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        return data.fullName || "Anonymous";
      }
    } catch (err) {
      console.log("Name fetch error:", err);
    }
    return "Anonymous";
  };

  // ---------------------------
  // FETCH NEWS
  // ---------------------------
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
        category,
        user->{ _id }
      }`;

      const res = await fetch(`${SANITY_API_URL}?query=${encodeURIComponent(query)}`);
      const json = await res.json();
      const data: FeedItem[] =
        json.result?.map((item: any) => ({
          ...item,
          ownerId: item.user?._id || "unknown",
        })) || [];

      data.forEach((item) => {
        if (!previous.current.some((i) => i._id === item._id)) {
          addNotification({
            id: Date.now().toString(),
            title: "New Article",
            message: item.title || "New article available",
            timestamp: Date.now(),
            type: "info",
          });
        }
      });

      previous.current = data;
      setItems(data);

      data.forEach((post) => post._id && refreshLikes(post._id));
    } catch (err) {
      console.log("Sanity fetch error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const refreshLikes = async (post_id: string) => {
    if (!user) return;

    const { count } = await getLikeCount(post_id);
    const { liked } = await userLikedPost({
      user_id: user.uid,
      post_id,
    
    
    });

    setLikesCount((prev) => ({ ...prev, [post_id]: count || 0 }));
    setLikedState((prev) => ({ ...prev, [post_id]: liked || false }));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ---------------------------
  // LIKE HANDLER
  // ---------------------------
  const handleLike = async (post_id: string) => {
    if (!user) return;

    const user_name = await getUserName(user.uid);
    const postOwnerId = await getPostOwnerId(post_id);

    await toggleLike({
      user_id: user.uid,
      user_name,
      post_id,
      postOwnerId,
    });

    refreshLikes(post_id);
  };

  // ---------------------------
  // OPEN COMMENTS
  // ---------------------------
  const openComments = async (post: FeedItem) => {
    setActivePost(post);
    setCommentsModalVisible(true);

    const { data } = await getCommentsForPost(post._id);
    setComments(data || []);
  };

  // ---------------------------
  // SEND COMMENT OR REPLY
  // ---------------------------
  const sendComment = async () => {
    if (!commentInput.trim() || !user || !activePost) return;

    const user_name = await getUserName(user.uid);
    const postOwnerId = activePost.ownerId || "unknown";

    if (!replyingTo) {
      await addComment({
        user_id: user.uid,
        user_name,
        post_id: activePost._id,
        comment: commentInput.trim(),
        postOwnerId,
      });
    } else {
      await addReply({
        user_id: user.uid,
        user_name,
        post_id: activePost._id,
        comment: commentInput.trim(),
        parent_comment_id: replyingTo,
        parentCommentOwnerId: postOwnerId,   // ← FIXED HERE
      });
      setReplyingTo(null);
    }

    setCommentInput("");

    const { data } = await getCommentsForPost(activePost._id);
    setComments(data || []);
  };

  // ---------------------------
  // FILTERED FEED
  // ---------------------------
  const filteredItems = useMemo(() => {
    if (selectedFilter === "all") return items;
    return items.filter((it) => it.category === selectedFilter);
  }, [items, selectedFilter]);

  // ---------------------------
  // RENDER ITEM
  // ---------------------------
  const renderItem = ({ item }: { item: FeedItem }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.summary}>{item.summary}</Text>

      {item.contentType === "image" && item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.media} resizeMode="contain" />
      )}

      {(item.contentType === "video" || item.contentType === "reel") && (
        <VideoCard url={item.videoFileUrl || item.videoUrl || item.reelUrl || ""} />
      )}

      <View style={styles.engagementRow}>
        <TouchableOpacity
          style={styles.engagementBtn}
          onPress={() => handleLike(item._id)}
        >
          <Ionicons
            name={likedState[item._id] ? "heart" : "heart-outline"}
            size={22}
            color={likedState[item._id] ? "red" : "#555"}
          />
          <Text style={styles.engagementText}>{likesCount[item._id] || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.engagementBtn} onPress={() => openComments(item)}>
          <Ionicons name="chatbubble-outline" size={22} color="#555" />
          <Text style={styles.engagementText}>Comments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.key}
                onPress={() => {
                  setSelectedFilter(c.key);
                  flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                }}
                style={[
                  styles.chip,
                  selectedFilter === c.key ? styles.chipActive : styles.chipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedFilter === c.key ? styles.chipTextActive : {},
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
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 16 }}
        />
      </View>

      <Modal visible={commentsModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setCommentsModalVisible(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {comments.map((c) => (
              <View
                key={c.id}
                style={[
                  styles.commentItem,
                  c.parent_comment_id && { marginLeft: 30 },
                ]}
              >
                <Text style={styles.commentUser}>{c.user_name}</Text>
                <Text style={styles.commentText}>{c.comment}</Text>

                <Pressable onPress={() => setReplyingTo(c.id)} style={styles.replyBtn}>
                  <Text style={styles.replyText}>Reply</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>

          <View style={styles.commentInputRow}>
            <TextInput
              placeholder={replyingTo ? "Replying..." : "Write a comment..."}
              value={commentInput}
              onChangeText={setCommentInput}
              style={styles.commentInput}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendComment}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const VideoCard = ({ url }: { url: string }) => {
  const player = useVideoPlayer(url);
  return <VideoView style={styles.media} player={player} contentFit="contain" nativeControls />;
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9f9f9" },
  card: { backgroundColor: "#fff", paddingBottom: 16, marginBottom: 10 },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginHorizontal: 16,
    marginTop: 16,
  },
  summary: {
    fontSize: 15,
    color: "#555",
    marginHorizontal: 16,
    marginTop: 4,
  },

  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
    backgroundColor: "#000",
  },

  engagementRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  engagementBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  engagementText: { fontSize: 15, color: "#444" },

  filterBar: {
    height: FILTER_BAR_HEIGHT,
    justifyContent: "center",
    marginTop: 50,
  },
  filterScroll: {
    alignItems: "center",
    paddingHorizontal: 8,
    flexGrow: 1,
  },
  chip: {
    borderRadius: 999,
    marginHorizontal: 6,
    paddingHorizontal: 20,
    minHeight: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  chipActive: { backgroundColor: "#222" },
  chipInactive: { backgroundColor: "#fff" },
  chipText: { fontSize: 14, color: "#222", fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: 20, fontWeight: "700" },

  commentItem: {
    padding: 10,
    borderBottomWidth: 0.3,
    borderColor: "#ccc",
  },
  commentUser: { fontWeight: "600", marginBottom: 2 },
  commentText: { fontSize: 14, color: "#333" },

  replyBtn: { marginTop: 4 },
  replyText: { color: "#555", fontSize: 13 },

  commentInputRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 0.5,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#eee",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 999,
    marginLeft: 8,
  },
});
