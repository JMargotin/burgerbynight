import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
  limit as qlimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { randomCode } from "./coupon.service";

export async function createGlobalPromo(title: string) {
  if (!title?.trim()) throw new Error("Titre requis");
  const usersSnap = await getDocs(query(collection(db, "users")));
  const users = usersSnap.docs;
  const now = serverTimestamp();

  const CHUNK = 400;
  let created = 0;

  for (let i = 0; i < users.length; i += CHUNK) {
    const batch = writeBatch(db);
    const slice = users.slice(i, i + CHUNK);
    slice.forEach((u) => {
      const id = doc(collection(db, "coupons")).id;
      batch.set(doc(db, "coupons", id), {
        id,
        uid: u.id,
        title,
        type: "promo",
        code: randomCode("PRM"),
        status: "active",
        createdAt: now,
      });
    });
    await batch.commit();
    created += slice.length;
  }

  return { created, usersCount: users.length };
}

export async function listRecentActivePromosGlobal(take = 20) {
  const snap = await getDocs(
    query(
      collection(db, "coupons"),
      where("type", "==", "promo"),
      where("status", "==", "active"),
      qlimit(take)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function expireSomeGlobalPromos(limitCount = 400) {
  const snap = await getDocs(
    query(
      collection(db, "coupons"),
      where("type", "==", "promo"),
      where("status", "==", "active"),
      qlimit(limitCount)
    )
  );
  if (snap.empty) return { updated: 0 };
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.set(d.ref, { status: "expired" }, { merge: true });
  });
  await batch.commit();
  return { updated: snap.size };
}
