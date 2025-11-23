import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
  ImageBackground,
} from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type Registrar = {
  id: number;
  title: { rendered: string };
  meta: {
    website_url?: string;
    logo?: string;
  };
};

const REGISTRAR_MONTH_URL = Constants.expoConfig?.extra?.registrarOfMonthApi;
const TOP_URL = Constants.expoConfig?.extra?.TOP_REGISTRARS_URL;
const OTHER_URL = Constants.expoConfig?.extra?.OTHER_REGISTRARS_URL;
const LOGO_URL = Constants.expoConfig?.extra?.REGISTRAR_LOGO_URL;

const Registrars: React.FC = () => {
  const [monthRegistrar, setMonthRegistrar] = useState<Registrar[]>([]);
  const [topRegistrars, setTopRegistrars] = useState<Registrar[]>([]);
  const [otherRegistrars, setOtherRegistrars] = useState<Registrar[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const [showOther, setShowOther] = useState(false);

  const fetchRegistrars = async () => {
    try {
      const monthResp = await fetch(REGISTRAR_MONTH_URL);
      const monthData: Registrar[] = await monthResp.json();

      const topResp = await fetch(TOP_URL);
      const topData: Registrar[] = await topResp.json();

      const otherResp = await fetch(OTHER_URL);
      const otherData: Registrar[] = await otherResp.json();

      setMonthRegistrar(monthData);
      setTopRegistrars(topData);
      setOtherRegistrars(otherData);

      const allItems = [...monthData, ...topData, ...otherData];
      const logosMap: Record<string, string> = {};

      await Promise.all(
        allItems.map(async (item) => {
          if (item.meta.logo) {
            try {
              const resp = await fetch(`${LOGO_URL}${item.meta.logo}`);
              const media = await resp.json();
              logosMap[item.id] = media.source_url;
            } catch {}
          }
        })
      );

      setLogos(logosMap);
    } catch (error) {
      console.error("Error fetching registrars:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRegistrars();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRegistrars();
  };

  const openWebsite = (url?: string) => {
    if (!url) return Alert.alert("Website URL not available");
    const fixed = url.startsWith("http") ? url : `https://${url}`;
    setSelectedUrl(fixed);
  };

  const RegistrarCard = ({ item }: { item: Registrar }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openWebsite(item.meta.website_url)}
    >
      <View style={styles.logoCircle}>
        {logos[item.id] ? (
          <Image source={{ uri: logos[item.id] }} style={styles.logo} />
        ) : (
          <Text style={styles.noLogoText}>No Logo</Text>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title.rendered}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading registrars...</Text>
      </SafeAreaView>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/background4.jpg")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Registrar of the Month */}
          <Text style={styles.sectionHeader}>Registrar of the Month</Text>
          <FlatList
            data={monthRegistrar}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <RegistrarCard item={item} />}
            numColumns={2}
            columnWrapperStyle={styles.rowSpacing}
            scrollEnabled={false}
          />

          {/* Top Licensed Registrars */}
          <Text style={styles.sectionHeader}>Top Licensed Registrars</Text>
          <FlatList
            data={topRegistrars}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <RegistrarCard item={item} />}
            numColumns={2}
            columnWrapperStyle={styles.rowSpacing}
            scrollEnabled={false}
          />

          {/* Other Accredited Registrars */}
          <TouchableOpacity
            onPress={() => setShowOther(!showOther)}
            style={styles.toggleHeader}
          >
            <Text style={styles.sectionHeaderSmall}>
              Other Licensed Registrars
            </Text>
            <Text style={styles.toggleText}>{showOther ? "Hide ▲" : "Show ▼"}</Text>
          </TouchableOpacity>

          {showOther && (
            <FlatList
              data={otherRegistrars}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <RegistrarCard item={item} />}
              numColumns={2}
              columnWrapperStyle={styles.rowSpacing}
              scrollEnabled={false}
            />
          )}
        </ScrollView>

        {/* WebView Modal */}
        <Modal visible={!!selectedUrl} animationType="slide">
          <SafeAreaView style={{ flex: 1 }}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedUrl(null)}
            >
              <Text style={styles.closeText }>Close</Text>
            </TouchableOpacity>
            {selectedUrl && <WebView source={{ uri: selectedUrl }} />}
          </SafeAreaView>
        </Modal>
      </View>
    </ImageBackground>
  );
};

export default Registrars;

const CARD_WIDTH = (width - 60) / 2;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)", // semi-transparent overlay
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 28,
    marginBottom: 16,
    color: "#fff", // lighter on overlay
  },
  sectionHeaderSmall: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  toggleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 10,
  },
  toggleText: {
    fontSize: 15,
    color: "#007AFF",
    fontWeight: "600",
  },
  rowSpacing: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2.2,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  noLogoText: {
    fontSize: 11,
    color: "#777",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    color: "#111",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#fff",
  },
  closeButton: {
    padding: 14,
    backgroundColor: "#000000",
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
