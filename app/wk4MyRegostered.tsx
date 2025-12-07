// app/dbtrial.tsx
import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, 
  ActivityIndicator, ScrollView, Image, TouchableOpacity 
} from 'react-native';
import theme from './theme';

const DBTrial: React.FC = () => {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleCheckDomain = async () => {
    if (!domain.trim()) return setError("Please enter a domain");

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch(
        `https://nonconstruable-melia-vowelly.ngrok-free.dev/check-domain?name=${domain.trim()}`
      );
      const data = await response.json();

      if (data.exists) {
        setResult(data);
      } else {
        setError("Domain not found");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "green";
      case "Pending Delete": return "red";
      case "Pending Transfer":
      case "Pending Renew":
      case "Pending Update":
      case "Pending Creation":
      case "On Hold": return "orange";
      case "Inactive": return "gray";
      case "Status Restricted": return "blue";
      default: return "black";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const renderPendingActions = (pending: any) => {
    const actions: string[] = [];
    if (pending.delete) actions.push("Delete");
    if (pending.transfer) actions.push("Transfer");
    if (pending.renew) actions.push("Renew");
    if (pending.update) actions.push("Update");
    if (pending.create) actions.push("Create");

    if (actions.length === 0) return null;

    return (
      <View style={{ marginTop: 10 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Pending Actions:</Text>
        {actions.map((action, idx) => (
          <Text key={idx} style={{ marginLeft: 10, color: "orange" }}>{action}</Text>
        ))}
      </View>
    );
  };

  const renderProhibited = (prohibited: any) => {
    const clientActions = Object.entries(prohibited.client)
      .filter(([_, value]) => value)
      .map(([key]) => `Client ${key}`);
    const serverActions = Object.entries(prohibited.server)
      .filter(([_, value]) => value)
      .map(([key]) => `Server ${key}`);

    const all = [...clientActions, ...serverActions];
    if (all.length === 0) return null;

    return (
      <View style={{ marginTop: 10 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Prohibited Actions:</Text>
        {all.map((item, idx) => (
          <Text key={idx} style={{ marginLeft: 10, color: "blue" }}>{item}</Text>
        ))}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Logo */}
      <Image
        source={require('../assets/images/logo.jpg')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Check Domain</Text>

      {/* Domain Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter domain name"
        value={domain}
        onChangeText={setDomain}
        autoCapitalize="none"
      />

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={handleCheckDomain}>
        <Text style={styles.buttonText}>Check Domain</Text>
      </TouchableOpacity>

      {/* Loading */}
      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {/* Error */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Result */}
      {result && (
        <View style={styles.result}>
          <Text style={styles.resultText}>
            <Text style={{ fontWeight: "bold" }}>Domain:</Text> {result.name}
          </Text>

          <Text style={[styles.resultText, { color: getStatusColor(result.status) }]}>
            <Text style={{ fontWeight: "bold" }}>Status:</Text> {result.status}
          </Text>

          <Text style={styles.resultText}>
            <Text style={{ fontWeight: "bold" }}>Expiry Date:</Text> {formatDate(result.expiry)}
          </Text>

          {result.renewal && (
            <Text style={styles.resultText}>
              <Text style={{ fontWeight: "bold" }}>Renewal Date:</Text> {formatDate(result.renewal)}
            </Text>
          )}

          <Text style={styles.resultText}>
            <Text style={{ fontWeight: "bold" }}>Registrar ID:</Text> {result.registrar_id || "N/A"}
          </Text>

          <Text style={styles.resultText}>
            <Text style={{ fontWeight: "bold" }}>Registrant:</Text> {result.registrant || "N/A"}
          </Text>

          <Text style={styles.resultText}>
            <Text style={{ fontWeight: "bold" }}>Created:</Text> {formatDate(result.created)}
          </Text>

          <Text style={styles.resultText}>
            <Text style={{ fontWeight: "bold" }}>Updated:</Text> {formatDate(result.updated)}
          </Text>

          

          {/* Pending Actions */}
          {renderPendingActions(result.pending)}

          {/* Prohibited Actions */}
          {renderProhibited(result.prohibited)}
        </View>
      )}
    </ScrollView>
  );
};

export default DBTrial;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  result: {
    marginTop: 20,
    width: '100%',
    padding: 15,
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 5,
  },
});
