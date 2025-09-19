export type CouponStatus = "active" | "used" | "expired";

export type Coupon = {
  id?: string;
  uid: string;
  code: string;
  title: string;
  type: "reward" | "promo";
  pointsCost?: number | null;
  status: CouponStatus;
  createdAt: any;
  expiresAt?: any | null;
  imageUrl?: string;
};
