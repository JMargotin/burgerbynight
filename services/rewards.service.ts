import type { Reward } from "@/types";
import { createRewardCoupon } from "./coupon.service";
import { spendPoints } from "./balance.service";

export async function claimReward(uid: string, reward: Reward) {
  const coupon = await createRewardCoupon(uid, reward.title);
  await spendPoints(uid, reward.pointsCost, `Récompense: ${reward.title}`);
  return coupon;
}
