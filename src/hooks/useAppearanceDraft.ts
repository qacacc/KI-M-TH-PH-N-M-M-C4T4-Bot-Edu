import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveSetting } from "../tauriApi";

export type AppearanceSettings = {
  backgroundColor: string;
  panelColor: string;
  panelOpacity: number;
  textColor: string;
  mutedColor: string;
  fontFamily: string;
  fontScale: number;
  density: "compact" | "comfortable" | "spacious";
  backgroundImage: string;
  backgroundFit: "cover" | "contain" | "auto" | "repeat";
  backgroundPosition: string;
  backgroundOpacity: number;
  backgroundBlur: number;
  backgroundDarkOverlay: number;
  backgroundLightOverlay: number;
  accentTint: number;
  glowEffect: boolean;
  glowIntensity: number;
  panelBlur: number;
  colLeftBg: string;
  colMidBg: string;
  colRightBg: string;
  overlayType: "none" | "dark" | "light" | "accent";
  overlayIntensity: number;
  pageMode: "expressive" | "balanced" | "focus";
  safeArea: "left" | "center" | "right";
  autoBg: boolean;
  autoPanel: boolean;
  autoText: boolean;
};

export type ThemeMode = "dark" | "light";

type AppearanceStorage = Pick<Storage, "getItem" | "setItem">;

const storageKey = "campus-assistant-appearance";

export const darkAppearance: AppearanceSettings = {
  backgroundColor: "#181818",
  panelColor: "#242424",
  panelOpacity: 1,
  textColor: "#f5f5f5",
  mutedColor: "#a3a3a3",
  fontFamily: "Inter, Segoe UI, system-ui, sans-serif",
  fontScale: 1,
  density: "comfortable",
  backgroundImage: "",
  backgroundFit: "cover",
  backgroundPosition: "center",
  backgroundOpacity: 0,
  backgroundBlur: 0,
  backgroundDarkOverlay: 0,
  backgroundLightOverlay: 0,
  accentTint: 0,
  glowEffect: false,
  glowIntensity: 0.4,
  panelBlur: 0,
  colLeftBg: "",
  colMidBg: "",
  colRightBg: "",
  overlayType: "none",
  overlayIntensity: 0,
  pageMode: "balanced",
  safeArea: "left",
  autoBg: true,
  autoPanel: true,
  autoText: true,
};

export const lightAppearance: AppearanceSettings = {
  backgroundColor: "#f7f7f8",
  panelColor: "#ffffff",
  panelOpacity: 1,
  textColor: "#111827",
  mutedColor: "#6b7280",
  fontFamily: "Inter, Segoe UI, system-ui, sans-serif",
  fontScale: 1,
  density: "comfortable",
  backgroundImage: "",
  backgroundFit: "cover",
  backgroundPosition: "center",
  backgroundOpacity: 0,
  backgroundBlur: 0,
  backgroundDarkOverlay: 0,
  backgroundLightOverlay: 0,
  accentTint: 0,
  glowEffect: false,
  glowIntensity: 0.4,
  panelBlur: 0,
  colLeftBg: "",
  colMidBg: "",
  colRightBg: "",
  overlayType: "none",
  overlayIntensity: 0,
  pageMode: "balanced",
  safeArea: "left",
  autoBg: true,
  autoPanel: true,
  autoText: true,
};

export const defaultAppearance = darkAppearance;

export function getDefaultAppearanceForTheme(theme: ThemeMode): AppearanceSettings {
  return theme === "light" ? lightAppearance : darkAppearance;
}

export function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function isPartialHexColor(value: string) {
  return /^#[0-9a-f]{0,6}$/i.test(value);
}

export function colorWithAlpha(hexColor: string, alpha: number) {
  const hex = hexColor.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return hexColor;
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function relativeLuminance(hexColor: string) {
  const hex = hexColor.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 1;
  const channels = [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map((value) => {
    const normalized = parseInt(value, 16) / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastRatio(firstColor: string, secondColor: string) {
  const first = relativeLuminance(firstColor);
  const second = relativeLuminance(secondColor);
  const light = Math.max(first, second);
  const dark = Math.min(first, second);
  return (light + 0.05) / (dark + 0.05);
}

export function getReadableTextColor(backgroundColor: string) {
  return contrastRatio(backgroundColor, "#ffffff") >= contrastRatio(backgroundColor, "#111827") ? "#ffffff" : "#111827";
}

function readNumber(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function readBackgroundFit(value: unknown): AppearanceSettings["backgroundFit"] {
  return value === "cover" || value === "contain" || value === "auto" || value === "repeat" ? value : "cover";
}

function readDensity(value: unknown): AppearanceSettings["density"] {
  return value === "compact" || value === "comfortable" || value === "spacious" ? value : "comfortable";
}

function readOverlayType(value: unknown): AppearanceSettings["overlayType"] {
  return value === "none" || value === "dark" || value === "light" || value === "accent" ? value : "dark";
}

function readPageMode(value: unknown): AppearanceSettings["pageMode"] {
  return value === "expressive" || value === "balanced" || value === "focus" ? value : "balanced";
}

function readSafeArea(value: unknown): AppearanceSettings["safeArea"] {
  return value === "left" || value === "center" || value === "right" ? value : "left";
}

export function sanitizeAppearanceSettings(value: Partial<AppearanceSettings> = {}, fallback = defaultAppearance): AppearanceSettings {
  return {
    backgroundColor: isHexColor(readString(value.backgroundColor, fallback.backgroundColor)) ? readString(value.backgroundColor, fallback.backgroundColor) : fallback.backgroundColor,
    panelColor: isHexColor(readString(value.panelColor, fallback.panelColor)) ? readString(value.panelColor, fallback.panelColor) : fallback.panelColor,
    panelOpacity: readNumber(value.panelOpacity, fallback.panelOpacity, 0.35, 1),
    textColor: isHexColor(readString(value.textColor, fallback.textColor)) ? readString(value.textColor, fallback.textColor) : fallback.textColor,
    mutedColor: isHexColor(readString(value.mutedColor, fallback.mutedColor)) ? readString(value.mutedColor, fallback.mutedColor) : fallback.mutedColor,
    fontFamily: readString(value.fontFamily, fallback.fontFamily),
    fontScale: readNumber(value.fontScale, fallback.fontScale, 0.9, 1.18),
    density: readDensity(value.density),
    backgroundImage: readString(value.backgroundImage, fallback.backgroundImage),
    backgroundFit: readBackgroundFit(value.backgroundFit),
    backgroundPosition: readString(value.backgroundPosition, fallback.backgroundPosition),
    backgroundOpacity: readNumber(value.backgroundOpacity, fallback.backgroundOpacity, 0, 0.45),
    backgroundBlur: readNumber(value.backgroundBlur, fallback.backgroundBlur, 0, 24),
    backgroundDarkOverlay: readNumber(value.backgroundDarkOverlay, fallback.backgroundDarkOverlay, 0, 0.8),
    backgroundLightOverlay: readNumber(value.backgroundLightOverlay, fallback.backgroundLightOverlay, 0, 0.8),
    accentTint: readNumber(value.accentTint, fallback.accentTint, 0, 0.25),
    glowEffect: typeof value.glowEffect === "boolean" ? value.glowEffect : fallback.glowEffect,
    glowIntensity: readNumber(value.glowIntensity, fallback.glowIntensity ?? 0.4, 0, 1),
    panelBlur: readNumber(value.panelBlur, fallback.panelBlur, 0, 24),
    // Màu cột tùy chỉnh
    colLeftBg: typeof value.colLeftBg === "string" && (value.colLeftBg === "" || isHexColor(value.colLeftBg)) ? value.colLeftBg : (fallback.colLeftBg ?? ""),
    colMidBg: typeof value.colMidBg === "string" && (value.colMidBg === "" || isHexColor(value.colMidBg)) ? value.colMidBg : (fallback.colMidBg ?? ""),
    colRightBg: typeof value.colRightBg === "string" && (value.colRightBg === "" || isHexColor(value.colRightBg)) ? value.colRightBg : (fallback.colRightBg ?? ""),
    // Các trường mới hỗ trợ Theme Studio
    overlayType: readOverlayType(value.overlayType ?? fallback.overlayType),
    overlayIntensity: readNumber(value.overlayIntensity, fallback.overlayIntensity ?? 0.55, 0, 0.8),
    pageMode: readPageMode(value.pageMode ?? fallback.pageMode),
    safeArea: readSafeArea(value.safeArea ?? fallback.safeArea),
    autoBg: typeof value.autoBg === "boolean" ? value.autoBg : fallback.autoBg ?? true,
    autoPanel: typeof value.autoPanel === "boolean" ? value.autoPanel : fallback.autoPanel ?? true,
    autoText: typeof value.autoText === "boolean" ? value.autoText : fallback.autoText ?? true,
  };
}

export function loadAppearanceSettingsFromStorage(storage: AppearanceStorage | undefined): AppearanceSettings {
  try {
    const rawValue = storage?.getItem(storageKey);
    if (!rawValue) return defaultAppearance;
    return sanitizeAppearanceSettings(JSON.parse(rawValue) as Partial<AppearanceSettings>, defaultAppearance);
  } catch {
    return defaultAppearance;
  }
}

export function saveAppearanceSettingsToStorage(storage: AppearanceStorage | undefined, appearance: AppearanceSettings) {
  try {
    storage?.setItem(storageKey, JSON.stringify(appearance));
  } catch {
    // localStorage có thể bị chặn; giao diện vẫn áp dụng trong phiên hiện tại.
  }
}

function getBrowserStorage(): AppearanceStorage | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

const systemDefaultAccent = "#3b82f6";
const legacyDefaultAccent = "#6d5dfc";

function normalizeDefaultAccent(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === legacyDefaultAccent) return systemDefaultAccent;
  return value;
}

function applyAppearanceToDocument(theme: ThemeMode, accentColor: string, appearance: AppearanceSettings) {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.glow = appearance.glowEffect ? "true" : "false";
  document.documentElement.style.setProperty("--glow-intensity", String(appearance.glowIntensity));
  document.documentElement.style.setProperty("--accent", accentColor);
  document.documentElement.style.setProperty("--accent-contrast", getReadableTextColor(accentColor));
  if (appearance.autoBg) {
    document.documentElement.style.removeProperty("--bg");
  } else {
    document.documentElement.style.setProperty("--bg", appearance.backgroundColor);
  }

  if (appearance.autoPanel) {
    document.documentElement.style.removeProperty("--panel");
    document.documentElement.style.removeProperty("--panel-strong");
  } else {
    document.documentElement.style.setProperty("--panel", colorWithAlpha(appearance.panelColor, appearance.panelOpacity));
    document.documentElement.style.setProperty("--panel-strong", appearance.panelColor);
  }

  if (appearance.autoText) {
    document.documentElement.style.removeProperty("--text");
    document.documentElement.style.removeProperty("--muted");
  } else {
    document.documentElement.style.setProperty("--text", appearance.textColor);
    document.documentElement.style.setProperty("--muted", appearance.mutedColor);
  }
  document.documentElement.style.setProperty("--panel-blur", `${appearance.panelBlur}px`);
  document.documentElement.style.setProperty("--font-scale", String(appearance.fontScale));
  document.documentElement.style.setProperty("--app-font", appearance.fontFamily);
  document.documentElement.style.setProperty("--user-bg-image", appearance.backgroundImage ? `url("${appearance.backgroundImage}")` : "none");
  document.documentElement.style.setProperty("--user-bg-size", appearance.backgroundFit === "repeat" ? "auto" : appearance.backgroundFit);
  document.documentElement.style.setProperty("--user-bg-repeat", appearance.backgroundFit === "repeat" ? "repeat" : "no-repeat");
  document.documentElement.style.setProperty("--user-bg-position", appearance.backgroundPosition);
  document.documentElement.style.setProperty("--user-bg-opacity", String(appearance.backgroundOpacity));
  document.documentElement.style.setProperty("--user-bg-blur", `${appearance.backgroundBlur}px`);

  // Tính toán cường độ lớp phủ dựa trên overlayType mới
  const darkOverlay = appearance.overlayType === "dark" ? appearance.overlayIntensity : 0;
  const lightOverlay = appearance.overlayType === "light" ? appearance.overlayIntensity : 0;
  const accentTint = appearance.overlayType === "accent" ? appearance.overlayIntensity : 0;

  document.documentElement.style.setProperty("--user-bg-dark-overlay", String(darkOverlay));
  document.documentElement.style.setProperty("--user-bg-light-overlay", String(lightOverlay));
  document.documentElement.style.setProperty("--user-bg-accent-tint", String(accentTint));
  document.documentElement.style.setProperty("--user-bg-accent-tint-percent", `${Math.round(accentTint * 100)}%`);
  
  document.documentElement.dataset.density = appearance.density;
  document.documentElement.dataset.pageMode = appearance.pageMode;
  document.documentElement.dataset.safeArea = appearance.safeArea;

  // Áp dụng màu cột tùy chỉnh (empty = xóa về mặc định)
  if (appearance.colLeftBg) {
    document.documentElement.style.setProperty("--col-left-bg", appearance.colLeftBg);
  } else {
    document.documentElement.style.removeProperty("--col-left-bg");
  }
  if (appearance.colMidBg) {
    document.documentElement.style.setProperty("--col-mid-bg", appearance.colMidBg);
  } else {
    document.documentElement.style.removeProperty("--col-mid-bg");
  }
  if (appearance.colRightBg) {
    document.documentElement.style.setProperty("--col-right-bg", appearance.colRightBg);
  } else {
    document.documentElement.style.removeProperty("--col-right-bg");
  }
}

export function useAppearanceDraft(isReadyForContrastGuard: boolean) {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [accentColor, setAccentColor] = useState(systemDefaultAccent);
  const [appearance, setAppearance] = useState<AppearanceSettings>(() => loadAppearanceSettingsFromStorage(getBrowserStorage()));
  const [draftTheme, setDraftTheme] = useState<ThemeMode>("dark");
  const [draftAccentColor, setDraftAccentColor] = useState(systemDefaultAccent);
  const [draftAppearance, setDraftAppearance] = useState<AppearanceSettings>(() => loadAppearanceSettingsFromStorage(getBrowserStorage()));
  const contrastGuardRef = useRef(false);

  useEffect(() => {
    applyAppearanceToDocument(theme, accentColor, appearance);
    saveAppearanceSettingsToStorage(getBrowserStorage(), appearance);
  }, [theme, accentColor, appearance]);

  useEffect(() => {
    setDraftTheme(theme);
    setDraftAccentColor(accentColor);
    setDraftAppearance(appearance);
  }, [theme, accentColor, appearance]);

  useEffect(() => {
    setAppearance((current) => {
      const palette = getDefaultAppearanceForTheme(theme);
      const oppositePalette = getDefaultAppearanceForTheme(theme === "light" ? "dark" : "light");
      const next = { ...current };
      let changed = false;

      if (current.autoBg && current.backgroundColor === oppositePalette.backgroundColor) {
        next.backgroundColor = palette.backgroundColor;
        changed = true;
      }
      if (current.autoPanel && current.panelColor === oppositePalette.panelColor) {
        next.panelColor = palette.panelColor;
        next.panelOpacity = palette.panelOpacity;
        changed = true;
      }
      if (current.autoText && current.textColor === oppositePalette.textColor) {
        next.textColor = palette.textColor;
        changed = true;
      }
      if (current.autoText && current.mutedColor === oppositePalette.mutedColor) {
        next.mutedColor = palette.mutedColor;
        changed = true;
      }

      return changed ? next : current;
    });
  }, [theme]);

  useEffect(() => {
    if (!isReadyForContrastGuard || contrastGuardRef.current) return;
    contrastGuardRef.current = true;

    if (contrastRatio(appearance.backgroundColor, appearance.textColor) >= 3.8) return;

    const palette = theme === "light" ? lightAppearance : darkAppearance;
    setAppearance((current) => ({
      ...current,
      backgroundColor: palette.backgroundColor,
      panelColor: palette.panelColor,
      panelOpacity: palette.panelOpacity,
      textColor: palette.textColor,
      mutedColor: palette.mutedColor,
    }));
  }, [appearance.backgroundColor, appearance.textColor, isReadyForContrastGuard, theme]);

  const appearanceDraftIsValid = useMemo(
    () =>
      [
        draftAccentColor,
        draftAppearance.backgroundColor,
        draftAppearance.panelColor,
        draftAppearance.textColor,
        draftAppearance.mutedColor,
      ].every(isHexColor),
    [draftAccentColor, draftAppearance.backgroundColor, draftAppearance.mutedColor, draftAppearance.panelColor, draftAppearance.textColor],
  );

  const hasAppearanceChanges = useMemo(
    () =>
      draftTheme !== theme ||
      draftAccentColor !== accentColor ||
      draftAppearance.backgroundColor !== appearance.backgroundColor ||
      draftAppearance.panelColor !== appearance.panelColor ||
      draftAppearance.panelOpacity !== appearance.panelOpacity ||
      draftAppearance.textColor !== appearance.textColor ||
      draftAppearance.mutedColor !== appearance.mutedColor ||
      draftAppearance.fontFamily !== appearance.fontFamily ||
      draftAppearance.fontScale !== appearance.fontScale ||
      draftAppearance.density !== appearance.density ||
      draftAppearance.backgroundImage !== appearance.backgroundImage ||
      draftAppearance.backgroundFit !== appearance.backgroundFit ||
      draftAppearance.backgroundPosition !== appearance.backgroundPosition ||
      draftAppearance.backgroundOpacity !== appearance.backgroundOpacity ||
      draftAppearance.backgroundBlur !== appearance.backgroundBlur ||
      draftAppearance.backgroundDarkOverlay !== appearance.backgroundDarkOverlay ||
      draftAppearance.backgroundLightOverlay !== appearance.backgroundLightOverlay ||
      draftAppearance.accentTint !== appearance.accentTint ||
      draftAppearance.glowEffect !== appearance.glowEffect ||
      draftAppearance.glowIntensity !== appearance.glowIntensity ||
      draftAppearance.panelBlur !== appearance.panelBlur ||
      draftAppearance.colLeftBg !== appearance.colLeftBg ||
      draftAppearance.colMidBg !== appearance.colMidBg ||
      draftAppearance.colRightBg !== appearance.colRightBg ||
      draftAppearance.overlayType !== appearance.overlayType ||
      draftAppearance.overlayIntensity !== appearance.overlayIntensity ||
      draftAppearance.pageMode !== appearance.pageMode ||
      draftAppearance.safeArea !== appearance.safeArea ||
      draftAppearance.autoBg !== appearance.autoBg ||
      draftAppearance.autoPanel !== appearance.autoPanel ||
      draftAppearance.autoText !== appearance.autoText,
    [accentColor, appearance, draftAccentColor, draftAppearance, draftTheme, theme],
  );

  const hydrateSavedAppearance = useCallback((savedTheme: string, savedAccentColor: string) => {
    setTheme(savedTheme === "light" ? "light" : "dark");
    setAccentColor(normalizeDefaultAccent(savedAccentColor));
  }, []);

  const updateTheme = useCallback((nextTheme: ThemeMode) => {
    setDraftTheme(nextTheme);
    const palette = getDefaultAppearanceForTheme(nextTheme);
    setDraftAppearance((current) => ({
      ...current,
      backgroundColor: current.autoBg ? palette.backgroundColor : current.backgroundColor,
      panelColor: current.autoPanel ? palette.panelColor : current.panelColor,
      textColor: current.autoText ? palette.textColor : current.textColor,
      mutedColor: current.autoText ? palette.mutedColor : current.mutedColor,
      panelOpacity: current.backgroundImage ? current.panelOpacity : palette.panelOpacity,
      backgroundOpacity: current.backgroundImage ? current.backgroundOpacity : palette.backgroundOpacity,
      backgroundBlur: current.backgroundImage ? current.backgroundBlur : 0,
      overlayType: current.backgroundImage ? current.overlayType : palette.overlayType,
      overlayIntensity: current.backgroundImage ? current.overlayIntensity : palette.overlayIntensity,
      panelBlur: current.backgroundImage ? current.panelBlur : palette.panelBlur,
    }));
  }, []);

  const updateAccent = useCallback((nextAccent: string) => {
    const normalized = nextAccent.startsWith("#") ? nextAccent : `#${nextAccent}`;
    if (!isPartialHexColor(normalized)) return;
    setDraftAccentColor(normalized);
  }, []);

  const updateAppearance = useCallback((nextAppearance: Partial<AppearanceSettings>) => {
    setDraftAppearance((current) => sanitizeAppearanceSettings({ ...current, ...nextAppearance }, current));
  }, []);

  const resetAppearance = useCallback(() => {
    const nextAppearance = getDefaultAppearanceForTheme(draftTheme);
    setDraftAppearance(nextAppearance);
    setDraftAccentColor(systemDefaultAccent);
  }, [draftTheme]);

  const discardAppearanceChanges = useCallback(() => {
    setDraftTheme(theme);
    setDraftAccentColor(accentColor);
    setDraftAppearance(appearance);
  }, [accentColor, appearance, theme]);

  const applyAppearanceChanges = useCallback((nextAppearanceOverride?: AppearanceSettings) => {
    if (!appearanceDraftIsValid) return;

    const nextAppearance = nextAppearanceOverride ?? draftAppearance;
    setTheme(draftTheme);
    setAccentColor(draftAccentColor);
    setAppearance(nextAppearance);
    setDraftAppearance(nextAppearance);
    void saveSetting("theme", draftTheme).catch(() => undefined);
    void saveSetting("accentColor", draftAccentColor).catch(() => undefined);
  }, [appearanceDraftIsValid, draftAccentColor, draftAppearance, draftTheme]);

  const applyAppearanceImmediately = useCallback((nextAppearance: Partial<AppearanceSettings>) => {
    setAppearance((current) => {
      const merged = sanitizeAppearanceSettings({ ...current, ...nextAppearance }, current);
      setDraftAppearance(merged);
      return merged;
    });
  }, []);

  return {
    theme,
    accentColor,
    appearance,
    draftTheme,
    draftAccentColor,
    draftAppearance,
    appearanceDraftIsValid,
    hasAppearanceChanges,
    hydrateSavedAppearance,
    updateTheme,
    updateAccent,
    updateAppearance,
    resetAppearance,
    discardAppearanceChanges,
    applyAppearanceChanges,
    applyAppearanceImmediately,
  };
}
