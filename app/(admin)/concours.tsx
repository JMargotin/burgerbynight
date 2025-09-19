import { createContest, endContestNow, fetchContestParticipants, fetchContests, toggleContestActive } from "@/services";
import { theme } from "@/theme";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

function Field({ label, children }: React.PropsWithChildren<{ label: string }>) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: theme.colors.sub, fontSize: 12 }}>{label}</Text>
      {children}
    </View>
  );
}

export default function AdminContestsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<any[]>([]);

  // Form state
  const [title, setTitle] = useState("Concours PS5");
  const [prize, setPrize] = useState("PlayStation 5");
  const [ticketCostPoints, setTicketCostPoints] = useState("10");
  const [days, setDays] = useState("7");
  const [active, setActive] = useState("true");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const items = await fetchContests(50);
        setList(items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const items = await fetchContests(50);
      setList(items);
    } finally {
      setLoading(false);
    }
  }

  async function onCreate() {
    setSaving(true);
    try {
      const closesAt = Date.now() + Math.max(0, parseInt(days || "0", 10)) * 24 * 3600 * 1000;
      await createContest({
        title: title.trim(),
        prize: prize.trim(),
        ticketCostPoints: Math.max(1, parseInt(ticketCostPoints || "10", 10)),
        closesAt,
        active: active === "true",
        imageUrl: imageUrl.trim() || undefined,
      });
      await refresh();
      Alert.alert("Concours", "Concours créé");
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ color: theme.colors.neon2, fontSize: 24, fontWeight: "900" }}>Concours</Text>

      {/* Create form */}
      <View style={{ backgroundColor: "#0b0f16", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 12, gap: 10 }}>
        <Text style={{ color: theme.colors.text, fontWeight: "800" }}>Créer un concours</Text>
        <Field label="Titre">
          <TextInput value={title} onChangeText={setTitle} placeholder="Titre" placeholderTextColor="#6b7280" style={{ color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10 }} />
        </Field>
        <Field label="Lot">
          <TextInput value={prize} onChangeText={setPrize} placeholder="Lot" placeholderTextColor="#6b7280" style={{ color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10 }} />
        </Field>
        <Field label="Coût ticket (points)">
          <TextInput value={ticketCostPoints} onChangeText={setTicketCostPoints} keyboardType="number-pad" placeholder="10" placeholderTextColor="#6b7280" style={{ color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10 }} />
        </Field>
        <Field label="Durée (jours)">
          <TextInput value={days} onChangeText={setDays} keyboardType="number-pad" placeholder="7" placeholderTextColor="#6b7280" style={{ color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10 }} />
        </Field>
        <Field label="Actif (true/false)">
          <TextInput value={active} onChangeText={setActive} placeholder="true" placeholderTextColor="#6b7280" style={{ color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10 }} />
        </Field>
        <Field label="Image URL (optionnel)">
          <TextInput value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." placeholderTextColor="#6b7280" style={{ color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10 }} />
        </Field>
        <Pressable disabled={saving} onPress={onCreate} style={{ backgroundColor: saving ? "#334155" : theme.colors.neon2, padding: 12, borderRadius: 10, alignItems: "center" }}>
          <Text style={{ color: "#0b1116", fontWeight: "900" }}>Créer</Text>
        </Pressable>
      </View>

      {/* List */}
      <View style={{ backgroundColor: "#0b0f16", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 12, gap: 10 }}>
        <Text style={{ color: theme.colors.text, fontWeight: "800" }}>Concours existants</Text>
        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        ) : list.length === 0 ? (
          <Text style={{ color: theme.colors.sub }}>Aucun concours.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {list.map((c) => (
              <ContestRow key={c.id} item={c} onChange={refresh} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function ContestRow({ item, onChange }: { item: any; onChange: () => void }) {
  const [saving, setSaving] = useState(false);
  const canEnd = item.active && Date.now() < (item.closesAt || 0);
  const [participants, setParticipants] = useState<Array<{ uid: string; numTickets: number; pointsSpent?: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetchContestParticipants(item.id, 20);
        setParticipants(res);
      } finally {
        setLoading(false);
      }
    })();
  }, [item.id]);
  return (
    <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 10, gap: 6 }}>
      <Text style={{ color: theme.colors.text, fontWeight: "800" }}>{item.title}</Text>
      <Text style={{ color: theme.colors.sub }}>Lot: {item.prize}</Text>
      <Text style={{ color: theme.colors.sub }}>Tickets: {item.totalTickets || 0}</Text>
      <Text style={{ color: theme.colors.sub }}>Actif: {String(!!item.active)}</Text>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
        <Pressable
          disabled={saving}
          onPress={async () => {
            setSaving(true);
            try {
              await toggleContestActive(item.id, !item.active);
              onChange();
            } finally {
              setSaving(false);
            }
          }}
          style={{ backgroundColor: theme.colors.neon2, padding: 10, borderRadius: 8 }}
        >
          <Text style={{ color: "#0b1116", fontWeight: "900" }}>{item.active ? "Désactiver" : "Activer"}</Text>
        </Pressable>
        <Pressable
          disabled={saving || !canEnd}
          onPress={async () => {
            setSaving(true);
            try {
              await endContestNow(item.id);
              onChange();
            } finally {
              setSaving(false);
            }
          }}
          style={{ backgroundColor: canEnd ? "#EF4444" : "#334155", padding: 10, borderRadius: 8 }}
        >
          <Text style={{ color: "#0b1116", fontWeight: "900" }}>Clôturer maintenant</Text>
        </Pressable>
      </View>

      {/* Participants */}
      <View style={{ marginTop: 8, gap: 6 }}>
        <Text style={{ color: theme.colors.sub, fontSize: 12 }}>Participants (top 20)</Text>
        {loading ? (
          <ActivityIndicator />
        ) : participants.length === 0 ? (
          <Text style={{ color: theme.colors.sub }}>Aucun.</Text>
        ) : (
          <View style={{ gap: 4 }}>
            {participants.map((p) => (
              <Text key={p.uid} style={{ color: theme.colors.text }}>
                {p.uid.slice(0, 6)}… — tickets: {p.numTickets} — pts: {p.pointsSpent ?? p.numTickets * (item.ticketCostPoints || 0)}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}


