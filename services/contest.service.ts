import { db } from "@/lib/firebase";
import type { Contest, ContestStats } from "@/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

export async function getActiveContest(): Promise<Contest | null> {
  const ref = collection(db, "contests");
  const now = Date.now();
  // Stratégie sans index composite: where simple puis filtrage/tri en mémoire
  const qy = query(ref, where("active", "==", true), limit(20));
  const snap = await getDocs(qy);
  if (snap.empty) return null;
  const items = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) } as Contest))
    .filter((c) => typeof c.closesAt === "number" && c.closesAt > now)
    .sort((a, b) => (a.closesAt || 0) - (b.closesAt || 0));
  return items.length ? items[0] : null;
}

export async function getContestById(id: string): Promise<Contest | null> {
  const ref = doc(db, "contests", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as Contest;
}

export async function getContestStats(
  contestId: string,
  uid: string
): Promise<ContestStats | null> {
  const contest = await getContestById(contestId);
  if (!contest) return null;

  // Total tickets depuis le doc (si inexistant, on recalcule à 0)
  const totalTickets = typeof contest.totalTickets === "number" ? contest.totalTickets : 0;

  // Tickets utilisateur (stockés sous sous-collection du concours)
  const partRef = doc(db, "contests", contestId, "participants", uid);
  const partSnap = await getDoc(partRef);
  const userTickets = partSnap.exists()
    ? (partSnap.data() as any).numTickets || 0
    : 0;

  const probability = totalTickets > 0 ? userTickets / totalTickets : 0;

  return { contest, userTickets, totalTickets, probability };
}

export async function purchaseContestTickets(
  contestId: string,
  uid: string,
  quantity: number,
  ticketCostPoints: number
): Promise<{ userTickets: number; totalTickets: number }> {
  const qty = Math.max(1, Math.floor(quantity));

  // Lecture du concours pour valider l'état
  const contest = await getContestById(contestId);
  if (!contest) throw new Error("Concours introuvable");
  const now = Date.now();
  if (!contest.active || now >= contest.closesAt) {
    throw new Error("Concours terminé ou inactif");
  }

  const cost = qty * ticketCostPoints;

  // Batch: 1) pointTransactions (delta négatif), 2) users.balance decrement, 3) participant tickets increment, 4) contest.totalTickets increment
  const batch = writeBatch(db);

  // 1) et 2) enreg. décrément des points (similaire à spendPoints)
  const txRef = doc(collection(db, "pointTransactions"));
  batch.set(txRef, {
    uid,
    delta: -Math.abs(cost),
    reason: `Concours ${contest.title || contest.id} - ${qty} ticket(s)`,
    orderAmount: null,
    createdAt: serverTimestamp(),
  });
  const userRef = doc(db, "users", uid);
  batch.set(userRef, { balance: increment(-Math.abs(cost)) }, { merge: true });

  // 3) participant increment (sous-collection par utilisateur)
  const partRef = doc(db, "contests", contestId, "participants", uid);
  batch.set(
    partRef,
    {
      uid,
      numTickets: increment(qty) as unknown as number,
      pointsSpent: increment(Math.abs(cost)) as unknown as number,
      updatedAt: serverTimestamp(),
      lastPurchaseAt: serverTimestamp(),
    } as any,
    { merge: true }
  );

  // 4) contest totalTickets increment
  const contestRef = doc(db, "contests", contestId);
  batch.set(
    contestRef,
    {
      totalTickets: increment(qty) as unknown as number,
      updatedAt: serverTimestamp(),
    } as any,
    { merge: true }
  );

  await batch.commit();

  // Retourne les compteurs mis à jour
  const [partAfter, contestAfter] = await Promise.all([
    getDoc(partRef),
    getDoc(contestRef),
  ]);
  const userTickets = partAfter.exists()
    ? (partAfter.data() as any).numTickets || 0
    : 0;
  const totalTickets = contestAfter.exists()
    ? (contestAfter.data() as any).totalTickets || 0
    : 0;

  return { userTickets, totalTickets };
}

export function listenContestStats(
  contestId: string,
  uid: string,
  cb: (stats: ContestStats) => void
) {
  const contestRef = doc(db, "contests", contestId);
  const partRef = doc(db, "contests", contestId, "participants", uid);

  let lastContest: Contest | null = null;
  let lastTickets = 0;

  const emit = () => {
    if (!lastContest) return;
    const totalTickets = typeof lastContest.totalTickets === "number" ? lastContest.totalTickets : 0;
    const userTickets = lastTickets || 0;
    const probability = totalTickets > 0 ? userTickets / totalTickets : 0;
    cb({ contest: lastContest, userTickets, totalTickets, probability });
  };

  const unsubContest = onSnapshot(
    contestRef,
    (snap) => {
      if (!snap.exists()) return;
      lastContest = { id: snap.id, ...(snap.data() as any) } as Contest;
      emit();
    },
    (err) => {
      console.warn("listenContestStats contest error", err?.message || err);
    }
  );
  const unsubPart = onSnapshot(
    partRef,
    (snap) => {
      lastTickets = snap.exists() ? (snap.data() as any).numTickets || 0 : 0;
      emit();
    },
    (err) => {
      // En cas de permission refusée, on garde 0 ticket côté UI
      console.warn("listenContestStats participant error", err?.message || err);
    }
  );

  return () => {
    unsubContest();
    unsubPart();
  };
}

// --- Admin helpers ---

export async function fetchContests(take = 20): Promise<Contest[]> {
  const ref = collection(db, "contests");
  try {
    const qy = query(ref, orderBy("createdAt", "desc"), limit(take));
    const snap = await getDocs(qy);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Contest));
  } catch {
    const snap = await getDocs(ref);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) } as Contest))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, take);
  }
}

export async function createContest(input: {
  title: string;
  prize: string;
  ticketCostPoints: number;
  closesAt: number; // epoch ms
  active: boolean;
  imageUrl?: string;
}): Promise<Contest> {
  const id = doc(collection(db, "contests")).id;
  const ref = doc(db, "contests", id);
  const contest: Contest = {
    id,
    title: input.title,
    prize: input.prize,
    ticketCostPoints: Math.max(1, Math.floor(input.ticketCostPoints)),
    closesAt: input.closesAt,
    active: !!input.active,
    imageUrl: input.imageUrl,
    totalTickets: 0,
  } as any;
  await setDoc(ref, { ...contest, createdAt: serverTimestamp() });
  const snap = await getDoc(ref);
  return { id, ...(snap.data() as any) } as Contest;
}

export async function updateContest(
  id: string,
  patch: Partial<Pick<Contest, "title" | "prize" | "ticketCostPoints" | "closesAt" | "active" | "imageUrl">>
): Promise<void> {
  const ref = doc(db, "contests", id);
  await updateDoc(ref, patch as any);
}

export async function toggleContestActive(id: string, active: boolean): Promise<void> {
  const ref = doc(db, "contests", id);
  await updateDoc(ref, { active });
}

export async function endContestNow(id: string): Promise<void> {
  const ref = doc(db, "contests", id);
  await updateDoc(ref, { active: false, closesAt: Date.now() });
}

export async function fetchContestParticipants(
  contestId: string,
  take = 100
): Promise<Array<{ uid: string; numTickets: number; pointsSpent?: number }>> {
  const ref = collection(db, "contests", contestId, "participants");
  try {
    const qy = query(ref, orderBy("numTickets", "desc"), limit(take));
    const snap = await getDocs(qy);
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        uid: d.id || data.uid,
        numTickets: Number(data.numTickets || 0),
        pointsSpent: typeof data.pointsSpent === "number" ? data.pointsSpent : undefined,
      };
    });
  } catch {
    const snap = await getDocs(ref);
    return snap.docs
      .map((d) => {
        const data = d.data() as any;
        return {
          uid: d.id || data.uid,
          numTickets: Number(data.numTickets || 0),
          pointsSpent: typeof data.pointsSpent === "number" ? data.pointsSpent : undefined,
        };
      })
      .sort((a, b) => b.numTickets - a.numTickets)
      .slice(0, take);
  }
}


