import { z } from "zod";

// 1) GET /lumo/rates/current
export const lumoRatesCurrentResponseSchema = z.object({
  ok: z.boolean(),
  pair: z.string(),
  rate: z.number(),
  timestamp: z.string(),
});
export type LumoRatesCurrentResponse = z.infer<typeof lumoRatesCurrentResponseSchema>;

// 2) GET /lumo/wallet
export const lumoWalletResponseSchema = z.object({
  walletId: z.string(),
  address: z.string(),
  externalId: z.string(),
  isNew: z.boolean(),
  replaced: z.boolean(),
});
export type LumoWalletResponse = z.infer<typeof lumoWalletResponseSchema>;

// 3) GET /lumo/balance
export const lumoBalanceResponseSchema = z.object({
  balance: z.number(),
  frozen: z.number(),
  available: z.number(),
});
export type LumoBalanceResponse = z.infer<typeof lumoBalanceResponseSchema>;

// 4) GET /lumo/balance/history
export const lumoBalanceHistoryTxSchema = z.object({
  id: z.string(),
  type: z.string(),
  amount: z.number(),
  balance_after: z.number(),
  lumo_deposit_tx_hash: z.string().nullable().optional(),
  lumo_qr_order_id: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  created_at: z.string(),
});

export const lumoBalanceHistoryResponseSchema = z.object({
  transactions: z.array(lumoBalanceHistoryTxSchema),
  total: z.number(),
});
export type LumoBalanceHistoryResponse = z.infer<typeof lumoBalanceHistoryResponseSchema>;
export type LumoBalanceHistoryTx = z.infer<typeof lumoBalanceHistoryTxSchema>;

// 5.1) POST /lumo/qr/prepare
export const lumoQrPrepareBodySchema = z.object({
  qrCode: z.string().min(1),
});
export type LumoQrPrepareBody = z.infer<typeof lumoQrPrepareBodySchema>;

export const lumoQrPrepareResponseSchema = z
  .object({
    orderId: z.string(),
    quoteId: z.string(),
    amountRub: z.number(),
    amountUsdtLumo: z.number(),
    rateLumo: z.number(),
    expiresAt: z.string(),
    userRate: z.number(),
    userAmountUsdt: z.number(),

    // Optional fields if backend provides merchant info
    merchantName: z.string().nullable().optional(),
    merchant: z.string().nullable().optional(),
  })
  .passthrough();
export type LumoQrPrepareResponse = z.infer<typeof lumoQrPrepareResponseSchema>;

// 5.2) POST /lumo/qr/:orderId/accept
export const lumoQrAcceptResponseSchema = z.object({
  orderId: z.string(),
  lumoOrderId: z.string().nullable().optional(),
  status: z.string(),
  amountRub: z.number(),
  amountUsdt: z.number(),
  paymentUntil: z.string(),
  frozenAmount: z.number(),
});
export type LumoQrAcceptResponse = z.infer<typeof lumoQrAcceptResponseSchema>;

export const lumoQrAcceptInsufficientErrorSchema = z.object({
  error: z.literal("Insufficient balance"),
  available: z.number(),
  required: z.number(),
});
export type LumoQrAcceptInsufficientError = z.infer<
  typeof lumoQrAcceptInsufficientErrorSchema
>;

// 5.3) GET /lumo/qr/:orderId/status
export const lumoQrStatusResponseSchema = z.object({
  orderId: z.string(),
  status: z.string(),
  lumoStatus: z.string().nullable().optional(),
  isFinal: z.boolean(),
  newBalance: z.number().optional(),
});
export type LumoQrStatusResponse = z.infer<typeof lumoQrStatusResponseSchema>;

// --- POST /lumo/exchange-order ---
export const lumoExchangeOrderBodySchema = z.object({
  amountUsdt: z.number().positive(),
});
export type LumoExchangeOrderBody = z.infer<typeof lumoExchangeOrderBodySchema>;

export const lumoExchangeOrderResponseSchema = z
  .object({
    success: z.boolean(),
    orderId: z.union([z.string(), z.number()]),
    amountUsdt: z.number(),
    amountRub: z.number(),
    rate: z.number(),
    fee: z.number(),
    totalDebited: z.number(),
    newBalance: z.number(),
    status: z.string(),
  })
  .passthrough();
export type LumoExchangeOrderResponse = z.infer<typeof lumoExchangeOrderResponseSchema>;
