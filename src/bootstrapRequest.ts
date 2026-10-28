/**
 * Quản lý vòng đời yêu cầu bootstrap.
 *
 * Tính năng:
 * - Giữ nguyên promise đang chạy qua các lần setup/cleanup (tương thích StrictMode).
 * - Tự reset sau lỗi để cho phép thử lại.
 * - Hỗ trợ timeout: sau `timeoutMs` ms, reject với lỗi "BOOTSTRAP_TIMEOUT".
 * - Bắt cả lỗi đồng bộ của loader.
 */
export function createBootstrapRequest<T>(
  load: () => Promise<T>,
  timeoutMs = 12_000,
) {
  let pending: Promise<T> | null = null;

  return {
    get(): Promise<T> {
      if (!pending) {
        let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

        const loadPromise = Promise.resolve()
          .then(load)
          .catch((error: unknown) => {
            pending = null;
            throw error;
          });

        const timeoutPromise = new Promise<T>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            pending = null;
            reject(new Error("BOOTSTRAP_TIMEOUT"));
          }, timeoutMs);
        });

        pending = Promise.race([loadPromise, timeoutPromise]).finally(() => {
          if (timeoutHandle !== null) clearTimeout(timeoutHandle);
        }) as Promise<T>;

        // Khi promise chính hoàn thành (dù thành công hay lỗi) → xóa timeout
        pending.catch(() => {
          // đã xử lý ở trên
        });
      }
      return pending;
    },

    /** Buộc hủy promise đang chờ và cho phép thử lại ngay lần kế tiếp. */
    reset(): void {
      pending = null;
    },
  };
}
