import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/types";
import { deleteUser } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";

export function normalizeCustomerCode(raw: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/([A-Z0-9]{4})([A-Z0-9]{4})$/, "$1-$2");
}

export function generateCustomerCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const nums = "0123456789";
  const pick = (pool: string, n: number) =>
    Array.from(
      { length: n },
      () => pool[Math.floor(Math.random() * pool.length)]
    ).join("");
  return `${pick(letters, 4)}-${pick(nums, 4)}`;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data() as any;
  return {
    uid,
    email: d.email,
    displayName: d.displayName ?? null,
    photoURL: d.photoURL ?? null,
    role: (d.role as any) ?? "user",
    customerCode: d.customerCode,
    balance: typeof d.balance === "number" ? d.balance : 0,
    createdAt: d.createdAt,
  };
}

export async function getUserByCustomerCode(
  rawCode: string
): Promise<UserProfile | null> {
  const code = normalizeCustomerCode(String(rawCode || ""));
  if (code && code.length >= 28 && !code.includes("-")) {
    return await getUserProfile(code);
  }
  const qy = query(collection(db, "users"), where("customerCode", "==", code));
  const snap = await getDocs(qy);
  if (snap.empty) return null;
  const d = snap.docs[0].data() as any;
  return {
    uid: snap.docs[0].id,
    email: d.email,
    displayName: d.displayName ?? null,
    photoURL: d.photoURL ?? null,
    role: (d.role as any) ?? "user",
    customerCode: d.customerCode,
    balance: typeof d.balance === "number" ? d.balance : 0,
    createdAt: d.createdAt,
  };
}

export async function ensureCustomerCode(uid: string): Promise<string> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("User not found");
  const d = snap.data() as any;
  if (d.customerCode) return d.customerCode;
  const newCode = generateCustomerCode();
  await setDoc(ref, { customerCode: newCode }, { merge: true });
  return newCode;
}

/**
 * Supprime le compte utilisateur (données Firestore + Auth)
 */
export async function deleteUserAccount(uid: string): Promise<void> {
  if (!uid) throw new Error("UID is required");

  // Supprimer les données Firestore de l'utilisateur
  const batch = writeBatch(db);

  // Supprimer le document utilisateur
  const userRef = doc(db, "users", uid);
  batch.delete(userRef);

  // Supprimer les transactions de points de l'utilisateur
  const pointsQuery = query(
    collection(db, "pointTxs"),
    where("uid", "==", uid)
  );
  const pointsSnap = await getDocs(pointsQuery);
  pointsSnap.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Supprimer les coupons de l'utilisateur
  const couponsQuery = query(
    collection(db, "coupons"),
    where("uid", "==", uid)
  );
  const couponsSnap = await getDocs(couponsQuery);
  couponsSnap.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Supprimer les participations aux concours de l'utilisateur
  const contestEntriesQuery = query(
    collection(db, "contestEntries"),
    where("uid", "==", uid)
  );
  const contestEntriesSnap = await getDocs(contestEntriesQuery);
  contestEntriesSnap.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Commit toutes les suppressions Firestore
  await batch.commit();

  // Supprimer le compte Firebase Auth
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.uid === uid) {
    await deleteUser(currentUser);
  }
}
