/** Recommended maximum transit duration (days) for perishable commodities. */
export const PERISHABLE_SHELF_LIFE_DAYS: Record<string, number> = {
  "Leafy Greens": 4,
  Tomato: 5,
  Pepper: 7,
  Okra: 5,
};

export function getShelfLifeWarning(
  commodity: string,
  deliveryDeadline: string,
  now: number = Date.now(),
): { limitDays: number; durationDays: number } | null {
  const limitDays = PERISHABLE_SHELF_LIFE_DAYS[commodity];
  if (!limitDays || !deliveryDeadline) return null;
  const end = new Date(deliveryDeadline).getTime();
  if (!Number.isFinite(end)) return null;
  const durationDays = (end - now) / 86_400_000;
  return durationDays > limitDays ? { limitDays, durationDays } : null;
}
