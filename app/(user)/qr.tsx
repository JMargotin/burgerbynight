import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  Alert,
  Share,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@/providers/AuthProvider";
import { ensureCustomerCode } from "@/services";
import { theme } from "@/theme";

export default function UserQrScreen() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const [code, setCode] = useState<string | null>(
    profile?.customerCode ?? null
  );
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
    <View
      style={{
        flex: 1,
        padding: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(15,18,25,0.9)",
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 18,
          padding: 20,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 10,
        }}
      >
        <Text
          style={{
            color: theme.colors.neon,
            fontSize: 18,
            fontWeight: "900",
            marginBottom: 12,
          }}
        >
          Fais scanner ce QR pour récupérer tes points
        </Text>

        <View
          style={{
            backgroundColor: "#fff",
            padding: 12,
            borderRadius: 14,
          }}
        >
          <QRCode
            value={code}
            size={220}
            backgroundColor="#fff"
            color="#000"
            getRef={(c) => (qrRef.current = c)}
          />
        </View>

        <Text
          style={{
            color: theme.colors.sub,
            marginTop: 12,
            letterSpacing: 1,
          }}
        >
          {code}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Btn onPress={onCopy} label="Copier le code" variant="primary" />
        <Btn onPress={onShare} label="Partager" variant="alt" />
      </View>

      <Text
        style={{ color: theme.colors.sub, marginTop: 6, textAlign: "center" }}
      >
        Astuce: garde cet écran ouvert au moment de payer pour{" "}
        <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
          gagner tes points
        </Text>
        .
      </Text>
    </View>
  );
}

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

function Btn({
  label,
  onPress,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "alt";
}) {
  const bg = variant === "primary" ? theme.colors.neon : theme.colors.neon2;
  const fg = variant === "primary" ? "#061014" : "#20011e";
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: bg,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        shadowColor: bg,
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 3,
        minWidth: 140,
        alignItems: "center",
      }}
    >
      <Text style={{ color: fg, fontWeight: "900", letterSpacing: 0.4 }}>
        {label}
      </Text>
    </Pressable>
  );
}
