/**
 * useAppBootstrap — vòng đời khởi động hệ thống (CA-096.02)
 *
 * Quản lý:
 * - Khởi tạo BootstrapState từ native layer (initApp)
 * - Slow-state sau 5 giây, timeout sau 12 giây (BOOTSTRAP_TIMEOUT)
 * - Retry: tăng attempt → reset promise → gọi lại initApp
 * - Tương thích React StrictMode: isCancelled flag + shared promise
 */
import { useEffect, useRef, useState } from "react";
import { createBootstrapRequest } from "../bootstrapRequest";
import { initApp } from "../tauriApi";
import type { BootstrapState } from "../types";

export interface AppBootstrapResult {
  /** Dữ liệu khởi động đầy đủ. null khi chưa xong hoặc lỗi. */
  bootstrap: BootstrapState | null;
  /** Đang khởi tạo và đã quá 5 giây — hiển thị spinner chờ. */
  bootstrapSlow: boolean;
  /** Khởi tạo thất bại — hiển thị nút Thử lại. */
  bootstrapError: boolean;
  /** Tăng giá trị này để trigger retry. */
  retryBootstrap: () => void;
  /** Cập nhật bootstrap state từ bên ngoài (vd: sau khi hydrate appearance). */
  setBootstrap: React.Dispatch<React.SetStateAction<BootstrapState | null>>;
}

export function useAppBootstrap(
  onSuccess: (state: BootstrapState) => void,
): AppBootstrapResult {
  const [bootstrap, setBootstrap] = useState<BootstrapState | null>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [bootstrapError, setBootstrapError] = useState(false);
  const [bootstrapSlow, setBootstrapSlow] = useState(false);
  const bootstrapRequestRef = useRef(createBootstrapRequest(initApp));

  useEffect(() => {
    setBootstrapError(false);
    setBootstrapSlow(false);
    let isCancelled = false;
    const deferredTimers: number[] = [];

    const defer = (task: () => void, delayMs: number) => {
      const timer = window.setTimeout(() => {
        if (!isCancelled) task();
      }, delayMs);
      deferredTimers.push(timer);
      return timer;
    };
    void defer; // suppress unused warning — available for future deferred side effects

    // Retry: reset promise để buộc gọi lại initApp.
    if (bootstrapAttempt > 0) {
      bootstrapRequestRef.current.reset();
    }

    // Slow-timer: sau 5 giây chưa xong → hiển thị thông báo chờ.
    const slowTimer = window.setTimeout(() => {
      if (!isCancelled) setBootstrapSlow(true);
    }, 5_000);

    bootstrapRequestRef.current
      .get()
      .then((state) => {
        if (isCancelled) return;
        window.clearTimeout(slowTimer);
        setBootstrapSlow(false);
        setBootstrap(state);
        onSuccess(state);
      })
      .catch((err: unknown) => {
        if (isCancelled) return;
        window.clearTimeout(slowTimer);
        setBootstrapSlow(false);
        setBootstrapError(true);
        const isTimeout =
          err instanceof Error && err.message === "BOOTSTRAP_TIMEOUT";
        console.error(
          isTimeout
            ? "[Bootstrap] Native layer không phản hồi sau 12 giây."
            : "[Bootstrap] Lỗi khởi tạo:",
          err,
        );
      });

    return () => {
      isCancelled = true;
      window.clearTimeout(slowTimer);
      deferredTimers.forEach((timer) => window.clearTimeout(timer));
    };
    // bootstrapAttempt là dependency duy nhất; onSuccess ổn định do là callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapAttempt]);

  const retryBootstrap = () =>
    setBootstrapAttempt((attempt) => attempt + 1);

  return {
    bootstrap,
    bootstrapSlow,
    bootstrapError,
    retryBootstrap,
    setBootstrap,
  };
}
