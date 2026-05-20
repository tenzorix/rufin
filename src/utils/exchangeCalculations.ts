import { BUY_COMMISSION_USD, SELL_COMMISSION_USD } from "@/constants/exchange";
export type ExchangeDirection = "BUY" | "SELL";

type ExchangeCalcParams = {
  amount: number;
  direction: ExchangeDirection;
  buyRate: number;
  sellRate: number;
  sellCommissionUsd?: number;
};

type ExchangeOutputParams = {
  amount: number;
  direction: ExchangeDirection;
  rate: number;
  sellCommissionUsd?: number;
};

type ExchangeRubAmountParams = {
  amount: number;
  direction: ExchangeDirection;
  rate: number;
};

export function parseAmount(input: string): number | null {
  if (input.trim() === "") return null;
  const n = Number(input);
  return Number.isFinite(n) ? n : null;
}

export function formatAmountTrimZeros(value: number, maxDecimals = 8): string {
  if (!Number.isFinite(value)) return "";
  const s = value.toFixed(maxDecimals);

  if (!s.includes(".")) return s;
  const trimmed = s.replace(/\.?0+$/, "");
  return trimmed.length > 0 ? trimmed : "0";
}

export function roundUsdTwoDecimals(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 100) / 100;
}

export function formatUsdAmount(value: number): string {
  return formatAmountTrimZeros(roundUsdTwoDecimals(value), 2);
}

export function formatRubAmount(value: number): string {
  return formatAmountTrimZeros(Math.round(value), 0);
}

export function getRateByDirection(
  direction: ExchangeDirection,
  buyRate: number,
  sellRate: number
): number {
  return direction === "BUY" ? buyRate : sellRate;
}

export function calculateOutputAmount({
  amount,
  direction,
  rate,
  sellCommissionUsd,
}: ExchangeOutputParams): number {
  if (direction === "BUY") {
    const usdAmount = amount / rate;
    return Math.max(0, usdAmount - BUY_COMMISSION_USD);
  }

  const fee = sellCommissionUsd ?? SELL_COMMISSION_USD;
  const effectiveUsd = Math.max(0, amount - fee);
  return effectiveUsd * rate;
}

export function calculateToAmount(params: ExchangeCalcParams): string {
  const rate = getRateByDirection(params.direction, params.buyRate, params.sellRate);
  const out = calculateOutputAmount({
    amount: params.amount,
    direction: params.direction,
    rate,
    sellCommissionUsd: params.sellCommissionUsd,
  });
  if (params.direction === "BUY") {
    return formatUsdAmount(out);
  }
  return formatRubAmount(out);
}


export function calculateFromAmountForTargetTo(
  targetOutput: number,
  direction: ExchangeDirection,
  buyRate: number,
  sellRate: number,
  sellCommissionUsd?: number
): string | null {
  if (!Number.isFinite(targetOutput) || targetOutput < 0) return null;
  const rate = getRateByDirection(direction, buyRate, sellRate);
  if (!Number.isFinite(rate) || rate <= 0) return null;

  const sellFee = sellCommissionUsd ?? SELL_COMMISSION_USD;
  let from: number;
  if (direction === "BUY") {
    from = (targetOutput + BUY_COMMISSION_USD) * rate;
  } else {
    from = targetOutput / rate + sellFee;
  }
  if (!Number.isFinite(from) || from <= 0) return null;

  if (direction === "BUY") {
    return formatRubAmount(from);
  }
  return formatUsdAmount(from);
}

export function calculateRubResult({
  amount,
  direction,
  buyRate,
  sellRate,
  sellCommissionUsd,
}: ExchangeCalcParams): number | null {
  const rate = getRateByDirection(direction, buyRate, sellRate);
  if (rate === 0) return null;
  if (direction === "BUY") return Math.round(amount);
  const fee = sellCommissionUsd ?? SELL_COMMISSION_USD;
  return Math.round(Math.max(0, amount - fee) * rate);
}

export function calculateAmountRubForRequest({
  amount,
  direction,
  rate,
}: ExchangeRubAmountParams): number {
  if (direction === "BUY") return Math.round(amount);
  return Math.round(Math.max(0, amount - SELL_COMMISSION_USD) * rate);
}

export function isEmptyOrZeroAmount(parsedAmount: number | null): boolean {
  return parsedAmount === null || parsedAmount === 0;
}
