import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { theme } from "@/theme";
import {
  fetchGlobalStats,
  fetchActiveCouponsGlobal,
  fetchCouponsCounts,
  fetchPointsAggregates,
} from "@/services";

export default function StatsAdmin() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [users, setUsers] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);

  const [couponsTotal, setCouponsTotal] = useState(0);
  const [couponsActive, setCouponsActive] = useState(0);
  const [couponsUsed, setCouponsUsed] = useState(0);
  const [couponsActiveByType, setCouponsActiveByType] = useState<{
    promo: number;
    reward: number;
  }>({ promo: 0, reward: 0 });

  const [pointsDistributed, setPointsDistributed] = useState(0);
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [points7d, setPoints7d] = useState<{ pos: number; neg: number }>({
    pos: 0,
    neg: 0,
  });
  const [points30d, setPoints30d] = useState<{ pos: number; neg: number }>({
    pos: 0,
    neg: 0,
  });

  const [recentPromos, setRecentPromos] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const g = await fetchGlobalStats();
      setUsers(g.users);
      setTotalBalance(g.totalBalance);
      setCouponsActive(g.activeCoupons);
      setCouponsActiveByType(g.activeCouponsByType);

      const cc = await fetchCouponsCounts();
      setCouponsTotal(cc.total);
      setCouponsUsed(cc.used);

      const aggAll = await fetchPointsAggregates(365); // 1 an pour une vue large
      setPointsDistributed(aggAll.positive);
      setPointsRedeemed(aggAll.negative);

      const agg7 = await fetchPointsAggregates(7);
      setPoints7d({ pos: agg7.positive, neg: agg7.negative });

      const agg30 = await fetchPointsAggregates(30);
      setPoints30d({ pos: agg30.positive, neg: agg30.negative });

      const promos = await fetchActiveCouponsGlobal(6);
      setRecentPromos(promos);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const activeRate =
    couponsTotal > 0 ? Math.round((couponsActive / couponsTotal) * 100) : 0;
  const netPoints = pointsDistributed + pointsRedeemed; // (redeemed est négatif)

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <Kpi title="Utilisateurs" value={String(users)} />
        <Kpi title="Solde cumulé" value={`${totalBalance} pts`} neon />
        <Kpi title="Coupons actifs" value={String(couponsActive)} />
        <Kpi title="% actifs" value={`${activeRate}%`} />
      </View>

      <Card title="Coupons">
        <Row label="Total" value={String(couponsTotal)} />
        <Row label="Actifs (promo)" value={String(couponsActiveByType.promo)} />
        <Row
          label="Actifs (reward)"
          value={String(couponsActiveByType.reward)}
        />
        <Row label="Utilisés" value={String(couponsUsed)} />
      </Card>

      <Card title="Points">
        <Row
          label="Distribués (total)"
          value={`${pointsDistributed} pts`}
          valueColor={theme.colors.neon}
        />
        <Row
          label="Dépensés (total)"
          value={`${pointsRedeemed} pts`}
          valueColor="#ffb3b3"
        />
        <Row label="Net (total)" value={`${netPoints} pts`} />
        <Divider />
        <Row
          label="Distribués (7j)"
          value={`${points7d.pos} pts`}
          valueColor={theme.colors.neon}
        />
        <Row
          label="Dépensés (7j)"
          value={`${points7d.neg} pts`}
          valueColor="#ffb3b3"
        />
        <Row
          label="Distribués (30j)"
          value={`${points30d.pos} pts`}
          valueColor={theme.colors.neon}
        />
        <Row
          label="Dépensés (30j)"
          value={`${points30d.neg} pts`}
          valueColor="#ffb3b3"
        />
      </Card>

      <Card title="Promos actives récentes">
        {recentPromos.length === 0 ? (
          <Text style={{ color: theme.colors.sub }}>Aucune promo active.</Text>
        ) : (
          recentPromos.map((c) => (
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
      </Card>
    </ScrollView>
  );
}

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
        padding: 16,
        gap: 8,
      }}
    >
      <Text
        style={{
          color: theme.colors.text,
          fontSize: 18,
          fontWeight: "800",
          marginBottom: 6,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Kpi({
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
        flexBasis: "47%",
        backgroundColor: "rgba(15,18,25,0.9)",
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 16,
        padding: 14,
      }}
    >
      <Text style={{ color: theme.colors.sub, marginBottom: 6 }}>{title}</Text>
      <Text
        style={{
          color: neon ? theme.colors.neon2 : theme.colors.text,
          fontSize: 22,
          fontWeight: "900",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: theme.colors.sub }}>{label}</Text>
      <Text
        style={{ color: valueColor ?? theme.colors.text, fontWeight: "700" }}
      >
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 4,
      }}
    />
  );
}
