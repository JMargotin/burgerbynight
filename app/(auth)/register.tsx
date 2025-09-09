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
} from "react-native";
import { Link, router } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { theme } from "@/theme";

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
      source={require("../../assets/gta-bg.jpg")}
      resizeMode="cover"
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
              Inscription
            </Text>

            <View style={{ gap: 6 }}>
              <Text style={{ color: theme.colors.sub, fontSize: 12 }}>
                Nom d’affichage
              </Text>
              <TextInput
                placeholder="Franklin, Michael..."
                placeholderTextColor="#6f7a8a"
                value={displayName}
                onChangeText={setDisplayName}
                style={inputStyle}
              />
            </View>

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
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ color: theme.colors.sub, fontSize: 12 }}>
                Mot de passe
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#6f7a8a"
                  secureTextEntry={!show1}
                  value={pass}
                  onChangeText={setPass}
                  style={[inputStyle, { paddingRight: 42 }]}
                />
                <TouchableOpacity
                  onPress={() => setShow1((s) => !s)}
                  style={eyeBtn}
                >
                  <Text style={{ color: theme.colors.sub }}>
                    {show1 ? "Masquer" : "Voir"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ color: theme.colors.sub, fontSize: 12 }}>
                Confirmer
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#6f7a8a"
                  secureTextEntry={!show2}
                  value={confirm}
                  onChangeText={setConfirm}
                  style={[inputStyle, { paddingRight: 42 }]}
                />
                <TouchableOpacity
                  onPress={() => setShow2((s) => !s)}
                  style={eyeBtn}
                >
                  <Text style={{ color: theme.colors.sub }}>
                    {show2 ? "Masquer" : "Voir"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={onRegister}
              disabled={loading}
              style={{
                marginTop: 8,
                backgroundColor: theme.colors.neon2,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                shadowColor: theme.colors.neon2,
                shadowOpacity: 0.6,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 0 },
                elevation: 4,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#20011e" />
              ) : (
                <Text
                  style={{
                    color: "#20011e",
                    fontWeight: "900",
                    letterSpacing: 0.6,
                  }}
                >
                  Démarrer l’aventure
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ alignItems: "center", marginTop: 10 }}>
              <Text style={{ color: theme.colors.sub }}>
                Déjà un compte ?{" "}
                <Link href="/(auth)/login" style={{ color: theme.colors.neon2 }}>
                  Connexion
                </Link>
              </Text>
            </View>
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
