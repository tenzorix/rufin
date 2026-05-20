import type { Order, Profile } from "../api/schemas";

export function aggregateProfile(rawProfile: Profile, orders: Order[], now = new Date()): Profile {
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const completedOrders = orders.filter((o) => o.status === "done");

  const completedOrders30Days = completedOrders.filter((o) => {
    if (!o.created_at) return false;
    const createdAt = new Date(o.created_at);
    return createdAt >= thirtyDaysAgo;
  });

  const turnover_30days = completedOrders30Days.reduce(
    (sum, o) => sum + (o.amount_usd ?? 0),
    0
  );

  const is_verified = completedOrders.length > 0;

  const active_refs = rawProfile.active_refs ?? 0;
  const calculated_balance = active_refs * 15;

  let calculated_level = 1;
  let level_name = "Начинающий";

  if (turnover_30days >= 500000) {
    calculated_level = 4;
    level_name = "Золотой";
  } else if (turnover_30days >= 300000) {
    calculated_level = 3;
    level_name = "Серебряный";
  } else if (turnover_30days >= 100000) {
    calculated_level = 2;
    level_name = "Бронзовый";
  }

  return {
    ...rawProfile,
    turnover_30days,
    is_verified,
    calculated_balance,
    calculated_level,
    level_name,
  };
}
