export const UNDO_WINDOW_MS = 10_000;

export interface DeletionWindow {
  deletedAt: Date;
  purgeAfter: Date;
}

export function createDeletionWindow(now = new Date()): DeletionWindow {
  return { deletedAt: now, purgeAfter: new Date(now.getTime() + UNDO_WINDOW_MS) };
}

export function canUndoDeletion(purgeAfter: Date, now = new Date()): boolean {
  return now.getTime() < purgeAfter.getTime();
}
