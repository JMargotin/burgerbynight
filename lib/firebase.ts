// src/lib/firebase.ts
import Constants from "expo-constants";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const extra = Constants.expoConfig?.extra as any;
const firebaseConfig = extra?.firebase;

if (!firebaseConfig) {
  throw new Error(
    "Firebase config manquante dans app.config.ts > extra.firebase"
  );
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
