import { Download } from "lucide-react";
import type { HealthReport } from "../types";

export function HealthPage({
  appVersion,
  report,
  onRefresh,
  onExport,
  isBusy,
}: {
  appVersion: string;
  report: HealthReport | null;
  onRefresh: () => void;
  onExport: () => void;
  isBusy: boolean;
}) {
  const passCount = report?.items.filter((item) => item.status === "PASS").length ?? 0;
  const warnCount = report?.items.filter((item) => item.status === "WARN").length ?? 0;
  const failCount = report?.items.filter((item) => item.status === "FAIL").length ?? 0;

  return (
    <div className="page-card">
      <div className="page-card-header">
        <div>
          <h2>Kiểm tra app local</h2>
          <p>Báo cáo sinh từ dữ liệu local. Không gọi mạng và không đọc ngoài vùng CampusAssistant.</p>
        </div>
        <div className="button-row">
          <button onClick={onRefresh} disabled={isBusy}>Chạy lại</button>
          <button onClick={onExport} disabled={isBusy || !report}>
            <Download size={16} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="metric-strip">
        <div><strong>{passCount}</strong><span>Pass</span></div>
        <div><strong>{warnCount}</strong><span>Warn</span></div>
        <div><strong>{failCount}</strong><span>Fail</span></div>
        <div><strong>{report?.version ?? appVersion}</strong><span>Version</span></div>
      </div>

      <p className="report-time">
        Thời điểm kiểm tra: {report?.generatedAt ? new Date(report.generatedAt).toLocaleString() : "Đang khởi tạo"}
      </p>

      {!report ? (
        <p className="empty-state">Đang chờ báo cáo kiểm tra.</p>
      ) : (
        <div className="health-list">
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
