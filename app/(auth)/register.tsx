import { auth } from "@/lib/firebase";
import { theme } from "@/theme";
import { BlurView } from "expo-blur";
import { Link, router } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onRegister() {
    if (!displayName.trim())
      return Alert.alert("Nom requis", "Choisis un nom.");
    if (pass !== confirm)
      return Alert.alert("Mismatch", "Les mots de passe ne correspondent pas.");
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        pass
      );
      await updateProfile(cred.user, { displayName: displayName.trim() });
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Inscription impossible", e?.message ?? "Erreur");
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
      <View
        style={{
          ...(StyleSheet.absoluteFillObject as any),
          backgroundColor: "rgba(5,7,10,0.65)",
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
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
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{
                color: theme.colors.neon2,
                fontSize: 38,
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
              Crée ton compte & gagne des points de fidélité
            </Text>
          </View>

          <View
            style={{
              borderRadius: 20,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              backgroundColor: "rgba(255,255,255,0.05)",
              shadowColor: "#22C55E",
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
                  Inscription
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 14,
                    marginTop: 4,
                  }}
                >
                  Crée ton compte et gagne des points
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  👤 Nom d'affichage
                </Text>
                <TextInput
                  placeholder="Votre nom d'affichage"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={inputStyle}
                  returnKeyType="next"
                />
              </View>

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
                    secureTextEntry={!show1}
                    value={pass}
                    onChangeText={setPass}
                    style={[inputStyle, { paddingRight: 50 }]}
                    returnKeyType="next"
                  />
                  <Pressable onPress={() => setShow1((s) => !s)} style={eyeBtn}>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {show1 ? "👁️" : "👁️‍🗨️"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  ✅ Confirmer le mot de passe
                </Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry={!show2}
                    value={confirm}
                    onChangeText={setConfirm}
                    style={[inputStyle, { paddingRight: 50 }]}
                    returnKeyType="go"
                    onSubmitEditing={onRegister}
                  />
                  <Pressable onPress={() => setShow2((s) => !s)} style={eyeBtn}>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {show2 ? "👁️" : "👁️‍🗨️"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={onRegister}
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
                    🎉 Démarrer l'aventure
                  </Text>
                )}
              </Pressable>

              <View style={{ alignItems: "center", marginTop: 16 }}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                  Déjà un compte ?{" "}
                  <Link
                    href="/(auth)/login"
                    style={{
                      color: "#22C55E",
                      fontWeight: "700",
                      textDecorationLine: "underline",
                    }}
                  >
                    Se connecter
                  </Link>
                </Text>
              </View>
            </BlurView>
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
