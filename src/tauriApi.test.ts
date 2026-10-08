import { afterEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { openExternalUrl } from "./tauriApi";
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks(); });
describe("mở portal desktop", () => {
  it("đợi command Rust thành công mới resolve", async () => {
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    vi.mocked(invoke).mockResolvedValue(undefined);
    await expect(openExternalUrl("https://portal.ut.edu.vn/")).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledWith("open_external_url", { url: "https://portal.ut.edu.vn/" });
  });
  it("không nuốt lỗi Rust rồi báo đã mở thành công", async () => {
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    vi.mocked(invoke).mockRejectedValue(new Error("Không mở được trình duyệt"));
    await expect(openExternalUrl("https://portal.ut.edu.vn/")).rejects.toThrow("Không mở được trình duyệt");
  });
});
