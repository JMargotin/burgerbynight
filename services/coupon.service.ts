import { db } from "@/lib/firebase";
import type { Coupon } from "@/types";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

export async function fetchCoupons(uid: string): Promise<Coupon[]> {
  const qy = query(collection(db, "coupons"), where("uid", "==", uid));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function markCouponUsed(couponCode: string, expectedUid?: string) {
  const qy = query(
    collection(db, "coupons"),
    where("code", "==", couponCode),
    limit(1)
  );
  const snap = await getDocs(qy);
  if (snap.empty) throw new Error("Coupon introuvable");
  const docSnap = snap.docs[0];
  const c = { id: docSnap.id, ...(docSnap.data() as any) };

  if (expectedUid && c.uid !== expectedUid)
    throw new Error("Ce coupon appartient à un autre client.");
  if (c.status !== "active") throw new Error("Coupon non utilisable.");

  await setDoc(
    doc(db, "coupons", c.id),
    { status: "used", usedAt: serverTimestamp() },
    { merge: true }
  );
  return c as Coupon;
}

export function randomCode(prefix = "CPN") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function createRewardCoupon(
  uid: string,
  title: string,
  imageUrl?: string
) {
  const id = doc(collection(db, "coupons")).id;
  const ref = doc(db, "coupons", id);
  const coupon: Coupon = {
    id,
    uid,
    title,
    type: "reward",
    code: randomCode("RWD"),
    status: "active",
    createdAt: serverTimestamp() as any,
    ...(imageUrl && { imageUrl }), // Stocker l'image seulement si elle existe
  };
  await setDoc(ref, coupon);
  return coupon;
}
