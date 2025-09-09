export type Role = "admin" | "user";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  role: Role;
  customerCode?: string;
  balance: number;
  createdAt?: any; // Firestore Timestamp | Date
}
