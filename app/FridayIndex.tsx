import { Ionicons, FontAwesome, Entypo } from "@expo/vector-icons";
import { FontAwesome6, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  TouchableWithoutFeedback,
  Dimensions,
  Linking,
  Text,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/authcontext";
import { db } from "../../context/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import theme from "../theme";
import { useRouter } from "expo-router";
import WalkthroughOverlay from "../../components/walkthroughOverlay";

const { width } = Dimensions.get("window");
const H_PADDING = 16;
const GAP = 12;
const CARD_WIDTH = (width - H_PADDING * 2 - GAP) / 2;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 0.9);

const categories = {
  Company: ".co.ke",
  Organization: ".or.ke",
  Network: ".ne.ke",
  Personal: ".me.ke",
  Mobile: ".mobi.ke",
  Information: ".info.ke",
  Schools: ".sc.ke",
  Universities: ".ac.ke",
  General: ".ke",
};

export default function HomeScreen() {
  const router = useRouter();

  // UPDATED AUTH CONTEXT
  const { firebaseUser, userProfile, signOutUser } = useAuth();

  const [fullName, setFullName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const menuAnim = useRef(new Animated.Value(0)).current;

  // GREETING
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // FETCH NAME FROM userProfile
  useEffect(() => {
    if (userProfile?.fullName) {
      setFullName(userProfile.fullName);
    }
  }, [userProfile]);

  useEffect(() => {
    const timer = setTimeout(() => setShowWalkthrough(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: menuVisible ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, [menuVisible]);

  useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: categoryOpen ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [categoryOpen]);

  const profileTranslate = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, 0],
  });
  const overlayOpacity = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  });

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await signOutUser();
          router.replace("/signin");
        },
      },
    ]);
  };

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n?.[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const openLink = (url: string) => Linking.openURL(url).catch(console.error);

 const actions = [
  {
    title: "Portfolio",
    subtitle: "My Domain Assets",
    route: "/portifolio",
    color: theme.colors.gray600,
    icon: <MaterialCommunityIcons name="transfer" size={18} color={theme.colors.white} />,
  },
  {
    title: "Domain Checker",
    subtitle: "Check Domain Details",
    route: "/domainStatus",
    color: theme.colors.dark,
    icon: <MaterialIcons name="dns" size={18} color={theme.colors.white} />,
  },
  {
    title: "Community",
    subtitle: "Join & Interact",
    route: "/community",
    color: theme.colors.secondary,
    icon: <MaterialIcons name="group" size={18} color={theme.colors.white} />,
  },
  {
    title: "Deleted Domains",
    subtitle: "Previously Owned",
    route: "/delete",
    color: "#e53935",
    icon: <MaterialIcons name="delete-forever" size={18} color={theme.colors.white} />,
  },
];

  const renderProfilePanel = () => (
    <>
      <Animated.View
        pointerEvents={menuVisible ? "auto" : "none"}
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View
        pointerEvents={menuVisible ? "auto" : "none"}
        style={[styles.profilePanel, { transform: [{ translateX: profileTranslate }] }]}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{initials}</Text>
            </View>
            <Text style={styles.profileName}>{fullName || "User"}</Text>

            {/* CHANGED user?.email → firebaseUser?.email */}
            <Text style={styles.profileEmail}>{firebaseUser?.email}</Text>
          </View>

          <View style={styles.profileMenu}>
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                router.push("/updateProfile");
              }}
              style={styles.profileMenuItem}
              activeOpacity={0.8}
            >
              <Ionicons name="person-outline" size={22} color="#444" />
              <Text style={styles.profileMenuText}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                router.push("/settings");
              }}
              style={styles.profileMenuItem}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={22} color="#444" />
              <Text style={styles.profileMenuText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} style={styles.profileMenuItem} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={22} color="#d9534f" />
              <Text style={[styles.profileMenuText, { color: "#d9534f" }]}>Log Out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Follow the Conversation</Text>
            <Text style={styles.contactText}>Kenya Network Information Center (KeNIC)</Text>
            <Text style={styles.contactText}>CAK Centre, Opposite Kianda School, Waiyaki Way</Text>
            <Text style={styles.contactText}>P.O Box 1461 - 00606, Nairobi</Text>
            <Text style={styles.contactText}>📞 +254 702 693 515 / +254 715 275 483</Text>
            <Text
              style={[styles.contactText, { color: theme.colors.primary }]}
              onPress={() => openLink("mailto:customercare@kenic.or.ke")}
            >
              customercare@kenic.or.ke
            </Text>
            <Text
              style={[styles.contactText, { color: theme.colors.primary }]}
              onPress={() => openLink("https://kenic.or.ke")}
            >
              https://kenic.or.ke
            </Text>

            <View style={styles.socialRow}>
              <TouchableOpacity onPress={() => openLink("https://www.facebook.com/Kenictld/")}>
                <FontAwesome name="facebook-square" size={28} color="#1877F2" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openLink("https://www.instagram.com/kenictld/?hl=en")}>
                <FontAwesome name="instagram" size={28} color="#C13584" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openLink("https://x.com/KenicTLD")}>
                <FontAwesome6 name="x-twitter" size={28} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openLink("https://www.linkedin.com/company/kenic-tld/?originalSubdomain=ke")}>
                <Entypo name="linkedin" size={28} color="#0A66C2" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openLink("https://www.youtube.com/channel/UCfpfyvDcBZn5YLP7hj1z2Ug?app=desktop")}>
                <Entypo name="youtube" size={28} color="#FF0000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openLink("https://www.tiktok.com/@kenic.tld")}>
                <FontAwesome6 name="tiktok" size={28} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );

  return (
    <ImageBackground
      source={require("../../assets/images/background1.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.avatarCircle} onPress={() => setMenuVisible(true)}>
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.greetingText}>{greeting}</Text>
              <Text style={styles.nameText}>{fullName || "User"}</Text>
            </View>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons name="notifications-outline" size={26} color={theme.colors.primary} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>2</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Own your online space today</Text>

          {/* Category Dropdown */}
          <View style={{ marginVertical: 10 }}>
            <TouchableOpacity
              style={styles.categorySelector}
              activeOpacity={0.7}
              onPress={() => setCategoryOpen(!categoryOpen)}
            >
              <Text style={styles.categorySelectorText}>
                {selectedCategory ? `Selected: ${selectedCategory}` : "Search your preferred category"}
              </Text>
              <Ionicons
                name={categoryOpen ? "chevron-up-outline" : "chevron-down-outline"}
                size={22}
                color="black"
              />
            </TouchableOpacity>

            <Animated.View
              style={{
                overflow: "hidden",
                height: dropdownAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 300],
                }),
              }}
            >
              <View style={styles.dropdownContent}>
                {Object.entries(categories).map(([key, ext]) => {
                  const selected = selectedCategory === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.categoryPill,
                        selected && { borderColor: theme.colors.primary, backgroundColor: "#f7f7f7" },
                      ]}
                      onPress={() => {
                        setSelectedCategory(key);
                        setCategoryOpen(false);
                      }}
                    >
                      <Text style={[styles.categoryPillText]}>
                        {key} {ext}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </View>

          {/* SEARCH CARDS */}
          <View style={styles.searchCardRow}>
            <TouchableOpacity
              style={[styles.searchCard, !selectedCategory && { opacity: 0.5 }]}
              disabled={!selectedCategory}
              activeOpacity={0.85}
              onPress={() =>
                selectedCategory &&
                router.push({ pathname: "/aiSuggester", params: { category: selectedCategory } })
              }
            >
              <Ionicons name="sparkles-outline" size={28} color={theme.colors.primary} />
              <Text style={styles.searchCardLabel}>AI Assisted Search</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.searchCard, !selectedCategory && { opacity: 0.5 }]}
              disabled={!selectedCategory}
              activeOpacity={0.85}
              onPress={() =>
                selectedCategory &&
                router.push({ pathname: "/manualSearch", params: { category: selectedCategory } })
              }
            >
              <Ionicons name="search-outline" size={28} color={theme.colors.primary} />
              <Text style={styles.searchCardLabel}>Manual Search</Text>
            </TouchableOpacity>
          </View>

          {/* Services Grid */}
          <View style={styles.gridSection}>
            <Text style={styles.sectionHeader}>Services</Text>
            <View style={styles.gridContainer}>
              {actions.map((a) => (
                <TouchableOpacity
                  key={a.title}
                  activeOpacity={0.86}
                  style={[styles.cardItem, { borderLeftColor: a.color }]}
                  onPress={() => router.push(a.route as any)}
                >
                  <View style={[styles.iconWrap, { backgroundColor: a.color }]}>
                    {a.icon}
                  </View>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <Text style={styles.cardSubtitle}>{a.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {renderProfilePanel()}
        {showWalkthrough && <WalkthroughOverlay onClose={() => setShowWalkthrough(false)} />}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollContent: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 60, paddingBottom: 60 },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },

  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "black", fontWeight: "700", fontSize: 16 },

  greetingText: { fontSize: 13, color: theme.colors.secondary },
  nameText: { fontSize: 16, fontWeight: "600", color: theme.colors.black },

  bellButton: { padding: 6 },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "red",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "700" },

  title: {
    fontSize: 17,
    textAlign: "center",
    fontWeight: "600",
    color: theme.colors.black,
    marginVertical: 6,
  },

  searchCardRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    gap: 16,
  },
  searchCard: {
    width: 140,
    height: 85,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  searchCardLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.black,
    textAlign: "center",
  },

  gridSection: { marginTop: 40 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.black,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  cardItem: {
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 12,
    width: "48%",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.dark },
  cardSubtitle: { fontSize: 12, color: theme.colors.gray600, lineHeight: 15 },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  profilePanel: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "78%",
    height: "100%",
    backgroundColor: "#fff",
    elevation: 12,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    padding: 22,
  },
  profileHeader: { alignItems: "center", marginTop: 40 },

  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLargeText: { fontSize: 30, fontWeight: "800", color: "#222" },
  profileName: { fontSize: 20, fontWeight: "700", color: "#222", marginTop: 8 },
  profileEmail: { fontSize: 14, color: "#777", marginTop: 4 },

  profileMenu: { marginTop: 20 },
  profileMenuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  profileMenuText: { fontSize: 16, color: "#333", marginLeft: 10 },

  contactSection: {
    marginTop: 35,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  contactText: { fontSize: 14, color: "#444", marginBottom: 4, textAlign: "center" },
  socialRow: { flexDirection: "row", justifyContent: "space-evenly", marginTop: 14 },

  categorySelector: {
    backgroundColor: "white",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#999",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categorySelectorText: {
    fontSize: 15,
    color: "black",
    fontWeight: "600",
  },
  dropdownContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.4,
    borderColor: "#333",
    backgroundColor: "white",
    margin: 5,
  },
  categoryPillText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
});
