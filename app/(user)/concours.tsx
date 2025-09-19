import { useAuth } from "@/providers/AuthProvider";
import {
  getActiveContest,
  listenContestStats,
  purchaseContestTickets,
} from "@/services";
import { theme } from "@/theme";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

function ProgressBar({
  value,
  max = 1,
  height = 8,
}: {
  value: number;
  max?: number;
  height?: number;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: theme.colors.text, fontSize: 12 }}>
          Probabilité de gagner
        </Text>
        <Text
          style={{ color: theme.colors.neon2, fontSize: 12, fontWeight: "800" }}
        >
          {percentage.toFixed(1)}%
        </Text>
      </View>
      <View
        style={{
          height,
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: height / 2,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.2)",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${percentage}%`,
            backgroundColor: theme.colors.neon2,
            borderRadius: height / 2,
            shadowColor: theme.colors.neon2,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 4,
            elevation: 4,
          }}
        />
      </View>
    </View>
  );
}

function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return (
    <Text style={{ color: theme.colors.text, fontWeight: "800" }}>
      {d}j {h}h {m}m {ss}s
    </Text>
  );
}

export default function ContestScreen() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const balance = profile?.balance ?? 0;

  const unsubRef = useRef<null | (() => void)>(null);

  const [loading, setLoading] = useState(true);
  const [contestId, setContestId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("Concours PS5");
  const [prize, setPrize] = useState<string>("PlayStation 5");
  const [closesAt, setClosesAt] = useState<number>(
    Date.now() + 7 * 24 * 3600 * 1000
  );
  const [ticketCost, setTicketCost] = useState<number>(10);
  const [active, setActive] = useState<boolean>(true);

  const [userTickets, setUserTickets] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const probability = useMemo(() => {
    if (!totalTickets) return 0;
    return userTickets / totalTickets;
  }, [userTickets, totalTickets]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const c = await getActiveContest();
        if (!mounted) return;
        if (c) {
          setContestId(c.id);
          setTitle(c.title || "Concours");
          setPrize(c.prize || "");
          setClosesAt(c.closesAt);
          setTicketCost(c.ticketCostPoints || 10);
          setActive(!!c.active);
        } else {
          setContestId(null);
          setActive(false);
        }
      } catch (e) {
        if (!mounted) return;
        setContestId(null);
        setActive(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!uid || !contestId) return;
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    const unsub = listenContestStats(contestId, uid, (s) => {
      setUserTickets((prev) => (prev === s.userTickets ? prev : s.userTickets));
      setTotalTickets((prev) =>
        prev === s.totalTickets ? prev : s.totalTickets
      );
      setTicketCost((prev) =>
        prev === s.contest.ticketCostPoints ? prev : s.contest.ticketCostPoints
      );
      setClosesAt((prev) =>
        prev === s.contest.closesAt ? prev : s.contest.closesAt
      );
      setActive((prev) =>
        prev === s.contest.active ? prev : s.contest.active
      );
      setTitle((prev) => (prev === s.contest.title ? prev : s.contest.title));
      setPrize((prev) => (prev === s.contest.prize ? prev : s.contest.prize));
    });
    unsubRef.current = unsub;
    return () => {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = null;
    };
  }, [uid, contestId]);

  const canBuy = active && Date.now() < closesAt;
  const canAffordOne = balance >= ticketCost;

  async function buy(quantity: number) {
    if (!uid || !contestId) return;
    if (!canBuy) return;
    setSubmitting(true);
    try {
      const { userTickets: ut, totalTickets: tt } =
        await purchaseContestTickets(contestId, uid, quantity, ticketCost);
      setUserTickets(ut);
      setTotalTickets(tt);
    } catch (e: any) {
      console.warn("purchaseContestTickets error", e?.message || e);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!contestId) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          Aucun concours actif pour le moment
        </Text>
        <Text
          style={{
            color: theme.colors.text,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Reviens plus tard ;)
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={{ color: "#fff", fontSize: 32, fontWeight: "900" }}>
          {title}
        </Text>
        <Text style={{ color: theme.colors.text, marginTop: 4 }}>
          Lot: {prize}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "rgba(5,7,10,0.25)",
          borderRadius: 16,
          padding: 16,
          gap: 10,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
        }}
      >
        <Text style={{ color: theme.colors.text }}>Clôture dans</Text>
        <Countdown target={closesAt} />
        {!canBuy && (
          <Text style={{ color: "#EF4444", fontWeight: "800" }}>
            Concours terminé
          </Text>
        )}
      </View>

      <View
        style={{
          backgroundColor: "rgba(5,7,10,0.25)",
          borderRadius: 16,
          padding: 16,
          gap: 10,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
        }}
      >
        <Text style={{ color: theme.colors.text }}>Tes tickets</Text>
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900" }}>
          {userTickets}
        </Text>
        <Text style={{ color: theme.colors.text }}>
          Total tickets: {totalTickets}
        </Text>
        <ProgressBar value={userTickets} max={totalTickets} height={10} />
      </View>

      <View
        style={{
          backgroundColor: "rgba(5,7,10,0.25)",
          borderRadius: 16,
          padding: 16,
          gap: 14,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
        }}
      >
        <Text style={{ color: theme.colors.text }}>
          Prix d'un ticket: {ticketCost} pts — Solde: {balance} pts
        </Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            disabled={!canBuy || submitting || !canAffordOne}
            onPress={() => buy(1)}
            style={{
              backgroundColor:
                canBuy && canAffordOne ? theme.colors.neon2 : "#334155",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 10,
              opacity: canBuy && canAffordOne ? (submitting ? 0.7 : 1) : 0.7,
            }}
          >
            <Text
              style={{
                color: canBuy && balance >= ticketCost * 10 ? "#fff" : "#fff",
                fontWeight: "600",
              }}
            >
              Acheter 1 ticket
            </Text>
          </Pressable>

          <Pressable
            disabled={!canBuy || submitting || balance < ticketCost * 10}
            onPress={() => buy(10)}
            style={{
              backgroundColor:
                canBuy && balance >= ticketCost * 10
                  ? theme.colors.neon2
                  : "#334155",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 10,
              opacity:
                canBuy && balance >= ticketCost * 10
                  ? submitting
                    ? 0.7
                    : 1
                  : 0.7,
            }}
          >
            <Text
              style={{
                color: canBuy && balance >= ticketCost * 10 ? "#fff" : "#fff",
                fontWeight: "600",
              }}
            >
              Acheter 10 tickets
            </Text>
          </Pressable>
        </View>

        <Text style={{ color: theme.colors.text, fontSize: 12 }}>
          L'achat est bloqué automatiquement à la fermeture du concours.
        </Text>
      </View>
    </ScrollView>
  );
}
