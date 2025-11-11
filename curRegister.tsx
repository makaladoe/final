// app/register.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Modal,
  Image,
} from "react-native";
import { Text, Card } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import registrarsData from "./data/registrars.json";
import theme from "./theme";

interface Registrar {
  id: number;
  name: string;
  phone: string;
  email: string;
  website: string;
  domains: string[];
  prices: { [key: string]: string | undefined };
  logo?: string;
}

export default function RegisterPage() {
  const { domain } = useLocalSearchParams<{ domain?: string }>();
  const router = useRouter();
  const [filteredRegistrars, setFilteredRegistrars] = useState<Registrar[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(15);
  const [selectedRegistrar, setSelectedRegistrar] = useState<Registrar | null>(null);
  const [showModal, setShowModal] = useState(false);

  const searchInputRef = useRef<TextInput>(null);

  const { width } = useWindowDimensions();
  const numColumns = width < 600 ? 1 : width < 900 ? 2 : width < 1200 ? 3 : 4;

  const domainExtension = useMemo(() => {
    if (!domain) return undefined;
    const dotIndex = domain.indexOf(".");
    return dotIndex >= 0 ? domain.substring(dotIndex) : undefined;
  }, [domain]);

  useEffect(() => {
    if (domainExtension) {
      const matches: Registrar[] = (registrarsData as Registrar[]).filter((r) =>
        r.domains.includes(domainExtension)
      );
      setFilteredRegistrars(matches);
    } else {
      setFilteredRegistrars(registrarsData as Registrar[]);
    }
  }, [domainExtension]);

  const parsePrice = (r: Registrar) => {
    const raw = r.prices[domainExtension || ""];
    const n = raw ? parseInt(raw.replace(/\D/g, ""), 10) : NaN;
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  };

  const sortedRegistrars = useMemo(() => {
    const base = filteredRegistrars.filter((r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return base.sort((a, b) => {
      const aP = parsePrice(a);
      const bP = parsePrice(b);
      return sortOrder === "asc" ? aP - bP : bP - aP;
    });
  }, [filteredRegistrars, searchQuery, sortOrder, domainExtension]);

  const limitedRegistrars = sortedRegistrars.slice(0, displayLimit);

  const handleRegistrarPress = (registrar: Registrar) => {
    setSelectedRegistrar(registrar);
    setShowModal(true);
  };

  const handleProceed = () => {
    if (selectedRegistrar) {
      router.push({
        pathname: "/webview",
        params: {
          url: selectedRegistrar.website,
          domainName: domain || "",
        },
      });
      setShowModal(false);
      setSelectedRegistrar(null);
    }
  };

  const DEFAULT_LOGO = "https://via.placeholder.com/64/EEEEEE/999999?text=Logo";

  const renderRegistrar = ({ item }: { item: Registrar }) => (
    <TouchableOpacity
      style={styles.cardWrapper}
      onPress={() => handleRegistrarPress(item)}
      activeOpacity={0.88}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Image
            source={{ uri: item.logo || DEFAULT_LOGO }}
            style={styles.logo}
            resizeMode="cover"
          />
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>
              {item.prices[domainExtension || ""] || "Price not listed"}
            </Text>
            <Text style={styles.website} numberOfLines={1}>
              {item.website}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderHeader = useMemo(() => (
    <View style={styles.stickyHeader}>
      {/* ---- Header logo + text ---- */}
      <View style={styles.logoSection}>
        <Image
          source={require("../assets/images/logo2.png")}
          style={styles.logoTop}
          resizeMode="contain"
        />
        <View style={styles.textBlock}>
          <Text style={styles.headerTitlePrimary}>Domain</Text>
          <Text style={styles.headerTitleSecondary}>Registration</Text>
        </View>
      </View>

      {/* ---- Subtitle ---- */}
      {domain ? (
        <Text style={styles.headerSubtitle}>
          <Text style={{ fontWeight: "600" }}>{filteredRegistrars.length}</Text>{" "}
          registrars offering registration for{" "}
          <Text style={{ fontWeight: "700", color: theme.colors.primary }}>
            {domain}
          </Text>
        </Text>
      ) : (
        <Text style={styles.headerSubtitle}>
          Pick a domain to see accredited registrars.
        </Text>
      )}

      {filteredRegistrars.length > 0 && (
        <Text style={styles.helperTextBold}>
          Tap any of our Licensed .KE Domain Registrars and their respective
          packages.
        </Text>
      )}
      {filteredRegistrars.length === 0 && domain && (
        <Text style={styles.helperTextWarning}>
          No accredited registrars found for this domain extension.
        </Text>
      )}

      {/* ---- Search + Filter Controls ---- */}
      <View style={styles.controlsRow}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchBar}
          placeholder="Search registrar name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.gray500}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.sortControls}>
          <TouchableOpacity
            style={[styles.chip, sortOrder === "asc" && styles.activeChip]}
            onPress={() => setSortOrder("asc")}
          >
            <MaterialCommunityIcons
              name="arrow-up"
              size={16}
              color={
                sortOrder === "asc" ? theme.colors.white : theme.colors.primary
              }
            />
            <Text
              style={[
                styles.chipText,
                sortOrder === "asc" && styles.activeChipText,
              ]}
            >
              Low
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, sortOrder === "desc" && styles.activeChip]}
            onPress={() => setSortOrder("desc")}
          >
            <MaterialCommunityIcons
              name="arrow-down"
              size={16}
              color={
                sortOrder === "desc" ? theme.colors.white : theme.colors.primary
              }
            />
            <Text
              style={[
                styles.chipText,
                sortOrder === "desc" && styles.activeChipText,
              ]}
            >
              High
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [filteredRegistrars, searchQuery, sortOrder, domain]);

  const renderFooter = () =>
    displayLimit < sortedRegistrars.length ? (
      <TouchableOpacity
        style={styles.loadMoreBtn}
        onPress={() => setDisplayLimit(displayLimit + 15)}
      >
        <Text style={styles.loadMoreText}>Load more registrars</Text>
      </TouchableOpacity>
    ) : null;

  return (
    <View style={styles.container}>
      <FlatList
        data={limitedRegistrars}
        renderItem={renderRegistrar}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[0]}
      />

      {/* ---- Modal ---- */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Proceed to Registrar</Text>
            <Text style={styles.modalInfo}>
              You’re about to proceed to{" "}
              <Text style={{ fontWeight: "600" }}>
                {selectedRegistrar?.name}
              </Text>{" "}
              to register <Text style={styles.modalDomain}>{domain}</Text>.
            </Text>
            <Text style={styles.modalQuestion}>
              Tap{" "}
              <Text style={{ color: theme.colors.primary }}>Proceed</Text> to
              open the registrar’s website.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.proceedBtn]}
                onPress={handleProceed}
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

// ---- Styles ----
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.light, paddingTop: 48 },
  stickyHeader: {
    backgroundColor: theme.colors.light,
    paddingHorizontal: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  logoSection: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  logoTop: { width: 60, height: 60, marginRight: 10 },
  textBlock: { flexDirection: "column" },
  headerTitlePrimary: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary,
    lineHeight: 20,
  },
  headerTitleSecondary: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.secondary,
    lineHeight: 20,
  },
  headerSubtitle: { fontSize: 14, color: theme.colors.gray700, marginBottom: 8 },
  helperTextBold: {
    fontSize: 14,
    color: theme.colors.dark,
    fontWeight: "700",
    marginBottom: 10,
  },
  helperTextWarning: { marginTop: 6, color: theme.colors.primary, fontSize: 13 },
  controlsRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  searchBar: {
    flex: 1.2,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 10,
  },
  sortControls: { flexDirection: "row" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    marginRight: 8,
    backgroundColor: theme.colors.white,
  },
  chipText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: "500",
    marginLeft: 4,
  },
  activeChip: { backgroundColor: theme.colors.primary },
  activeChipText: { color: theme.colors.white },
  listContent: { paddingHorizontal: 8, paddingBottom: 40 },
  columnWrapper: { justifyContent: "space-between" },
  cardWrapper: { flex: 1, margin: 8, minWidth: 0 },
  card: { borderRadius: 14, elevation: 3, backgroundColor: theme.colors.white },
  cardContent: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 12 },
  logo: { width: 56, height: 56, borderRadius: 8, marginRight: 12, backgroundColor: "#f2f2f2" },
  info: { flex: 1, minWidth: 0 },
  name: { fontWeight: "700", fontSize: 16, color: theme.colors.dark, marginBottom: 4 },
  price: { fontSize: 14, color: theme.colors.secondary, fontWeight: "600", marginBottom: 4 },
  website: { fontSize: 13, color: theme.colors.primary, textDecorationLine: "underline" },
  chevron: { fontSize: 28, color: theme.colors.gray600, marginLeft: 8 },
  loadMoreBtn: {
    alignSelf: "center",
    marginVertical: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
  },
  loadMoreText: { color: theme.colors.white, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: theme.colors.white,
    width: "85%",
    borderRadius: 16,
    padding: 22,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: theme.colors.primary, marginBottom: 8 },
  modalInfo: { fontSize: 15, color: theme.colors.dark, marginBottom: 10 },
  modalQuestion: { fontSize: 14, color: theme.colors.gray700, marginBottom: 16 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end" },
  modalBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, marginLeft: 10 },
  cancelBtn: { backgroundColor: theme.colors.gray200 },
  proceedBtn: { backgroundColor: theme.colors.secondary},
  cancelText: { color: theme.colors.dark },
  proceedText: { color: theme.colors.white, fontWeight: "600" },
  modalDomain: { color: theme.colors.secondary },
});
