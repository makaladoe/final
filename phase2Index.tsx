// app/index.tsx
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  TextInput,
} from "react-native-paper";
import { useAuth } from "../../context/authcontext";
import { db } from "../../context/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import theme from "../theme";
import WalkthroughOverlay from "../../components/walkthroughOverlay";

const extra = Constants?.expoConfig?.extra || {};
const WHOIS_API_KEY = extra.WHOIS_API_KEY as string;
const WHOIS_API_URL = extra.WHOIS_API_URL as string;

const domainCategories: { [key: string]: string } = {
  Company: ".co.ke",
  Government: ".go.ke",
  Organization: ".or.ke",
  Network: ".ne.ke",
  Personal: ".me.ke",
  Mobile: ".mobi.ke",
  Information: ".info.ke",
  Schools: ".sc.ke",
  Universities: ".ac.ke",
  General: ".ke",
};

const { width } = Dimensions.get("window");
const scale = width / 375;

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();

  const [category, setCategory] = useState("Company");
  const [domainName, setDomainName] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullDomain, setFullDomain] = useState<string | null>(null);
  const [status, setStatus] = useState<"available" | "taken" | "error" | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  // For smoother category transitions
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current; // 0 collapsed, 1 open

  useEffect(() => {
    const timer = setTimeout(() => setShowWalkthrough(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        if (!user?.uid) return;
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) setFullName(docSnap.data()?.fullName || null);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUserName();
  }, [user]);

  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: menuVisible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [menuVisible, menuAnim]);

  // Smooth animation for category dropdown
  useEffect(() => {
    Animated.timing(floatAnim, {
      toValue: categoriesOpen ? 1 : 0,
      duration: 300, // smoother, slightly slower
      easing: Easing.out(Easing.exp), // soft easing for natural motion
      useNativeDriver: true,
    }).start();
  }, [categoriesOpen, floatAnim]);

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await signOutUser();
          router.replace("/signIn");
        },
      },
    ]);
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n?.[0] ?? "").join("").slice(0, 2).toUpperCase()
    : "U";

  const handleSearch = async () => {
    if (!domainName) return;
    setLoading(true);
    setResult(null);
    setStatus(null);

    const extension = domainCategories[category];
    const fullDomainName = `${domainName}${extension}`;
    setFullDomain(fullDomainName);

    try {
      const response = await fetch(
        `${WHOIS_API_URL}?apiKey=${WHOIS_API_KEY}&domainName=${fullDomainName}&outputFormat=JSON`
      );
      const data = await response.json();

      if (data.DomainInfo?.domainAvailability) {
        if (data.DomainInfo.domainAvailability === "AVAILABLE") {
          setStatus("available");
          setResult(`Great news! ${fullDomainName} is available. Please proceed to register.`);
        } else {
          setStatus("taken");
          setResult(`Oops! ${fullDomainName} is already taken. Try another name or tweak it slightly.`);
        }
      } else {
        setStatus("error");
        setResult("⚠️ Unable to fetch domain availability. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      setResult("⚠️ Network error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const dropdownStyle = {
    opacity: menuAnim,
    transform: [
      {
        translateX: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }),
      },
      {
        scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }),
      },
    ],
  };

  const floatTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0], // softer entrance
  });
  const floatOpacity = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // 🔹 Smooth category selection and closing animation
  const chooseCategory = (cat: string) => {
    setCategory(cat);
    Animated.timing(floatAnim, {
      toValue: 0,
      duration: 350,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => setCategoriesOpen(false));
  };

  const renderStatusIcon = () => {
    if (!status) return null;
    let iconName: any;
    let bgColor: string;

    if (status === "available") {
      iconName = "checkmark";
      bgColor = "#1B7B50";
    } else if (status === "taken") {
      iconName = "close";
      bgColor = "#B00020";
    } else {
      iconName = "alert";
      bgColor = "#A67C00";
    }

    return (
      <View style={[styles.statusCircle, { backgroundColor: bgColor }]}>
        <Ionicons name={iconName} size={22} color="#fff" />
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.logoSection}>
            <Image source={require("../../assets/images/logo2.png")} style={styles.logo} resizeMode="contain" />
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoTextPrimary}>Proudly</Text>
              <Text style={styles.logoTextSecondary}>Kenyan</Text>
            </View>
          </View>

          <View style={styles.avatarWrap}>
            <TouchableOpacity
              style={styles.avatarCircle}
              activeOpacity={0.85}
              onPress={() => setMenuVisible((v) => !v)}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
            <Text style={styles.greetingText}>{greeting}</Text>
          </View>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Own your space online. Find your .KE domain today.</Text>

        {/* Category Select */}
        <View style={styles.selectRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setCategoriesOpen((s) => !s)}
            style={styles.selectButton}
          >
            <Text style={styles.selectLabel}>Select your category</Text>
            <View style={styles.selectRight}>
              <Text style={styles.selectedText}>{category}</Text>
              <Ionicons
                name={categoriesOpen ? (Platform.OS === "ios" ? "chevron-up" : "caret-up") : (Platform.OS === "ios" ? "chevron-down" : "caret-down")}
                size={18}
                color={theme.colors.dark}
                style={{ marginLeft: 8 }}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Floating categories */}
        {categoriesOpen && (
          <TouchableWithoutFeedback onPress={() => setCategoriesOpen(false)}>
            <View style={styles.floatingOverlay}>
              <Animated.View
                style={[
                  styles.floatingCard,
                  { opacity: floatOpacity, transform: [{ translateY: floatTranslateY }] },
                ]}
              >
                <View style={styles.floatingInner}>
                  {Object.keys(domainCategories).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.floatingCategoryBox, category === cat && styles.categorySelected]}
                      onPress={() => chooseCategory(cat)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.floatingCategoryText, category === cat && styles.categoryTextSelected]}>
                        {cat}
                      </Text>
                      <Text style={styles.floatingExtText}>{domainCategories[cat]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        )}

        {/* Search Section */}
        <View style={styles.searchBar}>
          <TextInput
            mode="outlined"
            placeholder="Enter domain name"
            value={domainName}
            onChangeText={setDomainName}
            style={styles.input}
            right={<TextInput.Affix text={domainCategories[category]} />}
            theme={{ roundness: 10 }}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading || !domainName}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color={theme.colors.white} /> : <Ionicons name="search" size={22} color="white" />}
          </TouchableOpacity>
        </View>

        <Text style={styles.helperText}>Avoid “www” or spaces</Text>

        {domainName.length > 0 && (
          <Text style={styles.preview}>
            Preview:{" "}
            <Text style={styles.previewDomain}>
              {domainName}
              {domainCategories[category]}
            </Text>
          </Text>
        )}

        {/* Result Card */}
        {result && (
          <View style={{ marginTop: 30 }}>
            <Card
              style={[
                styles.resultCard,
                status === "available"
                  ? styles.successBackground
                  : status === "taken"
                  ? styles.errorBackground
                  : styles.warningBackground,
              ]}
            >
              {renderStatusIcon()}
              <Text
                style={[
                  styles.resultText,
                  status === "available"
                    ? styles.successText
                    : status === "taken"
                    ? styles.errorText
                    : styles.warningText,
                ]}
              >
                {result}
              </Text>

              {status === "available" && fullDomain && (
                <Button
                  mode="contained"
                  style={styles.registerButton}
                  buttonColor={theme.colors.secondary}
                  textColor={theme.colors.white}
                  onPress={() => router.push({ pathname: "/register", params: { domain: fullDomain } })}
                >
                  Proceed to Register
                </Button>
              )}
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Logout dropdown */}
      {menuVisible && (
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}
      <View pointerEvents="box-none" style={styles.dropdownContainer}>
        <Animated.View pointerEvents={menuVisible ? "auto" : "none"} style={[styles.dropdownCard, dropdownStyle]}>
          <TouchableOpacity
            onPress={() => {
              setMenuVisible(false);
              handleLogout();
            }}
            activeOpacity={0.7}
            style={styles.dropdownInner}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {showWalkthrough && <WalkthroughOverlay onClose={() => setShowWalkthrough(false)} />}
    </View>
  );
}

// === Styles (unchanged) ===
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light,
    paddingHorizontal: 18,
    paddingTop: 50,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  logoSection: { flexDirection: "row", alignItems: "center" },
  logo: { width: 68 * scale, height: 68 * scale, marginRight: 8 },
  logoTextContainer: { flexDirection: "column", justifyContent: "center" },
  logoTextPrimary: { fontWeight: "800", fontSize: 16 * scale, color: theme.colors.primary },
  logoTextSecondary: { fontWeight: "700", fontSize: 16 * scale, color: theme.colors.secondary },
  avatarWrap: { alignItems: "flex-end", width: 80 },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "white", fontWeight: "700", fontSize: 17 },
  greetingText: { marginTop: 6, fontSize: 13, color: theme.colors.secondary, textAlign: "right" },
  subtitle: {
    fontSize: 14,
    color: theme.colors.black,
    textAlign: "center",
    marginBottom: 16,
  },
  selectRow: {
    alignItems: "center",
    marginBottom: 8,
  },
  selectButton: {
    width: "100%",
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.black,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  selectLabel: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  selectRight: { flexDirection: "row", alignItems: "center" },
  selectedText: { color: theme.colors.dark, fontSize: 14, fontWeight: "700" },
  floatingOverlay: { position: "relative", width: "100%", alignItems: "center", marginTop: 10, marginBottom: 6 },
  floatingCard: {
    width: "94%",
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    padding: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  floatingInner: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" },
  floatingCategoryBox: {
    borderWidth: 1,
    borderColor: theme.colors.black,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    margin: 6,
    backgroundColor: theme.colors.white,
    minWidth: 86,
    alignItems: "center",
  },
  floatingCategoryText: { fontSize: 12, color: theme.colors.primary, fontWeight: "700" },
  floatingExtText: { fontSize: 11, color: theme.colors.secondary, marginTop: 2 },
  categorySelected: { backgroundColor: theme.colors.black },
  categoryTextSelected: { color: theme.colors.white },
  searchBar: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  input: { flex: 1, backgroundColor: theme.colors.white },
  searchButton: { backgroundColor: theme.colors.primary, padding: 14, borderRadius: 10, marginLeft: 8 },
  helperText: { fontSize: 12, color: theme.colors.secondary, marginBottom: 6, marginLeft: 4 },
  preview: { fontSize: 13, marginLeft: 4, color: theme.colors.dark, marginBottom: 12 },
  previewDomain: { color: theme.colors.primary, fontWeight: "700" },
  resultCard: { marginTop: 12, padding: 18, borderRadius: 12, alignItems: "center" },
  statusCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    alignSelf: "center",
  },
  successBackground: { backgroundColor: "#E9F8F0" },
  errorBackground: { backgroundColor: "#FDECEA" },
  warningBackground: { backgroundColor: "#FFF6E5" },
  resultText: { fontSize: 15, fontWeight: "600", textAlign: "center", marginBottom: 8 },
  successText: { color: "#1B7B50" },
  errorText: { color: "#B00020" },
  warningText: { color: "#A67C00" },
  registerButton: { borderRadius: 10, marginTop: 10 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  dropdownContainer: { position: "absolute", top: 68, right: 40, width: 160 },
  dropdownCard: { backgroundColor: theme.colors.white, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, elevation: 6 },
  dropdownInner: { paddingVertical: 6, paddingHorizontal: 6 },
  logoutText: { color: theme.colors.error, fontWeight: "600", fontSize: 14 },
});
