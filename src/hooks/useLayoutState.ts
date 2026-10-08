import { PointerEvent, useEffect, useRef, useState } from "react";

export type LayoutWidths = {
  sidebar: number;
  utility: number;
  customize: number;
};

export type ResizeRegion = keyof LayoutWidths;

type LayoutStorage = Pick<Storage, "getItem" | "setItem">;

const storageKey = "campus-assistant-layout";

export const defaultLayoutWidths: LayoutWidths = {
  sidebar: 240,
  utility: 260,
  customize: 312,
};

const widthLimits: Record<ResizeRegion, { minExpanded: number; max: number }> = {
  sidebar: { minExpanded: 104, max: 360 },
  utility: { minExpanded: 160, max: 420 },
  customize: { minExpanded: 190, max: 460 },
};

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function snapColumnWidth(value: number, minExpanded: number, max: number) {
  if (value <= minExpanded / 2) return 0;
  return clampNumber(value, minExpanded, max);
}

function readWidth(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function sanitizeLayoutWidths(value: Partial<LayoutWidths> = {}): LayoutWidths {
  return {
    sidebar: snapColumnWidth(readWidth(value.sidebar, defaultLayoutWidths.sidebar), widthLimits.sidebar.minExpanded, widthLimits.sidebar.max),
    utility: snapColumnWidth(readWidth(value.utility, defaultLayoutWidths.utility), widthLimits.utility.minExpanded, widthLimits.utility.max),
    customize: snapColumnWidth(readWidth(value.customize, defaultLayoutWidths.customize), widthLimits.customize.minExpanded, widthLimits.customize.max),
  };
}

export function loadLayoutWidthsFromStorage(storage: LayoutStorage | undefined): LayoutWidths {
  try {
    const rawValue = storage?.getItem(storageKey);
    if (!rawValue) return defaultLayoutWidths;
    return sanitizeLayoutWidths(JSON.parse(rawValue) as Partial<LayoutWidths>);
  } catch {
    return defaultLayoutWidths;
  }
}

export function saveLayoutWidthsToStorage(storage: LayoutStorage | undefined, widths: LayoutWidths) {
  try {
    storage?.setItem(storageKey, JSON.stringify(widths));
  } catch {
    // localStorage có thể bị chặn; layout vẫn chạy bằng state trong phiên hiện tại.
  }
}

function getBrowserStorage(): LayoutStorage | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

export function useLayoutState() {
  const [layoutWidths, setLayoutWidths] = useState<LayoutWidths>(() => loadLayoutWidthsFromStorage(getBrowserStorage()));
  const resizeRef = useRef<{ region: ResizeRegion; startX: number; startWidths: LayoutWidths } | null>(null);
  const pendingWidthsRef = useRef<LayoutWidths | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveLayoutWidthsToStorage(getBrowserStorage(), layoutWidths);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [layoutWidths]);

  useEffect(() => {
    function commitPendingWidths() {
      animationFrameRef.current = null;
      const nextWidths = pendingWidthsRef.current;
      if (!nextWidths) return;

      pendingWidthsRef.current = null;
      setLayoutWidths(nextWidths);
    }

    function queueLayoutWidths(nextWidths: LayoutWidths) {
      pendingWidthsRef.current = nextWidths;
      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(commitPendingWidths);
      }
    }

    function getNextWidths(event: globalThis.PointerEvent, resizeState: NonNullable<typeof resizeRef.current>) {
      const delta = event.clientX - resizeState.startX;
      if (resizeState.region === "utility") {
        return {
          ...resizeState.startWidths,
          utility: snapColumnWidth(resizeState.startWidths.utility - delta, widthLimits.utility.minExpanded, widthLimits.utility.max),
        };
      }

      if (resizeState.region === "customize") {
        return {
          ...resizeState.startWidths,
          customize: snapColumnWidth(resizeState.startWidths.customize - delta, widthLimits.customize.minExpanded, widthLimits.customize.max),
        };
      }

      return {
        ...resizeState.startWidths,
        sidebar: snapColumnWidth(resizeState.startWidths.sidebar + delta, widthLimits.sidebar.minExpanded, widthLimits.sidebar.max),
      };
    }

    function handlePointerMove(event: globalThis.PointerEvent) {
      const resizeState = resizeRef.current;
      if (!resizeState) return;

      queueLayoutWidths(getNextWidths(event, resizeState));
    }

    function stopResize() {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (pendingWidthsRef.current) {
        setLayoutWidths(pendingWidthsRef.current);
        pendingWidthsRef.current = null;
      }
      resizeRef.current = null;
      document.body.dataset.resizing = "false";
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  function startColumnResize(region: ResizeRegion, event: PointerEvent<HTMLElement>) {
    event.preventDefault();
    resizeRef.current = {
      region,
      startX: event.clientX,
      startWidths: layoutWidths,
    };
    document.body.dataset.resizing = "true";
  }

  function resetColumnWidth(region: ResizeRegion) {
    setLayoutWidths((current) => ({
      ...current,
      [region]: defaultLayoutWidths[region],
    }));
  }

  return {
    layoutWidths,
    startColumnResize,
    resetColumnWidth,
  };
}
