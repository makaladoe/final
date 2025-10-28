import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router"; // Use Expo Router for navigation
import { useAuth } from "../../context/authcontext";
import { db } from "../../context/firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import theme from "../Theme/theme";

export default function ProfileSetupScreen() {
  const { user, checkUserProfile, markProfileComplete } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(true);

  const counties = [
    "Mombasa","Kwale","Kilifi","Tana River","Lamu","Taita Taveta","Garissa","Wajir",
    "Mandera","Marsabit","Isiolo","Meru","Tharaka-Nithi","Embu","Kitui","Machakos",
    "Makueni","Nyandarua","Nyeri","Kirinyaga","Murang’a","Kiambu","Turkana","West Pokot",
    "Samburu","Trans Nzoia","Uasin Gishu","Elgeyo Marakwet","Nandi","Baringo","Laikipia",
    "Nakuru","Narok","Kajiado","Kericho","Bomet","Kakamega","Vihiga","Bungoma","Busia",
    "Siaya","Kisumu","Homa Bay","Migori","Kisii","Nyamira","Nairobi"
  ];

  const orgTypes = ["Student", "Company", "Government", "NGO", "Individual"];

  useEffect(() => {
    const verifyProfileStatus = async () => {
      try {
        if (!user?.uid) return;

        const isProfileComplete = await checkUserProfile(user.uid);
        if (isProfileComplete) {
          router.replace("/screens/landing"); //  Expo Router navigation
          return;
        }

        const docRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setFullName(data.fullName || "");
          setPhone(data.phone?.replace("+254", "") || "");
          setCounty(data.county || "");
          setOrganization(data.organization || "");
          setEmail(data.email || user.email || "");
        } else {
          setEmail(user.email || "");
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        Alert.alert("Error", "Unable to verify your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    verifyProfileStatus();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !phone.trim() || !county || !organization) {
      Alert.alert("Incomplete Fields", "Please fill in all required details.");
      return;
    }

    if (phone.length < 9) {
      Alert.alert("Invalid Phone", "Please enter a valid 9-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `+254${phone}`;
      const userRef = doc(db, "users", user?.uid || "");

      await setDoc(
        userRef,
        {
          fullName,
          phone: formattedPhone,
          county,
          organization,
          email,
          profileComplete: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await markProfileComplete(user?.uid || "");

      Alert.alert("Profile Saved", "Your profile has been successfully updated.", [
        {
          text: "Continue",
          onPress: () => router.replace("/screens/landing"), //  Updated navigation
        },
      ]);
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Could not save your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loaderText}>Checking your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/images/kenic1.png")} style={styles.avatar} />
      <Text style={styles.header}>Set Up Your Profile</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={theme.colors.gray400}
          value={fullName}
          onChangeText={setFullName}
        />

        <View style={styles.phoneContainer}>
          <Text style={styles.prefix}>+254</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="7xxxxxxxx"
            keyboardType="phone-pad"
            placeholderTextColor={theme.colors.gray400}
            value={phone}
            onChangeText={setPhone}
            maxLength={9}
          />
        </View>

        <Picker selectedValue={county} onValueChange={setCounty} style={styles.picker}>
          <Picker.Item label="Select County" value="" />
          {counties.map((c) => (
            <Picker.Item key={c} label={c} value={c} />
          ))}
        </Picker>

        <Picker selectedValue={organization} onValueChange={setOrganization} style={styles.picker}>
          <Picker.Item label="Select Organization Type" value="" />
          {orgTypes.map((o) => (
            <Picker.Item key={o} label={o} value={o} />
          ))}
        </Picker>

        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={email}
          editable={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, loading && { opacity: 0.7 }]}
        onPress={handleSaveProfile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.white} />
        ) : (
          <Text style={styles.saveText}>Save Profile</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light,
    padding: theme.spacing(4),
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing(2),
  },
  header: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing(3),
  },
  form: {
    width: "100%",
    marginBottom: theme.spacing(3),
  },
  input: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderRadius: theme.radius.md,
    padding: theme.spacing(1.5),
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing(2),
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing(2),
    paddingHorizontal: theme.spacing(1.5),
  },
  prefix: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray600,
    marginRight: theme.spacing(1),
  },
  phoneInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
  },
  picker: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    marginBottom: theme.spacing(2),
  },
  disabledInput: {
    backgroundColor: theme.colors.gray100,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(5),
    ...theme.shadow.medium,
  },
  saveText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.md,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light,
  },
  loaderText: {
    marginTop: 10,
    color: theme.colors.gray600,
  },
});
