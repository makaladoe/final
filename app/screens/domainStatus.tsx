import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Linking,
} from "react-native";
import theme from "../Theme/theme";

// ===== CONFIG =====
const WHOISXML_API_KEY = "at_K4R6ng5rtnE76FqBIhlWYhGo9Icsx";

// ===== HELPERS =====
const trimDomain = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();

const withTimeout = async <T,>(p: Promise<T>, ms = 7000): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });

const safeFetchJson = async (url: string) => {
  try {
    const res = await withTimeout(fetch(url), 10000);
    return await res.json();
  } catch {
    return null;
  }
};

const probeSite = async (domain: string) => {
  try {
    const https = await withTimeout(fetch(`https://${domain}`, { method: "GET" }), 6000);
    return { reachable: true, protocol: "https", status: https.status || 200 };
  } catch {
    try {
      const http = await withTimeout(fetch(`http://${domain}`, { method: "GET" }), 6000);
      return { reachable: true, protocol: "http", status: http.status || 200 };
    } catch {
      return { reachable: false, protocol: null, status: null };
    }
  }
};

const inferActive = (dns: any, probe: { reachable: boolean }) => {
  const hasA =
    Array.isArray(dns?.A?.Answer) && dns.A.Answer.some((a: any) => a?.data && a.data !== "0.0.0.0");
  const hasAAAA = Array.isArray(dns?.AAAA?.Answer) && dns.AAAA.Answer.length > 0;
  const hasMX = Array.isArray(dns?.MX?.Answer) && dns.MX.Answer.length > 0;
  if ((hasA || hasAAAA || hasMX) && (probe.reachable || hasMX)) return "Active";
  return "Passive";
};

// ===== MAIN COMPONENT =====
export default function DomainStatus() {
  const [rawDomain, setRawDomain] = useState("");
  const domain = useMemo(() => trimDomain(rawDomain), [rawDomain]);

  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

  const runCheck = async () => {
    if (!domain || !domain.includes(".")) {
      setReport(null);
      setProgressMsg("Please enter a valid domain, e.g., example.co.ke");
      return;
    }
    setLoading(true);
    setReport(null);
    setProgressMsg("Starting checks…");

    try {
      // WHOIS lookup
      setProgressMsg("Fetching registration data…");
      const whoisUrl = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${WHOISXML_API_KEY}&domainName=${encodeURIComponent(
        domain
      )}&outputFormat=JSON`;
      const whois = await safeFetchJson(whoisUrl);

      const record = whois?.WhoisRecord;
      const registered =
        typeof record?.dataError === "string"
          ? record.dataError.toLowerCase() !== "no whois data found"
          : Boolean(record);
      const registrar = record?.registrarName ?? record?.registrar ?? "—";
      const createdDate = record?.createdDate ?? record?.registryData?.createdDate ?? "—";
      const updatedDate = record?.updatedDate ?? record?.registryData?.updatedDate ?? "—";
      const expiresDate = record?.expiresDate ?? record?.registryData?.expiresDate ?? "—";
      const statuses =
        Array.isArray(record?.status) ? record.status : record?.status ? [String(record.status)] : [];

      // DNS lookup
      setProgressMsg("Resolving domain…");
      const [dnsA, dnsAAAA, dnsMX, dnsNS] = await Promise.all([
        safeFetchJson(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`),
        safeFetchJson(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=AAAA`),
        safeFetchJson(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`),
        safeFetchJson(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=NS`),
      ]);
      const dns = {
        A: dnsA?.Answer?.map((a: any) => a.data) || [],
        AAAA: dnsAAAA?.Answer?.map((a: any) => a.data) || [],
        MX: dnsMX?.Answer?.map((a: any) => a.data?.split(" ").slice(-1)[0]) || [],
        NS: dnsNS?.Answer?.map((a: any) => a.data) || [],
      };

      // Website probe
      setProgressMsg("Checking website reachability…");
      const live = await probeSite(domain);

      const activityHeuristic = inferActive({ A: dnsA, AAAA: dnsAAAA, MX: dnsMX }, live);

      setReport({
        domain,
        registered,
        registrar,
        createdDate,
        updatedDate,
        expiresDate,
        statuses,
        nameservers: dns.NS,
        dns,
        live,
        activityHeuristic,
      });
      setProgressMsg(null);
    } catch (e) {
      console.error("Domain status error:", e);
      setProgressMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openWhois = () => {
    if (domain) {
      Linking.openURL(`https://rdap.org/domain/${encodeURIComponent(domain)}`).catch(() => {});
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Check Domain Status</Text>
      <Text style={styles.subheader}>
        Enter your domain below to see registration, expiry, and activity details.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Domain</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., example.co.ke"
          placeholderTextColor={theme.colors.gray500}
          autoCapitalize="none"
          value={rawDomain}
          onChangeText={setRawDomain}
          keyboardType="url"
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={runCheck} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={styles.primaryBtnText}>Check Status</Text>
          )}
        </TouchableOpacity>

        {progressMsg ? <Text style={styles.progress}>{progressMsg}</Text> : null}
      </View>

      {report && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Report</Text>
          <Row k="Domain" v={report.domain} />
          <Row k="Registered" v={report.registered ? "Yes" : "No"} />
          <Row k="Registrar" v={report.registrar} />
          <Row k="Created" v={report.createdDate} />
          <Row k="Updated" v={report.updatedDate} />
          <Row k="Expires on" v={report.expiresDate} />
          <Row k="Status" v={report.statuses.join(", ") || "—"} />
          <Row k="Website Reachable" v={report.live?.reachable ? "Yes" : "No"} />
          <Row k="Activity" v={report.activityHeuristic} />

          <TouchableOpacity style={styles.linkBtn} onPress={openWhois}>
            <Text style={styles.linkText}>View full WHOIS / RDAP</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.k}>{k}</Text>
      <Text style={styles.v}>{v}</Text>
    </View>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: theme.colors.dark,
    marginVertical: 20,
  },
  subheader: {
    textAlign: "center",
    color: theme.colors.gray600,
    marginBottom: 16,
    fontSize: 15,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: theme.colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: theme.colors.gray700,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: theme.colors.dark,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    color: theme.colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
  progress: {
    marginTop: 8,
    color: theme.colors.gray600,
    fontSize: 14,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.dark,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  k: {
    color: theme.colors.gray700,
    fontWeight: "500",
  },
  v: {
    color: theme.colors.dark,
    textAlign: "right",
  },
  linkBtn: {
    marginTop: 16,
    alignSelf: "center",
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: "600",
    fontSize: 15,
  },
});
