import type { AppearanceSettings } from "./hooks/useAppearanceDraft";

export const accentOptions = ["#6d5dfc", "#3b82f6", "#06b6d4", "#22c55e", "#f97316", "#ef4444"];

export const fontOptions = [
  { value: "Inter, Segoe UI, system-ui, sans-serif", label: "Inter" },
  { value: "Segoe UI, system-ui, sans-serif", label: "Segoe UI" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Consolas, monospace", label: "Consolas" },
];

export const densityOptions: Array<{ value: AppearanceSettings["density"]; label: string }> = [
  { value: "compact", label: "Gọn" },
  { value: "comfortable", label: "Vừa" },
  { value: "spacious", label: "Rộng" },
];
