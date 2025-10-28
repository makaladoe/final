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
import registrarsData from "../data/registrars.json";
import theme from "../Theme/theme";

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

  const filteredRegistrars = useMemo(() => {
    let data: Registrar[] = [...(registrarsData as Registrar[])];

    if (searchText) {
      data = data.filter((reg) =>
        reg.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedDomain !== "all") {
      data = data.filter(
        (reg) => reg.domains && reg.domains.includes(selectedDomain)
      );
    }

    return data;
  }, [searchText, selectedDomain]);

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
      {/* Header */}
      <Text style={styles.header}>.KE Accredited Registrars</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search registrar..."
          placeholderTextColor={theme.colors.secondary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Domain Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {domainOptions.map((d, index) => {
          const isSelected = selectedDomain === d.value;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.filterChip,
                isSelected && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedDomain(d.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextSelected,
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Registrar Cards */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {filteredRegistrars.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No registrar offers this domain.
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
                style={styles.logo}
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
      </ScrollView>

      {/* Logo Modal */}
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

      {/* ✅ Confirmation Modal */}
      <Modal visible={confirmVisible} transparent animationType="slide">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Proceed to Registrar</Text>
            <Text style={styles.confirmMessage}>
              By clicking proceed, you agree to open{" "}
              <Text style={{ fontWeight: "600" }}>
                {selectedRegistrar?.name}
              </Text>{" "}
              in the app browser.
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

// Styles
// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light,
    paddingHorizontal: 16,
    paddingTop: 45,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: 18,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: "500",
    color: theme.colors.dark,
    marginLeft: 10,
  },
  filterBar: {
    flexDirection: "row",
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingVertical: 0, //  Equal top & bottom space for better balance
    paddingHorizontal: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipSelected: {
    backgroundColor: "#dfffe0",
    borderColor: "#b8f2bf",
  },
  filterChipText: {
    color: theme.colors.dark,
    fontWeight: "300",
    fontSize: 25,
    textAlign: "center", //  ensures text stays centered
  },
  filterChipTextSelected: {
    color: "#111",
    fontWeight: "700",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: theme.colors.white,
    borderRadius: 18,
    paddingVertical: 16, //  slightly increased card height
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontWeight: "700",
    fontSize: 17,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  website: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  emptyState: {
    marginTop: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  expandedLogo: {
    width: 220,
    height: 220,
    borderRadius: 110,
  },

  /**  Confirmation Modal **/
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
  confirmMessage: {
    fontSize: 15,
    color: "#333",
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  cancelText: {
    color: "#555",
    fontWeight: "600",
  },
  proceedText: {
    color: "#fff",
    fontWeight: "700",
  },
});
