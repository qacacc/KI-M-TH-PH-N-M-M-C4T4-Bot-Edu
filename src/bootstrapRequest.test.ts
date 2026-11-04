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

  it("reset() buộc tải lại lần kế tiếp thay vì dùng promise cũ", async () => {
    const load = vi.fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second");
    const request = createBootstrapRequest(load);
    await expect(request.get()).resolves.toBe("first");
    // Không reset → vẫn dùng cache (promise đã fulfilled)
    await expect(request.get()).resolves.toBe("first");
    // Reset → buộc tải lại
    request.reset();
    await expect(request.get()).resolves.toBe("second");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("timeout tự reject với BOOTSTRAP_TIMEOUT sau đủ thời gian", async () => {
    vi.useFakeTimers();
    const load = vi.fn(() => new Promise<string>(() => { /* không bao giờ resolve */ }));
    // Đặt timeout = 100ms để test nhanh
    const request = createBootstrapRequest(load, 100);
    const p = request.get();
    vi.advanceTimersByTime(150);
    await expect(p).rejects.toThrow("BOOTSTRAP_TIMEOUT");
    vi.useRealTimers();
  });

  it("sau timeout, reset() cho phép thử lại thành công", async () => {
    vi.useFakeTimers();
    const load = vi.fn()
      .mockImplementationOnce(() => new Promise<string>(() => { /* không bao giờ resolve - sẽ timeout */ }))
      .mockImplementationOnce(() => Promise.resolve("recovered"));
    const request = createBootstrapRequest(load, 50);
    const p1 = request.get();
    vi.advanceTimersByTime(100);
    await expect(p1).rejects.toThrow("BOOTSTRAP_TIMEOUT");
    vi.useRealTimers();
    // Sau timeout: pending đã bị xóa, reset() và get() tải lại ngay
    request.reset();
    await expect(request.get()).resolves.toBe("recovered");
    expect(load).toHaveBeenCalledTimes(2);
  });

});
