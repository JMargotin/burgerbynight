import { useCoupons } from "@/hooks/useCoupons";
import { useAuth } from "@/providers/AuthProvider";
import { useRefresh } from "@/providers/RefreshProvider";
import { theme } from "@/theme";
import type { Coupon } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

/* --------------------------------- Helpers UI --------------------------------- */

function Chip({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "danger" | "promo" | "reward";
}) {
  const map = {
    success: {
      bg: "rgba(34,197,94,0.18)",
      bd: "rgba(34,197,94,0.4)",
      fg: "#22C55E",
    },
    danger: {
      bg: "rgba(239,68,68,0.18)",
      bd: "rgba(239,68,68,0.4)",
      fg: "#EF4444",
    },
    promo: {
      bg: "rgba(255,77,157,0.18)",
      bd: "rgba(255,77,157,0.45)",
      fg: "#FF4D9D",
    },
    reward: {
      bg: "rgba(0,209,178,0.18)",
      bd: "rgba(0,209,178,0.45)",
      fg: "#00D1B2",
    },
    default: {
      bg: "rgba(255,255,255,0.18)",
      bd: "rgba(255,255,255,0.35)",
      fg: theme.colors.text,
    },
  } as const;
  const c = map[tone] ?? map.default;
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: c.bg,
        borderColor: c.bd,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
      }}
    >
      <Text style={{ color: c.fg, fontWeight: "800", fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>
        {title}
      </Text>
      <Text style={{ color: "#fbfbfb", fontSize: 12 }}>Fais glisser →</Text>
    </View>
  );
}

/** Carte carrée commune (promo/reward) */
function CouponSquare({
  coupon,
  onPress,
  muted = false,
}: {
  coupon: Coupon;
  onPress?: () => void;
  muted?: boolean;
}) {
  const isActive = coupon.status === "active";
  const isPromo = coupon.type === "promo";
  const statusColor = isActive ? theme.colors.success : "#ffb3b3";
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <View style={{ width: 150, gap: 8, opacity: muted ? 0.7 : 1 }}>
        <View
          style={{
            width: 150,
            height: 150,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.28)",
            backgroundColor: "#0b0f16",
          }}
        >
          <Image
            source={{
              uri:
                coupon.imageUrl ||
                "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop",
            }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          {/* Voile */}
          <View
            style={{
              position: "absolute",
              inset: 0 as any,
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
          />
          {/* Badge type */}
          <View style={{ position: "absolute", top: 8, left: 8 }}>
            <Chip
              label={isPromo ? "Promo" : "Gagné"}
              tone={isPromo ? "promo" : "reward"}
            />
          </View>
          {/* Contenu bas */}
          <View
            style={{ position: "absolute", left: 10, right: 10, bottom: 10 }}
          >
            <Text
              style={{ color: "#fff", fontWeight: "900" }}
              numberOfLines={1}
            >
              {coupon.title}
            </Text>
            <Text
              style={{
                color: isActive ? "#dbe2f2" : statusColor,
                fontWeight: isActive ? "600" : "700",
              }}
              numberOfLines={1}
            >
              {isActive
                ? `Code: ${coupon.code}`
                : `${coupon.status.toUpperCase()} • ${coupon.code}`}
            </Text>
          </View>

          {/* State overlay si non actif */}
          {!isActive && (
            <View
              style={{
                position: "absolute",
                inset: 0 as any,
                backgroundColor: "rgba(0,0,0,0.35)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                {coupon.status === "used" ? "Utilisé" : "Expiré"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/** Ligne action icône (close, copy, share) */
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

function EmptyCard({ text }: { text: string }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(5,7,10,0.25)",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.28)",
      }}
    >
      <Text style={{ color: "#fbfbfb" }}>{text}</Text>
    </View>
  );
}

/* --------------------------------- Screen --------------------------------- */

export default function UserCouponsScreen() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const { setRefreshCoupons } = useRefresh();

  const { loading, activeRewards, activePromos, historyAll, refreshCoupons } =
    useCoupons();

  const [showHistory, setShowHistory] = useState(false);

  // Modal QR
  const [qrVisible, setQrVisible] = useState(false);
  const [qrItem, setQrItem] = useState<Coupon | null>(null);

  // Enregistrer la fonction de rafraîchissement dans le contexte global
  useEffect(() => {
    setRefreshCoupons(refreshCoupons);
  }, [setRefreshCoupons, refreshCoupons]);

  function openQr(c: Coupon) {
    setQrItem(c);
    setQrVisible(true);
  }

  if (!uid) {
    return (
      <Centered>
        <Text style={{ color: theme.colors.text }}>
          Connecte-toi pour voir tes coupons.
        </Text>
      </Centered>
    );
  }

  if (loading) {
    return (
      <Centered>
        <ActivityIndicator />
      </Centered>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ gap: 6 }}>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>
          Mes coupons
        </Text>
        <Text style={{ color: "#fff" }}>
          Tes{" "}
          <Text style={{ color: "#fff", fontWeight: "700" }}>récompenses</Text>{" "}
          et <Text style={{ color: "#fff", fontWeight: "700" }}>promos</Text>{" "}
          actives, au même endroit.
        </Text>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
          <Chip label={`Gagnés: ${activeRewards.length}`} tone="reward" />
          <Chip label={`Promos: ${activePromos.length}`} tone="promo" />
          <Chip label={`Historique: ${historyAll.length}`} />
        </View>
      </View>

      {/* Actifs — Rewards */}
      <View style={{ gap: 10 }}>
        <SectionHeader title="Récompenses actives" />
        {activeRewards.length === 0 ? (
          <EmptyCard text="Aucune récompense active pour le moment." />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
          >
            {activeRewards.map((c) => (
              <CouponSquare key={c.id} coupon={c} onPress={() => openQr(c)} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Actifs — Promos */}
      <View style={{ gap: 10 }}>
        <SectionHeader title="Promos actives" />
        {activePromos.length === 0 ? (
          <EmptyCard text="Aucune promo active pour l’instant." />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
          >
            {activePromos.map((c) => (
              <CouponSquare key={c.id} coupon={c} onPress={() => openQr(c)} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Historique — toggle icône (pas de bouton texte) */}
      <Pressable
        onPress={() => setShowHistory((s) => !s)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          alignSelf: "flex-start",
          backgroundColor: "rgba(5,7,10,0.25)",
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Image
          source={{
            uri: showHistory
              ? "https://img.icons8.com/ios-filled/100/ffffff/collapse-arrow.png"
              : "https://img.icons8.com/ios-filled/100/ffffff/expand-arrow.png",
          }}
          style={{ width: 16, height: 16, tintColor: "#fff" }}
        />
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {showHistory ? "Masquer l’historique" : "Voir l’historique"}
        </Text>
      </Pressable>

      {showHistory && (
        <View style={{ gap: 10 }}>
          <SectionHeader title="Historique" />
          {historyAll.length === 0 ? (
            <EmptyCard text="Aucun coupon utilisé ou expiré." />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 4 }}
            >
              {historyAll.map((c) => (
                <CouponSquare
                  key={c.id}
                  coupon={c}
                  muted
                  onPress={() => openQr(c)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Modal QR — version verre dépoli + icônes (close/copy/share) */}
      <Modal
        visible={qrVisible}
        animationType="fade"
        onRequestClose={() => setQrVisible(false)}
        transparent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 18,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.28)",
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            <BlurView tint="light" intensity={28} style={{ padding: 18 }}>
              {/* Close icon (en haut à droite) */}
              <Pressable
                onPress={() => setQrVisible(false)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderColor: "rgba(255,255,255,0.35)",
                }}
              >
                <Ionicons name="close" color="#fff" size={24} />
              </Pressable>

              <View style={{ alignItems: "center", gap: 12 }}>
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}
                >
                  {qrItem?.title ?? "Coupon"}
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
                  {qrItem?.code ? (
                    <QRCode
                      value={qrItem.code}
                      size={220}
                      color="#000"
                      backgroundColor="#fff"
                    />
                  ) : null}
                </View>

                {!!qrItem?.code && (
                  <View style={{ alignItems: "center" }}>
                    <Chip
                      label={qrItem.code}
                      tone={qrItem?.status === "active" ? "success" : "default"}
                    />
                  </View>
                )}

                {/* Actions icônes (copy/share) */}
                <View style={{ flexDirection: "row", gap: 18, marginTop: 6 }}>
                  <IconAction
                    label="Copier"
                    iconUri="https://img.icons8.com/ios-filled/100/ffffff/copy.png"
                    onPress={async () => {
                      if (!qrItem?.code) return;
                      const { default: Clipboard } = await import(
                        "expo-clipboard"
                      );
                      await Clipboard.setStringAsync(qrItem.code);
                    }}
                  />
                  <IconAction
                    label="Partager"
                    iconUri="https://img.icons8.com/ios-filled/100/ffffff/share.png"
                    onPress={async () => {
                      if (!qrItem?.code) return;
                      const { Share } = await import("react-native");
                      try {
                        await Share.share({
                          message: `${qrItem.title} — Code: ${qrItem.code}`,
                        });
                      } catch {}
                    }}
                  />
                </View>
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* --------------------------------- Small bits --------------------------------- */

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
