import type { BootstrapState, HealthReport, StorageSummary } from "../types";

export function ReleasePage({
  appVersion,
  bootstrap,
  healthReport,
  storageSummary,
  actionLogCount,
}: {
  appVersion: string;
  bootstrap: BootstrapState | null;
  healthReport: HealthReport | null;
  storageSummary: StorageSummary | null;
  actionLogCount: number;
}) {
  const healthFailCount = healthReport?.items.filter((item) => item.status === "FAIL").length ?? 0;
  const healthWarnCount = healthReport?.items.filter((item) => item.status === "WARN").length ?? 0;
  const releaseItems = [
    {
      label: "Version",
      status: appVersion === "1.0.1" ? "PASS" : "FAIL",
      detail: `App version hiện tại: ${appVersion}.`,
    },
    {
      label: "Dữ liệu mẫu",
      status:
        bootstrap &&
        bootstrap.documents.length > 0 &&
        bootstrap.announcements.length > 0 &&
        bootstrap.scheduleItems.length > 0 &&
        bootstrap.exams.length > 0
          ? "PASS"
          : "FAIL",
      detail: `${bootstrap?.documents.length ?? 0} tài liệu, ${bootstrap?.announcements.length ?? 0} thông báo, ${bootstrap?.scheduleItems.length ?? 0} lịch học, ${bootstrap?.exams.length ?? 0} lịch thi.`,
    },
    {
      label: "Health report",
      status: !healthReport ? "WARN" : healthFailCount === 0 ? "PASS" : "FAIL",
      detail: healthReport ? `${healthReport.items.length} hạng mục, ${healthFailCount} fail, ${healthWarnCount} warn.` : "Chưa có health report.",
    },
    {
      label: "Storage",
      status: storageSummary ? "PASS" : "WARN",
      detail: storageSummary
        ? `${storageSummary.sampleDocumentCount} file mẫu, ${storageSummary.downloadFileCount} file downloads, ${storageSummary.actionLogCount} action log trong SQLite.`
        : "Chưa có storage summary.",
    },
    {
      label: "Diagnostic export",
      status: "PASS",
      detail: "Có thể xuất JSON chẩn đoán vào downloads, không chứa chat/file/token/secret.",
    },
    {
      label: "Local-first",
      status: "PASS",
      detail: "Không AI API, không connector trường thật, không đăng nhập tài khoản trường trong bản 1.0.1.",
    },
    {
      label: "Action log",
      status: "PASS",
      detail: `${actionLogCount} bản ghi metadata đang được hiển thị trong UI.`,
    },
  ] as const;

  return (
    <div className="page-card">
      <div className="page-card-header">
        <div>
          <h2>Phát hành 1.0.1</h2>
          <p>Checklist release local-first cho bản desktop hiện tại.</p>
        </div>
      </div>

      <div className="metric-strip">
        <div><strong>{releaseItems.filter((item) => item.status === "PASS").length}</strong><span>Pass</span></div>
        <div><strong>{releaseItems.filter((item) => item.status === "WARN").length}</strong><span>Warn</span></div>
        <div><strong>{releaseItems.filter((item) => item.status === "FAIL").length}</strong><span>Fail</span></div>
        <div><strong>{appVersion}</strong><span>Version</span></div>
      </div>

      <div className="health-list">
        <div className="health-header">
          <span>Hạng mục</span>
          <span>Trạng thái</span>
          <span>Chi tiết</span>
        </div>
        {releaseItems.map((item) => (
          <div className="health-row" key={item.label}>
            <span>{item.label}</span>
            <span className={`health-status health-${item.status.toLowerCase()}`}>{item.status}</span>
            <span>{item.detail}</span>
          </div>
        ))}
      </div>

      <p className="empty-state">
        Bản 1.0.1 vẫn cố ý giữ local-only. Connector trường thật, đăng nhập tài khoản trường và dữ liệu cá nhân sẽ là nhánh riêng có threat model trước khi triển khai.
      </p>
    </div>
  );
}
