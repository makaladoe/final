import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { getDomainByPhone } from '../api/domain';
import { Domain } from '../types/domain';

const MyRegistered: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const result = await getDomainByPhone(phone);
    setDomain(result);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require('../assets/images/logo.jpg')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.text}>Enter your phone number</Text>

      {/* Input */}
      <TextInput
        style={styles.input}
        placeholder="e.g. +254712345678"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>
          {loading ? 'Searching...' : 'Search Domain'}
        </Text>
      </TouchableOpacity>

      {/* Result */}
      {domain ? (
        <View style={styles.result}>
          <Text style={styles.resultText}>Name: {domain.name}</Text>
          <Text style={styles.resultText}>Phone: {domain.phone_number}</Text>
          <Text style={styles.resultText}>Domain: {domain.domain}</Text>
        </View>
      ) : phone && !loading ? (
        <Text style={{ marginTop: 16 }}>No domain found for this number.</Text>
      ) : null}
    </View>
  );
};

export default MyRegistered;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  button: {
    width: '100%',
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  result: {
    marginTop: 24,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    width: '100%',
  },
  resultText: {
    fontSize: 16,
    marginVertical: 2,
  },
});
