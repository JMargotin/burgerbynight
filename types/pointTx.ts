export interface PointTx {
  id?: string;
  uid: string;
  delta: number; // + / -
  reason?: string | null;
  orderAmount?: number | null;
  createdAt?: any; // Firestore Timestamp | Date
}
