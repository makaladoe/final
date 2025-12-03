// BookDomainScreen.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Pressable,
} from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import theme from "./theme";
import { useAuth } from "../context/authcontext";
import { db } from "../context/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import { saveDomainBooking } from "../services/supabaseService";

// -------------------------------
// ENV LOADING
// -------------------------------
const extra =
  (Constants as any)?.expoConfig?.extra ??
  (Constants as any)?.manifest?.extra ??
  {};

const WHOIS_API_KEY = extra.WHOIS_API_KEY;
const WHOIS_API_URL = extra.WHOIS_API_URL;
const STK_API_URL = extra.STK_API_URL;
const WS_URL = extra.WS_URL; // WebSocket endpoint, e.g., wss://your-ngrok-url

// -------------------------------
// HELPERS
// -------------------------------
const normalizePhone = (input: string) => {
  let phone = input.replace(/\D/g, "");
  if (phone.startsWith("2547") && phone.length === 12) return phone;
  if (phone.startsWith("07") && phone.length === 10) return "254" + phone.slice(1);
  if (phone.startsWith("7") && phone.length === 9) return "254" + phone;
  if (phone.startsWith("254") && phone.length === 12) return phone;
  return phone;
};

const withTimeout = (p: Promise<Response>, ms = 10000): Promise<Response> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });

const safeFetchJson = async <T = any>(url: string, options?: any): Promise<T | null> => {
  try {
    const res: Response = await withTimeout(fetch(url, options), 15000);
    return await res.json();
  } catch {
    return null;
  }
};

const normalizeLabel = (s = "") =>
  s
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim()
    .replace(/\.ke$/i, "")
    .replace(/[^a-z0-9-]/g, "");

const TLDS = [".co.ke", ".or.ke", ".me.ke", ".ne.ke"];
const RATE_PER_WEEK = 100;

// -------------------------------
// MAIN COMPONENT
// -------------------------------
export default function BookDomainScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [input, setInput] = useState("");
  const [selectedTld, setSelectedTld] = useState(TLDS[0]);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<null | boolean>(null);
  const [lastLabel, setLastLabel] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // -------------------------------
  // FETCH USER PROFILE
  // -------------------------------
  useEffect(() => {
    if (!user?.uid) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          setFullName(data.fullName ?? "");
          setPhone(data.phone ?? "");
          setEmail(data.email ?? "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [user]);

  const normalizedLabel = useMemo(() => normalizeLabel(input), [input]);

  // -------------------------------
  // CHECK AVAILABILITY
  // -------------------------------
  const checkAvailability = async (label: string) => {
    if (!WHOIS_API_KEY || !WHOIS_API_URL) return null;

    const domain = `${label}${selectedTld}`;
    try {
      const url = `${WHOIS_API_URL}?apiKey=${encodeURIComponent(
        WHOIS_API_KEY
      )}&domainName=${encodeURIComponent(domain)}&outputFormat=JSON`;

      const res = await safeFetchJson(url);

      const available =
        res?.domainAvailability === "AVAILABLE" ||
        res?.available === true ||
        res?.DomainInfo?.domainAvailability === "AVAILABLE";

      return !!available;
    } catch {
      return null;
    }
  };

  const handleSearch = async () => {
    const label = normalizedLabel;
    if (!label) return Alert.alert("Invalid", "Enter a valid domain name.");

    setChecking(true);
    setAvailability(null);
    setLastLabel(null);

    try {
      const avail = await checkAvailability(label);
      setAvailability(avail);
      setLastLabel(label);
    } finally {
      setChecking(false);
    }
  };

  // -------------------------------
  // HANDLE PAYMENT WITH WEBSOCKET
  // -------------------------------
  const handlePay = async () => {
    if (!user) return Alert.alert("User not logged in");

    const normalizedPhone = normalizePhone(phone);
    const domain_name = `${lastLabel}${selectedTld}`;
    const totalAmount = RATE_PER_WEEK;
    const accountReference = `DOMAIN_${Date.now()}`;

    Alert.alert("Confirm Payment", `Pay KES ${totalAmount} for ${domain_name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Proceed",
        onPress: async () => {
          setLoading(true);

          try {
            // 1️⃣ Initiate STK Push
            const response = await safeFetchJson<{ CheckoutRequestID?: string }>(STK_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phoneNumber: normalizedPhone,
                amount: totalAmount,
                accountReference,
                transactionDesc: "Domain Booking",
              }),
            });

            const checkoutId = response?.CheckoutRequestID;

            if (!checkoutId) {
              Alert.alert("Error", "Failed to initiate payment.");
              setLoading(false);
              return;
            }

            Alert.alert("M-PESA", "Enter PIN on your phone to complete payment…");

            // 2️⃣ Connect to WebSocket to listen for payment update
            wsRef.current = new WebSocket(WS_URL);

            wsRef.current.onopen = () => {
              // Subscribe to this checkoutId
              wsRef.current?.send(JSON.stringify({ checkoutId }));
            };

            wsRef.current.onmessage = async (event) => {
              const data = JSON.parse(event.data);
              if (data.ResultCode === 0) {
                // Payment successful
                await saveDomainBooking({
                  user_id: user.uid,
                  full_name: fullName,
                  phone,
                  email,
                  domain_name,
                });

                Alert.alert("Payment Received", "Domain booked successfully!");
                router.push("/bookedDomains");
                setLoading(false);
                wsRef.current?.close();
              } else if (data.ResultCode !== null && data.ResultCode !== 0) {
                Alert.alert("Payment Failed", data.ResultDesc || "Payment not completed");
                setLoading(false);
                wsRef.current?.close();
              }
            };

            wsRef.current.onerror = (err) => {
              console.error("WebSocket error:", err);
            };

            wsRef.current.onclose = () => {
              wsRef.current = null;
            };
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Something went wrong.");
            setLoading(false);
          }
        },
      },
    ]);
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <Text style={styles.screenTitle}>Book Your .KE Domain Instantly</Text>
        <TouchableOpacity
          onPress={() => router.push("/bookedDomains")}
          style={styles.iconBtn}
        >
          <MaterialIcons name="domain" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.lead}>Secure your perfect .KE domain in seconds.</Text>

      <View style={styles.hero}>
        <Text style={styles.label}>Domain Name</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="e.g. mybrand"
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Choose Extension</Text>
        <View style={styles.tldPicker}>
          {TLDS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setSelectedTld(t)}
              style={[styles.tldOption, selectedTld === t && styles.tldActive]}
            >
              <Text style={[styles.tldText, selectedTld === t && styles.tldTextActive]}>
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSearch}
          disabled={checking}
        >
          {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Check Availability</Text>}
        </TouchableOpacity>
      </View>

      {lastLabel && (
        <View style={styles.card}>
          <Text style={styles.resultDomain}>{lastLabel}{selectedTld}</Text>
          {availability === true && <Text style={styles.available}>✔ Available</Text>}
          {availability === false && <Text style={styles.unavailable}>✖ Unavailable</Text>}
        </View>
      )}

      {availability === true && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Details</Text>
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyLabel}>Name</Text>
            <Text style={styles.readonlyValue}>{fullName}</Text>
          </View>
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyLabel}>Phone</Text>
            <Text style={styles.readonlyValue}>{phone}</Text>
          </View>
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyLabel}>Email</Text>
            <Text style={styles.readonlyValue}>{email}</Text>
          </View>

          <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Pay KES {RATE_PER_WEEK} with M-PESA</Text>}
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// -------------------------------
// STYLES
// -------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  topRow: { marginTop: 55, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { padding: 6, borderRadius: 50 },
  screenTitle: { fontSize: 25, fontWeight: "800", color: theme.colors.dark, width: "80%" },
  lead: { fontSize: 15, color: theme.colors.gray700, marginTop: 10, marginBottom: 10 },
  hero: { marginTop: 10 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, color: theme.colors.gray700 },
  searchInput: { borderWidth: 1, borderColor: theme.colors.gray300, borderRadius: 12, padding: 14, backgroundColor: "#fff", fontSize: 15 },
  tldPicker: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  tldOption: { paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.gray300, borderRadius: 10, marginRight: 8, marginTop: 6 },
  tldActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tldText: { fontWeight: "600", color: theme.colors.dark },
  tldTextActive: { color: "#fff" },
  primaryBtn: { marginTop: 18, backgroundColor: theme.colors.secondary, paddingVertical: 16, borderRadius: 12, alignItems: "center", elevation: 2 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  card: { backgroundColor: "#fff", padding: 18, borderRadius: 14, marginTop: 20, elevation: 3 },
  resultDomain: { fontSize: 22, fontWeight: "800", color: theme.colors.dark },
  available: { color: "green", marginTop: 8, fontWeight: "700", fontSize: 16 },
  unavailable: { color: "red", marginTop: 8, fontWeight: "700", fontSize: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 15, color: theme.colors.dark },
  readonlyField: { marginBottom: 14 },
  readonlyLabel: { fontSize: 12, color: theme.colors.gray600 },
  readonlyValue: { fontSize: 15, fontWeight: "600", color: theme.colors.dark, marginTop: 2 },
  payBtn: { marginTop: 16, backgroundColor: theme.colors.secondary, paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
