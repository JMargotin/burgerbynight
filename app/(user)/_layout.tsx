import { Tabs, router } from "expo-router";
import { View, ImageBackground, Text, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/theme";
import { useAuth } from "@/providers/AuthProvider";

export default function UserLayout() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  return (
    <ImageBackground
      source={require("../../assets/gta-bg.jpg")}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          backgroundColor: "rgba(5,7,10,0.65)",
        }}
      />

      <Tabs
        screenOptions={{
          sceneStyle: { backgroundColor: "transparent" },

          headerBackground: () => (
            <BlurView tint="dark" intensity={50} style={{ flex: 1 }} />
          ),
          headerTintColor: theme.colors.text,
          headerTitleStyle: { color: theme.colors.text },

          tabBarBackground: () => (
            <BlurView tint="dark" intensity={50} style={{ flex: 1 }} />
          ),
          tabBarStyle: {
            borderTopWidth: 0,
            backgroundColor: "transparent",
            position: "absolute",
          },
          tabBarActiveTintColor: theme.colors.neon,
          tabBarInactiveTintColor: theme.colors.sub,

          headerRight: () =>
            isAdmin ? (
              <TouchableOpacity
                onPress={() => router.push("/(admin)/home")}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={theme.colors.neon2}
                />
                <Text style={{ color: theme.colors.neon2, fontWeight: "700" }}>
                  Admin
                </Text>
              </TouchableOpacity>
            ) : null,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Accueil",
            tabBarLabel: "Accueil",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="points"
          options={{
            title: "Points",
            tabBarLabel: "Points",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trophy" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="coupons"
          options={{
            title: "Coupons",
            tabBarLabel: "Coupons",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ticket" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="promos"
          options={{
            title: "Promos",
            tabBarLabel: "Promos",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pricetag" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen name="qr" options={{ href: null }} />
      </Tabs>
    </ImageBackground>
  );
}
