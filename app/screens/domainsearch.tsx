// app/domain-search.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import theme from "../Theme/theme";

const domainCategories: { [key: string]: string } = {
  Company: ".co.ke",
  Government: ".go.ke",
  Organization: ".or.ke",
  Network: ".ne.ke",
  Personal: ".me.ke",
  Mobile: ".mobi.ke",
  Information: ".info.ke",
  School: ".sc.ke",
  Academic: ".ac.ke",
  General: ".ke",
};

export default function DomainSearch() {
  const [category, setCategory] = useState("Company");
  const [domainName, setDomainName] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullDomain, setFullDomain] = useState<string | null>(null);
  const [status, setStatus] = useState<"available" | "taken" | "error" | null>(
    null
  );
  const router = useRouter();
  const API_KEY = "at_K4R6ng5rtnE76FqBIhlWYhGo9Icsx";

  // Animation for success circle
  const scaleAnim = useRef(new Animated.Value(0)).current;

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
  }, [status]);

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
        `https://domain-availability.whoisxmlapi.com/api/v1?apiKey=${API_KEY}&domainName=${fullDomainName}&outputFormat=JSON`
      );
      const data = await response.json();

      if (data.DomainInfo?.domainAvailability) {
        if (data.DomainInfo.domainAvailability === "AVAILABLE") {
          setStatus("available");
          setResult(
            ` Great news! ${fullDomainName} is available. Please proceed to register.`
          );
        } else {
          setStatus("taken");
          setResult(
            ` Oops! ${fullDomainName} is already taken. Try another name or tweak it slightly.`
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      {/* Title */}
      <Text style={styles.title}>Domain Search</Text>
      <Text style={styles.subtitle}>
        Find the perfect Kenyan domain name for your business or idea.
      </Text>

      {/* Category Selection */}
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

      {/* Domain Input + Search */}
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
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Ionicons name="search" size={22} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Helper & Preview */}
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

      {/* Animated Success Circle */}
      {status === "available" && (
        <Animated.View
          style={[
            styles.successCircle,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Ionicons name="checkmark" size={36} color="white" />
        </Animated.View>
      )}

      {/* Result Section */}
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
                  pathname: "/screens/register",
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light,
    paddingHorizontal: 18,
    paddingTop: 60, // more top space
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: 8,
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
    borderColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    margin: 6,
    backgroundColor: theme.colors.white,
  },
  categorySelected: {
    backgroundColor: theme.colors.primary,
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
  successBackground: {
    backgroundColor: "#E9F8F0",
  },
  errorBackground: {
    backgroundColor: "#FDECEA",
  },
  warningBackground: {
    backgroundColor: "#FFF6E5",
  },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  successText: {
    color: "#1B7B50",
  },
  errorText: {
    color: "#B00020",
  },
  warningText: {
    color: "#A67C00",
  },
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
