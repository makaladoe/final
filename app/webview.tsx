// app/webview.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ToastAndroid,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { ActivityIndicator } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import theme from "./Theme/theme";

export default function WebViewScreen() {
  //  Get both domainName and url
  const { url, domainName } = useLocalSearchParams<{ url?: string; domainName?: string }>();

  const copyToClipboard = async () => {
    if (domainName) {
      await Clipboard.setStringAsync(domainName);
      if (Platform.OS === "android") {
        ToastAndroid.show("Domain name copied!", ToastAndroid.SHORT);
      } else {
        Alert.alert("Copied", "Domain name copied to clipboard");
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      {/*  Domain display bar */}
      {domainName && (
        <View style={styles.topBar}>
          <View style={styles.domainInfo}>
            <Text style={styles.labelText}>You’re registering:</Text>
            <Text style={styles.domainText} numberOfLines={1}>
              {domainName}
            </Text>
          </View>

          <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
            <Ionicons name="copy-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
        </View>
      )}

      {/*  WebView */}
      <View style={styles.webContainer}>
        {url ? (
          <WebView
            source={{ uri: url }}
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator
                style={styles.loader}
                color={theme.colors.primary}
                size="large"
              />
            )}
          />
        ) : (
          <ActivityIndicator style={styles.loader} color={theme.colors.primary} size="large" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    paddingTop: (StatusBar.currentHeight || 0) + 10, // adds breathing space
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  domainInfo: {
    flex: 1,
    marginRight: 8,
  },
  labelText: {
    fontSize: 12,
    color: "#6b7280",
  },
  domainText: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyText: {
    color: theme.colors.primary,
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  webContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
