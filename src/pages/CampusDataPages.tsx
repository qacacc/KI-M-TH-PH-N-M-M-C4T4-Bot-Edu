import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock3, Download, ExternalLink, MapPin, RotateCcw, UserRound, Plus, Trash2, RefreshCw, Upload, Save } from "lucide-react";
import { GpaCalculator } from "../components/GpaCalculator";
import { useAcademicCache } from "../hooks/useAcademicCache";
import { ACADEMIC_CONNECTION_REQUIRED, loadAcademicSchedule, loadAcademicScheduleCoverage } from "../academicData";
import { formatWeekday } from "../utils/format";
import { downloadIcsFile, generateScheduleIcs } from "../utils/calendarExporter";
import { readSchoolProfile, getSchoolOption } from "../schoolProfile";
import {
  deleteStudentNote,
  importStudentNotesBackup,
  listConnectorTranscript,
  listenUthTranscriptResult,
  listStudentNotes,
  openExternalUrl,
  openUthLoginWindow,
  saveStudentNote,
  type CanonicalTranscriptSnapshot,
} from "../tauriApi";
import type { StudentNoteRecord } from "../types";

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
  const profile = readSchoolProfile();
  const [coveredWeeks, setCoveredWeeks] = useState<string[]>([]);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState("");
  const [query, setQuery] = useState("");
  const [weekdayFilter, setWeekdayFilter] = useState("all");
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  useEffect(() => { void loadAcademicScheduleCoverage(readSchoolProfile()).then(setCoveredWeeks).catch(() => setCoveredWeeks([])); }, []);
  const filtered = useMemo(() => items.filter((item) =>
    (weekdayFilter === "all" || item.weekday === Number(weekdayFilter)) &&
    `${item.subjectName} ${item.room} ${item.lecturer}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi"))
  ).sort((a, b) => (a.classDate ?? "").localeCompare(b.classDate ?? "") || a.startTime.localeCompare(b.startTime)), [items, query, weekdayFilter]);
  const weekStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const visibleDates = calendarMode === "week"
    ? Array.from({ length: 7 }, (_, index) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index))
    : (() => {
      const first = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
      const start = new Date(first.getFullYear(), first.getMonth(), 1 - ((first.getDay() + 6) % 7));
      return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
    })();
  const changeRange = (direction: number) => setAnchorDate((current) => calendarMode === "week"
    ? new Date(current.getFullYear(), current.getMonth(), current.getDate() + direction * 7)
    : new Date(current.getFullYear(), current.getMonth() + direction, 1));
  const dateLabel = (date: Date) => date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  const rangeLabel = calendarMode === "week"
    ? `${dateLabel(visibleDates[0])} – ${dateLabel(visibleDates[6])}/${visibleDates[6].getFullYear()}`
    : anchorDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  const todayKey = new Date().toDateString();
  const weekdayForDate = (date: Date) => date.getDay() === 0 ? 8 : date.getDay() + 1;
  const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const isWeekCovered = (date: Date) => {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7));
    return coveredWeeks.includes(dateKey(monday));
  };
  const inSelectedMonth = (date: Date) => date.getFullYear() === anchorDate.getFullYear() && date.getMonth() === anchorDate.getMonth();
  const rangeDates = calendarMode === "month" ? visibleDates.filter(inSelectedMonth) : visibleDates;
  const visibleDateKeys = new Set(rangeDates.map(dateKey));
  const rangeOccurrences = filtered.filter((item) => item.classDate && visibleDateKeys.has(item.classDate));
  async function openPortalCalendar() {
    const studentCode = profile.studentCode.trim();
    if (!studentCode) { setPortalError("Nhập và lưu MSSV tại Trường & tài khoản trước khi đồng bộ lịch."); return; }
    setOpeningPortal(true);
    setPortalError("");
    try { await openUthLoginWindow(studentCode, "calendar"); }
    catch (openError) { setPortalError(`Không mở được Portal trong app: ${String(openError)}`); }
    finally { setOpeningPortal(false); }
  }
  return <div className="page-card">
    <div className="page-card-header academic-header">
      <div><h2>Lịch học</h2><p>{items.length ? "Duyệt lịch theo ngày thực mà Portal đã trả về trong từng tuần." : ACADEMIC_CONNECTION_REQUIRED}</p></div>
      <button className="settings-btn-secondary" disabled={!rangeOccurrences.length || loading} onClick={() => downloadIcsFile("lich-hoc.ics", generateScheduleIcs(rangeOccurrences, readSchoolProfile().schoolName))}><Calendar size={14} /><Download size={14} />Xuất lịch (.ics)</button>
    </div>
    <div className="metric-strip"><div><strong>{rangeOccurrences.length}</strong><span>Buổi trong khung xem</span></div><div><strong>{new Set(rangeOccurrences.map((item) => item.room).filter(Boolean)).size}</strong><span>Phòng học</span></div><div><strong>{new Set(rangeOccurrences.map((item) => item.subjectId)).size}</strong><span>Môn học</span></div></div>
    <p className="schedule-data-note">Hiển thị đúng ngày Portal trả về, không lặp lịch sang tuần khác. Cốc Cốc không chia sẻ phiên đăng nhập với ứng dụng; dùng nút dưới đây để mở lịch bên trong clone. Để nạp tuần khác, chuyển tuần trong Portal rồi đợi thông báo đã lưu.{items.some((item) => !item.classDate) ? " Cache lịch cũ chưa có ngày cụ thể — hãy đồng bộ lại từ Portal." : ""}</p>
    {!items.length && <div className="schedule-portal-action"><button type="button" className="settings-btn-primary" onClick={() => void openPortalCalendar()} disabled={openingPortal}>{openingPortal ? "Đang mở Portal…" : "Mở Portal & đồng bộ lịch tuần"}</button>{portalError && <p role="alert" className="warning-box">{portalError}</p>}</div>}
    <div className="filter-bar">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm môn, phòng hoặc giảng viên..." aria-label="Tìm lịch học" />
      <select value={weekdayFilter} onChange={(event) => setWeekdayFilter(event.target.value)} aria-label="Lọc thứ"><option value="all">Tất cả thứ</option>{[2,3,4,5,6,7,8].map((day) => <option key={day} value={day}>{formatWeekday(day)}</option>)}</select>
      <button onClick={() => { setQuery(""); setWeekdayFilter("all"); }} title="Đặt lại bộ lọc" aria-label="Đặt lại bộ lọc"><RotateCcw size={16} /></button>
    </div>
    <div className="calendar-navigator">
      <div className="calendar-mode-switch" role="group" aria-label="Chế độ lịch">
        <button type="button" className={calendarMode === "week" ? "selected" : ""} onClick={() => setCalendarMode("week")}>Tuần</button>
        <button type="button" className={calendarMode === "month" ? "selected" : ""} onClick={() => setCalendarMode("month")}>Tháng</button>
      </div>
      <div className="calendar-range-controls"><button type="button" aria-label="Khoảng trước" onClick={() => changeRange(-1)}><ChevronLeft size={17} /></button><strong>{rangeLabel}</strong><button type="button" aria-label="Khoảng sau" onClick={() => changeRange(1)}><ChevronRight size={17} /></button><button type="button" onClick={() => setAnchorDate(new Date())}>Hôm nay</button></div>
    </div>
    {error ? <p role="alert" className="warning-box">{error}</p> : loading ? <p role="status">Đang đọc lịch đã lưu...</p> : filtered.length ? (
      <div className={`schedule-calendar-grid ${calendarMode}`} aria-label={`Lịch học theo ${calendarMode === "week" ? "tuần" : "tháng"}`}>
        {visibleDates.filter((date) => weekdayFilter === "all" || weekdayForDate(date) === Number(weekdayFilter)).map((date) => {
          const day = weekdayForDate(date);
          const sessions = filtered.filter((item) => item.classDate === dateKey(date));
          const sameMonth = date.getMonth() === anchorDate.getMonth();
          return <section className={`schedule-day${date.toDateString() === todayKey ? " is-today" : ""}${!sameMonth && calendarMode === "month" ? " is-outside-month" : ""}`} key={date.toISOString()} aria-label={`${formatWeekday(day)} ${dateLabel(date)}, ${sessions.length} buổi`}>
            <header className="schedule-day-heading"><div><strong>{formatWeekday(day)}</strong><span className="schedule-date-label">{dateLabel(date)}</span></div><span>{sessions.length} buổi</span></header>
            {sessions.length ? sessions.map((item) => (
              <article className="schedule-session-card" key={item.id}>
                <strong className="schedule-session-subject">{item.subjectName}</strong>
                <span className="schedule-session-meta"><Clock3 size={14} />{item.startTime}–{item.endTime}</span>
                {item.room && <span className="schedule-session-meta"><MapPin size={14} />{item.room}</span>}
                {item.lecturer && <span className="schedule-session-meta"><UserRound size={14} />{item.lecturer}</span>}
              </article>
            )) : <p className="schedule-day-empty">{isWeekCovered(date) ? "Portal xác nhận không có buổi" : "Tuần chưa đồng bộ"}</p>}
          </section>;
        })}
      </div>
    ) : <p className="empty-state">{items.length ? "Không có lịch học khớp bộ lọc trong khoảng này." : ACADEMIC_CONNECTION_REQUIRED}</p>}
  </div>;
}

export function NotesPage() {
  const [notes, setNotes] = useState<StudentNoteRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftSubjectId, setDraftSubjectId] = useState("");
  const [draftSubjectName, setDraftSubjectName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadNotesFromDb = async (selectId?: string | null) => {
    setLoading(true);
    try {
      const list = await listStudentNotes();
      setNotes(list);
      setErrorMsg("");
      const nextId = selectId !== undefined ? selectId : (activeId ?? list[0]?.id ?? null);
      setActiveId(nextId);
      const selected = list.find((n) => n.id === nextId);
      if (selected) {
        setDraftTitle(selected.title);
        setDraftContent(selected.content);
        setDraftSubjectId(selected.subjectId ?? "");
        setDraftSubjectName(selected.subjectName ?? "");
      }
    } catch (err) {
      setErrorMsg(`Không tải được sổ ghi chú từ SQLite local: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotesFromDb();
  }, []);

  const subjectOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const note of notes) {
      if (note.subjectId) {
        map.set(note.subjectId, note.subjectName || note.subjectId);
      }
    }
    return Array.from(map.entries());
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("vi");
    return notes.filter((note) => {
      if (subjectFilter !== "all" && (note.subjectId ?? "") !== subjectFilter) {
        return false;
      }
      if (q) {
        const haystack = `${note.title} ${note.content} ${note.subjectName ?? ""} ${note.subjectId ?? ""}`.toLocaleLowerCase("vi");
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [notes, searchQuery, subjectFilter]);

  const selectNote = (note: StudentNoteRecord) => {
    setActiveId(note.id);
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setDraftSubjectId(note.subjectId ?? "");
    setDraftSubjectName(note.subjectName ?? "");
    setNotice("");
    setErrorMsg("");
  };

  const handleCreateNote = async () => {
    setNotice("");
    setErrorMsg("");
    try {
      const created = await saveStudentNote({
        title: "Ghi chú mới",
        content: "",
        subjectId: null,
        subjectName: null,
      });
      await loadNotesFromDb(created.id);
      setNotice("Đã tạo ghi chú mới trong SQLite local.");
    } catch (err) {
      setErrorMsg(`Không tạo được ghi chú: ${String(err)}`);
    }
  };

  const handleSaveCurrentNote = async () => {
    if (!activeId) return;
    setNotice("");
    setErrorMsg("");
    try {
      const saved = await saveStudentNote({
        id: activeId,
        title: draftTitle,
        content: draftContent,
        subjectId: draftSubjectId.trim() || null,
        subjectName: draftSubjectName.trim() || null,
      });
      setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
      setDraftTitle(saved.title);
      setNotice("Đã lưu ghi chú vào SQLite local.");
    } catch (err) {
      setErrorMsg(String(err));
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm("Xóa ghi chú này khỏi cơ sở dữ liệu SQLite trên thiết bị?")) return;
    setNotice("");
    setErrorMsg("");
    try {
      await deleteStudentNote(id);
      const remaining = notes.filter((n) => n.id !== id);
      setNotes(remaining);
      const nextActive = remaining[0] ?? null;
      if (nextActive) {
        selectNote(nextActive);
      } else {
        setActiveId(null);
      }
      setNotice("Đã xóa ghi chú khỏi SQLite local.");
    } catch (err) {
      setErrorMsg(`Không xóa được ghi chú: ${String(err)}`);
    }
  };

  const handleExportNotesBackup = () => {
    const bundle = {
      format: "campus-assistant-notes-backup",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      notes,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `campus-assistant-notes-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotice(`Đã xuất ${notes.length} ghi chú ra tệp sao lưu JSON.`);
  };

  const handleImportNotesBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setNotice("");
    setErrorMsg("");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { format?: string; notes?: StudentNoteRecord[] };
      if (parsed?.format !== "campus-assistant-notes-backup" || !Array.isArray(parsed.notes)) {
        setErrorMsg("Tệp sao lưu ghi chú không đúng định dạng campus-assistant-notes-backup.");
        return;
      }
      const count = await importStudentNotesBackup(parsed.notes);
      await loadNotesFromDb();
      setNotice(`Đã khôi phục thành công ${count} ghi chú vào SQLite local.`);
    } catch (err) {
      setErrorMsg(`Khôi phục ghi chú thất bại: ${String(err)}`);
    }
  };

  const activeNote = notes.find((note) => note.id === activeId);

  return <div className="page-card">
    <div className="page-card-header academic-header">
      <div><h2>Sổ ghi chú học tập</h2><p>Ghi lịch ôn tập, việc cần làm hoặc lưu ý theo môn. Lưu bền vững trong SQLite local (không dùng localStorage).</p></div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button className="settings-btn-secondary" type="button" onClick={handleExportNotesBackup} disabled={!notes.length}><Download size={15} />Sao lưu ghi chú</button>
        <label className="settings-btn-secondary" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Upload size={15} />Khôi phục
          <input type="file" accept=".json" onChange={(e) => void handleImportNotesBackup(e)} style={{ display: "none" }} />
        </label>
        <button className="settings-btn-primary" type="button" onClick={() => void handleCreateNote()}><Plus size={15} />Tạo ghi chú</button>
      </div>
    </div>
    <div className="filter-bar">
      <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm tiêu đề, nội dung hoặc môn học..." aria-label="Tìm kiếm ghi chú" />
      <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} aria-label="Lọc ghi chú theo môn">
        <option value="all">Tất cả môn học</option>
        {subjectOptions.map(([id, name]) => <option key={id} value={id}>{id} — {name}</option>)}
      </select>
      <button type="button" onClick={() => { setSearchQuery(""); setSubjectFilter("all"); }} title="Đặt lại bộ lọc" aria-label="Đặt lại bộ lọc ghi chú"><RotateCcw size={16} /></button>
    </div>
    {errorMsg && <p role="alert" className="warning-box">{errorMsg}</p>}
    {notice && <p role="status" className="note-save-status">{notice}</p>}
    <div className="study-notes-layout">
      <aside className="study-notes-list" aria-label="Danh sách ghi chú">
        {loading ? <p role="status">Đang tải ghi chú từ SQLite…</p> : !filteredNotes.length ? <p className="empty-state">{notes.length ? "Không có ghi chú khớp bộ lọc." : "Chưa có ghi chú. Nhấn “Tạo ghi chú” để bắt đầu."}</p> : null}
        {filteredNotes.map((note) => <button type="button" className={`study-note-item${note.id === activeId ? " selected" : ""}`} key={note.id} onClick={() => selectNote(note)}><strong>{note.title || "Chưa đặt tiêu đề"}</strong><span>{note.subjectName ? `${note.subjectId ? `${note.subjectId} · ` : ""}${note.subjectName}` : (note.updatedAt ? note.updatedAt.slice(0, 10) : "Ghi chú chung")}</span><small>{note.content.trim().slice(0, 90) || "Chưa có nội dung"}</small></button>)}
      </aside>
      {activeNote ? <section className="study-note-editor" aria-label="Chỉnh sửa ghi chú">
        <div className="study-note-editor-actions">
          <span>Cập nhật: {new Date(activeNote.updatedAt).toLocaleString("vi-VN")}</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="settings-btn-primary" onClick={() => void handleSaveCurrentNote()} aria-label="Lưu ghi chú"><Save size={15} />Lưu ghi chú</button>
            <button type="button" className="settings-btn-secondary" onClick={() => void handleDeleteNote(activeNote.id)} aria-label="Xóa ghi chú"><Trash2 size={15} />Xóa</button>
          </div>
        </div>
        <input aria-label="Tiêu đề ghi chú" maxLength={100} value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="Tiêu đề ghi chú (1 - 100 ký tự)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
          <input aria-label="Mã môn học" value={draftSubjectId} onChange={(event) => setDraftSubjectId(event.target.value)} placeholder="Mã môn tùy chọn (VD: ST101)" />
          <input aria-label="Tên môn học" value={draftSubjectName} onChange={(event) => setDraftSubjectName(event.target.value)} placeholder="Tên môn học tùy chọn (VD: Kiểm thử phần mềm)" />
        </div>
        <textarea aria-label="Nội dung ghi chú" value={draftContent} onChange={(event) => setDraftContent(event.target.value)} placeholder="Viết ghi chú, kế hoạch ôn tập hoặc việc cần làm (tối đa 10.000 ký tự)..." rows={12} />
      </section> : <p className="empty-state study-note-placeholder">Chọn ghi chú để xem hoặc chỉnh sửa.</p>}
    </div>
  </div>;
}

export function GpaPage() {
  return <div className="page-card"><div className="page-card-header"><div><h2>GPA / CPA theo bảng điểm Portal</h2><p>Nguồn dữ liệu chính là trang Bảng điểm học tập của Portal UTH. Điểm nhập tay chỉ là công cụ ước tính riêng.</p></div></div><PortalTranscriptPanel /><GpaCalculator /></div>;
}

function PortalTranscriptPanel() {
  const profile = readSchoolProfile();
  const [snapshot, setSnapshot] = useState<CanonicalTranscriptSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingPortal, setOpeningPortal] = useState(false);
  const refresh = () => {
    setLoading(true);
    void listConnectorTranscript(profile.studentCode.trim())
      .then((result) => { setSnapshot(result); setError(""); })
      .catch(() => { setSnapshot(null); setError("Không đọc được cache bảng điểm local. Mở bản desktop và thử đồng bộ lại Portal."); })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    refresh();
    let unlisten: (() => void) | undefined;
    void listenUthTranscriptResult(refresh).then((stop) => { unlisten = stop; }).catch(() => undefined);
    return () => unlisten?.();
  }, []);
  const subjects = snapshot?.subjects ?? [];
  const validCredits = subjects.filter((subject) => subject.score4 !== null);
  const creditSum = validCredits.reduce((sum, subject) => sum + subject.credits, 0);
  const gpa4 = creditSum ? validCredits.reduce((sum, subject) => sum + (subject.score4 ?? 0) * subject.credits, 0) / creditSum : null;
  const score10Subjects = subjects.filter((subject) => subject.scoreTotal !== null);
  const score10Credits = score10Subjects.reduce((sum, subject) => sum + subject.credits, 0);
  const gpa10 = score10Credits ? score10Subjects.reduce((sum, subject) => sum + (subject.scoreTotal ?? 0) * subject.credits, 0) / score10Credits : null;
  const shownGpa4 = snapshot?.summary?.cumulativeGpa4 ?? gpa4;
  const shownGpa10 = snapshot?.summary?.cumulativeGpa10 ?? gpa10;
  const shownCredits = snapshot?.summary?.cumulativeCredits ?? creditSum;
  const hasOfficialGpa4 = snapshot?.summary?.cumulativeGpa4 !== null && snapshot?.summary?.cumulativeGpa4 !== undefined;
  const hasOfficialGpa10 = snapshot?.summary?.cumulativeGpa10 !== null && snapshot?.summary?.cumulativeGpa10 !== undefined;
  const semesters = Array.from(new Set(subjects.map((subject) => subject.semester)));
  async function openPortalTranscript() {
    const studentCode = profile.studentCode.trim();
    if (!studentCode) {
      setError("Hãy nhập và lưu MSSV trong mục Trường & tài khoản trước khi mở Portal để đồng bộ bảng điểm.");
      return;
    }
    setOpeningPortal(true);
    setError("");
    try {
      await openUthLoginWindow(studentCode, "transcript");
    } catch (openError) {
      setError(`Không mở được cửa sổ Portal trong app: ${String(openError)}`);
    } finally {
      setOpeningPortal(false);
    }
  }
  return <section className="portal-transcript-panel" aria-label="Bảng điểm từ Portal">
    <div className="page-card-header compact"><div><h3>Bảng điểm đã đồng bộ từ Portal</h3><p>{snapshot ? `Cập nhật ${new Date(snapshot.fetchedAt).toLocaleString("vi-VN")} · ${subjects.length} học phần` : "Nguồn: Bảng điểm học tập tại Portal UTH. Cần mở Portal bên trong app để chuyển dữ liệu vào cache local."}</p></div><div className="transcript-actions"><button type="button" className="settings-btn-secondary" onClick={() => void openPortalTranscript()} disabled={openingPortal}>{openingPortal ? "Đang mở Portal…" : "Mở Portal & đồng bộ bảng điểm"}</button><button type="button" className="settings-btn-secondary" onClick={refresh} disabled={loading}><RefreshCw size={14} />Làm mới cache</button></div></div>
    {error && <p role="alert" className="warning-box">{error}</p>}
    {loading ? <p role="status">Đang đọc bảng điểm local…</p> : !snapshot ? <p className="empty-state">Chưa có bảng điểm Portal trong cache. Ảnh Portal đang mở bằng Cốc Cốc không chia sẻ phiên với ứng dụng. Nhấn <strong>Mở Portal &amp; đồng bộ bảng điểm</strong>, đăng nhập trong cửa sổ vừa mở, chờ bảng điểm tải xong và thấy thông báo “Đã lưu … dòng”.</p> : <>
      <div className="metric-strip"><div><strong>{shownCredits}</strong><span>Tín chỉ tích lũy theo Portal</span></div><div><strong>{shownGpa4 === null ? "—" : shownGpa4.toFixed(2)}</strong><span>CPA hệ 4 {hasOfficialGpa4 ? "(Portal)" : "(ước tính từ bảng)"}</span></div><div><strong>{shownGpa10 === null ? "—" : shownGpa10.toFixed(2)}</strong><span>CPA hệ 10 {hasOfficialGpa10 ? "(Portal)" : "(ước tính từ bảng)"}</span></div></div>
      {snapshot.summary?.semesterGpa4 !== null && snapshot.summary?.semesterGpa4 !== undefined && <p className="transcript-summary-note">GPA học kỳ gần nhất trên Portal: hệ 4 {snapshot.summary.semesterGpa4.toFixed(2)}{snapshot.summary.semesterGpa10 !== null ? ` · hệ 10 ${snapshot.summary.semesterGpa10?.toFixed(2)}` : ""}. {snapshot.summary.semesterEarnedCredits !== null && `Tín chỉ học đạt trong kỳ: ${snapshot.summary.semesterEarnedCredits}. `}{snapshot.summary.registeredCredits !== null && `Tín chỉ đã đăng ký: ${snapshot.summary.registeredCredits}.`}</p>}
      <div className="transcript-semesters">{semesters.map((semester) => <details key={semester} open><summary>{semester}<span>{subjects.filter((subject) => subject.semester === semester).length} học phần</span></summary><div className="gpa-table-scroll"><table><thead><tr><th>Mã lớp</th><th>Môn học</th><th>Tín chỉ</th><th>Tổng kết</th><th>Hệ 4</th><th>Điểm chữ</th><th>Kết quả</th></tr></thead><tbody>{subjects.filter((subject) => subject.semester === semester).map((subject) => <tr key={`${subject.semester}-${subject.subjectCode}-${subject.subjectName}`}><td>{subject.subjectCode}</td><td>{subject.subjectName}</td><td>{subject.credits}</td><td>{subject.scoreTotal?.toFixed(2) ?? "—"}</td><td>{subject.score4?.toFixed(2) ?? "—"}</td><td>{subject.letterGrade || "—"}</td><td>{subject.classification || (subject.passed ? "Đạt" : "—")}</td></tr>)}</tbody></table></div></details>)}</div>
    </>}
  </section>;
}
