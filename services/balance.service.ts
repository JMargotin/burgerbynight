import {
  doc,
  writeBatch,
  increment,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function addPointsByAmount(
  uid: string,
  amountEuro: number,
  reason = "Achat"
) {
  const pts = Math.max(0, Math.floor(amountEuro * 1)); // 1€ = 1 pt
  const batch = writeBatch(db);

  const txRef = doc(collection(db, "pointTransactions"));
  batch.set(txRef, {
    uid,
    delta: pts,
    reason: `${reason} (${amountEuro.toFixed(2)}€)`,
    orderAmount: amountEuro,
    createdAt: serverTimestamp(),
  });

  batch.set(
    doc(db, "users", uid),
    { balance: increment(pts) },
    { merge: true }
  );

  await batch.commit();
  return pts;
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

  batch.set(
    doc(db, "users", uid),
    { balance: increment(delta) },
    { merge: true }
  );
  await batch.commit();
}
