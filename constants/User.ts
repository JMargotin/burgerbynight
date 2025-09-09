export type UserRole = "admin" | "user";

export type UserProfile = {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  role: UserRole;
  customerCode: string;
  balance: number;
  createdAt: number;
};