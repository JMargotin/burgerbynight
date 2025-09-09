import {
  collection,
  getCountFromServer,
  getDocs,
  orderBy,
  query,
  where,
  limit as qlimit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type GlobalStats = {
  users: number;
  totalBalance: number;
  activeCoupons: number;
  activeCouponsByType: { promo: number; reward: number };
};

export async function fetchGlobalStats(): Promise<GlobalStats> {
  const usersCol = collection(db, "users");
  const usersCountSnap = await getCountFromServer(query(usersCol));
  const users = usersCountSnap.data().count;

  const couponsCol = collection(db, "coupons");
  const activeCouponsCountSnap = await getCountFromServer(
    query(couponsCol, where("status", "==", "active"))
  );
  const activeCoupons = activeCouponsCountSnap.data().count;

  const promoCountSnap = await getCountFromServer(
    query(
      couponsCol,
      where("status", "==", "active"),
      where("type", "==", "promo")
    )
  );
  const rewardCountSnap = await getCountFromServer(
    query(
      couponsCol,
      where("status", "==", "active"),
      where("type", "==", "reward")
    )
  );

  const usersSnap = await getDocs(query(usersCol));
  let totalBalance = 0;
  usersSnap.forEach((d) => {
    const b = (d.data() as any)?.balance;
    totalBalance += typeof b === "number" ? b : 0;
  });

  return {
    users: Number(users) || 0,
    totalBalance,
    activeCoupons: Number(activeCoupons) || 0,
    activeCouponsByType: {
      promo: Number(promoCountSnap.data().count) || 0,
      reward: Number(rewardCountSnap.data().count) || 0,
    },
  };
}

export async function fetchActiveCouponsGlobal(take = 6) {
  const snap = await getDocs(
    query(
      collection(db, "coupons"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      qlimit(take)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function fetchCouponsCounts(): Promise<{
  total: number;
  used: number;
}> {
  const col = collection(db, "coupons");
  const totalSnap = await getCountFromServer(query(col));
  const usedSnap = await getCountFromServer(
    query(col, where("status", "==", "used"))
  );
  return {
    total: Number(totalSnap.data().count) || 0,
    used: Number(usedSnap.data().count) || 0,
  };
}

export async function fetchPointsAggregates(
  days = 30
): Promise<{ positive: number; negative: number }> {
  const since = Timestamp.fromDate(
    new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  );
  const snap = await getDocs(
    query(collection(db, "pointTransactions"), where("createdAt", ">=", since))
  );

  let pos = 0;
  let neg = 0;
  snap.forEach((d) => {
    const delta = (d.data() as any)?.delta;
    if (typeof delta === "number") {
      if (delta > 0) pos += delta;
      else if (delta < 0) neg += delta;
    }
  });

  return { positive: pos, negative: neg };
}
