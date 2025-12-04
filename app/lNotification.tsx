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
  Alert,
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

  const scrollAnimRefs = useRef<{ [domain: string]: Animated.Value }>({}).current;

  /** FETCH USER PROFILE */
  const fetchProfile = async () => {
    if (!user?.uid) return;
    try {
      const docRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProfile({
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
        });
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
      setAuctions(auctionsData);
      setError(null);

      auctionsData.forEach(async (auction) => {
        const { data: bidsData, error } = await getBidsForDomain(auction.domain);

        const formattedBids = !error && bidsData
          ? bidsData.map((bid: any) => ({
              bidderName: bid.full_name,
              amount: bid.bid_amount,
              placedAt: bid.placed_at,
            }))
          : [];

        setAllBids((prev) => ({ ...prev, [auction.domain]: formattedBids }));

        if (!scrollAnimRefs[auction.domain]) {
          scrollAnimRefs[auction.domain] = new Animated.Value(SCREEN_WIDTH);
        }
      });
    } catch (err) {
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
    return () => clearInterval(interval);
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAuctions();
  }, []);

  /** AUCTION STATUS */
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

  /** HANDLE BID */
  const handleBid = async () => {
    if (!selectedAuction || !profile) return;

    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue) || bidValue < selectedAuction.startPrice) {
      Alert.alert("Invalid Bid", `Bid must be at least Ksh${selectedAuction.startPrice}`);
      return;
    }

    const { error } = await saveBid({
      user_id: user?.uid!,
      full_name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      domain_name: selectedAuction.domain,
      bid_amount: bidValue,
      start_date: selectedAuction.startDate,
      end_date: selectedAuction.endDate,
    });

    if (error) {
      Alert.alert("Error", "Failed to place bid. Please try again.");
      return;
    }

    Alert.alert("Success", `Your bid of Ksh${bidValue} has been placed!`);

    const { data: bidsData } = await getBidsForDomain(selectedAuction.domain);
    const formattedBids = bidsData
      ? bidsData.map((bid: any) => ({
          bidderName: bid.full_name,
          amount: bid.bid_amount,
          placedAt: bid.placed_at,
        }))
      : [];

    setAllBids((prev) => ({ ...prev, [selectedAuction.domain]: formattedBids }));

    setModalVisible(false);
    setBidAmount("");
  };

  /** MARQUEE ANIMATION */
  const startMarquee = (domain: string) => {
    if (!scrollAnimRefs[domain] || !textWidths[domain]) return;

    scrollAnimRefs[domain].setValue(SCREEN_WIDTH);
    const distance = SCREEN_WIDTH + textWidths[domain];

    Animated.loop(
      Animated.timing(scrollAnimRefs[domain], {
        toValue: -textWidths[domain],
        duration: distance * 12,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  useEffect(() => {
    Object.keys(allBids).forEach((domain) => {
      if (textWidths[domain]) startMarquee(domain);
    });
  }, [allBids, textWidths]);

  /** MAIN UI */
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
        <Text style={styles.subtitleText}>
          Please await the next round of professional business domains.
        </Text>
      </View>
    );

  return (
    <ScrollView
      style={styles.container}
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

        return (
          <View key={item._id}>
            <TouchableOpacity
              style={[
                styles.card,
                status !== "In Process" && styles.inactiveCard,
              ]}
              onPress={() => {
                if (status === "In Process") {
                  setSelectedAuction(item);
                  setModalVisible(true);
                } else {
                  Alert.alert("Auction Not Active", "You can only bid during the active period.");
                }
              }}
            >
              <Text style={styles.domainText}>{item.domain}</Text>
              <Text>Starting Price: Ksh{item.startPrice}</Text>
              <Text>Start Date: {new Date(item.startDate).toLocaleString()}</Text>
              <Text>End Date: {new Date(item.endDate).toLocaleString()}</Text>

              <Text style={styles.statusText}>
                Status: {status}{" "}
                {status === "In Process" ? `(Ends in: ${getCountdown(item.endDate)})` : ""}
              </Text>

              <Text style={styles.highBidLabel}>
                Highest Bid: {item.highestBidAmount ? `Ksh${item.highestBidAmount}` : "Awaiting bids"}
              </Text>
              <Text style={styles.highBidLabel}>
                Highest Bidder: {item.highestBidderName ?? "Awaiting bids"}
              </Text>
            </TouchableOpacity>

            {/* MARQUEE */}
            <View style={styles.marqueeContainer}>
              <View
                onLayout={(e) => {
                  const width = e?.nativeEvent?.layout?.width;
                  if (width) {
                    setTextWidths((prev) => ({ ...prev, [item.domain]: width }));
                  }
                }}
              >
                <Animated.Text
                  style={[
                    styles.marqueeText,
                    {
                      transform: [
                        { translateX: scrollAnimRefs[item.domain] || new Animated.Value(SCREEN_WIDTH) },
                      ],
                    },
                  ]}
                  numberOfLines={1}
                >
                  {bidsForThisDomain.length > 0
                    ? bidsForThisDomain.map((b) => `${b.bidderName}: Ksh${b.amount}   `).join(" | ")
                    : "Awaiting bids"}
                </Animated.Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* MODERN MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalWrap}>
          <Animated.View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Place Bid — {selectedAuction?.domain}
            </Text>

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

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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

  domainText: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
    color: theme.colors.primary,
  },

  header: {
    fontSize: 28,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 10,
  },

  guidingText: {
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
    color: "#555",
  },

  statusText: { marginTop: 6, fontWeight: "600", color: theme.colors.primary },
  highBidLabel: { marginTop: 4 },

  /** NEWLY ADDED REQUIRED STYLES */
  errorText: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 6,
  },

  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
    textAlign: "center",
  },

  subtitleText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
    textAlign: "center",
  },
  /** END NEW STYLES */

  marqueeContainer: {
    height: 32,
    overflow: "hidden",
    backgroundColor: "#EEE",
    justifyContent: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  marqueeText: { fontSize: 16, color: "#333" },

  logoContainer: { alignItems: "center", marginVertical: 20 },
  logo: { width: 80, height: 80, resizeMode: "contain" },

  /** MODAL */
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "86%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.secondary,
    marginBottom: 15,
    textAlign: "center",
  },

  /** PROFILE CARD */
  profileCard: {
    flexDirection: "row",
    backgroundColor: "#f4f4f4",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DDD",
    marginRight: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  profileDetail: { color: "#555" },

  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 18,
  },

  submitBtn: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },

  cancelBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#ddd",
  },
  cancelBtnText: {
    textAlign: "center",
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
});
