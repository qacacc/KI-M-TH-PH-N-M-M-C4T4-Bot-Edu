import { useMemo, useState } from "react";
import { Calendar, Download, ExternalLink, RotateCcw } from "lucide-react";
import { ExamTable, ScheduleTable } from "../components/DataTables";
import { GpaCalculator } from "../components/GpaCalculator";
import { useAcademicCache } from "../hooks/useAcademicCache";
import { ACADEMIC_CONNECTION_REQUIRED, loadAcademicExams, loadAcademicSchedule } from "../academicData";
import { formatWeekday } from "../utils/format";
import { downloadIcsFile, generateExamIcs, generateScheduleIcs } from "../utils/calendarExporter";
import { readSchoolProfile, getSchoolOption } from "../schoolProfile";
import { openExternalUrl } from "../tauriApi";

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
  const { items, loading, error } = useAcademicCache(loadAcademicSchedule);
  const [query, setQuery] = useState("");
  const [weekdayFilter, setWeekdayFilter] = useState("all");
  const filtered = useMemo(() => items.filter((item) =>
    (weekdayFilter === "all" || item.weekday === Number(weekdayFilter)) &&
    `${item.subjectName} ${item.room} ${item.lecturer}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi"))
  ).sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)), [items, query, weekdayFilter]);
  return <div className="page-card">
    <div className="page-card-header academic-header">
      <div><h2>Lịch học sinh viên</h2><p>{items.length ? "Cache tài khoản UTH; có thể chưa cập nhật. Kiểm tra lần đồng bộ trong Trường & tài khoản." : ACADEMIC_CONNECTION_REQUIRED}</p></div>
      <button className="settings-btn-secondary" disabled={!filtered.length || loading} onClick={() => downloadIcsFile("lich-hoc.ics", generateScheduleIcs(filtered, readSchoolProfile().schoolName))}><Calendar size={14} /><Download size={14} />Xuất lịch (.ics)</button>
    </div>
    <div className="metric-strip"><div><strong>{filtered.length}</strong><span>Buổi học</span></div><div><strong>{new Set(filtered.map((item) => item.room)).size}</strong><span>Phòng học</span></div><div><strong>{new Set(filtered.map((item) => item.subjectId)).size}</strong><span>Môn học</span></div></div>
    <div className="filter-bar">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm môn, phòng hoặc giảng viên..." aria-label="Tìm lịch học" />
      <select value={weekdayFilter} onChange={(event) => setWeekdayFilter(event.target.value)} aria-label="Lọc thứ"><option value="all">Tất cả thứ</option>{[2,3,4,5,6,7,8].map((day) => <option key={day} value={day}>{formatWeekday(day)}</option>)}</select>
      <button onClick={() => { setQuery(""); setWeekdayFilter("all"); }} title="Đặt lại bộ lọc" aria-label="Đặt lại bộ lọc"><RotateCcw size={16} /></button>
    </div>
    {error ? <p role="alert" className="warning-box">{error}</p> : loading ? <p role="status">Đang đọc cache...</p> : filtered.length ? <ScheduleTable scheduleItems={filtered} /> : <p className="empty-state">{items.length ? "Không có lịch học khớp bộ lọc." : ACADEMIC_CONNECTION_REQUIRED}</p>}
  </div>;
}

export function ExamsPage() {
  const { items, loading, error } = useAcademicCache(loadAcademicExams);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState("dateAsc");
  const filtered = useMemo(() => items.filter((item) =>
    `${item.subjectName} ${item.room} ${item.format}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi"))
  ).sort((a, b) => (a.examDate.localeCompare(b.examDate) || a.startTime.localeCompare(b.startTime)) * (sortMode === "dateAsc" ? 1 : -1)), [items, query, sortMode]);
  return <div className="page-card">
    <div className="page-card-header academic-header">
      <div><h2>Lịch thi sinh viên</h2><p>{items.length ? "Cache UTH thử nghiệm; đối chiếu lịch thi trên cổng trường trước khi sử dụng." : ACADEMIC_CONNECTION_REQUIRED}</p></div>
      <button className="settings-btn-secondary" disabled={!filtered.length || loading} onClick={() => downloadIcsFile("lich-thi.ics", generateExamIcs(filtered, readSchoolProfile().schoolName))}><Calendar size={14} /><Download size={14} />Xuất lịch (.ics)</button>
    </div>
    <div className="metric-strip"><div><strong>{filtered.length}</strong><span>Ca thi</span></div><div><strong>{new Set(filtered.map((item) => item.room)).size}</strong><span>Phòng thi</span></div><div><strong>{filtered.reduce((total, item) => total + item.durationMinutes, 0)}</strong><span>Tổng phút thi</span></div></div>
    <div className="filter-bar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm môn, phòng hoặc hình thức..." aria-label="Tìm lịch thi" /><select value={sortMode} onChange={(event) => setSortMode(event.target.value)} aria-label="Sắp xếp lịch thi"><option value="dateAsc">Ngày tăng dần</option><option value="dateDesc">Ngày giảm dần</option></select><button onClick={() => { setQuery(""); setSortMode("dateAsc"); }} title="Đặt lại bộ lọc" aria-label="Đặt lại bộ lọc"><RotateCcw size={16} /></button></div>
    {error ? <p role="alert" className="warning-box">{error}</p> : loading ? <p role="status">Đang đọc cache...</p> : filtered.length ? <ExamTable examItems={filtered} /> : <p className="empty-state">{items.length ? "Không có lịch thi khớp bộ lọc." : ACADEMIC_CONNECTION_REQUIRED}</p>}
  </div>;
}

export function GpaPage() {
  return <div className="page-card"><div className="page-card-header"><div><h2>Ước tính GPA / CPA</h2><p>Điểm do bạn nhập và lưu trên thiết bị. Chưa đồng bộ bảng điểm từ trường; thang quy đổi hiện tại là tham khảo.</p></div></div><GpaCalculator /></div>;
}
