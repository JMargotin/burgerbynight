import type { Reward } from "@/types";
import { spendPoints } from "./balance.service";
import { createRewardCoupon } from "./coupon.service";

export async function claimReward(uid: string, reward: Reward) {
  // D'abord vérifier et dépenser les points (opération critique)
  await spendPoints(uid, reward.pointsCost, `Récompense: ${reward.title}`);

  // Ensuite créer le coupon (si les points ont été dépensés avec succès)
  const coupon = await createRewardCoupon(uid, reward.title, reward.image);
  return coupon;
}
