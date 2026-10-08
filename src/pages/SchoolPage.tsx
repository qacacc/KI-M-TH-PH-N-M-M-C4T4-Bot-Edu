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
  WifiOff,
  CheckCircle2,
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
  openExternalUrl,
  syncEmbeddedSchoolData,
  openUthLoginWindow,
  onUthSyncResult,
  getConnectorSyncStatus,
  disconnectConnector,
  deleteConnectorData,
  type ConnectorSyncStatus,
} from "../tauriApi";

export function SchoolPage() {
  const [profile, setProfile] = useState(() => readSchoolProfile());
  const [notice, setNotice] = useState("");
  const [syncStatus, setSyncStatus] = useState<ConnectorSyncStatus | null>(null);
  
  // Accordion state cho khu vực Nâng cao & Developer tools
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedSchool = useMemo(
    () => schoolOptions.find((item) => item.id === profile.schoolId) ?? schoolOptions[0],
    [profile.schoolId],
  );
  // Kiểm tra trường có URL portal không (tất cả trường đều có thể mở, chỉ UTH có WebView thử nghiệm)
  const hasPortalUrl = !!(selectedSchool.studentPortalUrl || selectedSchool.portalUrl);
  const isUthSelected = selectedSchool.id === "uth";

  useEffect(() => {
    const codeToQuery = profile.studentCode.trim();
    if (!codeToQuery) {
      setSyncStatus(null);
      return;
    }
    void getConnectorSyncStatus(codeToQuery)
      .then((status) => {
        if (status) {
          setSyncStatus(status);
        } else {
          setSyncStatus(null);
        }
      })
      .catch(() => setSyncStatus(null));
  }, [profile.studentCode]);

  // Tự động nhận kết quả khi người dùng đăng nhập trong WebView UTH (Xác nhận 1 lần)
  useEffect(() => {
    let unlistenFn: (() => void) | undefined;
    void onUthSyncResult((result) => {
      if (result.success) {
        const nextCode = result.studentCode || profile.studentCode;
        const nextName = result.studentName || profile.displayName;
        const next = {
          ...profile,
          studentCode: nextCode,
          displayName: nextName,
          schoolId: "uth",
          schoolName: "Trường Đại học Giao thông vận tải TP.HCM (UTH)",
          mode: "student" as const,
          updatedAt: new Date().toISOString(),
        };
        saveSchoolProfile(next);
        setProfile(next);
        setNotice(
          `🎉 Đăng nhập & đồng bộ thành công! Đã nạp ${result.schedulesCount ?? 0} buổi học và ${result.examsCount ?? 0} môn thi vào máy.`
        );
        if (nextCode) {
          void getConnectorSyncStatus(nextCode).then((st) => setSyncStatus(st));
        }
      } else {
        setNotice(`⚠️ Đồng bộ thất bại: ${result.message}`);
      }
    }).then((unsub) => {
      unlistenFn = unsub;
    });

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [profile]);

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

  async function handleOpenSchoolPortalPrimary() {
    const targetUrl = selectedSchool.studentPortalUrl || selectedSchool.portalUrl;
    if (!targetUrl) {
      setNotice(`Trường đang chọn chưa có URL cổng sinh viên trong manifest local.`);
      return;
    }
    openExternalUrl(targetUrl);
    setNotice(`Đã mở Portal ${selectedSchool.shortName} (${targetUrl}) bằng trình duyệt mặc định. → Đăng nhập trên trình duyệt, sau đó nhập MSSV vào ô phíd trên để app nhận biết bạn.`);
  }

  async function handleOpenUthWebViewExperimental() {
    if (!isUthSelected) {
      setNotice(`WebView UTH không áp dụng cho ${selectedSchool.shortName}.`);
      return;
    }
    try {
      await openUthLoginWindow();
      setNotice("✅ Đã mở WebView UTH thử nghiệm. Nếu cửa sổ trắng, hãy dùng nút mở portal bằng trình duyệt ngoài.");
    } catch (err) {
      setNotice(`⚠️ Không mở được WebView UTH thử nghiệm: ${String(err)}`);
    }
  }

  async function handlePrototypeSync() {
    const targetCode = profile.studentCode.trim() || "DEMO123456";
    try {
      const res = await syncEmbeddedSchoolData(
        profile.schoolId,
        targetCode,
        profile.displayName || "Sinh viên Mô phỏng",
      );
      if (res.success) {
        const next = {
          ...profile,
          displayName: profile.displayName || res.studentName || "Sinh viên Mô phỏng",
          studentCode: res.studentCode || targetCode,
          mode: "student" as const,
          schoolName: selectedSchool.name,
          updatedAt: new Date().toISOString(),
        };
        saveSchoolProfile(next);
        setProfile(next);
        const updated = await getConnectorSyncStatus(next.studentCode);
        setSyncStatus(updated);
        setNotice(`✅ ${res.message}`);
      } else {
        setNotice(`⚠️ ${res.message}`);
      }
    } catch (err) {
      setNotice(`Lỗi prototype sync: ${String(err)}`);
    }
  }

  async function handleLogoutPortal() {
    if (!window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi phiên Cổng trường? Dữ liệu cache thời khóa biểu cũ vẫn sẽ được giữ lại để sử dụng offline.")) {
      return;
    }
    try {
      await disconnectConnector(profile.schoolId, profile.studentCode);
      const updated = await getConnectorSyncStatus(profile.studentCode);
      setSyncStatus(updated);
      setNotice("Đã ngắt kết nối phiên đăng nhập backend. Dữ liệu thời khóa biểu đã lưu trong SQLite vẫn được giữ lại để sử dụng Offline.");
    } catch (err) {
      setNotice(`Lỗi ngắt kết nối: ${String(err)}`);
    }
  }

  async function handleClearConnectorData() {
    if (!profile.studentCode) return;
    if (!window.confirm("CẢNH BÁO: Bạn sắp xóa toàn bộ dữ liệu lịch học và lịch thi của Connector khỏi SQLite Local. Hành động này không thể hoàn tác. Tiếp tục?")) {
      return;
    }
    try {
      await deleteConnectorData(profile.studentCode);
      setSyncStatus(null);
      setNotice("Đã xóa toàn bộ dữ liệu thời khóa biểu & lịch thi khỏi SQLite Local.");
    } catch (err) {
      setNotice(`Lỗi xóa dữ liệu: ${String(err)}`);
    }
  }

  function confirmAndOpenSchoolPortal() {
    const next = {
      ...profile,
      mode: "student" as const,
      schoolName: selectedSchool.name,
      updatedAt: new Date().toISOString(),
    };
    saveSchoolProfile(next);
    setProfile(next);

    const targetUrl = selectedSchool.studentPortalUrl || selectedSchool.portalUrl;

    if (targetUrl) {
      openExternalUrl(targetUrl);
      setNotice(
        `Đã mở Cổng Portal Sinh viên của ${selectedSchool.name} (${targetUrl}) trên trình duyệt mặc định.`,
      );
    } else {
      setNotice("Trường đang chọn chưa có URL cổng sinh viên công khai trong manifest local.");
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
        <div className="school-notice">
          <CheckCircle2 size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
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

        {/* THÔNG TIN TRẠNG THÁI CHÍNH XÁC (WORDING TRUNG THỰC BAT BUOC) */}
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
            <span className="school-connector-label">Đồng bộ {selectedSchool.shortName}</span>
            <span className={isUthSelected ? "settings-status-pill warning" : "settings-status-pill neutral"}>
              {isUthSelected ? "Thử nghiệm (UTH)" : "Mở trình duyệt"}
            </span>
          </div>
          <div className="school-connector-row">
            <Shield size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
            <span className="school-connector-label">Lưu token/cookie</span>
            <span className="settings-status-pill neutral">App không lưu</span>
          </div>
          <div className="school-connector-row">
            <UserCheck size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
            <span className="school-connector-label">Xác thực</span>
            <span className="settings-status-pill neutral">Qua website trường</span>
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
                Chỉ cần xác nhận 1 lần: Đăng nhập trong cửa sổ app, hệ thống sẽ tự động đồng bộ thời khóa biểu &amp; lịch thi vào SQLite Local rồi tự đóng cửa sổ.
              </span>
            </p>

            <div className="school-block-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                className="settings-btn-primary"
                style={{ padding: "11px 24px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}
                onClick={handleOpenUthWebViewExperimental}
              >
                <Sparkles size={16} />
                Đăng nhập &amp; Tự động lấy dữ liệu (Chỉ 1 lần)
              </button>

              <button
                className="settings-btn-secondary"
                style={{ padding: "10px 18px", fontSize: "13px" }}
                onClick={handleOpenSchoolPortalPrimary}
                disabled={!hasPortalUrl}
              >
                <ExternalLink size={14} />
                Hoặc mở Portal trên trình duyệt ngoài
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="school-explain-note" style={{ marginTop: 0 }}>
              <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                Sau khi đăng nhập xong trên trình duyệt, quay lại app và điền MSSV vào ô "Mã số sinh viên" phía trên rồi nhấn Lưu hồ sơ.
              </span>
            </p>

            <div className="school-block-actions">
              <button
                className="settings-btn-primary"
                style={{ padding: "10px 22px", fontSize: "14px", fontWeight: 600 }}
                onClick={handleOpenSchoolPortalPrimary}
                disabled={!hasPortalUrl}
              >
                <MonitorCheck size={16} />
                {hasPortalUrl
                  ? `Mở Portal ${selectedSchool.shortName} trên trình duyệt`
                  : `${selectedSchool.shortName}: chưa có URL portal`}
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
            detail={syncStatus ? "Đã lưu vào SQLite Local" : "Sử dụng dữ liệu JSON mẫu đóng gói (0 cache)"}
          />
          <StatusTile
            title="Lịch thi cache"
            value={syncStatus ? `${syncStatus.examsCount} môn thi` : "0 môn thi"}
            detail={syncStatus ? "Đã lưu vào SQLite Local" : "Sử dụng dữ liệu JSON mẫu đóng gói (0 cache)"}
          />
          <StatusTile
            title="Nguồn dữ liệu"
            value={
              syncStatus
                ? syncStatus.sourceName === "uth-portal"
                  ? "UTH Portal Experimental"
                  : "Prototype Mock"
                : "Mẫu local (JSON đóng gói)"
            }
            detail="Local-First Domain Arbitration"
          />
          <StatusTile
            title="Lần đồng bộ gần nhất"
            value={
              syncStatus?.lastSuccessAt
                ? new Date(syncStatus.lastSuccessAt).toLocaleDateString("vi-VN")
                : "Chưa đồng bộ"
            }
            detail={
              syncStatus?.lastSuccessAt
                ? new Date(syncStatus.lastSuccessAt).toLocaleTimeString("vi-VN")
                : isUthSelected
                  ? "Chưa có cache từ connector UTH"
                  : "Connector trường này chưa hỗ trợ"
            }
          />
        </div>
      </section>

      {/* KHỐI NÂNG CAO & VÙNG NGUY HIỂM — COLLAPSIBLE ACCORDION */}
      <section className="school-section school-advanced-section">
        <button
          type="button"
          className="school-accordion-header"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Database size={15} style={{ color: "var(--muted)" }} />
            <strong>Công cụ Nâng cao &amp; Vùng Nguy Hiểm (Developer / Danger Zone)</strong>
          </div>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvanced && (
          <div className="school-accordion-body">
            <div className="advanced-group">
              <h4>Thao tác Thử nghiệm &amp; Phiên Đăng nhập</h4>
              <div className="school-block-actions">
                <button className="settings-btn-secondary" onClick={confirmAndOpenSchoolPortal}>
                  <ExternalLink size={14} />
                  Mở portal trên trình duyệt ngoài
                </button>
                {isUthSelected && (
                  <button className="settings-btn-secondary" onClick={handleOpenUthWebViewExperimental}>
                    <MonitorCheck size={14} />
                    Thử nghiệm WebView UTH
                  </button>
                )}
                <button className="settings-btn-secondary" onClick={handlePrototypeSync}>
                  <WifiOff size={14} />
                  Thử nghiệm Prototype Sync (Mock Data)
                </button>
                {syncStatus && (
                  <button className="settings-btn-secondary" onClick={handleLogoutPortal}>
                    <LogOut size={14} />
                    Đăng xuất phiên Portal (Giữ SQLite Cache)
                  </button>
                )}
              </div>
            </div>

            {/* VÙNG NGUY HIỂM — TÁCH BIỆT NẰM CUỐI CÙNG */}
            <div className="danger-zone-box" style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid color-mix(in srgb, #ef4444 30%, transparent)" }}>
              <h4 style={{ color: "#ef4444", margin: "0 0 8px 0", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={14} />
                Vùng Nguy Hiểm (Danger Zone)
              </h4>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 12px 0" }}>
                Các thao tác bên dưới sẽ xóa dữ liệu local vĩnh viễn khỏi thiết bị của bạn.
              </p>
              <div className="school-block-actions">
                {syncStatus && (
                  <button className="settings-btn-danger" onClick={handleClearConnectorData}>
                    <Trash2 size={14} />
                    Xóa toàn bộ dữ liệu Connector khỏi SQLite
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
