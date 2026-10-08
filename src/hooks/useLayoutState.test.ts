import { describe, expect, it } from "vitest";
import {
  defaultLayoutWidths,
  loadLayoutWidthsFromStorage,
  sanitizeLayoutWidths,
  saveLayoutWidthsToStorage,
  snapColumnWidth,
} from "./useLayoutState";

function fakeStorage(initialValue?: string) {
  const data = new Map<string, string>();
  if (initialValue) data.set("campus-assistant-layout", initialValue);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    read: (key: string) => data.get(key),
  };
}

describe("layout width state helpers", () => {
  it("collapse cột khi kéo nhỏ hơn ngưỡng một nửa", () => {
    expect(snapColumnWidth(40, 104, 360)).toBe(0);
  });

  it("clamp width vào giới hạn từng cột", () => {
    expect(sanitizeLayoutWidths({ sidebar: 999, utility: 20, customize: 180 })).toEqual({
      sidebar: 360,
      utility: 0,
      customize: 190,
    });
  });

  it("load layout từ storage và fallback khi JSON hỏng", () => {
    const storage = fakeStorage(JSON.stringify({ sidebar: 300, utility: 180, customize: 440 }));
    expect(loadLayoutWidthsFromStorage(storage)).toEqual({ sidebar: 300, utility: 180, customize: 440 });
    expect(loadLayoutWidthsFromStorage(fakeStorage("{broken"))).toEqual(defaultLayoutWidths);
  });

  it("save layout vào storage theo key ổn định", () => {
    const storage = fakeStorage();
    const widths = { sidebar: 104, utility: 0, customize: 460 };
    saveLayoutWidthsToStorage(storage, widths);
    expect(storage.read("campus-assistant-layout")).toBe(JSON.stringify(widths));
  });
});
