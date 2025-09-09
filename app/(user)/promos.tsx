import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  Pressable,
  Modal,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "@/providers/AuthProvider";
import { fetchCoupons } from "@/services";
import { theme } from "@/theme";
import type { Coupon } from "@/types";

export default function UserPromosScreen() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Coupon[]>([]);

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

  const activePromos = useMemo(
    () => list.filter((c) => c.type === "promo" && c.status === "active"),
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
          Connecte-toi pour voir tes promos.
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
          Mes promos
        </Text>
        <Text style={{ color: theme.colors.sub }}>
          Les offres{" "}
          <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
            offertes par l’admin
          </Text>{" "}
          (utilisables tant qu’elles sont actives).
        </Text>
      </View>

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
          Actives
        </Text>

        {activePromos.length === 0 ? (
          <Text style={{ color: theme.colors.sub }}>
            Aucune promo active pour l’instant.
          </Text>
        ) : (
          <FlatList
            data={activePromos}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <PromoCard coupon={item} onPress={() => openQr(item)} />
            )}
          />
        )}
      </View>

      {/* Modal QR */}
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
                backgroundColor: theme.colors.neon,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: "#061014", fontWeight: "900" }}>
                Fermer
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ------------- UI ------------- */

function PromoCard({
  coupon,
  onPress,
}: {
  coupon: Coupon;
  onPress?: () => void;
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
      <View style={{ height: 120 }}>
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
            height: 60,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        />
        <View style={{ position: "absolute", left: 12, right: 12, bottom: 8 }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>
            {coupon.title}
          </Text>
          <Text style={{ color: "#dbe2f2" }}>Code: {coupon.code}</Text>
        </View>
      </View>
    </Pressable>
  );
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
