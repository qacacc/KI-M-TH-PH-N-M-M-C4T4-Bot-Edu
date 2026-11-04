export const RESETTABLE_CONFIG_KEYS = [
  "ca-settings-lang",
  "ca-settings-default-view",
  "ca-settings-autofocus",
  "ca-settings-dev-mode",
  "campus-assistant-appearance",
  "campus-assistant-layout",
  "campus-assistant-custom-presets",
] as const;

type StorageLike = Pick<Storage, "getItem" | "removeItem">;

export interface ResetConfigurationResult {
  removed: string[];
  failed: string[];
}

/** Chỉ xóa cấu hình giao diện, bố cục và tùy chọn local đã được allowlist. */
export function resetLocalConfiguration(storage: StorageLike): ResetConfigurationResult {
  const removed: string[] = [];
  const failed: string[] = [];

  for (const key of RESETTABLE_CONFIG_KEYS) {
    try {
      if (storage.getItem(key) !== null) {
        storage.removeItem(key);
        removed.push(key);
      }
    } catch {
      failed.push(key);
    }
  }

  return { removed, failed };
}
