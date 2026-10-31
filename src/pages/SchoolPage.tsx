import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Database,
  ExternalLink,
  GraduationCap,
  Lock,
  LogOut,
  MonitorCheck,
  Save,
  Shield,
  Trash2,
  UserCheck,
  Wifi,
  Info,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  clearSchoolProfile,
  createDefaultSchoolProfile,
  readSchoolProfile,
  saveSchoolProfile,
  schoolOptions,
  type SchoolOption,
} from "../schoolProfile";

import {
  getConnectorSyncStatus,
  disconnectConnector,
  deleteConnectorData,
  type ConnectorSyncStatus,
} from "../tauriApi";
import { ACADEMIC_CACHE_UPDATED_EVENT } from "../academicData";
import { openPortal, isAuthenticated } from "../schoolConnector/schoolVault"; // CA-089.01

export function SchoolPage() {
  const [profile, setProfile] = useState(() => readSchoolProfile());
  const [notice, setNotice] = useState("");
  const [syncStatus, setSyncStatus] = useState<ConnectorSyncStatus | null>(null);
  
  // CA-089.01: State cho trạng thái mở portal
  const [openingPortal, setOpeningPortal] = useState(false);
  const isAuth = isAuthenticated();

  // Accordion state cho khu vực Nâng cao & Developer tools
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedSchool = useMemo(
    () => schoolOptions.find((item) => item.id === profile.schoolId) ?? schoolOptions[0],
    [profile.schoolId],
  );
  
  const hasPortalUrl = !!(selectedSchool.studentPortalUrl || selectedSchool.portalUrl);
  const isUthSelected = selectedSchool.id === "uth";

  useEffect(() => {
    const codeToQuery = profile.studentCode.trim();
    let cancelled = false;
    setSyncStatus(null);
    
    if (!codeToQuery || profile.schoolId !== "uth") {
      setSyncStatus(null);
      return;
    }
    
    void getConnectorSyncStatus(codeToQuery)
      .then((status) => {
        if (cancelled) return;
        setSyncStatus(status || null);
      })
      .catch(() => { 
        if (!cancelled) setNotice("Không đọc được trạng thái đồng bộ SQLite. Cache đã lưu được giữ nguyên."); 
      });
      
    return () => { cancelled = true; };
  }, [profile.studentCode, profile.schoolId]);

  function updateSchool(school: SchoolOption) {
    setNotice("");
    setProfile((current) => ({
      ...current,
      schoolId: school.id,
      schoolName: school.name,
    }));
  }

  function handleSaveProfile() {
    const next = {
      ...profile,
      schoolName: selectedSchool.name,
      updatedAt: new Date().toISOString(),
    };
    saveSchoolProfile(next);
    setProfile(next);
    setNotice("✅ Đã lưu hồ sơ sinh viên local thành công.");
  }

  // CA-089.01: Dùng await promise phân định rõ resolve/reject
  async function handleOpenSchoolPortalPrimary() {
    if (!hasPortalUrl) {
      setNotice(`Trường đang chọn chưa có URL cổng sinh viên.`);
      return;
    }
    
    setOpeningPortal(true);
    setNotice("Đang mở trình duyệt kết nối cổng trường...");
    
    try {
      await openPortal();
      // Chỉ xác nhận mở thành công, KHÔNG giả mạo trạng thái đăng nhập
      setNotice(`✅ Đã mở Portal ${selectedSchool.shortName}. Đăng nhập trên trình duyệt không tự kết nối phiên vào app.`);
    } catch (error) {
      setNotice("❌ Lỗi: Không thể mở cổng kết nối trường.");
    } finally {
      setOpeningPortal(false);
    }
  }

  async function handleLogoutPortal() {
    if (!window.confirm("Bạn có chắc chắn muốn ngắt kết nối phiên? Dữ liệu cache thời khóa biểu cũ vẫn sẽ được giữ lại.")) {
      return;
    }
    try {
      await disconnectConnector(profile.schoolId, profile.studentCode);
      const updated = await getConnectorSyncStatus(profile.studentCode);
      setSyncStatus(updated);
      setNotice("Đã ngắt kết nối phiên backend. Dữ liệu lịch học trong SQLite vẫn được giữ lại.");
    } catch (err) {
      setNotice(`Lỗi ngắt kết nối: ${String(err)}`);
    }
  }

  async function handleClearConnectorData() {
    if (!profile.studentCode) return;
    if (!window.confirm("CẢNH BÁO: Xóa toàn bộ dữ liệu lịch học/lịch thi khỏi SQLite. Hành động này không thể hoàn tác. Tiếp tục?")) {
      return;
    }
    try {
      await deleteConnectorData(profile.studentCode);
      setSyncStatus(null);
      window.dispatchEvent(new Event(ACADEMIC_CACHE_UPDATED_EVENT));
      setNotice("Đã xóa toàn bộ dữ liệu thời khóa biểu & lịch thi khỏi local.");
    } catch (err) {
      setNotice(`Lỗi xóa dữ liệu: ${String(err)}`);
    }
  }

  function handleClearProfile() {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hồ sơ sinh viên local tự khai không?")) {
      return;
    }
    clearSchoolProfile();
    setProfile(createDefaultSchoolProfile());
    setNotice("Đã xóa sạch hồ sơ sinh viên local.");
  }

  return (
    <div className="page-card school-page">
      <div className="school-heading">
        <div>
          <h2><GraduationCap size={20} />Trường &amp; Tài khoản Sinh viên</h2>
          <p>Quản lý hồ sơ cá nhân local, kết nối cổng trường đại học và kiểm soát dữ liệu học tập local-first.</p>
        </div>
        <span className="settings-status-pill neutral">Local profile</span>
      </div>

      {notice && (
        <div className="school-notice" role="status">
          <Info size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <span>{notice}</span>
        </div>
      )}

      {/* KHỐI 1: HỒ SƠ LOCAL */}
      <section className="school-section school-block">
        <div className="school-block-header">
          <h3>1. Hồ sơ Sinh viên Local</h3>
          <span className="settings-status-pill success">Lưu trên máy</span>
        </div>
        
        <div className="school-form-grid">
          <label className="school-field">
            Tên sinh viên hiển thị
            <input
              value={profile.displayName}
              onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
              placeholder="Ví dụ: Nguyễn Văn A"
            />
          </label>

          <label className="school-field">
            Trường Đại học đang học
            <select
              className="school-select"
              value={profile.schoolId}
              onChange={(e) => {
                const found = schoolOptions.find((s) => s.id === e.target.value);
                if (found) updateSchool(found);
              }}
            >
              {schoolOptions.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.shortName} — {school.name}
                </option>
              ))}
            </select>
          </label>

          <label className="school-field">
            Mã số sinh viên (MSSV nếu có)
            <input
              value={profile.studentCode}
              onChange={(event) => setProfile((current) => ({ ...current, studentCode: event.target.value }))}
              placeholder="Ví dụ: 2251120001"
            />
          </label>

          <div className="school-field">
            Chế độ tài khoản
            <div className="school-mode-selector">
              <button
                type="button"
                className={profile.mode === "public" ? "school-mode-btn active" : "school-mode-btn"}
                onClick={() => setProfile((current) => ({ ...current, mode: "public" }))}
              >
                Tân sinh viên / Chưa có MSSV
              </button>
              <button
                type="button"
                className={profile.mode === "student" ? "school-mode-btn active" : "school-mode-btn"}
                onClick={() => setProfile((current) => ({ ...current, mode: "student" }))}
              >
                Sinh viên đang học
              </button>
            </div>
          </div>
        </div>

        <div className="school-block-actions">
          <button className="settings-btn-secondary" onClick={handleSaveProfile}>
            <Save size={14} />
            Lưu hồ sơ
          </button>
        </div>
      </section>

      {/* KHỐI 2: KẾT NỐI CỔNG TRƯỜNG */}
      <section className="school-section school-block">
        <div className="school-block-header">
          <h3>2. Kết nối Cổng trường Đại học</h3>
          <span className="settings-status-pill neutral">Local-First Sandbox</span>
        </div>

        {/* CA-089.01: HIỂN THỊ CHÍNH XÁC TRẠNG THÁI KHÔNG FAKE */}
        <div className="school-connector-status">
          <div className="school-connector-row">
            <Lock size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
            <span className="school-connector-label">Cổng {selectedSchool.shortName}</span>
            <span className={hasPortalUrl ? "settings-status-pill success" : "settings-status-pill neutral"}>
              {hasPortalUrl ? "Có URL portal" : "Chưa có URL"}
            </span>
          </div>
          <div className="school-connector-row">
            <Wifi size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
            <span className="school-connector-label">Kết nối API Trường</span>
            <span className={isUthSelected ? "settings-status-pill warning" : "settings-status-pill neutral"}>
              {isUthSelected ? "Chưa sẵn sàng" : "Chưa hỗ trợ"}
            </span>
          </div>
          <div className="school-connector-row">
            <UserCheck size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
            <span className="school-connector-label">Xác thực hệ thống</span>
            <span className={isAuth ? "settings-status-pill success" : "settings-status-pill neutral"}>
              {isAuth ? "Đã liên kết (Có Session)" : "Chưa xác thực (Không có Session)"}
            </span>
          </div>
        </div>

        <p className="school-explain-note">
          <Shield size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <span>Bạn đăng nhập trực tiếp trên website trường. Ứng dụng không bao giờ lưu mật khẩu của bạn.</span>
        </p>

        {isUthSelected ? (
          <>
            <p className="school-explain-note" style={{ marginTop: 0 }}>
              <Sparkles size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <span style={{ color: "var(--foreground)", fontSize: "13px", fontWeight: 500 }}>
                Đồng bộ UTH đang bị khóa để chờ API từ trường. Giao diện này không tự động tải hay phát sinh dữ liệu mô phỏng.
              </span>
            </p>

            <div className="school-block-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                className="settings-btn-primary"
                style={{ padding: "11px 24px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}
                onClick={handleOpenSchoolPortalPrimary}
                disabled={!hasPortalUrl || openingPortal}
              >
                <MonitorCheck size={16} />
                {openingPortal ? "Đang mở portal..." : "Mở portal UTH trên trình duyệt"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="school-explain-note" style={{ marginTop: 0 }}>
              <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                Hồ sơ nhập tay chưa phải xác thực tài khoản trường. Trường này chưa có chức năng đồng bộ dữ liệu vào app.
              </span>
            </p>

            <div className="school-block-actions">
              <button
                className="settings-btn-primary"
                style={{ padding: "10px 22px", fontSize: "14px", fontWeight: 600 }}
                onClick={handleOpenSchoolPortalPrimary}
                disabled={!hasPortalUrl || openingPortal}
              >
                <MonitorCheck size={16} />
                {openingPortal ? "Đang xử lý..." : (hasPortalUrl ? `Mở Portal ${selectedSchool.shortName}` : "Chưa có URL portal")}
              </button>
            </div>
          </>
        )}
      </section>

      {/* KHỐI 3: DỮ LIỆU LOCAL */}
      <section className="school-section school-block">
        <div className="school-block-header">
          <h3>3. Dữ liệu Học tập Local</h3>
          <span className="settings-status-pill success">SQLite Local DB</span>
        </div>

        <div className="school-status-grid">
          <StatusTile
            title="Lịch học cache"
            value={syncStatus ? `${syncStatus.schedulesCount} buổi học` : "0 buổi học"}
            detail={syncStatus ? "Cache local SQLite" : "Chưa có dữ liệu"}
          />
          <StatusTile
            title="Lịch thi cache"
            value={syncStatus ? `${syncStatus.examsCount} môn thi` : "0 môn thi"}
            detail={syncStatus ? "Cache local SQLite" : "Chưa có dữ liệu"}
          />
          <StatusTile
            title="Nguồn dữ liệu"
            value={syncStatus ? syncStatus.sourceName : "Chưa có kết nối"}
            detail="Local Data App"
          />
          <StatusTile
            title="Lần đồng bộ gần nhất"
            value={syncStatus?.lastSuccessAt ? new Date(syncStatus.lastSuccessAt).toLocaleDateString("vi-VN") : "Chưa đồng bộ"}
            detail={syncStatus?.lastSuccessAt ? new Date(syncStatus.lastSuccessAt).toLocaleTimeString("vi-VN") : "Không có lịch sử"}
          />
        </div>
      </section>

      {/* KHỐI NÂNG CAO */}
      <section className="school-section school-advanced-section">
        <button
          type="button"
          className="school-accordion-header"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Database size={15} style={{ color: "var(--muted)" }} />
            <strong>Công cụ Nâng cao (Developer Zone)</strong>
          </div>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvanced && (
          <div className="school-accordion-body">
            <div className="advanced-group">
              <div className="school-block-actions">
                {syncStatus && (
                  <button className="settings-btn-secondary" onClick={handleLogoutPortal}>
                    <LogOut size={14} />
                    Đăng xuất phiên Portal (Giữ SQLite Cache)
                  </button>
                )}
              </div>
            </div>

            <div className="danger-zone-box" style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid color-mix(in srgb, #ef4444 30%, transparent)" }}>
              <h4 style={{ color: "#ef4444", margin: "0 0 8px 0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={14} />
                Vùng Nguy Hiểm
              </h4>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 12px 0" }}>
                Các thao tác bên dưới sẽ xóa dữ liệu local vĩnh viễn khỏi thiết bị của bạn.
              </p>
              <div className="school-block-actions">
                {syncStatus && (
                  <button className="settings-btn-danger" onClick={handleClearConnectorData}>
                    <Trash2 size={14} />
                    Xóa toàn bộ dữ liệu khỏi SQLite
                  </button>
                )}
                <button className="settings-btn-danger" onClick={handleClearProfile} style={{ opacity: 0.85 }}>
                  <Trash2 size={14} />
                  Xóa hồ sơ tự khai local
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusTile({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="school-status-tile">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}