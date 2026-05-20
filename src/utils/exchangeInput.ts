export function formatAmountForUi(raw: string) {
  if (!raw) return "";

  const sanitized = raw.replace(/\s+/g, "");
  const [intPartRaw, fracPartRaw] = sanitized.split(".");

  const intPart = (intPartRaw ?? "").replace(/^0+(?=\d)/, "");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  if (fracPartRaw === undefined) return grouped || "0";
  return `${grouped || "0"}.${fracPartRaw}`;
}

export function sanitizeExchangeInput(value: string): string {
  let nextRaw = value.replace(/\s+/g, "").replace(/[^\d.]/g, "");
  const firstDot = nextRaw.indexOf(".");
  if (firstDot !== -1) {
    nextRaw = nextRaw.slice(0, firstDot + 1) + nextRaw.slice(firstDot + 1).replace(/\./g, "");
  }
  return nextRaw;
}

export function countDigitsRight(value: string, selectionStart: number): number {
  return value.slice(selectionStart).replace(/[^\d]/g, "").length;
}

export function getCaretIndexByDigitsRight(nextUi: string, digitsRight: number): number {
  let idx = nextUi.length;
  let seenDigits = 0;

  while (idx > 0 && seenDigits < digitsRight) {
    idx -= 1;
    if (/\d/.test(nextUi[idx])) seenDigits += 1;
  }

  return idx;
}
