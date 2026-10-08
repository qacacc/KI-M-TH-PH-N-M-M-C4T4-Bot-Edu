import type { AppearanceSettings } from "../hooks/useAppearanceDraft";

export interface CustomThemePreset {
  id: string;
  name: string;
  createdAt: string;
  settings: AppearanceSettings;
}

const CUSTOM_PRESETS_KEY = "ca_custom_theme_presets_v1";

/**
 * Lấy danh sách Preset giao diện tùy chỉnh do người dùng tự lưu
 */
export function getCustomPresets(): CustomThemePreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Lưu một Preset giao diện cá nhân mới
 */
export function saveCustomPreset(name: string, settings: AppearanceSettings): CustomThemePreset[] {
  const current = getCustomPresets();
  const newPreset: CustomThemePreset = {
    id: "preset_" + Math.random().toString(36).substring(2, 10),
    name: name.trim() || "Preset Giao diện Cá nhân",
    createdAt: new Date().toLocaleDateString("vi-VN"),
    settings,
  };
  const updated = [newPreset, ...current];
  localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Xóa một Preset giao diện cá nhân
 */
export function deleteCustomPreset(presetId: string): CustomThemePreset[] {
  const current = getCustomPresets();
  const updated = current.filter((p) => p.id !== presetId);
  localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated));
  return updated;
}
