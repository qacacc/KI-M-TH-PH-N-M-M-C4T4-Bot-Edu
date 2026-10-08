import React, { useState, useEffect } from "react";
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
  RefreshCw,
  FileText,
  Clock,
  UserCheck,
  Download,
  Upload,
} from "lucide-react";
import type { StorageSummary, HealthReport } from "../types";
import { downloadBackupFile, exportLocalAppDataJSON, importLocalAppDataJSON, uploadBackupFile } from "../utils/backupRestore";
import {
  SUPPORTED_UNIVERSITIES,
  StudentSession,
  SchoolSyncConfig,
  PublicSchoolDocument,
} from "../schoolConnector/types";
import {
  getStoredSession,
  saveStudentSession,
  revokeSession,
  getSyncConfig,
  saveSyncConfig,
  getPublicSchoolDocs,
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

  // School connector state
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("uth");
  const [session, setSession] = useState<StudentSession | null>(() => getStoredSession());
  const [syncConfig, setSyncConfigState] = useState<SchoolSyncConfig>(() => getSyncConfig());
  const [publicDocs, setPublicDocs] = useState<PublicSchoolDocument[]>(() => getPublicSchoolDocs("uth"));
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    setPublicDocs(getPublicSchoolDocs(selectedSchoolId));
  }, [selectedSchoolId]);

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

  // Giả lập mở Cổng WebView SSO Trường (WebView Gate)
  const handleOpenSchoolWebviewGate = async () => {
    const selectedSchool = SUPPORTED_UNIVERSITIES.find((u) => u.id === selectedSchoolId);
    if (!selectedSchool) return;

    setIsAuthenticating(true);
    const ok = await openGlassConfirm(
      `Ứng dụng chuẩn bị mở cổng xác thực SSO chính thức của ${selectedSchool.name} (${selectedSchool.ssoUrl}).\n\nMật khẩu của bạn do nhà trường xác thực trực tiếp, phần mềm KHÔNG lưu mật khẩu. Bạn có muốn tiếp tục?`,
      "Kết nối Cổng thông tin Sinh viên"
    );

    if (ok) {
      openExternalUrl(selectedSchool.ssoUrl);
      setIsAuthenticating(false);
      await openGlassAlert(
        `Đã mở Cổng Portal/SSO chính thức của ${selectedSchool.name} (${selectedSchool.ssoUrl}) trên trình duyệt mặc định của hệ điều hành.`,
        "Mở Cổng Trường"
      );
    } else {
      setIsAuthenticating(false);
    }
  };

  const handleRevokeSessionWithConfirm = async () => {
    const ok = await openGlassConfirm(
      "Bạn có chắc chắn muốn đăng xuất và xóa sạch Session Token khỏi Local Vault không? Bạn sẽ cần đăng nhập lại qua cổng SSO trường để lấy lại dữ liệu học tập cá nhân.",
      "Đăng xuất Phiên làm việc Trường"
    );
    if (ok) {
      revokeSession();
      setSession(null);
      await openGlassAlert("Đã xóa sạch Session Token khỏi Local Vault.", "Đã đăng xuất");
    }
  };

  const handleExportBackupJSON = async () => {
    try {
      const jsonStr = exportLocalAppDataJSON();
      await navigator.clipboard.writeText(jsonStr);
      await openGlassAlert("Đã xuất cấu hình Backup JSON vào Bộ nhớ tạm (Clipboard). Bạn có thể dán ra file để lưu trữ.", "Xuất Backup Thành công");
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
        await openGlassAlert("Không tìm thấy dữ liệu Backup hợp lệ trong bộ nhớ tạm (Clipboard). Vui lòng copy chuỗi JSON backup trước.", "Lỗi Nhập Backup");
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
      "CẢNH BÁO: Bạn sắp xóa sạch cấu hình cài đặt local, bộ nhớ đệm và thiết lập ứng dụng. Tiếp tục?",
      "Xóa toàn bộ dữ liệu ứng dụng"
    );
    if (ok) {
      localStorage.clear();
      revokeSession();
      setSession(null);
      onResetAppearance();
      onResetLayout();
      await openGlassAlert("Đã khôi phục cài đặt ứng dụng về trạng thái ban đầu.", "Hoàn tất");
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

            {/* TRUY CẬP NHANH CÁC NĂNG HỆ THỐNG */}
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

        {/* TAB 2: KẾT NỐI TRƯỜNG ĐẠI HỌC (CA-055 -> CA-059) */}
        {activeTab === "school" && (
          <div className="settings-section-group">
            <h3><GraduationCap size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Cổng Kết nối Trường Đại học Local</h3>

            {/* CHỌN TRƯỜNG ĐH */}
            <div className="settings-row">
              <div>
                <strong>Chọn Trường Đại học đang/sắp học</strong>
                <small>Ứng dụng sẽ lấy thông tin tuyển sinh công khai hoặc kết nối SSO trường tương ứng.</small>
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

            {/* 1. CHẾ ĐỘ TÂN SINH VIÊN (PUBLIC PORTAL MODE) */}
            <div className="settings-card-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text)" }}>
                  1. Chế độ Tân sinh viên (Public University Portal)
                </h4>
                <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "10px", background: "color-mix(in srgb, var(--accent) 20%, transparent)", color: "var(--accent)", fontWeight: 600 }}>
                  Khuyến nghị Tân sinh viên
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 12px 0" }}>
                Dành cho tân sinh viên vừa đậu trường, chưa có Mã số sinh viên hay email trường. Ứng dụng tự động tải dữ liệu tuyển sinh, sơ đồ trường và thủ tục nhập học công khai mà <strong>KHÔNG CẦN ĐĂNG NHẬP</strong>.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {publicDocs.map((doc) => (
                  <div key={doc.id} className="settings-subcard-item">
                    <div>
                      <strong style={{ fontSize: "12px", display: "block", color: "var(--text)" }}>{doc.title}</strong>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>Ngày đăng: {doc.date} · {doc.summary}</span>
                    </div>
                    <button
                      className="settings-btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "11px", flexShrink: 0 }}
                      onClick={() => window.open(doc.sourceUrl, "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink size={12} /> Xem nguồn
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. CHẾ ĐỘ XÁC THỰC SINH VIÊN (SSO PORTAL GATE) */}
            <div className="settings-card-box">
              <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 8px 0", color: "var(--text)" }}>
                2. Kết nối Cổng thông tin Sinh viên (Cổng Portal & SSO Trường)
              </h4>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 12px 0" }}>
                Dành cho sinh viên đang học. Mở Cổng thông tin chính thức của trường trên trình duyệt để xác thực. Ứng dụng không lưu mật khẩu của bạn.
              </p>

              {session ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", borderRadius: "8px", border: "1px solid color-mix(in srgb, #22c55e 40%, transparent)", background: "color-mix(in srgb, #22c55e 10%, transparent)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <UserCheck size={18} style={{ color: "#22c55e" }} />
                    <div>
                      <strong style={{ fontSize: "13px", color: "#22c55e", display: "block" }}>
                        Đã xác thực: {session.studentName} ({session.studentId}) - {session.schoolName}
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--text)" }}>
                        Thời hạn phiên: đến {new Date(session.expiresAt).toLocaleDateString("vi-VN")} (Session Local có thời hạn)
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
                    <strong style={{ fontSize: "12px", color: "var(--text)", display: "block" }}>Trạng thái: Chưa kết nối phiên làm việc</strong>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>Bấm bên phải để chuyển tới Cổng sinh viên chính thức của trường.</span>
                  </div>
                  <button className="settings-btn-primary" onClick={handleOpenSchoolWebviewGate} disabled={isAuthenticating}>
                    <Lock size={13} /> {isAuthenticating ? "Đang chuyển cổng..." : "Kết nối Cổng sinh viên"}
                  </button>
                </div>
              )}
            </div>

            {/* 3. CẤU HÌNH ĐỒNG BỘ NGẦM (BACKGROUND SYNC CONFIG) */}
            <div className="settings-card-box">
              <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 10px 0", color: "var(--text)" }}>
                3. Kiểm soát Đồng bộ Dữ liệu Ngầm
              </h4>

              <div className="settings-row" style={{ marginBottom: "8px" }}>
                <div>
                  <strong>Tự động đồng bộ lịch học & lịch thi</strong>
                  <small>Đồng bộ khi khởi chạy app (chỉ hoạt động khi Session Token hợp lệ).</small>
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
                <strong>Kho lưu trữ mật mã OS Vault (CA-082)</strong>
                <small>Kiến trúc mã hóa Session Token (Chế độ Session-Only / DPAPI Planned).</small>
              </div>
              <span className="badge-vault-status">Local Storage (DPAPI: Planned)</span>
            </div>

            <div className="settings-row">
              <div>
                <strong>Quản lý Token & Session Trường (CA-036)</strong>
                <small>Session Token có thời hạn local. Bạn có thể xóa chủ động bất cứ lúc nào.</small>
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
