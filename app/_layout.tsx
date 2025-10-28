// app/_layout.tsx
import { Stack } from "expo-router";
import { AuthProvider } from "../context/authcontext"; //

export default function Layout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="domainsearch" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="signin" />
        <Stack.Screen name="register" />
        <Stack.Screen name="landing" />
        <Stack.Screen name="VerifyEmail" />
        <Stack.Screen name="profileSetup" />
        <Stack.Screen name="manageDomains" />
        <Stack.Screen name="manageRegistrar" />
        <Stack.Screen name="aiDomainSuggester" />
        <Stack.Screen name="webview" />
        <Stack.Screen name="searchRegistrar" />
        <Stack.Screen name="becomeRegistrar" />
        <Stack.Screen name="Onboarding" />
        <Stack.Screen name="domainStatus" />
      </Stack>
    </AuthProvider>
  );
}
