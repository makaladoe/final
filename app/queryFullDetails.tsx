// app/MyRegistered.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/authcontext';
import { db } from '../context/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getDomainByPhone } from '../api/domain';
import { Domain } from '../types/domain';

const MyRegistered: React.FC = () => {
  const { user } = useAuth(); // only user is available from context
  const [profileData, setProfileData] = useState<any>(null);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);

  // --- helper to format phone to match DB (start with 0)
  const formatPhoneForQuery = (phone: string): string => {
    if (!phone) return '';
    // Example: "+254789788978" -> "0789788978"
    if (phone.startsWith('+254')) {
      return '0' + phone.slice(4);
    }
    return phone;
  };

  useEffect(() => {
    const fetchProfileAndDomain = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        // 1️⃣ Fetch profile from Firestore
        const docRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfileData(data);

          // 2️⃣ Fetch domain using formatted phone
          if (data.phone) {
            const phoneForQuery = formatPhoneForQuery(data.phone);
            const domainResult = await getDomainByPhone(phoneForQuery);
            setDomain(domainResult);
          }
        }
      } catch (err) {
        console.error('Error fetching profile or domain:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndDomain();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading your domain...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require('../assets/images/logo.jpg')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.text}>Your Registered Domain</Text>

      {/* Phone Number (Read-Only) */}
      <TextInput
        style={[styles.input, { backgroundColor: '#eee' }]}
        value={profileData?.phone || ''}
        editable={false}
      />

      {/* Result */}
      {domain ? (
        <View style={styles.result}>
          <Text style={styles.resultText}>Name: {domain.name}</Text>
          <Text style={styles.resultText}>Phone: {domain.phone_number}</Text>
          <Text style={styles.resultText}>Domain: {domain.domain}</Text>
        </View>
      ) : (
        <Text style={{ marginTop: 16 }}>No domain found for your number.</Text>
      )}
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
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
