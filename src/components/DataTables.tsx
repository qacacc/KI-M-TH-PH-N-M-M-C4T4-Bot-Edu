import { Copy } from "lucide-react";
import type { AnnouncementRecord, DocumentRecord, ExamRecord, ScheduleRecord } from "../types";
import { formatBytes, formatWeekday } from "../utils/format";

export function DocumentTable({
  documents,
  onAction,
}: {
  documents: DocumentRecord[];
  onAction: (document: DocumentRecord, action: "open" | "copy") => void;
}) {
  return (
    <div className="document-list">
      <div className="document-header">
        <span>Số</span>
        <span>Tên file</span>
        <span>Loại</span>
        <span>Kích thước</span>
        <span>Thao tác</span>
      </div>
      {documents.map((document, index) => (
        <div className="document-row" key={document.id}>
          <span className="document-index">{index + 1}</span>
          <span>{document.name}</span>
          <span>{document.type}</span>
          <span>{formatBytes(document.sizeBytes)}</span>
          <span className="row-actions">
            <button onClick={() => onAction(document, "open")}>Mở</button>
            <button onClick={() => onAction(document, "copy")}>
              <Copy size={14} />
              Copy
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

export function AnnouncementTable({ announcements }: { announcements: AnnouncementRecord[]; compact?: boolean }) {
  return (
    <div className="data-table announcement-table">
      <div className="data-table-header">
        <span>Ngày</span>
        <span>Tiêu đề</span>
        <span>Nhóm</span>
        <span>Mức</span>
      </div>
      {announcements.map((item) => (
        <div className="data-table-row" key={item.id}>
          <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
          <span>
            <strong>{item.title}</strong>
            <small>{item.summary}</small>
          </span>
          <span>{item.category}</span>
          <span className={`priority priority-${item.priority}`}>{item.priority}</span>
        </div>
      ))}
    </div>
  );
}

export function ScheduleTable({ scheduleItems }: { scheduleItems: ScheduleRecord[]; compact?: boolean }) {
  return (
    <div className="data-table schedule-table">
      <div className="data-table-header">
        <span>Thứ</span>
        <span>Môn học</span>
        <span>Giờ</span>
        <span>Phòng</span>
        <span>Giảng viên</span>
      </div>
      {scheduleItems.map((item) => (
        <div className="data-table-row" key={item.id}>
          <span>{formatWeekday(item.weekday)}</span>
          <span>
            <strong>{item.subjectName}</strong>
            <small>{item.note}</small>
          </span>
          <span>{item.startTime}-{item.endTime}</span>
          <span>{item.room}</span>
          <span>{item.lecturer}</span>
        </div>
      ))}
    </div>
  );
}

export function ExamTable({ examItems }: { examItems: ExamRecord[]; compact?: boolean }) {
  return (
    <div className="data-table exam-table">
      <div className="data-table-header">
        <span>Ngày</span>
        <span>Môn học</span>
        <span>Giờ</span>
        <span>Phòng</span>
        <span>Hình thức</span>
      </div>
      {examItems.map((item) => (
        <div className="data-table-row" key={item.id}>
          <span>{new Date(item.examDate).toLocaleDateString()}</span>
          <span>
            <strong>{item.subjectName}</strong>
            <small>{item.durationMinutes} phút · {item.note}</small>
          </span>
          <span>{item.startTime}</span>
          <span>{item.room}</span>
          <span>{item.format}</span>
        </div>
      ))}
    </div>
  );
}
