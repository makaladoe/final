import { View, Text, StyleSheet } from "react-native";
import theme from "../Theme/theme";

export default function AiDomainSuggester() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the AI Domain Suggester page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.light,
  },
  text: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primary,
  },
});
