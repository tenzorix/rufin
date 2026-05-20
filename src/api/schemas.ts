import { z } from "zod";

// --- GET /rates ---
export const ratesResponseSchema = z.object({
  buy: z.string(),
  sell: z.string(),
});
export type RatesResponse = z.infer<typeof ratesResponseSchema>;

// --- GET /orders/:telegram_user_id ---
export const orderSchema = z.object({
  id: z.number(),
  type: z.string(),
  source: z.string().optional(),
  telegram_user_id: z.string().nullable().optional(),
  status: z.string(),
  amount_rub: z.number().nullable().optional(),
  amount_usd: z.number().nullable().optional(),
  rate_rub: z.number().nullable().optional(),
  name: z.string().nullable().optional(),
  usdt_address: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  deposit_amount: z.number().nullable().optional(),
  deposit_tx_hash: z.string().nullable().optional(),
  is_aml_passed: z.boolean().nullable().optional(),
  aml_risk_indicator: z.string().nullable().optional(),
});
export type Order = z.infer<typeof orderSchema>;

export const ordersResponseSchema = z.array(orderSchema);

// --- GET /profile/:chat_id ---
export const profileResponseSchema = z.object({
  chat_id: z.string().optional(),
  email: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  referer: z.string().nullable().optional(),
  referal_code: z.string().nullable().optional(),
  usdt_address: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  paid: z.number().nullable().optional(),
  is_verified: z.boolean().nullable().optional(),
  active_refs: z.number().optional(),
  calculated_balance: z.number().optional(),
  total_referrals: z.number().optional(),
  completed_orders: z.number().optional(),
  turnover_30days: z.number().optional(),
  total_turnover_rub: z.number().optional(),
  total_turnover_usd: z.number().optional(),
  avg_completed_order_amount: z.number().optional(),
  last_completed_order_date: z.string().nullable().optional(),
  calculated_level: z.number().optional(),
  level_name: z.string().nullable().optional(),
  remember_data: z.boolean().nullable().optional(),
});
export type Profile = z.infer<typeof profileResponseSchema>;

// --- PUT /users/:chat_id/fullname ---
export const updateFullnameBodySchema = z.object({
  lastName: z.string().min(1),
  firstName: z.string().min(1),
  middleName: z.string().optional().nullable(),
});
export type UpdateFullnameBody = z.infer<typeof updateFullnameBodySchema>;

export const updateFullnameResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    chat_id: z.string(),
    fullname: z.string(),
  }),
});
export type UpdateFullnameResponse = z.infer<typeof updateFullnameResponseSchema>;

// --- POST /submit-request ---
export const submitRequestBodySchema = z.object({
  type: z.enum(["buy", "sell"]),
  amount_rub: z.number().positive(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional().nullable(),
  source: z.literal("telegram").default("telegram"),
  telegram_user_id: z.string(),
  usdt_address: z.string().optional().nullable(),
  rememberData: z.boolean().optional(),
});
export type SubmitRequestBody = z.infer<typeof submitRequestBodySchema>;

export const submitRequestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SubmitRequestResponse = z.infer<typeof submitRequestResponseSchema>;
