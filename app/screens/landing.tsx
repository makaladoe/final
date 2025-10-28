import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/authcontext";
import { db } from "../../context/firebaseConfig";
import theme from "../Theme/theme";

export default function Landing() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");

  //  Time-based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  //  Fetch user's name
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        if (!user?.uid) return;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setFullName(userDoc.data()?.fullName || null);
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserName();
  }, [user]);

  //  Handle logout
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
            router.replace("/screens/signin");
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo */}
      <Image
        source={require("../../assets/images/kenic1.png")}
        style={styles.logo}
      />

      {/* Welcome banner */}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={{ marginBottom: theme.spacing(2) }}
        />
      ) : (
        <Text style={styles.welcomeText}>
          {greeting}
          {fullName ? `, ${fullName.split(" ")[0]}` : ""}.
        </Text>
      )}

      <Text style={styles.header}>Services</Text>

      {/* Register Domain */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/screens/domainsearch")}
      >
        <MaterialCommunityIcons
          name="web"
          size={30}
          color={theme.colors.primary}
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Register a Domain</Text>
          <Text style={styles.cardText}>
            Instantly search and register your preferred .KE domain name.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Manage Domains */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/screens/manageDomains")}
      >
        <MaterialCommunityIcons
          name="shield-check-outline"
          size={30}
          color={theme.colors.success}
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Manage Domains</Text>
          <Text style={styles.cardText}>
            Review domain status, expiry, and registrar details easily.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Registrar Services */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/screens/manageRegistrar")}
      >
        <MaterialCommunityIcons
          name="office-building-outline"
          size={30}
          color={theme.colors.gray700}
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Registrar Services</Text>
          <Text style={styles.cardText}>
            Explore, apply for, and manage registrar partnerships effortlessly.
          </Text>
        </View>
      </TouchableOpacity>

      {/* AI Domain Suggester */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/screens/aiDomainSuggester")}
      >
        <MaterialCommunityIcons
          name="robot-happy-outline"
          size={30}
          color={theme.colors.secondary}
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>AI Domain Suggester</Text>
          <Text style={styles.cardText}>
            Get professional, catchy, and brandable domain name ideas powered by AI.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <MaterialCommunityIcons
          name="logout"
          size={22}
          color={theme.colors.white}
        />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing(3),
    backgroundColor: theme.colors.light,
    flexGrow: 1,
    justifyContent: "center",
  },
  logo: {
    width: 70,
    height: 70,
    alignSelf: "center",
    marginBottom: theme.spacing(1),
    borderRadius: theme.radius.full,
  },
  welcomeText: {
    textAlign: "center",
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
    marginBottom: theme.spacing(2),
  },
  header: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.dark,
    textAlign: "center",
    marginBottom: theme.spacing(3),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    padding: theme.spacing(2.5),
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing(2.5),
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    ...theme.shadow.light,
  },
  cardContent: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: theme.spacing(0.5),
    color: theme.colors.dark,
  },
  cardText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray700,
  },
  logout: {
    marginTop: theme.spacing(4),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(4),
    backgroundColor: theme.colors.error,
    borderRadius: theme.radius.full,
    ...theme.shadow.medium,
  },
  logoutText: {
    marginLeft: theme.spacing(1),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.md,
  },
});
