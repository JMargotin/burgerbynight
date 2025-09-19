import type { Reward } from "@/types";
import { spendPoints } from "./balance.service";
import { createRewardCoupon } from "./coupon.service";

export async function claimReward(uid: string, reward: Reward) {
  const coupon = await createRewardCoupon(uid, reward.title, reward.image);
  await spendPoints(uid, reward.pointsCost, `Récompense: ${reward.title}`);
  return coupon;
}
