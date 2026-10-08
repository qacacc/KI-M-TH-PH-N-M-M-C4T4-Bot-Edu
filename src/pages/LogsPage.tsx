import { useMemo, useState } from "react";
import type { ActionLogEntry } from "../types";

export function LogsPage({ logs, onRefresh }: { logs: ActionLogEntry[]; onRefresh: () => void }) {
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState<"all" | "SUCCESS" | "FAILED" | "BLOCKED">("all");
  const [sortMode, setSortMode] = useState<"newest" | "oldest">("newest");
  const logStats = useMemo(
    () => ({
      success: logs.filter((log) => log.result === "SUCCESS").length,
      failed: logs.filter((log) => log.result === "FAILED").length,
      blocked: logs.filter((log) => log.result === "BLOCKED").length,
    }),
    [logs],
  );
  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return logs
      .filter((log) => {
        const matchesResult = resultFilter === "all" || log.result === resultFilter;
        const matchesQuery =
          !normalizedQuery ||
          log.action.toLowerCase().includes(normalizedQuery) ||
          (log.documentId ?? "").toLowerCase().includes(normalizedQuery) ||
          (log.errorCode ?? "").toLowerCase().includes(normalizedQuery);
        return matchesResult && matchesQuery;
      })
      .sort((left, right) => {
        const leftTime = new Date(left.createdAt).getTime();
        const rightTime = new Date(right.createdAt).getTime();
        return sortMode === "newest" ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [logs, query, resultFilter, sortMode]);

  return (
    <div className="page-card">
      <div className="page-card-header">
        <div>
          <h2>Action log metadata</h2>
          <p>Log chỉ chứa metadata thao tác. Không chứa nội dung chat, file, token hoặc secret.</p>
        </div>
        <button onClick={onRefresh}>Làm mới</button>
      </div>
      <div className="metric-strip">
        <div><strong>{logs.length}</strong><span>Tổng log</span></div>
        <div><strong>{logStats.success}</strong><span>Success</span></div>
        <div><strong>{logStats.failed}</strong><span>Failed</span></div>
        <div><strong>{logStats.blocked}</strong><span>Blocked</span></div>
      </div>
      <div className="filter-bar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm action, documentId hoặc errorCode..." />
        <select value={resultFilter} onChange={(event) => setResultFilter(event.target.value as typeof resultFilter)}>
          <option value="all">Tất cả kết quả</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="BLOCKED">BLOCKED</option>
        </select>
        <select value={sortMode} onChange={(event) => setSortMode(event.target.value as typeof sortMode)}>
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
        </select>
        <button onClick={() => { setQuery(""); setResultFilter("all"); setSortMode("newest"); }}>Reset</button>
      </div>
      {filteredLogs.length === 0 ? (
        <p className="empty-state">{logs.length === 0 ? "Chưa có action log. Hãy thử mở hoặc copy một file mẫu trong chat." : "Không có log nào khớp bộ lọc hiện tại."}</p>
      ) : (
        <div className="log-list">
          <div className="log-header">
            <span>Thời gian</span>
            <span>Action</span>
            <span>Document</span>
            <span>Kết quả</span>
            <span>Mã lỗi</span>
          </div>
          {filteredLogs.map((log) => (
            <div className="log-row" key={log.id}>
              <span>{new Date(log.createdAt).toLocaleString()}</span>
              <span>{log.action}</span>
              <span>{log.documentId ?? "-"}</span>
              <span className={log.result === "SUCCESS" ? "result-success" : "result-failed"}>{log.result}</span>
              <span>{log.errorCode ?? "-"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
