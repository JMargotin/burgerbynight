import { useAuth } from "@/providers/AuthProvider";
import { fetchPointTransactions } from "@/services";
import type { PointTx } from "@/types";
import { useCallback, useEffect, useState } from "react";

export function usePoints() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const balance = profile?.balance ?? 0;

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<PointTx[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchPointTransactions(uid, 50);
      setTransactions(list);
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger les transactions");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  const refreshTransactions = useCallback(async () => {
    await loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    loading,
    transactions,
    error,
    balance,
    refreshTransactions,
  };
}
