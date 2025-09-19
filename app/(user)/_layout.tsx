import { useAuth } from "@/providers/AuthProvider";
import { getActiveContest } from "@/services";
import { theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import { useEffect, useState } from "react";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";

export default function UserLayout() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [hasActiveContest, setHasActiveContest] = useState(false);
  const [contestTitle, setContestTitle] = useState("Concours");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const c = await getActiveContest();
        if (!mounted) return;
        if (c) {
          setHasActiveContest(true);
          setContestTitle(c.title || "Concours");
        } else {
          setHasActiveContest(false);
        }
      } catch {
        if (mounted) setHasActiveContest(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ImageBackground
      source={require("../../assets/gta-bg.png")}
      resizeMode="cover"
      blurRadius={12}
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
          backgroundColor: "rgba(5,7,10,0.25)",

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
          name="qr"
          options={{
            title: "QR Code",
            tabBarLabel: "QR Code",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="qr-code" color={color} size={size} />
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
        {hasActiveContest ? (
          <Tabs.Screen
            name="concours"
            options={{
              title: contestTitle,
              tabBarLabel: "Concours",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="gift" color={color} size={size} />
              ),
            }}
          />
        ) : <Tabs.Screen name="concours" options={{ href: null }} />}
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
      </Tabs>
    </ImageBackground>
  );
}
