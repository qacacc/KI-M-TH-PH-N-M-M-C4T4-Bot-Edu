import { describe, expect, it, vi } from "vitest";
import { createBootstrapRequest } from "./bootstrapRequest";

describe("vòng đời yêu cầu bootstrap", () => {
  it("setup lại dùng cùng promise, bỏ callback đã cleanup", async () => {
    let resolve!: (value: string) => void;
    const load = vi.fn(() => new Promise<string>((done) => { resolve = done; }));
    const request = createBootstrapRequest(load);
    let cancelled = false;
    const first = vi.fn();
    const second = vi.fn();
    const promise = request.get();
    const observer1 = promise.then((value) => { if (!cancelled) first(value); });
    cancelled = true;
    expect(request.get()).toBe(promise);
    const observer2 = request.get().then(second);
    await Promise.resolve();
    resolve("ready");
    await Promise.all([observer1, observer2]);
    expect(load).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("ready");
  });

  it("lỗi không tạo dữ liệu giả và cho phép thử lại", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("DB unavailable")).mockResolvedValueOnce("ready");
    const request = createBootstrapRequest(load);
    await expect(request.get()).rejects.toThrow("DB unavailable");
    await expect(request.get()).resolves.toBe("ready");
    await expect(request.get()).resolves.toBe("ready");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("bắt cả lỗi đồng bộ của loader", async () => {
    const request = createBootstrapRequest(() => { throw new Error("blocked"); });
    await expect(request.get()).rejects.toThrow("blocked");
    await expect(request.get()).rejects.toThrow("blocked");
  });
});
