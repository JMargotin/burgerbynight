export type CouponStatus = "active" | "used" | "expired";
export type CouponType = "promo" | "reward";

export interface Coupon {
  id: string;
  uid: string;
  title: string;
  code: string;
  type: CouponType;
  status: CouponStatus;
  createdAt?: any;
  usedAt?: any;
}
