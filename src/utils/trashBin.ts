export interface TrashItem {
  id: string;
  name: string;
  path: string;
  sizeBytes: number;
  deletedAt: string;
  fileType: string;
}

const TRASH_BIN_KEY = "ca_local_trash_bin_v1";

/**
 * Lấy danh sách file trong Thùng rác local
 */
export function getTrashItems(): TrashItem[] {
  try {
    const raw = localStorage.getItem(TRASH_BIN_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Di chuyển file vào Thùng rác local
 */
export function moveToTrash(item: Omit<TrashItem, "deletedAt">): TrashItem[] {
  const current = getTrashItems();
  const newItem: TrashItem = {
    ...item,
    deletedAt: new Date().toISOString(),
  };
  const updated = [newItem, ...current];
  localStorage.setItem(TRASH_BIN_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Khôi phục file từ Thùng rác local
 */
export function restoreFromTrash(itemId: string): TrashItem[] {
  const current = getTrashItems();
  const updated = current.filter((i) => i.id !== itemId);
  localStorage.setItem(TRASH_BIN_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Dọn sạch toàn bộ Thùng rác local
 */
export function emptyTrashBin(): void {
  localStorage.removeItem(TRASH_BIN_KEY);
}
