// app/index.tsx
import { useAuth } from "@/providers/AuthProvider";
import { theme } from "@/theme";
import { Redirect, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ImageBackground, Text, View } from "react-native";

export default function Index() {
  const { user, profile, loading } = useAuth();
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  if (loading) {
    return (
      <ImageBackground
        source={require("../assets/gta-bg.png")}
        resizeMode="cover"
        blurRadius={12}
        style={{ flex: 1, backgroundColor: "#000" }}
      >
        {/* Overlay sombre */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: "rgba(5,7,10,0.75)",
          }}
        />

        {/* Contenu de chargement */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <Text
            style={{
              color: theme.colors.neon2,
              fontSize: 36,
              fontWeight: "900",
              textShadowColor: theme.colors.neon2,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 16,
              letterSpacing: 1.2,
              marginBottom: 20,
            }}
          >
            Burger By Night
          </Text>

          <ActivityIndicator
            size="large"
            color={theme.colors.neon2}
            style={{ marginBottom: 16 }}
          />

          <Text
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Vérification de la session...
          </Text>
        </View>
      </ImageBackground>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  if (mode === "admin" && profile?.role === "admin") {
    return <Redirect href="/(admin)/home" />;
  }

  return <Redirect href="/(user)/home" />;
}
