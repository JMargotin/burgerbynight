import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { theme } from "@/theme";
import { fetchCoupons } from "@/services";
import type { Coupon } from "@/types";

export default function UserHomeScreen() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const balance = profile?.balance ?? 0;
  const display = profile?.displayName || profile?.email || "Client";

  const [loading, setLoading] = useState(true);
  const [activeCoupons, setActiveCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!uid) return;
      setLoading(true);
      try {
        const cps = await fetchCoupons(uid);
        if (!mounted) return;
        setActiveCoupons(
          (cps || []).filter((c: any) => c.status === "active").slice(0, 6)
        );
      } finally {
        mounted = false;
        setLoading(false);
      }
    })();
    return () => {
      /* noop */
    };
  }, [uid]);

  const openState = useMemo(() => {
    const now = new Date();
    const h = now.getHours(); // INFO: 0..23 (timezone device)
    const isOpen = h >= 20 || h < 4;
    const next = isOpen ? "Ferme à 4h" : "Ouvre à 20h";
    return { isOpen, next };
  }, []);

  return (
    <ImageBackground
      source={require("../../assets/gta-bg.jpg")}
      resizeMode="cover"
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          backgroundColor: "rgba(5,7,10,0.65)",
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              color: theme.colors.neon2,
              fontSize: 36,
              fontWeight: "900",
              letterSpacing: 1.2,
              textShadowColor: theme.colors.neon2,
              textShadowRadius: 14,
            }}
          >
            Burger By Night
          </Text>
          <Text
            style={{ color: theme.colors.text, marginTop: 4, opacity: 0.95 }}
          >
            Salut {display} 👋
          </Text>
          <Text
            style={{
              color: openState.isOpen ? theme.colors.success : "#ffb3b3",
              marginTop: 6,
              fontWeight: "700",
            }}
          >
            {openState.isOpen ? "Ouvert maintenant" : "Fermé actuellement"} •{" "}
            {openState.next}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "rgba(15,18,25,0.9)",
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: theme.colors.sub, marginBottom: 6 }}>
            Ton solde
          </Text>
          <Text
            style={{
              color: theme.colors.neon2,
              fontSize: 40,
              fontWeight: "900",
              textShadowColor: theme.colors.neon2,
              textShadowRadius: 10,
            }}
          >
            {balance} pts
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <SmallButton
              label="Voir mes points"
              onPress={() => router.push("/(user)/points")}
            />
            <SmallButton
              label="Mon QR"
              onPress={() => router.push("/(user)/qr")}
              variant="alt"
            />
          </View>
        </View>

        <View
          style={{
            backgroundColor: "rgba(15,18,25,0.9)",
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 16,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 16,
              fontWeight: "800",
              marginBottom: 8,
            }}
          >
            Actions rapides
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <ActionTile
              title="Mon QR"
              subtitle="À faire scanner"
              onPress={() => router.push("/(user)/qr")}
              iconUri="https://img.icons8.com/ios-filled/100/ffffff/qr-code.png"
            />
            <ActionTile
              title="Mes points"
              subtitle="Historique & rewards"
              onPress={() => router.push("/(user)/points")}
              iconUri="https://img.icons8.com/ios-filled/100/ffffff/coins.png"
            />
            <ActionTile
              title="Mes coupons"
              subtitle="Utilisables"
              onPress={() => router.push("/(user)/coupons")}
              iconUri="https://img.icons8.com/ios-filled/100/ffffff/ticket.png"
            />
            <ActionTile
              title="Promos"
              subtitle="Espace promo"
              onPress={() => router.push("/(user)/promos")}
              iconUri="https://img.icons8.com/ios-filled/100/ffffff/discount.png"
            />
          </View>
        </View>

        <View
          style={{
            backgroundColor: "rgba(15,18,25,0.9)",
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 16,
            padding: 12,
          }}
        >
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 16,
              fontWeight: "800",
              marginBottom: 8,
            }}
          >
            Tes promos actives
          </Text>

          {loading ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator />
            </View>
          ) : activeCoupons.length === 0 ? (
            <Text style={{ color: theme.colors.sub }}>
              Aucune promo active pour le moment.
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {activeCoupons.map((c) => (
                <PromoCard
                  key={c.id}
                  title={c.title}
                  code={c.code}
                  onPress={() => router.push("/(user)/coupons")}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

/* ---------------------- UI sub-components ---------------------- */
function SmallButton({
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
        paddingVertical: 10,
        paddingHorizontal: 14,
        shadowColor: bg,
        shadowOpacity: 0.45,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 3,
      }}
    >
      <Text style={{ color: fg, fontWeight: "900", letterSpacing: 0.4 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function ActionTile({
  title,
  subtitle,
  iconUri,
  onPress,
}: {
  title: string;
  subtitle?: string;
  iconUri?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexGrow: 1,
        minWidth: "47%",
        backgroundColor: "#0b0f16",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {iconUri ? (
          <Image
            source={{ uri: iconUri }}
            style={{
              width: 22,
              height: 22,
              tintColor: theme.colors.text,
              opacity: 0.95,
            }}
          />
        ) : null}
        <Text style={{ color: theme.colors.text, fontWeight: "800" }}>
          {title}
        </Text>
      </View>
      {!!subtitle && (
        <Text style={{ color: theme.colors.sub, marginTop: 4, fontSize: 12 }}>
          {subtitle}
        </Text>
      )}
    </Pressable>
  );
}

function PromoCard({
  title,
  code,
  onPress,
}: {
  title: string;
  code?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        overflow: "hidden",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
      }}
    >
      <View style={{ height: 110 }}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1550317138-10000687a72b?q=80&w=1200&auto=format&fit=crop",
          }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 60,
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        />
        <View style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>{title}</Text>
          {!!code && (
            <Text style={{ color: "#dbe2f2", opacity: 0.9 }}>Code: {code}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
