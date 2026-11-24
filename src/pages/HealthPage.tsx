import { Activity, Download } from "lucide-react";
import type { HealthReport } from "../types";

export function HealthPage({
  appVersion,
  report,
  onRefresh,
  onExport,
  isBusy,
  isChecking,
  error,
}: {
  appVersion: string;
  report: HealthReport | null;
  onRefresh: () => void;
  onExport: () => void;
  isBusy: boolean;
  isChecking: boolean;
  error: boolean;
}) {
  const isDesktopRuntime = "__TAURI_INTERNALS__" in window;
  const passCount = report?.items.filter((item) => item.status === "PASS").length ?? 0;
  const warnCount = report?.items.filter((item) => item.status === "WARN").length ?? 0;
  const failCount = report?.items.filter((item) => item.status === "FAIL").length ?? 0;

  return (
    <div className="page-card">
      <div className="page-card-header">
        <div>
          <h2>Kiểm tra app local</h2>
          <p>Báo cáo local chỉ xác nhận từng hạng mục được liệt kê, không thay thế kiểm thử toàn bộ ứng dụng.</p>
        </div>
        <div className="button-row">
          <button onClick={onRefresh} disabled={isBusy || isChecking || !isDesktopRuntime}>
            <Activity size={15} />{isChecking ? "Đang kiểm tra…" : "Chạy kiểm tra"}
          </button>
          <button onClick={onExport} disabled={isBusy || isChecking || !report || !isDesktopRuntime}>
            <Download size={16} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {!isDesktopRuntime && (
        <p className="health-notice" role="status">Chỉ bản desktop mới chạy được kiểm tra local. Bản xem trong trình duyệt không có kết quả kiểm tra.</p>
      )}
      {error && (
        <p className="health-notice health-notice-error" role="alert">
          Kiểm tra thất bại. {report ? "Bảng bên dưới là kết quả của lần kiểm tra trước." : "Chưa có kết quả hợp lệ."} Hãy thử lại.
        </p>
      )}

      <div className="metric-strip">
        <div><strong>{report ? passCount : "—"}</strong><span>Đạt điều kiện</span></div>
        <div><strong>{report ? warnCount : "—"}</strong><span>Cảnh báo</span></div>
        <div><strong>{report ? failCount : "—"}</strong><span>Lỗi</span></div>
        <div><strong>{report?.version ?? appVersion}</strong><span>Phiên bản</span></div>
      </div>

      <section className="health-scope" aria-label="Phạm vi kiểm tra">
        <p><strong>Có kiểm tra:</strong> thư mục app, kết nối SQLite, số lượng file mẫu/Downloads, JSON local và cấu hình nguồn cập nhật. Việc kiểm tra có thể tạo thư mục hoặc schema local còn thiếu.</p>
        <p><strong>Không kiểm tra:</strong> phiên Portal/Courses, dữ liệu đã đồng bộ, từng tài liệu, GPA hay mọi thao tác giao diện.</p>
      </section>

      <p className="report-time">
        Thời điểm kiểm tra: {report?.generatedAt ? new Date(report.generatedAt).toLocaleString("vi-VN") : "Chưa chạy"}
      </p>

      {!report ? (
        <p className="empty-state">{isChecking ? "Đang đọc trạng thái local…" : "Chưa có kết quả. Bấm “Chạy kiểm tra” trong bản desktop."}</p>
      ) : (
        <div className="health-list" aria-live="polite">
          <div className="health-header">
            <span>Hạng mục</span>
            <span>Trạng thái</span>
            <span>Chi tiết</span>
          </div>
          {report.items.map((item) => (
            <div className="health-row" key={item.id}>
              <span>{item.label}</span>
              <span className={`health-status health-${item.status.toLowerCase()}`}>{item.status}</span>
              <span>{item.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
