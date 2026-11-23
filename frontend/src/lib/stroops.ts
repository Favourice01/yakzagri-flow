/** Decimal-safe amount math using integer stroops (1 unit = 10^7 stroops). */
const STROOPS_PER_UNIT = 10_000_000n;
const SCALE = 7;

/** Parse a decimal amount (number or string) to stroops, rounding half up. */
export function toStroops(amount: number | string): bigint {
  let s = typeof amount === "number" ? amount.toFixed(SCALE + 3) : amount.trim();
  if (!/^-?\d*\.?\d*$/.test(s) || s === "" || s === "." || s === "-") return 0n;
  const neg = s.startsWith("-");
  if (neg) s = s.slice(1);
  const [whole = "0", frac = ""] = s.split(".");
  const padded = (frac + "0".repeat(SCALE + 1)).slice(0, SCALE + 1);
  let v = BigInt(whole || "0") * STROOPS_PER_UNIT + BigInt(padded.slice(0, SCALE));
  if (Number(padded[SCALE]) >= 5) v += 1n;
  return neg ? -v : v;
}

/** Format stroops as a decimal string, trimming trailing zeros. */
export function fromStroops(stroops: bigint): string {
  const neg = stroops < 0n;
  const abs = neg ? -stroops : stroops;
  const whole = abs / STROOPS_PER_UNIT;
  const frac = (abs % STROOPS_PER_UNIT).toString().padStart(SCALE, "0").replace(/0+$/, "");
  return `${neg ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
}

/** Fee in stroops for a basis-point rate, rounded half up to 2 decimals (cent). */
export function feeStroops(totalStroops: bigint, bps: number): bigint {
  const raw = (totalStroops * BigInt(bps) * 2n + 10_000n) / 20_000n; // half-up
  const cent = STROOPS_PER_UNIT / 100n;
  return ((raw * 2n + cent) / (cent * 2n)) * cent;
}

/** Fee and net payout as numbers rounded to 2 decimals, computed in integer math. */
export function computeFee(total: number, bps = 100): { fee: number; net: number } {
  const t = toStroops(total);
  const fee = feeStroops(t, bps);
  return { fee: Number(fromStroops(fee)), net: Number(fromStroops(t - fee)) };
}
