import type { BootstrapState, HealthReport, StorageSummary } from "./types";

export type ReleaseStatus = "PASS" | "WARN" | "FAIL";

export type ReleaseChecklistItem = {
  label: string;
  status: ReleaseStatus;
  detail: string;
};

type ReleaseChecklistInput = {
  appVersion: string;
  bootstrap: BootstrapState | null;
  healthReport: HealthReport | null;
  storageSummary: StorageSummary | null;
  actionLogCount: number;
};

/**
 * Tạo checklist từ dữ liệu runtime đã có, không suy diễn connector thật.
 * Dữ liệu học tập rỗng là giới hạn local-only nên chỉ cảnh báo, không báo lỗi.
 */
export function buildReleaseChecklist({
  appVersion,
  bootstrap,
  healthReport,
  storageSummary,
  actionLogCount,
}: ReleaseChecklistInput): ReleaseChecklistItem[] {
  const healthFailCount = healthReport?.items.filter((item) => item.status === "FAIL").length ?? 0;
  const healthWarnCount = healthReport?.items.filter((item) => item.status === "WARN").length ?? 0;
  const sampleCounts = `${bootstrap?.documents.length ?? 0} tài liệu, ${bootstrap?.announcements.length ?? 0} thông báo, ${bootstrap?.scheduleItems.length ?? 0} lịch học, ${bootstrap?.exams.length ?? 0} lịch thi.`;

  return [
    {
      label: "Version",
      status: appVersion === "1.0.1" ? "PASS" : "FAIL",
      detail: `App version hiện tại: ${appVersion}.`,
    },
    {
      label: "Nguồn dữ liệu học tập",
      status: "WARN",
      detail: `${sampleCounts} Bản hiện tại local-only; connector trường thật chưa được xác minh.`,
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
      status: "WARN",
      detail: "Cần native smoke test để xác minh xuất JSON vào downloads; không tự báo PASS từ nhãn tĩnh.",
    },
    {
      label: "Local-first",
      status: "WARN",
      detail: "Phạm vi bản 1.0.1 là local-only; connector trường thật và đăng nhập tài khoản trường chưa verified.",
    },
    {
      label: "Action log",
      status: actionLogCount > 0 ? "PASS" : "WARN",
      detail: `${actionLogCount} bản ghi metadata đang được hiển thị trong UI; cần manual smoke nếu chưa có bản ghi.`,
    },
  ];
}
