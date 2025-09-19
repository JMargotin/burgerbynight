import { fetchActiveCouponsGlobal, fetchGlobalStats } from "@/services";
import { theme } from "@/theme";
import type { Coupon } from "@/types";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function AdminHomeScreen() {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [nbUsers, setNbUsers] = useState<number>(0);
  const [pointsTotal, setPointsTotal] = useState<number>(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [stats, cps] = await Promise.all([
          fetchGlobalStats(),
          fetchActiveCouponsGlobal(6),
        ]);
        setNbUsers(stats.users);
        setPointsTotal(stats.totalBalance);
        setCoupons(cps);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
    >
      {/* Header */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            color: theme.colors.neon2,
            fontSize: 32,
            fontWeight: "900",
            letterSpacing: 1.2,
            textShadowColor: theme.colors.neon2,
            textShadowRadius: 14,
          }}
        >
          BBN Admin
        </Text>
        <Text style={{ color: theme.colors.sub, marginTop: 6 }}>
          Gestion et suivi des clients
        </Text>
      </View>

      {/* Stats globales */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <StatCard title="Utilisateurs" value={nbUsers.toString()} />
        <StatCard title="Points cumulés" value={pointsTotal.toString()} neon />
        <StatCard title="Promos actives" value={coupons.length.toString()} />
      </View>

      {/* Actions rapides */}
      <View
        style={{
          backgroundColor: "rgba(15,18,25,0.9)",
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 16,
          padding: 12,
          marginBottom: 16,
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
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <ActionTile
            title="Scanner client"
            subtitle="Points & coupons"
            onPress={() => router.push("/(admin)/scan-customer")}
            iconUri="https://img.icons8.com/ios-filled/100/ffffff/qr-code.png"
          />
          <ActionTile
            title="Promos globales"
            subtitle="Ajouter / gérer"
            onPress={() => router.push("/(admin)/promos")}
            iconUri="https://img.icons8.com/ios-filled/100/ffffff/discount.png"
          />
          <ActionTile
            title="Stats"
            subtitle="Clients & global"
            onPress={() => router.push("/(admin)/stats")}
            iconUri="https://img.icons8.com/ios-filled/100/ffffff/combo-chart.png"
          />
        </View>
      </View>

      {/* Promos en cours */}
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
          Promos en cours
        </Text>
        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        ) : coupons.length === 0 ? (
          <Text style={{ color: theme.colors.sub }}>Aucune promo active.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {coupons.map((c) => (
              <PromoCard key={c.id} title={c.title} code={c.code} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

/* ------------------- Subcomponents ------------------- */

function StatCard({
  title,
  value,
  neon = false,
}: {
  title: string;
  value: string;
  neon?: boolean;
}) {
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: "30%",
        backgroundColor: "rgba(15,18,25,0.9)",
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 16,
        padding: 14,
        alignItems: "center",
      }}
    >
      <Text style={{ color: theme.colors.sub, marginBottom: 4 }}>{title}</Text>
      <Text
        style={{
          color: neon ? theme.colors.neon2 : theme.colors.text,
          fontSize: 22,
          fontWeight: "800",
        }}
      >
        {value}
      </Text>
    </View>
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

function PromoCard({ title, code }: { title: string; code?: string }) {
  return (
    <View
      style={{
        overflow: "hidden",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
      }}
    >
      <View style={{ height: 100 }}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1607013407462-8f02d6c2c2d2?q=80&w=1200&auto=format&fit=crop",
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
            height: 50,
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        />
        <View style={{ position: "absolute", left: 12, right: 12, bottom: 6 }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>{title}</Text>
          {!!code && (
            <Text style={{ color: "#dbe2f2", opacity: 0.9 }}>Code: {code}</Text>
          )}
        </View>
      </View>
    </View>
  );
}
