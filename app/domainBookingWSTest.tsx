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
import {
  saveDomainBooking,
  checkExistingBooking,   // ⬅️ NEW: import Supabase check
} from "../services/supabaseService";

// -------------------------------
// ENV
// -------------------------------
const extra =
  (Constants as any)?.expoConfig?.extra ??
  (Constants as any)?.manifest?.extra ??
  {};

const WHOIS_API_KEY = extra.WHOIS_API_KEY;
const WHOIS_API_URL = extra.WHOIS_API_URL;
const STK_API_URL = extra.STK_API_URL;
const WS_URL = extra.WS_URL;

// -------------------------------
// HELPERS
// -------------------------------
const normalizeLabel = (s = "") => {
  let label = s.toLowerCase().trim();
  label = label.replace(/[^a-z0-9-]/g, "");
  return label;
};

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
    const res = await withTimeout(fetch(url, options), 15000);
    return await res.json();
  } catch {
    return null;
  }
};

const TLDS = [".co.ke", ".or.ke", ".me.ke", ".ne.ke" ,".ke"];
const RATE_PER_WEEK = 100;

// -------------------------------
// TYPES
// -------------------------------
type AvailabilityResult = {
  available: boolean | null;
  domain: string;
};

// -------------------------------
// MAIN
// -------------------------------
export default function BookDomainScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [input, setInput] = useState("");
  const [selectedTld, setSelectedTld] = useState(TLDS[0]);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [fullDomain, setFullDomain] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const fullDomainRef = useRef<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);
  const heartbeatRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const pendingCheckoutRef = useRef<string | null>(null);

  // -------------------------------
  // FETCH PROFILE
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
  // NEW 🔥: CHECK IF DOMAIN ALREADY BOOKED & ACTIVE
  // -------------------------------
  const checkIfDomainBooked = async (domain: string) => {
    try {
      const { data, error } = await checkExistingBooking(domain);
      if (error) return false;
      if (!data) return false;
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      return expiresAt > now;
    } catch {
      return false;
    }
  };

  // -------------------------------
  // CHECK AVAILABILITY
  // -------------------------------
  const checkAvailability = async (label: string): Promise<AvailabilityResult> => {
    const domain = `${label}${selectedTld}`;
    if (!WHOIS_API_KEY || !WHOIS_API_URL) return { available: null, domain };

    try {
      const url = `${WHOIS_API_URL}?apiKey=${encodeURIComponent(
        WHOIS_API_KEY
      )}&domainName=${encodeURIComponent(domain)}&outputFormat=JSON`;

      const res = await safeFetchJson(url);

      const available =
        res?.domainAvailability === "AVAILABLE" ||
        res?.available === true ||
        res?.DomainInfo?.domainAvailability === "AVAILABLE";

      return { available: !!available, domain };
    } catch {
      return { available: null, domain };
    }
  };

  // -------------------------------
  // UPDATED SEARCH (with anti-rebooking)
  // -------------------------------
  const handleSearch = async () => {
    if (!normalizedLabel) {
      Alert.alert("Invalid", "Enter a valid domain label.");
      return;
    }

    setChecking(true);
    setAvailability(null);
    setFullDomain(null);
    fullDomainRef.current = null;

    try {
      const result = await checkAvailability(normalizedLabel);
      setAvailability(result.available);
      setFullDomain(result.domain);
      fullDomainRef.current = result.domain;

      if (result.available === true) {
        const isBooked = await checkIfDomainBooked(result.domain);
        if (isBooked) {
          setAvailability(false);
          Alert.alert(
            "Already Booked",
            "This domain is currently booked by another user and still active."
          );
          return;
        }
      }
    } finally {
      setChecking(false);
    }
  };

  // -------------------------------
  // WEBSOCKET
  // -------------------------------
  const initWebSocket = (delay = 0) => {
    if (!WS_URL) return;

    wsRef.current?.close();
    wsRef.current = null;

    setTimeout(() => {
      if (!mountedRef.current) return;

      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WS opened");
          reconnectRef.current = 0;

          if (heartbeatRef.current) clearInterval(heartbeatRef.current);
          heartbeatRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "ping" }));
            }
          }, 25000);

          // Send pending checkout if exists
          if (pendingCheckoutRef.current) {
            console.log("Sending pending checkoutId after WS open:", pendingCheckoutRef.current);
            ws.send(JSON.stringify({ checkoutId: pendingCheckoutRef.current }));
          }
        };

        ws.onmessage = (event) => {
          try {
            handleWsMessage(JSON.parse(event.data));
          } catch (err) {
            console.warn("WS parse error:", err);
          }
        };

        ws.onclose = () => {
          if (heartbeatRef.current) clearInterval(heartbeatRef.current);
          if (mountedRef.current) {
            reconnectRef.current++;
            const backoff = Math.min(30000, 500 * 2 ** reconnectRef.current);
            initWebSocket(backoff);
          }
        };
      } catch (err) {
        console.error("WS init error", err);
      }
    }, delay);
  };

  useEffect(() => {
    mountedRef.current = true;
    if (WS_URL) initWebSocket();

    return () => {
      mountedRef.current = false;
      heartbeatRef.current && clearInterval(heartbeatRef.current);
      wsRef.current?.close();
    };
  }, []);

  const sendCheckoutId = (id: string) => {
    pendingCheckoutRef.current = id;

    const sendMessage = () => {
      const ws = wsRef.current;
      if (!ws) return setTimeout(sendMessage, 200);

      if (ws.readyState === WebSocket.OPEN) {
        console.log("Sending checkoutId via WS:", id);
        ws.send(JSON.stringify({ checkoutId: id }));
      } else if (ws.readyState === WebSocket.CONNECTING) {
        setTimeout(sendMessage, 200);
      } else {
        wsRef.current?.close();
        setTimeout(() => initWebSocket(), 500);
        setTimeout(sendMessage, 1000);
      }
    };

    sendMessage();
  };

  const handleWsMessage = async (data: any) => {
    if (!data) return;

    const checkoutId =
      data.CheckoutRequestID ??
      data.checkoutId ??
      data?.data?.CheckoutRequestID ??
      null;

    const resultCode =
      data.ResultCode ??
      data?.resultCode ??
      null;

    if (pendingCheckoutRef.current && checkoutId === pendingCheckoutRef.current) {
      if (resultCode === 0) {
        const receipt =
          data?.CallbackMetadata?.Item?.find?.((i: any) => i.Name === "MpesaReceiptNumber")?.Value ??
          data?.MpesaReceiptNumber ??
          data?.ReceiptNumber ??
          data?.receipt ??
          data?.transactionId ??
          "Unknown";

        pendingCheckoutRef.current = null;
        setLoading(false);

        const domainToBook = fullDomainRef.current;
        if (!domainToBook) {
          Alert.alert("Error", "Domain name was lost. Please try again.");
          return;
        }

        try {
          let fn = fullName;
          let ph = phone;
          let em = email;

          if ((!fn || !ph || !em) && user?.uid) {
            const ref = doc(db, "users", user.uid);
            const snap = await getDoc(ref);
            if (snap.exists()) {
              const d = snap.data();
              fn = fn || d.fullName || "";
              ph = ph || d.phone || "";
              em = em || d.email || "";
            }
          }

          if (!fn || !ph || !em) {
            Alert.alert("Incomplete", "Update your profile before booking.");
            return;
          }

          if (!user) {
            Alert.alert("Error", "You must be logged in.");
            return;
          }

          await saveDomainBooking({
            user_id: user.uid,
            full_name: fn,
            phone: ph,
            email: em,
            domain_name: domainToBook,
          });

          Alert.alert(
            "Booking Confirmed",
            `You have booked:\n${domainToBook}\n\nTransaction ID:\n${receipt}`,
            [{ text: "OK", onPress: () => router.push("/bookedDomains") }]
          );
        } catch (err) {
          console.error("Save error:", err);
        }

        return;
      }

      if (resultCode !== null && resultCode !== 0) {
        pendingCheckoutRef.current = null;
        setLoading(false);
        Alert.alert("Payment Failed", data.ResultDesc ?? "Payment not completed");
      }
    }
  };

  // -------------------------------
  // PAY WITH MPESA
  // -------------------------------
  const handlePay = async () => {
    if (!user) return Alert.alert("Login Required");
    if (!fullDomain) return Alert.alert("Search Required", "Search domain first.");

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return Alert.alert("Invalid Phone");

    const totalAmount = RATE_PER_WEEK;

    Alert.alert(
      "Confirm Payment",
      `Pay KES ${totalAmount} for ${fullDomain}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed",
          onPress: async () => {
            setLoading(true);

            try {
              const res = await safeFetchJson(STK_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  phoneNumber: normalizedPhone,
                  amount: totalAmount,
                  accountReference: `DOMAIN_${Date.now()}`,
                  transactionDesc: "Domain Booking",
                }),
              });

              const checkoutId = res?.CheckoutRequestID;
              if (!checkoutId) {
                setLoading(false);
                Alert.alert("Error", "Failed to initiate payment.");
                return;
              }

              pendingCheckoutRef.current = checkoutId;
              sendCheckoutId(checkoutId);

              Alert.alert("M-PESA", "Enter PIN on your phone.");

              setTimeout(() => {
                if (pendingCheckoutRef.current === checkoutId) {
                  pendingCheckoutRef.current = null;
                  setLoading(false);
                  Alert.alert("Still Pending", "Check your M-PESA messages.");
                }
              }, 120000);
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Payment initiation failed.");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <Text style={styles.screenTitle}>Book Your .KE Domain</Text>
        <TouchableOpacity onPress={() => router.push("/bookedDomains")} style={styles.iconBtn}>
          <MaterialIcons name="domain" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.lead}>Enter the domain label, then select the extension.</Text>

      <View style={styles.hero}>
        <Text style={styles.label}>Domain Label</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="e.g. jamii"
          value={input}
          maxLength={25}
          onChangeText={(text) => {
            if (text.length <= 25) setInput(text);
          }}
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

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSearch} disabled={checking}>
          {checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Check Availability</Text>
          )}
        </TouchableOpacity>
      </View>

      {fullDomain && (
        <View style={styles.card}>
          <Text style={styles.resultDomain}>{fullDomain}</Text>
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
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payBtnText}>Pay KES {RATE_PER_WEEK} with M-PESA</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// -------------------------------
// STYLES
// -------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  topRow: {
    marginTop: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: { padding: 6, borderRadius: 50 },
  screenTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: theme.colors.dark,
    width: "80%",
  },
  lead: {
    fontSize: 15,
    color: theme.colors.gray700,
    marginTop: 10,
    marginBottom: 10,
  },
  hero: { marginTop: 10 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    color: theme.colors.gray700,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  tldPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  tldOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderRadius: 10,
    marginRight: 8,
    marginTop: 6,
  },
  tldActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tldText: {
    fontWeight: "600",
    color: theme.colors.dark,
  },
  tldTextActive: {
    color: "#fff",
  },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: theme.colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    marginTop: 20,
    elevation: 3,
  },
  resultDomain: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.dark,
  },
  available: {
    color: "green",
    marginTop: 8,
    fontWeight: "700",
    fontSize: 16,
  },
  unavailable: {
    color: "red",
    marginTop: 8,
    fontWeight: "700",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 15,
    color: theme.colors.dark,
  },
  readonlyField: {
    marginBottom: 14,
  },
  readonlyLabel: {
    fontSize: 12,
    color: theme.colors.gray600,
  },
  readonlyValue: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.dark,
    marginTop: 2,
  },
  payBtn: {
    marginTop: 16,
    backgroundColor: theme.colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  payBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
