import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import {
  PhoneAuthProvider,
  linkWithCredential,
  signInWithCredential,
  User as FirebaseUser,
} from "firebase/auth";
import { useAuth } from "../../context/authcontext";
import { db, auth } from "../../context/firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import theme from "../theme";

/**
 * ProfileSetupScreen
 * - Adds SMS OTP verification when user taps "Save Profile"
 * - Links phone credential to currently signed-in user (safe)
 * - On successful verification saves profile and sets phoneVerified: true
 *
 * Notes:
 * - Expo: ensure you installed `expo-firebase-recaptcha`
 * - Android: for auto SMS retrieval configure SHA-1 in Firebase console
 * - iOS: user will manually enter the OTP
 */

export default function ProfileSetupScreen() {
  const { user, checkUserProfile, markProfileComplete } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(true);

  // OTP / reCAPTCHA state
  const recaptchaVerifier = useRef<any>(null);
  const [verificationId, setVerificationId] = useState<string>("");
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState<string>("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

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
          router.replace("/screens/landing");
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

  // ---------- Send OTP (safe guard for recaptcha) ----------
  const sendOTP = async (formattedPhone: string) => {
    try {
      if (!recaptchaVerifier.current) {
        Alert.alert("Error", "reCAPTCHA not ready. Please try again.");
        return;
      }

      setSendingOtp(true);

      const phoneProvider = new PhoneAuthProvider(auth);
      // verifyPhoneNumber expects an ApplicationVerifier (recaptchaVerifier.current)
      const id = await phoneProvider.verifyPhoneNumber(
        formattedPhone,
        // recaptchaVerifier.current satisfies ApplicationVerifier at runtime
        recaptchaVerifier.current
      );

      setVerificationId(id);
      setOtpModalVisible(true);
      Alert.alert("Verification Code Sent", "Enter the code sent to your phone.");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      // Friendly messages
      const msg =
        error?.code === "auth/invalid-phone-number"
          ? "Invalid phone number"
          : "Failed to send code. Try again.";
      Alert.alert("Error", msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // ---------- Verify OTP and link credential to current user ----------
  const confirmOTP = async () => {
    if (!verificationId || !otp.trim()) {
      Alert.alert("Error", "Please enter the OTP.");
      return;
    }

    setVerifyingOtp(true);

    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp.trim());

      // If user is already signed in, link the phone credential to that user.
      // This avoids signing the app user out or switching accounts.
      if (auth.currentUser) {
        try {
          await linkWithCredential(auth.currentUser as FirebaseUser, credential);
        } catch (linkErr: any) {
          // If linking fails because the phone is already used, show friendly message
          console.error("Linking error:", linkErr);
          if (linkErr?.code === "auth/credential-already-in-use" || linkErr?.code === "auth/phone-number-already-exists") {
            Alert.alert("Error", "Phone number already in use.");
            setVerifyingOtp(false);
            return;
          }
          // Re-throw other link errors to try fallback sign-in (rare)
          throw linkErr;
        }
      } else {
        // No current user: fallback (unlikely in this screen), sign in with credential
        await signInWithCredential(auth, credential);
      }

      // Save profile and mark phoneVerified true
      await saveProfileToFirestore(true);
      setOtpModalVisible(false);
    } catch (error) {
      console.error("Error verifying code:", error);
      // Friendly message
      Alert.alert("Error", "Invalid verification code. Try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ---------- Save profile to Firestore (keeps original logic) ----------
  const saveProfileToFirestore = async (isVerified = false) => {
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
          phoneVerified: isVerified,
          profileComplete: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await markProfileComplete(user?.uid || "");

      Alert.alert("Profile Saved", "Your profile has been successfully updated.", [
        { text: "Continue", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Could not save your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Handle Save (send OTP, don't directly save) ----------
  const handleSaveProfile = async () => {
    if (!fullName.trim() || !phone.trim() || !county || !organization) {
      Alert.alert("Incomplete Fields", "Please fill all required details.");
      return;
    }

    if (phone.length < 9) {
      Alert.alert("Invalid Phone", "Enter a valid 9-digit phone number.");
      return;
    }

    // send OTP and wait for verification (modal)
    setLoading(true);
    const formattedPhone = `+254${phone}`;
    await sendOTP(formattedPhone);
    setLoading(false);
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
      {/* reCAPTCHA modal required by Firebase phone auth */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
      />

      <Image source={require("../../assets/images/logo.jpg")} style={styles.avatar} />
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

        <TextInput style={[styles.input, styles.disabledInput]} value={email} editable={false} />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, loading && { opacity: 0.7 }]}
        onPress={handleSaveProfile}
        disabled={loading || sendingOtp}
      >
        {loading || sendingOtp ? (
          <ActivityIndicator color={theme.colors.white} />
        ) : (
          <Text style={styles.saveText}>Save Profile</Text>
        )}
      </TouchableOpacity>

      {/* OTP Modal */}
      <Modal visible={otpModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify Phone Number</Text>
            <Text style={{ marginBottom: 8, color: theme.colors.gray600 }}>
              Enter the 6-digit code sent to +254{phone}
            </Text>

            <TextInput
              style={[styles.input, { width: "60%", textAlign: "center" }]}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.saveBtn, { width: "60%", marginTop: 12 }]}
              onPress={confirmOTP}
              disabled={verifyingOtp}
            >
              {verifyingOtp ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.saveText}>Verify & Save</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setOtpModalVisible(false);
                setOtp("");
              }}
              style={{ marginTop: 12 }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------- Styles ----------
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
    alignItems: "center",
  },
  saveText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.md,
  },
  cancelText: {
    color: theme.colors.gray600,
    textAlign: "center",
    marginTop: theme.spacing(2),
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(3),
    alignItems: "center",
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing(2),
  },
});
