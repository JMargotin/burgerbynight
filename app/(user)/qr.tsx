import { useAuth } from "@/providers/AuthProvider";
import { ensureCustomerCode } from "@/services";
import { theme } from "@/theme";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

/* ---------------- UI helpers ---------------- */
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {children}
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View
      style={{
        alignSelf: "center",
        backgroundColor: "rgba(255,255,255,0.18)",
        borderColor: "rgba(255,255,255,0.35)",
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        marginTop: 8,
      }}
    >
      <Text
        selectable
        style={{ color: theme.colors.text, fontWeight: "800", letterSpacing: 1 }}
      >
        {label}
      </Text>
    </View>
  );
}

/** Icône action (pas de "bouton" texte) */
function IconAction({
  label,
  iconUri,
  onPress,
}: {
  label: string;
  iconUri: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", gap: 6 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.2)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.35)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={{ uri: iconUri }}
          style={{ width: 24, height: 24, tintColor: "#fff" }}
        />
      </View>
      <Text style={{ color: theme.colors.text, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

/* ---------------- Screen ---------------- */
export default function UserQrScreen() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const display = profile?.displayName || profile?.email || "Client";

  const [code, setCode] = useState<string | null>(profile?.customerCode ?? null);
  const [loading, setLoading] = useState(false);
  const qrRef = useRef<QRCode | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!uid) return;
      if (profile?.customerCode) {
        setCode(profile.customerCode);
        return;
      }
      try {
        setLoading(true);
        const newCode = await ensureCustomerCode(uid);
        if (mounted) setCode(newCode);
      } catch (e: any) {
        Alert.alert("Impossible de générer le QR", e?.message ?? "Erreur");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [uid, profile?.customerCode]);

  async function onCopy() {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Alert.alert("Copié", "Ton code a été copié dans le presse-papiers.");
  }

  async function onShare() {
    if (!code) return;
    try {
      await Share.share({
        message: `Mon code client Burger By Night : ${code}`,
      });
    } catch {
      // noop
    }
  }

  if (!uid) {
    return (
      <Centered>
        <Text style={{ color: theme.colors.text }}>
          Connecte-toi pour voir ton QR.
        </Text>
      </Centered>
    );
  }

  if (loading || !code) {
    return (
      <Centered>
        <ActivityIndicator />
        <Text style={{ color: theme.colors.sub, marginTop: 8 }}>
          Préparation de ton QR…
        </Text>
      </Centered>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header (même style que Home) */}
      <View style={{ marginBottom: 2 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 36,
            fontWeight: "900",
            letterSpacing: 1.2,
          }}
        >
          Mon QR
        </Text>
        <Text style={{ color: theme.colors.text, marginTop: 4, opacity: 0.95 }}>
          Salut {display} 👋
        </Text>
      </View>

      {/* Card sombre type "Solde" */}
      <View
        style={{
          backgroundColor: "rgba(5,7,10,0.25)",
          borderRadius: 16,
          padding: 16,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          alignItems: "center",
          gap: 12,
        }}
      >
        <Text
          style={{
            color: "#fbfbfb",
            fontSize: 14,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Fais scanner ce QR pour récupérer tes points
        </Text>

        <View
          style={{
            backgroundColor: "#fff",
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.08)",
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 10,
          }}
        >
          <QRCode
            value={code}
            size={240}
            backgroundColor="#fff"
            color="#000"
            getRef={(c) => (qrRef.current = c)}
          />
        </View>

        <Chip label={code} />

        {/* Barre d’actions -> icônes uniquement */}
        <View style={{ flexDirection: "row", gap: 18, marginTop: 6 }}>
          <IconAction
            label="Copier"
            onPress={onCopy}
            iconUri="https://img.icons8.com/ios-filled/100/ffffff/copy.png"
          />
          <IconAction
            label="Partager"
            onPress={onShare}
            iconUri="https://img.icons8.com/ios-filled/100/ffffff/share.png"
          />
        </View>

        <Text style={{ color: theme.colors.sub, marginTop: 8, textAlign: "center" }}>
          Astuce: garde cet écran ouvert au moment de payer pour{" "}
          <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
            gagner tes points
          </Text>
          .
        </Text>
      </View>
    </ScrollView>
  );
}
