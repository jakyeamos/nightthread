import type { ItineraryItemKind } from "@/domain/types";

export interface OrderedItem { id: string; position: number }
export interface ReplaceableItem extends OrderedItem {
  dayId: string;
  kind: ItineraryItemKind;
  savedIdeaId: string | null;
  placeholderType: string | null;
  startMinute: number | null;
  durationMinutes: number;
}

export function reindexItems(items: readonly OrderedItem[]): OrderedItem[] {
  return items.map((item, position) => ({ ...item, position }));
}

export function moveItem(items: readonly OrderedItem[], itemId: string, targetIndex: number): OrderedItem[] {
  const next = [...items];
  const sourceIndex = next.findIndex((item) => item.id === itemId);
  if (sourceIndex < 0) return reindexItems(next);
  const [item] = next.splice(sourceIndex, 1);
  next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, item);
  return reindexItems(next);
}

export function replacePlaceholder(item: ReplaceableItem, savedIdeaId: string): ReplaceableItem {
  if (item.kind !== "placeholder") throw new Error("ITEM_IS_NOT_PLACEHOLDER");
  return { ...item, kind: "activity", savedIdeaId, placeholderType: null };
}

export function calendarDateForOrdinal(startDate: string | null, ordinal: number): string | null {
  if (!startDate) return null;
  const date = new Date(`${startDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + ordinal - 1);
  return date.toISOString().slice(0, 10);
}

export function parseCost(amount: string, currency: string): { amountMinor: number; currency: string } | null {
  if (amount.trim() === "" && currency.trim() === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(amount) || !/^[A-Za-z]{3}$/.test(currency)) throw new Error("INVALID_COST");
  return { amountMinor: Math.round(Number(amount) * 100), currency: currency.toUpperCase() };
}
