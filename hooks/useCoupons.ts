import { useAuth } from "@/providers/AuthProvider";
import { fetchCoupons } from "@/services";
import type { Coupon } from "@/types";
import { useCallback, useEffect, useState } from "react";

export function useCoupons() {
  const { profile } = useAuth();
  const uid = profile?.uid;

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Coupon[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadCoupons = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      const cps = await fetchCoupons(uid);
      console.log(
        "🔍 Coupons rechargés:",
        cps?.map((c) => ({ title: c.title, imageUrl: c.imageUrl }))
      );
      setList(cps || []);
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger les coupons");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  const refreshCoupons = useCallback(async () => {
    await loadCoupons();
  }, [loadCoupons]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const activeRewards = list.filter(
    (c) => c.type === "reward" && c.status === "active"
  );
  const activePromos = list.filter(
    (c) => c.type === "promo" && c.status === "active"
  );
  const historyAll = list
    .filter(
      (c) =>
        (c.status === "used" || c.status === "expired") && c.type === "reward"
    )
    .sort(
      (a, b) => (b?.createdAt?.seconds ?? 0) - (a?.createdAt?.seconds ?? 0)
    );

  return {
    loading,
    list,
    error,
    activeRewards,
    activePromos,
    historyAll,
    refreshCoupons,
  };
}
