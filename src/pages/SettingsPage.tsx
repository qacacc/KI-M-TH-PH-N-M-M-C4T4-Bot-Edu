import React, { useState } from "react";
import { openExternalUrl } from "../tauriApi";
import {
  Sliders,
  Shield,
  Code2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  LogOut,
  Palette,
  Database,
  Activity,
  BadgeCheck,
  ListChecks,
  GraduationCap,
  ExternalLink,
  Lock,
  Clock,
  UserCheck,
  Download,
  Upload,
} from "lucide-react";
import type { StorageSummary, HealthReport } from "../types";
import { downloadBackupFile, exportLocalAppDataJSON, importLocalAppDataJSON, uploadBackupFile } from "../utils/backupRestore";
import { resetLocalConfiguration } from "../resetConfig";
import {
  SUPPORTED_UNIVERSITIES,
  StudentSession,
  SchoolSyncConfig,
} from "../schoolConnector/types";
import {
  getStoredSession,
  saveStudentSession,
  revokeSession,
  getSyncConfig,
  saveSyncConfig,
} from "../schoolConnector/schoolVault";

export interface SettingsPageProps {
  storageSummary: StorageSummary | null;
  healthReport: HealthReport | null;
  isBusy: boolean;
  onRefreshStorage: () => void;
  onClearActionLogs: () => void;
  onOpenDownloads: () => void;
  onCheckUpdate: () => void;
  onExportDiagnostics: () => void;
  onResetAppearance: () => void;
  onResetLayout: () => void;
  onNavigateToAppearance: () => void;
  onNavigateToView: (view: string) => void;
  onAutoFocusChatChange: (enabled: boolean) => void;
  openGlassConfirm: (msg: string, title?: string) => Promise<boolean>;
  openGlassAlert: (msg: string, title?: string) => Promise<void>;
}

export function SettingsPage({
  storageSummary,
  healthReport,
  isBusy,
  onRefreshStorage,
  onClearActionLogs,
  onOpenDownloads,
  onCheckUpdate,
  onExportDiagnostics,
  onResetAppearance,
  onResetLayout,
  onNavigateToAppearance,
  onNavigateToView,
  onAutoFocusChatChange,
  openGlassConfirm,
  openGlassAlert,
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<"general" | "school" | "security" | "dev">("general");

  // Settings local state
  const [language] = useState<string>("vi");
  const [defaultView, setDefaultView] = useState<string>(() => localStorage.getItem("ca-settings-default-view") || "chat");
  const [autoFocusChat, setAutoFocusChat] = useState<boolean>(() => localStorage.getItem("ca-settings-autofocus") !== "false");
  const [devModeEnabled, setDevModeEnabled] = useState<boolean>(() => localStorage.getItem("ca-settings-dev-mode") === "true");

  // School connector state (CA-089.01: Bỏ mock public docs, minh bạch hóa trạng thái kết nối)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("uth");
  const [session, setSession] = useState<StudentSession | null>(() => getStoredSession());
  const [syncConfig, setSyncConfigState] = useState<SchoolSyncConfig>(() => getSyncConfig());
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleDefaultViewChange = (val: string) => {
    setDefaultView(val);
    localStorage.setItem("ca-settings-default-view", val);
  };

  const handleAutoFocusToggle = () => {
    const next = !autoFocusChat;
    setAutoFocusChat(next);
    localStorage.setItem("ca-settings-autofocus", String(next));
    onAutoFocusChatChange(next);
  };

  const handleDevModeToggle = () => {
    const next = !devModeEnabled;
    setDevModeEnabled(next);
    localStorage.setItem("ca-settings-dev-mode", String(next));
  };

  const handleSyncToggle = (key: keyof SchoolSyncConfig) => {
    const next = saveSyncConfig({ [key]: !syncConfig[key] });
    setSyncConfigState(next);
  };

  // Mở cổng Portal chính thức trên trình duyệt ngoài (Tránh giả mạo WebView nội bộ khi chưa có contract)
  const handleOpenSchoolWebviewGate = async () => {
    const selectedSchool = SUPPORTED_UNIVERSITIES.find((u) => u.id === selectedSchoolId);
    if (!selectedSchool) return;

    setIsAuthenticating(true);
    const ok = await openGlassConfirm(
      `Ứng dụng sẽ mở Cổng thông tin chính thức của ${selectedSchool.name} (${selectedSchool.ssoUrl}) trên trình duyệt ngoài.\n\nLưu ý: Xác thực thành công trên trình duyệt không tự động cấp session nội bộ vào ứng dụng.`,
      "Mở Cổng Thông tin Trường"
    );

    if (ok) {
      await openExternalUrl(selectedSchool.ssoUrl);
      setIsAuthenticating(false);
    } else {
      setIsAuthenticating(false);
    }
  };

  const handleRevokeSessionWithConfirm = async () => {
    const ok = await openGlassConfirm(
      "Bạn có chắc chắn muốn đăng xuất và xóa sạch phiên kết nối local không?",
      "Đăng xuất Phiên làm việc Trường"
    );
    if (ok) {
      revokeSession();
      setSession(null);
      await openGlassAlert("Đã xóa sạch phiên kết nối local.", "Đã đăng xuất");
    }
  };

  const handleExportBackupJSON = async () => {
    try {
      const jsonStr = exportLocalAppDataJSON();
      await navigator.clipboard.writeText(jsonStr);
      await openGlassAlert("Đã xuất cấu hình Backup JSON vào Bộ nhớ tạm (Clipboard).", "Xuất Backup Thành công");
    } catch {
      await openGlassAlert("Không thể truy cập Clipboard để xuất dữ liệu.", "Lỗi");
    }
  };

  const handleDownloadBackupFile = () => {
    downloadBackupFile();
  };

  const handleImportBackupJSON = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || (!text.includes("CampusAssistantLocal") && !text.includes("campus-assistant-backup"))) {
        await openGlassAlert("Không tìm thấy dữ liệu Backup hợp lệ trong bộ nhớ tạm.", "Lỗi Nhập Backup");
        return;
      }
      const ok = await openGlassConfirm("Bạn có chắc chắn muốn nhập dữ liệu Backup JSON từ Clipboard và ghi đè cài đặt local không?", "Nhập Backup JSON");
      if (ok) {
        const success = importLocalAppDataJSON(text);
        if (success) {
          await openGlassAlert("Đã khôi phục thành công toàn bộ cài đặt local từ Backup JSON.", "Thành công");
        } else {
          await openGlassAlert("Định dạng file Backup JSON không hợp lệ.", "Lỗi");
        }
      }
    } catch {
      await openGlassAlert("Không thể đọc bộ nhớ tạm (Clipboard).", "Lỗi");
    }
  };

  const handleFileUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await openGlassConfirm(
      `Bạn có chắc chắn muốn khôi phục cài đặt từ file "${file.name}" không?`,
      "Khôi phục từ tệp Backup JSON"
    );
    if (ok) {
      const success = await uploadBackupFile(file);
      if (success) {
        await openGlassAlert("Đã khôi phục thành công toàn bộ cài đặt local từ tệp Backup.", "Thành công");
      } else {
        await openGlassAlert("Dữ liệu tệp Backup không hợp lệ hoặc bị lỗi định dạng.", "Lỗi Khôi Phục");
      }
    }
    e.target.value = "";
  };

  const handleWipeAllLocalData = async () => {
    const ok = await openGlassConfirm(
      "Thao tác này chỉ đặt lại cấu hình giao diện, bố cục và tùy chọn local. Lịch sử chat, GPA, hồ sơ trường và dữ liệu khác sẽ được giữ nguyên. Tiếp tục?",
      "Đặt lại cấu hình ứng dụng"
    );
    if (ok) {
      const result = resetLocalConfiguration(localStorage);
      onResetAppearance();
      onResetLayout();
      if (result.failed.length > 0) {
        await openGlassAlert(
          `Đã đặt lại một phần cấu hình. Không thể xóa: ${result.failed.join(", ")}.`,
          "Cấu hình chưa được đặt lại hoàn toàn",
        );
        return;
      }
      await openGlassAlert("Đã đặt lại cấu hình ứng dụng. Dữ liệu chat, GPA và hồ sơ vẫn được giữ nguyên.", "Hoàn tất");
      window.location.reload();
    }
  };

  const currentSchoolInfo = SUPPORTED_UNIVERSITIES.find((u) => u.id === selectedSchoolId);

  return (
    <div className="settings-page-container">
      {/* HEADER TRANG CÀI ĐẶT */}
      <div className="settings-header">
        <div>
          <h2>Cài đặt Hệ thống</h2>
          <p>Cấu hình chung, kết nối cổng trường ĐH local-first, bảo mật OS Vault và môi trường phát triển.</p>
        </div>
        <button className="settings-quick-btn" onClick={onNavigateToAppearance}>
          <Palette size={15} />
          Mở Giao diện & Chủ đề
        </button>
      </div>

      {/* THANH TAB ĐIỀU HƯỚNG CÀI ĐẶT */}
      <div className="settings-tabs-bar">
        <button
          className={activeTab === "general" ? "settings-tab active" : "settings-tab"}
          onClick={() => setActiveTab("general")}
        >
          <Sliders size={15} />
          <span>Chung</span>
        </button>

        <button
          className={activeTab === "school" ? "settings-tab active" : "settings-tab"}
          onClick={() => setActiveTab("school")}
        >
          <GraduationCap size={15} />
          <span>Kết nối Trường ĐH</span>
        </button>

        <button
          className={activeTab === "security" ? "settings-tab active" : "settings-tab"}
          onClick={() => setActiveTab("security")}
        >
          <Shield size={15} />
          <span>Bảo mật & Vault</span>
        </button>

        <button
          className={activeTab === "dev" ? "settings-tab active" : "settings-tab"}
          onClick={() => setActiveTab("dev")}
        >
          <Code2 size={15} />
          <span>Dev Mode</span>
        </button>
      </div>

      {/* NỘI DUNG TỪNG TAB */}
      <div className="settings-content-card">
        {/* TAB 1: CHUNG */}
        {activeTab === "general" && (
          <div className="settings-section-group">
            <h3><Sliders size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Cấu hình Chung</h3>

            <div className="settings-row">
              <div>
                <strong>Ngôn ngữ ứng dụng</strong>
                <small>Ngôn ngữ hiển thị chính của giao diện Campus Assistant.</small>
              </div>
              <select
                className="settings-select"
                value={language}
                disabled
                title="Bản hiện tại chỉ hỗ trợ tiếng Việt"
              >
                <option value="vi">Tiếng Việt (đang hỗ trợ)</option>
              </select>
            </div>

            <div className="settings-row">
              <div>
                <strong>Trang mặc định khi mở app</strong>
                <small>Màn hình đầu tiên được tải khi bật phần mềm.</small>
              </div>
              <select
                className="settings-select"
                value={defaultView}
                onChange={(e) => handleDefaultViewChange(e.target.value)}
              >
                <option value="chat">Trò chuyện với trợ lý AI</option>
                <option value="announcements">Thông báo nhà trường</option>
                <option value="schedule">Lịch học & Thời khóa biểu</option>
                <option value="exams">Lịch thi & Phòng thi</option>
                <option value="files">File mẫu & Biểu mẫu</option>
                <option value="appearance">Giao diện & Chủ đề</option>
              </select>
            </div>

            <div className="settings-row">
              <div>
                <strong>Tự động focus ô nhập liệu Chat</strong>
                <small>Tự đưa con trỏ vào ô nhập câu hỏi ngay khi ứng dụng khởi chạy.</small>
              </div>
              <button
                className={autoFocusChat ? "settings-toggle active" : "settings-toggle"}
                onClick={handleAutoFocusToggle}
              >
                {autoFocusChat ? "ĐÃ BẬT" : "ĐÃ TẮT"}
              </button>
            </div>

            <div className="settings-row">
              <div>
                <strong>Khôi phục Bố cục Khung làm việc (Layout)</strong>
                <small>Đặt lại kích thước mặc định cho Thanh bên (Sidebar) và Bảng phụ.</small>
              </div>
              <button className="settings-btn-secondary" onClick={onResetLayout}>
                <RotateCcw size={14} />
                Reset Layout
              </button>
            </div>

            <div className="settings-row">
              <div>
                <strong>Khôi phục Giao diện mặc định</strong>
                <small>Đặt lại màu nhấn, độ mờ glassmorphism và preset về mặc định ban đầu.</small>
              </div>
              <button className="settings-btn-secondary" onClick={onResetAppearance}>
                <RotateCcw size={14} />
                Reset Giao diện
              </button>
            </div>

            {/* TRUY CẬP NHANH CÁC TÍNH NĂNG HỆ THỐNG */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>Lối tắt Chức năng Hệ thống:</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="settings-btn-secondary" onClick={() => onNavigateToView("storage")}>
                  <Database size={14} /> Xem Bộ nhớ local
                </button>
                <button className="settings-btn-secondary" onClick={() => onNavigateToView("health")}>
                  <Activity size={14} /> Kiểm tra Hệ thống
                </button>
                <button className="settings-btn-secondary" onClick={() => onNavigateToView("release")}>
                  <BadgeCheck size={14} /> Xem Cập nhật & Release
                </button>
                <button className="settings-btn-secondary" onClick={() => onNavigateToView("logs")}>
                  <ListChecks size={14} /> Xem Nhật ký
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KẾT NỐI TRƯỜNG ĐẠI HỌC (CA-089.01: Minh bạch nguồn dữ liệu, bỏ mock giả định) */}
        {activeTab === "school" && (
          <div className="settings-section-group">
            <h3><GraduationCap size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Cổng Kết nối Trường Đại học Local</h3>

            {/* CHỌN TRƯỜNG ĐH */}
            <div className="settings-row">
              <div>
                <strong>Chọn Trường Đại học</strong>
                <small>Chọn trường để lấy thông tin kết nối cổng thông tin chính thức.</small>
              </div>
              <select
                className="settings-select"
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
              >
                {SUPPORTED_UNIVERSITIES.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} - {u.name}
                  </option>
                ))}
              </select>
            </div>

            {currentSchoolInfo && (
              <div style={{ padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg) 60%, transparent)", fontSize: "12px" }}>
                <strong style={{ color: "var(--accent)" }}>{currentSchoolInfo.name} ({currentSchoolInfo.code})</strong>
                <p style={{ color: "var(--muted)", margin: "4px 0 0 0" }}>{currentSchoolInfo.description}</p>
              </div>
            )}

            {/* KẾT NỐI CỔNG THÔNG TIN SINH VIÊN (PORTAL GATE) */}
            <div className="settings-card-box">
              <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 8px 0", color: "var(--text)" }}>
                Cổng thông tin Sinh viên (Cổng Portal & SSO Trường)
              </h4>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 12px 0" }}>
                Mở Cổng thông tin chính thức của trường trên trình duyệt hệ thống. Ứng dụng không lưu trữ hay xử lý mật khẩu của bạn.
              </p>

              {session ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", borderRadius: "8px", border: "1px solid color-mix(in srgb, #22c55e 40%, transparent)", background: "color-mix(in srgb, #22c55e 10%, transparent)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <UserCheck size={18} style={{ color: "#22c55e" }} />
                    <div>
                      <strong style={{ fontSize: "13px", color: "#22c55e", display: "block" }}>
                        Đã kết nối phiên local: {session.studentName || session.studentId} ({session.schoolName})
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--text)" }}>
                        Thời hạn phiên: đến {new Date(session.expiresAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <button className="settings-btn-danger" onClick={handleRevokeSessionWithConfirm}>
                      <LogOut size={13} /> Đăng xuất phiên làm việc
                    </button>
                  </div>
                </div>
              ) : (
                <div className="settings-subcard-item">
                  <div>
                    <strong style={{ fontSize: "12px", color: "var(--text)", display: "block" }}>Trạng thái: Chưa liên kết phiên</strong>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>Bấm bên phải để truy cập cổng trường chính thức.</span>
                  </div>
                  <button className="settings-btn-primary" onClick={handleOpenSchoolWebviewGate} disabled={isAuthenticating}>
                    <Lock size={13} /> {isAuthenticating ? "Đang chuyển hướng..." : "Mở Cổng Sinh viên"}
                  </button>
                </div>
              )}
            </div>

            {/* KIỂM SOÁT ĐỒNG BỘ NGẦM */}
            <div className="settings-card-box">
              <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 10px 0", color: "var(--text)" }}>
                Kiểm soát Đồng bộ Dữ liệu Ngầm
              </h4>

              <div className="settings-row" style={{ marginBottom: "8px" }}>
                <div>
                  <strong>Tự động đồng bộ lịch học & lịch thi</strong>
                  <small>Tính năng kết nối tự động (chỉ hoạt động khi có contract API hợp lệ từ trường).</small>
                </div>
                <button
                  className={syncConfig.autoSync ? "settings-toggle active" : "settings-toggle"}
                  onClick={() => handleSyncToggle("autoSync")}
                >
                  {syncConfig.autoSync ? "ĐÃ BẬT" : "ĐÃ TẮT"}
                </button>
              </div>

              {session?.lastSyncAt && (
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={12} /> Lần đồng bộ thành công gần nhất: {session.lastSyncAt}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BẢO MẬT & VAULT */}
        {activeTab === "security" && (
          <div className="settings-section-group">
            <h3><Shield size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Bảo mật & OS Secure Vault</h3>

            <div className="security-banner-box">
              <CheckCircle2 size={20} className="text-success" />
              <div>
                <strong>Chế độ Local-First 100% (Mặc định)</strong>
                <p>Mọi hội thoại, tài liệu và dữ liệu cá nhân chỉ được lưu trữ trên ổ đĩa của bạn. Không gửi bất kỳ dữ liệu nào đến server bên ngoài.</p>
              </div>
            </div>

            <div className="settings-row">
              <div>
                <strong>Kho lưu trữ mật mã OS Vault</strong>
                <small>Kiến trúc mã hóa Token cục bộ (Local Storage / Secure Vault).</small>
              </div>
              <span className="badge-vault-status">Local Storage (Active)</span>
            </div>

            <div className="settings-row">
              <div>
                <strong>Quản lý Token & Phiên Trường</strong>
                <small>Xóa sạch token và dữ liệu phiên làm việc được lưu trên thiết bị.</small>
              </div>
              <button
                className="settings-btn-secondary"
                onClick={handleRevokeSessionWithConfirm}
                disabled={!session}
              >
                <LogOut size={14} />
                {session ? "Đăng xuất phiên trường" : "Chưa có phiên trường"}
              </button>
            </div>

            <div className="settings-row">
              <div>
                <strong>Sao lưu & Phục hồi Cấu hình Local (Backup / Restore)</strong>
                <small>Xuất hoặc nhập toàn bộ thiết lập ứng dụng ra tệp JSON để chuyển đổi thiết bị.</small>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button className="settings-btn-secondary" onClick={handleDownloadBackupFile} title="Tải tệp campus-assistant-backup.json về máy">
                  <Download size={14} /> Tải tệp Backup (.json)
                </button>
                <label className="settings-btn-secondary" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }} title="Khôi phục cài đặt từ tệp .json trên máy">
                  <Upload size={14} /> Nhập tệp Backup (.json)
                  <input type="file" accept=".json" onChange={handleFileUploadBackup} style={{ display: "none" }} />
                </label>
                <button className="settings-btn-secondary" onClick={handleExportBackupJSON} title="Copy chuỗi Backup JSON vào Clipboard">
                  Copy Clipboard
                </button>
              </div>
            </div>

            <div className="danger-zone-card">
              <h4><AlertTriangle size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Vùng Cảnh báo Nguy hiểm</h4>
              <p>Khôi phục sạch ứng dụng, xóa toàn bộ cài đặt local và cache đệm.</p>
              <button className="settings-btn-danger" onClick={handleWipeAllLocalData}>
                <Trash2 size={14} />
                Xóa toàn bộ Dữ liệu Ứng dụng Local
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: DEV MODE */}
        {activeTab === "dev" && (
          <div className="settings-section-group">
            <h3><Code2 size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Công cụ Lập trình (Dev Mode)</h3>

            <div className="settings-row">
              <div>
                <strong>Chế độ Nhà phát triển (Dev Mode)</strong>
                <small>Hiển thị lệnh CLI, log chi tiết IPC và trạng thái kết nối Tauri Backend.</small>
              </div>
              <button
                className={devModeEnabled ? "settings-toggle active" : "settings-toggle"}
                onClick={handleDevModeToggle}
              >
                {devModeEnabled ? "ĐÃ BẬT" : "ĐÃ TẮT"}
              </button>
            </div>

            {devModeEnabled && (
              <div className="dev-tools-box">
                <h4>Lệnh CLI Phát triển Hệ thống:</h4>
                <div className="code-command-list">
                  <div className="cmd-item">
                    <code>npm run dev:desktop</code>
                    <span>Chạy ứng dụng desktop local ở chế độ Live Reload (Vite + Tauri)</span>
                  </div>
                  <div className="cmd-item">
                    <code>npm run check:all</code>
                    <span>Kiểm tra lỗi Type Checking và Syntax trước khi commit</span>
                  </div>
                  <div className="cmd-item">
                    <code>npm run build:installer</code>
                    <span>Đóng gói bộ cài đặt Desktop Installer (.msi / .exe)</span>
                  </div>
                </div>

                <div className="dev-status-grid">
                  <div className="dev-status-item">
                    <span>Tauri IPC Core:</span>
                    <strong>v2.0 (Active)</strong>
                  </div>
                  <div className="dev-status-item">
                    <span>Local Database:</span>
                    <strong>SQLite (campus_assistant.db)</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}