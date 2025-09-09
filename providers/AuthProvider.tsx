import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as fbUpdateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import type { UserProfile } from "@/constants/User.js";

type AuthContextValue = {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
});

function generateCustomerCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const nums = "0123456789";
  const pick = (pool: string, n: number) =>
    Array.from(
      { length: n },
      () => pool[Math.floor(Math.random() * pool.length)]
    ).join("");
  return `${pick(letters, 4)}-${pick(nums, 4)}`;
}

async function ensureUserProfile(fbUser: FirebaseUser): Promise<void> {
  const ref = doc(db, "users", fbUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: fbUser.uid,
      email: fbUser.email || "",
      displayName: fbUser.displayName ?? null,
      photoURL: fbUser.photoURL ?? null,
      role: "user",
      customerCode: generateCustomerCode(),
      createdAt: serverTimestamp(),
    });
  }
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);

      // Nettoie l'ancien onSnapshot si on change d'utilisateur / logout
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (!fbUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // S'assure que le profil existe
      await ensureUserProfile(fbUser);

      // 🔴 ICI: écoute TEMPS RÉEL du doc user (rôle inclus)
      const ref = doc(db, "users", fbUser.uid);
      unsubUserDoc = onSnapshot(
        ref,
        async (snap) => {
          const data = snap.data();
          if (!data) {
            setProfile(null);
            setLoading(false);
            return;
          }
          const p: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || "",
            displayName: fbUser.displayName ?? data.displayName ?? null,
            photoURL: fbUser.photoURL ?? data.photoURL ?? null,
            role: (data.role as "admin" | "user") ?? "user",
            customerCode: data.customerCode,
            balance: typeof data.balance === "number" ? data.balance : 0,
            createdAt:
              typeof data.createdAt === "number" ? data.createdAt : Date.now(),
          };

          // Optionnel: pousse le displayName vers Auth si absent
          if (!fbUser.displayName && p.displayName) {
            try {
              await fbUpdateProfile(fbUser, {
                displayName: p.displayName || undefined,
              });
            } catch {}
          }

          setProfile(p);
          setLoading(false);
        },
        (err) => {
          console.warn("onSnapshot users error:", err);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading }),
    [user, profile, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
