import { describe, expect, it } from "vitest";
import {
  colorWithAlpha,
  contrastRatio,
  defaultAppearance,
  isHexColor,
  isPartialHexColor,
  loadAppearanceSettingsFromStorage,
  saveAppearanceSettingsToStorage,
} from "./useAppearanceDraft";

function fakeStorage(initialValue?: string) {
  const data = new Map<string, string>();
  if (initialValue) data.set("campus-assistant-appearance", initialValue);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    read: (key: string) => data.get(key),
  };
}

describe("appearance draft helpers", () => {
  it("validate mã màu hex đầy đủ và mã đang nhập dở", () => {
    expect(isHexColor("#6d5dfc")).toBe(true);
    expect(isHexColor("#6d5d")).toBe(false);
    expect(isPartialHexColor("#6d5d")).toBe(true);
    expect(isPartialHexColor("6d5dfc")).toBe(false);
  });

  it("load appearance từ storage và fallback khi JSON hỏng", () => {
    const saved = { ...defaultAppearance, backgroundColor: "#ffffff", textColor: "#111827" };
    expect(loadAppearanceSettingsFromStorage(fakeStorage(JSON.stringify(saved)))).toEqual(saved);
    expect(loadAppearanceSettingsFromStorage(fakeStorage("{broken"))).toEqual(defaultAppearance);
  });

  it("save appearance theo key ổn định", () => {
    const storage = fakeStorage();
    saveAppearanceSettingsToStorage(storage, defaultAppearance);
    expect(storage.read("campus-assistant-appearance")).toBe(JSON.stringify(defaultAppearance));
  });

  it("tính màu rgba và contrast để guard theme", () => {
    expect(colorWithAlpha("#000000", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
    expect(contrastRatio("#000000", "#ffffff")).toBeGreaterThan(20);
  });
});
