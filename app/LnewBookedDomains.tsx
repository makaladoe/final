// bookedDomains.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useAuth } from "../context/authcontext";
import theme from "./theme";

import { getUserDomainBookings } from "../services/supabaseService";

interface Booking {
  id: string;
  domain_name: string;
  booked_at: string;
  expires_at: string;
}

export default function BookedDomainsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // -------------------------------
  // FETCH USER BOOKINGS USING SERVICE
  // -------------------------------
  const loadBookings = async () => {
    if (!user?.uid) return;

    try {
      const { data, error } = await getUserDomainBookings(user.uid);

      if (!error && data) {
        setBookings(data as Booking[]);
      } else {
        console.log("Error loading bookings:", error);
      }
    } catch (e) {
      console.log("Unexpected error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  // -------------------------------
  // EXPIRY STATUS CALCULATION
  // -------------------------------
  const getExpiryStatus = (expires_at: string) => {
    const now = new Date();
    const expiry = new Date(expires_at);

    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: "Expired", color: "red" };
    if (days === 0) return { text: "Expires Today", color: "#ff9800" };
    return { text: `Expires in ${days} days`, color: theme.colors.primary };
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* HERO SECTION */}
      <View style={styles.hero}>
        <Text style={styles.title}>Your Booked Domains</Text>
        <Text style={styles.lead}>All your secured domains in one place.</Text>
      </View>

      {loading && (
        <View style={{ marginTop: 50 }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {!loading && bookings.length === 0 && (
        <Text style={styles.empty}>You have no booked domains yet.</Text>
      )}

      {/* LIST OF DOMAINS */}
      {!loading &&
        bookings.map((booking) => {
          const status = getExpiryStatus(booking.expires_at);

          return (
            <View key={booking.id} style={styles.card}>
              <Text style={styles.domain}>{booking.domain_name}</Text>

              <Text style={styles.meta}>
                Booked on: {new Date(booking.booked_at).toDateString()}
              </Text>

              <Text style={[styles.status, { color: status.color }]}>
                {status.text}
              </Text>
            </View>
          );
        })}
    </ScrollView>
  );
}

// -------------------------------
// STYLES
// -------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light,
    paddingHorizontal: 20,
  },

  hero: {
    marginTop: 70, // ⭐ pushed lower for premium feel
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.dark,
  },

  lead: {
    fontSize: 14,
    color: theme.colors.gray700,
    marginTop: 6,
  },

  empty: {
    marginTop: 50,
    fontSize: 16,
    color: theme.colors.gray700,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    elevation: 3,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#ececec",
  },

  domain: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.dark,
  },

  meta: {
    marginTop: 8,
    color: theme.colors.gray600,
    fontSize: 13,
  },

  status: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "700",
  },
});

