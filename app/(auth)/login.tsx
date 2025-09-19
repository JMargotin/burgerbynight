// app/(auth)/login.tsx
import { auth } from "@/lib/firebase";
import { theme } from "@/theme";
import { BlurView } from "expo-blur";
import { Link, router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

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
      source={require("../../assets/gta-bg.png")}
      resizeMode="cover"
      blurRadius={12}
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
              borderRadius: 20,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              backgroundColor: "rgba(255,255,255,0.05)",
              shadowColor: theme.colors.neon2,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <BlurView
              tint="dark"
              intensity={20}
              style={{ padding: 20, gap: 16 }}
            >
              <View style={{ alignItems: "center", marginBottom: 8 }}>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 24,
                    fontWeight: "900",
                    letterSpacing: 0.5,
                  }}
                >
                  Connexion
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 14,
                    marginTop: 4,
                  }}
                >
                  Accède à ton compte
                </Text>
              </View>

              {/* Email */}
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  📧 Email
                </Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    placeholder="Votre adresse email"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    style={inputStyle}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Mot de passe */}
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  🔒 Mot de passe
                </Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry={!show}
                    value={pass}
                    onChangeText={setPass}
                    style={[inputStyle, { paddingRight: 50 }]}
                    returnKeyType="go"
                    onSubmitEditing={onLogin}
                  />
                  <Pressable onPress={() => setShow((s) => !s)} style={eyeBtn}>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {show ? "👁️" : "👁️‍🗨️"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Bouton */}
              <Pressable
                onPress={onLogin}
                disabled={loading}
                style={{
                  marginTop: 8,
                  backgroundColor: loading ? "rgba(34,197,94,0.5)" : "#22C55E",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  shadowColor: "#22C55E",
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                  transform: [{ scale: loading ? 0.98 : 1 }],
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "900",
                      fontSize: 16,
                      letterSpacing: 0.5,
                    }}
                  >
                    🚀 Entrer dans la nuit
                  </Text>
                )}
              </Pressable>

              <View style={{ alignItems: "center", marginTop: 16 }}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                  Pas de compte ?{" "}
                  <Link
                    href="/(auth)/register"
                    style={{
                      color: "#22C55E",
                      fontWeight: "700",
                      textDecorationLine: "underline",
                    }}
                  >
                    Créer un compte
                  </Link>
                </Text>
              </View>
            </BlurView>
          </View>

          {/* Footer */}
          <View
            style={{ alignItems: "center", marginTop: 12, marginBottom: 12 }}
          >
            <Text style={{ color: "#8b93a3", fontSize: 12 }}>
              Ouvert 20h → 4h •{" "}
              <Text
                onPress={() => Linking.openURL("tel:0603250723")}
                style={{
                  color: theme.colors.neon2,
                  textDecorationLine: "underline",
                }}
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
  color: "#fff",
  backgroundColor: "rgba(255,255,255,0.1)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.2)",
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
};

const eyeBtn = {
  position: "absolute" as const,
  right: 12,
  top: 12,
  padding: 8,
  borderRadius: 8,
  backgroundColor: "rgba(255,255,255,0.1)",
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
