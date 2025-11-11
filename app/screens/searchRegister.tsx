import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import registrarsData from "./data/registrars.json";
import theme from "./theme";

interface Registrar {
  id: number;
  name: string;
  phone: string;
  email: string;
  website: string;
  domains: string[];
  logo?: string;
  prices: { [key: string]: string | undefined };
}

const defaultLogo = "https://via.placeholder.com/64/EEEEEE/999999?text=Logo";

const domainOptions = [
  { label: "All", value: "all" },
  { label: ".co.ke", value: ".co.ke" },
  { label: ".go.ke", value: ".go.ke" },
  { label: ".or.ke", value: ".or.ke" },
  { label: ".ne.ke", value: ".ne.ke" },
  { label: ".me.ke", value: ".me.ke" },
  { label: ".mobi.ke", value: ".mobi.ke" },
  { label: ".info.ke", value: ".info.ke" },
  { label: ".sc.ke", value: ".sc.ke" },
  { label: ".ac.ke", value: ".ac.ke" },
  { label: ".ke", value: ".ke" },
];

export default function SearchRegistrarScreen() {
  const router = useRouter();
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedRegistrar, setSelectedRegistrar] = useState<Registrar | null>(
    null
  );

  /** 🔹 Filtered Registrar List */
  const filteredRegistrars = useMemo(() => {
    let data: Registrar[] = [...(registrarsData as Registrar[])];
    if (searchText) {
      data = data.filter((reg) =>
        reg.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (selectedDomain !== "all") {
      data = data.filter((reg) => reg.domains?.includes(selectedDomain));
    }
    return data;
  }, [searchText, selectedDomain]);

  /** 🔹 Domain Counts */
  const domainCounts = useMemo(() => {
    const allData = registrarsData as Registrar[];
    const counts: Record<string, number> = {};
    domainOptions.forEach((opt) => {
      if (opt.value === "all") {
        counts[opt.value] = allData.length;
      } else {
        counts[opt.value] = allData.filter((r) =>
          r.domains?.includes(opt.value)
        ).length;
      }
    });
    return counts;
  }, []);

  const handleOpenRegistrar = (reg: Registrar) => {
    setSelectedRegistrar(reg);
    setConfirmVisible(true);
  };

  const proceedToWebView = () => {
    if (!selectedRegistrar?.website) return;
    const url = selectedRegistrar.website.startsWith("http")
      ? selectedRegistrar.website
      : "https://" + selectedRegistrar.website;
    setConfirmVisible(false);
    router.push({
      pathname: "/webview",
      params: { url, name: selectedRegistrar.name },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* 🔹 Logo & Header */}
        <View style={styles.logoSection}>
          <Image
            source={require("../assets/images/logo2.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.accreditedText}>Accredited</Text>
            <Text style={styles.registrarText}>Registrars</Text>
          </View>
        </View>

        {/* 🔹 Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={22}
            color={theme.colors.secondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search registrar..."
            placeholderTextColor={theme.colors.gray500}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* 🔹 Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {domainOptions.map((d, index) => {
            const isSelected = selectedDomain === d.value;
            const count = domainCounts[d.value] ?? 0;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedDomain(d.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {d.label}
                </Text>
                {/* 🔹 Count Bubble */}
                {count > 0 && (
                  <View
                    style={[
                      styles.countBubble,
                      isSelected && styles.countBubbleSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countText,
                        isSelected && styles.countTextSelected,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 🔹 Registrar Cards */}
        <View style={styles.cardListContainer}>
          {filteredRegistrars.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No registrar matches your search.
              </Text>
            </View>
          ) : (
            filteredRegistrars.map((reg, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                style={styles.card}
                onPress={() => handleOpenRegistrar(reg)}
              >
                <Image
                  source={{ uri: reg.logo || defaultLogo }}
                  style={styles.registrarLogo}
                  resizeMode="cover"
                />
                <View style={styles.textContainer}>
                  <Text style={styles.name}>{reg.name}</Text>
                  <Text style={styles.website}>
                    {reg.website.replace(/^https?:\/\//, "")}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* 🔹 Image Modal */}
      <Modal visible={!!selectedLogo} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={() => setSelectedLogo(null)}
          >
            <Image
              source={{ uri: selectedLogo || defaultLogo }}
              style={styles.expandedLogo}
            />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 🔹 Confirmation Modal */}
      <Modal visible={confirmVisible} transparent animationType="slide">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Proceed to Registrar</Text>
            <Text style={styles.confirmMessage}>
              By clicking proceed, you’ll open{" "}
              <Text style={{ fontWeight: "600" }}>
                {selectedRegistrar?.name}
              </Text>{" "}
              in your app browser.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: "#eee" }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: "#4CAF50" }]}
                onPress={proceedToWebView}
              >
                <Text style={styles.proceedText}>Proceed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* --------------------------- 🎨 Styles --------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light,
    paddingHorizontal: 16,
    paddingTop: 45,
  },

  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  logo: { width: 75, height: 75, marginRight: 10 },
  accreditedText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
    letterSpacing: 0.3,
  },
  registrarText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.secondary,
    letterSpacing: 0.3,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.dark,
  },

  filterBar: { flexDirection: "row", marginBottom: 12 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterChipSelected: { backgroundColor: "#D1FAE5", borderColor: "#10B981" },
  filterChipText: { color: theme.colors.dark, fontWeight: "500", fontSize: 15 },
  filterChipTextSelected: { color: "#065F46", fontWeight: "700" },

  countBubble: {
    backgroundColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 6,
    marginLeft: 6,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  countBubbleSelected: { backgroundColor: "#10B981" },
  countText: { fontSize: 13, fontWeight: "600", color: "#444" },
  countTextSelected: { color: "#fff" },

  cardListContainer: { marginTop: 15 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: theme.colors.white,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  registrarLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
  },
  textContainer: { flex: 1 },
  name: {
    fontWeight: "700",
    fontSize: 17,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  website: { fontSize: 14, color: theme.colors.secondary },

  emptyState: { marginTop: 40, alignItems: "center" },
  emptyText: { fontSize: 16, color: theme.colors.secondary },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center" },
  expandedLogo: { width: 220, height: 220, borderRadius: 110 },

  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 10,
  },
  confirmMessage: { fontSize: 15, color: "#333", marginBottom: 20 },
  confirmButtons: { flexDirection: "row", justifyContent: "space-between" },
  confirmButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  cancelText: { color: "#555", fontWeight: "600" },
  proceedText: { color: "#fff", fontWeight: "700" },
});
