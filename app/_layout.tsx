import { AuthProvider } from "@/providers/AuthProvider";
import { RefreshProvider } from "@/providers/RefreshProvider";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
      <RefreshProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </RefreshProvider>
    </AuthProvider>
  );
}
