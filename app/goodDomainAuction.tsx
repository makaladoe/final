// domainAuction.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "../context/authcontext";
import { db } from "../context/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { saveBid, getBidsForDomain } from "../services/supabaseService";
import theme from "./theme";
import { addNotification } from "../services/localNotifications";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SANITY_API_URL = Constants.expoConfig?.extra?.SANITY_API_URL ?? "";

interface Bid {
  bidderName: string;
  amount: number;
  placedAt: string;
}

interface DomainAuctionType {
  _id: string;
  domain: string;
  startPrice: number;
  startDate: string;
  endDate: string;
  highestBidAmount?: number;
  highestBidderName?: string;
  bids?: Bid[];
}

interface UserProfile {
  fullName: string;
  phone: string;
  email: string;
}

interface FeedbackModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  success?: boolean;
}

const FeedbackModal = ({ visible, title, message, onClose, success = true }: FeedbackModalProps) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={modalStyles.overlay}>
      <View style={modalStyles.modal}>
        <View style={[modalStyles.circle, { backgroundColor: success ? "green" : "red" }]}>
          <Text style={modalStyles.icon}>{success ? "✔" : "✖"}</Text>
        </View>
        <Text style={modalStyles.title}>{title}</Text>
        <Text style={modalStyles.message}>{message}</Text>
        <TouchableOpacity style={modalStyles.button} onPress={onClose}>
          <Text style={modalStyles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modal: { width: "85%", backgroundColor: "white", borderRadius: 20, padding: 25, alignItems: "center", elevation: 10 },
  circle: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 15 },
  icon: { color: "white", fontSize: 40, fontWeight: "bold" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 10, textAlign: "center", color: theme.colors.dark },
  message: { fontSize: 16, textAlign: "center", marginBottom: 20, color: theme.colors.gray700 },
  button: { backgroundColor: theme.colors.secondary, paddingVertical: 14, paddingHorizontal: 30, borderRadius: 12, elevation: 3 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

export default function DomainAuction() {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<DomainAuctionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAuction, setSelectedAuction] = useState<DomainAuctionType | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allBids, setAllBids] = useState<{ [domain: string]: Bid[] }>({});
  const [textWidths, setTextWidths] = useState<{ [domain: string]: number }>({});

  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(true);

  const scrollAnimRefs = useRef<{ [domain: string]: Animated.Value }>({}).current;
  const animInstances = useRef<{ [domain: string]: Animated.CompositeAnimation | null }>({}).current;
  const previousAuctions = useRef<DomainAuctionType[]>([]);

  /** FETCH USER PROFILE */
  const fetchProfile = async () => {
    if (!user?.uid) return;
    try {
      const docRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProfile({ fullName: data.fullName, phone: data.phone, email: data.email });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  /** FETCH AUCTIONS */
  const query = `*[_type == "domainAuction"]{
    _id,
    domain,
    startPrice,
    startDate,
    endDate,
    highestBidAmount,
    highestBidderName,
    bids[]{bidderName, amount, placedAt}
  }`;

  const fetchAuctions = async () => {
    try {
      const res = await fetch(`${SANITY_API_URL}?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      const auctionsData: DomainAuctionType[] = data.result || [];

      auctionsData.forEach((item) => {
        const exists = previousAuctions.current.some((a) => a._id === item._id);
        if (!exists) {
          addNotification({
            id: Date.now().toString(),
            title: "New Domain Auction",
            message: `${item.domain} is now available for bidding.`,
            timestamp: Date.now(),
            type: "info",
          });
        }
      });

      previousAuctions.current = auctionsData;
      setAuctions(auctionsData);
      setError(null);

      auctionsData.forEach(async (auction) => {
        if (!auction.domain) return;
        if (!scrollAnimRefs[auction.domain]) scrollAnimRefs[auction.domain] = new Animated.Value(SCREEN_WIDTH);

        const { data: bidsData, error: bidsError } = await getBidsForDomain(auction.domain);
        const formattedBids = !bidsError && bidsData
          ? bidsData.map((bid: any) => ({
              bidderName: bid.full_name,
              amount: bid.bid_amount,
              placedAt: bid.placed_at,
            }))
          : [];

        formattedBids.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
        setAllBids((prev) => ({ ...prev, [auction.domain]: formattedBids }));

        if (formattedBids.length > 0) {
          const highest = formattedBids.reduce((acc, b) => (b.amount > acc.amount ? b : acc), formattedBids[0]);
          setAuctions((prev) =>
            prev.map((a) => (a.domain === auction.domain ? { ...a, highestBidAmount: highest.amount, highestBidderName: highest.bidderName } : a))
          );
        }
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load auctions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 30000);
    return () => {
      clearInterval(interval);
      Object.keys(animInstances).forEach((k) => animInstances[k]?.stop());
    };
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAuctions();
  }, []);

  const getStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now < start) return "Upcoming";
    if (now >= start && now <= end) return "In Process";
    return "Expired";
  };

  const getCountdown = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const distance = end - now;
    if (distance <= 0) return "0d 0h 0m 0s";
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  /** HANDLE BID with modal feedback */
  const handleBid = async () => {
    if (!selectedAuction || !profile) return;

    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue) || bidValue < selectedAuction.startPrice) {
      setFeedbackTitle("Invalid Bid");
      setFeedbackMessage(`Bid must be at least Ksh${selectedAuction.startPrice}`);
      setFeedbackSuccess(false);
      setFeedbackModalVisible(true);
      return;
    }

    const prevBids = allBids[selectedAuction.domain] || [];
    const hadPrevious = prevBids.some((b) => b.bidderName === profile.fullName);

    try {
      const { data, error: svcError } = await saveBid({
        user_id: user?.uid!,
        full_name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        domain_name: selectedAuction.domain,
        bid_amount: bidValue,
        start_date: selectedAuction.startDate,
        end_date: selectedAuction.endDate,
      });

      if (svcError) {
        setFeedbackTitle("Error");
        setFeedbackMessage((svcError as any)?.message ?? "Something went wrong while placing your bid.");
        setFeedbackSuccess(false);
        setFeedbackModalVisible(true);
        return;
      }

      const { data: freshBids } = await getBidsForDomain(selectedAuction.domain);
      const formattedBids = freshBids
        ? freshBids.map((bid: any) => ({
            bidderName: bid.full_name,
            amount: bid.bid_amount,
            placedAt: bid.placed_at,
          }))
        : [];
      formattedBids.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
      setAllBids((prev) => ({ ...prev, [selectedAuction.domain]: formattedBids }));

      if (formattedBids.length > 0) {
        const highest = formattedBids.reduce((acc, b) => (b.amount > acc.amount ? b : acc), formattedBids[0]);
        setAuctions((prev) =>
          prev.map((a) =>
            a.domain === selectedAuction.domain
              ? { ...a, highestBidAmount: highest.amount, highestBidderName: highest.bidderName }
              : a
          )
        );
      }

      setFeedbackTitle("Success");
      setFeedbackMessage(hadPrevious
        ? `Your bid has been updated to Ksh${bidValue}`
        : `Your bid of Ksh${bidValue} has been placed!`);
      setFeedbackSuccess(true);
      setFeedbackModalVisible(true);

      addNotification({
        id: Date.now().toString(),
        title: "Bid Placed Successfully",
        message: `You placed Ksh${bidValue} on ${selectedAuction.domain}`,
        timestamp: Date.now(),
        type: "success",
      });

      setModalVisible(false);
      setBidAmount("");
    } catch (err) {
      console.error("handleBid error", err);
      setFeedbackTitle("Error");
      setFeedbackMessage((err as any)?.message ?? "Failed to place bid. Please try again.");
      setFeedbackSuccess(false);
      setFeedbackModalVisible(true);
    }
  };

  /** MARQUEE ANIMATION */
  const startMarquee = (domain: string, expired: boolean) => {
    const textWidth = textWidths[domain];
    if (!scrollAnimRefs[domain] || !textWidth) return;

    try { animInstances[domain]?.stop(); } catch {}
    scrollAnimRefs[domain].setValue(SCREEN_WIDTH + 20);

    const distance = SCREEN_WIDTH + textWidth + 40;
    const duration = expired ? Math.max(15000, distance * 10) : Math.max(8000, distance * 12);

    const anim = Animated.loop(
      Animated.timing(scrollAnimRefs[domain], {
        toValue: -textWidth - 20,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animInstances[domain] = anim;
    anim.start();
  };

  const firstName = (full: string) => (full ? full.split(" ")[0] : "");

  useEffect(() => {
    auctions.forEach((item) => {
      if (!item.domain) return;
      const bidsForThisDomain = allBids[item.domain] || [];
      const last15 = bidsForThisDomain.slice(0, 15);
      let marqueeText = last15.length > 0
        ? last15.map((b) => `${firstName(b.bidderName)} — Ksh${b.amount}`).join("   |   ")
        : "Awaiting bids";
      const status = getStatus(item.startDate, item.endDate);
      if (status === "Expired") marqueeText = item.highestBidAmount ? `Expired — Bid: Ksh${item.highestBidAmount}` : "Expired — No bids placed";
      if (textWidths[item.domain]) setTimeout(() => startMarquee(item.domain, status === "Expired"), 50);
    });
  }, [allBids, auctions, textWidths]);

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );

  if (error)
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );

  if (auctions.length === 0)
    return (
      <View style={styles.centered}>
        <Text style={styles.titleText}>Oops! No domains are currently up for auction.</Text>
        <Text style={styles.subtitleText}>Please await the next round of professional business domains.</Text>
      </View>
    );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.logoContainer}>
        <Image source={require("../assets/images/logo.jpg")} style={styles.logo} />
      </View>

      <Text style={styles.header}>DOMAIN AUCTIONS</Text>
      <Text style={styles.guidingText}>Click an item to place your bid</Text>

      {auctions.map((item) => {
        const status = getStatus(item.startDate, item.endDate);
        const bidsForThisDomain = allBids[item.domain] || [];
        const last15 = bidsForThisDomain.slice(0, 15);

        let marqueeText = last15.length > 0
          ? last15.map((b) => `${firstName(b.bidderName)} — Ksh${b.amount}`).join("   |   ")
          : "Awaiting bids";

        if (status === "Expired") {
          marqueeText = item.highestBidAmount
            ? `Expired — Bid: Ksh${item.highestBidAmount}`
            : "Expired — No bids placed";
        }

        return (
          <View key={item._id}>
            <TouchableOpacity
              style={[styles.card, status !== "In Process" && styles.inactiveCard]}
              onPress={() => {
                if (status === "In Process") {
                  setSelectedAuction(item);
                  setModalVisible(true);
                } else {
                  setFeedbackTitle("Auction Not Active");
                  setFeedbackMessage("You can only bid during the active period.");
                  setFeedbackSuccess(false);
                  setFeedbackModalVisible(true);
                }
              }}
            >
              <Text style={styles.domainText}>{item.domain}</Text>
              <Text>Starting Price: Ksh{item.startPrice}</Text>
              <Text>Start Date: {new Date(item.startDate).toLocaleString()}</Text>
              <Text>End Date: {new Date(item.endDate).toLocaleString()}</Text>

              <Text style={styles.statusText}>
                Status: {status} {status === "In Process" ? `(Ends in: ${getCountdown(item.endDate)})` : ""}
              </Text>

              <Text style={styles.highBidLabel}>
                Highest Bid: {item.highestBidAmount ? `Ksh${item.highestBidAmount}` : "Awaiting bids"}
              </Text>
              <Text style={styles.highBidLabel}>
                Highest Bidder: {item.highestBidderName ?? "Awaiting bids"}
              </Text>
            </TouchableOpacity>

            <View style={styles.marqueeContainer}>
              <Animated.Text
                onLayout={(e) => {
                  const w = e.nativeEvent.layout.width;
                  if (w) setTextWidths((prev) => ({ ...prev, [item.domain]: w }));
                }}
                style={[
                  styles.marqueeText,
                  { transform: [{ translateX: scrollAnimRefs[item.domain] || new Animated.Value(SCREEN_WIDTH) }] },
                ]}
                numberOfLines={1}
              >
                {marqueeText}
              </Animated.Text>
            </View>
          </View>
        );
      })}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalWrap}>
          <Animated.View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Place Bid — {selectedAuction?.domain}</Text>

            {profile && (
              <View style={styles.profileCard}>
                <View style={styles.avatar} />
                <View>
                  <Text style={styles.profileName}>{profile.fullName}</Text>
                  <Text style={styles.profileDetail}>{profile.phone}</Text>
                  <Text style={styles.profileDetail}>{profile.email}</Text>
                </View>
              </View>
            )}

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder={`Min Ksh${selectedAuction?.startPrice}`}
              value={bidAmount}
              onChangeText={setBidAmount}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleBid}>
              <Text style={styles.submitBtnText}>Submit Bid</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <FeedbackModal
        visible={feedbackModalVisible}
        title={feedbackTitle}
        message={feedbackMessage}
        success={feedbackSuccess}
        onClose={() => setFeedbackModalVisible(false)}
      />

      <View style={styles.screenBottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenBottomSpacer: { height: 80 },
  container: { padding: 20, backgroundColor: "#f9f9f9" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  inactiveCard: {
    opacity: 0.6,
    borderLeftWidth: 5,
    borderLeftColor: "red",
  },
  domainText: { fontSize: 22, fontWeight: "bold", marginBottom: 6, color: theme.colors.primary },
  header: { fontSize: 28, textAlign: "center", fontWeight: "bold", marginBottom: 10 },
  guidingText: { textAlign: "center", marginBottom: 20, fontStyle: "italic", color: "#555" },
  statusText: { marginTop: 6, fontWeight: "600", color: theme.colors.primary },
  highBidLabel: { marginTop: 4 },
  errorText: { color: "red", fontSize: 14, textAlign: "center", marginVertical: 6 },
  titleText: { fontSize: 20, fontWeight: "bold", color: "#000", marginBottom: 4, textAlign: "center" },
  subtitleText: { fontSize: 16, color: "#555", marginBottom: 10, textAlign: "center" },
  marqueeContainer: {
    height: 32,
    overflow: "hidden",
    backgroundColor: "#EEE",
    justifyContent: "center",
    marginBottom: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  marqueeText: { fontSize: 16, color: "#333" },
  logoContainer: { alignItems: "center", marginVertical: 20 },
  logo: { width: 80, height: 80, resizeMode: "contain" },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "86%", backgroundColor: "#fff", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: theme.colors.secondary, marginBottom: 15, textAlign: "center" },
  profileCard: { flexDirection: "row", backgroundColor: "#f4f4f4", padding: 12, borderRadius: 12, marginBottom: 20, alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#DDD", marginRight: 12 },
  profileName: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  profileDetail: { color: "#555" },
  input: { borderWidth: 1, borderColor: "#DDD", borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 18 },
  submitBtn: { backgroundColor: theme.colors.secondary, paddingVertical: 14, borderRadius: 12, marginBottom: 10 },
  submitBtnText: { color: "#fff", fontSize: 16, textAlign: "center", fontWeight: "bold" },
  cancelBtn: { paddingVertical: 12, borderRadius: 12, backgroundColor: "#ddd" },
  cancelBtnText: { textAlign: "center", fontSize: 16, color: "#333", fontWeight: "600" },
});
