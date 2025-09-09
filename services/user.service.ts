import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types";

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
