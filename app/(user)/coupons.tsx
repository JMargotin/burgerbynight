import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  Modal,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "@/providers/AuthProvider";
import { fetchCoupons } from "@/services";
import { theme } from "@/theme";
import type { Coupon } from "@/types";

export default function UserCouponsScreen() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Coupon[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrTitle, setQrTitle] = useState("");
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!uid) return;
      setLoading(true);
      try {
        const cps = await fetchCoupons(uid);
        if (!mounted) return;
        setList(cps || []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {};
  }, [uid]);

  const activeRewards = useMemo(
    () => list.filter((c) => c.type === "reward" && c.status === "active"),
    [list]
  );
  const historyRewards = useMemo(
    () =>
      list
        .filter(
          (c) =>
            c.type === "reward" &&
            (c.status === "used" || c.status === "expired")
        )
        .sort(
          (a, b) => (b?.createdAt?.seconds ?? 0) - (a?.createdAt?.seconds ?? 0)
        ),
    [list]
  );

  function openQr(c: Coupon) {
    setQrTitle(c.title);
    setQrCode(c.code);
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
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text
          style={{ color: theme.colors.text, fontSize: 24, fontWeight: "900" }}
        >
          Mes coupons
        </Text>
        <Text style={{ color: theme.colors.sub }}>
          Tes coupons{" "}
          <Text style={{ fontWeight: "700", color: theme.colors.text }}>
            récompenses
          </Text>{" "}
          utilisables. (Les promos sont visibles dans l’onglet Promos)
        </Text>
      </View>

      <Card title="Actifs">
        {activeRewards.length === 0 ? (
          <EmptyState text="Aucun coupon actif pour le moment." />
        ) : (
          <FlatList
            data={activeRewards}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <CouponCard coupon={item} onPress={() => openQr(item)} />
            )}
          />
        )}
      </Card>

      <Pressable
        onPress={() => setShowHistory((s) => !s)}
        style={{
          alignSelf: "flex-start",
          backgroundColor: "#0b0f16",
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
          {showHistory ? "Masquer l’historique" : "Voir l’historique"}
        </Text>
      </Pressable>

      {showHistory && (
        <Card title="Historique">
          {historyRewards.length === 0 ? (
            <EmptyState text="Aucun coupon utilisé ou expiré." />
          ) : (
            <FlatList
              data={historyRewards}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <CouponCard coupon={item} muted onPress={() => openQr(item)} />
              )}
            />
          )}
        </Card>
      )}

      <Modal
        visible={qrVisible}
        animationType="slide"
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
              backgroundColor: "rgba(15,18,25,0.98)",
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 18,
              padding: 18,
              alignItems: "center",
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
              {qrTitle}
            </Text>
            <View
              style={{ backgroundColor: "#fff", padding: 12, borderRadius: 12 }}
            >
              <QRCode
                value={qrCode}
                size={220}
                color="#000"
                backgroundColor="#fff"
              />
            </View>
            <Text style={{ color: theme.colors.sub, letterSpacing: 1 }}>
              {qrCode}
            </Text>

            <Pressable
              onPress={() => setQrVisible(false)}
              style={{
                marginTop: 8,
                backgroundColor: theme.colors.neon2,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: "#20011e", fontWeight: "900" }}>
                Fermer
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------- UI components ---------------- */
function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: "rgba(15,18,25,0.9)",
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 16,
        padding: 14,
        gap: 10,
      }}
    >
      <Text
        style={{ color: theme.colors.text, fontSize: 16, fontWeight: "800" }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function CouponCard({
  coupon,
  muted = false,
  onPress,
}: {
  coupon: Coupon;
  muted?: boolean;
  onPress?: () => void;
}) {
  const subColor =
    coupon.status === "active"
      ? theme.colors.success
      : coupon.status === "used"
      ? "#ffb3b3"
      : theme.colors.sub;

  return (
    <Pressable
      onPress={onPress}
      style={{
        overflow: "hidden",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: muted ? "#0b0f16" : theme.colors.card,
      }}
    >
      <View style={{ height: 110 }}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop",
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
            height: 56,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        />
        <View style={{ position: "absolute", left: 12, right: 12, bottom: 8 }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>
            {coupon.title}
          </Text>
          <Text style={{ color: subColor, fontWeight: "700" }}>
            {coupon.status.toUpperCase()} • {coupon.code}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState({ text }: { text: string }) {
  return <Text style={{ color: theme.colors.sub }}>{text}</Text>;
}

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
