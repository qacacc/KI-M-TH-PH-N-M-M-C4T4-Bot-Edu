import type { BootstrapState, HealthReport, StorageSummary } from "../types";
import { buildReleaseChecklist } from "../releaseChecklist";

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
  const releaseItems = buildReleaseChecklist({
    appVersion,
    bootstrap,
    healthReport,
    storageSummary,
    actionLogCount,
  });

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
