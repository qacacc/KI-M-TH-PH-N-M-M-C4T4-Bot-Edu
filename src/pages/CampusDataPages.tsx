import { useMemo, useState } from "react";
import { Calendar, Download, ExternalLink, RotateCcw, AlertCircle, RefreshCw, GraduationCap, Clock, WifiOff, FileX } from "lucide-react";
import { ExamTable, ScheduleTable } from "../components/DataTables";
import { GpaCalculator } from "../components/GpaCalculator";
import { useAcademicCache } from "../hooks/useAcademicCache";
import { loadAcademicExams, loadAcademicSchedule } from "../academicData";
import { formatWeekday } from "../utils/format";
import { downloadIcsFile, generateExamIcs, generateScheduleIcs } from "../utils/calendarExporter";
import { readSchoolProfile, getSchoolOption } from "../schoolProfile";
import { openExternalUrl } from "../tauriApi";
import type { AcademicQueryResult } from "../types";

// CA-089.02: UNIFIED STATE COMPONENT
interface UnifiedDataStateProps<T> {
  result: AcademicQueryResult<T>;
  onRetry: () => void;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
}

function UnifiedDataStateView<T>({
  result,
  onRetry,
  emptyIcon = <FileX size={48} />,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Không tìm thấy dữ liệu nào phù hợp hoặc danh sách trống.",
  children
}: UnifiedDataStateProps<T>) {
  
  // 1. Trạng thái Chưa kết nối
  if (result.status === 'NOT_CONNECTED') {
    return (
      <div className="empty-state-box" style={{ padding: "40px", textAlign: "center" }}>
        <GraduationCap size={48} style={{ color: "var(--muted)", margin: "0 auto 16px" }} />
        <h3 style={{ margin: "0 0 8px 0" }}>Chưa kết nối Cổng trường</h3>
        <p style={{ color: "var(--muted)", fontSize: "14px", margin: "0 0 16px 0", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
          Vui lòng vào mục "Trường & tài khoản" để liên kết hồ sơ sinh viên hoặc kết nối cổng thông tin của trường.
        </p>
      </div>
    );
  }

  // 2. Trạng thái Lỗi toàn phần (Không có cache cũ)
  if (result.status === 'ERROR' && !result.data) {
    return (
      <div className="error-state-box" style={{ padding: "40px", textAlign: "center", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)", borderRadius: "8px", background: "color-mix(in srgb, var(--accent) 5%, transparent)" }}>
        <AlertCircle size={48} style={{ color: "var(--accent)", margin: "0 auto 16px" }} />
        <h3 style={{ margin: "0 0 8px 0", color: "var(--accent)" }}>Lỗi tải dữ liệu</h3>
        <p style={{ color: "var(--text)", fontSize: "14px", margin: "0 0 20px 0" }}>
          {result.error || "Đã xảy ra lỗi không xác định khi tải dữ liệu."}
        </p>
        <button className="settings-btn-primary" onClick={onRetry} style={{ margin: "0 auto", display: "inline-flex", gap: "8px", alignItems: "center" }}>
          <RefreshCw size={14} /> Thử lại ngay
        </button>
      </div>
    );
  }

  // 3. Trạng thái Đang tải toàn phần (Chưa có dữ liệu cũ)
  if (result.status === 'LOADING' && !result.data) {
    return (
      <div className="loading-state-box" style={{ padding: "40px", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
        <p style={{ color: "var(--muted)", margin: 0 }}>Đang tải dữ liệu từ hệ thống...</p>
      </div>
    );
  }

  // 4. Trạng thái Trống (Có kết nối nhưng danh sách = 0)
  if (result.status === 'EMPTY' || (result.data && Array.isArray(result.data) && result.data.length === 0)) {
    return (
      <div className="empty-state-box" style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ color: "var(--muted)", margin: "0 auto 16px", display: "flex", justifyContent: "center" }}>
          {emptyIcon}
        </div>
        <h3 style={{ margin: "0 0 8px 0" }}>{emptyTitle}</h3>
        <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>{emptyDescription}</p>
        
        {/* Nút Retry nếu mạng bị gián đoạn nhưng server có thể đã có data */}
        <button className="settings-btn-secondary" onClick={onRetry} style={{ margin: "20px auto 0", display: "inline-flex", gap: "8px", alignItems: "center" }}>
          <RefreshCw size={14} /> Làm mới dữ liệu
        </button>
      </div>
    );
  }

  // 5. Trạng thái Có dữ liệu (SUCCESS hoặc STALE ERROR / STALE LOADING)
  return (
    <>
      {/* Cờ thông báo ngoại tuyến (Stale-while-revalidate) */}
      {result.isStale && (
        <div className="stale-banner" style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fef3c7", color: "#92400e", padding: "10px 16px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>
          <WifiOff size={16} />
          <div style={{ flex: 1 }}>
            <strong>Dữ liệu ngoại tuyến (Lỗi làm mới)</strong>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>
              Đây là dữ liệu cũ nhất lưu từ lần tải trước ({result.provenance?.fetchedAt ? new Date(result.provenance.fetchedAt).toLocaleString('vi-VN') : 'Không rõ thời gian'}).<br/>
              Lý do lỗi hiện tại: {result.error}
            </div>
          </div>
          <button onClick={onRetry} style={{ background: "transparent", border: "1px solid #92400e", color: "#92400e", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <RefreshCw size={12} /> Thử lại
          </button>
        </div>
      )}

      {/* Cờ thông báo đang cập nhật nền (Background revalidate) */}
      {result.status === 'LOADING' && !result.isStale && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)", marginBottom: "12px" }}>
          <div className="spinner-small" /> Đang cập nhật dữ liệu mới nhất...
        </div>
      )}

      {children}
    </>
  );
}

// PAGES

export function AnnouncementsPage() {
  const [error, setError] = useState("");
  const school = getSchoolOption(readSchoolProfile());
  async function openNews() {
    try {
      if (school.publicNewsUrl) await openExternalUrl(school.publicNewsUrl);
    } catch {
      setError("Không mở được website trường. Vui lòng thử lại.");
    }
  }
  return <div className="page-card">
    <div className="page-card-header"><div><h2>Thông báo trường</h2><p>Chưa có nguồn thông báo trường được đồng bộ vào ứng dụng.</p></div></div>
    <p className="empty-state">Bạn có thể xem thông báo trên website chính thức của trường đang chọn.</p>
    <button className="settings-btn-secondary" onClick={() => void openNews()} disabled={!school.publicNewsUrl}><ExternalLink size={16} />Website {school.shortName}</button>
    {error && <p role="alert" className="warning-box">{error}</p>}
  </div>;
}

export function SchedulePage() {
  // CA-089.02: Sử dụng cache result và refetch
  const { result, refetch } = useAcademicCache(loadAcademicSchedule);
  const items = result.data || [];
  
  const [query, setQuery] = useState("");
  const [weekdayFilter, setWeekdayFilter] = useState("all");
  
  const filtered = useMemo(() => items.filter((item) =>
    (weekdayFilter === "all" || item.weekday === Number(weekdayFilter)) &&
    `${item.subjectName} ${item.room} ${item.lecturer}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi"))
  ).sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)), [items, query, weekdayFilter]);
  
  return <div className="page-card">
    <div className="page-card-header academic-header">
      <div><h2>Lịch học sinh viên</h2></div>
      <button className="settings-btn-secondary" disabled={!filtered.length} onClick={() => downloadIcsFile("lich-hoc.ics", generateScheduleIcs(filtered, readSchoolProfile().schoolName))}><Calendar size={14} /><Download size={14} />Xuất lịch (.ics)</button>
    </div>

    <UnifiedDataStateView 
      result={result} 
      onRetry={refetch}
      emptyIcon={<Calendar size={48} />}
      emptyTitle="Chưa có lịch học"
      emptyDescription="Không tìm thấy lịch học nào trong học kỳ hiện tại."
    >
      <div className="metric-strip"><div><strong>{filtered.length}</strong><span>Buổi học</span></div><div><strong>{new Set(filtered.map((item) => item.room)).size}</strong><span>Phòng học</span></div><div><strong>{new Set(filtered.map((item) => item.subjectId)).size}</strong><span>Môn học</span></div></div>
      
      <div className="filter-bar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm môn, phòng hoặc giảng viên..." aria-label="Tìm lịch học" />
        <select value={weekdayFilter} onChange={(event) => setWeekdayFilter(event.target.value)} aria-label="Lọc thứ"><option value="all">Tất cả thứ</option>{[2,3,4,5,6,7,8].map((day) => <option key={day} value={day}>{formatWeekday(day)}</option>)}</select>
        <button onClick={() => { setQuery(""); setWeekdayFilter("all"); }} title="Đặt lại bộ lọc" aria-label="Đặt lại bộ lọc"><RotateCcw size={16} /></button>
      </div>

      {filtered.length ? (
        <ScheduleTable scheduleItems={filtered} />
      ) : (
        <p className="empty-state">Không có lịch học khớp với bộ lọc.</p>
      )}
    </UnifiedDataStateView>
  </div>;
}

export function ExamsPage() {
  // CA-089.02: Sử dụng cache result và refetch
  const { result, refetch } = useAcademicCache(loadAcademicExams);
  const items = result.data || [];
  
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState("dateAsc");
  
  const filtered = useMemo(() => items.filter((item) =>
    `${item.subjectName} ${item.room} ${item.format}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi"))
  ).sort((a, b) => (a.examDate.localeCompare(b.examDate) || a.startTime.localeCompare(b.startTime)) * (sortMode === "dateAsc" ? 1 : -1)), [items, query, sortMode]);
  
  return <div className="page-card">
    <div className="page-card-header academic-header">
      <div><h2>Lịch thi sinh viên</h2></div>
      <button className="settings-btn-secondary" disabled={!filtered.length} onClick={() => downloadIcsFile("lich-thi.ics", generateExamIcs(filtered, readSchoolProfile().schoolName))}><Calendar size={14} /><Download size={14} />Xuất lịch (.ics)</button>
    </div>

    <UnifiedDataStateView 
      result={result} 
      onRetry={refetch}
      emptyIcon={<Clock size={48} />}
      emptyTitle="Chưa có lịch thi"
      emptyDescription="Không tìm thấy môn thi nào trong thời gian tới."
    >
      <div className="metric-strip"><div><strong>{filtered.length}</strong><span>Ca thi</span></div><div><strong>{new Set(filtered.map((item) => item.room)).size}</strong><span>Phòng thi</span></div><div><strong>{filtered.reduce((total, item) => total + item.durationMinutes, 0)}</strong><span>Tổng phút thi</span></div></div>
      
      <div className="filter-bar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm môn, phòng hoặc hình thức..." aria-label="Tìm lịch thi" /><select value={sortMode} onChange={(event) => setSortMode(event.target.value)} aria-label="Sắp xếp lịch thi"><option value="dateAsc">Ngày tăng dần</option><option value="dateDesc">Ngày giảm dần</option></select><button onClick={() => { setQuery(""); setSortMode("dateAsc"); }} title="Đặt lại bộ lọc" aria-label="Đặt lại bộ lọc"><RotateCcw size={16} /></button></div>
      
      {filtered.length ? (
        <ExamTable examItems={filtered} />
      ) : (
        <p className="empty-state">Không có lịch thi khớp với bộ lọc.</p>
      )}
    </UnifiedDataStateView>
  </div>;
}

export function GpaPage() {
  return <div className="page-card"><div className="page-card-header"><div><h2>Ước tính GPA / CPA</h2><p>Điểm do bạn nhập và lưu trên thiết bị. Chưa đồng bộ bảng điểm từ trường; thang quy đổi hiện tại là tham khảo.</p></div></div><GpaCalculator /></div>;
}