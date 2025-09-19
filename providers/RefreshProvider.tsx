import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface RefreshContextType {
  refreshCoupons: () => Promise<void>;
  refreshPoints: () => Promise<void>;
  refreshAll: () => Promise<void>;
  setRefreshCoupons: (fn: () => Promise<void>) => void;
  setRefreshPoints: (fn: () => Promise<void>) => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshCouponsFn, setRefreshCouponsFn] = useState<
    (() => Promise<void>) | null
  >(null);
  const [refreshPointsFn, setRefreshPointsFn] = useState<
    (() => Promise<void>) | null
  >(null);

  const refreshCoupons = useCallback(async () => {
    if (refreshCouponsFn) {
      await refreshCouponsFn();
    }
  }, [refreshCouponsFn]);

  const refreshPoints = useCallback(async () => {
    if (refreshPointsFn) {
      await refreshPointsFn();
    }
  }, [refreshPointsFn]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshCoupons(), refreshPoints()]);
  }, [refreshCoupons, refreshPoints]);

  const setRefreshCoupons = useCallback((fn: () => Promise<void>) => {
    setRefreshCouponsFn(() => fn);
  }, []);

  const setRefreshPoints = useCallback((fn: () => Promise<void>) => {
    setRefreshPointsFn(() => fn);
  }, []);

  return (
    <RefreshContext.Provider
      value={{
        refreshCoupons,
        refreshPoints,
        refreshAll,
        setRefreshCoupons,
        setRefreshPoints,
      }}
    >
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error("useRefresh must be used within a RefreshProvider");
  }
  return context;
}
