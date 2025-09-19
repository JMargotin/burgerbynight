import { useAuth } from "@/providers/AuthProvider";
import { fetchCoupons, getActiveContest } from "@/services";
import { theme } from "@/theme";
import type { Coupon } from "@/types";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

/** -------------------- Helpers / UI -------------------- **/

function GlassCard({
  children,
  style,
  intensity = 30,
}: React.PropsWithChildren<{ style?: any; intensity?: number }>) {
  return (
    <View
      style={[
        {
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.28)",
          backgroundColor: "rgba(255,255,255,0.06)", // fallback si blur faible
        },
        style,
      ]}
    >
      <BlurView tint="light" intensity={intensity} style={{ padding: 16 }}>
        {children}
      </BlurView>
    </View>
  );
}

function Chip({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "danger";
}) {
  const bg =
    tone === "success"
      ? "rgba(34,197,94,0.18)"
      : tone === "danger"
      ? "rgba(239,68,68,0.18)"
      : "rgba(255,255,255,0.18)";
  const border =
    tone === "success"
      ? "rgba(34,197,94,0.4)"
      : tone === "danger"
      ? "rgba(239,68,68,0.4)"
      : "rgba(255,255,255,0.35)";
  const color =
    tone === "success"
      ? "#22C55E"
      : tone === "danger"
      ? "#EF4444"
      : theme.colors.text;
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
      }}
    >
      <Text style={{ color, fontWeight: "800", fontSize: 12 }}>{label}</Text>
    </View>
  );
}

/** Tuile carrée (slider horizontal) */
function SquareTile({
  title,
  subtitle,
  iconUri,
  onPress,
  disabled,
}: {
  title: string;
  subtitle?: string;
  iconUri?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <View style={{ width: 140, gap: 8 }}>
        <View
          style={{
            width: 140,
            height: 140,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.28)",
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        >
          <BlurView
            tint="light"
            intensity={35}
            style={{ flex: 1, padding: 12 }}
          >
            <View style={{ flex: 1, justifyContent: "space-between" }}>
              {iconUri ? (
                <Image
                  source={{ uri: iconUri }}
                  style={{
                    width: 28,
                    height: 28,
                    tintColor: "#10151b",
                    opacity: 0.9,
                  }}
                />
              ) : null}
              <View>
                <Text
                  numberOfLines={1}
                  style={{ color: "#10151b", fontWeight: "900", fontSize: 16 }}
                >
                  {title}
                </Text>
                {!!subtitle && (
                  <Text
                    numberOfLines={1}
                    style={{ color: "#2a3744", fontSize: 12 }}
                  >
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>
          </BlurView>
        </View>
      </View>
    </Pressable>
  );
}

/** Carte carrée promo (image + overlay) */
function PromoSquare({
  title,
  code,
  onPress,
  imageUri,
}: {
  title: string;
  code?: string;
  onPress: () => void;
  imageUri: string;
}) {
  return (
    <Pressable onPress={onPress}>
      <View style={{ width: 150, gap: 8 }}>
        <View
          style={{
            width: 150,
            height: 150,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.28)",
          }}
        >
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: "100%" }}
          />
          <View
            style={{
              position: "absolute",
              inset: 0 as any,
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
          />
          <View
            style={{ position: "absolute", left: 10, right: 10, bottom: 10 }}
          >
            <Text
              style={{ color: "#fff", fontWeight: "900" }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {!!code && (
              <Text
                style={{ color: "#dbe2f2", opacity: 0.95 }}
                numberOfLines={1}
              >
                Code: {code}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/** Bouton de commande qui ouvre l'app d'appel */
function OrderButton() {
  const phoneNumber = "0603250723"; // Remplace par le vrai numéro

  const handleCall = async () => {
    try {
      const url = `tel:${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Erreur lors de l'ouverture de l'appel:", error);
    }
  };

  return (
    <Pressable onPress={handleCall}>
      <View
        style={{
          backgroundColor: "rgba(5,7,10,0.25)",
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Icône téléphone */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: "#22C55E",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#22C55E",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text style={{ fontSize: 20 }}>📞</Text>
        </View>

        {/* Contenu */}
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "900",
            }}
          >
            Commander maintenant
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 13,
            }}
          >
            Appelle-nous pour passer ta commande
          </Text>
        </View>

        {/* Flèche */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.15)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            →
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Preview magnifique du concours actif */
function ContestPreview({
  title,
  imageUrl,
  onPress,
}: {
  title: string;
  imageUrl?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
          backgroundColor: "rgba(5,7,10,0.25)",
          shadowColor: "#22C55E",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            {/* Image du concours */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 28 }}>🎯</Text>
                </View>
              )}
            </View>

            {/* Contenu */}
            <View style={{ flex: 1, gap: 6 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text
                  style={{
                    color: "#22C55E",
                    fontSize: 14,
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Concours Actif
                </Text>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#22C55E",
                    shadowColor: "#22C55E",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                  }}
                />
              </View>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "900",
                  lineHeight: 22,
                }}
                numberOfLines={2}
              >
                {title}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 13,
                  lineHeight: 16,
                }}
              >
                Participe maintenant et gagne des lots incroyables !
              </Text>
            </View>

            {/* Flèche */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                →
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/** -------------------- Screen -------------------- **/

export default function UserHomeScreen() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const balance = profile?.balance ?? 0;
  const display = profile?.displayName || profile?.email || "Client";

  const [loading, setLoading] = useState(true);
  const [activeCoupons, setActiveCoupons] = useState<Coupon[]>([]);
  const [hasActiveContest, setHasActiveContest] = useState<boolean>(false);
  const [contestTitle, setContestTitle] = useState<string>("Concours");
  const [contestImageUrl, setContestImageUrl] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!uid) return;
      setLoading(true);
      try {
        const cps = await fetchCoupons(uid);
        if (!mounted) return;
        setActiveCoupons(
          (cps || []).filter((c: any) => c.status === "active").slice(0, 8)
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [uid]);

  // Vérifie s'il existe un concours actif (affiche le CTA seulement dans ce cas)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const c = await getActiveContest();
        if (!mounted) return;
        if (c) {
          setHasActiveContest(true);
          setContestTitle(c.title || "Concours");
          setContestImageUrl(c.imageUrl || "");
        } else {
          setHasActiveContest(false);
          setContestImageUrl("");
        }
      } catch {
        if (mounted) {
          setHasActiveContest(false);
          setContestImageUrl("");
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const openState = useMemo(() => {
    const now = new Date();
    const h = now.getHours(); // 0..23 (timezone device)
    const isOpen = h >= 20 || h < 4;
    const next = isOpen ? "Ferme à 4h" : "Ouvre à 20h";
    return { isOpen, next };
  }, []);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header titre + état */}
      <View style={{ marginBottom: 2 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 36,
            fontWeight: "900",
            letterSpacing: 1.2,
          }}
        >
          Burger By Night
        </Text>
        <Text style={{ color: theme.colors.text, marginTop: 4, opacity: 0.95 }}>
          Salut {display} 👋
        </Text>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <Chip
            label={
              openState.isOpen ? "Ouvert maintenant" : "Fermé actuellement"
            }
            tone={openState.isOpen ? "success" : "danger"}
          />
          <Chip label={openState.next} />
        </View>
      </View>

      {/* Solde (verre dépoli) */}
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
      </View>

      {/* Bouton de commande */}
      <OrderButton />

      {/* Preview du concours actif */}
      {hasActiveContest && (
        <ContestPreview
          title={contestTitle}
          imageUrl={contestImageUrl}
          onPress={() => router.push("/(user)/concours")}
        />
      )}

      {/* Promos actives — cartes carrées en slider */}
      <View style={{ gap: 10 }}>
        <Text
          style={{ color: theme.colors.text, fontSize: 16, fontWeight: "800" }}
        >
          Tes promos actives
        </Text>

        {loading ? (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        ) : activeCoupons.length === 0 ? (
          <GlassCard intensity={15}>
            <Text style={{ color: "#2a3744" }}>
              Aucune promo active pour le moment.
            </Text>
          </GlassCard>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
          >
            {activeCoupons.map((c) => (
              <PromoSquare
                key={c.id}
                title={c.title}
                code={c.code}
                onPress={() => router.push("/(user)/coupons")}
                imageUri={
                  c.imageUrl ||
                  "https://images.unsplash.com/photo-1550317138-10000687a72b?q=80&w=1200&auto=format&fit=crop"
                }
              />
            ))}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}
