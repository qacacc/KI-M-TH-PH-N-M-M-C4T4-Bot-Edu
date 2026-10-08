import React, { ChangeEvent, useRef, useState, useEffect } from "react";
import { Image, Palette, Type, Download, Upload, Trash2, Plus, ArrowLeft, RefreshCw, LayoutGrid, Eye, CheckCircle2, Copy, Sparkles, CalendarDays, FolderOpen, Database, BadgeCheck, Send, MessageSquare, BookOpen, Bell, Pencil, Sun, Moon } from "lucide-react";
import { accentOptions, densityOptions, fontOptions } from "../appearanceOptions";
import { darkAppearance, getDefaultAppearanceForTheme, lightAppearance, type AppearanceSettings, contrastRatio, getReadableTextColor, isPartialHexColor } from "../hooks/useAppearanceDraft";
import { getCustomPresets, saveCustomPreset, deleteCustomPreset } from "../appearance/presetStore";

// Định nghĩa helper phân tích bảng màu từ ảnh (Canvas local)
function extractColorsFromImage(dataUrl: string, callback: (colors: string[]) => void) {
  const img = new window.Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 30;
    canvas.height = 30;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, 30, 30);
    const imgData = ctx.getImageData(0, 0, 30, 30).data;
    
    const colorMap: Record<string, number> = {};
    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i+1];
      const b = imgData[i+2];
      
      const rG = Math.round(r / 24) * 24;
      const gG = Math.round(g / 24) * 24;
      const bG = Math.round(b / 24) * 24;
      
      const hex = "#" + [rG, gG, bG].map(x => {
        const hexStr = Math.max(0, Math.min(255, x)).toString(16);
        return hexStr.length === 1 ? "0" + hexStr : hexStr;
      }).join("");
      colorMap[hex] = (colorMap[hex] || 0) + 1;
    }
    
    const sorted = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
      
    const proposed = sorted.slice(0, 4);
    while (proposed.length < 4) {
      proposed.push(proposed.length === 0 ? "#3b82f6" : proposed.length === 1 ? "#181818" : proposed.length === 2 ? "#ffffff" : "#a3a3a3");
    }
    callback(proposed);
  };
  img.src = dataUrl;
}

function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

function hexToRgb(value: string) {
  const hex = normalizeHexColor(value) ?? "#3B82F6";
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

export function AppearancePage({
  appearance,
  accentColor,
  theme,
  hasChanges,
  canApply,
  onAppearanceChange,
  onAccentChange,
  onThemeChange,
  onApply,
  onDiscard,
  onReset,
}: {
  appearance: AppearanceSettings;
  accentColor: string;
  theme: "dark" | "light";
  hasChanges: boolean;
  canApply: boolean;
  onAppearanceChange: (nextAppearance: Partial<AppearanceSettings>) => void;
  onAccentChange: (nextAccent: string) => void;
  onThemeChange: (nextTheme: "dark" | "light") => void;
  onApply: () => void;
  onDiscard: () => void;
  onReset: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [customPresets, setCustomPresets] = useState<any[]>([]);
  const [proposedColors, setProposedColors] = useState<string[]>([]);
  const [previewTab, setPreviewTab] = useState<"chat" | "schedule" | "table" | "health">("chat");
  const [accentPickerOpen, setAccentPickerOpen] = useState(false);
  const [customAccentDraft, setCustomAccentDraft] = useState(() => normalizeHexColor(accentColor) ?? "#3B82F6");

  // State cho Modal Dialog Glassmorphism thay thế window.prompt/alert/confirm
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm" | "prompt";
    title: string;
    message?: string;
    defaultValue?: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (inputVal?: string) => void;
  } | null>(null);
  const [modalInputVal, setModalInputVal] = useState("");

  const openPromptModal = (title: string, message: string, defaultValue: string, placeholder: string, confirmText: string, onConfirm: (val: string) => void) => {
    setModalInputVal(defaultValue);
    setModalConfig({
      isOpen: true,
      type: "prompt",
      title,
      message,
      defaultValue,
      placeholder,
      confirmText,
      onConfirm: (val) => onConfirm(val || ""),
    });
  };

  const openAlertModal = (title: string, message: string) => {
    setModalConfig({
      isOpen: true,
      type: "alert",
      title,
      message,
      confirmText: "Đóng",
      onConfirm: () => setModalConfig(null),
    });
  };

  const openConfirmModal = (title: string, message: string, confirmText: string, onConfirm: () => void) => {
    setModalConfig({
      isOpen: true,
      type: "confirm",
      title,
      message,
      confirmText,
      onConfirm: () => onConfirm(),
    });
  };

  // Load custom presets từ localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("campus-assistant-custom-presets");
      if (saved) {
        setCustomPresets(JSON.parse(saved));
      }
    } catch {
      // Bỏ qua lỗi
    }
  }, []);

  // Trích xuất màu khi có ảnh nền nháp
  useEffect(() => {
    if (appearance.backgroundImage) {
      extractColorsFromImage(appearance.backgroundImage, (colors) => {
        setProposedColors(colors);
      });
    } else {
      setProposedColors([]);
    }
  }, [appearance.backgroundImage]);

  // Cập nhật màu tự động khi đề xuất màu thay đổi và đang bật chế độ Tự động
  useEffect(() => {
    if (proposedColors.length > 0) {
      const updates: Partial<AppearanceSettings> = {};
      if (appearance.autoBg) {
        updates.backgroundColor = theme === "dark" ? "#181818" : "#f7f7f8";
      }
      if (appearance.autoPanel) {
        updates.panelColor = theme === "dark" ? "#242424" : "#ffffff";
      }
      if (appearance.autoText) {
        updates.textColor = theme === "dark" ? "#f5f5f5" : "#111827";
        updates.mutedColor = theme === "dark" ? "#a3a3a3" : "#6b7280";
      }
      if (proposedColors[0]) {
        onAccentChange(proposedColors[0]);
      }
      if (Object.keys(updates).length > 0) {
        onAppearanceChange(updates);
      }
    }
  }, [proposedColors, theme, appearance.autoBg, appearance.autoPanel, appearance.autoText]);

  // Quản lý Presets cá nhân với Custom Glass Modal
  function handleSaveCustomPreset() {
    openPromptModal(
      "Lưu Preset cá nhân",
      "Nhập tên giao diện của bạn để lưu vào bộ nhớ local:",
      `Preset cá nhân ${customPresets.length + 1}`,
      "Tên preset...",
      "Lưu Preset",
      (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        const newPreset = {
          id: `custom-${Date.now()}`,
          label: trimmed,
          detail: "Giao diện tự thiết kế.",
          accent: accentColor,
          theme: theme,
          appearance: { ...appearance },
        };

        const nextPresets = [...customPresets, newPreset];
        setCustomPresets(nextPresets);
        localStorage.setItem("campus-assistant-custom-presets", JSON.stringify(nextPresets));
      }
    );
  }

  function handleRenamePreset(id: string, event: React.MouseEvent) {
    event.stopPropagation();
    const preset = customPresets.find(p => p.id === id);
    if (!preset) return;
    openPromptModal(
      "Đổi tên Preset",
      "Nhập tên mới cho preset cá nhân:",
      preset.label,
      "Tên mới...",
      "Đổi tên",
      (newName) => {
        const trimmed = newName.trim();
        if (!trimmed) return;

        const nextPresets = customPresets.map(p => p.id === id ? { ...p, label: trimmed } : p);
        setCustomPresets(nextPresets);
        localStorage.setItem("campus-assistant-custom-presets", JSON.stringify(nextPresets));
      }
    );
  }

  function handleDuplicatePreset(id: string, event: React.MouseEvent) {
    event.stopPropagation();
    const preset = customPresets.find(p => p.id === id);
    if (!preset) return;

    openPromptModal(
      "Nhân bản Preset",
      "Nhập tên cho bản sao preset cá nhân:",
      `${preset.label} (Bản sao)`,
      "Tên bản sao...",
      "Tạo bản sao",
      (dupName) => {
        const trimmed = dupName.trim();
        if (!trimmed) return;
        const dup = {
          ...preset,
          id: `custom-${Date.now()}`,
          label: trimmed,
        };
        const nextPresets = [...customPresets, dup];
        setCustomPresets(nextPresets);
        localStorage.setItem("campus-assistant-custom-presets", JSON.stringify(nextPresets));
      }
    );
  }

  function handleDeleteCustomPreset(id: string, event: React.MouseEvent) {
    event.stopPropagation();
    const preset = customPresets.find(p => p.id === id);
    openConfirmModal(
      "Xóa Preset cá nhân",
      `Bạn có chắc chắn muốn xóa preset "${preset?.label ?? "này"}"?`,
      "Xóa ngay",
      () => {
        const nextPresets = customPresets.filter((p) => p.id !== id);
        setCustomPresets(nextPresets);
        localStorage.setItem("campus-assistant-custom-presets", JSON.stringify(nextPresets));
      }
    );
  }

  // Xuất cấu hình Theme JSON
  function handleExportTheme() {
    const config = {
      theme,
      accentColor,
      appearance,
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
      .then(() => openAlertModal("Xuất cấu hình JSON", "Đã sao chép cấu hình theme JSON vào clipboard thành công!"))
      .catch(() => openAlertModal("Lỗi xuất JSON", "Không thể sao chép cấu hình theme JSON vào clipboard."));
  }

  // Nhập cấu hình Theme JSON
  function handleImportTheme() {
    openPromptModal(
      "Nhập cấu hình Theme",
      "Dán chuỗi JSON cấu hình giao diện vào ô dưới đây:",
      "",
      '{"theme": "dark", ...}',
      "Nhập cấu hình",
      (input) => {
        if (!input) return;
        try {
          const config = JSON.parse(input);
          if (config.theme && config.accentColor && config.appearance) {
            onThemeChange(config.theme);
            onAccentChange(config.accentColor);
            onAppearanceChange(config.appearance);
            openAlertModal("Nhập cấu hình", "Đã áp dụng cấu hình theme từ JSON thành công!");
          } else {
            openAlertModal("Lỗi cấu hình", "Chuỗi JSON không đúng định dạng cấu hình theme.");
          }
        } catch {
          openAlertModal("Lỗi giải mã", "Không thể giải mã chuỗi cấu hình JSON.");
        }
      }
    );
  }

  // Nhập file ảnh
  function handleBackgroundImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onAppearanceChange({
          backgroundImage: reader.result,
          backgroundFit: "cover",
          backgroundPosition: "center",
          backgroundOpacity: 0.28,
          backgroundBlur: 2,
          overlayType: "dark",
          overlayIntensity: 0.42,
          panelOpacity: 0.78,
          panelBlur: 10,
        });
      }
    };
    reader.readAsDataURL(file);
  }

  function handleApplyPalette() {
    if (proposedColors.length === 0) return;
    onAccentChange(proposedColors[0]);
    onAppearanceChange({
      backgroundColor: theme === "dark" ? "#181818" : "#f7f7f8",
      panelColor: theme === "dark" ? "#242424" : "#ffffff",
      textColor: theme === "dark" ? "#f5f5f5" : "#111827",
      mutedColor: theme === "dark" ? "#a3a3a3" : "#6b7280",
      autoBg: false,
      autoPanel: false,
      autoText: false,
    });
  }

  // Tùy chọn hiển thị
  const colorRows: Array<{ key: keyof Pick<AppearanceSettings, "backgroundColor" | "panelColor" | "textColor" | "mutedColor">; label: string; autoKey: "autoBg" | "autoPanel" | "autoText" }> = [
    { key: "backgroundColor", label: "Nền ứng dụng", autoKey: "autoBg" },
    { key: "panelColor", label: "Panel / Card", autoKey: "autoPanel" },
    { key: "textColor", label: "Chữ chính", autoKey: "autoText" },
  ];

  const backgroundFitOptions: Array<{ value: AppearanceSettings["backgroundFit"]; label: string }> = [
    { value: "cover", label: "Phủ đầy" },
    { value: "contain", label: "Vừa khung" },
    { value: "auto", label: "Kích thước thật" },
    { value: "repeat", label: "Lặp ảnh" },
  ];

  const campusDefaultAppearance = getDefaultAppearanceForTheme(theme);
  const skinPresets = [
    {
      id: "campus-default",
      label: "Campus Default",
      detail: "Mặc định cân bằng, rõ chữ, viền nhẹ.",
      accent: "#3b82f6",
      theme,
      appearance: campusDefaultAppearance,
    },
    {
      id: "campus-neutral",
      label: "Campus Neutral",
      detail: "Mặc định trung tính, viền nhẹ, dễ đọc.",
      accent: "#3b82f6",
      theme: "dark" as const,
      appearance: darkAppearance,
    },
    {
      id: "paper-focus",
      label: "Paper Focus",
      detail: "Sáng, ít bóng, đọc lâu dễ chịu.",
      accent: "#3b82f6",
      theme: "light" as const,
      appearance: {
        ...lightAppearance,
        backgroundColor: "#f6f7fb",
        panelColor: "#ffffff",
        panelOpacity: 0.92,
        textColor: "#172033",
        mutedColor: "#667085",
        backgroundOpacity: 0.12,
        backgroundBlur: 0,
        overlayType: "light" as const,
        overlayIntensity: 0.58,
        glowEffect: false,
        panelBlur: 0,
        autoBg: true,
        autoPanel: true,
        autoText: true,
        safeArea: "left" as const,
        pageMode: "balanced" as const,
      },
    },
    {
      id: "aurora-study",
      label: "Aurora Study",
      detail: "Xanh tím mềm cho màn hình học tập.",
      accent: "#06b6d4",
      theme: "dark" as const,
      appearance: {
        ...darkAppearance,
        backgroundColor: "#07111f",
        panelColor: "#102033",
        panelOpacity: 0.82,
        textColor: "#eff6ff",
        mutedColor: "#a8b6c8",
        backgroundOpacity: 0.26,
        backgroundBlur: 6,
        overlayType: "dark" as const,
        overlayIntensity: 0.46,
        glowEffect: true,
        panelBlur: 14,
        autoBg: true,
        autoPanel: true,
        autoText: true,
        safeArea: "left" as const,
        pageMode: "balanced" as const,
      },
    },
    {
      id: "warm-minimal",
      label: "Warm Minimal",
      detail: "Ấm nhẹ nhưng không vàng gắt.",
      accent: "#f97316",
      theme: "light" as const,
      appearance: {
        ...lightAppearance,
        backgroundColor: "#fbf7f2",
        panelColor: "#ffffff",
        panelOpacity: 0.9,
        textColor: "#1f2937",
        mutedColor: "#6b7280",
        backgroundOpacity: 0.1,
        backgroundBlur: 0,
        overlayType: "light" as const,
        overlayIntensity: 0.5,
        glowEffect: false,
        panelBlur: 4,
        autoBg: true,
        autoPanel: true,
        autoText: true,
        safeArea: "left" as const,
        pageMode: "balanced" as const,
      },
    },
  ];

  const backgroundPositions = [
    ["left top", "Trái trên"],
    ["center top", "Giữa trên"],
    ["right top", "Phải trên"],
    ["left center", "Trái giữa"],
    ["center", "Chính giữa"],
    ["right center", "Phải giữa"],
    ["left bottom", "Trái dưới"],
    ["center bottom", "Giữa dưới"],
    ["right bottom", "Phải dưới"],
  ];

  const textContrastIsLow = contrastRatio(appearance.backgroundColor, appearance.textColor) < 3.8;
  const percentLabel = (value: number) => `${Math.round(Number.isFinite(value) ? value * 100 : 0)}%`;
  const pixelLabel = (value: number) => `${Math.round(Number.isFinite(value) ? value : 0)}px`;
  const customAccentRgb = hexToRgb(customAccentDraft);

  function openAccentPicker() {
    setCustomAccentDraft(normalizeHexColor(accentColor) ?? "#3B82F6");
    setAccentPickerOpen((current) => !current);
  }

  function updateCustomAccentChannel(channel: "r" | "g" | "b", value: number) {
    const next = { ...customAccentRgb, [channel]: value };
    setCustomAccentDraft(rgbToHex(next.r, next.g, next.b));
  }

  function applyCustomAccent() {
    const normalized = normalizeHexColor(customAccentDraft);
    if (!normalized) return;
    onAccentChange(normalized);
    setAccentPickerOpen(false);
  }

  // Mini Sandbox Style để Preview thời gian thực
  const previewStyle = {
    "--accent": accentColor,
    "--accent-contrast": getReadableTextColor(accentColor),
    "--text": appearance.textColor,
    "--muted": appearance.mutedColor,
    "--border": theme === "dark" ? "#333333" : "#e5e7eb",
    "--panel": appearance.panelColor + Math.round(appearance.panelOpacity * 255).toString(16).padStart(2, "0"),
    "--panel-hover": theme === "dark" ? "#303030" : "#eef0f3",
    backgroundColor: appearance.backgroundColor,
    color: appearance.textColor,
    fontFamily: appearance.fontFamily,
    fontSize: `${12.5 * appearance.fontScale}px`,
    position: "relative" as const,
    border: "1px solid var(--border)",
    borderRadius: "14px",
    overflow: "hidden",
    minHeight: "330px",
    display: "grid",
    gridTemplateColumns: "150px minmax(0, 1fr)",
    gap: "12px",
    padding: "12px",
  } as React.CSSProperties & Record<`--${string}`, string>;

  const previewBgStyle = {
    position: "absolute" as const,
    inset: 0,
    backgroundImage: appearance.backgroundImage ? `url("${appearance.backgroundImage}")` : "none",
    backgroundSize: appearance.backgroundFit === "repeat" ? "auto" : appearance.backgroundFit,
    backgroundRepeat: appearance.backgroundFit === "repeat" ? "repeat" : "no-repeat",
    backgroundPosition: appearance.backgroundPosition,
    opacity: appearance.backgroundOpacity,
    filter: `blur(${appearance.backgroundBlur}px)`,
    zIndex: 0,
  };

  const previewOverlayStyle = {
    position: "absolute" as const,
    inset: 0,
    background: !appearance.backgroundImage
      ? "transparent"
      : appearance.overlayType === "dark"
      ? `rgba(0,0,0, ${appearance.overlayIntensity})`
      : appearance.overlayType === "light"
      ? `rgba(255,255,255, ${appearance.overlayIntensity})`
      : appearance.overlayType === "accent"
      ? `color-mix(in srgb, ${accentColor} ${Math.round(appearance.overlayIntensity * 100)}%, transparent)`
      : "transparent",
    zIndex: 1,
  };

  const previewContentStyle = {
    position: "relative" as const,
    zIndex: 2,
    display: "contents",
  };

  const previewPanelStyle = {
    background: appearance.panelColor + Math.round(appearance.panelOpacity * 255).toString(16).padStart(2, "0"),
    backdropFilter: `blur(${appearance.backgroundImage ? appearance.panelBlur : 0}px)`,
    border: "1px solid var(--border)",
  };

  const previewBubbleUserStyle = {
    background: accentColor,
    color: "#ffffff",
  };

  return (
    <div className="page-card appearance-page">
      <div className="page-card-header">
        <div>
          <h2><Palette size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />Giao diện & Chủ đề</h2>
          <p>Chỉnh trong bản nháp trước. Bấm <strong>Áp dụng</strong> để lưu thiết lập local.</p>
        </div>
        <div className="appearance-header-actions">
          <div className="appearance-theme-toggle" aria-label="Chọn sáng hoặc tối">
            <button className={theme === "light" ? "selected" : ""} onClick={() => onThemeChange("light")} title="Giao diện sáng">
              <Sun size={14} /> Sáng
            </button>
            <button className={theme === "dark" ? "selected" : ""} onClick={() => onThemeChange("dark")} title="Giao diện tối">
              <Moon size={14} /> Tối
            </button>
          </div>
          <button onClick={handleExportTheme} title="Xuất JSON cấu hình giao diện ra clipboard"><Download size={13} /> Xuất</button>
          <button onClick={handleImportTheme} title="Nhập JSON cấu hình giao diện từ clipboard"><Upload size={13} /> Nhập</button>
          <button onClick={() => openConfirmModal("Hoàn tác thay đổi", "Bạn muốn hủy tất cả thay đổi chưa lưu trong bản nháp?", "Hoàn tác", onDiscard)} disabled={!hasChanges}>Hoàn tác</button>
          <button onClick={() => openConfirmModal("Khôi phục mặc định", "Khôi phục toàn bộ thiết lập giao diện về mặc định ban đầu?", "Khôi phục", onReset)}>Khôi phục</button>
          <button className="primary" onClick={onApply} disabled={!hasChanges || !canApply} style={{ fontWeight: 700 }}>Áp dụng</button>
        </div>
      </div>

      {/* CUSTOM IDE GLASS MODAL DIALOG */}
      {modalConfig?.isOpen && (
        <div className="glass-modal-backdrop" onClick={() => setModalConfig(null)}>
          <div className="glass-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="glass-modal-header">
              <h3>{modalConfig.title}</h3>
            </div>
            {modalConfig.message && <p className="glass-modal-message">{modalConfig.message}</p>}
            
            {modalConfig.type === "prompt" && (
              <input
                type="text"
                className="glass-modal-input"
                value={modalInputVal}
                onChange={(e) => setModalInputVal(e.target.value)}
                placeholder={modalConfig.placeholder}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    modalConfig.onConfirm(modalInputVal);
                    setModalConfig(null);
                  } else if (e.key === "Escape") {
                    setModalConfig(null);
                  }
                }}
              />
            )}

            <div className="glass-modal-actions">
              {modalConfig.type !== "alert" && (
                <button className="glass-modal-btn cancel" onClick={() => setModalConfig(null)}>
                  {modalConfig.cancelText ?? "Hủy"}
                </button>
              )}
              <button
                className="glass-modal-btn confirm primary"
                onClick={() => {
                  modalConfig.onConfirm(modalInputVal);
                  setModalConfig(null);
                }}
              >
                {modalConfig.confirmText ?? "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* BỘ CHỌN PRESET HỆ THỐNG / CÁ NHÂN */}
      <div className="preset-section-container">
        <h3 className="section-subtitle">Chủ đề mẫu hệ thống</h3>
        <section className="skin-preset-strip" aria-label="Chọn nhanh skin giao diện">
          {skinPresets.map((preset) => {
            const isSelected = accentColor === preset.accent && 
              appearance.backgroundColor === preset.appearance.backgroundColor &&
              appearance.panelColor === preset.appearance.panelColor &&
              appearance.panelOpacity === preset.appearance.panelOpacity;
            return (
              <button
                key={preset.id}
                className={isSelected ? "selected" : ""}
                onClick={() => {
                  onThemeChange(preset.theme);
                  onAccentChange(preset.accent);
                  onAppearanceChange(preset.appearance);
                }}
              >
                <i className={`skin-swatch skin-${preset.id}`} />
                <span>
                  <strong>{preset.label}</strong>
                  <small>{preset.detail}</small>
                </span>
                {isSelected && <span className="preset-active-badge">Đang dùng</span>}
              </button>
            );
          })}
        </section>

        <h3 className="section-subtitle" style={{ marginTop: 14 }}>Preset cá nhân của bạn</h3>
        <section className="custom-presets-strip" aria-label="Preset cá nhân của bạn">
          {customPresets.map((preset) => {
            const isSelected = accentColor === preset.accent && 
              theme === preset.theme &&
              appearance.backgroundColor === preset.appearance.backgroundColor &&
              appearance.panelColor === preset.appearance.panelColor &&
              appearance.panelOpacity === preset.appearance.panelOpacity;
            return (
              <div key={preset.id} className={`custom-preset-card${isSelected ? " selected" : ""}`}>
                <button
                  className="custom-preset-apply-btn"
                  onClick={() => {
                    onThemeChange(preset.theme);
                    onAccentChange(preset.accent);
                    onAppearanceChange(preset.appearance);
                  }}
                >
                  <i className="custom-preset-swatch" style={{ background: preset.accent }} />
                  <span className="custom-preset-info">
                    <strong>{preset.label}</strong>
                    <small>{preset.detail} ({preset.theme === "dark" ? "Tối" : "Sáng"})</small>
                  </span>
                </button>
                {isSelected && <span className="preset-active-badge" style={{ marginRight: 8 }}>Đang dùng</span>}
                <button className="custom-preset-delete-btn" title="Nhân bản preset" aria-label="Nhân bản preset" style={{ borderLeft: '1px solid var(--border)' }} onClick={(event) => handleDuplicatePreset(preset.id, event)}>
                  <Copy size={13} />
                </button>
                <button className="custom-preset-delete-btn" title="Đổi tên" aria-label="Đổi tên preset" onClick={(event) => handleRenamePreset(preset.id, event)}>
                  <Pencil size={13} />
                </button>
                <button className="custom-preset-delete-btn" title="Xóa preset" aria-label="Xóa preset" onClick={(event) => handleDeleteCustomPreset(preset.id, event)}>
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
          <button className="custom-preset-add-btn" onClick={handleSaveCustomPreset} title="Lưu thiết lập hiện tại thành preset mới">
            <Plus size={16} />
            <span>
              <strong>Lưu Preset hiện tại</strong>
              <small>Lưu vào bộ nhớ local</small>
            </span>
          </button>
        </section>
      </div>

      {/* MULTI-PAGE PREVIEW */}
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 className="section-subtitle" style={{ margin: 0 }}><Eye size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Xem trước đa màn hình</h3>
          <div className="segmented-control">
            <button className={previewTab === "chat" ? "selected" : ""} onClick={() => setPreviewTab("chat")}>Trò chuyện</button>
            <button className={previewTab === "schedule" ? "selected" : ""} onClick={() => setPreviewTab("schedule")}>Lịch học</button>
            <button className={previewTab === "table" ? "selected" : ""} onClick={() => setPreviewTab("table")}>Bảng dữ liệu</button>
            <button className={previewTab === "health" ? "selected" : ""} onClick={() => setPreviewTab("health")}>Kiểm tra</button>
          </div>
          <div className="segmented-control" style={{ marginLeft: 8 }}>
            <button className={theme === "light" ? "selected" : ""} onClick={() => onThemeChange("light")}>Sáng</button>
            <button className={theme === "dark" ? "selected" : ""} onClick={() => onThemeChange("dark")}>Tối</button>
          </div>
        </div>

        <div style={{ ...previewStyle, gridTemplateColumns: "170px minmax(0, 1fr)" }}>
          <div style={previewBgStyle} />
          <div style={previewOverlayStyle} />
          
          <div style={previewContentStyle}>
            {/* MINI REAL APP SIDEBAR */}
            <aside className="preview-sidebar" style={{ ...previewPanelStyle, display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 8px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: accentColor, color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <Sparkles size={13} />
                </div>
                <div style={{ lineHeight: 1.1 }}>
                  <strong style={{ fontSize: 11, display: 'block', color: appearance.textColor }}>Campus Assistant</strong>
                  <span style={{ fontSize: 9, color: appearance.mutedColor }}>Local · v1.0.1</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6, background: accentColor, color: '#fff', fontSize: 10.5, fontWeight: 600, overflow: 'hidden' }}>
                <Plus size={12} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Cuộc trò chuyện</span>
              </div>

              <div style={{ marginTop: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: appearance.mutedColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phiên hiện tại</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 6, background: `color-mix(in srgb, ${accentColor} 18%, transparent)`, marginTop: 2 }}>
                  <Sparkles size={12} style={{ color: accentColor }} />
                  <div style={{ lineHeight: 1.1 }}>
                    <strong style={{ fontSize: 10, display: 'block', color: appearance.textColor }}>Trợ lý tài liệu</strong>
                    <span style={{ fontSize: 8.5, color: appearance.mutedColor }}>Sẵn sàng</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: appearance.mutedColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tra cứu</span>
                <span className={previewTab === "chat" ? "preview-active" : ""} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3.5px 6px', borderRadius: 5, fontSize: 10.5, color: previewTab === "chat" ? "#fff" : appearance.textColor, background: previewTab === "chat" ? accentColor : "transparent", cursor: 'pointer' }} onClick={() => setPreviewTab("chat")}>
                  <MessageSquare size={12} /> Trò chuyện
                </span>
                <span className={previewTab === "schedule" ? "preview-active" : ""} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3.5px 6px', borderRadius: 5, fontSize: 10.5, color: previewTab === "schedule" ? "#fff" : appearance.textColor, background: previewTab === "schedule" ? accentColor : "transparent", cursor: 'pointer' }} onClick={() => setPreviewTab("schedule")}>
                  <CalendarDays size={12} /> Lịch học
                </span>
                <span className={previewTab === "table" ? "preview-active" : ""} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3.5px 6px', borderRadius: 5, fontSize: 10.5, color: previewTab === "table" ? "#fff" : appearance.textColor, background: previewTab === "table" ? accentColor : "transparent", cursor: 'pointer' }} onClick={() => setPreviewTab("table")}>
                  <FolderOpen size={12} /> File mẫu
                </span>
                <span className={previewTab === "health" ? "preview-active" : ""} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3.5px 6px', borderRadius: 5, fontSize: 10.5, color: previewTab === "health" ? "#fff" : appearance.textColor, background: previewTab === "health" ? accentColor : "transparent", cursor: 'pointer' }} onClick={() => setPreviewTab("health")}>
                  <CheckCircle2 size={12} /> Kiểm tra
                </span>
              </div>
            </aside>

            {/* MINI REAL APP SURFACE */}
            <section className="preview-surface" style={{ gridColumn: '2', background: 'transparent', border: 'none', gap: 8, display: 'flex', flexDirection: 'column' }}>
              {/* Mini App Topbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: appearance.textColor }}>
                    {previewTab === "chat" && "Trò chuyện với trợ lý"}
                    {previewTab === "schedule" && "Lịch học & Thời khóa biểu"}
                    {previewTab === "table" && "File mẫu & Tài liệu"}
                    {previewTab === "health" && "Kiểm tra ứng dụng & Hệ thống"}
                  </h4>
                  <span style={{ fontSize: 10, color: appearance.mutedColor }}>Mọi tác vụ xử lý ngoại tuyến an toàn.</span>
                </div>
              </div>

              {previewTab === "chat" && (
                <>
                  {/* Real Welcome Card Replica */}
                  <div className="preview-card" style={{ ...previewPanelStyle, padding: '8px 10px', borderRadius: 8 }}>
                    <b style={{ fontSize: 11.5, color: appearance.textColor }}>Chào bạn. v1.0.1 tập trung chat-first, tùy biến giao diện và các luồng local đã có.</b>
                  </div>
                  
                  {/* Real Quick Chips Grid Replica */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    <div style={{ ...previewPanelStyle, padding: '6px 8px', borderRadius: 6, fontSize: 10 }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: 4, color: appearance.textColor }}><BookOpen size={11} />Tìm tài liệu mẫu</strong>
                      <span style={{ fontSize: 8.5, color: appearance.mutedColor }}>Bắt đầu flow FIND_DOCUMENTS</span>
                    </div>
                    <div style={{ ...previewPanelStyle, padding: '6px 8px', borderRadius: 6, fontSize: 10 }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: 4, color: appearance.textColor }}><FolderOpen size={11} />Xem file mẫu</strong>
                      <span style={{ fontSize: 8.5, color: appearance.mutedColor }}>Duyệt metadata local</span>
                    </div>
                    <div style={{ ...previewPanelStyle, padding: '6px 8px', borderRadius: 6, fontSize: 10 }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: 4, color: appearance.textColor }}><Bell size={11} />Xem thông báo</strong>
                      <span style={{ fontSize: 8.5, color: appearance.mutedColor }}>Dữ liệu mẫu local</span>
                    </div>
                  </div>

                  {/* Real Chat Bubbles Replica */}
                  <div className="preview-chat-row assistant" style={{ ...previewPanelStyle, padding: '6px 10px', borderRadius: 8, maxWidth: '85%' }}>
                    <p style={{ margin: 0, fontSize: 10.5 }}>Chào bạn! Tôi sẵn sàng hỗ trợ tra cứu tài liệu học tập local.</p>
                  </div>
                  <div className="preview-chat-row user" style={{ ...previewBubbleUserStyle, padding: '6px 10px', borderRadius: 8, alignSelf: 'flex-end', maxWidth: '80%' }}>
                    <p style={{ margin: 0, fontSize: 10.5, color: '#ffffff', fontWeight: 500 }}>Tìm tài liệu môn Lập trình mạng học kỳ 1</p>
                  </div>

                  {/* Real Bottom Composer Replica */}
                  <div className="preview-input" style={{ ...previewPanelStyle, marginTop: 'auto', padding: '6px 8px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: appearance.mutedColor, fontSize: 10, flex: 1 }}>Nhập yêu cầu, ví dụ: tìm tài liệu lập trình mạng...</span>
                    <button style={{ background: accentColor, color: "#fff", border: 'none', width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', padding: 0 }}>
                      <Send size={11} />
                    </button>
                  </div>
                </>
              )}

              {previewTab === "schedule" && (
                <>
                  <div className="preview-card" style={{ ...previewPanelStyle, padding: '8px 10px', borderRadius: 8 }}>
                    <b style={{ fontSize: 11.5, color: appearance.textColor }}>Thời khóa biểu hôm nay (Học kỳ 1)</b>
                    <span style={{ display: 'block', fontSize: 10, color: appearance.mutedColor }}>2 môn học trong thời khóa biểu mẫu.</span>
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div className="preview-card" style={{ ...previewPanelStyle, padding: '6px 10px', borderRadius: 8, borderLeft: `3px solid ${accentColor}` }}>
                      <strong style={{ fontSize: 11, color: appearance.textColor }}>Lập trình mạng</strong>
                      <span style={{ display: 'block', fontSize: 9.5, color: appearance.mutedColor }}>8:00 - 10:00 · Phòng 402 · GV Nguyễn Văn A</span>
                    </div>
                    <div className="preview-card" style={{ ...previewPanelStyle, padding: '6px 10px', borderRadius: 8, borderLeft: `3px solid ${accentColor}` }}>
                      <strong style={{ fontSize: 11, color: appearance.textColor }}>An toàn thông tin</strong>
                      <span style={{ display: 'block', fontSize: 9.5, color: appearance.mutedColor }}>10:15 - 12:15 · Phòng 505 · GV Trần Thị B</span>
                    </div>
                  </div>
                </>
              )}

              {previewTab === "table" && (
                <>
                  <div className="preview-card" style={{ ...previewPanelStyle, padding: '8px 10px', borderRadius: 8 }}>
                    <b style={{ fontSize: 11.5, color: appearance.textColor }}>Danh sách file mẫu học tập</b>
                    <span style={{ display: 'block', fontSize: 10, color: appearance.mutedColor }}>Duyệt metadata file local an toàn.</span>
                  </div>
                  <div className="preview-table-row" style={{ ...previewPanelStyle, padding: '6px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: appearance.textColor }}>Tài liệu slide 1_LapTrinhMang.pdf</span>
                    <span style={{ fontSize: 9.5, color: appearance.mutedColor }}>2.4 MB</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={{ background: accentColor, color: "#fff", border: 'none', padding: '2px 6px', fontSize: 9.5, borderRadius: 4 }}>Mở</button>
                      <button style={{ padding: '2px 6px', fontSize: 9.5, borderRadius: 4 }}>Sao chép</button>
                    </div>
                  </div>
                  <div className="preview-table-row" style={{ ...previewPanelStyle, padding: '6px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: appearance.textColor }}>Bài tập thực hành_HocKy1.zip</span>
                    <span style={{ fontSize: 9.5, color: appearance.mutedColor }}>15.2 MB</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={{ background: accentColor, color: "#fff", border: 'none', padding: '2px 6px', fontSize: 9.5, borderRadius: 4 }}>Mở</button>
                      <button style={{ padding: '2px 6px', fontSize: 9.5, borderRadius: 4 }}>Sao chép</button>
                    </div>
                  </div>
                </>
              )}

              {previewTab === "health" && (
                <>
                  <div className="preview-card" style={{ ...previewPanelStyle, padding: '8px 10px', borderRadius: 8 }}>
                    <b style={{ fontSize: 11.5, color: appearance.textColor }}>Trạng thái hệ thống local</b>
                    <span style={{ display: 'block', fontSize: 10, color: appearance.mutedColor }}>Mọi tác vụ xử lý ngoại tuyến an toàn.</span>
                  </div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <div style={{ ...previewPanelStyle, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6 }}>
                      <CheckCircle2 size={13} style={{ color: '#22c55e' }} />
                      <span style={{ fontSize: 10, color: appearance.textColor }}>Cơ sở dữ liệu SQLite local hoạt động tốt</span>
                    </div>
                    <div style={{ ...previewPanelStyle, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6 }}>
                      <CheckCircle2 size={13} style={{ color: '#22c55e' }} />
                      <span style={{ fontSize: 10, color: appearance.textColor }}>Thư mục workspace được cấp quyền đọc/ghi</span>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* KHU VỰC CÀI ĐẶT CHI TIẾT */}
      <div className="appearance-grid" style={{ marginTop: 20 }}>
        {/* Cột 1: Màu sắc */}
        <details className="appearance-section" open>
          <summary><Palette size={16} /> Màu sắc</summary>
          
          <div className="accent-list large accent-picker-row">
            {accentOptions.map((color) => (
              <button
                key={color}
                aria-label={`Chọn màu ${color}`}
                className={color === accentColor ? "accent selected" : "accent"}
                style={{ background: color }}
                onClick={() => onAccentChange(color)}
              />
            ))}
            <div className="custom-accent-picker">
              <button
                type="button"
                className={accentPickerOpen ? "accent custom-accent-add selected" : "accent custom-accent-add"}
                aria-label="Tạo màu nhấn tùy chỉnh"
                onClick={openAccentPicker}
              >
                <Plus size={18} />
              </button>

              {accentPickerOpen && (
                <div className="custom-accent-popover" role="dialog" aria-label="Chọn màu nhấn tùy chỉnh">
                  <div className="custom-accent-preview" style={{ background: normalizeHexColor(customAccentDraft) ?? "#3B82F6" }}>
                    <span>{normalizeHexColor(customAccentDraft) ?? "Mã màu chưa hợp lệ"}</span>
                  </div>

                  <label className="custom-accent-hex">
                    <span>Mã màu</span>
                    <input
                      value={customAccentDraft}
                      maxLength={7}
                      spellCheck={false}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (next === "" || next === "#" || isPartialHexColor(next)) {
                          setCustomAccentDraft(next.toUpperCase());
                        }
                      }}
                    />
                  </label>

                  {[
                    { key: "r" as const, label: "R", value: customAccentRgb.r },
                    { key: "g" as const, label: "G", value: customAccentRgb.g },
                    { key: "b" as const, label: "B", value: customAccentRgb.b },
                  ].map((channel) => (
                    <label className="custom-accent-slider" key={channel.key}>
                      <span>{channel.label}</span>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        step="1"
                        value={channel.value}
                        onChange={(event) => updateCustomAccentChannel(channel.key, Number(event.target.value))}
                      />
                      <b>{channel.value}</b>
                    </label>
                  ))}

                  <div className="custom-accent-actions">
                    <button type="button" onClick={() => setAccentPickerOpen(false)}>Hủy</button>
                    <button type="button" className="primary" onClick={applyCustomAccent} disabled={!normalizeHexColor(customAccentDraft)}>
                      Xác nhận
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <label className="hex-field" style={{ marginTop: 6 }}>
            <span>Accent Color</span>
            <input value={accentColor} maxLength={7} spellCheck={false} onChange={(event) => onAccentChange(event.target.value)} />
          </label>
          {textContrastIsLow && <p className="soft-warning">Màu nhấn khó đọc trên nền hiện tại. Nên chọn màu tương phản tốt hơn.</p>}

          {/* TRÍCH XUẤT MÀU ĐỀ XUẤT */}
          {proposedColors.length > 0 && (
            <div className="auto-palette-container">
              <p className="fx-group-label" style={{ margin: 0 }}>Màu đề xuất từ ảnh nền</p>
              <div className="auto-palette-colors">
                {proposedColors.map((col, idx) => (
                  <button
                    key={idx}
                    className="auto-palette-color"
                    style={{ background: col }}
                    onClick={() => {
                      if (idx === 0) onAccentChange(col);
                      else onAppearanceChange({ backgroundColor: col });
                    }}
                    title={col}
                  />
                ))}
                <button
                  onClick={handleApplyPalette}
                  className="primary"
                  style={{ fontSize: 10, padding: '2px 8px', border: 'none', marginLeft: 'auto' }}
                >
                  Áp dụng bảng màu
                </button>
              </div>
            </div>
          )}

          {/* DANH SÁCH MÀU TOKEN */}
          <div className="color-token-list" style={{ marginTop: 10 }}>
            {colorRows.map((item) => (
              <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{item.label}</span>
                  <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={item.autoKey}
                        checked={appearance[item.autoKey]}
                        onChange={() => onAppearanceChange({ [item.autoKey]: true })}
                      />
                      Tự động
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={item.autoKey}
                        checked={!appearance[item.autoKey]}
                        onChange={() => onAppearanceChange({ [item.autoKey]: false })}
                      />
                      Tùy chỉnh
                    </label>
                  </div>
                </div>
                <label className="color-token-row" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' }}>
                  <span>
                    <i style={{ background: appearance[item.key] }} />
                  </span>
                  <input
                    value={appearance[item.key]}
                    maxLength={7}
                    spellCheck={false}
                    disabled={appearance[item.autoKey]}
                    style={{ opacity: appearance[item.autoKey] ? 0.6 : 1 }}
                    onChange={(event) => {
                      if (isPartialHexColor(event.target.value)) {
                        onAppearanceChange({ [item.key]: event.target.value } as Partial<AppearanceSettings>);
                      }
                    }}
                  />
                </label>
              </div>
            ))}
          </div>

          {/* ACCORDION NÂNG CAO CHO CÁC CỘT */}
          <details style={{ marginTop: 10, borderTop: '1px dashed var(--border)', paddingTop: 10 }}>
            <summary style={{ fontSize: 11, color: 'var(--muted)', cursor: 'pointer' }}>Nâng cao: Màu riêng từng khu vực</summary>
            <div className="color-token-list col-color-list" style={{ marginTop: 8 }}>
              {[
                { key: "colLeftBg", label: "Cột trái (Sidebar)" },
                { key: "colMidBg", label: "Cột giữa (Nội dung/Chat)" },
                { key: "colRightBg", label: "Cột phải (Bảng phụ)" },
              ].map((item) => (
                <label className="color-token-row" key={item.key} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span>
                    <i style={{
                      background: appearance[item.key as keyof AppearanceSettings] as string || "transparent",
                      border: !(appearance[item.key as keyof AppearanceSettings] as string) ? '1px dashed var(--muted)' : 'none'
                    }} />
                    <small>{item.label}</small>
                  </span>
                  <input
                    value={(appearance[item.key as keyof AppearanceSettings] as string) || ""}
                    placeholder="Mặc định"
                    maxLength={7}
                    spellCheck={false}
                    onChange={(event) => {
                      const val = event.target.value;
                      if (val === "" || val === "#" || isPartialHexColor(val)) {
                        onAppearanceChange({ [item.key]: val } as Partial<AppearanceSettings>);
                      }
                    }}
                  />
                </label>
              ))}
            </div>
          </details>
        </details>

        {/* Cột 2: Chữ & mật độ */}
        <details className="appearance-section" open>
          <summary><Type size={16} /> Chữ &amp; mật độ</summary>
          <div className="font-choice-list">
            {fontOptions.map((option) => (
              <button
                key={option.value}
                className={appearance.fontFamily === option.value ? "selected" : ""}
                onClick={() => onAppearanceChange({ fontFamily: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label className="quick-field slider-field" style={{ marginTop: 8 }}>
            <span>Cỡ chữ <b>{Math.round(14 * appearance.fontScale)} px</b></span>
            <input
              type="range"
              min="0.9"
              max="1.18"
              step="0.02"
              value={appearance.fontScale}
              onChange={(event) => onAppearanceChange({ fontScale: Number(event.target.value) })}
            />
          </label>
          <div className="density-choice-list" style={{ marginTop: 8 }}>
            {densityOptions.map((option) => (
              <button
                key={option.value}
                className={appearance.density === option.value ? "selected" : ""}
                onClick={() => onAppearanceChange({ density: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </details>

        {/* Cột 3: Nền & hiệu ứng */}
        <details className="appearance-section" open>
          <summary><Image size={16} /> Nền &amp; hiệu ứng</summary>

          {/* Bg Drop Zone */}
          <BgDropZone
            imageUrl={appearance.backgroundImage}
            onFileChange={handleBackgroundImage}
            onClearImage={() => onAppearanceChange({ backgroundImage: "" })}
            fileInputRef={fileInputRef}
          />

          {/* Sliders hiệu ứng */}
          <div className="fx-sliders-group" style={{ marginTop: 10 }}>
            <p className="fx-group-label">Panel &amp; màu nền</p>
            <div className="fx-sliders-2col">
              <label className="quick-field slider-field">
                <span>Blur Panel <b>{pixelLabel(appearance.panelBlur)}</b></span>
                <input type="range" min="0" max="24" step="1"
                  value={appearance.panelBlur || 0}
                  onChange={(e) => onAppearanceChange({ panelBlur: Number(e.target.value) })} />
              </label>
              <label className="quick-field slider-field">
                <span>Độ trong panel <b>{percentLabel(appearance.panelOpacity)}</b></span>
                <input type="range" min="0.35" max="1" step="0.01"
                  value={appearance.panelOpacity}
                  onChange={(e) => onAppearanceChange({ panelOpacity: Number(e.target.value) })} />
              </label>
              <label className="quick-field slider-field">
                <span>Nhuộm accent <b>{percentLabel(appearance.accentTint)}</b></span>
                <input type="range" min="0" max="0.25" step="0.01"
                  value={appearance.accentTint}
                  onChange={(e) => onAppearanceChange({ accentTint: Number(e.target.value) })} />
              </label>
            </div>
          </div>

          {/* Lớp phủ hợp nhất */}
          <div className="fx-sliders-group" style={{ marginTop: 8 }}>
            <p className="fx-group-label">Lớp phủ ảnh nền</p>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { value: "none" as const, label: "Không" },
                  { value: "dark" as const, label: "Tối" },
                  { value: "light" as const, label: "Sáng" },
                  { value: "accent" as const, label: "Accent" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    style={{ flex: 1, fontSize: 11, padding: '4px 6px' }}
                    className={appearance.overlayType === opt.value ? "selected" : ""}
                    onClick={() => onAppearanceChange({ overlayType: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {appearance.overlayType !== "none" && (
                <label className="quick-field slider-field">
                  <span>Cường độ phủ <b>{percentLabel(appearance.overlayIntensity)}</b></span>
                  <input type="range" min="0" max="0.8" step="0.01"
                    value={appearance.overlayIntensity}
                    onChange={(e) => onAppearanceChange({ overlayIntensity: Number(e.target.value) })} />
                </label>
              )}
            </div>
          </div>

          {/* Thiết lập ảnh nền */}
          {appearance.backgroundImage && (
            <div className="fx-sliders-group" style={{ marginTop: 8 }}>
              <p className="fx-group-label">Thiết lập ảnh</p>
              <div className="fx-sliders-2col">
                <label className="quick-field slider-field">
                  <span>Độ hiển thị nền <b>{percentLabel(appearance.backgroundOpacity)}</b></span>
                  <input type="range" min="0" max="0.45" step="0.01"
                    value={appearance.backgroundOpacity}
                    onChange={(e) => onAppearanceChange({ backgroundOpacity: Number(e.target.value) })} />
                </label>
                <label className="quick-field slider-field">
                  <span>Blur ảnh nền <b>{pixelLabel(appearance.backgroundBlur)}</b></span>
                  <input type="range" min="0" max="14" step="1"
                    value={appearance.backgroundBlur}
                    onChange={(e) => onAppearanceChange({ backgroundBlur: Number(e.target.value) })} />
                </label>
              </div>

              {/* Vị trí & Điểm trọng tâm */}
              <div style={{ marginTop: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Điểm trọng tâm & Vùng an toàn</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'start', marginTop: 4 }}>
                  <div className="focus-point-picker">
                    <img src={appearance.backgroundImage} className="focus-point-image" alt="Background preview" />
                    <div className="focus-point-grid">
                      {backgroundPositions.map(([pos, label]) => {
                        const isSelected = appearance.backgroundPosition === pos;
                        return (
                          <button
                            key={pos}
                            type="button"
                            className={`focus-point-cell${isSelected ? " selected" : ""}`}
                            onClick={() => onAppearanceChange({ backgroundPosition: pos })}
                            title={`Điểm trọng tâm: ${label}`}
                          >
                            <i className="focus-point-dot" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>Safe Area</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[
                        { value: "left" as const, label: "Trái" },
                        { value: "center" as const, label: "Giữa" },
                        { value: "right" as const, label: "Phải" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          style={{ flex: 1, fontSize: 10, padding: '4px 2px' }}
                          className={appearance.safeArea === opt.value ? "selected" : ""}
                          onClick={() => onAppearanceChange({ safeArea: opt.value })}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>Chế độ hiển thị trang</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[
                        { value: "expressive" as const, label: "Nổi bật" },
                        { value: "balanced" as const, label: "Cân bằng" },
                        { value: "focus" as const, label: "Tập trung" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          style={{ flex: 1, fontSize: 10, padding: '4px 2px' }}
                          className={appearance.pageMode === opt.value ? "selected" : ""}
                          onClick={() => onAppearanceChange({ pageMode: opt.value })}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Kiểu hiển thị (Fit) */}
              <div className="segmented-control wrap-control" style={{ marginTop: 6, display: 'flex' }}>
                {backgroundFitOptions.map((option) => (
                  <button key={option.value}
                    style={{ flex: 1 }}
                    className={appearance.backgroundFit === option.value ? "selected" : ""}
                    onClick={() => onAppearanceChange({ backgroundFit: option.value })}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Glow toggle */}
          <div style={{ marginTop: 10, display: "grid", gap: 8, padding: "8px 0", borderTop: "1px dashed var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Hiệu ứng phát sáng (Glow Accent)</span>
              <label className="switch-control" style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                <input 
                  type="checkbox"
                  checked={appearance.glowEffect || false}
                  onChange={(e) => onAppearanceChange({ glowEffect: e.target.checked })}
                  style={{ display: "none" }}
                />
                <span className={`switch-slider${appearance.glowEffect ? " active" : ""}`} style={{
                  width: "36px",
                  height: "20px",
                  borderRadius: "10px",
                  background: appearance.glowEffect ? "var(--accent)" : "var(--border)",
                  position: "relative",
                  display: "inline-block",
                  transition: "background 0.2s"
                }}>
                  <i style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: "#fff",
                    position: "absolute",
                    top: "3px",
                    left: appearance.glowEffect ? "19px" : "3px",
                    transition: "left 0.2s"
                  }} />
                </span>
              </label>
            </div>
            {appearance.glowEffect && (
              <label className="quick-field slider-field" style={{ marginTop: 4 }}>
                <span>Cường độ phát sáng <b>{Math.round((appearance.glowIntensity || 0.4) * 100)}%</b></span>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05"
                  value={appearance.glowIntensity || 0.4} 
                  onChange={(e) => onAppearanceChange({ glowIntensity: Number(e.target.value) })} 
                />
              </label>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}

/* ===== BgDropZone: vùng kéo thả ảnh nền kiểu Campus ===== */
function BgDropZone({
  imageUrl,
  onFileChange,
  onClearImage,
  fileInputRef,
}: {
  imageUrl: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [details, setDetails] = useState<{ size: string; dim: string; ext: string } | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setDetails(null);
      return;
    }

    if (imageUrl.startsWith("data:")) {
      const approxSize = (imageUrl.length * 0.75 / (1024 * 1024)).toFixed(2) + " MB";
      const match = imageUrl.match(/^data:image\/(\w+);base64,/);
      const ext = match ? match[1].toUpperCase() : "IMG";
      
      const img = new window.Image();
      img.onload = () => {
        setDetails({
          size: approxSize,
          dim: `${img.width} × ${img.height}`,
          ext,
        });
      };
      img.src = imageUrl;
    } else {
      const parts = imageUrl.split(".");
      const ext = parts[parts.length - 1]?.toUpperCase() || "IMAGE";
      setDetails({
        size: "Dung lượng tối ưu",
        dim: "Kích thước tự động",
        ext,
      });
    }
  }, [imageUrl]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = fileInputRef.current;
    if (input) {
      Object.defineProperty(input, "files", { value: dt.files, writable: false });
      const event = new Event("change", { bubbles: true });
      input.dispatchEvent(event);
    }
  }

  return (
    <div
      className={`bg-dropzone${isDragging ? " dragging" : ""}${imageUrl ? " has-image" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Chọn hoặc kéo thả ảnh nền"
      onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        border: "2px dashed var(--border)",
        borderRadius: "8px",
        cursor: "pointer",
        position: "relative" as const,
        minHeight: "100px",
        background: "color-mix(in srgb, var(--panel-strong) 40%, transparent)",
      }}
    >
      <input ref={fileInputRef} className="hidden-file-input" type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
      {imageUrl ? (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", textAlign: "left" }}>
          <img 
            src={imageUrl} 
            alt="Thumbnail" 
            style={{ 
              width: "56px", 
              height: "56px", 
              borderRadius: "6px", 
              objectFit: "cover",
              border: "1px solid var(--border)"
            }} 
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text)" }}>Ảnh nền đã chọn</span>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>
              {details ? `${details.ext} · ${details.dim} · ${details.size}` : "Đang phân tích..."}
            </span>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <button 
                type="button"
                style={{ fontSize: "10.5px", padding: "2px 8px", background: "var(--border)", border: "none", borderRadius: "4px", color: "var(--text)", cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                Đổi ảnh
              </button>
              <button 
                type="button"
                style={{ fontSize: "10.5px", padding: "2px 8px", background: "color-mix(in srgb, #ef4444 20%, transparent)", border: "none", borderRadius: "4px", color: "#f87171", cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onClearImage(); }}
              >
                Bỏ ảnh
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Image className="bg-dropzone-icon" size={24} />
          <span className="bg-dropzone-text" style={{ fontSize: "12.5px", fontWeight: 600, marginTop: "4px", color: "var(--text)" }}>Kéo &amp; thả ảnh vào đây</span>
          <span className="bg-dropzone-sub" style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>hoặc bấm để chọn file · PNG, JPG, WebP</span>
        </>
      )}
    </div>
  );
}
