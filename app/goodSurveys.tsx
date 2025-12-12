// ======================================================
//  SURVEYS SCREEN (With Auto-refresh, Status Badges,
//  Disabled Expired Surveys, Scroll-to-Refresh)
// ======================================================

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Linking,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import Constants from "expo-constants";

// --------------------
// ENV / API endpoints
// --------------------
const SANITY_API_URL = Constants.expoConfig?.extra?.SANITY_API_URL ?? "";
const SURVEY_SUBMIT_API =
  Constants.expoConfig?.extra?.SANITY_SURVEY_SUBMIT_API ?? "";

// ------------------
// Types
// ------------------
interface Question {
  question: string;
  type: string;
  options?: string[];
  maxRating?: number;
}

interface Survey {
  _id: string;
  title: string;
  description?: string;
  surveyType: "inapp" | "external" | string;
  externalLink?: string;
  questions?: Question[];
  startDate?: string;
  expiryDate?: string;
  tags?: string[];
}

// ------------------
// Helper UI
// ------------------
const StarRating: React.FC<{
  value: number;
  max: number;
  onChange: (v: number) => void;
}> = ({ value, max, onChange }) => {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {stars.map((s) => (
        <TouchableOpacity
          key={s}
          onPress={() => onChange(s)}
          style={{ padding: 6 }}
        >
          <Text style={{ fontSize: 26 }}>{s <= value ? "★" : "☆"}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const EmojiSelector: React.FC<{
  value: string | null;
  onChange: (e: string) => void;
}> = ({ value, onChange }) => {
  const emojis = ["😡", "😕", "😐", "🙂", "😍"];
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {emojis.map((e) => (
        <TouchableOpacity
          key={e}
          onPress={() => onChange(e)}
          style={{
            padding: 8,
            marginRight: 6,
            borderRadius: 8,
            backgroundColor: value === e ? "#e6f0ff" : "transparent",
          }}
        >
          <Text style={{ fontSize: 24 }}>{e}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ------------------
// MAIN COMPONENT
// ------------------
const Surveys: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // ---------------------------
  // GROQ QUERY
  // ---------------------------
  const surveyQuery = `
    *[_type == "survey" && status == "active"] | order(startDate desc){
      _id, title, description, surveyType, externalLink, questions,
      startDate, expiryDate, tags
    }
  `;

  const buildSanityUrl = (query: string) =>
    `${SANITY_API_URL}?query=${encodeURIComponent(query)}`;

  // ---------------------------
  // Fetch surveys
  // ---------------------------
  const fetchSurveys = async () => {
    try {
      const url = buildSanityUrl(surveyQuery);
      const resp = await fetch(url);
      const json = await resp.json();
      setSurveys(json?.result ?? []);
    } catch (e) {
      console.log("Fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  // ---------------------------
  // Auto-refresh when scrolling to bottom
  // ---------------------------
  const handleScroll = (event: any) => {
    const position = event.nativeEvent.contentOffset.y;
    const height = event.nativeEvent.layoutMeasurement.height;
    const total = event.nativeEvent.contentSize.height;

    if (position + height >= total - 20) {
      // near bottom
      fetchSurveys();
    }
  };

  // Pull-down refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchSurveys();
  };

  // ---------------------------
  // Utility: get survey status
  // ---------------------------
  const getSurveyStatus = (survey: Survey): "active" | "expired" | "upcoming" => {
    const now = new Date().getTime();
    const start = survey.startDate ? new Date(survey.startDate).getTime() : null;
    const exp = survey.expiryDate ? new Date(survey.expiryDate).getTime() : null;

    if (exp && now > exp) return "expired";
    if (start && now < start) return "upcoming";
    return "active";
  };

  // ---------------------------
  // UI Badge Component
  // ---------------------------
  const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
      active: "#27ae60",
      expired: "#e74c3c",
      upcoming: "#f1c40f",
    };
    return (
      <View
        style={{
          backgroundColor: colors[status] + "20",
          borderWidth: 1,
          borderColor: colors[status],
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
          alignSelf: "flex-start",
          marginBottom: 6,
        }}
      >
        <Text style={{ color: colors[status], fontWeight: "600" }}>
          {status.toUpperCase()}
        </Text>
      </View>
    );
  };

  // ---------------------------
  // Open survey modal (in-app)
  // ---------------------------
  const openInAppSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setModalVisible(true);

    const initial: Record<number, any> = {};
    (survey.questions ?? []).forEach((q, idx) => {
      if (q.type === "rating") initial[idx] = q.maxRating ?? 5;
      else initial[idx] = "";
    });
    setAnswers(initial);
  };

  // ---------------------------
  // Submit Survey
  // ---------------------------
  const submitSurvey = async () => {
    if (!selectedSurvey) return;

    const payload = {
      surveyId: selectedSurvey._id,
      submittedAt: new Date().toISOString(),
      answers,
    };

    try {
      setSubmitting(true);

      if (!SURVEY_SUBMIT_API) {
        console.log("Submit payload:", payload);
        Alert.alert("Thank you!", "Your answers have been submitted.");
      } else {
        await fetch(SURVEY_SUBMIT_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } catch (e) {
      Alert.alert("Error", "Failed to submit.");
    } finally {
      setSubmitting(false);
      setModalVisible(false);
    }
  };

  // ---------------------------
  // Render Question
  // ---------------------------
  const renderQuestion = (q: Question, idx: number) => (
    <View key={idx} style={{ marginBottom: 14 }}>
      <Text style={styles.qText}>{q.question}</Text>

      {q.type === "rating" && (
        <StarRating
          value={answers[idx]}
          max={q.maxRating ?? 5}
          onChange={(v) => setAnswers({ ...answers, [idx]: v })}
        />
      )}

      {q.type === "emoji" && (
        <EmojiSelector
          value={answers[idx]}
          onChange={(v) => setAnswers({ ...answers, [idx]: v })}
        />
      )}

      {q.type === "mcq" && (
        <View>
          {(q.options || []).map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.optionRow,
                answers[idx] === opt && {
                  backgroundColor: "#eef6ff",
                  borderColor: "#4A90E2",
                },
              ]}
              onPress={() => setAnswers({ ...answers, [idx]: opt })}
            >
              <Text style={{ marginRight: 8 }}>
                {answers[idx] === opt ? "◉" : "◯"}
              </Text>
              <Text>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {(q.type === "text" || q.type === "textarea") && (
        <TextInput
          style={[
            styles.input,
            q.type === "textarea" && { minHeight: 80, textAlignVertical: "top" },
          ]}
          multiline={q.type === "textarea"}
          value={answers[idx]}
          onChangeText={(t) => setAnswers({ ...answers, [idx]: t })}
        />
      )}
    </View>
  );

  // ---------------------------
  // RENDER MAIN UI
  // ---------------------------
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.jpg")}
        style={styles.logo}
        resizeMode="contain"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <Animated.View style={{ opacity: fadeAnim, flex: 1, width: "100%" }}>
          <ScrollView
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
          >
            {surveys.map((survey) => {
              const status = getSurveyStatus(survey);
              const isExpired = status === "expired";
              return (
                <TouchableOpacity
                  key={survey._id}
                  disabled={isExpired}
                  onPress={() => {
                    if (isExpired)
                      return Alert.alert(
                        "Expired",
                        "This survey has expired."
                      );

                    if (survey.surveyType === "external")
                      return Linking.openURL(survey.externalLink!);

                    openInAppSurvey(survey);
                  }}
                  style={[
                    styles.surveyCard,
                    isExpired && { opacity: 0.4 },
                  ]}
                >
                  <StatusBadge status={status} />

                  <Text style={styles.title}>{survey.title}</Text>

                  {survey.description ? (
                    <Text style={styles.description}>
                      {survey.description}
                    </Text>
                  ) : null}

                  {survey.surveyType === "external" &&
                    survey.externalLink && (
                      <Text style={styles.linkText}>Tap to open survey →</Text>
                    )}

                  {survey.surveyType === "inapp" && (
                    <Text style={styles.linkText}>Tap to start survey →</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      {/* ----------------------------------------------- */}
      {/* Survey Modal */}
      {/* ----------------------------------------------- */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#4A90E2" }}>Close</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              {selectedSurvey?.title}
            </Text>

            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {selectedSurvey?.questions?.map((q, idx) =>
              renderQuestion(q, idx)
            )}

            <TouchableOpacity
              style={[styles.button, { marginTop: 20 }]}
              onPress={submitSurvey}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default Surveys;

// ------------------------------
// STYLES
// ------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    paddingTop: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    width: "100%",
  },
  surveyCard: {
    backgroundColor: "#f4f7fb",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#d9e3f0",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginVertical: 6,
    color: "#555",
  },
  linkText: {
    fontSize: 13,
    marginTop: 6,
    color: "#4A90E2",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#4A90E2",
    padding: 12,
    borderRadius: 10,
    alignSelf: "stretch",
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  qText: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 8,
  },

  optionRow: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
});

const modalStyles = StyleSheet.create({
  header: {
    height: 55,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
