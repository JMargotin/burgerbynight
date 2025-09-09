import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PointTx } from "@/types";

export async function fetchPointTransactions(
  uid: string,
  take = 100
): Promise<PointTx[]> {
  const base = collection(db, "pointTransactions");
  let qy = query(base, where("uid", "==", uid));
  try {
    qy = query(
      base,
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(take)
    );
  } catch {
    // noop
  }
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}
