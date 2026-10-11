/** Giữ yêu cầu đang chạy qua các lần setup/cleanup; chỉ tạo lại sau lỗi. */
export function createBootstrapRequest<T>(load: () => Promise<T>) {
  let pending: Promise<T> | null = null;
  return {
    get(): Promise<T> {
      if (!pending) {
        pending = Promise.resolve().then(load).catch((error: unknown) => {
          pending = null;
          throw error;
        });
      }
      return pending;
    },
  };
}
