import type { UserProfile } from "@/constants/User.js";
import { auth, db } from "@/lib/firebase";
import { registerForPushNotificationsAsync } from "@/services/notification.service";
import {
  User as FirebaseUser,
  updateProfile as fbUpdateProfile,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
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
      console.log(
        "Auth state changed:",
        fbUser ? "User logged in" : "User logged out"
      );
      setUser(fbUser);

      // Nettoie l'ancien onSnapshot si on change d'utilisateur / logout
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (!fbUser) {
        console.log("No user, setting profile to null");
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        console.log("Ensuring user profile exists for:", fbUser.uid);
        // S'assure que le profil existe
        await ensureUserProfile(fbUser);

        // 🔴 ICI: écoute TEMPS RÉEL du doc user (rôle inclus)
        const ref = doc(db, "users", fbUser.uid);
        unsubUserDoc = onSnapshot(
          ref,
          async (snap) => {
            const data = snap.data();
            if (!data) {
              console.warn("User document not found for:", fbUser.uid);
              setProfile(null);
              setLoading(false);
              return;
            }

            console.log("User profile loaded:", data);
            const p: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || "",
              displayName: fbUser.displayName ?? data.displayName ?? null,
              photoURL: fbUser.photoURL ?? data.photoURL ?? null,
              role: (data.role as "admin" | "user") ?? "user",
              customerCode: data.customerCode,
              balance: typeof data.balance === "number" ? data.balance : 0,
              createdAt:
                typeof data.createdAt === "number"
                  ? data.createdAt
                  : Date.now(),
            };

            // Optionnel: pousse le displayName vers Auth si absent
            if (!fbUser.displayName && p.displayName) {
              try {
                await fbUpdateProfile(fbUser, {
                  displayName: p.displayName || undefined,
                });
              } catch (error) {
                console.warn("Failed to update profile displayName:", error);
              }
            }

            setProfile(p);
            setLoading(false);

            // Enregistrer le token de notification pour cet utilisateur
            try {
              await registerForPushNotificationsAsync(fbUser.uid);
            } catch (error) {
              console.warn("Failed to register for push notifications:", error);
            }
          },
          (err) => {
            console.error("onSnapshot users error:", err);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Error in auth state change:", error);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  const logout = async () => {
    try {
      console.log("Logging out user...");
      await signOut(auth);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const value = useMemo(
    () => ({ user, profile, loading, logout }),
    [user, profile, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
