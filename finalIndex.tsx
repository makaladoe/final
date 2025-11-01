import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  TouchableWithoutFeedback,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  TextInput,
} from "react-native-paper";
import { useAuth } from "../../context/authcontext"; // adjust path if needed
import { db } from "../../context/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import theme from "../theme";

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

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();

  const [category, setCategory] = useState("Company");
  const [domainName, setDomainName] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullDomain, setFullDomain] = useState<string | null>(null);
  const [status, setStatus] = useState<"available" | "taken" | "error" | null>(
    null
  );

  // user / greeting state
  const [fullName, setFullName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");

  // menu visibility + animation
  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible

  const scaleAnim = useRef(new Animated.Value(0)).current; // for success circle

  // Time-based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Fetch user name from Firestore
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        if (!user?.uid) return;
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          setFullName(docSnap.data()?.fullName || null);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUserName();
  }, [user]);

  // Animate menu in/out when visibility changes
  useEffect(() => {
    if (menuVisible) {
      Animated.parallel([
        Animated.timing(menuAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [menuVisible, menuAnim]);

  // logout handler
  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await signOutUser();
            // navigate to your sign in screen (adjust path if your app uses a different route)
            router.replace("/signIn");
          },
        },
      ],
      { cancelable: true }
    );
  };

  // initials
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n?.[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  // Domain search status animation
  useEffect(() => {
    if (status === "available") {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [status, scaleAnim]);

  // Domain search (unchanged)
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
          setResult(
            `Great news! ${fullDomainName} is available. Please proceed to register.`
          );
        } else {
          setStatus("taken");
          setResult(
            `Oops! ${fullDomainName} is already taken. Try another name or tweak it slightly.`
          );
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

  // animated styles for dropdown
  const dropdownStyle = {
    opacity: menuAnim,
    transform: [
      {
        translateX: menuAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0], // slide left slightly into place (appears to the right of avatar)
        }),
      },
      {
        scale: menuAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.97, 1],
        }),
      },
    ],
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.logoSection}>
            <Image
              source={require("../../assets/images/logo2.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Proudly Kenyan</Text>
          </View>

          {/* Avatar + greeting container */}
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

        {/* subtitle */}
        <Text style={styles.subtitle}>
          Find the perfect .KE Domain name Instantly.
        </Text>

        {/* categories */}
        <View style={styles.categoryContainer}>
          {Object.keys(domainCategories).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryBox,
                category === cat && styles.categorySelected,
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === cat && styles.categoryTextSelected,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* search */}
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
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Ionicons name="search" size={22} color="white" />
            )}
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

        {status === "available" && (
          <Animated.View
            style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}
          >
            <Ionicons name="checkmark" size={36} color="white" />
          </Animated.View>
        )}

        {result && (
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
                onPress={() =>
                  router.push({
                    pathname: "/register",
                    params: { domain: fullDomain },
                  })
                }
              >
                Proceed to Register
              </Button>
            )}
          </Card>
        )}
      </ScrollView>

      {/* -------- Overlay + Dropdown (rendered outside ScrollView so overlay covers entire screen) -------- */}
      {menuVisible && (
        // full-screen overlay to capture outside taps and close menu
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Dropdown card positioned top-right */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light,
    paddingHorizontal: 18,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    zIndex: 1,
  },
  logoSection: {
    alignItems: "flex-start",
  },
  logo: {
    width: 56,
    height: 56,
  },
  logoText: {
    marginTop: 1,
    width: 56,
    textAlign: "center",
    fontWeight: "700",
    color: theme.colors.primary,
    fontSize: 12,
  },

  // avatar area
  avatarWrap: {
    alignItems: "center",
    width: 80,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatarText: {
    color: "white",
    fontWeight: "700",
    fontSize: 17,
  },
  greetingText: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.secondary,
    textAlign: "center",
  },

  // dropdown overlay covers whole screen to detect outside taps
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // transparent but intercepts touches
    backgroundColor: "rgba(0,0,0,0.0)",
  },

  // container to position dropdown in top-right area
  dropdownContainer: {
    position: "absolute",
    top: 68, // aligns near your header
    right: 40,
    width: 160,
    height: 120,
    alignItems: "flex-start",
    pointerEvents: "box-none",
  },

  dropdownCard: {
    backgroundColor: theme.colors.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  dropdownInner: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },

  logoutText: {
    color: theme.colors.error,
    fontWeight: "600",
    fontSize: 14,
  },

  subtitle: {
    fontSize: 14,
    color: theme.colors.secondary,
    textAlign: "center",
    marginBottom: 25,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 25,
  },
  categoryBox: {
    borderWidth: 1,
    borderColor: theme.colors.black,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    margin: 6,
    backgroundColor: theme.colors.white,
  },
  categorySelected: {
    backgroundColor: theme.colors.secondary,
  },
  categoryText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  categoryTextSelected: {
    color: theme.colors.white,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: 10,
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginLeft: 4,
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    marginLeft: 4,
    color: theme.colors.dark,
    marginBottom: 18,
  },
  previewDomain: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  resultCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  successBackground: { backgroundColor: "#E9F8F0" },
  errorBackground: { backgroundColor: "#FDECEA" },
  warningBackground: { backgroundColor: "#FFF6E5" },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  successText: { color: "#1B7B50" },
  errorText: { color: "#B00020" },
  warningText: { color: "#A67C00" },
  successCircle: {
    alignSelf: "center",
    backgroundColor: theme.colors.primary,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
    elevation: 5,
  },
  registerButton: {
    borderRadius: 10,
    marginTop: 10,
  },
});
