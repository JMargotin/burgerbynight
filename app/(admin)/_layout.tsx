import { theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";

export default function AdminLayout() {
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
          tabBarActiveTintColor: theme.colors.neon2,
          tabBarInactiveTintColor: theme.colors.sub,

          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/(user)/home")}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons name="person" size={18} color={theme.colors.neon2} />
              <Text style={{ color: theme.colors.neon2, fontWeight: "700" }}>
                Client
              </Text>
            </TouchableOpacity>
          ),
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
          name="scan-customer"
          options={{
            title: "Scanner client",
            tabBarLabel: "Scanner",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="scan" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="promos"
          options={{
            title: "Promos globales",
            tabBarLabel: "Promos",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pricetag" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="concours"
          options={{
            title: "Concours",
            tabBarLabel: "Concours",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trophy" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            tabBarLabel: "Stats",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen name="client/[code]" options={{ href: null }} />
      </Tabs>
    </ImageBackground>
  );
}
