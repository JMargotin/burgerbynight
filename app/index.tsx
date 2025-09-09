// app/index.tsx
import { Redirect, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/providers/AuthProvider";

export default function Index() {
  const { user, profile, loading } = useAuth();
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  if (mode === "admin" && profile?.role === "admin") {
    return <Redirect href="/(admin)/home" />;
  }

  return <Redirect href="/(user)/home" />;
}
