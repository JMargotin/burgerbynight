import { usePoints } from "@/hooks/usePoints";
import { useAuth } from "@/providers/AuthProvider";
import { useRefresh } from "@/providers/RefreshProvider";
import { claimReward } from "@/services";
import { Reward } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Palette claire avec accents Vice City
const ui = {
  bg: "transparent", // l'image sert de fond
  card: "rgba(255,255,255,0.82)",
  border: "rgba(255,255,255,0.35)",
  text: "#1B1F24",
  sub: "#53616E",
  accent: "#FF4D9D", // rose Vice City
  chip: "rgba(255,255,255,0.6)",
} as const;

const accentFor = (cost?: number) =>
  cost && cost <= 30 ? "#00D1B2" : ui.accent;

const rewards: (Reward & { image: string; subtitle?: string })[] = [
  {
    id: "livraison",
    title: "Livraison",
    pointsCost: 20,
    image:
      "https://imgs.search.brave.com/qlFWYwh0_vt_0dGtIsK20EG9lUd1m-V3TdtWp9Nqw48/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzU2LzI2LzU5/LzM2MF9GXzU2MjY1/OTU1X1Q3cHJXTDAy/dUlqSU0wZWZJcndN/M3pMNTJjZUp5NU5J/LmpwZw",
    subtitle: "À partir de 10€",
  },
  {
    id: "boisson",
    title: "Canette",
    pointsCost: 20,
    image:
      "https://www.myamericanshop.com/cdn/shop/products/fanta-grape-049000014242-31792001548451.jpg?v=1704729911&width=700",
    subtitle: "Soft 33cl",
  },
  {
    id: "dessert",
    title: "Dessert",
    pointsCost: 45,
    image:
      "https://cn-geo1.uber.com/image-proc/resize/eats/format=webp/width=550/height=440/quality=70/srcb64=aHR0cHM6Ly90Yi1zdGF0aWMudWJlci5jb20vcHJvZC9pbWFnZS1wcm9jL3Byb2Nlc3NlZF9pbWFnZXMvZDc1NjhmZGVlYzU4NmUyZGJjMjA4NThkOTFhMTc1NzYvNzBhYTJhNGRiN2Y5OTAzNzNjYTljMzc2MzIzZTNkZWEuanBlZw==",
    subtitle: "Tiramisu au choix",
  },
  {
    id: "kinder",
    title: "Kinder Bueno",
    pointsCost: 45,
    image:
      "https://cn-geo1.uber.com/image-proc/resize/eats/format=webp/width=550/height=440/quality=70/srcb64=aHR0cHM6Ly90Yi1zdGF0aWMudWJlci5jb20vcHJvZC9pbWFnZS1wcm9jL3Byb2Nlc3NlZF9pbWFnZXMvMzU4NDRhMmIwNGZhZWI0MmRlNDg3NGE2NTI3OTRmOWIvNzBhYTJhNGRiN2Y5OTAzNzNjYTljMzc2MzIzZTNkZWEuanBlZw==",
    subtitle: "Bueno ou White",
  },
  {
    id: "burger",
    title: "Burger",
    pointsCost: 60,
    image:
      "https://cn-geo1.uber.com/image-proc/resize/eats/format=webp/width=550/height=440/quality=70/srcb64=aHR0cHM6Ly90Yi1zdGF0aWMudWJlci5jb20vcHJvZC9pbWFnZS1wcm9jL3Byb2Nlc3NlZF9pbWFnZXMvYmU1MDgzMmQ0OTI2OWYzMGRjMDhkZjAwNTU0YmQ5MjkvNzBhYTJhNGRiN2Y5OTAzNzNjYTljMzc2MzIzZTNkZWEuanBlZw==",
    subtitle: "Burger au choix (Big Mac ou Crispy uniquement)",
  },
  {
    id: "grand-tira",
    title: "Grand Tiramisu",
    pointsCost: 75,
    image:
      "https://cn-geo1.uber.com/image-proc/resize/eats/format=webp/width=550/height=440/quality=70/srcb64=aHR0cHM6Ly90Yi1zdGF0aWMudWJlci5jb20vcHJvZC9pbWFnZS1wcm9jL3Byb2Nlc3NlZF9pbWFnZXMvZDc1NjhmZGVlYzU4NmUyZGJjMjA4NThkOTFhMTc1NzYvNzBhYTJhNGRiN2Y5OTAzNzNjYTljMzc2MzIzZTNkZWEuanBlZw==",
    subtitle: "Tiramisu au choix",
  },
  {
    id: "tacos",
    title: "Tacos",
    pointsCost: 75,
    image:
      "https://cn-geo1.uber.com/image-proc/resize/eats/format=webp/width=550/height=440/quality=70/srcb64=aHR0cHM6Ly90Yi1zdGF0aWMudWJlci5jb20vcHJvZC9pbWFnZS1wcm9jL3Byb2Nlc3NlZF9pbWFnZXMvMjhmYjljOTI0ZTkyMDljMTFlMzA2Y2U4NjQ5OTY4MjIvNzBhYTJhNGRiN2Y5OTAzNzNjYTljMzc2MzIzZTNkZWEuanBlZw==",
    subtitle: "Tacos au choix",
  },
  {
    id: "formule1",
    title: "2 Burgers + 1 Canette",
    pointsCost: 120,
    image:
      "https://cn-geo1.uber.com/image-proc/resize/eats/format=webp/width=550/height=440/quality=70/srcb64=aHR0cHM6Ly90Yi1zdGF0aWMudWJlci5jb20vcHJvZC9pbWFnZS1wcm9jL3Byb2Nlc3NlZF9pbWFnZXMvNDAyMzRjYWJmMDIzMTRkZDNhODlhMDFhMmMwZmYzN2MvNThmNjkxZGE5ZWFlZjg2YjBiNTFmOWIyYzQ4M2ZlNjMuanBlZw==",
    subtitle:
      "2 Burgers au choix (Big Mac ou Crispy uniquement) + 1 Canette au choix",
  },
  {
    id: "formule2",
    title: "2 Burgers + 1 Canette + 1 Dessert",
    pointsCost: 150,
    image:
      "https://cn-geo1.uber.com/image-proc/resize/eats/format=webp/width=550/height=440/quality=70/srcb64=aHR0cHM6Ly90Yi1zdGF0aWMudWJlci5jb20vcHJvZC9pbWFnZS1wcm9jL3Byb2Nlc3NlZF9pbWFnZXMvMTcwNmI3NmE2YTM2ZmJjODQzZjFlNDI1OWEwY2Y3ZTcvNzBhYTJhNGRiN2Y5OTAzNzNjYTljMzc2MzIzZTNkZWEuanBlZw==",
    subtitle: "2 Burgers au choix + 1 Canette au choix + 1 Dessert au choix",
  },
  {
    id: "formule3",
    title: "Tacos + 1 Canette",
    pointsCost: 150,
    image:
      "https://cn-geo1.uber.com/image-proc/resize/eats/format=webp/width=550/height=440/quality=70/srcb64=aHR0cHM6Ly90Yi1zdGF0aWMudWJlci5jb20vcHJvZC9pbWFnZS1wcm9jL3Byb2Nlc3NlZF9pbWFnZXMvODg3YjNiNmQzNmE1MzhlY2YzNjk5Njk0OWQ4ZWM0MzYvNzBhYTJhNGRiN2Y5OTAzNzNjYTljMzc2MzIzZTNkZWEuanBlZw==",
    subtitle: "Tacos au choix + 1 Canette au choix",
  },
];

export default function PointsScreen() {
  const { profile } = useAuth();
  const uid = profile?.uid!;
  const { refreshCoupons, refreshPoints } = useRefresh();

  const {
    loading,
    transactions: tx,
    balance,
    error,
    refreshTransactions,
  } = usePoints();

  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal de détail de récompense
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<
    (Reward & { image: string; subtitle?: string }) | null
  >(null);

  // Sections par palier de points
  const sections = useMemo(() => {
    const map = new Map<number, typeof rewards>();
    for (const r of rewards) {
      const k = r.pointsCost || 0;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([cost, items]) => ({ cost, items }));
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refreshTransactions();
    } finally {
      setRefreshing(false);
    }
  }

  function onRewardPress(r: Reward & { image: string; subtitle?: string }) {
    console.log("🎯 Récompense sélectionnée:", {
      title: r.title,
      image: r.image,
    });
    setSelectedReward(r);
    setModalVisible(true);
  }

  async function onClaim(r: Reward) {
    if (!uid) return;
    if ((r.pointsCost || 0) > balance) {
      Alert.alert(
        "Points insuffisants",
        "Tu n'as pas assez de points pour cet article."
      );
      return;
    }
    try {
      setClaimingId(r.id || r.title);
      console.log("🚀 Avant claimReward:", { title: r.title, image: r.image });
      const coupon = await claimReward(uid, r);
      console.log("✅ Coupon créé:", {
        title: coupon.title,
        imageUrl: coupon.imageUrl,
      });
      Alert.alert("Récompense réclamée", `Coupon créé: ${coupon.title}`);

      // Rafraîchir les points et les coupons
      await Promise.all([refreshTransactions(), refreshCoupons()]);

      // Fermer la modal
      setModalVisible(false);
      setSelectedReward(null);
    } catch (e: any) {
      Alert.alert(
        "Erreur",
        e?.message ?? "Impossible de réclamer cet article."
      );
    } finally {
      setClaimingId(null);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "transparent" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {!!error && (
        <View
          style={{
            backgroundColor: "rgba(255, 61, 87, 0.18)",
            borderColor: "rgba(255, 61, 87, 0.5)",
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            Une erreur est survenue
          </Text>
          <Text style={{ color: "#fbfbfb", marginTop: 4 }}>{error}</Text>
        </View>
      )}
      {/* Solde */}
      <View
        style={{
          backgroundColor: "rgba(5,7,10,0.25)",
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        }}
      >
        <View style={{ gap: 6 }}>
          <Text style={{ color: "#fbfbfb", fontSize: 13 }}>Solde points</Text>
          <Text style={{ color: "#fff", fontSize: 36, fontWeight: "900" }}>
            {balance} pts
          </Text>
          <Text style={{ color: "#fbfbfb", fontSize: 13 }}>
            Cumule des points à chaque commande.
          </Text>
        </View>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 999,
            backgroundColor: ui.chip,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: ui.border,
          }}
        >
          <Text style={{ color: ui.text, fontSize: 22 }}>★</Text>
        </View>
      </View>

      {/* Sections horizontales */}
      {sections.map(({ cost, items }) => (
        <View key={String(cost)} style={{ gap: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>
              {cost} pts
            </Text>
            <Text style={{ color: "#fbfbfb", fontSize: 12 }}>
              Fais glisser →
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
          >
            {items.map((r) => {
              const disabled =
                (r.pointsCost || 0) > balance || claimingId != null;
              const claiming = claimingId === (r.id || r.title);
              return (
                <SquareRewardCard
                  key={r.id || r.title}
                  reward={r}
                  disabled={disabled}
                  claiming={claiming}
                  onClaim={() => onRewardPress(r)}
                />
              );
            })}
          </ScrollView>
        </View>
      ))}

      {/* Historique des transactions */}
      <View style={{ gap: 12 }}>
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>
          Historique récent
        </Text>
        {tx.length === 0 ? (
          <View
            style={{
              backgroundColor: "rgba(5,7,10,0.25)",
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: ui.border,
            }}
          >
            <Text style={{ color: "#fbfbfb" }}>
              Pas encore de transactions de points.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {tx.map((t) => {
              const value = t.delta ?? 0;
              const positive = value >= 0;
              let dateStr = "";
              try {
                const d =
                  t.createdAt && typeof t.createdAt.toDate === "function"
                    ? t.createdAt.toDate()
                    : new Date(t.createdAt || Date.now());
                dateStr = d.toLocaleString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "short",
                });
              } catch {
                dateStr = "";
              }
              return (
                <View
                  key={t.id || `${t.createdAt}-${t.delta}`}
                  style={{
                    backgroundColor: "rgba(5,7,10,0.25)",
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: ui.border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      style={{ color: "#fff", fontWeight: "700" }}
                      numberOfLines={1}
                    >
                      {t.reason ||
                        (positive ? "Points gagnés" : "Points dépensés")}
                    </Text>
                    {!!dateStr && (
                      <Text style={{ color: "#fbfbfb", fontSize: 12 }}>
                        {dateStr}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={{
                      color: positive ? "#22C55E" : ui.accent,
                      fontWeight: "900",
                      fontSize: 16,
                    }}
                  >
                    {positive ? "+" : ""}
                    {value}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Modal de détail de récompense */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
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
              maxWidth: 400,
              borderRadius: 18,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.28)",
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            <BlurView tint="light" intensity={28} style={{ padding: 20 }}>
              {/* Bouton fermer */}
              <Pressable
                onPress={() => setModalVisible(false)}
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
                  zIndex: 1,
                }}
              >
                <Ionicons name="close" color="#fff" size={24} />
              </Pressable>

              <View style={{ alignItems: "center", gap: 16 }}>
                {/* Image */}
                <View
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 16,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.28)",
                  }}
                >
                  <Image
                    source={{ uri: selectedReward?.image }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>

                {/* Titre */}
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 24,
                    fontWeight: "900",
                    textAlign: "center",
                  }}
                >
                  {selectedReward?.title}
                </Text>

                {/* Description */}
                {selectedReward?.subtitle && (
                  <Text
                    style={{
                      color: "#fbfbfb",
                      fontSize: 16,
                      textAlign: "center",
                      lineHeight: 22,
                    }}
                  >
                    {selectedReward.subtitle}
                  </Text>
                )}

                {/* Prix en points */}
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.35)",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: "800",
                    }}
                  >
                    {selectedReward?.pointsCost} pts
                  </Text>
                </View>

                {/* Bouton réclamer */}
                <TouchableOpacity
                  onPress={() => selectedReward && onClaim(selectedReward)}
                  disabled={
                    claimingId != null ||
                    (selectedReward?.pointsCost || 0) > balance
                  }
                  style={{
                    backgroundColor:
                      (selectedReward?.pointsCost || 0) > balance
                        ? "rgba(239,68,68,0.3)"
                        : "rgba(34,197,94,0.3)",
                    borderWidth: 1,
                    borderColor:
                      (selectedReward?.pointsCost || 0) > balance
                        ? "rgba(239,68,68,0.5)"
                        : "rgba(34,197,94,0.5)",
                    borderRadius: 12,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    minWidth: 200,
                    alignItems: "center",
                    opacity: claimingId != null ? 0.6 : 1,
                  }}
                >
                  {claimingId === selectedReward?.id ||
                  claimingId === selectedReward?.title ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: "800",
                      }}
                    >
                      {(selectedReward?.pointsCost || 0) > balance
                        ? "Points insuffisants"
                        : "Réclamer"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/** Carte carrée — slider item */
function SquareRewardCard({
  reward,
  disabled,
  claiming,
  onClaim,
}: {
  reward: Reward & { image: string; subtitle?: string };
  disabled: boolean;
  claiming: boolean;
  onClaim: () => void;
}) {
  return (
    <TouchableOpacity disabled={disabled} onPress={onClaim}>
      <View style={{ width: 150, height: 220, gap: 8 }}>
        <View
          style={{
            width: 150,
            height: 150,
            borderRadius: 16,
            overflow: "hidden",
            opacity: disabled && !claiming ? 0.5 : 1,
          }}
        >
          <Image
            source={{ uri: reward.image }}
            resizeMode="cover"
            style={{ width: "100%", height: "100%" }}
          />
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              backgroundColor: "rgba(255,255,255,0.9)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.7)",
            }}
          >
            <Text style={{ color: ui.text, fontWeight: "800", fontSize: 12 }}>
              {reward.pointsCost} pts
            </Text>
          </View>
          {disabled && (
            <View
              style={{
                position: "absolute",
                inset: 0 as any,
                backgroundColor: "rgba(0,0,0,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {claiming ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Indisponible
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={{ gap: 6 }}>
          <Text
            numberOfLines={1}
            style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
          >
            {reward.title}
          </Text>
          {!!reward.subtitle && (
            <Text numberOfLines={1} style={{ color: "#fbfbfb", fontSize: 12 }}>
              {reward.subtitle}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
