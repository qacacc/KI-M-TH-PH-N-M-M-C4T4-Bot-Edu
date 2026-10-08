import { FolderOpen, Trash } from "lucide-react";
import type { StorageSummary } from "../types";
import { formatBytes } from "../utils/format";

export function StoragePage({
  summary,
  onRefresh,
  onClearLogs,
  onOpenDownloads,
  isBusy,
}: {
  summary: StorageSummary | null;
  onRefresh: () => void;
  onClearLogs: () => void;
  onOpenDownloads: () => void;
  isBusy: boolean;
}) {
  return (
    <div className="page-card">
      <div className="page-card-header">
        <div>
          <h2>Bộ nhớ local</h2>
          <p>Chỉ thống kê vùng CampusAssistant và action log metadata. Không duyệt toàn bộ ổ đĩa.</p>
        </div>
        <button onClick={onRefresh} disabled={isBusy}>Làm mới</button>
      </div>

      <div className="metric-strip">
        <div>
          <strong>{summary?.sampleDocumentCount ?? 0}</strong>
          <span>File mẫu</span>
        </div>
        <div>
          <strong>{formatBytes(summary?.sampleDocumentBytes ?? 0)}</strong>
          <span>Dung lượng file mẫu</span>
        </div>
        <div>
          <strong>{summary?.downloadFileCount ?? 0}</strong>
          <span>File downloads</span>
        </div>
        <div>
          <strong>{formatBytes(summary?.downloadBytes ?? 0)}</strong>
          <span>Dung lượng downloads</span>
        </div>
        <div>
          <strong>{summary?.actionLogCount ?? 0}</strong>
          <span>Action log</span>
        </div>
      </div>

      <dl className="path-list">
        <dt>AppLocalData</dt>
        <dd>{summary?.appLocalData ?? "Đang khởi tạo"}</dd>
        <dt>Managed Workspace</dt>
        <dd>{summary?.managedWorkspace ?? "Đang khởi tạo"}</dd>
        <dt>Downloads</dt>
        <dd>{summary?.downloads ?? "Đang khởi tạo"}</dd>
      </dl>

      <div className="button-row storage-actions">
        <button onClick={onOpenDownloads} disabled={isBusy || !summary}>
          <FolderOpen size={16} />
          Mở downloads
        </button>
        <button onClick={onClearLogs} disabled={isBusy || !summary || summary.actionLogCount === 0}>
          <Trash size={16} />
          Xóa action log
        </button>
      </div>

      <p className="empty-state">
        Vùng này không xóa file tài liệu, không xóa downloads và không đụng dữ liệu ngoài thư mục CampusAssistant.
      </p>
    </div>
  );
}
