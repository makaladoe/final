// app/Advertise.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
import { useAuth } from "../context/authcontext";
import { db } from "../context/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { saveAdvertisement, getUserAdvertisements } from "../services/supabaseService";
import { MaterialIcons } from "@expo/vector-icons";
import theme from "./theme";

const { width } = Dimensions.get("window");
const TAB_WIDTH = width / 3 - 20;
const SLOT_WIDTH = width / 4 - 15;

interface UserProfile {
  fullName: string;
  phone: string;
  email: string;
}

interface BackendError {
  code?: string;
  message?: string;
}

export default function Advertise() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedPackage, setSelectedPackage] = useState("Quarterly");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [bookedSlots, setBookedSlots] = useState<number[]>([]); // Track booked slots

  const packages = [
    { name: "Quarterly", price: "Kes 15,000" },
    { name: "Half Yearly", price: "Kes 27,000" },
    { name: "Annual", price: "Kes 50,000" },
  ];

  const advertiserSlots = [
    "#FF6B6B",
    "#6BCB77",
    "#4D96FF",
    "#FFD93D",
    "#FF6F91",
    "#845EC2",
    "#00C9A7",
    "#FF9671",
  ];

  /** Fetch Profile */
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

  /** Fetch Requests */
  const loadUserRequests = async () => {
    if (!user?.uid) return;
    const { data, error } = await getUserAdvertisements(user.uid);
    if (!error && data) {
      setUserRequests(data);
      const booked = data.map((req) => req.slot_number - 1); // slot_number is 1-based
      setBookedSlots(booked);
    }
  };

  useEffect(() => {
    fetchProfile();
    loadUserRequests();
  }, [user]);

  const handleSlotSelect = (index: number) => {
    if (bookedSlots.includes(index)) return;
    setSelectedSlot(index);
  };

  const handleBookSlot = () => {
    if (!profile) return Alert.alert("Error", "User profile not loaded.");
    if (selectedSlot === null) return Alert.alert("Select Slot", "Please select a slot.");
    setModalVisible(true);
  };

  const confirmBooking = async () => {
    if (!profile || selectedSlot === null) return;

    const { data, error } = await saveAdvertisement({
      user_id: user!.uid,
      full_name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      package_type: selectedPackage,
      slot_number: selectedSlot + 1,
    });

    const typedError = error as BackendError | null;

    if (typedError) {
      if (typedError.code === "SLOT_TAKEN") {
        Alert.alert("Slot Taken", "This slot has already been booked. Please select another one.");
        loadUserRequests(); // Refresh booked slots
        return;
      }
      return Alert.alert("Error", typedError.message || "Booking failed. Try again.");
    }

    Alert.alert("Success", "Your request has been received.");
    setModalVisible(false);
    setSelectedSlot(null);
    loadUserRequests();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Advertise with .KE</Text>

        <TouchableOpacity onPress={() => setRequestsModalVisible(true)}>
          <MaterialIcons name="list-alt" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Package Tabs */}
      <View style={styles.tabsContainer}>
        {packages.map((pkg) => (
          <TouchableOpacity
            key={pkg.name}
            style={[styles.tab, selectedPackage === pkg.name && styles.tabSelected]}
            onPress={() => setSelectedPackage(pkg.name)}
          >
            <Text style={[styles.tabText, selectedPackage === pkg.name && styles.tabTextSelected]}>
              {pkg.name} Package
            </Text>
            <Text style={[styles.tabPrice, selectedPackage === pkg.name && styles.tabTextSelected]}>
              {pkg.price}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes */}
      <View style={styles.notesContainer}>
        <Text style={styles.note}>1. Taxes Apply.</Text>
        <Text style={styles.note}>2. Registrars must have a .ke.website.</Text>
        <Text style={styles.note}>3. Limited slots available.</Text>
      </View>

      {/* Advertiser Slots */}
      <Text style={styles.subtitle}>Available Advertisement Slots</Text>
      <View style={styles.slotsContainer}>
        {advertiserSlots.map((color, index) => {
          const isBooked = bookedSlots.includes(index);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.slot,
                { backgroundColor: color, opacity: isBooked ? 0.4 : 1 },
                selectedSlot === index && styles.slotSelected,
              ]}
              onPress={() => handleSlotSelect(index)}
              disabled={isBooked}
            >
              <Text style={styles.slotText}>
                Advertiser {index + 1} {isBooked ? "(Booked)" : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Book Button */}
      <TouchableOpacity style={styles.ctaButton} onPress={handleBookSlot}>
        <Text style={styles.ctaText}>Book Slot</Text>
      </TouchableOpacity>

      {/* Confirmation Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Your Booking</Text>

            {profile && (
              <View style={styles.detailsBox}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{profile.fullName}</Text>

                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{profile.phone}</Text>

                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{profile.email}</Text>
              </View>
            )}

            <Text style={styles.detailLabel}>Package</Text>
            <Text style={styles.detailValue}>{selectedPackage}</Text>

            <Text style={styles.detailLabel}>Slot Number</Text>
            <Text style={styles.detailValue}>{selectedSlot! + 1}</Text>

            <View style={styles.buttonColumn}>
              <TouchableOpacity style={styles.bigPrimaryBtn} onPress={confirmBooking}>
                <Text style={styles.bigPrimaryText}>Confirm Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bigCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.bigCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Requests Modal */}
      <Modal visible={requestsModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>My Advertisement Requests</Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {userRequests.length === 0 ? (
                <Text style={{ textAlign: "center", color: "#666" }}>
                  No advertisement requests yet.
                </Text>
              ) : (
                userRequests.map((req, index) => (
                  <View key={index} style={styles.requestItem}>
                    <Text>Package: {req.package_type}</Text>
                    <Text>Slot: {req.slot_number}</Text>
                    <Text>Status: {req.status}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.bigPrimaryBtn}
              onPress={() => setRequestsModalVisible(false)}
            >
              <Text style={styles.bigPrimaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", paddingHorizontal: 15, paddingTop: 44 },
  headerContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#222" },

  tabsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  tab: { width: TAB_WIDTH, backgroundColor: "#FFF", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, alignItems: "center", elevation: 2 },
  tabSelected: { backgroundColor: theme.colors.blue },
  tabText: { fontSize: 14, fontWeight: "600", color: "#333", textAlign: "center" },
  tabTextSelected: { color: "#FFF" },
  tabPrice: { fontSize: 14, fontWeight: "700", marginTop: 4, color: "#333" },

  notesContainer: { marginBottom: 20, paddingHorizontal: 5 },
  note: { fontSize: 12, color: "#555", marginBottom: 3 },

  subtitle: { fontSize: 18, fontWeight: "700", color: "#222", marginBottom: 12 },
  slotsContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 25 },

  slot: { width: SLOT_WIDTH, height: SLOT_WIDTH, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 15 },
  slotSelected: { borderWidth: 3, borderColor: "#222" },
  slotText: { color: "#FFF", fontWeight: "700", textAlign: "center" },

  ctaButton: { backgroundColor: "#E63946", paddingVertical: 16, borderRadius: 14, alignItems: "center", marginBottom: 20 },
  ctaText: { color: "#FFF", fontWeight: "800", fontSize: 17 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "85%", backgroundColor: "#FFF", padding: 22, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 15, color: theme.colors.secondary },
  detailsBox: { marginBottom: 15, backgroundColor: "#F3F4F6", padding: 10, borderRadius: 10 },
  detailLabel: { color: "#555", fontSize: 14, marginTop: 6 },
  detailValue: { fontSize: 16, fontWeight: "600", marginBottom: 4 },

  buttonColumn: { marginTop: 20 },
  bigPrimaryBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: "center", marginBottom: 12 },
  bigPrimaryText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  bigCancelBtn: { backgroundColor: "#E5E7EB", paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  bigCancelText: { color: "#333", fontSize: 18, fontWeight: "700" },

  requestItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#ccc" },
});
