// src/lib/store.ts
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
  increment,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ClaimableReward } from "@/constants/Reward.js";

// --- CONFIG
export const POINTS_PER_EURO = 1;

// --- Profil
export async function getUserProfile(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data() as any;
  return {
    id: snap.id,
    uid: d.uid ?? snap.id,
    ...d,
    balance: typeof d.balance === "number" ? d.balance : 0,
  };
}

export async function getUserByCustomerCode(rawCode: string) {
  const code = String(rawCode || "")
    .trim()
    .toUpperCase();
  // fallback UID direct si le code ressemble à un UID
  if (code && code.length >= 28 && !code.includes("-")) {
    const byUid = await getUserProfile(code);
    if (byUid) return byUid;
  }
  const ref = collection(db, "users");
  const qy = query(ref, where("customerCode", "==", code));
  const snap = await getDocs(qy);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data() as any;
  return {
    id: d.id,
    uid: data.uid ?? d.id,
    ...data,
    balance: typeof data.balance === "number" ? data.balance : 0,
  };
}


export async function fetchPointTransactions(uid: string, take = 50) {
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
    /* pas d’index → on garde la requête simple */
  }
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function fetchCoupons(uid: string) {
  const ref = collection(db, "coupons");
  const qy = query(ref, where("uid", "==", uid));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function addPointsByAmount(
  uid: string,
  amountEuro: number,
  reason = "Achat"
) {
  const pts = Math.max(0, Math.floor(amountEuro * POINTS_PER_EURO));
  const batch = writeBatch(db);
  const txRef = doc(collection(db, "pointTransactions"));
  batch.set(txRef, {
    uid,
    delta: pts,
    reason: `${reason} (${amountEuro.toFixed(2)}€)`,
    orderAmount: amountEuro,
    createdAt: serverTimestamp(),
  });
  const userRef = doc(db, "users", uid);
  batch.set(userRef, { balance: increment(pts) }, { merge: true });
  await batch.commit();
  return pts;
}

export async function markCouponUsed(couponCode: string, expectedUid?: string) {
  const ref = collection(db, "coupons");
  const qy = query(ref, where("code", "==", couponCode), limit(1));
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
  return c as any;
}

export async function spendPoints(
  uid: string,
  points: number,
  reason = "Récompense"
) {
  const delta = -Math.abs(points);
  const batch = writeBatch(db);

  const txRef = doc(collection(db, "pointTransactions"));
  batch.set(txRef, {
    uid,
    delta,
    reason,
    orderAmount: null,
    createdAt: serverTimestamp(),
  });

  const userRef = doc(db, "users", uid);
  batch.set(userRef, { balance: increment(delta) }, { merge: true });

  await batch.commit();
}

async function createRewardCoupon(uid: string, reward: ClaimableReward) {
  const id = doc(collection(db, "coupons")).id;
  const couponRef = doc(db, "coupons", id);
  const code = `${reward.id || reward.title}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

  const coupon = {
    id,
    uid,
    title: reward.title,
    type: "reward", // vs 'promo' si admin
    code, // scannable côté admin
    status: "active", // 'used' quand validé
    createdAt: serverTimestamp(),
  };
  await setDoc(couponRef, coupon);
  return coupon;
}

export async function claimReward(uid: string, reward: ClaimableReward) {
  // Simple: 2 étapes séquentielles (si tu veux du "vrai" atomique, on peut faire une Cloud Function)
  const coupon = await createRewardCoupon(uid, reward);
  await spendPoints(uid, reward.pointsCost, `Récompense: ${reward.title}`);
  return coupon;
}
