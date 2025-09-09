import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { theme } from "@/theme";
import {
  createGlobalPromo,
  listRecentActivePromosGlobal,
  expireSomeGlobalPromos,
} from "@/services";

export default function AdminPromosScreen() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);
  const [expiring, setExpiring] = useState(false);

  async function load() {
    const list = await listRecentActivePromosGlobal(30);
    setRecent(list);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate() {
    if (!title.trim()) {
      Alert.alert(
        "Titre requis",
        "Donne un titre à la promo (ex: 'Boisson offerte ce soir')."
      );
      return;
    }
    try {
      setLoading(true);
      const res = await createGlobalPromo(title.trim());
      Alert.alert(
        "Promo créée",
        `Coupons créés pour ${res.usersCount} clients.`
      );
      setTitle("");
      await load();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible de créer la promo.");
    } finally {
      setLoading(false);
    }
  }

  async function onExpireSome() {
    try {
      setExpiring(true);
      const res = await expireSomeGlobalPromos(400);
      Alert.alert(
        "Promos expirées",
        `${res.updated} coupons promo passés en 'expired'.`
      );
      await load();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible d'expirer des promos.");
    } finally {
      setExpiring(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <View
        style={{
          backgroundColor: "rgba(15,18,25,0.9)",
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 16,
          padding: 16,
          gap: 10,
        }}
      >
        <Text
          style={{ color: theme.colors.text, fontSize: 18, fontWeight: "800" }}
        >
          Nouvelle promo globale
        </Text>

        <TextInput
          placeholder="Ex: Boisson offerte cette nuit"
          placeholderTextColor="#6f7a8a"
          value={title}
          onChangeText={setTitle}
          style={{
            color: theme.colors.text,
            backgroundColor: "#0b0f16",
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />

        <Pressable
          onPress={onCreate}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#223" : theme.colors.neon2,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text
              style={{
                color: "#20011e",
                fontWeight: "900",
                letterSpacing: 0.4,
              }}
            >
              Distribuer à tous
            </Text>
          )}
        </Pressable>

        <Text style={{ color: theme.colors.sub, fontSize: 12 }}>
          Cette action crée un coupon “promo” actif pour chaque client (limité
          par lots de 400).
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "rgba(15,18,25,0.9)",
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 16,
          padding: 16,
          gap: 10,
        }}
      >
        <Text
          style={{ color: theme.colors.text, fontSize: 16, fontWeight: "800" }}
        >
          Maintenance
        </Text>
        <Pressable
          onPress={onExpireSome}
          disabled={expiring}
          style={{
            backgroundColor: expiring ? "#223" : "#333a",
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          {expiring ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
              Expirer 400 promos actives
            </Text>
          )}
        </Pressable>
        <Text style={{ color: theme.colors.sub, fontSize: 12 }}>
          Utile si tu veux désactiver rapidement une campagne (répète l’action
          si besoin).
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "rgba(15,18,25,0.9)",
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 16,
          padding: 16,
          gap: 8,
        }}
      >
        <Text
          style={{ color: theme.colors.text, fontSize: 16, fontWeight: "800" }}
        >
          Promos actives récentes
        </Text>
        {recent.length === 0 ? (
          <Text style={{ color: theme.colors.sub }}>Aucune promo active.</Text>
        ) : (
          recent.map((c) => (
            <View
              key={c.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <Text style={{ color: theme.colors.text, fontWeight: "600" }}>
                {c.title}
              </Text>
              <Text style={{ color: theme.colors.sub }}>{c.code}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
