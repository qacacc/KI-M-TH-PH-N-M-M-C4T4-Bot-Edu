import { useEffect, useMemo, useState } from "react";
import { Calendar, Download, Calculator } from "lucide-react";
import { AnnouncementTable, ExamTable, ScheduleTable } from "../components/DataTables";
import { GpaCalculator } from "../components/GpaCalculator";
import type { AnnouncementRecord, ExamRecord, ScheduleRecord } from "../types";
import { formatWeekday } from "../utils/format";
import { downloadIcsFile, generateExamIcs, generateScheduleIcs } from "../utils/calendarExporter";
import { listAnnouncements, listSchedule, listExams, listConnectorSchedules, listConnectorExams, type CanonicalScheduleEntry, type CanonicalExamEntry } from "../tauriApi";
import { readSchoolProfile } from "../schoolProfile";

const MOCK_DEFAULT_ANNOUNCEMENTS: AnnouncementRecord[] = [
  {
    id: "ann-01",
    title: "Thông báo Đăng ký Học phần Học kỳ II năm học 2025 - 2026",
    category: "Đào tạo",
    priority: "important",
    publishedAt: "2026-07-20",
    source: "Phòng Đào tạo UTH",
    summary: "Sinh viên các khóa K23, K24, K25 thực hiện đăng ký môn học trực tuyến trên Portal sinh viên.",
  },
  {
    id: "ann-02",
    title: "Thông báo về việc nhận thẻ Sinh viên tích hợp thẻ Thư viện",
    category: "Công tác SV",
    priority: "normal",
    publishedAt: "2026-07-15",
    source: "Trung tâm Dịch vụ Sinh viên",
    summary: "Tân sinh viên và sinh viên chưa đổi thẻ nhận thẻ trực tiếp tại Cơ sở 1 từ ngày 25/07/2026.",
  },
  {
    id: "ann-03",
    title: "Lịch thi và Sơ đồ Phòng thi Học kỳ Hè 2025 - 2026",
    category: "Khảo thí",
    priority: "urgent",
    publishedAt: "2026-07-22",
    source: "Phòng Khảo thí & ĐBCL",
    summary: "Sinh viên xuất trình thẻ sinh viên hoặc CCCD khi vào phòng thi. Xem chi tiết danh sách phòng thi cá nhân.",
  },
];

const MOCK_DEFAULT_SCHEDULE: ScheduleRecord[] = [
  {
    id: "sch-01",
    subjectId: "data-mining",
    subjectName: "Khai thác dữ liệu (Data Mining)",
    semester: 1,
    weekday: 2,
    startTime: "07:00",
    endTime: "09:30",
    room: "A2-401 (Cơ sở 1)",
    lecturer: "PGS.TS. Nguyễn Văn A",
    note: "Thực hành thu thập và làm sạch dữ liệu.",
  },
  {
    id: "sch-02",
    subjectId: "ai-intro",
    subjectName: "Trí tuệ nhân tạo (Artificial Intelligence)",
    semester: 1,
    weekday: 4,
    startTime: "13:00",
    endTime: "15:30",
    room: "Lab C1-203",
    lecturer: "TS. Trần Thị B",
    note: "Mô hình mạng Nơ-ron và Học máy nâng cao.",
  },
  {
    id: "sch-03",
    subjectId: "database-systems",
    subjectName: "Cơ sở dữ liệu nâng cao",
    semester: 1,
    weekday: 3,
    startTime: "09:45",
    endTime: "12:00",
    room: "B1-205",
    lecturer: "ThS. Lê Văn C",
    note: "Tối ưu hóa truy vấn và chỉ mục Index.",
  },
];

const MOCK_DEFAULT_EXAMS: ExamRecord[] = [
  {
    id: "ex-01",
    subjectId: "data-mining",
    subjectName: "Khai thác dữ liệu (Data Mining)",
    semester: 1,
    examDate: "2026-08-05",
    startTime: "08:00",
    durationMinutes: 90,
    room: "Hội trường H1",
    format: "Trắc nghiệm + Tự luận",
    note: "Không sử dụng tài liệu.",
  },
  {
    id: "ex-02",
    subjectId: "ai-intro",
    subjectName: "Trí tuệ nhân tạo (Artificial Intelligence)",
    semester: 1,
    examDate: "2026-08-10",
    startTime: "13:30",
    durationMinutes: 90,
    room: "Phòng máy B2-102",
    format: "Thực hành máy tính",
    note: "Nộp bài trực tiếp qua hệ thống Portal.",
  },
];

export function AnnouncementsPage({ announcements: propAnnouncements }: { announcements: AnnouncementRecord[] }) {
  const [items, setItems] = useState<AnnouncementRecord[]>(propAnnouncements || []);
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | AnnouncementRecord["priority"]>("all");

  useEffect(() => {
    if (propAnnouncements && propAnnouncements.length > 0) {
      setItems(propAnnouncements);
    } else {
      void listAnnouncements()
        .then((res) => setItems(res.length > 0 ? res : MOCK_DEFAULT_ANNOUNCEMENTS))
        .catch(() => setItems(MOCK_DEFAULT_ANNOUNCEMENTS));
    }
  }, [propAnnouncements]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items
      .filter((item) => {
        const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
        const matchesQuery =
          !normalizedQuery ||
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.category.toLowerCase().includes(normalizedQuery) ||
          item.summary.toLowerCase().includes(normalizedQuery);
        return matchesPriority && matchesQuery;
      })
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  }, [items, priorityFilter, query]);

  let urgentCount = 0, importantCount = 0;
  for (const item of items) {
    if (item.priority === "urgent") urgentCount++;
    else if (item.priority === "important") importantCount++;
  }

  return (
    <div className="page-card">
      <div className="page-card-header">
        <div>
          <h2>Thông báo Cổng Trường & Đào tạo</h2>
          <p>Dữ liệu thông báo đồng bộ từ Cổng Portal Sinh viên Local Vault.</p>
        </div>
      </div>
      <div className="metric-strip">
        <div><strong>{filtered.length}</strong><span>Đang hiển thị</span></div>
        <div><strong>{importantCount}</strong><span>Quan trọng</span></div>
        <div><strong>{urgentCount}</strong><span>Khẩn cấp</span></div>
      </div>
      <div className="filter-bar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm thông báo..." />
        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}>
          <option value="all">Tất cả mức</option>
          <option value="normal">Normal</option>
          <option value="important">Important</option>
          <option value="urgent">Urgent</option>
        </select>
        <button onClick={() => { setQuery(""); setPriorityFilter("all"); }}>Reset</button>
      </div>
      {filtered.length === 0 ? <p className="empty-state">Không có thông báo nào khớp bộ lọc.</p> : <AnnouncementTable announcements={filtered} />}
    </div>
  );
}

export function SchedulePage({ scheduleItems: propSchedule }: { scheduleItems: ScheduleRecord[] }) {
  const [items, setItems] = useState<ScheduleRecord[]>(propSchedule || []);
  const [query, setQuery] = useState("");
  const [weekdayFilter, setWeekdayFilter] = useState("all");
  const [dataSource, setDataSource] = useState<"connector" | "db" | "mock">("mock");

  useEffect(() => {
    const { studentCode } = readSchoolProfile();
    // Chạy song song — ưu tiên SQLite connector cache trước propSchedule/sample JSON
    void Promise.allSettled([
      studentCode ? listConnectorSchedules(studentCode) : Promise.resolve([] as CanonicalScheduleEntry[]),
      listSchedule(),
    ]).then(([connRes, dbRes]) => {
      const connItems = connRes.status === "fulfilled" ? connRes.value : [];
      if (connItems.length > 0) {
        setItems(connItems.map((e) => ({
          id: e.id, subjectId: e.subjectCode, subjectName: e.subjectName,
          semester: 1, weekday: e.weekday, startTime: e.startTime, endTime: e.endTime,
          room: e.room ?? "Chưa xác định", lecturer: e.lecturer ?? "Giảng viên",
          note: `Nguồn: ${e.source}`,
        })));
        setDataSource("connector");
        return;
      }
      if (propSchedule && propSchedule.length > 0) {
        setItems(propSchedule);
        setDataSource("db");
        return;
      }
      const dbItems = dbRes.status === "fulfilled" ? dbRes.value : [];
      setItems(dbItems.length > 0 ? dbItems : MOCK_DEFAULT_SCHEDULE);
      setDataSource(dbItems.length > 0 ? "db" : "mock");
    });
  }, [propSchedule]);


  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items
      .filter((item) => {
        const matchesWeekday = weekdayFilter === "all" || item.weekday === Number(weekdayFilter);
        const matchesQuery =
          !normalizedQuery ||
          item.subjectName.toLowerCase().includes(normalizedQuery) ||
          item.room.toLowerCase().includes(normalizedQuery) ||
          item.lecturer.toLowerCase().includes(normalizedQuery);
        return matchesWeekday && matchesQuery;
      })
      .sort((left, right) => left.weekday - right.weekday || left.startTime.localeCompare(right.startTime));
  }, [items, query, weekdayFilter]);

  const roomCount = new Set(items.map((item) => item.room)).size;

  function handleExportScheduleIcs() {
    const profile = readSchoolProfile();
    const icsContent = generateScheduleIcs(filtered, profile.schoolName);
    downloadIcsFile(`lich-hoc-${profile.schoolId || "local"}.ics`, icsContent);
  }

  return (
    <div className="page-card">
      <div className="page-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Lịch học & Thời khóa biểu Sinh viên</h2>
          <p>
            {dataSource === "connector" ? "📦 local-cache (Dữ liệu từ UTH Connector đã lưu SQLite)" :
             dataSource === "db" ? "📦 Dữ liệu từ SQLite Local" :
             "📄 sample-local (Dữ liệu JSON mẫu đóng gói cùng App)"}
          </p>
        </div>
        <button
          className="settings-btn-secondary"
          onClick={handleExportScheduleIcs}
          style={{ fontSize: "12px", gap: "6px" }}
          title="Xuất tệp iCalendar (.ics) để đồng bộ vào Google/Apple Calendar"
        >
          <Calendar size={14} />
          <Download size={13} />
          Xuất Lịch học (.ics)
        </button>
      </div>
      <div className="metric-strip">
        <div><strong>{filtered.length}</strong><span>Buổi học</span></div>
        <div><strong>{roomCount}</strong><span>Phòng học</span></div>
        <div><strong>{new Set(items.map((item) => item.subjectId)).size}</strong><span>Môn học</span></div>
      </div>
      <div className="filter-bar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm môn, phòng hoặc giảng viên..." />
        <select value={weekdayFilter} onChange={(event) => setWeekdayFilter(event.target.value)}>
          <option value="all">Tất cả thứ</option>
          {[2, 3, 4, 5, 6, 7, 8].map((weekday) => (
            <option key={weekday} value={weekday}>{formatWeekday(weekday)}</option>
          ))}
        </select>
        <button onClick={() => { setQuery(""); setWeekdayFilter("all"); }}>Reset</button>
      </div>
      {filtered.length === 0 ? <p className="empty-state">Không có lịch học nào khớp bộ lọc.</p> : <ScheduleTable scheduleItems={filtered} />}
    </div>
  );
}

export function ExamsPage({ exams: propExams }: { exams: ExamRecord[] }) {
  const [items, setItems] = useState<ExamRecord[]>(propExams || []);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<"dateAsc" | "dateDesc">("dateAsc");
  const [dataSource, setDataSource] = useState<"connector" | "db" | "mock">("mock");

  useEffect(() => {
    const { studentCode } = readSchoolProfile();
    // Chạy song song — ưu tiên SQLite connector cache trước propExams/sample JSON
    void Promise.allSettled([
      studentCode ? listConnectorExams(studentCode) : Promise.resolve([] as CanonicalExamEntry[]),
      listExams(),
    ]).then(([connRes, dbRes]) => {
      const connItems = connRes.status === "fulfilled" ? connRes.value : [];
      if (connItems.length > 0) {
        setItems(connItems.map((e) => ({
          id: e.id, subjectId: e.subjectCode, subjectName: e.subjectName,
          semester: 1, examDate: e.examDate, startTime: e.startTime,
          durationMinutes: e.durationMinutes, room: e.room ?? "Chưa xác định",
          format: e.format ?? "Tự luận", note: `Nguồn: ${e.source}`,
        })));
        setDataSource("connector");
        return;
      }
      if (propExams && propExams.length > 0) {
        setItems(propExams);
        setDataSource("db");
        return;
      }
      const dbItems = dbRes.status === "fulfilled" ? dbRes.value : [];
      setItems(dbItems.length > 0 ? dbItems : MOCK_DEFAULT_EXAMS);
      setDataSource(dbItems.length > 0 ? "db" : "mock");
    });
  }, [propExams]);


  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items
      .filter((item) => {
        return (
          !normalizedQuery ||
          item.subjectName.toLowerCase().includes(normalizedQuery) ||
          item.room.toLowerCase().includes(normalizedQuery) ||
          item.format.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((left, right) => {
        const result = left.examDate.localeCompare(right.examDate) || left.startTime.localeCompare(right.startTime);
        return sortMode === "dateAsc" ? result : -result;
      });
  }, [items, query, sortMode]);

  const totalMinutes = items.reduce((total, item) => total + item.durationMinutes, 0);

  function handleExportExamIcs() {
    const profile = readSchoolProfile();
    const icsContent = generateExamIcs(filtered, profile.schoolName);
    downloadIcsFile(`lich-thi-${profile.schoolId || "local"}.ics`, icsContent);
  }

  return (
    <div className="page-card">
      <div className="page-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Lịch thi Học kỳ Sinh viên</h2>
          <p>
            {dataSource === "connector" ? "⚠️ Lịch thi chưa được UTH Connector hỗ trợ chính thức — Đang hiển thị cache/mô phỏng." :
             dataSource === "db" ? "📦 Dữ liệu từ SQLite Local" :
             "📄 sample-local (Dữ liệu JSON mẫu đóng gói cùng App)"}
          </p>
        </div>
        <button
          className="settings-btn-secondary"
          onClick={handleExportExamIcs}
          style={{ fontSize: "12px", gap: "6px" }}
          title="Xuất tệp iCalendar (.ics) để đồng bộ lịch thi vào Google/Apple Calendar"
        >
          <Calendar size={14} />
          <Download size={13} />
          Xuất Lịch thi (.ics)
        </button>
      </div>
      <div className="metric-strip">
        <div><strong>{filtered.length}</strong><span>Ca thi</span></div>
        <div><strong>{new Set(items.map((item) => item.room)).size}</strong><span>Phòng thi</span></div>
        <div><strong>{totalMinutes}</strong><span>Tổng phút thi</span></div>
      </div>
      <div className="filter-bar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm môn, phòng hoặc hình thức..." />
        <select value={sortMode} onChange={(event) => setSortMode(event.target.value as typeof sortMode)}>
          <option value="dateAsc">Ngày tăng dần</option>
          <option value="dateDesc">Ngày giảm dần</option>
        </select>
        <button onClick={() => { setQuery(""); setSortMode("dateAsc"); }}>Reset</button>
      </div>
      {filtered.length === 0 ? <p className="empty-state">Không có lịch thi nào khớp bộ lọc.</p> : <ExamTable examItems={filtered} />}
    </div>
  );
}

export function GpaPage() {
  return (
    <div className="page-card">
      <div className="page-card-header">
        <div>
          <h2>Công cụ Tính điểm GPA / CPA tích lũy Local</h2>
          <p>Tự động lưu dữ liệu GPA/CPA cục bộ trên thiết bị thông qua localStorage. Dữ liệu không được gửi tới máy chủ của nhà phát triển. Tính toán theo cấu hình thang điểm hiện tại của ứng dụng.</p>
        </div>
      </div>
      <GpaCalculator />
    </div>
  );
}
