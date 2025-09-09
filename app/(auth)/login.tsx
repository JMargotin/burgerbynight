// app/(auth)/login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { Link, router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { theme } from "@/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Connexion impossible", e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require("../../assets/gta-bg.jpg")}
      resizeMode="cover"
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      {/* Overlay sombre au-dessus du fond */}
      <View
        style={{
          ...(StyleSheet.absoluteFillObject as any),
          backgroundColor: "rgba(5,7,10,0.65)",
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // ajuste selon header
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "flex-end",
            padding: 20,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Titre / sous-titre */}
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{
                color: theme.colors.neon2,
                fontSize: 42,
                fontWeight: "900",
                textShadowColor: theme.colors.neon2,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 16,
                letterSpacing: 1.2,
              }}
            >
              Burger By Night
            </Text>
            <Text
              style={{
                color: theme.colors.text,
                opacity: 0.9,
                marginTop: 4,
                fontSize: 14,
              }}
            >
              Livraison nocturne • Tacos • Burger • Tiramisu
            </Text>
          </View>

          {/* Carte formulaire */}
          <View
            style={{
              backgroundColor: "rgba(15,18,25,0.9)",
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 16,
              padding: 16,
              gap: 12,
            }}
          >
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 18,
                fontWeight: "800",
              }}
            >
              Connexion
            </Text>

            {/* Email */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: theme.colors.sub, fontSize: 12 }}>
                Email
              </Text>
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor="#6f7a8a"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={inputStyle}
                returnKeyType="next"
              />
            </View>

            {/* Mot de passe */}
            <View style={{ gap: 6 }}>
              <Text style={{ color: theme.colors.sub, fontSize: 12 }}>
                Mot de passe
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#6f7a8a"
                  secureTextEntry={!show}
                  value={pass}
                  onChangeText={setPass}
                  style={[inputStyle, { paddingRight: 42 }]}
                  returnKeyType="go"
                  onSubmitEditing={onLogin}
                />
                <TouchableOpacity
                  onPress={() => setShow((s) => !s)}
                  style={eyeBtn}
                >
                  <Text style={{ color: theme.colors.sub }}>
                    {show ? "Masquer" : "Voir"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bouton */}
            <TouchableOpacity
              onPress={onLogin}
              disabled={loading}
              style={{
                marginTop: 8,
                backgroundColor: theme.colors.neon2,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                // glow
                shadowColor: theme.colors.neon2,
                shadowOpacity: 0.6,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 0 },
                elevation: 4,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#061014" />
              ) : (
                <Text
                  style={{
                    color: "#061014",
                    fontWeight: "900",
                    letterSpacing: 0.6,
                  }}
                >
                  Entrer dans la nuit
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ alignItems: "center", marginTop: 10 }}>
              <Text style={{ color: theme.colors.sub }}>
                Pas de compte ?{" "}
                <Link
                  href="/(auth)/register"
                  style={{ color: theme.colors.neon2 }}
                >
                  Inscription
                </Link>
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View
            style={{ alignItems: "center", marginTop: 12, marginBottom: 12 }}
          >
            <Text style={{ color: "#8b93a3", fontSize: 12 }}>
              Ouvert 20h → 4h •{" "}
              <Text
                onPress={() => Linking.openURL("tel:0603250723")}
                style={{ color: theme.colors.neon2, textDecorationLine: "underline" }}
              >
                06 03 25 07 23
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const inputStyle = {
  color: theme.colors.text,
  backgroundColor: "#0b0f16",
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
};

const eyeBtn = {
  position: "absolute" as const,
  right: 10,
  top: 10,
  padding: 6,
};

// hack TS RN
const StyleSheet = {
  absoluteFillObject: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};
