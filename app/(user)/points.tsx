
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
} from "react-native";
import { useAuth } from "@/providers/AuthProvider";
import { theme } from "@/theme";
import { fetchPointTransactions, claimReward } from "@/services";
import { Reward, PointTx } from "@/types";

const rewards: (Reward & { image: string; subtitle?: string })[] = [
  {
    id: "burger",
    title: "Burger Offert",
    pointsCost: 80,
    image:
      "https://images.unsplash.com/photo-1550317138-10000687a72b?q=80&w=1200&auto=format&fit=crop",
    subtitle: "Pain brioché, steak 150g, cheddar",
  },
  {
    id: "tacos",
    title: "Tacos Offert",
    pointsCost: 100,
    image:
      "https://images.unsplash.com/photo-1550317138-10000687a72b?q=80&w=1200&auto=format&fit=crop",
    subtitle: "Généreux, sauce fromagère maison",
  },
  {
    id: "tiramisu",
    title: "Tiramisu Offert",
    pointsCost: 40,
    image:
      "https://images.unsplash.com/photo-1550317138-10000687a72b?q=80&w=1200&auto=format&fit=crop",
    subtitle: "Classique cacao • Portion généreuse",
  },
  {
    id: "boisson",
    title: "Boisson Offerte",
    pointsCost: 20,
    image:
      "https://images.unsplash.com/photo-1550317138-10000687a72b?q=80&w=1200&auto=format&fit=crop",
    subtitle: "Soft 33cl au choix",
  },
];

export default function PointsScreen() {
  const { profile } = useAuth();
  const uid = profile?.uid!;
  const balance = profile?.balance ?? 0;

  const [loading, setLoading] = useState(true);
  const [tx, setTx] = useState<PointTx[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!uid) return;
    setLoading(true);
    try {
      const list = await fetchPointTransactions(uid, 100);
      setTx(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [uid]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
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
      const coupon = await claimReward(uid, r);
      Alert.alert("Récompense réclamée", `Coupon créé: ${coupon.title}`);
      await load();
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
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

return (
  <FlatList
    data={tx}
    keyExtractor={(item, i) => String(i)}
    contentContainerStyle={{ padding: theme.pad, gap: 8, paddingBottom: 100 }}
    refreshing={refreshing}
    onRefresh={onRefresh}
    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
    ListHeaderComponent={
      <View style={{ gap: 18 }}>
        <View
          style={{
            backgroundColor: "rgba(15,18,25,0.9)",
            padding: theme.pad,
            borderRadius: theme.radius,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text style={{ color: theme.colors.sub, marginBottom: 6 }}>
            Solde points
          </Text>
          <Text
            style={{
              color: theme.colors.neon,
              fontSize: 40,
              fontWeight: "900",
              textShadowColor: theme.colors.neon,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 12,
            }}
          >
            {balance} pts
          </Text>
          <Text style={{ color: theme.colors.sub, marginTop: 6 }}>
            Plus tu commandes, plus tu gagnes de points.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 18,
              fontWeight: "800",
            }}
          >
            Récompenses
          </Text>

          {rewards.map((r) => {
            const disabled =
              (r.pointsCost || 0) > balance || claimingId != null;
            return (
              <View
                key={r.id || r.title}
                style={{
                  overflow: "hidden",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.card,
                }}
              >
                <View style={{ height: 160, width: "100%" }}>
                  <Image
                    source={{ uri: r.image }}
                    resizeMode="cover"
                    style={{ width: "100%", height: "100%" }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      height: 80,
                      backgroundColor: "rgba(0,0,0,0.35)",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: 14,
                      right: 14,
                      top: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.colors.text,
                        fontSize: 18,
                        fontWeight: "900",
                        textShadowColor: "#000",
                        textShadowRadius: 8,
                      }}
                    >
                      {r.title}
                    </Text>
                    {!!r.subtitle && (
                      <Text style={{ color: "#d5d9e3", opacity: 0.85 }}>
                        {r.subtitle}
                      </Text>
                    )}
                  </View>

                  <View
                    style={{
                      position: "absolute",
                      right: 12,
                      bottom: 12,
                      backgroundColor: "rgba(0,0,0,0.55)",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <Text
                      style={{ color: theme.colors.neon, fontWeight: "800" }}
                    >
                      {r.pointsCost} pts
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    padding: 14,
                    gap: 8,
                    backgroundColor: "rgba(15,18,25,0.9)",
                  }}
                >
                  <Text style={{ color: theme.colors.sub }}>
                    Échange tes points contre ce produit.
                  </Text>
                  <Pressable
                    onPress={() => onClaim(r)}
                    disabled={disabled}
                    style={{
                      marginTop: 4,
                      backgroundColor: disabled ? "#223" : theme.colors.neon,
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: disabled
                        ? theme.colors.border
                        : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: disabled ? theme.colors.sub : "#061014",
                        fontWeight: "900",
                        letterSpacing: 0.6,
                      }}
                    >
                      {claimingId === (r.id || r.title)
                        ? "Création..."
                        : "Réclamer"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <Text
            style={{
              color: theme.colors.text,
              fontSize: 18,
              fontWeight: "800",
              marginTop: 6,
              marginBottom: 8,
            }}
          >
            Historique
          </Text>
        </View>
      </View>
    }
    ListEmptyComponent={
      <Text style={{ color: theme.colors.sub }}>Aucune transaction.</Text>
    }
    renderItem={({ item }) => (
      <View
        style={{
          backgroundColor: "rgba(15,18,25,0.9)",
          padding: 12,
          borderRadius: theme.radius,
          borderWidth: 1,
          borderColor: theme.colors.border,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text
            style={{
              color: item.delta > 0 ? theme.colors.neon : "#ffb3b3",
              fontWeight: "900",
            }}
          >
            {item.delta > 0 ? `+${item.delta} pts` : `${item.delta} pts`}
          </Text>
          <Text style={{ color: theme.colors.sub }}>
            {item.reason || "Transaction"}
          </Text>
        </View>
        <Text style={{ color: theme.colors.sub }}>
          {item.createdAt?.toDate
            ? item.createdAt.toDate().toLocaleString()
            : ""}
        </Text>
      </View>
    )}
  />
);
}
