import { describe, expect, it } from "vitest";
import { resetLocalConfiguration } from "./resetConfig";

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => values.set(key, value),
    values,
  };
}

describe("resetLocalConfiguration", () => {
  it("chỉ xóa key cấu hình và giữ lại dữ liệu GPA, chat, hồ sơ", () => {
    const storage = createStorage({
      "ca-settings-default-view": "chat",
      "campus-assistant-layout": "{}",
      ca_gpa_calculator_data_v1: "gpa",
      "chat-history": "history",
      "ca-school-profile-v1": "profile",
    });

    const result = resetLocalConfiguration(storage);

    expect(result).toEqual({
      removed: ["ca-settings-default-view", "campus-assistant-layout"],
      failed: [],
    });
    expect(storage.values.get("ca_gpa_calculator_data_v1")).toBe("gpa");
    expect(storage.values.get("chat-history")).toBe("history");
    expect(storage.values.get("ca-school-profile-v1")).toBe("profile");
  });

  it("ghi nhận key bị chặn thay vì làm crash thao tác reset", () => {
    const storage = createStorage({ "ca-settings-dev-mode": "true" });
    storage.removeItem = () => {
      throw new Error("storage blocked");
    };

    expect(resetLocalConfiguration(storage)).toEqual({
      removed: [],
      failed: ["ca-settings-dev-mode"],
    });
  });
});
