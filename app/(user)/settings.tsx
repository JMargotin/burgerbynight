import { useAuth } from "@/providers/AuthProvider";
import { deleteUserAccount } from "@/services/user.service";
import { theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

function GlassCard({
  children,
  style,
}: React.PropsWithChildren<{ style?: any }>) {
  return (
    <View
      style={[
        {
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.28)",
          backgroundColor: "rgba(255,255,255,0.06)",
        },
        style,
      ]}
    >
      <BlurView tint="light" intensity={30} style={{ padding: 16 }}>
        {children}
      </BlurView>
    </View>
  );
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  destructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          padding: 16,
          backgroundColor: "rgba(5,7,10,0.25)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: destructive
            ? "rgba(239,68,68,0.3)"
            : "rgba(255,255,255,0.18)",
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: destructive
              ? "rgba(239,68,68,0.2)"
              : "rgba(255,255,255,0.15)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={icon}
            size={20}
            color={destructive ? "#EF4444" : "#fff"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: destructive ? "#EF4444" : "#fff",
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="rgba(255,255,255,0.5)"
        />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { profile, logout } = useAuth();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const display = profile?.displayName || profile?.email || "Client";
  const email = profile?.email || "";

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            // La redirection est automatique via le AuthProvider + index.tsx
          } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
            Alert.alert("Erreur", "Impossible de se déconnecter");
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (confirmText.toLowerCase() !== "supprimer") {
      Alert.alert(
        "Confirmation incorrecte",
        'Veuillez taper "SUPPRIMER" pour confirmer'
      );
      return;
    }

    setDeleting(true);
    try {
      if (!profile?.uid) {
        throw new Error("Utilisateur non connecté");
      }

      await deleteUserAccount(profile.uid);

      // Fermer la modal et rediriger
      setDeleteModalVisible(false);
      Alert.alert(
        "Compte supprimé",
        "Votre compte a été supprimé avec succès",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Erreur lors de la suppression du compte:", error);

      // Gérer les erreurs spécifiques de Firebase
      let errorMessage = "Impossible de supprimer le compte";
      if (error.code === "auth/requires-recent-login") {
        errorMessage =
          "Pour des raisons de sécurité, veuillez vous reconnecter avant de supprimer votre compte";
      }

      Alert.alert("Erreur", errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View>
          <Text
            style={{
              color: "#fff",
              fontSize: 32,
              fontWeight: "900",
              letterSpacing: 1,
            }}
          >
            Paramètres
          </Text>
          <Text
            style={{ color: theme.colors.text, marginTop: 4, opacity: 0.95 }}
          >
            Gérez votre compte et vos préférences
          </Text>
        </View>

        {/* Profil */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 14,
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Profil
          </Text>
          <GlassCard>
            <View style={{ gap: 12 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "rgba(34,197,94,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 28 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#10151b",
                      fontSize: 18,
                      fontWeight: "900",
                    }}
                  >
                    {display}
                  </Text>
                  <Text
                    style={{
                      color: "#2a3744",
                      fontSize: 14,
                    }}
                  >
                    {email}
                  </Text>
                </View>
              </View>
              {profile?.customerCode && (
                <View
                  style={{
                    padding: 12,
                    backgroundColor: "rgba(34,197,94,0.1)",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(34,197,94,0.3)",
                  }}
                >
                  <Text
                    style={{
                      color: "#10151b",
                      fontSize: 12,
                      fontWeight: "700",
                      marginBottom: 4,
                    }}
                  >
                    Code client
                  </Text>
                  <Text
                    style={{
                      color: "#10151b",
                      fontSize: 18,
                      fontWeight: "900",
                      fontFamily: "monospace",
                      letterSpacing: 2,
                    }}
                  >
                    {profile.customerCode}
                  </Text>
                </View>
              )}
            </View>
          </GlassCard>
        </View>

        {/* Actions */}
        <View style={{ gap: 12 }}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 14,
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Actions
          </Text>

          <SettingItem
            icon="log-out-outline"
            title="Déconnexion"
            subtitle="Se déconnecter de votre compte"
            onPress={handleLogout}
          />

          <SettingItem
            icon="trash-outline"
            title="Supprimer mon compte"
            subtitle="Supprimer définitivement votre compte et toutes vos données"
            onPress={() => setDeleteModalVisible(true)}
            destructive
          />
        </View>

        {/* Info */}
        <View
          style={{
            padding: 16,
            backgroundColor: "rgba(59,130,246,0.1)",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(59,130,246,0.3)",
          }}
        >
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text
              style={{
                flex: 1,
                color: "rgba(255,255,255,0.9)",
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              La suppression de votre compte est définitive et entraînera la
              perte de tous vos points, coupons et participations aux concours.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setDeleteModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#1a1f2e",
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 400,
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.3)",
            }}
          >
            <View
              style={{
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "rgba(239,68,68,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="warning" size={32} color="#EF4444" />
              </View>

              <Text
                style={{
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: "900",
                  marginBottom: 8,
                }}
              >
                Supprimer le compte
              </Text>

              <Text
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 14,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Cette action est irréversible. Toutes vos données seront
                définitivement supprimées.
              </Text>
            </View>

            <View style={{ gap: 16, marginBottom: 20 }}>
              <View
                style={{
                  padding: 12,
                  backgroundColor: "rgba(239,68,68,0.1)",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(239,68,68,0.3)",
                }}
              >
                <Text
                  style={{
                    color: "#EF4444",
                    fontSize: 13,
                    fontWeight: "600",
                    marginBottom: 4,
                  }}
                >
                  ⚠️ Données qui seront supprimées :
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                  • Votre profil et informations personnelles{"\n"}• Tous vos
                  points accumulés{"\n"}• Tous vos coupons et promotions{"\n"}•
                  Vos participations aux concours
                </Text>
              </View>

              <View>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Pour confirmer, tapez "SUPPRIMER" ci-dessous :
                </Text>
                <TextInput
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder="Tapez SUPPRIMER"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoCapitalize="characters"
                  editable={!deleting}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: 14,
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "600",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.2)",
                  }}
                />
              </View>
            </View>

            <View style={{ gap: 12 }}>
              <Pressable
                onPress={handleDeleteAccount}
                disabled={deleting || confirmText.toLowerCase() !== "supprimer"}
                style={{
                  backgroundColor:
                    confirmText.toLowerCase() === "supprimer"
                      ? "#EF4444"
                      : "rgba(239,68,68,0.3)",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: "800",
                    }}
                  >
                    Supprimer définitivement
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setDeleteModalVisible(false);
                  setConfirmText("");
                }}
                disabled={deleting}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Annuler
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
